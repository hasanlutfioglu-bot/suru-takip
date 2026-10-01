import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "jsr:@supabase/supabase-js@2.117.2";
import {verifyPushIdentity} from "../_shared/push-auth.ts";
import {PACKAGE_NAME,googleAccessToken,tokenHash,paidPeriod} from "../_shared/play.ts";
Deno.serve(async(req:Request)=>{
 const reply=(body:any,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
 if(req.method!=='POST')return reply({error:'method_not_allowed'},405);
 const audience=Deno.env.get('PLAY_RTDN_AUDIENCE'),email=Deno.env.get('PLAY_RTDN_SERVICE_ACCOUNT_EMAIL'),raw=Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON');
 // Missing configuration keeps this endpoint closed, never accepting unsigned pushes.
 if(!audience||!email||!raw)return reply({error:'not_configured'},503);
 const auth=req.headers.get('Authorization')||'';
 if(!auth.startsWith('Bearer ')||!await verifyPushIdentity(auth.slice(7),audience,email))return reply({error:'unauthorized'},401);
 try{
  if(+(req.headers.get('Content-Length')||0)>65536)return reply({error:'payload_too_large'},413);
  const text=await req.text();if(text.length>65536)return reply({error:'payload_too_large'},413);
  const envelope=JSON.parse(text),encoded=envelope?.message?.data;
  if(typeof encoded!=='string'||encoded.length>48000)return reply({error:'invalid_notification'},400);
  const notification=JSON.parse(atob(encoded));
  if(notification.packageName!==PACKAGE_NAME)return reply({error:'wrong_package'},400);
  if(notification.testNotification)return reply({ok:true,test:true});
  const token=notification.subscriptionNotification?.purchaseToken||notification.voidedPurchaseNotification?.purchaseToken;
  if(typeof token!=='string'||!token||token.length>4096)return reply({ok:true,ignored:true});
  const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const hash=await tokenHash(token);
  const {data:claim,error:claimError}=await admin.from('play_purchase_claims').select('farm_id,product_id,superseded_by').eq('token_hash',hash).maybeSingle();
  if(claimError)throw claimError;
  if(!claim||claim.superseded_by)return reply({ok:true,ignored:true});
  // Read current Google state rather than trusting event order or notificationType.
  const checkedAt=new Date().toISOString(),access=await googleAccessToken(JSON.parse(raw));
  const response=await fetch('https://androidpublisher.googleapis.com/androidpublisher/v3/applications/'+PACKAGE_NAME+'/purchases/subscriptionsv2/tokens/'+encodeURIComponent(token),{headers:{Authorization:'Bearer '+access}});
  if(!response.ok)return reply({error:'verification_unavailable'},503);
  const purchase=await response.json(),expiry=paidPeriod(purchase,claim.product_id);
  const {data,error}=await admin.rpc('apply_play_entitlement',{p_farm_id:claim.farm_id,p_hash:hash,p_product:claim.product_id,p_expiry:expiry,p_active:!!expiry,p_linked_hash:purchase.linkedPurchaseToken?await tokenHash(String(purchase.linkedPurchaseToken)):null,p_checked_at:checkedAt});
  if(error)throw error;
  if(!data?.ok)return reply({error:'entitlement_failed'},503);
  return reply({ok:true});
 }catch(e){return reply({error:'notification_failed'},503)}
});
