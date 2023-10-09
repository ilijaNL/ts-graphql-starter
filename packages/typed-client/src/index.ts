import { Static, TSchema } from '@sinclair/typebox';
export * from '@sinclair/typebox';

type AppRouteCommon = {
  path: Path;
  query?: TSchema;
  headers?: TSchema;
  responses: {
    success: TSchema;
    error?: TSchema;
  };
};

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * A query endpoint. In REST terms, one using GET.
 */
export type AppRouteQuery = AppRouteCommon & {
  method: 'GET';
};

/**
 * A mutation endpoint. In REST terms, one using POST, PUT,
 * PATCH, or DELETE.
 */
export type AppRouteMutation = AppRouteCommon & {
  method: 'POST' | 'DELETE' | 'PUT' | 'PATCH';
  body?: TSchema;
};

export type AppRoute = AppRouteQuery | AppRouteMutation;

type ClientBuilderRoutes = {
  [name: string]: ParamRoute<any, any> | ClientBuilder<any, any>;
};

/**
 * @params T - The URL e.g. /posts/:id
 * @params TAcc - Accumulator object
 */
type RecursivelyExtractPathParams<
  T extends string,
  TAcc extends null | Record<string, string>
> = T extends `/:${infer PathParam}/${infer Right}`
  ? { [key in PathParam]: string } & RecursivelyExtractPathParams<Right, TAcc>
  : T extends `/:${infer PathParam}`
  ? { [key in PathParam]: string }
  : T extends `/${string}/${infer Right}`
  ? RecursivelyExtractPathParams<Right, TAcc>
  : T extends `/${string}`
  ? TAcc
  : T extends `:${infer PathParam}/${infer Right}`
  ? { [key in PathParam]: string } & RecursivelyExtractPathParams<Right, TAcc>
  : T extends `:${infer PathParam}`
  ? TAcc & { [key in PathParam]: string }
  : T extends `${string}/${infer Right}`
  ? RecursivelyExtractPathParams<Right, TAcc>
  : TAcc;
/**
 * Extract path params from path function
 *
 * `{ id: string, commentId: string }`
 *
 * @params T - The URL e.g. /posts/:id
 */
export type ParamsFromUrl<T extends string> = RecursivelyExtractPathParams<T, {}> extends infer U
  ? {
      [key in keyof U]: U[key];
    }
  : never;

export type MakeStaticRoute<T extends AppRoute> = {
  [K in keyof T]: T[K];
};

export type AppRoutes = {
  [key: string]: AppRoute;
};

export const defineRoute = <T extends AppRoute>(routeConfig: MakeStaticRoute<T>): T => {
  return routeConfig;
};

type InferErrorResponse<T extends TSchema | undefined> = T extends TSchema ? Static<T> : unknown;

export type ClientResponse<T extends AppRoute> =
  | { ok: true; headers: Record<string, any>; data: InferResult<T> }
  | { ok: false; headers: Record<string, any>; error: InferError<T> };

type ExcludeKeysWithTypeOf<T, V> = {
  [K in keyof T]-?: Exclude<T[K], undefined> extends V ? never : K;
}[keyof T];

export type Without<T, V> = Pick<T, ExcludeKeysWithTypeOf<T, V>>;

type ClientProcProps<Body = undefined, Query = undefined, Params = undefined, Headers = undefined, Ctx = unknown> = {
  body: Body;
  query: Query;
  params: Params;
  headers: Headers;
  ctx?: Ctx;
};

export type InferBody<T extends AppRoute> = T extends { body: TSchema } ? Static<T['body']> : undefined;
export type InferQuery<T extends AppRoute> = T extends { query: TSchema } ? Static<T['query']> : undefined;
export type InferHeaders<T extends AppRoute> = T extends { headers: TSchema } ? Static<T['headers']> : undefined;

export type InferResult<T extends AppRoute> = Static<T['responses']['success']>;
export type InferError<T extends AppRoute> = InferErrorResponse<T['responses']['error']>;

type InferClientProcProps<TAppRoute extends AppRoute, Params> = ClientProcProps<
  InferBody<TAppRoute>,
  InferQuery<TAppRoute>,
  {} extends Params ? undefined : Params,
  InferHeaders<TAppRoute>,
  unknown
>;

type _ClientProcedure<TAppRoute extends AppRoute, Params> = ((
  props: InferClientProcProps<TAppRoute, Params>
) => Promise<ClientResponse<TAppRoute>>) & {
  clientPath?: string;
  route?: TAppRoute;
};

export type ClientProcedure<TAppRoute extends AppRoute, Params> = ((
  props: Prettify<Without<InferClientProcProps<TAppRoute, Params>, undefined>>
) => Promise<ClientResponse<TAppRoute>>) & {
  clientPath: string;
  route: TAppRoute;
};

type Path = string;

export type ParamRoute<TAppRoute extends AppRoute, Params> = {
  route: TAppRoute;
  params: Params;
};

/**
 * @param path - The URL e.g. /posts/:id
 * @param params - The params e.g. `{ id: string }`
 * @returns - The URL with the params e.g. /posts/123
 */
export const insertParamsIntoPath = <T extends string>({ path, params }: { path: T; params: ParamsFromUrl<T> }) => {
  return path
    .replace(/:([^/]+)/g, (_, p) => {
      return (params as any)[p] || '';
    })
    .replace(/\/\//g, '/');
};

export type FetchFnProps<Params = unknown, Body = unknown, Query = unknown, TAppRoute extends AppRoute = AppRoute> = {
  body: Body;
  query: Query;
  params: Params;
  headers: Record<string, string>;
  ctx?: unknown;
  path: string;
  appRoute: TAppRoute;
  parsedBody: string | undefined;
  origin: string;
  url: string;
};

export type FetchFnResult = {
  status: number;
  body: unknown;
  headers: Record<string, any>;
};

export type FetchFn = (props: FetchFnProps) => Promise<FetchFnResult>;

type OverrideFetchFn<T extends AppRoute, Params> = (
  props: Prettify<FetchFnProps<Params, InferBody<T>, InferQuery<T>>>,
  parentFetch: FetchFn
) => ReturnType<FetchFn>;

export type ClientBuilder<BuilderRoutes extends ClientBuilderRoutes, Params> = {
  // add single route
  addRoute<TName extends string, Route extends AppRoute>(
    name: TName,
    route: Route,
    props?: {
      fetchFn?: OverrideFetchFn<Route, Params & ParamsFromUrl<Route['path']>>;
    }
  ): ClientBuilder<BuilderRoutes & { [n in TName]: ParamRoute<Route, Params & ParamsFromUrl<Route['path']>> }, Params>;
  addRoutes<TRoutes extends AppRoutes>(
    routes: TRoutes
  ): ClientBuilder<
    BuilderRoutes & {
      [R in keyof TRoutes]: ParamRoute<TRoutes[R], Params & ParamsFromUrl<TRoutes[R]['path']>>;
    },
    Params
  >;
  //
  register<TName extends string, TPath extends Path, TBuilder extends ClientBuilder<any, any>>(
    name: TName,
    prefix: TPath,
    props: {
      build: (client: ClientBuilder<{}, ParamsFromUrl<TPath> & Params>) => TBuilder;
      fetchFn?: (
        props: FetchFnProps<Prettify<ParamsFromUrl<TPath> & Params>>,
        parentFetch: FetchFn
      ) => ReturnType<FetchFn>;
    }
  ): ClientBuilder<BuilderRoutes & { [n in TName]: TBuilder }, Params>;
  build(): Client<BuilderRoutes>;
};

export const _createBuilder = <BasePath extends Path, BuilderRoutes extends ClientBuilderRoutes = {}>(props: {
  origin: string;
  basePath: BasePath;
  fetchFn: FetchFn;
}): ClientBuilder<BuilderRoutes, ParamsFromUrl<BasePath>> => {
  const { basePath, fetchFn, origin } = props;

  const routes = {} as BuilderRoutes;
  const routesConfig = new WeakMap<
    ParamRoute<any, any>,
    {
      path: string;
      fetchFn: FetchFn;
    }
  >();

  return {
    addRoutes<TRoutes extends AppRoutes>(routes: TRoutes) {
      Object.keys(routes).forEach((key: keyof TRoutes) => {
        this.addRoute(key as string, routes[key], {});
      });

      return this as ClientBuilder<
        BuilderRoutes & {
          [R in keyof TRoutes]: ParamRoute<TRoutes[R], ParamsFromUrl<BasePath> & ParamsFromUrl<TRoutes[R]['path']>>;
        },
        ParamsFromUrl<BasePath>
      >;
    },
    addRoute<TName extends string, Route extends AppRoute>(
      name: TName,
      route: Route,
      props?: {
        fetchFn?: OverrideFetchFn<any, any>;
      }
    ) {
      const { fetchFn: overrideFetch } = props ?? {};

      const _fetchFn: FetchFn = overrideFetch
        ? async function fetch(props) {
            return overrideFetch(props, fetchFn);
          }
        : fetchFn;

      const paramRoute: ParamRoute<Route, ParamsFromUrl<BasePath> & ParamsFromUrl<Route['path']>> = {
        route: route,
        params: {} as ParamsFromUrl<BasePath> & ParamsFromUrl<Route['path']>,
      };

      const routePath = (basePath + '/' + route.path).replace(/\/+/g, '/');

      routesConfig.set(paramRoute, { path: routePath, fetchFn: _fetchFn });

      (routes as any)[name] = paramRoute;

      return this as ClientBuilder<
        BuilderRoutes & { [n in TName]: ParamRoute<Route, ParamsFromUrl<BasePath> & ParamsFromUrl<Route['path']>> },
        ParamsFromUrl<BasePath>
      >;
    },
    register<TName extends string, TPath extends Path, TBuilder extends ClientBuilder<any, any>>(
      name: TName,
      path: TPath,
      props: {
        build: (client: ClientBuilder<{}, ParamsFromUrl<TPath> & ParamsFromUrl<BasePath>>) => TBuilder;
        fetchFn?: (props: FetchFnProps, parentFetch: FetchFn) => ReturnType<FetchFn>;
      }
    ) {
      const { build: builder, fetchFn: overrideFetch } = props;

      const _fetchFn: FetchFn = overrideFetch
        ? async function fetch(props) {
            return overrideFetch(props, fetchFn);
          }
        : fetchFn;

      const newBuilder = _createBuilder({
        basePath: (basePath + '/' + path).replaceAll('//', '/'),
        origin: origin,
        fetchFn: _fetchFn,
      }) as ClientBuilder<{}, ParamsFromUrl<TPath> & ParamsFromUrl<BasePath>>;
      (routes as any)[name] = builder(newBuilder);

      return this as ClientBuilder<BuilderRoutes & { [n in TName]: TBuilder }, ParamsFromUrl<BasePath>>;
    },
    build() {
      // traverse the tree and create functions
      const client = (Object.keys(routes) as Array<keyof BuilderRoutes>).reduce((agg, curr) => {
        const item = routes[curr] as ParamRoute<AppRoute, any> | ClientBuilder<any, any>;

        // is paramroute
        if ('route' in item) {
          const paramRoute = item;
          const config = routesConfig.get(paramRoute)!;

          const procedure: _ClientProcedure<AppRoute, any> = async function execute(clientProps) {
            const combinedHeaders = {
              ...normalizeHeaders(clientProps.headers ?? {}),
            } as Record<string, string>;

            // Remove any headers that are set to undefined
            Object.keys(combinedHeaders).forEach((key) => {
              if (combinedHeaders[key] === undefined) {
                delete combinedHeaders[key];
              }
            });

            const includeContentTypeHeader =
              paramRoute.route.method !== 'GET' && clientProps.body !== null && clientProps.body !== undefined;

            const finalHeaders = {
              ...(includeContentTypeHeader && { 'content-type': 'application/json' }),
              ...combinedHeaders,
            };

            const path = insertParamsIntoPath({
              params: clientProps.params ?? {},
              path: config.path,
            });

            const url = new URL(origin);
            url.pathname = path;
            const queries: Record<string, string> = clientProps.query ?? {};

            Object.keys(queries).forEach((queryKey) => {
              const value = queries[queryKey];
              if (value) {
                url.searchParams.set(queryKey, value);
              }
            });

            const result = await config.fetchFn({
              parsedBody:
                clientProps.body !== null && clientProps.body !== undefined
                  ? JSON.stringify(clientProps.body)
                  : undefined,
              ctx: clientProps.ctx,
              origin: origin,
              url: url.toString(),
              body: clientProps.body,
              appRoute: paramRoute.route,
              headers: finalHeaders,
              query: clientProps.query,
              params: clientProps.params,
              path: path,
            });

            // good result
            if (String(result.status).startsWith('2') || String(result.status).startsWith('3')) {
              const response: ClientResponse<AppRoute> & { ok: true } = {
                ok: true,
                headers: result.headers,
                data: result.body,
              };

              return response;
            }

            if (String(result.status).startsWith('4')) {
              const errorResponse: ClientResponse<AppRoute> & { ok: false } = {
                ok: false,
                headers: result.headers,
                error: result.body,
              };
              return errorResponse;
            }

            throw result;
          };

          procedure.clientPath = config.path;
          procedure.route = paramRoute['route'];

          (agg as any)[curr] = procedure;
        }

        // is builder
        if ('build' in item) {
          const builder = item as ClientBuilder<BuilderRoutes, ParamsFromUrl<BasePath>>;
          (agg as any)[curr] = builder.build();
        }

        return agg;
      }, {} as Client<BuilderRoutes>);

      return client;
    },
  };
};

const normalizeHeaders = (headers: Record<string, string | undefined>) => {
  return Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
};

const defaultFetch: FetchFn = async ({ headers, appRoute: route, url, parsedBody }) => {
  const result = await fetch(url, {
    method: route.method,
    headers: headers,
    body: parsedBody,
  });

  return processReponse(result);
};

export const processReponse = async (result: Response): Promise<FetchFnResult> => {
  const contentType = result.headers.get('content-type');

  if (contentType?.includes('application/') && contentType?.includes('json')) {
    const jsonData = await result.json();
    const statusCode = result.status;

    return {
      status: statusCode,
      body: jsonData,
      headers: result.headers,
    };
  }

  if (contentType?.includes('text/plain')) {
    return {
      status: result.status,
      body: await result.text(),
      headers: result.headers,
    };
  }

  return {
    status: result.status,
    body: await result.blob(),
    headers: result.headers,
  };
};

export const createClient = <BasePath extends string>(props: {
  origin: string;
  basePath: BasePath;
  fetchFn?: FetchFn;
}) =>
  _createBuilder<BasePath>({
    //
    basePath: props.basePath,
    fetchFn: props.fetchFn ?? defaultFetch,
    origin: props.origin,
  });

export type Client<BuilderRoutes extends ClientBuilderRoutes> = Prettify<{
  [P in keyof BuilderRoutes]: BuilderRoutes[P] extends ParamRoute<any, any>
    ? ClientProcedure<BuilderRoutes[P]['route'], BuilderRoutes[P]['params']>
    : BuilderRoutes[P] extends ClientBuilder<infer I, any>
    ? Client<I>
    : never;
}>;
