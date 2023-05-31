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
  jsonb: Record<string, any> | Array<any>;
  timestamptz: string;
  uuid: string;
};

/** Boolean expression to compare columns of type "Boolean". All fields are combined with logical 'AND'. */
export type Boolean_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['Boolean']>;
  _gt?: InputMaybe<Scalars['Boolean']>;
  _gte?: InputMaybe<Scalars['Boolean']>;
  _in?: InputMaybe<Array<Scalars['Boolean']>>;
  _is_null?: InputMaybe<Scalars['Boolean']>;
  _lt?: InputMaybe<Scalars['Boolean']>;
  _lte?: InputMaybe<Scalars['Boolean']>;
  _neq?: InputMaybe<Scalars['Boolean']>;
  _nin?: InputMaybe<Array<Scalars['Boolean']>>;
};

/** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
export type Int_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['Int']>;
  _gt?: InputMaybe<Scalars['Int']>;
  _gte?: InputMaybe<Scalars['Int']>;
  _in?: InputMaybe<Array<Scalars['Int']>>;
  _is_null?: InputMaybe<Scalars['Boolean']>;
  _lt?: InputMaybe<Scalars['Int']>;
  _lte?: InputMaybe<Scalars['Int']>;
  _neq?: InputMaybe<Scalars['Int']>;
  _nin?: InputMaybe<Array<Scalars['Int']>>;
};

/** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
export type String_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['String']>;
  _gt?: InputMaybe<Scalars['String']>;
  _gte?: InputMaybe<Scalars['String']>;
  /** does the column match the given case-insensitive pattern */
  _ilike?: InputMaybe<Scalars['String']>;
  _in?: InputMaybe<Array<Scalars['String']>>;
  /** does the column match the given POSIX regular expression, case insensitive */
  _iregex?: InputMaybe<Scalars['String']>;
  _is_null?: InputMaybe<Scalars['Boolean']>;
  /** does the column match the given pattern */
  _like?: InputMaybe<Scalars['String']>;
  _lt?: InputMaybe<Scalars['String']>;
  _lte?: InputMaybe<Scalars['String']>;
  _neq?: InputMaybe<Scalars['String']>;
  /** does the column NOT match the given case-insensitive pattern */
  _nilike?: InputMaybe<Scalars['String']>;
  _nin?: InputMaybe<Array<Scalars['String']>>;
  /** does the column NOT match the given POSIX regular expression, case insensitive */
  _niregex?: InputMaybe<Scalars['String']>;
  /** does the column NOT match the given pattern */
  _nlike?: InputMaybe<Scalars['String']>;
  /** does the column NOT match the given POSIX regular expression, case sensitive */
  _nregex?: InputMaybe<Scalars['String']>;
  /** does the column NOT match the given SQL regular expression */
  _nsimilar?: InputMaybe<Scalars['String']>;
  /** does the column match the given POSIX regular expression, case sensitive */
  _regex?: InputMaybe<Scalars['String']>;
  /** does the column match the given SQL regular expression */
  _similar?: InputMaybe<Scalars['String']>;
};

/** columns and relationships of "auth.account_info" */
export type Auth_Account_Info = {
  account_id: Scalars['uuid'];
  avatar_url: Scalars['String'];
  created_at: Scalars['timestamptz'];
  display_name: Scalars['String'];
  extra_data: Maybe<Scalars['jsonb']>;
  id: Scalars['uuid'];
  locale: Scalars['String'];
  updated_at: Scalars['timestamptz'];
};


/** columns and relationships of "auth.account_info" */
export type Auth_Account_InfoExtra_DataArgs = {
  path: InputMaybe<Scalars['String']>;
};

/** aggregated selection of "auth.account_info" */
export type Auth_Account_Info_Aggregate = {
  aggregate: Maybe<Auth_Account_Info_Aggregate_Fields>;
  nodes: Array<Auth_Account_Info>;
};

/** aggregate fields of "auth.account_info" */
export type Auth_Account_Info_Aggregate_Fields = {
  count: Scalars['Int'];
  max: Maybe<Auth_Account_Info_Max_Fields>;
  min: Maybe<Auth_Account_Info_Min_Fields>;
};


/** aggregate fields of "auth.account_info" */
export type Auth_Account_Info_Aggregate_FieldsCountArgs = {
  columns: InputMaybe<Array<Auth_Account_Info_Select_Column>>;
  distinct: InputMaybe<Scalars['Boolean']>;
};

/** append existing jsonb value of filtered columns with new jsonb value */
export type Auth_Account_Info_Append_Input = {
  extra_data?: InputMaybe<Scalars['jsonb']>;
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

/** unique or primary key constraints on table "auth.account_info" */
export type Auth_Account_Info_Constraint =
  /** unique or primary key constraint on columns "account_id" */
  | 'account_info_account_id_key'
  /** unique or primary key constraint on columns "id" */
  | 'account_info_pkey';

/** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
export type Auth_Account_Info_Delete_At_Path_Input = {
  extra_data?: InputMaybe<Array<Scalars['String']>>;
};

/** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
export type Auth_Account_Info_Delete_Elem_Input = {
  extra_data?: InputMaybe<Scalars['Int']>;
};

/** delete key/value pair or string element. key/value pairs are matched based on their key value */
export type Auth_Account_Info_Delete_Key_Input = {
  extra_data?: InputMaybe<Scalars['String']>;
};

/** input type for inserting data into table "auth.account_info" */
export type Auth_Account_Info_Insert_Input = {
  account_id?: InputMaybe<Scalars['uuid']>;
  avatar_url?: InputMaybe<Scalars['String']>;
  created_at?: InputMaybe<Scalars['timestamptz']>;
  display_name?: InputMaybe<Scalars['String']>;
  extra_data?: InputMaybe<Scalars['jsonb']>;
  id?: InputMaybe<Scalars['uuid']>;
  locale?: InputMaybe<Scalars['String']>;
  updated_at?: InputMaybe<Scalars['timestamptz']>;
};

/** aggregate max on columns */
export type Auth_Account_Info_Max_Fields = {
  account_id: Maybe<Scalars['uuid']>;
  avatar_url: Maybe<Scalars['String']>;
  created_at: Maybe<Scalars['timestamptz']>;
  display_name: Maybe<Scalars['String']>;
  id: Maybe<Scalars['uuid']>;
  locale: Maybe<Scalars['String']>;
  updated_at: Maybe<Scalars['timestamptz']>;
};

/** aggregate min on columns */
export type Auth_Account_Info_Min_Fields = {
  account_id: Maybe<Scalars['uuid']>;
  avatar_url: Maybe<Scalars['String']>;
  created_at: Maybe<Scalars['timestamptz']>;
  display_name: Maybe<Scalars['String']>;
  id: Maybe<Scalars['uuid']>;
  locale: Maybe<Scalars['String']>;
  updated_at: Maybe<Scalars['timestamptz']>;
};

/** response of any mutation on the table "auth.account_info" */
export type Auth_Account_Info_Mutation_Response = {
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int'];
  /** data from the rows affected by the mutation */
  returning: Array<Auth_Account_Info>;
};

/** input type for inserting object relation for remote table "auth.account_info" */
export type Auth_Account_Info_Obj_Rel_Insert_Input = {
  data: Auth_Account_Info_Insert_Input;
  /** upsert condition */
  on_conflict?: InputMaybe<Auth_Account_Info_On_Conflict>;
};

/** on_conflict condition type for table "auth.account_info" */
export type Auth_Account_Info_On_Conflict = {
  constraint: Auth_Account_Info_Constraint;
  update_columns?: Array<Auth_Account_Info_Update_Column>;
  where?: InputMaybe<Auth_Account_Info_Bool_Exp>;
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

/** primary key columns input for table: auth.account_info */
export type Auth_Account_Info_Pk_Columns_Input = {
  id: Scalars['uuid'];
};

/** prepend existing jsonb value of filtered columns with new jsonb value */
export type Auth_Account_Info_Prepend_Input = {
  extra_data?: InputMaybe<Scalars['jsonb']>;
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

/** input type for updating data in table "auth.account_info" */
export type Auth_Account_Info_Set_Input = {
  account_id?: InputMaybe<Scalars['uuid']>;
  avatar_url?: InputMaybe<Scalars['String']>;
  created_at?: InputMaybe<Scalars['timestamptz']>;
  display_name?: InputMaybe<Scalars['String']>;
  extra_data?: InputMaybe<Scalars['jsonb']>;
  id?: InputMaybe<Scalars['uuid']>;
  locale?: InputMaybe<Scalars['String']>;
  updated_at?: InputMaybe<Scalars['timestamptz']>;
};

/** Streaming cursor of the table "auth_account_info" */
export type Auth_Account_Info_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Auth_Account_Info_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Auth_Account_Info_Stream_Cursor_Value_Input = {
  account_id?: InputMaybe<Scalars['uuid']>;
  avatar_url?: InputMaybe<Scalars['String']>;
  created_at?: InputMaybe<Scalars['timestamptz']>;
  display_name?: InputMaybe<Scalars['String']>;
  extra_data?: InputMaybe<Scalars['jsonb']>;
  id?: InputMaybe<Scalars['uuid']>;
  locale?: InputMaybe<Scalars['String']>;
  updated_at?: InputMaybe<Scalars['timestamptz']>;
};

/** update columns of table "auth.account_info" */
export type Auth_Account_Info_Update_Column =
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

export type Auth_Account_Info_Updates = {
  /** append existing jsonb value of filtered columns with new jsonb value */
  _append?: InputMaybe<Auth_Account_Info_Append_Input>;
  /** delete the field or element with specified path (for JSON arrays, negative integers count from the end) */
  _delete_at_path?: InputMaybe<Auth_Account_Info_Delete_At_Path_Input>;
  /** delete the array element with specified index (negative integers count from the end). throws an error if top level container is not an array */
  _delete_elem?: InputMaybe<Auth_Account_Info_Delete_Elem_Input>;
  /** delete key/value pair or string element. key/value pairs are matched based on their key value */
  _delete_key?: InputMaybe<Auth_Account_Info_Delete_Key_Input>;
  /** prepend existing jsonb value of filtered columns with new jsonb value */
  _prepend?: InputMaybe<Auth_Account_Info_Prepend_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Auth_Account_Info_Set_Input>;
  /** filter the rows which have to be updated */
  where: Auth_Account_Info_Bool_Exp;
};

/** columns and relationships of "auth.account_providers" */
export type Auth_Account_Providers = {
  account_id: Scalars['uuid'];
  created_at: Scalars['timestamptz'];
  id: Scalars['uuid'];
  provider: Scalars['String'];
  provider_account_id: Scalars['String'];
  updated_at: Scalars['timestamptz'];
};

/** aggregated selection of "auth.account_providers" */
export type Auth_Account_Providers_Aggregate = {
  aggregate: Maybe<Auth_Account_Providers_Aggregate_Fields>;
  nodes: Array<Auth_Account_Providers>;
};

export type Auth_Account_Providers_Aggregate_Bool_Exp = {
  count?: InputMaybe<Auth_Account_Providers_Aggregate_Bool_Exp_Count>;
};

export type Auth_Account_Providers_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Auth_Account_Providers_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']>;
  filter?: InputMaybe<Auth_Account_Providers_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** aggregate fields of "auth.account_providers" */
export type Auth_Account_Providers_Aggregate_Fields = {
  count: Scalars['Int'];
  max: Maybe<Auth_Account_Providers_Max_Fields>;
  min: Maybe<Auth_Account_Providers_Min_Fields>;
};


/** aggregate fields of "auth.account_providers" */
export type Auth_Account_Providers_Aggregate_FieldsCountArgs = {
  columns: InputMaybe<Array<Auth_Account_Providers_Select_Column>>;
  distinct: InputMaybe<Scalars['Boolean']>;
};

/** order by aggregate values of table "auth.account_providers" */
export type Auth_Account_Providers_Aggregate_Order_By = {
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Auth_Account_Providers_Max_Order_By>;
  min?: InputMaybe<Auth_Account_Providers_Min_Order_By>;
};

/** input type for inserting array relation for remote table "auth.account_providers" */
export type Auth_Account_Providers_Arr_Rel_Insert_Input = {
  data: Array<Auth_Account_Providers_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Auth_Account_Providers_On_Conflict>;
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

/** unique or primary key constraints on table "auth.account_providers" */
export type Auth_Account_Providers_Constraint =
  /** unique or primary key constraint on columns "id" */
  | 'account_providers_pkey'
  /** unique or primary key constraint on columns "provider_account_id", "provider" */
  | 'account_providers_provider_provider_account_id_key'
  /** unique or primary key constraint on columns "provider", "account_id" */
  | 'idx_providers_acc_id_provider';

/** input type for inserting data into table "auth.account_providers" */
export type Auth_Account_Providers_Insert_Input = {
  account_id?: InputMaybe<Scalars['uuid']>;
  created_at?: InputMaybe<Scalars['timestamptz']>;
  id?: InputMaybe<Scalars['uuid']>;
  provider?: InputMaybe<Scalars['String']>;
  provider_account_id?: InputMaybe<Scalars['String']>;
  updated_at?: InputMaybe<Scalars['timestamptz']>;
};

/** aggregate max on columns */
export type Auth_Account_Providers_Max_Fields = {
  account_id: Maybe<Scalars['uuid']>;
  created_at: Maybe<Scalars['timestamptz']>;
  id: Maybe<Scalars['uuid']>;
  provider: Maybe<Scalars['String']>;
  provider_account_id: Maybe<Scalars['String']>;
  updated_at: Maybe<Scalars['timestamptz']>;
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

/** aggregate min on columns */
export type Auth_Account_Providers_Min_Fields = {
  account_id: Maybe<Scalars['uuid']>;
  created_at: Maybe<Scalars['timestamptz']>;
  id: Maybe<Scalars['uuid']>;
  provider: Maybe<Scalars['String']>;
  provider_account_id: Maybe<Scalars['String']>;
  updated_at: Maybe<Scalars['timestamptz']>;
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

/** response of any mutation on the table "auth.account_providers" */
export type Auth_Account_Providers_Mutation_Response = {
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int'];
  /** data from the rows affected by the mutation */
  returning: Array<Auth_Account_Providers>;
};

/** on_conflict condition type for table "auth.account_providers" */
export type Auth_Account_Providers_On_Conflict = {
  constraint: Auth_Account_Providers_Constraint;
  update_columns?: Array<Auth_Account_Providers_Update_Column>;
  where?: InputMaybe<Auth_Account_Providers_Bool_Exp>;
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

/** primary key columns input for table: auth.account_providers */
export type Auth_Account_Providers_Pk_Columns_Input = {
  id: Scalars['uuid'];
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

/** input type for updating data in table "auth.account_providers" */
export type Auth_Account_Providers_Set_Input = {
  account_id?: InputMaybe<Scalars['uuid']>;
  created_at?: InputMaybe<Scalars['timestamptz']>;
  id?: InputMaybe<Scalars['uuid']>;
  provider?: InputMaybe<Scalars['String']>;
  provider_account_id?: InputMaybe<Scalars['String']>;
  updated_at?: InputMaybe<Scalars['timestamptz']>;
};

/** Streaming cursor of the table "auth_account_providers" */
export type Auth_Account_Providers_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Auth_Account_Providers_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Auth_Account_Providers_Stream_Cursor_Value_Input = {
  account_id?: InputMaybe<Scalars['uuid']>;
  created_at?: InputMaybe<Scalars['timestamptz']>;
  id?: InputMaybe<Scalars['uuid']>;
  provider?: InputMaybe<Scalars['String']>;
  provider_account_id?: InputMaybe<Scalars['String']>;
  updated_at?: InputMaybe<Scalars['timestamptz']>;
};

/** update columns of table "auth.account_providers" */
export type Auth_Account_Providers_Update_Column =
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

export type Auth_Account_Providers_Updates = {
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Auth_Account_Providers_Set_Input>;
  /** filter the rows which have to be updated */
  where: Auth_Account_Providers_Bool_Exp;
};

/** columns and relationships of "auth.accounts" */
export type Auth_Accounts = {
  created_at: Scalars['timestamptz'];
  disabled: Scalars['Boolean'];
  id: Scalars['uuid'];
  /** An object relationship */
  info: Maybe<Auth_Account_Info>;
  /** An array relationship */
  providers: Array<Auth_Account_Providers>;
  /** An aggregate relationship */
  providers_aggregate: Auth_Account_Providers_Aggregate;
  token_version: Scalars['Int'];
  updated_at: Scalars['timestamptz'];
  version: Scalars['Int'];
};


/** columns and relationships of "auth.accounts" */
export type Auth_AccountsProvidersArgs = {
  distinct_on: InputMaybe<Array<Auth_Account_Providers_Select_Column>>;
  limit: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  order_by: InputMaybe<Array<Auth_Account_Providers_Order_By>>;
  where: InputMaybe<Auth_Account_Providers_Bool_Exp>;
};


/** columns and relationships of "auth.accounts" */
export type Auth_AccountsProviders_AggregateArgs = {
  distinct_on: InputMaybe<Array<Auth_Account_Providers_Select_Column>>;
  limit: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  order_by: InputMaybe<Array<Auth_Account_Providers_Order_By>>;
  where: InputMaybe<Auth_Account_Providers_Bool_Exp>;
};

/** aggregated selection of "auth.accounts" */
export type Auth_Accounts_Aggregate = {
  aggregate: Maybe<Auth_Accounts_Aggregate_Fields>;
  nodes: Array<Auth_Accounts>;
};

/** aggregate fields of "auth.accounts" */
export type Auth_Accounts_Aggregate_Fields = {
  avg: Maybe<Auth_Accounts_Avg_Fields>;
  count: Scalars['Int'];
  max: Maybe<Auth_Accounts_Max_Fields>;
  min: Maybe<Auth_Accounts_Min_Fields>;
  stddev: Maybe<Auth_Accounts_Stddev_Fields>;
  stddev_pop: Maybe<Auth_Accounts_Stddev_Pop_Fields>;
  stddev_samp: Maybe<Auth_Accounts_Stddev_Samp_Fields>;
  sum: Maybe<Auth_Accounts_Sum_Fields>;
  var_pop: Maybe<Auth_Accounts_Var_Pop_Fields>;
  var_samp: Maybe<Auth_Accounts_Var_Samp_Fields>;
  variance: Maybe<Auth_Accounts_Variance_Fields>;
};


/** aggregate fields of "auth.accounts" */
export type Auth_Accounts_Aggregate_FieldsCountArgs = {
  columns: InputMaybe<Array<Auth_Accounts_Select_Column>>;
  distinct: InputMaybe<Scalars['Boolean']>;
};

/** aggregate avg on columns */
export type Auth_Accounts_Avg_Fields = {
  token_version: Maybe<Scalars['Float']>;
  version: Maybe<Scalars['Float']>;
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
  providers_aggregate?: InputMaybe<Auth_Account_Providers_Aggregate_Bool_Exp>;
  token_version?: InputMaybe<Int_Comparison_Exp>;
  updated_at?: InputMaybe<Timestamptz_Comparison_Exp>;
  version?: InputMaybe<Int_Comparison_Exp>;
};

/** unique or primary key constraints on table "auth.accounts" */
export type Auth_Accounts_Constraint =
  /** unique or primary key constraint on columns "id" */
  | 'accounts_pkey';

/** input type for incrementing numeric columns in table "auth.accounts" */
export type Auth_Accounts_Inc_Input = {
  token_version?: InputMaybe<Scalars['Int']>;
  version?: InputMaybe<Scalars['Int']>;
};

/** input type for inserting data into table "auth.accounts" */
export type Auth_Accounts_Insert_Input = {
  created_at?: InputMaybe<Scalars['timestamptz']>;
  disabled?: InputMaybe<Scalars['Boolean']>;
  id?: InputMaybe<Scalars['uuid']>;
  info?: InputMaybe<Auth_Account_Info_Obj_Rel_Insert_Input>;
  providers?: InputMaybe<Auth_Account_Providers_Arr_Rel_Insert_Input>;
  token_version?: InputMaybe<Scalars['Int']>;
  updated_at?: InputMaybe<Scalars['timestamptz']>;
  version?: InputMaybe<Scalars['Int']>;
};

/** aggregate max on columns */
export type Auth_Accounts_Max_Fields = {
  created_at: Maybe<Scalars['timestamptz']>;
  id: Maybe<Scalars['uuid']>;
  token_version: Maybe<Scalars['Int']>;
  updated_at: Maybe<Scalars['timestamptz']>;
  version: Maybe<Scalars['Int']>;
};

/** aggregate min on columns */
export type Auth_Accounts_Min_Fields = {
  created_at: Maybe<Scalars['timestamptz']>;
  id: Maybe<Scalars['uuid']>;
  token_version: Maybe<Scalars['Int']>;
  updated_at: Maybe<Scalars['timestamptz']>;
  version: Maybe<Scalars['Int']>;
};

/** response of any mutation on the table "auth.accounts" */
export type Auth_Accounts_Mutation_Response = {
  /** number of rows affected by the mutation */
  affected_rows: Scalars['Int'];
  /** data from the rows affected by the mutation */
  returning: Array<Auth_Accounts>;
};

/** on_conflict condition type for table "auth.accounts" */
export type Auth_Accounts_On_Conflict = {
  constraint: Auth_Accounts_Constraint;
  update_columns?: Array<Auth_Accounts_Update_Column>;
  where?: InputMaybe<Auth_Accounts_Bool_Exp>;
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

/** primary key columns input for table: auth.accounts */
export type Auth_Accounts_Pk_Columns_Input = {
  id: Scalars['uuid'];
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

/** input type for updating data in table "auth.accounts" */
export type Auth_Accounts_Set_Input = {
  created_at?: InputMaybe<Scalars['timestamptz']>;
  disabled?: InputMaybe<Scalars['Boolean']>;
  id?: InputMaybe<Scalars['uuid']>;
  token_version?: InputMaybe<Scalars['Int']>;
  updated_at?: InputMaybe<Scalars['timestamptz']>;
  version?: InputMaybe<Scalars['Int']>;
};

/** aggregate stddev on columns */
export type Auth_Accounts_Stddev_Fields = {
  token_version: Maybe<Scalars['Float']>;
  version: Maybe<Scalars['Float']>;
};

/** aggregate stddev_pop on columns */
export type Auth_Accounts_Stddev_Pop_Fields = {
  token_version: Maybe<Scalars['Float']>;
  version: Maybe<Scalars['Float']>;
};

/** aggregate stddev_samp on columns */
export type Auth_Accounts_Stddev_Samp_Fields = {
  token_version: Maybe<Scalars['Float']>;
  version: Maybe<Scalars['Float']>;
};

/** Streaming cursor of the table "auth_accounts" */
export type Auth_Accounts_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Auth_Accounts_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Auth_Accounts_Stream_Cursor_Value_Input = {
  created_at?: InputMaybe<Scalars['timestamptz']>;
  disabled?: InputMaybe<Scalars['Boolean']>;
  id?: InputMaybe<Scalars['uuid']>;
  token_version?: InputMaybe<Scalars['Int']>;
  updated_at?: InputMaybe<Scalars['timestamptz']>;
  version?: InputMaybe<Scalars['Int']>;
};

/** aggregate sum on columns */
export type Auth_Accounts_Sum_Fields = {
  token_version: Maybe<Scalars['Int']>;
  version: Maybe<Scalars['Int']>;
};

/** update columns of table "auth.accounts" */
export type Auth_Accounts_Update_Column =
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

export type Auth_Accounts_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Auth_Accounts_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Auth_Accounts_Set_Input>;
  /** filter the rows which have to be updated */
  where: Auth_Accounts_Bool_Exp;
};

/** aggregate var_pop on columns */
export type Auth_Accounts_Var_Pop_Fields = {
  token_version: Maybe<Scalars['Float']>;
  version: Maybe<Scalars['Float']>;
};

/** aggregate var_samp on columns */
export type Auth_Accounts_Var_Samp_Fields = {
  token_version: Maybe<Scalars['Float']>;
  version: Maybe<Scalars['Float']>;
};

/** aggregate variance on columns */
export type Auth_Accounts_Variance_Fields = {
  token_version: Maybe<Scalars['Float']>;
  version: Maybe<Scalars['Float']>;
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
  _contained_in?: InputMaybe<Scalars['jsonb']>;
  /** does the column contain the given json value at the top level */
  _contains?: InputMaybe<Scalars['jsonb']>;
  _eq?: InputMaybe<Scalars['jsonb']>;
  _gt?: InputMaybe<Scalars['jsonb']>;
  _gte?: InputMaybe<Scalars['jsonb']>;
  /** does the string exist as a top-level key in the column */
  _has_key?: InputMaybe<Scalars['String']>;
  /** do all of these strings exist as top-level keys in the column */
  _has_keys_all?: InputMaybe<Array<Scalars['String']>>;
  /** do any of these strings exist as top-level keys in the column */
  _has_keys_any?: InputMaybe<Array<Scalars['String']>>;
  _in?: InputMaybe<Array<Scalars['jsonb']>>;
  _is_null?: InputMaybe<Scalars['Boolean']>;
  _lt?: InputMaybe<Scalars['jsonb']>;
  _lte?: InputMaybe<Scalars['jsonb']>;
  _neq?: InputMaybe<Scalars['jsonb']>;
  _nin?: InputMaybe<Array<Scalars['jsonb']>>;
};

/** mutation root */
export type Mutation_Root = {
  /** delete data from the table: "auth.account_info" */
  delete_auth_account_info: Maybe<Auth_Account_Info_Mutation_Response>;
  /** delete single row from the table: "auth.account_info" */
  delete_auth_account_info_by_pk: Maybe<Auth_Account_Info>;
  /** delete data from the table: "auth.account_providers" */
  delete_auth_account_providers: Maybe<Auth_Account_Providers_Mutation_Response>;
  /** delete single row from the table: "auth.account_providers" */
  delete_auth_account_providers_by_pk: Maybe<Auth_Account_Providers>;
  /** delete data from the table: "auth.accounts" */
  delete_auth_accounts: Maybe<Auth_Accounts_Mutation_Response>;
  /** delete single row from the table: "auth.accounts" */
  delete_auth_accounts_by_pk: Maybe<Auth_Accounts>;
  /** insert data into the table: "auth.account_info" */
  insert_auth_account_info: Maybe<Auth_Account_Info_Mutation_Response>;
  /** insert a single row into the table: "auth.account_info" */
  insert_auth_account_info_one: Maybe<Auth_Account_Info>;
  /** insert data into the table: "auth.account_providers" */
  insert_auth_account_providers: Maybe<Auth_Account_Providers_Mutation_Response>;
  /** insert a single row into the table: "auth.account_providers" */
  insert_auth_account_providers_one: Maybe<Auth_Account_Providers>;
  /** insert data into the table: "auth.accounts" */
  insert_auth_accounts: Maybe<Auth_Accounts_Mutation_Response>;
  /** insert a single row into the table: "auth.accounts" */
  insert_auth_accounts_one: Maybe<Auth_Accounts>;
  /** update data of the table: "auth.account_info" */
  update_auth_account_info: Maybe<Auth_Account_Info_Mutation_Response>;
  /** update single row of the table: "auth.account_info" */
  update_auth_account_info_by_pk: Maybe<Auth_Account_Info>;
  /** update multiples rows of table: "auth.account_info" */
  update_auth_account_info_many: Maybe<Array<Maybe<Auth_Account_Info_Mutation_Response>>>;
  /** update data of the table: "auth.account_providers" */
  update_auth_account_providers: Maybe<Auth_Account_Providers_Mutation_Response>;
  /** update single row of the table: "auth.account_providers" */
  update_auth_account_providers_by_pk: Maybe<Auth_Account_Providers>;
  /** update multiples rows of table: "auth.account_providers" */
  update_auth_account_providers_many: Maybe<Array<Maybe<Auth_Account_Providers_Mutation_Response>>>;
  /** update data of the table: "auth.accounts" */
  update_auth_accounts: Maybe<Auth_Accounts_Mutation_Response>;
  /** update single row of the table: "auth.accounts" */
  update_auth_accounts_by_pk: Maybe<Auth_Accounts>;
  /** update multiples rows of table: "auth.accounts" */
  update_auth_accounts_many: Maybe<Array<Maybe<Auth_Accounts_Mutation_Response>>>;
};


/** mutation root */
export type Mutation_RootDelete_Auth_Account_InfoArgs = {
  where: Auth_Account_Info_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Auth_Account_Info_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_Auth_Account_ProvidersArgs = {
  where: Auth_Account_Providers_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Auth_Account_Providers_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootDelete_Auth_AccountsArgs = {
  where: Auth_Accounts_Bool_Exp;
};


/** mutation root */
export type Mutation_RootDelete_Auth_Accounts_By_PkArgs = {
  id: Scalars['uuid'];
};


/** mutation root */
export type Mutation_RootInsert_Auth_Account_InfoArgs = {
  objects: Array<Auth_Account_Info_Insert_Input>;
  on_conflict: InputMaybe<Auth_Account_Info_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Auth_Account_Info_OneArgs = {
  object: Auth_Account_Info_Insert_Input;
  on_conflict: InputMaybe<Auth_Account_Info_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Auth_Account_ProvidersArgs = {
  objects: Array<Auth_Account_Providers_Insert_Input>;
  on_conflict: InputMaybe<Auth_Account_Providers_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Auth_Account_Providers_OneArgs = {
  object: Auth_Account_Providers_Insert_Input;
  on_conflict: InputMaybe<Auth_Account_Providers_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Auth_AccountsArgs = {
  objects: Array<Auth_Accounts_Insert_Input>;
  on_conflict: InputMaybe<Auth_Accounts_On_Conflict>;
};


/** mutation root */
export type Mutation_RootInsert_Auth_Accounts_OneArgs = {
  object: Auth_Accounts_Insert_Input;
  on_conflict: InputMaybe<Auth_Accounts_On_Conflict>;
};


/** mutation root */
export type Mutation_RootUpdate_Auth_Account_InfoArgs = {
  _append: InputMaybe<Auth_Account_Info_Append_Input>;
  _delete_at_path: InputMaybe<Auth_Account_Info_Delete_At_Path_Input>;
  _delete_elem: InputMaybe<Auth_Account_Info_Delete_Elem_Input>;
  _delete_key: InputMaybe<Auth_Account_Info_Delete_Key_Input>;
  _prepend: InputMaybe<Auth_Account_Info_Prepend_Input>;
  _set: InputMaybe<Auth_Account_Info_Set_Input>;
  where: Auth_Account_Info_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Auth_Account_Info_By_PkArgs = {
  _append: InputMaybe<Auth_Account_Info_Append_Input>;
  _delete_at_path: InputMaybe<Auth_Account_Info_Delete_At_Path_Input>;
  _delete_elem: InputMaybe<Auth_Account_Info_Delete_Elem_Input>;
  _delete_key: InputMaybe<Auth_Account_Info_Delete_Key_Input>;
  _prepend: InputMaybe<Auth_Account_Info_Prepend_Input>;
  _set: InputMaybe<Auth_Account_Info_Set_Input>;
  pk_columns: Auth_Account_Info_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Auth_Account_Info_ManyArgs = {
  updates: Array<Auth_Account_Info_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_Auth_Account_ProvidersArgs = {
  _set: InputMaybe<Auth_Account_Providers_Set_Input>;
  where: Auth_Account_Providers_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Auth_Account_Providers_By_PkArgs = {
  _set: InputMaybe<Auth_Account_Providers_Set_Input>;
  pk_columns: Auth_Account_Providers_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Auth_Account_Providers_ManyArgs = {
  updates: Array<Auth_Account_Providers_Updates>;
};


/** mutation root */
export type Mutation_RootUpdate_Auth_AccountsArgs = {
  _inc: InputMaybe<Auth_Accounts_Inc_Input>;
  _set: InputMaybe<Auth_Accounts_Set_Input>;
  where: Auth_Accounts_Bool_Exp;
};


/** mutation root */
export type Mutation_RootUpdate_Auth_Accounts_By_PkArgs = {
  _inc: InputMaybe<Auth_Accounts_Inc_Input>;
  _set: InputMaybe<Auth_Accounts_Set_Input>;
  pk_columns: Auth_Accounts_Pk_Columns_Input;
};


/** mutation root */
export type Mutation_RootUpdate_Auth_Accounts_ManyArgs = {
  updates: Array<Auth_Accounts_Updates>;
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
  /** fetch aggregated fields from the table: "auth.account_info" */
  auth_account_info_aggregate: Auth_Account_Info_Aggregate;
  /** fetch data from the table: "auth.account_info" using primary key columns */
  auth_account_info_by_pk: Maybe<Auth_Account_Info>;
  /** fetch data from the table: "auth.account_providers" */
  auth_account_providers: Array<Auth_Account_Providers>;
  /** fetch aggregated fields from the table: "auth.account_providers" */
  auth_account_providers_aggregate: Auth_Account_Providers_Aggregate;
  /** fetch data from the table: "auth.account_providers" using primary key columns */
  auth_account_providers_by_pk: Maybe<Auth_Account_Providers>;
  /** fetch data from the table: "auth.accounts" */
  auth_accounts: Array<Auth_Accounts>;
  /** fetch aggregated fields from the table: "auth.accounts" */
  auth_accounts_aggregate: Auth_Accounts_Aggregate;
  /** fetch data from the table: "auth.accounts" using primary key columns */
  auth_accounts_by_pk: Maybe<Auth_Accounts>;
  /** execute function "auth.get_me" which returns "auth.accounts" */
  auth_get_me: Array<Auth_Accounts>;
  /** execute function "auth.get_me" and query aggregates on result of table type "auth.accounts" */
  auth_get_me_aggregate: Auth_Accounts_Aggregate;
};


export type Query_RootAuth_Account_InfoArgs = {
  distinct_on: InputMaybe<Array<Auth_Account_Info_Select_Column>>;
  limit: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  order_by: InputMaybe<Array<Auth_Account_Info_Order_By>>;
  where: InputMaybe<Auth_Account_Info_Bool_Exp>;
};


export type Query_RootAuth_Account_Info_AggregateArgs = {
  distinct_on: InputMaybe<Array<Auth_Account_Info_Select_Column>>;
  limit: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  order_by: InputMaybe<Array<Auth_Account_Info_Order_By>>;
  where: InputMaybe<Auth_Account_Info_Bool_Exp>;
};


export type Query_RootAuth_Account_Info_By_PkArgs = {
  id: Scalars['uuid'];
};


export type Query_RootAuth_Account_ProvidersArgs = {
  distinct_on: InputMaybe<Array<Auth_Account_Providers_Select_Column>>;
  limit: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  order_by: InputMaybe<Array<Auth_Account_Providers_Order_By>>;
  where: InputMaybe<Auth_Account_Providers_Bool_Exp>;
};


export type Query_RootAuth_Account_Providers_AggregateArgs = {
  distinct_on: InputMaybe<Array<Auth_Account_Providers_Select_Column>>;
  limit: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  order_by: InputMaybe<Array<Auth_Account_Providers_Order_By>>;
  where: InputMaybe<Auth_Account_Providers_Bool_Exp>;
};


export type Query_RootAuth_Account_Providers_By_PkArgs = {
  id: Scalars['uuid'];
};


export type Query_RootAuth_AccountsArgs = {
  distinct_on: InputMaybe<Array<Auth_Accounts_Select_Column>>;
  limit: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  order_by: InputMaybe<Array<Auth_Accounts_Order_By>>;
  where: InputMaybe<Auth_Accounts_Bool_Exp>;
};


export type Query_RootAuth_Accounts_AggregateArgs = {
  distinct_on: InputMaybe<Array<Auth_Accounts_Select_Column>>;
  limit: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  order_by: InputMaybe<Array<Auth_Accounts_Order_By>>;
  where: InputMaybe<Auth_Accounts_Bool_Exp>;
};


export type Query_RootAuth_Accounts_By_PkArgs = {
  id: Scalars['uuid'];
};


export type Query_RootAuth_Get_MeArgs = {
  distinct_on: InputMaybe<Array<Auth_Accounts_Select_Column>>;
  limit: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  order_by: InputMaybe<Array<Auth_Accounts_Order_By>>;
  where: InputMaybe<Auth_Accounts_Bool_Exp>;
};


export type Query_RootAuth_Get_Me_AggregateArgs = {
  distinct_on: InputMaybe<Array<Auth_Accounts_Select_Column>>;
  limit: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  order_by: InputMaybe<Array<Auth_Accounts_Order_By>>;
  where: InputMaybe<Auth_Accounts_Bool_Exp>;
};

export type Subscription_Root = {
  /** fetch data from the table: "auth.account_info" */
  auth_account_info: Array<Auth_Account_Info>;
  /** fetch aggregated fields from the table: "auth.account_info" */
  auth_account_info_aggregate: Auth_Account_Info_Aggregate;
  /** fetch data from the table: "auth.account_info" using primary key columns */
  auth_account_info_by_pk: Maybe<Auth_Account_Info>;
  /** fetch data from the table in a streaming manner: "auth.account_info" */
  auth_account_info_stream: Array<Auth_Account_Info>;
  /** fetch data from the table: "auth.account_providers" */
  auth_account_providers: Array<Auth_Account_Providers>;
  /** fetch aggregated fields from the table: "auth.account_providers" */
  auth_account_providers_aggregate: Auth_Account_Providers_Aggregate;
  /** fetch data from the table: "auth.account_providers" using primary key columns */
  auth_account_providers_by_pk: Maybe<Auth_Account_Providers>;
  /** fetch data from the table in a streaming manner: "auth.account_providers" */
  auth_account_providers_stream: Array<Auth_Account_Providers>;
  /** fetch data from the table: "auth.accounts" */
  auth_accounts: Array<Auth_Accounts>;
  /** fetch aggregated fields from the table: "auth.accounts" */
  auth_accounts_aggregate: Auth_Accounts_Aggregate;
  /** fetch data from the table: "auth.accounts" using primary key columns */
  auth_accounts_by_pk: Maybe<Auth_Accounts>;
  /** fetch data from the table in a streaming manner: "auth.accounts" */
  auth_accounts_stream: Array<Auth_Accounts>;
  /** execute function "auth.get_me" which returns "auth.accounts" */
  auth_get_me: Array<Auth_Accounts>;
  /** execute function "auth.get_me" and query aggregates on result of table type "auth.accounts" */
  auth_get_me_aggregate: Auth_Accounts_Aggregate;
};


export type Subscription_RootAuth_Account_InfoArgs = {
  distinct_on: InputMaybe<Array<Auth_Account_Info_Select_Column>>;
  limit: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  order_by: InputMaybe<Array<Auth_Account_Info_Order_By>>;
  where: InputMaybe<Auth_Account_Info_Bool_Exp>;
};


export type Subscription_RootAuth_Account_Info_AggregateArgs = {
  distinct_on: InputMaybe<Array<Auth_Account_Info_Select_Column>>;
  limit: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  order_by: InputMaybe<Array<Auth_Account_Info_Order_By>>;
  where: InputMaybe<Auth_Account_Info_Bool_Exp>;
};


export type Subscription_RootAuth_Account_Info_By_PkArgs = {
  id: Scalars['uuid'];
};


export type Subscription_RootAuth_Account_Info_StreamArgs = {
  batch_size: Scalars['Int'];
  cursor: Array<InputMaybe<Auth_Account_Info_Stream_Cursor_Input>>;
  where: InputMaybe<Auth_Account_Info_Bool_Exp>;
};


export type Subscription_RootAuth_Account_ProvidersArgs = {
  distinct_on: InputMaybe<Array<Auth_Account_Providers_Select_Column>>;
  limit: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  order_by: InputMaybe<Array<Auth_Account_Providers_Order_By>>;
  where: InputMaybe<Auth_Account_Providers_Bool_Exp>;
};


export type Subscription_RootAuth_Account_Providers_AggregateArgs = {
  distinct_on: InputMaybe<Array<Auth_Account_Providers_Select_Column>>;
  limit: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  order_by: InputMaybe<Array<Auth_Account_Providers_Order_By>>;
  where: InputMaybe<Auth_Account_Providers_Bool_Exp>;
};


export type Subscription_RootAuth_Account_Providers_By_PkArgs = {
  id: Scalars['uuid'];
};


export type Subscription_RootAuth_Account_Providers_StreamArgs = {
  batch_size: Scalars['Int'];
  cursor: Array<InputMaybe<Auth_Account_Providers_Stream_Cursor_Input>>;
  where: InputMaybe<Auth_Account_Providers_Bool_Exp>;
};


export type Subscription_RootAuth_AccountsArgs = {
  distinct_on: InputMaybe<Array<Auth_Accounts_Select_Column>>;
  limit: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  order_by: InputMaybe<Array<Auth_Accounts_Order_By>>;
  where: InputMaybe<Auth_Accounts_Bool_Exp>;
};


export type Subscription_RootAuth_Accounts_AggregateArgs = {
  distinct_on: InputMaybe<Array<Auth_Accounts_Select_Column>>;
  limit: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  order_by: InputMaybe<Array<Auth_Accounts_Order_By>>;
  where: InputMaybe<Auth_Accounts_Bool_Exp>;
};


export type Subscription_RootAuth_Accounts_By_PkArgs = {
  id: Scalars['uuid'];
};


export type Subscription_RootAuth_Accounts_StreamArgs = {
  batch_size: Scalars['Int'];
  cursor: Array<InputMaybe<Auth_Accounts_Stream_Cursor_Input>>;
  where: InputMaybe<Auth_Accounts_Bool_Exp>;
};


export type Subscription_RootAuth_Get_MeArgs = {
  distinct_on: InputMaybe<Array<Auth_Accounts_Select_Column>>;
  limit: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  order_by: InputMaybe<Array<Auth_Accounts_Order_By>>;
  where: InputMaybe<Auth_Accounts_Bool_Exp>;
};


export type Subscription_RootAuth_Get_Me_AggregateArgs = {
  distinct_on: InputMaybe<Array<Auth_Accounts_Select_Column>>;
  limit: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  order_by: InputMaybe<Array<Auth_Accounts_Order_By>>;
  where: InputMaybe<Auth_Accounts_Bool_Exp>;
};

/** Boolean expression to compare columns of type "timestamptz". All fields are combined with logical 'AND'. */
export type Timestamptz_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['timestamptz']>;
  _gt?: InputMaybe<Scalars['timestamptz']>;
  _gte?: InputMaybe<Scalars['timestamptz']>;
  _in?: InputMaybe<Array<Scalars['timestamptz']>>;
  _is_null?: InputMaybe<Scalars['Boolean']>;
  _lt?: InputMaybe<Scalars['timestamptz']>;
  _lte?: InputMaybe<Scalars['timestamptz']>;
  _neq?: InputMaybe<Scalars['timestamptz']>;
  _nin?: InputMaybe<Array<Scalars['timestamptz']>>;
};

/** Boolean expression to compare columns of type "uuid". All fields are combined with logical 'AND'. */
export type Uuid_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['uuid']>;
  _gt?: InputMaybe<Scalars['uuid']>;
  _gte?: InputMaybe<Scalars['uuid']>;
  _in?: InputMaybe<Array<Scalars['uuid']>>;
  _is_null?: InputMaybe<Scalars['Boolean']>;
  _lt?: InputMaybe<Scalars['uuid']>;
  _lte?: InputMaybe<Scalars['uuid']>;
  _neq?: InputMaybe<Scalars['uuid']>;
  _nin?: InputMaybe<Array<Scalars['uuid']>>;
};

export type GetMeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMeQuery = { me: Array<{ id: string, token_version: number, updated_at: string, providers: Array<{ id: string, provider: string }>, info: { locale: string, id: string, display_name: string } | null }> };


export const GetMeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMe"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"me"},"name":{"kind":"Name","value":"auth_get_me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"token_version"}},{"kind":"Field","name":{"kind":"Name","value":"updated_at"}},{"kind":"Field","name":{"kind":"Name","value":"providers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"provider"}}]}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"display_name"}}]}}]}}]}}]} as unknown as DocumentNode<GetMeQuery, GetMeQueryVariables>;