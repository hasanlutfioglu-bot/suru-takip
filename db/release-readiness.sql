-- Privileged operations are only callable by the verified server functions.
alter table public.play_purchase_claims add column if not exists superseded_by text;
create table if not exists public.play_entitlements (
 farm_id uuid primary key references public.farms(id) on delete cascade,
 token_hash text not null references public.play_purchase_claims(token_hash),
 product_id text not null,
 current_period_end timestamptz,
 checked_at timestamptz not null
);
alter table public.play_entitlements enable row level security;
revoke all on public.play_entitlements from public,anon,authenticated;
grant select,insert,update,delete on public.play_entitlements to service_role;
create index if not exists play_entitlements_token_idx on public.play_entitlements(token_hash);

-- Existing validated purchases are carried forward without changing subscription access.
insert into public.play_entitlements(farm_id,token_hash,product_id,current_period_end,checked_at)
select distinct on(c.farm_id) c.farm_id,c.token_hash,c.product_id,s.current_period_end,now()
from public.play_purchase_claims c join public.subscriptions s on s.farm_id=c.farm_id
where c.superseded_by is null
order by c.farm_id,c.created_at desc
on conflict(farm_id) do nothing;

create or replace function public.apply_play_entitlement(
 p_farm_id uuid,p_hash text,p_product text,p_expiry timestamptz,p_active boolean,
 p_linked_hash text default null,p_checked_at timestamptz default now()
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare claim public.play_purchase_claims; linked public.play_purchase_claims; current_ent public.play_entitlements;
begin
 if p_hash is null or p_product is null or p_active is null or p_hash !~ '^[a-f0-9]{64}$' or p_product not in ('suru_pro_monthly','suru_pro_yearly')
    or p_checked_at is null or (p_active and (p_expiry is null or p_expiry<=now())) then
  return jsonb_build_object('ok',false,'error','invalid_purchase');
 end if;
 perform 1 from public.farms where id=p_farm_id for update;
 if not found then return jsonb_build_object('ok',false,'error','farm_not_found');end if;
 if p_linked_hash is not null then
  select * into linked from public.play_purchase_claims where token_hash=p_linked_hash for update;
  if found and linked.farm_id<>p_farm_id then return jsonb_build_object('ok',false,'error','purchase_already_linked');end if;
 end if;
 insert into public.play_purchase_claims(token_hash,farm_id,product_id) values(p_hash,p_farm_id,p_product) on conflict(token_hash) do nothing;
 select * into claim from public.play_purchase_claims where token_hash=p_hash for update;
 if claim.farm_id<>p_farm_id or claim.product_id<>p_product then return jsonb_build_object('ok',false,'error','purchase_already_linked');end if;
 if claim.superseded_by is not null then return jsonb_build_object('ok',false,'error','purchase_superseded');end if;
 select * into current_ent from public.play_entitlements where farm_id=p_farm_id for update;
 if found and p_checked_at<current_ent.checked_at then return jsonb_build_object('ok',true,'ignored',true,'current_period_end',current_ent.current_period_end);end if;
 if not p_active and (current_ent.token_hash is null or current_ent.token_hash<>p_hash) then return jsonb_build_object('ok',true,'ignored',true);end if;
 if p_active and current_ent.token_hash<>p_hash and current_ent.current_period_end>p_expiry and p_linked_hash is distinct from current_ent.token_hash then
  return jsonb_build_object('ok',true,'ignored',true,'current_period_end',current_ent.current_period_end);
 end if;
 if p_active and p_linked_hash is not null and p_linked_hash<>p_hash then
  update public.play_purchase_claims set superseded_by=p_hash where token_hash=p_linked_hash and farm_id=p_farm_id;
 end if;
 insert into public.play_entitlements(farm_id,token_hash,product_id,current_period_end,checked_at)
 values(p_farm_id,p_hash,p_product,p_expiry,p_checked_at)
 on conflict(farm_id) do update set token_hash=excluded.token_hash,product_id=excluded.product_id,current_period_end=excluded.current_period_end,checked_at=excluded.checked_at;
 insert into public.subscriptions(farm_id,plan,status,trial_ends_at,current_period_end,billing_provider,product_id)
 values(p_farm_id,case when p_active then 'pro' else 'free' end,case when p_active then 'active' else 'canceled' end,null,p_expiry,'google_play',p_product)
 on conflict(farm_id) do update set plan=excluded.plan,status=excluded.status,trial_ends_at=null,current_period_end=excluded.current_period_end,billing_provider=excluded.billing_provider,product_id=excluded.product_id,updated_at=now();
 return jsonb_build_object('ok',true,'current_period_end',p_expiry);
end;
$$;
revoke all on function public.apply_play_entitlement(uuid,text,text,timestamptz,boolean,text,timestamptz) from public,anon,authenticated;
grant execute on function public.apply_play_entitlement(uuid,text,text,timestamptz,boolean,text,timestamptz) to service_role;

create or replace function public.delete_account_data(p_user_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
 perform 1 from auth.users where id=p_user_id for update;
 if not found then return jsonb_build_object('ok',false,'error','account_not_found');end if;
 -- Lock owned farms before checking membership, so deletion cannot race an invite.
 perform 1 from public.farms where owner_id=p_user_id for update;
 if exists(select 1 from public.farms f join public.farm_members m on m.farm_id=f.id where f.owner_id=p_user_id and m.user_id<>p_user_id) then
  return jsonb_build_object('ok',false,'error','shared_farm');
 end if;
 if exists(select 1 from storage.objects where owner=p_user_id) then
  return jsonb_build_object('ok',false,'error','storage_cleanup_required');
 end if;
 -- Existing FK cascades remove the profile, owned farms, farm data and sessions atomically.
 delete from auth.users where id=p_user_id;
 return jsonb_build_object('ok',true);
end;
$$;
revoke all on function public.delete_account_data(uuid) from public,anon,authenticated;
grant execute on function public.delete_account_data(uuid) to service_role;
