-- Run inside a rollback transaction. Only synthetic fixture accounts are touched.
do $$
declare uid1 uuid:=gen_random_uuid();uid2 uuid:=gen_random_uuid();fid1 uuid;fid2 uuid;r jsonb;h1 text:=md5(gen_random_uuid()::text)||md5(gen_random_uuid()::text);h2 text:=md5(gen_random_uuid()::text)||md5(gen_random_uuid()::text);h3 text:=md5(gen_random_uuid()::text)||md5(gen_random_uuid()::text);
begin
 insert into auth.users(id,email,raw_user_meta_data,created_at,updated_at) values(uid1,'audit-'||uid1||'@example.invalid','{}',now(),now()),(uid2,'audit-'||uid2||'@example.invalid','{}',now(),now());
 select id into fid1 from public.farms where owner_id=uid1 limit 1;
 select id into fid2 from public.farms where owner_id=uid2 limit 1;
 if fid1 is null or fid2 is null then raise exception 'Fixture farm provisioning failed';end if;
 r:=public.apply_play_entitlement(fid1,h1,'suru_pro_monthly',now()+interval '30 days',true,null,now());
 if not (r->>'ok')::boolean then raise exception 'Initial grant failed';end if;
 r:=public.apply_play_entitlement(fid2,h1,'suru_pro_monthly',now()+interval '30 days',true,null,now());
 if r->>'error'<>'purchase_already_linked' then raise exception 'Cross-farm purchase was accepted';end if;
 r:=public.apply_play_entitlement(fid2,h3,'suru_pro_monthly',now()+interval '30 days',true,h1,now());
 if r->>'error'<>'purchase_already_linked' or exists(select 1 from public.play_purchase_claims where token_hash=h3) then raise exception 'Linked-token check poisoned token ownership';end if;
 r:=public.apply_play_entitlement(fid1,h2,'suru_pro_yearly',now()+interval '365 days',true,h1,now()+interval '1 second');
 if not (r->>'ok')::boolean then raise exception 'Upgrade failed';end if;
 r:=public.apply_play_entitlement(fid1,h1,'suru_pro_monthly',now()+interval '30 days',true,null,now()+interval '2 seconds');
 if r->>'error'<>'purchase_superseded' then raise exception 'Superseded purchase reactivated';end if;
 r:=public.apply_play_entitlement(fid1,h2,'suru_pro_yearly',null,false,null,now()-interval '1 day');
 if not (r->>'ignored')::boolean or (select plan from public.subscriptions where farm_id=fid1)<>'pro' then raise exception 'Stale notification revoked new entitlement';end if;
 r:=public.apply_play_entitlement(fid1,h2,'suru_pro_yearly',null,false,null,now()+interval '3 seconds');
 if (select plan from public.subscriptions where farm_id=fid1)<>'free' then raise exception 'Expiry did not revoke entitlement';end if;
 if has_function_privilege('authenticated','public.delete_account_data(uuid)','EXECUTE') or has_function_privilege('anon','public.apply_play_entitlement(uuid,text,text,timestamptz,boolean,text,timestamptz)','EXECUTE') then raise exception 'Privileged RPC exposed';end if;
 insert into public.farm_members(farm_id,user_id,role) values(fid1,uid2,'viewer');
 r:=public.delete_account_data(uid1);
 if r->>'error'<>'shared_farm' or not exists(select 1 from auth.users where id=uid1) then raise exception 'Shared farm deletion protection failed';end if;
 delete from public.farm_members where farm_id=fid1 and user_id=uid2;
 r:=public.delete_account_data(uid1);
 if not (r->>'ok')::boolean or exists(select 1 from public.farms where id=fid1) or exists(select 1 from public.play_purchase_claims where farm_id=fid1) or exists(select 1 from public.play_entitlements where farm_id=fid1) or exists(select 1 from public.profiles where id=uid1) then raise exception 'Account cascade failed';end if;
 if not exists(select 1 from auth.users where id=uid2) or not exists(select 1 from public.farms where id=fid2) then raise exception 'Unrelated account changed';end if;
end;
$$;
