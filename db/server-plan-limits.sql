-- Enforce increased Free usage at the authoritative farm-state write boundary.
-- Existing over-limit data remains readable/editable without forced deletion.
create or replace function public.enforce_farm_plan_limits() returns trigger
language plpgsql security definer set search_path = '' as $$
declare paid boolean;new_active integer;old_active integer:=0;previous jsonb:='{"animals":[],"records":[]}'::jsonb;exceeded boolean;
begin
 if tg_op='INSERT' and new.data='{}'::jsonb then return new;end if;
 if jsonb_typeof(new.data->'animals') is distinct from 'array' or jsonb_typeof(new.data->'records') is distinct from 'array' then
  raise exception 'Invalid farm state' using errcode='23514';
 end if;
 select coalesce((s.plan in ('pro','plus') and s.status='active' and (s.current_period_end is null or s.current_period_end>now()))
    or (s.status='trialing' and s.trial_ends_at>now()),false) into paid from public.subscriptions s where s.farm_id=new.farm_id;
 if coalesce(paid,false) then return new;end if;
 if tg_op='UPDATE' then previous:=old.data;end if;
 select count(*) into new_active from jsonb_array_elements(new.data->'animals') a where coalesce(a->>'status','Aktif') not in ('Satıldı','Öldü','Kesildi');
 select count(*) into old_active from jsonb_array_elements(coalesce(previous->'animals','[]'::jsonb)) a where coalesce(a->>'status','Aktif') not in ('Satıldı','Öldü','Kesildi');
 if new_active>20 and new_active>old_active then raise exception 'FREE_ANIMAL_LIMIT' using errcode='23514';end if;
 with n as(select left(r->>'date',7) as month,count(*) as total from jsonb_array_elements(new.data->'records') r
  where r->>'kind' in ('income','expense','sale','stock') group by left(r->>'date',7)),
 o as(select left(r->>'date',7) as month,count(*) as total from jsonb_array_elements(coalesce(previous->'records','[]'::jsonb)) r
  where r->>'kind' in ('income','expense','sale','stock') group by left(r->>'date',7))
 select exists(select 1 from n left join o on n.month is not distinct from o.month where n.total>10 and n.total>coalesce(o.total,0)) into exceeded;
 if exceeded then raise exception 'FREE_FINANCE_LIMIT' using errcode='23514';end if;
 return new;
end;
$$;
revoke all on function public.enforce_farm_plan_limits() from public,anon,authenticated;
drop trigger if exists enforce_farm_plan_limits on public.farm_state;
create trigger enforce_farm_plan_limits before insert or update of data on public.farm_state for each row execute function public.enforce_farm_plan_limits();
