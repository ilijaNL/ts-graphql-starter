import { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  jsonb: { input: Record<string, any> | Array<any>; output: Record<string, any> | Array<any>; }
  timestamptz: { input: string; output: string; }
  uuid: { input: string; output: string; }
};

/** Boolean expression to compare columns of type "Boolean". All fields are combined with logical 'AND'. */
export type Boolean_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['Boolean']['input']>;
  _gt?: InputMaybe<Scalars['Boolean']['input']>;
  _gte?: InputMaybe<Scalars['Boolean']['input']>;
  _in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['Boolean']['input']>;
  _lte?: InputMaybe<Scalars['Boolean']['input']>;
  _neq?: InputMaybe<Scalars['Boolean']['input']>;
  _nin?: InputMaybe<Array<Scalars['Boolean']['input']>>;
};

/** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
export type Int_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['Int']['input']>;
  _gt?: InputMaybe<Scalars['Int']['input']>;
  _gte?: InputMaybe<Scalars['Int']['input']>;
  _in?: InputMaybe<Array<Scalars['Int']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['Int']['input']>;
  _lte?: InputMaybe<Scalars['Int']['input']>;
  _neq?: InputMaybe<Scalars['Int']['input']>;
  _nin?: InputMaybe<Array<Scalars['Int']['input']>>;
};

/** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
export type String_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['String']['input']>;
  _gt?: InputMaybe<Scalars['String']['input']>;
  _gte?: InputMaybe<Scalars['String']['input']>;
  /** does the column match the given case-insensitive pattern */
  _ilike?: InputMaybe<Scalars['String']['input']>;
  _in?: InputMaybe<Array<Scalars['String']['input']>>;
  /** does the column match the given POSIX regular expression, case insensitive */
  _iregex?: InputMaybe<Scalars['String']['input']>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  /** does the column match the given pattern */
  _like?: InputMaybe<Scalars['String']['input']>;
  _lt?: InputMaybe<Scalars['String']['input']>;
  _lte?: InputMaybe<Scalars['String']['input']>;
  _neq?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given case-insensitive pattern */
  _nilike?: InputMaybe<Scalars['String']['input']>;
  _nin?: InputMaybe<Array<Scalars['String']['input']>>;
  /** does the column NOT match the given POSIX regular expression, case insensitive */
  _niregex?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given pattern */
  _nlike?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given POSIX regular expression, case sensitive */
  _nregex?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given SQL regular expression */
  _nsimilar?: InputMaybe<Scalars['String']['input']>;
  /** does the column match the given POSIX regular expression, case sensitive */
  _regex?: InputMaybe<Scalars['String']['input']>;
  /** does the column match the given SQL regular expression */
  _similar?: InputMaybe<Scalars['String']['input']>;
};

/** columns and relationships of "auth.account_info" */
export type Auth_Account_Info = {
  account_id: Scalars['uuid']['output'];
  avatar_url: Maybe<Scalars['String']['output']>;
  created_at: Scalars['timestamptz']['output'];
  display_name: Scalars['String']['output'];
  extra_data: Maybe<Scalars['jsonb']['output']>;
  id: Scalars['uuid']['output'];
  locale: Scalars['String']['output'];
  updated_at: Scalars['timestamptz']['output'];
};


/** columns and relationships of "auth.account_info" */
export type Auth_Account_InfoExtra_DataArgs = {
  path: InputMaybe<Scalars['String']['input']>;
};

/** Boolean expression to filter rows from the table "auth.account_info". All fields are combined with a logical 'AND'. */
export type Auth_Account_Info_Bool_Exp = {
  _and?: InputMaybe<Array<Auth_Account_Info_Bool_Exp>>;
  _not?: InputMaybe<Auth_Account_Info_Bool_Exp>;
  _or?: InputMaybe<Array<Auth_Account_Info_Bool_Exp>>;
  account_id?: InputMaybe<Uuid_Comparison_Exp>;
  avatar_url?: InputMaybe<String_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  display_name?: InputMaybe<String_Comparison_Exp>;
  extra_data?: InputMaybe<Jsonb_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  locale?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
};

/** Ordering options when selecting data from "auth.account_info". */
export type Auth_Account_Info_Order_By = {
  account_id?: InputMaybe<Order_By>;
  avatar_url?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  display_name?: InputMaybe<Order_By>;
  extra_data?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  locale?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** select columns of table "auth.account_info" */
export type Auth_Account_Info_Select_Column =
  /** column name */
  | 'account_id'
  /** column name */
  | 'avatar_url'
  /** column name */
  | 'created_at'
  /** column name */
  | 'display_name'
  /** column name */
  | 'extra_data'
  /** column name */
  | 'id'
  /** column name */
  | 'locale'
  /** column name */
  | 'updated_at';

/** Streaming cursor of the table "auth_account_info" */
export type Auth_Account_Info_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Auth_Account_Info_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Auth_Account_Info_Stream_Cursor_Value_Input = {
  account_id?: InputMaybe<Scalars['uuid']['input']>;
  avatar_url?: InputMaybe<Scalars['String']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  display_name?: InputMaybe<Scalars['String']['input']>;
  extra_data?: InputMaybe<Scalars['jsonb']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  locale?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
};

/** columns and relationships of "auth.account_providers" */
export type Auth_Account_Providers = {
  account_id: Scalars['uuid']['output'];
  created_at: Scalars['timestamptz']['output'];
  id: Scalars['uuid']['output'];
  provider: Scalars['String']['output'];
  provider_account_id: Scalars['String']['output'];
  updated_at: Scalars['timestamptz']['output'];
};

/** order by aggregate values of table "auth.account_providers" */
export type Auth_Account_Providers_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Auth_Account_Providers_Max_Order_By>;
  min?: InputMaybe<Auth_Account_Providers_Min_Order_By>;
};

/** Boolean expression to filter rows from the table "auth.account_providers". All fields are combined with a logical 'AND'. */
export type Auth_Account_Providers_Bool_Exp = {
  _and?: InputMaybe<Array<Auth_Account_Providers_Bool_Exp>>;
  _not?: InputMaybe<Auth_Account_Providers_Bool_Exp>;
  _or?: InputMaybe<Array<Auth_Account_Providers_Bool_Exp>>;
  account_id?: InputMaybe<Uuid_Comparison_Exp>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  provider?: InputMaybe<String_Comparison_Exp>;
  provider_account_id?: InputMaybe<String_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
};

/** order by max() on columns of table "auth.account_providers" */
export type Auth_Account_Providers_Max_Order_By = {
  account_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  provider?: InputMaybe<Order_By>;
  provider_account_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** order by min() on columns of table "auth.account_providers" */
export type Auth_Account_Providers_Min_Order_By = {
  account_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  provider?: InputMaybe<Order_By>;
  provider_account_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** Ordering options when selecting data from "auth.account_providers". */
export type Auth_Account_Providers_Order_By = {
  account_id?: InputMaybe<Order_By>;
  created_at?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  provider?: InputMaybe<Order_By>;
  provider_account_id?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
};

/** select columns of table "auth.account_providers" */
export type Auth_Account_Providers_Select_Column =
  /** column name */
  | 'account_id'
  /** column name */
  | 'created_at'
  /** column name */
  | 'id'
  /** column name */
  | 'provider'
  /** column name */
  | 'provider_account_id'
  /** column name */
  | 'updated_at';

/** Streaming cursor of the table "auth_account_providers" */
export type Auth_Account_Providers_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Auth_Account_Providers_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Auth_Account_Providers_Stream_Cursor_Value_Input = {
  account_id?: InputMaybe<Scalars['uuid']['input']>;
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  provider?: InputMaybe<Scalars['String']['input']>;
  provider_account_id?: InputMaybe<Scalars['String']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
};

/** columns and relationships of "auth.accounts" */
export type Auth_Accounts = {
  created_at: Scalars['timestamptz']['output'];
  disabled: Scalars['Boolean']['output'];
  id: Scalars['uuid']['output'];
  /** An object relationship */
  info: Maybe<Auth_Account_Info>;
  /** An array relationship */
  providers: Array<Auth_Account_Providers>;
  token_version: Scalars['Int']['output'];
  updated_at: Scalars['timestamptz']['output'];
  version: Scalars['Int']['output'];
};


/** columns and relationships of "auth.accounts" */
export type Auth_AccountsProvidersArgs = {
  distinct_on: InputMaybe<Array<Auth_Account_Providers_Select_Column>>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  order_by: InputMaybe<Array<Auth_Account_Providers_Order_By>>;
  where: InputMaybe<Auth_Account_Providers_Bool_Exp>;
};

/** Boolean expression to filter rows from the table "auth.accounts". All fields are combined with a logical 'AND'. */
export type Auth_Accounts_Bool_Exp = {
  _and?: InputMaybe<Array<Auth_Accounts_Bool_Exp>>;
  _not?: InputMaybe<Auth_Accounts_Bool_Exp>;
  _or?: InputMaybe<Array<Auth_Accounts_Bool_Exp>>;
  created_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  disabled?: InputMaybe<Boolean_Comparison_Exp>;
  id?: InputMaybe<Uuid_Comparison_Exp>;
  info?: InputMaybe<Auth_Account_Info_Bool_Exp>;
  providers?: InputMaybe<Auth_Account_Providers_Bool_Exp>;
  token_version?: InputMaybe<Int_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  version?: InputMaybe<Int_Comparison_Exp>;
};

/** Ordering options when selecting data from "auth.accounts". */
export type Auth_Accounts_Order_By = {
  created_at?: InputMaybe<Order_By>;
  disabled?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  info?: InputMaybe<Auth_Account_Info_Order_By>;
  providers_aggregate?: InputMaybe<Auth_Account_Providers_Aggregate_Order_By>;
  token_version?: InputMaybe<Order_By>;
  updated_at?: InputMaybe<Order_By>;
  version?: InputMaybe<Order_By>;
};

/** select columns of table "auth.accounts" */
export type Auth_Accounts_Select_Column =
  /** column name */
  | 'created_at'
  /** column name */
  | 'disabled'
  /** column name */
  | 'id'
  /** column name */
  | 'token_version'
  /** column name */
  | 'updated_at'
  /** column name */
  | 'version';

/** Streaming cursor of the table "auth_accounts" */
export type Auth_Accounts_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Auth_Accounts_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Auth_Accounts_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars['timestamptz']['input']>;
  disabled?: InputMaybe<Scalars['Boolean']['input']>;
  id?: InputMaybe<Scalars['uuid']['input']>;
  token_version?: InputMaybe<Scalars['Int']['input']>;
  updated_at?: InputMaybe<Scalars['timestamptz']['input']>;
  version?: InputMaybe<Scalars['Int']['input']>;
};

/** ordering argument of a cursor */
export type Cursor_Ordering =
  /** ascending ordering of the cursor */
  | 'ASC'
  /** descending ordering of the cursor */
  | 'DESC';

export type Jsonb_Cast_Exp = {
  String?: InputMaybe<String_Comparison_Exp>;
};

/** Boolean expression to compare columns of type "jsonb". All fields are combined with logical 'AND'. */
export type Jsonb_Comparison_Exp = {
  _cast?: InputMaybe<Jsonb_Cast_Exp>;
  /** is the column contained in the given json value */
  _contained_in?: InputMaybe<Scalars['jsonb']['input']>;
  /** does the column contain the given json value at the top level */
  _contains?: InputMaybe<Scalars['jsonb']['input']>;
  _eq?: InputMaybe<Scalars['jsonb']['input']>;
  _gt?: InputMaybe<Scalars['jsonb']['input']>;
  _gte?: InputMaybe<Scalars['jsonb']['input']>;
  /** does the string exist as a top-level key in the column */
  _has_key?: InputMaybe<Scalars['String']['input']>;
  /** do all of these strings exist as top-level keys in the column */
  _has_keys_all?: InputMaybe<Array<Scalars['String']['input']>>;
  /** do any of these strings exist as top-level keys in the column */
  _has_keys_any?: InputMaybe<Array<Scalars['String']['input']>>;
  _in?: InputMaybe<Array<Scalars['jsonb']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['jsonb']['input']>;
  _lte?: InputMaybe<Scalars['jsonb']['input']>;
  _neq?: InputMaybe<Scalars['jsonb']['input']>;
  _nin?: InputMaybe<Array<Scalars['jsonb']['input']>>;
};

/** column ordering options */
export type Order_By =
  /** in ascending order, nulls last */
  | 'asc'
  /** in ascending order, nulls first */
  | 'asc_nulls_first'
  /** in ascending order, nulls last */
  | 'asc_nulls_last'
  /** in descending order, nulls first */
  | 'desc'
  /** in descending order, nulls first */
  | 'desc_nulls_first'
  /** in descending order, nulls last */
  | 'desc_nulls_last';

export type Query_Root = {
  /** fetch data from the table: "auth.account_info" */
  auth_account_info: Array<Auth_Account_Info>;
  /** fetch data from the table: "auth.account_info" using primary key columns */
  auth_account_info_by_pk: Maybe<Auth_Account_Info>;
  /** fetch data from the table: "auth.account_providers" */
  auth_account_providers: Array<Auth_Account_Providers>;
  /** fetch data from the table: "auth.account_providers" using primary key columns */
  auth_account_providers_by_pk: Maybe<Auth_Account_Providers>;
  /** fetch data from the table: "auth.accounts" */
  auth_accounts: Array<Auth_Accounts>;
  /** fetch data from the table: "auth.accounts" using primary key columns */
  auth_accounts_by_pk: Maybe<Auth_Accounts>;
  /** execute function "auth.get_me" which returns "auth.accounts" */
  auth_get_me: Array<Auth_Accounts>;
};


export type Query_RootAuth_Account_InfoArgs = {
  distinct_on: InputMaybe<Array<Auth_Account_Info_Select_Column>>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  order_by: InputMaybe<Array<Auth_Account_Info_Order_By>>;
  where: InputMaybe<Auth_Account_Info_Bool_Exp>;
};


export type Query_RootAuth_Account_Info_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Query_RootAuth_Account_ProvidersArgs = {
  distinct_on: InputMaybe<Array<Auth_Account_Providers_Select_Column>>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  order_by: InputMaybe<Array<Auth_Account_Providers_Order_By>>;
  where: InputMaybe<Auth_Account_Providers_Bool_Exp>;
};


export type Query_RootAuth_Account_Providers_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Query_RootAuth_AccountsArgs = {
  distinct_on: InputMaybe<Array<Auth_Accounts_Select_Column>>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  order_by: InputMaybe<Array<Auth_Accounts_Order_By>>;
  where: InputMaybe<Auth_Accounts_Bool_Exp>;
};


export type Query_RootAuth_Accounts_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Query_RootAuth_Get_MeArgs = {
  distinct_on: InputMaybe<Array<Auth_Accounts_Select_Column>>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  order_by: InputMaybe<Array<Auth_Accounts_Order_By>>;
  where: InputMaybe<Auth_Accounts_Bool_Exp>;
};

export type Subscription_Root = {
  /** fetch data from the table: "auth.account_info" */
  auth_account_info: Array<Auth_Account_Info>;
  /** fetch data from the table: "auth.account_info" using primary key columns */
  auth_account_info_by_pk: Maybe<Auth_Account_Info>;
  /** fetch data from the table in a streaming manner: "auth.account_info" */
  auth_account_info_stream: Array<Auth_Account_Info>;
  /** fetch data from the table: "auth.account_providers" */
  auth_account_providers: Array<Auth_Account_Providers>;
  /** fetch data from the table: "auth.account_providers" using primary key columns */
  auth_account_providers_by_pk: Maybe<Auth_Account_Providers>;
  /** fetch data from the table in a streaming manner: "auth.account_providers" */
  auth_account_providers_stream: Array<Auth_Account_Providers>;
  /** fetch data from the table: "auth.accounts" */
  auth_accounts: Array<Auth_Accounts>;
  /** fetch data from the table: "auth.accounts" using primary key columns */
  auth_accounts_by_pk: Maybe<Auth_Accounts>;
  /** fetch data from the table in a streaming manner: "auth.accounts" */
  auth_accounts_stream: Array<Auth_Accounts>;
  /** execute function "auth.get_me" which returns "auth.accounts" */
  auth_get_me: Array<Auth_Accounts>;
};


export type Subscription_RootAuth_Account_InfoArgs = {
  distinct_on: InputMaybe<Array<Auth_Account_Info_Select_Column>>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  order_by: InputMaybe<Array<Auth_Account_Info_Order_By>>;
  where: InputMaybe<Auth_Account_Info_Bool_Exp>;
};


export type Subscription_RootAuth_Account_Info_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Subscription_RootAuth_Account_Info_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Auth_Account_Info_Stream_Cursor_Input>>;
  where: InputMaybe<Auth_Account_Info_Bool_Exp>;
};


export type Subscription_RootAuth_Account_ProvidersArgs = {
  distinct_on: InputMaybe<Array<Auth_Account_Providers_Select_Column>>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  order_by: InputMaybe<Array<Auth_Account_Providers_Order_By>>;
  where: InputMaybe<Auth_Account_Providers_Bool_Exp>;
};


export type Subscription_RootAuth_Account_Providers_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Subscription_RootAuth_Account_Providers_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Auth_Account_Providers_Stream_Cursor_Input>>;
  where: InputMaybe<Auth_Account_Providers_Bool_Exp>;
};


export type Subscription_RootAuth_AccountsArgs = {
  distinct_on: InputMaybe<Array<Auth_Accounts_Select_Column>>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  order_by: InputMaybe<Array<Auth_Accounts_Order_By>>;
  where: InputMaybe<Auth_Accounts_Bool_Exp>;
};


export type Subscription_RootAuth_Accounts_By_PkArgs = {
  id: Scalars['uuid']['input'];
};


export type Subscription_RootAuth_Accounts_StreamArgs = {
  batch_size: Scalars['Int']['input'];
  cursor: Array<InputMaybe<Auth_Accounts_Stream_Cursor_Input>>;
  where: InputMaybe<Auth_Accounts_Bool_Exp>;
};


export type Subscription_RootAuth_Get_MeArgs = {
  distinct_on: InputMaybe<Array<Auth_Accounts_Select_Column>>;
  limit: InputMaybe<Scalars['Int']['input']>;
  offset: InputMaybe<Scalars['Int']['input']>;
  order_by: InputMaybe<Array<Auth_Accounts_Order_By>>;
  where: InputMaybe<Auth_Accounts_Bool_Exp>;
};

/** Boolean expression to compare columns of type "timestamptz". All fields are combined with logical 'AND'. */
export type Timestamptz_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['timestamptz']['input']>;
  _gt?: InputMaybe<Scalars['timestamptz']['input']>;
  _gte?: InputMaybe<Scalars['timestamptz']['input']>;
  _in?: InputMaybe<Array<Scalars['timestamptz']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['timestamptz']['input']>;
  _lte?: InputMaybe<Scalars['timestamptz']['input']>;
  _neq?: InputMaybe<Scalars['timestamptz']['input']>;
  _nin?: InputMaybe<Array<Scalars['timestamptz']['input']>>;
};

/** Boolean expression to compare columns of type "uuid". All fields are combined with logical 'AND'. */
export type Uuid_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['uuid']['input']>;
  _gt?: InputMaybe<Scalars['uuid']['input']>;
  _gte?: InputMaybe<Scalars['uuid']['input']>;
  _in?: InputMaybe<Array<Scalars['uuid']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['uuid']['input']>;
  _lte?: InputMaybe<Scalars['uuid']['input']>;
  _neq?: InputMaybe<Scalars['uuid']['input']>;
  _nin?: InputMaybe<Array<Scalars['uuid']['input']>>;
};

export type GetMeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMeQuery = { me: Array<{ id: string, token_version: number, updated_at: string, providers: Array<{ id: string, provider: string }>, info: { avatar_url: string | null, locale: string, id: string, display_name: string } | null }> };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: DocumentTypeDecoration<TResult, TVariables>['__apiType'];

  constructor(private value: string, public __meta__?: Record<string, any>) {
    super(value);
  }

  toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}

export const GetMeDocument = new TypedDocumentString(`
    query GetMe {
  me: auth_get_me {
    id
    token_version
    updated_at
    providers {
      id
      provider
    }
    info {
      avatar_url
      locale
      id
      display_name
    }
  }
}
    `) as unknown as TypedDocumentString<GetMeQuery, GetMeQueryVariables>;