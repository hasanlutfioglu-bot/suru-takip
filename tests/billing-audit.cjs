const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),{stripTypeScriptTypes}=require('node:module');
let source=stripTypeScriptTypes(fs.readFileSync('supabase/functions/verify-play-subscription/index.ts','utf8').replace(/^import .*;\n/gm,''));
async function scenario(options={}){
 let handler,events=[],claims=new Map(options.claims||[]),writes=[];
 const purchase={subscriptionState:'SUBSCRIPTION_STATE_ACTIVE',lineItems:[{productId:'suru_pro_monthly',expiryTime:'2099-01-01T00:00:00Z'}],acknowledgementState:'ACKNOWLEDGEMENT_STATE_PENDING',...options.purchase};
 function query(table){let filter,operation,data;const q={select(){return q},eq(k,v){filter=v;return q},order(){return q},limit(){return q},upsert(d){operation='upsert';data=d;return q},maybeSingle(){return execute()},single(){return execute()},then(ok,bad){return execute().then(ok,bad)}};
 async function execute(){if(table==='farm_members')return {data:{farm_id:options.farm||'farm-a',role:options.role||'owner'}};if(table==='play_purchase_claims'){if(operation==='upsert'){if(!claims.has(data.token_hash))claims.set(data.token_hash,data);return {error:null}}return {data:claims.get(filter)||null,error:null}}if(table==='subscriptions'){events.push('grant');writes.push(data);return {error:options.dbError?{message:'private SQL details'}:null}}throw Error(table)}return q}
 const context={Request,Response,TextEncoder,URLSearchParams,Uint8Array,Date,Set,Array,String,Number,JSON,btoa,atob,crypto:{subtle:{importKey:async()=>({}),sign:async()=>new Uint8Array([1]),digest:require('node:crypto').webcrypto.subtle.digest.bind(require('node:crypto').webcrypto.subtle)}},createClient:()=>({auth:{getUser:async()=>({data:{user:options.unauth?null:{id:'user'}}})},from:query}),Deno:{serve:f=>handler=f,env:{get:k=>k==='GOOGLE_PLAY_SERVICE_ACCOUNT_JSON'?(options.unconfigured?undefined:JSON.stringify({private_key:'AQ==',client_email:'test'})):'test'}},fetch:async(url)=>{if(url.includes('oauth2'))return new Response(JSON.stringify({access_token:'access'}));if(url.includes(':acknowledge')){events.push('ack');return new Response('{}',{status:options.ackError?500:200})}return new Response(JSON.stringify(purchase),{status:options.verifyError?404:200})}};
 vm.runInNewContext(source,context);const res=await handler(new Request('https://test.invalid',{method:options.method||'POST',headers:options.noAuth?{}:{Authorization:'Bearer test'},body:options.method==='GET'?undefined:JSON.stringify(options.body||{productId:'suru_pro_monthly',purchaseToken:'token'})}));return {status:res.status,body:await res.json(),events,writes,claims};
}
(async()=>{
 let count=0;async function status(o,expected){const r=await scenario(o);assert.equal(r.status,expected);count++;return r}
 await status({method:'GET'},405);await status({noAuth:true},401);await status({unauth:true},401);await status({unconfigured:true},503);await status({body:{action:'health'},unconfigured:true},200);await status({body:{productId:'invalid',purchaseToken:'token'}},400);await status({body:{productId:'suru_pro_monthly',purchaseToken:'x'.repeat(4097)}},400);await status({verifyError:true},400);await status({role:'viewer'},403);await status({role:'editor'},403);
 for(const state of ['SUBSCRIPTION_STATE_EXPIRED','SUBSCRIPTION_STATE_ON_HOLD','SUBSCRIPTION_STATE_PENDING','SUBSCRIPTION_STATE_PAUSED'])await status({purchase:{subscriptionState:state}},400);
 await status({purchase:{lineItems:[{productId:'suru_pro_monthly',expiryTime:'2000-01-01T00:00:00Z'},{productId:'other',expiryTime:'2099-01-01T00:00:00Z'}]}},400);
 await status({purchase:{lineItems:[{productId:'other',expiryTime:'2099-01-01T00:00:00Z'}]}},400);
 let good=await status({},200);assert.deepEqual(good.events,['grant','ack']);count++;
 await status({claims:[...good.claims]},200);await status({claims:[...good.claims],farm:'farm-b'},409);
 await status({claims:[...good.claims],farm:'farm-b',body:{productId:'suru_pro_monthly',purchaseToken:'new-token'},purchase:{linkedPurchaseToken:'token'}},409);
 for(const state of ['SUBSCRIPTION_STATE_CANCELED','SUBSCRIPTION_STATE_IN_GRACE_PERIOD'])await status({purchase:{subscriptionState:state}},200);
 let fail=await status({dbError:true},500);assert.deepEqual(fail.events,['grant']);assert.ok(!JSON.stringify(fail.body).includes('SQL'));count+=2;
 await status({ackError:true},500);
 console.log('billing-audit PASS:',count,'backend controls');
})().catch(e=>{console.error(e);process.exit(1)});
