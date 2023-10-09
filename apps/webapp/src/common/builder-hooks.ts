import { ClientProcedure, InferError as _InferError, InferResult as _InferResult } from 'typed-client';
import {
  useMutation as _useMutation,
  UseMutationOptions,
  useQuery as _useQuery,
  UseQueryOptions,
  MutationFunction,
} from '@tanstack/react-query';

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type InferInput<T extends ClientProcedure<any, any>> = Prettify<Parameters<T>[0]>;

export type InferResult<T extends ClientProcedure<any, any>> = T extends ClientProcedure<infer I, any>
  ? _InferResult<I>
  : unknown;

export type InferError<T extends ClientProcedure<any, any>> = T extends ClientProcedure<infer I, any>
  ? _InferError<I>
  : unknown;

export const useClientMutation = <T extends ClientProcedure<any, any>>(
  clientProcedure: T,
  opts?: UseMutationOptions<InferResult<T>, InferError<T>, InferInput<T>>
) => {
  const mutationFn: MutationFunction<InferResult<T>, InferInput<T>> = (input) =>
    clientProcedure(input).then((d) => {
      if (d.ok) {
        return d.data;
      }

      throw d.error;
    });
  return _useMutation(mutationFn, opts);
};

export const useClientQuery = <T extends ClientProcedure<any, any>>(
  procedure: T,
  input: InferInput<T>,
  options?: Omit<UseQueryOptions<InferResult<T>>, 'queryKey' | 'queryFn'>
) => {
  const key = [procedure.clientPath, input] as const;
  return _useQuery(
    key,
    () =>
      procedure(input).then((d) => {
        if (d.ok) {
          return d.data;
        }

        throw d.error;
      }),
    options
  );
};
