import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Json = ColumnType<JsonValue, string, string>;

export type JsonArray = JsonValue[];

export type JsonObject = {
  [K in string]?: JsonValue;
};

export type JsonPrimitive = boolean | null | number | string;

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface _Migrations {
  id: number;
  name: string;
  hash: string;
  created_at: Generated<Timestamp>;
}

export interface AccountInfo {
  id: Generated<string>;
  account_id: string;
  display_name: Generated<string>;
  avatar_url: string | null;
  locale: Generated<string>;
  extra_data: Json | null;
  updated_at: Generated<Timestamp>;
  created_at: Generated<Timestamp>;
}

export interface AccountProviders {
  id: Generated<string>;
  account_id: string;
  provider: string;
  provider_account_id: string;
  updated_at: Generated<Timestamp>;
  created_at: Generated<Timestamp>;
}

export interface Accounts {
  id: Generated<string>;
  version: Generated<number>;
  disabled: Generated<boolean>;
  token_version: Generated<number>;
  updated_at: Generated<Timestamp>;
  created_at: Generated<Timestamp>;
}

export interface CodeChallenge {
  id: Generated<string>;
  code_challenge: string;
  account_id: string;
  created_at: Generated<Timestamp>;
}

export interface Otp {
  id: Generated<string>;
  type: string;
  value: string;
  created_at: Generated<Timestamp>;
}

export interface Providers {
  value: string;
  comment: string | null;
}

export interface DB {
  _migrations: _Migrations;
  account_info: AccountInfo;
  account_providers: AccountProviders;
  accounts: Accounts;
  code_challenge: CodeChallenge;
  otp: Otp;
  providers: Providers;
}
