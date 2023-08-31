/**
 * New migrations should be added at the end
 */
export const createMigrations = (props: { schema: string }): string[] => {
  return [
    `
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    
    CREATE OR REPLACE FUNCTION "${props.schema}"."set_current_timestamp_updated_at"()
    RETURNS TRIGGER AS $$
    DECLARE
      _new record;
    BEGIN
      _new := NEW;
      _new."updated_at" = NOW();
      RETURN _new;
    END;
    $$ LANGUAGE plpgsql;

    -- main table that contains the account
    CREATE TABLE "${props.schema}"."accounts" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      "version" integer NOT NULL DEFAULT 1,
      "disabled" boolean DEFAULT false NOT NULL,
      "token_version" integer NOT NULL DEFAULT 1, 
      "updated_at" timestamptz NOT NULL DEFAULT now(), 
      "created_at" timestamptz NOT NULL DEFAULT now()
    );

    CREATE TRIGGER set_accounts_updated_at
      BEFORE UPDATE ON ${props.schema}.accounts
      FOR EACH ROW
      EXECUTE FUNCTION ${props.schema}.set_current_timestamp_updated_at ();

    -- table that contains (public) account info
    CREATE TABLE "${props.schema}"."account_info" (
      id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      account_id uuid NOT NULL,
      display_name text DEFAULT 'anonymous' NOT NULl,
      avatar_url text,
      locale varchar(2) DEFAULT 'en' NOT NULL,
      extra_data jsonb,
      "updated_at" timestamptz NOT NULL DEFAULT now(), 
      created_at timestamptz DEFAULT now() NOT NULL,
      UNIQUE (account_id),
      FOREIGN KEY (account_id) REFERENCES ${props.schema}.accounts (id) ON UPDATE CASCADE ON DELETE CASCADE
    );

    CREATE TRIGGER set_account_info_updated_at
      BEFORE UPDATE ON ${props.schema}.account_info
      FOR EACH ROW
      EXECUTE FUNCTION ${props.schema}.set_current_timestamp_updated_at ();

    CREATE TABLE ${props.schema}.providers (
      value text PRIMARY KEY,
      comment text
    );

    INSERT INTO ${props.schema}.providers (value, comment)
      VALUES
        ('email', null),
        ('phone', null),
        ('github', null),
        ('twitter', null),
        ('google', null),
        ('microsoft', null),
        ('linkedin', null);

    CREATE TABLE "${props.schema}"."account_providers" (
      id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      account_id uuid NOT NULL,
      provider text NOT NULL,
      provider_account_id text NOT NULL,
      "updated_at" timestamptz NOT NULL DEFAULT now(),
      created_at timestamptz DEFAULT now() NOT NULL,
      UNIQUE (provider, provider_account_id),
      FOREIGN KEY (account_id) REFERENCES ${props.schema}.accounts (id) ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY (provider) REFERENCES ${props.schema}.providers (value) ON UPDATE CASCADE ON DELETE RESTRICT
    );

    CREATE UNIQUE INDEX idx_providers_acc_id_provider ON "${props.schema}"."account_providers" (account_id, provider);

    CREATE TRIGGER set_account_providers_updated_at
      BEFORE UPDATE ON ${props.schema}.account_providers
      FOR EACH ROW
      EXECUTE FUNCTION ${props.schema}.set_current_timestamp_updated_at();

    CREATE OR REPLACE FUNCTION "${props.schema}".get_me(hasura_session json) 
      RETURNS SETOF "${props.schema}".accounts
      LANGUAGE sql
      STABLE
    AS $function$
        SELECT * FROM "${props.schema}".accounts WHERE id = (hasura_session ->> 'x-hasura-user-id')::uuid
    $function$;

    -- table that contains requests
    CREATE TABLE "${props.schema}"."code_challenge" (
      -- this is used as token id
      "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      -- hashed value
      "code_challenge" text not null,
      "account_id" uuid not null,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      FOREIGN KEY (account_id) REFERENCES ${props.schema}.accounts (id) ON UPDATE CASCADE ON DELETE CASCADE
    );

    -- table that contains requests
    CREATE TABLE "${props.schema}"."otp" (
      -- this is used as token
      "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      -- email/number/other that is used to validate
      "type" text not null,
      "value" text not null,
      "created_at" timestamptz NOT NULL DEFAULT now()
    );
    `,
  ];
};
