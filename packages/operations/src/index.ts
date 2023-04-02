// only export graphql
export * from './generated/graphql';
export * from './generated/gql';
import json from './generated/persisted-documents.json';

export const operations = json;
