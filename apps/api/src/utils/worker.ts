import delay from 'delay';

export type Worker = {
  notify: () => void;
  start: () => void;
  stop: () => Promise<void>;
};

export const resolveWithinSeconds = async (promise: Promise<any>, seconds: number) => {
  const timeout = Math.max(1, seconds) * 1000;
  const timeoutReject = delay.reject(timeout, { value: new Error(`handler execution exceeded ${timeout}ms`) });

  let result;

  try {
    result = await Promise.race([promise, timeoutReject]);
  } finally {
    try {
      timeoutReject.clear();
    } catch {}
  }

  return result;
};

type ShouldContinue = boolean;

export function createBaseWorker(run: () => Promise<ShouldContinue>, props: { loopInterval: number }): Worker {
  const { loopInterval } = props;
  let loopPromise: Promise<any>;
  let loopDelayPromise: delay.ClearablePromise<void> | null = null;
  let running = false;

  async function loop() {
    while (running) {
      const started = Date.now();
      const shouldContinue = await run();
      const duration = Date.now() - started;

      if (!shouldContinue && duration < loopInterval && running) {
        loopDelayPromise = delay(loopInterval - duration);
        await loopDelayPromise;
      }
    }
  }

  function notify() {
    if (loopDelayPromise) {
      loopDelayPromise.clear();
    }
  }

  function start() {
    if (running) {
      return;
    }
    running = true;
    loopPromise = loop();
  }

  async function stop() {
    if (!running) {
      return;
    }

    // fix for clear bug
    setImmediate(() => loopDelayPromise?.clear());

    running = false;
    await loopPromise;
  }

  return {
    start,
    notify,
    stop,
  };
}

/**
 * Creates a worker
 *
 * @param props
 * @returns
 */
export function createWorker<T extends { id: string }>(props: {
  fetchSize: number;
  maxConcurrency: number;
  fetch: (props: { amount: number }) => Promise<Array<T>>;
  handler: (event: T) => Promise<any>;
  resolveJob(job: T, err: any, result?: any): void;
  poolInternvalInMs: number;
}): Worker {
  const { handler, maxConcurrency, poolInternvalInMs, fetch, fetchSize, resolveJob } = props;

  const activeJobs = new Map<string, Promise<any>>();

  async function run(): Promise<ShouldContinue> {
    if (activeJobs.size >= maxConcurrency) {
      return false;
    }

    const fetchAmount = Math.min(maxConcurrency - activeJobs.size, fetchSize);
    const newJobs = await fetch({ amount: fetchAmount });

    if (!newJobs || newJobs.length === 0) {
      return false;
    }

    // run jobs
    newJobs.forEach((job) => {
      const jobPromise = handler(job)
        .then((result) => {
          activeJobs.delete(job.id);
          resolveJob(job, null, result);
        })
        .catch((err) => {
          activeJobs.delete(job.id);
          resolveJob(job, err);
        });

      activeJobs.set(job.id, jobPromise);
    });

    // should conintue if we have more jobs left and max concurrency is not reached
    return fetchSize === newJobs.length && activeJobs.size < maxConcurrency;
  }

  const worker = createBaseWorker(run, {
    loopInterval: poolInternvalInMs,
  });

  return {
    start: worker.start,
    notify: worker.notify,
    stop: async () => {
      await worker.stop();
      await Promise.all(Array.from(activeJobs.values()));
    },
  };
}
