const assert=require('node:assert/strict'),make=require('./audit-harness.cjs');
const a=make();a.pro();
a.run(`db=seed();
 const day=n=>addDaysISO(today(),n);
 db.animals=[
  {id:'ewe',tag:'1',type:'Koyun',sex:'Dişi',status:'Aktif',birth:day(-900)},
  {id:'ram',tag:'2',type:'Koç',sex:'Erkek',status:'Aktif',birth:day(-900)},
  {id:'l1',tag:'101',type:'Kuzu',sex:'Erkek',status:'Aktif',birth:day(-120),weight:40},
  {id:'l2',tag:'102',type:'Kuzu',sex:'Erkek',status:'Satıldı',birth:day(-60),weight:35},
  {id:'l3',tag:'103',type:'Kuzu',sex:'Erkek',status:'Aktif',birth:day(-3),weight:5}
 ];
 db.records=[
  {id:'old',kind:'expense',category:'Yem',amount:7000,date:day(-140)},
  {id:'feed',kind:'expense',category:'Yem',amount:56000,date:day(-20)},
  {id:'med',kind:'expense',category:'İlaç',amount:2500,date:day(-19)},
  {id:'stockMed',kind:'stock',category:'Stok/Yem',stockItem:'İlaç',amount:3000,date:day(-18)},
  {id:'sale',kind:'sale',animalIds:['l2'],amount:15000,date:day(-7)},
  {id:'barley',kind:'stock',category:'Stok/Yem',stockItem:'Arpa',amount:10000,date:day(-5)},
  {id:'lambFeed',kind:'stock',category:'Stok/Yem',stockItem:'Kuzu besi yemi',amount:12000,date:day(-2)}
 ];
`);
const read=id=>a.run("estimatedLambFeedAllocation(db.animals.find(x=>x.id==='"+id+"'))");
const data=read('l1');
assert.equal(data.available,true);
assert.equal(data.count,3,'only feed purchases during lamb lifespan are included');
assert.equal(data.total,78000,'medicine, pre-birth costs and sales excluded');
assert(data.amount>0&&data.amount<data.total,'only a proportional share is assigned to the lamb');
assert(data.entries.some(x=>x.id==='feed'&&x.amount===56000),'56,000 TL shared feed purchase included');
const general=data.entries.find(x=>x.id==='feed');
assert(general.share>0&&general.share<.4,'ewe and ram receive their share of general feed');
const special=data.entries.find(x=>x.id==='lambFeed');
assert(special.onlyLambs&&special.share>general.share,'lamb finishing stock is assigned to lambs only');
assert.equal(read('l3').count,1,'lamb born later cannot receive past purchases');
assert.equal(read('l2').count,1,'already sold lamb does not receive post-sale feed costs');
assert.equal(a.run("estimatedLambFeedAllocation({type:'Kuzu',birth:''}).available"),false);
const original=a.run('JSON.stringify(db)');
a.run("showGrowthDetail('l1')");
assert.match(a.document.getElementById('modalBody').textContent,/Kuzuya düşen tahmini yem payı/);
assert.match(a.document.getElementById('modalBody').textContent,/Satıştan yem payı çıkınca/);
a.run("showLambFeedCostBreakdown('l1')");
assert.match(a.document.getElementById('modalBody').textContent,/56.000|56,000/);
assert.match(a.document.getElementById('modalBody').textContent,/Kuzuya düşen tahmini pay/);
a.run("setAppLanguage('en');showGrowthDetail('l1')");
assert.match(a.document.getElementById('modalBody').textContent,/Estimated feed expense share for this lamb/);
assert.doesNotMatch(a.document.getElementById('modalBody').textContent,/[ğüşıöçĞÜŞİÖÇ]/);
a.run("showLambFeedCostBreakdown('l1')");
assert.doesNotMatch(a.document.getElementById('modalBody').textContent,/[ğüşıöçĞÜŞİÖÇ]/);
assert.equal(a.run('JSON.stringify(db)'),original,'estimates and modals must never modify animal or financial records');
console.log('PASS: 56,000 TL purchase, correct dates, sheep-equivalent share, lamb-only stock, sale cutoff, medicine exclusion, bilingual UI and unchanged records');
