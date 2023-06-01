import { InferInput, InferOutput, RPCContract } from '@ts-hasura-starter/rpc';

export type ExecuteFn<TContract extends RPCContract> = (<T extends keyof TContract>(
  method: T,
  payload: InferInput<TContract[T]>,
  headers: Record<string, any>
) => Promise<InferOutput<TContract[T]>>) & { url: string };

export function createRPCExecute<TContract extends RPCContract>(
  _contract: TContract,
  url: string
): ExecuteFn<TContract> {
  async function execute<T extends keyof TContract>(
    method: T,
    payload: InferInput<TContract[T]>,
    headers: Record<string, any>
  ): Promise<InferOutput<TContract[T]>> {
    let request: Promise<Response>;
    // validate request

    const fetchUrl = new URL(method as string, url + '/');

    const def: TContract[T] = _contract[method];

    if (def.type === 'mutation') {
      request = fetch(fetchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(payload ?? {}),
      });
    } else {
      Object.entries(payload ?? {}).forEach(([key, value]) => {
        fetchUrl.searchParams.set(key, value as string);
      });

      request = fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      });
    }

    const response = await request;

    if (response.status >= 400) {
      throw new Error(response.statusText);
    }

    return response.json();
  }

  execute.url = url;

  return execute;
}
