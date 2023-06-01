import {
  QueryObserverLoadingErrorResult,
  QueryObserverRefetchErrorResult,
  QueryObserverSuccessResult,
  UseQueryResult,
} from '@tanstack/react-query';

type QueryComponentProps<TData, TError = unknown> = {
  queryResult: UseQueryResult<TData, TError>;
  successRender: (result: QueryObserverSuccessResult<TData, TError>) => React.ReactElement;
  errorRender: (
    error: QueryObserverLoadingErrorResult<TData, TError> | QueryObserverRefetchErrorResult<TData, TError>
  ) => React.ReactElement;
  loadingRender: () => React.ReactElement;
};

const QueryRenderer = <TData, TError = unknown>(props: QueryComponentProps<TData, TError>) => {
  const query = props.queryResult;

  if (query.status === 'success') {
    return props.successRender(query);
  }

  if (query.status === 'loading') {
    return props.loadingRender();
  }

  if (query.status === 'error') {
    return props.errorRender(query);
  }

  return props.loadingRender();
};

export default QueryRenderer;
