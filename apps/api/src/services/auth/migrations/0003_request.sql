-- table that contains requests
CREATE TABLE "{{schema}}"."requests" (
  -- this is used as token id
  "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "account_id" uuid not null,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (account_id) REFERENCES {{schema}}.accounts (id) ON UPDATE CASCADE ON DELETE CASCADE
);
