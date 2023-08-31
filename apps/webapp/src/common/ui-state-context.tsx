import React, { createContext, useContext, useRef, useSyncExternalStore } from 'react';

type SetStateAction<S> = Partial<S> | ((prevState: Readonly<S>) => Partial<S>);
type Dispatch<A> = (value: A) => void;

type ReactiveStore<T> = {
  get: () => Readonly<T>;
  set: Dispatch<SetStateAction<T>>;
  subscribe: (callback: () => void) => () => void;
};

/**
 * Create a reactive store
 */
export const createStateStore = <T extends Record<string, any>>(initialState: T): ReactiveStore<T> => {
  let _state = initialState;
  const subscriptions = new Set<() => void>();

  function set(value: SetStateAction<T>) {
    const newPartialState = typeof value === 'function' ? value(_state) : value;

    _state = {
      ..._state,
      ...newPartialState,
    };
    subscriptions.forEach((callback) => callback());
  }

  function get() {
    return Object.freeze(_state);
  }

  function subscribe(callback: () => void) {
    subscriptions.add(callback);
    return () => subscriptions.delete(callback);
  }

  return {
    set,
    get,
    subscribe,
  };
};

/**
 * Creates a UI context which uses selectors to only select part of the state.
 * This ensures that only changes to the selected state rerenders the component.
 * ```ts
 * // Create context
 * const { Provider, useStore } = createUIContext()
 *
 * // select part of the store
 * const [value, setValue] = useStore((s) => s.a)
 *
 * // change store value
 * const [_, setValue] = useStore((s) => s.a)
 * setValue({ b: 'aaa' })
 * ```
 */
export default function createUIStateContext<State extends Record<string, any>>() {
  const StoreContext = createContext<ReactiveStore<State> | null>(null);

  function Provider({ children, initialState }: { children: React.ReactNode; initialState: State }) {
    const store = useRef(createStateStore(initialState));
    return <StoreContext.Provider value={store.current}>{children}</StoreContext.Provider>;
  }

  function useStore<SelectorOutput>(
    selector: (store: Readonly<State>) => SelectorOutput
  ): [Readonly<SelectorOutput>, Dispatch<SetStateAction<State>>] {
    const store = useContext(StoreContext);
    if (!store) {
      throw new Error('Not inside UI Context Provider');
    }

    const state = useSyncExternalStore(
      store.subscribe,
      () => selector(store.get()),
      () => selector(store.get())
    );

    return [state, store.set];
  }

  return {
    Provider,
    useStore,
  };
}
