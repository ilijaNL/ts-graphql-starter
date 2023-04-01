export type Result<T = unknown, E extends Error = Error> = T | E;

export function isError<T>(value: T): value is T & Error {
  return value instanceof Error;
}
/**
 * Convert to a promise to a promise result, catching the error
 * This is useful if you want to explicit check for errors. Use `isError` function to narrow the type
 * @param promise
 * @returns
 */
export async function toResult<TResult, TError extends Error = Error>(
  promise: Promise<TResult>
): Promise<Result<TResult, TError>> {
  let result: TResult;
  try {
    result = await promise;
  } catch (e: unknown) {
    return e as TError;
  }

  return result;
}
