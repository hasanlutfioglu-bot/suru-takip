-- Server-only purchase claims prevent reuse across farms. No raw Play tokens are stored.
create table if not exists public.play_purchase_claims (
 token_hash text primary key check (token_hash ~ '^[a-f0-9]{64}$'),
 farm_id uuid not null references public.farms(id) on delete cascade,
 product_id text not null check (product_id in ('suru_pro_monthly','suru_pro_yearly')),
 created_at timestamptz not null default now()
);
alter table public.play_purchase_claims enable row level security;
revoke all on public.play_purchase_claims from public, anon, authenticated;
grant select, insert, update, delete on public.play_purchase_claims to service_role;
create index if not exists play_purchase_claims_farm_idx on public.play_purchase_claims(farm_id);
