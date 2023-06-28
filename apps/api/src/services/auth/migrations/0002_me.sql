CREATE OR REPLACE FUNCTION "{{schema}}".get_me(hasura_session json) 
  RETURNS SETOF "{{schema}}".accounts
  LANGUAGE sql
  STABLE
AS $function$
    SELECT * FROM "{{schema}}".accounts WHERE id = (hasura_session ->> 'x-hasura-user-id')::uuid
$function$;