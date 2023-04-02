import { createCache, Cache } from 'async-cache-dedupe';
import stableJson from 'safe-stable-stringify';
import createHttpError from 'http-errors';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import {
  DocumentNode,
  getOperationAST,
  OperationTypeNode,
  parse,
  validate,
  getIntrospectionQuery,
  GraphQLError,
  buildClientSchema,
  visit,
  print,
} from 'graphql';
import undici, { Pool } from 'undici';
import G_ENV from './env';

export type ProxyRequestProps = {
  // used for the key
  hash: string;
  query: string;
  variables?: Record<string, unknown>;
  headers: Record<string, any>;
};

export type ProxyResponse = { response: any; headers: Record<string, any> };

export type HasuraProxyOptions = {
  /**
   * TTL cache in seconds
   */
  cacheTTL: number;
  /**
   * Calculate the hash
   */
  cacheKeySerialize: (props: ProxyRequestProps) => string;
  /**
   * Undici options for the pool
   */
  undiciOpts: Pool.Options;
};

function getHasuraHeaders(headers: Record<string, any>): Record<string, any> {
  return Object.keys(headers).reduce((agg, key) => {
    if (key.toLowerCase().startsWith('x-hasura')) {
      agg[key] = headers[key];
    }
    return agg;
  }, {} as Record<string, any>);
}

const defaultHasuraOptions: HasuraProxyOptions = {
  cacheTTL: 0,
  cacheKeySerialize(arg) {
    const args = {
      hash: arg.hash,
      v: arg.variables,
      auth: arg.headers['authorization'],
      ...getHasuraHeaders(arg.headers),
    };
    return stableJson(args);
  },
  undiciOpts: {
    pipelining: 1,
    keepAliveTimeout: 5_000,
    connections: 128,
  },
};

export interface ValidationError {
  type: 'validation';
  message: string;
}

export type ValidateFn<T> = (input: T, def: OpsDef) => Promise<void | ValidationError> | void | ValidationError;
export type Resolver = (props: {
  variables?: Record<string, unknown>;
  headers: Record<string, unknown>;
}) => Promise<ProxyResponse>;
export type CustomHandlerFn<R, V> = (this: OpsDef, variables: V, headers: Record<string, unknown>) => Promise<R>;

class OpsDef {
  private mQuery: string;

  constructor(
    public readonly hash: string,
    private mDocument: DocumentNode,
    public readonly operationType: OperationTypeNode,
    private mRequest: (req: ProxyRequestProps) => Promise<ProxyResponse>,
    private mValidate: ValidateFn<any> | null = null,
    private mCustomHandler: CustomHandlerFn<any, any> | null = null
  ) {
    this.mQuery = print(mDocument);
  }

  public setValidate(validate: ValidateFn<any> | null) {
    this.mValidate = validate?.bind(this) ?? null;
  }

  public setCustomHandler(customHandler: CustomHandlerFn<any, any> | null) {
    this.mCustomHandler = customHandler?.bind(this) ?? null;
  }

  public setDocument(document: DocumentNode) {
    this.mDocument = document;
    this.mQuery = print(document);
  }

  get document() {
    return this.mDocument;
  }

  get query() {
    return this.mQuery;
  }

  get customHandler() {
    return this.mCustomHandler;
  }

  public async resolve(props: { variables?: Record<string, unknown>; headers: Record<string, unknown> }) {
    // validate
    if (this.mValidate) {
      const error = await this.mValidate(props.variables, this);
      if (error) {
        throw new createHttpError.BadRequest(error.message);
      }
    }

    if (this.mCustomHandler) {
      const handlerResponse = await this.mCustomHandler(props.variables, props.headers);
      const response: ProxyResponse = {
        headers: {},
        response: { data: handlerResponse },
      };
      return response;
    }

    return this.mRequest({ hash: this.hash, headers: props.headers, query: this.mQuery, variables: props.variables });
  }
}

export function createHasuraProxy(
  hasuraUrl: URL,
  operations: Record<string, string>,
  options?: Partial<HasuraProxyOptions>
) {
  const finalOptions: HasuraProxyOptions = {
    ...defaultHasuraOptions,
    ...options,
    undiciOpts: { ...defaultHasuraOptions.undiciOpts, ...options?.undiciOpts },
  };

  const mPool = new undici.Pool(hasuraUrl.origin, finalOptions.undiciOpts);

  const cache = createCache({
    ttl: finalOptions.cacheTTL, // seconds
    storage: {
      type: 'memory',
    },
  }) as Cache & {
    [hash: string]: Resolver;
  };

  async function requestHasura(props: Omit<ProxyRequestProps, 'hash'>): Promise<ProxyResponse> {
    const requestBody = {
      query: props.query,
      variables: props.variables,
    };

    const bodyPayload = JSON.stringify(requestBody);

    const headers = Object.assign({
      ...props.headers,
      'content-length': Buffer.byteLength(bodyPayload),
      'content-type': 'application/json',
    });

    // remove forbidden headers
    headers.connection = undefined;
    headers['transfer-encoding'] = undefined;

    const fetchResult = await mPool.request({
      path: hasuraUrl.pathname,
      method: 'POST',
      headers: headers,
      body: bodyPayload,
      throwOnError: true,
    });

    const buffers: Buffer[] = [];

    for await (const data of fetchResult.body) {
      buffers.push(data);
    }

    // the buffer contains gzip data
    const data = Buffer.concat(buffers);

    // TODO: write copy header helper
    const resultHeaders: Record<string, any> = {};
    if (fetchResult.headers['content-encoding']) {
      resultHeaders['content-encoding'] = fetchResult.headers['content-encoding'];
    }

    if (fetchResult.headers['content-type']) {
      resultHeaders['content-type'] = fetchResult.headers['content-type'];
    }

    return {
      response: data,
      headers: resultHeaders,
    };
  }

  const opsMap = new Map<string, OpsDef>();

  Object.entries(operations).forEach(([hash, documentText]) => {
    const doc = parse(documentText);
    const type = getOperationAST(doc)?.operation;

    /* istanbul ignore next */
    if (!type) {
      throw new Error('could not retrieve operation type from ' + documentText);
    }

    const def = new OpsDef(hash, doc, type, requestHasura);

    let cacheTTL = finalOptions.cacheTTL;

    // only wrap queries with cache
    if (type === OperationTypeNode.QUERY) {
      const editedDoc = visit(doc, {
        Directive: {
          enter(node) {
            if (node.name.value === 'pcached') {
              visit(node, {
                Argument: {
                  enter(argNode) {
                    /* istanbul ignore next */
                    if (argNode.name.value !== 'ttl') {
                      return;
                    }
                    visit(argNode, {
                      IntValue: {
                        enter(intNode) {
                          cacheTTL = +intNode.value;
                        },
                      },
                    });
                  },
                },
              });
              // delete this node
              return null;
            }
            return;
          },
        },
      });
      const originalResolve = def.resolve;
      cache.define(
        hash,
        {
          // todo add decorators for caching strategy
          ttl: cacheTTL ?? 0,
          serialize: finalOptions.cacheKeySerialize,
        },
        function (...args: Parameters<Resolver>) {
          return originalResolve.apply(def, args);
        }
      );

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      def.resolve = cache[hash]!;
      def.setDocument(editedDoc);
    }

    opsMap.set(hash, def);
  });

  function getOperation(document: any) {
    const hash = document['__meta__']?.['hash'];
    /* istanbul ignore next */
    if (!hash) {
      throw new Error('document has not a meta field with hash defined');
    }

    const doc = opsMap.get(hash);
    /* istanbul ignore next */
    if (!doc) {
      throw new Error('no document registered for ' + hash);
    }

    return doc;
  }

  return {
    /**
     * Validate all operations against hasura and custom overrides, throws if some operations are not valid
     * This is useful to check during development if all documents are valid or have custom execute
     *
     * Should be called after all overrides are added
     */
    async validate() {
      // fetch introspection
      const ops = Array.from(opsMap.values());
      // filter out custom executions
      const opsToCheck = ops.filter((o) => !o.customHandler);

      if (opsToCheck.length === 0) {
        return [];
      }

      // fetch introspection query
      const query = getIntrospectionQuery();
      // validate
      const schemaBuffer = await requestHasura({
        query: query,
        headers: {
          'x-hasura-admin-secret': G_ENV.HASURA_ADMIN_SECRET,
        },
      });

      const schemaString = String(schemaBuffer.response);

      const schema = buildClientSchema(JSON.parse(schemaString).data);

      const errors = opsToCheck.reduce((agg, curr) => {
        const errs = validate(schema, curr.document);
        return [...agg, ...errs];
      }, [] as GraphQLError[]);

      return errors;
    },
    // close all undici connections
    async close() {
      await cache.clear();
      return new Promise<void>((resolve) => {
        mPool.destroy();
        // let the event loop do a full run so that it can
        // actually destroy those sockets
        setImmediate(resolve);
      });
    },
    getOperations() {
      return Array.from(opsMap.values());
    },
    /**
     * Add input validation for an operation
     */
    addValidation<V>(document: TypedDocumentNode<any, V>, validate: ValidateFn<V>) {
      const ops = getOperation(document);
      ops.setValidate(validate);
      // clear cache for that key
      cache.clear(ops.hash, null).catch(() => {
        //
      });
    },
    /**
     * Add an operation override. Can be used to implement custom operations
     */
    addOverride<R, V>(document: TypedDocumentNode<R, V>, handler: CustomHandlerFn<R, V>) {
      const ops = getOperation(document);
      ops.setCustomHandler(handler);
      // clear cache for that key
      cache.clear(ops.hash, null).catch(() => {
        //
      });
    },
    /**
     * Directly call hasura without any validation, caching or overrides
     */
    async rawRequest(query: string, variables: Record<string, unknown> | undefined, headers: Record<string, unknown>) {
      return requestHasura({ headers, query, variables });
    },

    /**
     * Send a request
     */
    async request(
      hash: string,
      variables: Record<string, unknown> | undefined = undefined,
      headers: Record<string, unknown> = {}
    ): Promise<ProxyResponse> {
      const def = opsMap.get(hash);
      if (!def) {
        throw new createHttpError.NotFound();
      }

      return def.resolve({ variables, headers });
    },
  };
}
