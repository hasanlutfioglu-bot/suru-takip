import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "jsr:@supabase/supabase-js@2.117.2";
Deno.serve(async(req:Request)=>{
 const headers={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,apikey,x-client-info,content-type","Content-Type":"application/json"};
 const reply=(body:any,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(req.method==='OPTIONS')return new Response('ok',{headers});
 if(req.method!=='POST')return reply({error:'method_not_allowed'},405);
 const auth=req.headers.get('Authorization')||'';
 if(!auth.startsWith('Bearer '))return reply({error:'unauthorized'},401);
 try{
  const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:auth}}});
  const {data:{user},error}=await client.auth.getUser();
  if(error||!user)return reply({error:'unauthorized'},401);
  const body=await req.json().catch(()=>({}));
  if(body.confirmation!=='HESABIMI SIL')return reply({error:'confirmation_required'},400);
  const signedAt=Date.parse(user.last_sign_in_at||'');
  if(!Number.isFinite(signedAt)||Date.now()-signedAt>15*60*1000)return reply({error:'reauth_required'},403);
  const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const {data,error:deleteError}=await admin.rpc('delete_account_data',{p_user_id:user.id});
  if(deleteError)return reply({error:'delete_failed'},500);
  if(!data?.ok)return reply({error:data?.error||'delete_failed'},409);
  // Auth session rows are removed by the user FK cascade; membership disappears too,
  // so an unexpired JWT cannot access former farm rows through RLS.
  return reply({ok:true});
 }catch(e){return reply({error:'delete_failed'},500)}
});
