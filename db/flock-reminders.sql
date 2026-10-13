-- Additive notification configuration; no farm_state changes.
create table if not exists public.flock_push_config (
 id boolean primary key default true check(id),
 public_key text,
 private_key text,
 cron_token text not null default encode(extensions.gen_random_bytes(32),'hex')
);
alter table public.flock_push_config enable row level security;
revoke all on public.flock_push_config from public,anon,authenticated;
grant select,insert,update,delete on public.flock_push_config to service_role;
insert into public.flock_push_config(id) values(true) on conflict do nothing;
create table if not exists public.flock_push_subscriptions (
 id text primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 farm_id uuid not null references public.farms(id) on delete cascade,
 endpoint text not null unique,
 subscription jsonb not null,
 timezone text not null default 'Europe/Nicosia',
 hour integer not null default 8 check(hour between 0 and 23),
 language text not null default 'tr' check(language in ('tr','en')),
 enabled boolean not null default true,
 last_sent_date date,
 last_test_at timestamptz,
 updated_at timestamptz not null default now()
);
alter table public.flock_push_subscriptions enable row level security;
revoke all on public.flock_push_subscriptions from public,anon,authenticated;
grant select,insert,update,delete on public.flock_push_subscriptions to service_role;
create index if not exists flock_push_user on public.flock_push_subscriptions(user_id);
create index if not exists flock_push_farm on public.flock_push_subscriptions(farm_id);
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
select cron.schedule('flock-daily-reminders','0 * * * *',$job$
 select net.http_post(
  url:='https://nqbfyahiijdkrroojlct.supabase.co/functions/v1/flock-reminders',
  headers:=jsonb_build_object('Content-Type','application/json','x-flock-cron',(select cron_token from public.flock_push_config where id)),
  body:='{}'::jsonb,
  timeout_milliseconds:=60000
 );
$job$);
