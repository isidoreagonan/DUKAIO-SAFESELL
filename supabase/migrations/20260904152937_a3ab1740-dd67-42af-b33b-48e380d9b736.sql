CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT vault.create_secret('1b399c2f29e153c38cae376aa71c6938a937abbb9edb8735', 'cron_relances_secret', 'Clé d''appel de la tâche de relances marketing');

SELECT cron.schedule(
  'dukaio-relances-marketing',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--9936554f-0467-4151-9e42-5da679e058e9.lovable.app/api/public/cron/relances',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_relances_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);