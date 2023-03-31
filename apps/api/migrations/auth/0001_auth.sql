

CREATE OR REPLACE FUNCTION "{{schema}}"."set_current_timestamp_updated_at"()
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
CREATE TABLE "{{schema}}"."accounts" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "version" integer NOT NULL DEFAULT 1,
  "disabled" boolean DEFAULT false NOT NULL,
  "token_version" integer NOT NULL DEFAULT 1, 
  "updated_at" timestamptz NOT NULL DEFAULT now(), 
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_accounts_updated_at
  BEFORE UPDATE ON {{schema}}.accounts
  FOR EACH ROW
  EXECUTE FUNCTION {{schema}}.set_current_timestamp_updated_at ();

-- table that contains (public) account info
CREATE TABLE "{{schema}}"."account_info" (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  account_id uuid NOT NULL,
  display_name text DEFAULT '' NOT NULl,
  avatar_url text DEFAULT '' NOT NULL,
  locale varchar(2) NOT NULL,
  extra_data jsonb,
  "updated_at" timestamptz NOT NULL DEFAULT now(), 
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (account_id),
  FOREIGN KEY (account_id) REFERENCES {{schema}}.accounts (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TRIGGER set_account_info_updated_at
  BEFORE UPDATE ON {{schema}}.account_info
  FOR EACH ROW
  EXECUTE FUNCTION {{schema}}.set_current_timestamp_updated_at ();

CREATE TABLE {{schema}}.providers (
  value text PRIMARY KEY,
  comment text
);

INSERT INTO {{schema}}.providers (value, comment)
  VALUES
    ('email', null),
    ('github', null),
    ('twitter', null),
    ('google', null),
    ('microsoft', null),
    ('linkedin', null);

CREATE TABLE "{{schema}}"."account_providers" (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  account_id uuid NOT NULL,
  provider text NOT NULL,
  provider_account_id text NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (provider, provider_account_id),
  FOREIGN KEY (account_id) REFERENCES {{schema}}.accounts (id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (provider) REFERENCES {{schema}}.providers (value) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE UNIQUE INDEX idx_providers_acc_id_provider ON "{{schema}}"."account_providers" (account_id, provider);

CREATE TRIGGER set_account_providers_updated_at
  BEFORE UPDATE ON {{schema}}.account_providers
  FOR EACH ROW
  EXECUTE FUNCTION {{schema}}.set_current_timestamp_updated_at ();
