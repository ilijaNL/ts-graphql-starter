import { TypedDocumentString } from '@/__generated__/user';
import { DocumentNode, OperationDefinitionNode, getOperationAST, parse } from 'graphql';

type DocInfo = {
  operationType: 'query' | 'mutation' | 'subscription';
  operationName: string;
};

const docCache = new WeakMap<TypedDocumentString<any, any>, DocInfo>();

const extractOperationName = (document: DocumentNode): string => {
  let operationName = undefined;

  const operationDefinitions = document.definitions.filter(
    (definition) => definition.kind === `OperationDefinition`
  ) as OperationDefinitionNode[];

  if (operationDefinitions.length === 1) {
    operationName = operationDefinitions[0]?.name?.value;
  }

  return operationName ?? '';
};

export function getDocumentInfoFromNode<TData, TVars>(documentNode: TypedDocumentString<TData, TVars>): DocInfo {
  if (docCache.has(documentNode)) {
    return docCache.get(documentNode)!;
  }

  const document = parse(documentNode.toString());
  const operationName = extractOperationName(document);
  const operationType = getOperationAST(document)!.operation;

  const result: DocInfo = {
    operationName: operationName,
    operationType: operationType,
  };

  docCache.set(documentNode, result);

  return result;
}
