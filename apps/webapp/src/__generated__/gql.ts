/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
    "mutation RefreshToken($token: String!) {\n  auth {\n    refresh(rt: $token)\n  }\n}\n\nmutation Redeem($token: String!) {\n  auth {\n    redeem(token: $token)\n  }\n}\n\nmutation AccessToken($claims: [Auth_Claim!]!, $token: String!) {\n  auth {\n    accessToken(claims: $claims, rt: $token)\n  }\n}": types.RefreshTokenDocument,
    "\n  query GetMe {\n    me: auth_get_me {\n      id\n      token_version\n      updated_at\n      providers {\n        id\n        provider\n      }\n    }\n  }\n": types.GetMeDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation RefreshToken($token: String!) {\n  auth {\n    refresh(rt: $token)\n  }\n}\n\nmutation Redeem($token: String!) {\n  auth {\n    redeem(token: $token)\n  }\n}\n\nmutation AccessToken($claims: [Auth_Claim!]!, $token: String!) {\n  auth {\n    accessToken(claims: $claims, rt: $token)\n  }\n}"): (typeof documents)["mutation RefreshToken($token: String!) {\n  auth {\n    refresh(rt: $token)\n  }\n}\n\nmutation Redeem($token: String!) {\n  auth {\n    redeem(token: $token)\n  }\n}\n\nmutation AccessToken($claims: [Auth_Claim!]!, $token: String!) {\n  auth {\n    accessToken(claims: $claims, rt: $token)\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetMe {\n    me: auth_get_me {\n      id\n      token_version\n      updated_at\n      providers {\n        id\n        provider\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetMe {\n    me: auth_get_me {\n      id\n      token_version\n      updated_at\n      providers {\n        id\n        provider\n      }\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;