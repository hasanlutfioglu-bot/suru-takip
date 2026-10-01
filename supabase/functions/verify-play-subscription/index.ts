import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.117.2";

import {PACKAGE_NAME,ALLOWED_PRODUCTS,googleAccessToken,acknowledge,tokenHash,paidPeriod} from "../_shared/play.ts";

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
    const checkedAt=new Date().toISOString();
    const access=await googleAccessToken(sa);
    const url="https://androidpublisher.googleapis.com/androidpublisher/v3/applications/"+PACKAGE_NAME+"/purchases/subscriptionsv2/tokens/"+encodeURIComponent(token);
    const vr=await fetch(url,{headers:{Authorization:"Bearer "+access}});
    if(!vr.ok)return new Response(JSON.stringify({error:"verification_failed",status:vr.status}),{status:400,headers:cors});
    const purchase=await vr.json();
    const expiry=paidPeriod(purchase,productId);
    if(!expiry)return new Response(JSON.stringify({error:"not_active"}),{status:400,headers:cors});

    const {data:member,error:memberErr}=await userClient.from("farm_members").select("farm_id,role").eq("user_id",user.id).order("created_at",{ascending:true}).limit(1).maybeSingle();
    if(memberErr||!member?.farm_id)return new Response(JSON.stringify({error:"farm_not_found"}),{status:404,headers:cors});
    if(member.role!=="owner")return new Response(JSON.stringify({error:"owner_required"}),{status:403,headers:cors});

    const admin=createClient(supabaseUrl,service);
    const {data:entitlement,error:grantError}=await admin.rpc("apply_play_entitlement",{
      p_farm_id:member.farm_id,p_hash:await tokenHash(token),p_product:productId,p_expiry:expiry,p_active:true,
      p_linked_hash:purchase.linkedPurchaseToken?await tokenHash(String(purchase.linkedPurchaseToken)):null,p_checked_at:checkedAt
    });
    if(grantError)throw grantError;
    if(!entitlement?.ok)return new Response(JSON.stringify({error:entitlement?.error||"purchase_already_linked"}),{status:409,headers:cors});
    if(String(purchase.acknowledgementState||"")==="ACKNOWLEDGEMENT_STATE_PENDING")await acknowledge(access,productId,token);
    return new Response(JSON.stringify({ok:true,plan:"pro",status:"active",current_period_end:entitlement.current_period_end||expiry}),{headers:cors});
  }catch(e){
    return new Response(JSON.stringify({error:"server_error",message:"Satın alma doğrulanamadı. Daha sonra geri yüklemeyi dene."}),{status:500,headers:cors});
  }
});
