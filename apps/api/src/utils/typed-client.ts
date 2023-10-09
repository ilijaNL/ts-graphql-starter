import { AppRoute, AppRouteMutation, AppRoutes } from 'typed-client';

export type FastifyAppRoute<TAppRoute extends AppRoute> = {
  method: TAppRoute['method'];
  url: string;
  schema: {
    body: TAppRoute extends AppRouteMutation ? TAppRoute['body'] : undefined;
    // params: TAppRoute extends { params: TSchema } ? TAppRoute['params'] : undefined;
    querystring?: TAppRoute['query'];
    response: {
      '2xx': TAppRoute['responses']['success'];
    } & (undefined extends TAppRoute['responses']['error'] ? {} : { '4xx': TAppRoute['responses']['error'] });
  };
};

export type RouteMapper<TRoutes extends AppRoutes> = {
  [K in keyof TRoutes]: (config: FastifyAppRoute<TRoutes[K]>, appRoute: TRoutes[K]) => void | Promise<void>;
};

export const registerRoutes = <TRoutes extends AppRoutes>(
  contract: TRoutes,
  mapper: RouteMapper<TRoutes>
): Promise<void> => {
  async function run() {
    const functions = (Object.keys(contract) as Array<keyof TRoutes>).map((key) => {
      const fn = mapper[key];
      const appRoute = contract[key];

      return fn(getRouteConfig(appRoute), appRoute);
    });

    await Promise.all(functions);
  }

  return run();
};

export const getRouteConfig = <TAppRoute extends AppRoute>(appRoute: TAppRoute): FastifyAppRoute<TAppRoute> => {
  const result = {
    method: appRoute.method,
    url: ('/' + appRoute.path).replace('//', '/'),
    schema: {
      response: {
        '2xx': appRoute.responses.success,
        ...(appRoute.responses.error ? { ['4xx']: appRoute.responses.error } : {}),
      },
      ...((appRoute as any)['body'] ? { body: (appRoute as any)['body'] } : {}),
      ...(appRoute.query ? { querystring: appRoute.query } : {}),
    },
  };

  return result as FastifyAppRoute<TAppRoute>;
};
