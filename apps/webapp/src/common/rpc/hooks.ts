import { InferInput, InferOutput, RPCContract } from '@ts-hasura-starter/rpc';
import type { ExecuteFn } from './execute';
import {
  useMutation as _useMutation,
  UseMutationOptions,
  useQuery as _useQuery,
  UseQueryOptions,
} from '@tanstack/react-query';

export type PickByValue<T, ValueType> = Pick<
  T,
  { [Key in keyof T]-?: T[Key] extends ValueType ? Key : never }[keyof T]
>;

export type MutationKeys<T extends RPCContract> = keyof PickByValue<T, { type: 'mutation' }>;
export type QueryKeys<T extends RPCContract> = keyof PickByValue<T, { type: 'query' }>;

export function createRPCHooks<TContract extends RPCContract>(executeFn: ExecuteFn<TContract>) {
  function useMutation<T extends keyof TContract>(
    method: T extends MutationKeys<TContract> ? T : never,
    headers: Record<string, any>,
    options?: Omit<UseMutationOptions<InferOutput<TContract[T]>, any, InferOutput<TContract[T]>>, 'mutationFn'>
  ) {
    return _useMutation((input: InferInput<TContract[T]>) => executeFn(method, input, headers), options);
  }

  function useQuery<T extends keyof TContract>(
    method: T extends QueryKeys<TContract> ? T : never,
    input: InferInput<TContract[T]>,
    headers: Record<string, any>,
    options?: Omit<UseQueryOptions<InferOutput<TContract[T]>>, 'queryKey' | 'queryFn'>
  ) {
    const key = [executeFn.url, headers, method, input] as const;
    return _useQuery(key, () => executeFn(method, input, headers), options);
  }

  return {
    useMutation,
    useQuery,
  };
}
