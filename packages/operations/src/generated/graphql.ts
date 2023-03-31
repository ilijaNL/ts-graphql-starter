/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type Mutation_Root = {
  noop: Scalars['Boolean'];
};

export type Query_Root = {
  __health: Scalars['Boolean'];
  /** There are no queries available to the current role. Either there are no sources or remote schemas configured, or the current role doesn't have the required permissions. */
  no_queries_available: Scalars['String'];
};

export type HealthQueryVariables = Exact<{ [key: string]: never; }>;


export type HealthQuery = { __health: boolean };


export const HealthDocument = {"__meta__":{"op":"query","hash":"901aec55022481249e2efdaa0fb8acf64421d3c3"}} as unknown as DocumentNode<HealthQuery, HealthQueryVariables>;