import { ReactNode, createContext, useContext, useEffect, useRef } from 'react';

export interface Event<Name = any, Data = any> {
  event_name: Name;
  data: Data;
}

type HandlerFn<E extends Event> = (event: E) => void;

interface EventsSpecification<TData extends {} = {}> {
  [name: string]: TData;
}

export type EventEmitter<T extends EventsSpecification> = {
  emit: <TKey extends keyof T>(event: TKey, payload: T[TKey]) => void;
  subscribe: <N extends keyof T>(event_name: N, handlerFn: HandlerFn<Event<N, T[N]>>) => () => void;
  unsubscribe: <N extends keyof T>(event_name: N, handlerFn: HandlerFn<Event<N, T[N]>>) => void;
};

/**
 * Typesafe event emitter implementation
 */
function createEventEmitter<T extends EventsSpecification>(): EventEmitter<T> {
  const subscribersMap = new Map<keyof T, Set<HandlerFn<Event<any, any>>>>();

  function dispatch<TKey extends keyof T>(event: TKey, payload: T[TKey]) {
    const subscribersForEvent = subscribersMap.get(event);

    subscribersForEvent?.forEach((handler) => handler({ data: payload, event_name: event }));
  }

  function subscribe<N extends keyof T>(event_name: N, handlerFn: HandlerFn<Event<N, T[N]>>) {
    const subscribersForEvent: Set<HandlerFn<Event<N, T[N]>>> = subscribersMap.get(event_name) ?? new Set();

    subscribersForEvent.add(handlerFn);
    subscribersMap.set(event_name, subscribersForEvent);

    return () => unsubscribe(event_name, handlerFn);
  }

  function unsubscribe<N extends keyof T>(event_name: N, handlerFn: HandlerFn<Event<N, T[N]>>) {
    const subscribersForEvent = subscribersMap.get(event_name);
    if (!subscribersForEvent) {
      return;
    }

    // subscribersForEvent.splice(subscribersForEvent.indexOf(handlerFn));
    subscribersForEvent.delete(handlerFn);

    if (subscribersForEvent.size === 0) {
      subscribersMap.delete(event_name);
    }
  }

  return {
    emit: dispatch,
    subscribe,
    unsubscribe,
  };
}

export function createEmitterContext<T extends EventsSpecification>() {
  const Ctx = createContext<null | EventEmitter<T>>(null);
  Ctx.displayName = 'EventEmitter';

  const useEEContext = () => {
    const ctx = useContext(Ctx);
    if (!ctx) {
      throw new Error('not inside Emitter Provider');
    }

    return ctx;
  };

  function useEmit() {
    return useEEContext().emit;
  }

  function useOn<N extends keyof T>(event_name: N, handlerFn: HandlerFn<Event<N, T[N]>>) {
    const ee = useEEContext();
    useEffect(() => {
      const handle: HandlerFn<Event<N, T[N]>> = (evt) => {
        handlerFn(evt);
      };
      return ee.subscribe(event_name, handle);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [event_name, ee]);
  }

  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const r = useRef(createEventEmitter<T>());
    return <Ctx.Provider value={r.current}>{children}</Ctx.Provider>;
  };

  return {
    Provider: Provider,
    useEmit,
    useOn,
  };
}
