import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';

type InferSerializerType<T extends Serializer | string> = T extends string
  ? T
  : T extends Serializer<infer U>
  ? U
  : never;

export type State<T extends Record<string, string | Serializer>> = {
  [K in keyof T]: InferSerializerType<T[K]>;
};

export function getInitialState<T extends Record<string, string | Serializer<any>>>(
  config: T,
  routerQuery: Record<keyof T, string>
): State<T> {
  return (Object.keys(config) as Array<keyof T>).reduce((agg, key) => {
    // need to cast this to make ts happy
    const serializerOrDefaultValue = config[key];

    if (serializerOrDefaultValue === null || serializerOrDefaultValue === undefined) {
      throw new Error('Should always be defined');
    }

    const urlParam = routerQuery[key];

    if (typeof urlParam === 'string') {
      agg[key] = (
        typeof serializerOrDefaultValue === 'string' ? urlParam : serializerOrDefaultValue.parse(urlParam)
      ) as State<T>[keyof T];
    } else
      agg[key] = (
        typeof serializerOrDefaultValue === 'string' ? serializerOrDefaultValue : serializerOrDefaultValue.defaultValue
      ) as State<T>[keyof T];

    return agg;
  }, {} as State<T>);
}

export const createSerializer = <T>(
  defaultValue: T,
  props: {
    stringify: (value: T) => string;
    parse: (value: string) => T;
  }
): Serializer<T> => {
  return {
    defaultValue: defaultValue,
    parse: props.parse,
    stringify: props.stringify,
  };
};

export type Serializer<T = any> = {
  defaultValue: T;
  parse: (value: string) => T;
  stringify: (value: T) => string;
};

export const createNumberSerializer = (defaultValue: number) =>
  createSerializer(defaultValue, {
    parse(value) {
      if (value === null || value === undefined) {
        return 0;
      }

      return +value;
    },
    stringify(value) {
      return value.toString();
    },
  });

function setParam(key: string, params: URLSearchParams, newValue: string, defaultValue: string) {
  if (newValue !== defaultValue) {
    params.set(key, newValue);
  }
}

export const createBooleanSerializer = (defaultValue: boolean) =>
  createSerializer(defaultValue, {
    parse(value) {
      return value === '1';
    },
    stringify(value) {
      if (value === true) {
        return '1';
      }

      return '0';
    },
  });
/**
 * Creates a state which is synced with the URL params.
 * The initial state is derived from the URL search params + fallbackstate
 */
export const useURLState = <T extends Record<string, string | Serializer<any>>>(config: T) => {
  const router = useRouter();
  const [state, _setState] = useState<State<T>>(getInitialState(config, router.query as Record<keyof T, string>));

  const updateState = useCallback(
    (partialState: Partial<State<T>>) => {
      _setState((prev) => ({
        ...prev,
        ...partialState,
      }));
    },
    [_setState]
  );

  // todo debounce the router.replace
  useEffect(() => {
    // asPath includes the query string, we need to extract it
    const match = router.asPath.match(/[^?#]+/u);
    const pathname = match ? match[0] : router.asPath;
    const hash = window.location.hash;

    const searchParams = Object.entries(state).reduce((agg, [key, value]) => {
      const serializerOrDefaultValue = config[key];

      if (serializerOrDefaultValue === null || serializerOrDefaultValue === undefined) {
        throw new Error('Should always be defined');
      }

      if (typeof serializerOrDefaultValue === 'string') {
        setParam(key, agg, value as string, serializerOrDefaultValue);
      } else {
        const _v = serializerOrDefaultValue.stringify(value);
        setParam(key, agg, _v, serializerOrDefaultValue.stringify(serializerOrDefaultValue.defaultValue));
      }

      return agg;
    }, new URLSearchParams());

    const newSearch = searchParams.toString();
    const hasChanged = new URL(window.location.href).searchParams.toString() !== newSearch;

    if (hasChanged) {
      void router.replace(
        { pathname: pathname, search: newSearch, hash: hash },
        { pathname: pathname, search: newSearch, hash: hash },
        { shallow: true, scroll: false }
      );
    }
    // dont add router to deps arr
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return [state, updateState] as const;
};
