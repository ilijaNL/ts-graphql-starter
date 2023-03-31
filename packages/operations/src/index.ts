// only export graphql
export * from './generated/graphql';
import json from './generated/persisted-documents.json';

export const operations = json;
