export const PACKAGE_NAME = "com.hasanlutfioglu.surutakip";
export const ALLOWED_PRODUCTS = new Set(["suru_pro_monthly","suru_pro_yearly"]);

function b64url(input: Uint8Array | string) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let s = ""; for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function pemToBytes(pem:string){
  const b64=pem.replace(/-----BEGIN PRIVATE KEY-----/g,"").replace(/-----END PRIVATE KEY-----/g,"").replace(/\s+/g,"");
  const raw=atob(b64); return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
export async function googleAccessToken(sa:any){
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
export async function acknowledge(access:string,productId:string,token:string){
  const u="https://androidpublisher.googleapis.com/androidpublisher/v3/applications/"+PACKAGE_NAME+"/purchases/subscriptions/"+encodeURIComponent(productId)+"/tokens/"+encodeURIComponent(token)+":acknowledge";
  const r=await fetch(u,{method:"POST",headers:{Authorization:"Bearer "+access,"content-type":"application/json"},body:"{}"});
  if(!r.ok)throw new Error("Satın alma onaylanamadı");
}

export async function tokenHash(token:string){
  const bytes=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token)));
  return Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
}

export function paidPeriod(purchase:any,productId:string){
 const active=["SUBSCRIPTION_STATE_ACTIVE","SUBSCRIPTION_STATE_IN_GRACE_PERIOD","SUBSCRIPTION_STATE_CANCELED"].includes(purchase.subscriptionState);
 const times=(Array.isArray(purchase.lineItems)?purchase.lineItems:[]).filter((x:any)=>x.productId===productId).map((x:any)=>Date.parse(x.expiryTime)).filter((t:number)=>Number.isFinite(t)&&t>Date.now());
 return active&&times.length?new Date(Math.max(...times)).toISOString():null;
}
