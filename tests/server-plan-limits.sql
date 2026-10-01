-- Rollback-only fixtures verify the database trigger, including downgrade retention.
do $$
declare uid uuid:=gen_random_uuid();fid uuid;state jsonb;failed boolean:=false;
begin
 insert into auth.users(id,email,raw_user_meta_data,created_at,updated_at) values(uid,'quota-'||uid||'@example.invalid','{}',now(),now());
 select id into fid from public.farms where owner_id=uid limit 1;
 update public.subscriptions set plan='free',status='canceled',trial_ends_at=null where farm_id=fid;
 select jsonb_build_object('animals',jsonb_agg(jsonb_build_object('id',i::text,'type','Koyun','sex','Dişi','status','Aktif')),'records','[]'::jsonb) into state from generate_series(1,21) i;
 begin update public.farm_state set data=state where farm_id=fid;exception when check_violation then failed:=true;end;
 if not failed then raise exception 'Free animal quota bypassed';end if;
 update public.subscriptions set plan='pro',status='active',current_period_end=now()+interval '1 day' where farm_id=fid;
 update public.farm_state set data=state where farm_id=fid;
 update public.subscriptions set plan='free',status='canceled' where farm_id=fid;
 update public.farm_state set data=jsonb_set(state,'{farmName}','"Name edit"') where farm_id=fid;
 failed:=false;
 begin update public.farm_state set data=jsonb_set(state,'{animals}',(state->'animals')||jsonb_build_array(jsonb_build_object('id','22','status','Aktif'))) where farm_id=fid;exception when check_violation then failed:=true;end;
 if not failed then raise exception 'Downgraded user exceeded existing count';end if;
 select jsonb_build_object('animals','[]'::jsonb,'records',jsonb_agg(jsonb_build_object('id',i::text,'kind','expense','amount',1,'date','2025-03-01'))) into state from generate_series(1,11) i;
 failed:=false;
 begin update public.farm_state set data=state where farm_id=fid;exception when check_violation then failed:=true;end;
 if not failed then raise exception 'Backdated finance quota bypassed';end if;
 update public.farm_state set data=jsonb_build_object('animals','[]'::jsonb,'records',jsonb_build_array(jsonb_build_object('id','r','kind','expense','amount',1,'date','2025-03-01'))) where farm_id=fid;
 update public.subscriptions set plan='pro',status='trialing',trial_ends_at=now()+interval '1 day' where farm_id=fid;
 update public.farm_state set data=state where farm_id=fid;
end;
$$;
