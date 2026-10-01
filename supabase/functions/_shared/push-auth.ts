const CERTS='https://www.googleapis.com/oauth2/v3/certs';
let cachedKeys:any[]=[],keysUntil=0;
function bytes(value:string){return Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))}
export async function verifyPushIdentity(token:string,audience:string,email:string){
 try{
  if(!token||token.length>10000||!audience||!email)return false;
  const parts=token.split('.');if(parts.length!==3)return false;
  const head=JSON.parse(new TextDecoder().decode(bytes(parts[0]))),claims=JSON.parse(new TextDecoder().decode(bytes(parts[1])));
  const now=Math.floor(Date.now()/1000);
  if(head.alg!=='RS256'||typeof head.kid!=='string'||!['accounts.google.com','https://accounts.google.com'].includes(claims.iss)||claims.aud!==audience||claims.email!==email||claims.email_verified!==true||typeof claims.exp!=='number'||claims.exp<=now||typeof claims.iat!=='number'||claims.iat>now+60)return false;
  if(Date.now()>keysUntil||!cachedKeys.some(k=>k.kid===head.kid)){
   const response=await fetch(CERTS);if(!response.ok)return false;
   const data=await response.json();if(!Array.isArray(data.keys))return false;
   cachedKeys=data.keys;keysUntil=Date.now()+300000;
  }
  const jwk=cachedKeys.find(k=>k.kid===head.kid&&k.kty==='RSA'&&(!k.alg||k.alg==='RS256'));
  if(!jwk)return false;
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  return await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,bytes(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]));
 }catch(e){return false}
}
