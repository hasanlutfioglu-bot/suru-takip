const assert=require('node:assert/strict'),make=require('./audit-harness.cjs');
(async()=>{
const h=make();h.run("cloudSession={user:{id:'test'}};billingBackendReady=async()=>true;verifyPlayPurchase=async()=>({ok:true});selectedProBilling='monthly'");
let requests=0,details,total,done=[],release;
h.c.getDigitalGoodsService=async()=>({getDetails:async()=>[{price:{currency:'TRY',value:'99.00'}}]});
h.c.PaymentRequest=function(methods,options){requests++;details=methods;total=options.total;this.show=()=>new Promise(r=>release=()=>r({details:{token:'test-token'},complete:async status=>done.push(status)}))};
let first=h.run('startProPurchase()');for(let i=0;i<5;i++)await Promise.resolve();await h.run('startProPurchase()');assert.equal(requests,1);assert.equal(total.amount.value,'99.00');assert.equal(details[0].data.sku,'suru_pro_monthly');release();await first;assert.deepEqual(done,['success']);assert.equal(h.run('purchaseBusy'),false);
h.run("verifyPlayPurchase=async()=>{throw Error('Verification failed')}");done=[];h.c.PaymentRequest=function(){this.show=async()=>({details:{token:'test'},complete:async s=>done.push(s)})};await h.run('startProPurchase()');assert.deepEqual(done,['fail']);assert.equal(h.run('purchaseBusy'),false);
h.run('billingBackendReady=async()=>false');requests=0;h.c.PaymentRequest=function(){requests++};await h.run('startProPurchase()');assert.equal(requests,0);assert.match(h.document.getElementById('modalBody').textContent,/Ücret alınmadı/);
h.run("cloudRole='viewer';cloudFarmId='farm';db=seed()");h.run('openAddAnimal();saveNewAnimal()');assert.equal(h.run('db.animals.length'),0);assert.match(h.document.getElementById('toast').textContent,/görüntüleme/);
console.log('payment-ui PASS: duplicate-click guard, store pricing, successful/failed completion, unconfigured billing and viewer mutation guard (DOM simulation)');
})().catch(e=>{console.error(e);process.exit(1)});
