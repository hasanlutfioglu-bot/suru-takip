import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.117.2";

const PACKAGE_NAME = "com.hasanlutfioglu.surutakip";
const ALLOWED_PRODUCTS = new Set(["suru_pro_monthly","suru_pro_yearly"]);

function b64url(input: Uint8Array | string) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let s = ""; for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function pemToBytes(pem:string){
  const b64=pem.replace(/-----BEGIN PRIVATE KEY-----/g,"").replace(/-----END PRIVATE KEY-----/g,"").replace(/\s+/g,"");
  const raw=atob(b64); return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
async function googleAccessToken(sa:any){
  const now=Math.floor(Date.now()/1000);
  const header=b64url(JSON.stringify({alg:"RS256",typ:"JWT"}));
  const payload=b64url(JSON.stringify({iss:sa.client_email,scope:"https://www.googleapis.com/auth/androidpublisher",aud:"https://oauth2.googleapis.com/token",iat:now,exp:now+3600}));
  const key=await crypto.subtle.importKey("pkcs8",pemToBytes(sa.private_key),{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["sign"]);
  const sig=new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5",key,new TextEncoder().encode(header+"."+payload)));
  const assertion=header+"."+payload+"."+b64url(sig);
  const body=new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion});
  const r=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body});
  if(!r.ok)throw new Error("Google yetkilendirme başarısız");
  return (await r.json()).access_token;
}
async function acknowledge(access:string,productId:string,token:string){
  const u="https://androidpublisher.googleapis.com/androidpublisher/v3/applications/"+PACKAGE_NAME+"/purchases/subscriptions/"+encodeURIComponent(productId)+"/tokens/"+encodeURIComponent(token)+":acknowledge";
  const r=await fetch(u,{method:"POST",headers:{Authorization:"Bearer "+access,"content-type":"application/json"},body:"{}"});
  if(!r.ok)throw new Error("Satın alma onaylanamadı");
}

async function tokenHash(token:string){
  const bytes=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token)));
  return Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
}
Deno.serve(async (req:Request)=>{
  const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Content-Type":"application/json"};
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers:cors});
  try{
    const auth=req.headers.get("Authorization")||"";
    if(!auth.startsWith("Bearer "))return new Response(JSON.stringify({error:"unauthorized"}),{status:401,headers:cors});
    const supabaseUrl=Deno.env.get("SUPABASE_URL")!;
    const anon=Deno.env.get("SUPABASE_ANON_KEY")!;
    const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient=createClient(supabaseUrl,anon,{global:{headers:{Authorization:auth}}});
    const {data:{user},error:userErr}=await userClient.auth.getUser();
    if(userErr||!user)return new Response(JSON.stringify({error:"unauthorized"}),{status:401,headers:cors});

    const raw=Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON");
    const configured=!!raw;
    const body=await req.json().catch(()=>({}));
    if(body.action==="health")return new Response(JSON.stringify({configured}),{headers:cors});
    if(!configured)return new Response(JSON.stringify({error:"billing_not_configured"}),{status:503,headers:cors});

    const token=String(body.purchaseToken||"");
    const productId=String(body.productId||"");
    if(!token||token.length>4096||!ALLOWED_PRODUCTS.has(productId))return new Response(JSON.stringify({error:"invalid_request"}),{status:400,headers:cors});

    const sa=JSON.parse(raw!);
    const access=await googleAccessToken(sa);
    const url="https://androidpublisher.googleapis.com/androidpublisher/v3/applications/"+PACKAGE_NAME+"/purchases/subscriptionsv2/tokens/"+encodeURIComponent(token);
    const vr=await fetch(url,{headers:{Authorization:"Bearer "+access}});
    if(!vr.ok)return new Response(JSON.stringify({error:"verification_failed",status:vr.status}),{status:400,headers:cors});
    const purchase=await vr.json();
    const state=String(purchase.subscriptionState||"");
    const active=["SUBSCRIPTION_STATE_ACTIVE","SUBSCRIPTION_STATE_IN_GRACE_PERIOD","SUBSCRIPTION_STATE_CANCELED"].includes(state);
    const lineItems=Array.isArray(purchase.lineItems)?purchase.lineItems:[];
    const expiry=lineItems.filter((x:any)=>x.productId===productId).map((x:any)=>x.expiryTime).filter((x:any)=>Number.isFinite(Date.parse(x))).sort().at(-1)||null;
    if(!active||!expiry||Date.parse(expiry)<=Date.now())return new Response(JSON.stringify({error:"not_active"}),{status:400,headers:cors});

    const {data:member,error:memberErr}=await userClient.from("farm_members").select("farm_id,role").eq("user_id",user.id).order("created_at",{ascending:true}).limit(1).maybeSingle();
    if(memberErr||!member?.farm_id)return new Response(JSON.stringify({error:"farm_not_found"}),{status:404,headers:cors});
    if(member.role!=="owner")return new Response(JSON.stringify({error:"owner_required"}),{status:403,headers:cors});

    const admin=createClient(supabaseUrl,service),hash=await tokenHash(token);
    // A unique purchase can activate exactly one farm. A restore by that farm is idempotent.
    if(purchase.linkedPurchaseToken){
      const linkedHash=await tokenHash(String(purchase.linkedPurchaseToken));
      const {data:linked,error:linkedError}=await admin.from("play_purchase_claims").select("farm_id").eq("token_hash",linkedHash).maybeSingle();
      if(linkedError)throw linkedError;
      if(linked&&linked.farm_id!==member.farm_id)return new Response(JSON.stringify({error:"purchase_already_linked"}),{status:409,headers:cors});
    }
    const {error:claimError}=await admin.from("play_purchase_claims").upsert({token_hash:hash,farm_id:member.farm_id,product_id:productId},{onConflict:"token_hash",ignoreDuplicates:true});
    if(claimError)throw claimError;
    const {data:claim,error:claimReadError}=await admin.from("play_purchase_claims").select("farm_id,product_id").eq("token_hash",hash).single();
    if(claimReadError)throw claimReadError;
    if(claim.farm_id!==member.farm_id||claim.product_id!==productId)return new Response(JSON.stringify({error:"purchase_already_linked"}),{status:409,headers:cors});

    const {error:upErr}=await admin.from("subscriptions").upsert({
      farm_id:member.farm_id,plan:"pro",status:"active",trial_ends_at:null,current_period_end:expiry
    },{onConflict:"farm_id"});
    if(upErr)throw upErr;
    if(String(purchase.acknowledgementState||"")==="ACKNOWLEDGEMENT_STATE_PENDING")await acknowledge(access,productId,token);
    return new Response(JSON.stringify({ok:true,plan:"pro",status:"active",current_period_end:expiry}),{headers:cors});
  }catch(e){
    return new Response(JSON.stringify({error:"server_error",message:"Satın alma doğrulanamadı. Daha sonra geri yüklemeyi dene."}),{status:500,headers:cors});
  }
});
