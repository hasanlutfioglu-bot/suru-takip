// Local preview only. Cloud access requires an explicit --cloud argument.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),cloud=process.argv.includes('--cloud');
const portArg=process.argv.find(a=>a.startsWith('--port='));
const port=portArg?Number(portArg.slice(7)):4173;
if(!Number.isInteger(port)||port<0||port>65535)throw Error('Invalid port');
const pages=new Set(['index.html','v21.html','sw.js','manifest.webmanifest','oauth-consent.html','data-info.html','delete-account.html']);
const legacy=new Set(['v17.html','v18.html','v19.html','v20.html','v215-light.html']);
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});return res.end()}
  const url=new URL(req.url,'http://localhost'),name=decodeURIComponent(url.pathname).replace(/^\//,'')||'index.html';
  if(legacy.has(name)){res.writeHead(302,{'Location':'/v21.html'+url.search});return res.end()}
  if(!pages.has(name)&&!/^icons\/[A-Za-z0-9_-]+\.(png|svg)$/.test(name)&&!/^assets\/farm\/[A-Za-z0-9_-]+\.(webp|js|txt)$/.test(name)){res.writeHead(404);return res.end('Not found')}
  const target=path.resolve(root,name);
  if(!target.startsWith(root+path.sep)||!fs.existsSync(target)){res.writeHead(404);return res.end('Not found')}
  let body=fs.readFileSync(target);
  if(name==='v21.html'&&!cloud){
   let html=body.toString('utf8').replace(/\r\n/g,'\n');
   html=html.replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2"></script>','');
   html=html.replace("const KEY='suru_takip_v5';","const KEY='suru_takip_preview_v5';");
   const init='initCloud();if(';if(!html.includes(init))throw Error('Cloud-disable anchor is missing');
   html=html.replace(init,"currentPlan='pro';subscriptionStatus='offline';currentPeriodEnd='2099-01-01T00:00:00Z';renderPlanStatus();document.getElementById('welcomeAccountTitle').textContent='Yerel önizleme';document.getElementById('welcomeAccountText').textContent='Kayıtlar yalnız bu tarayıcıda tutulur. Bulut bağlantısı kapalıdır.';document.getElementById('welcomeGoogleLoginBtn').hidden=true;if(");
   body=Buffer.from(html);
  }
  res.writeHead(200,{'Content-Type':mime[path.extname(name)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(req.method==='HEAD'?undefined:body);
 }catch(e){console.error('Preview request failed:',e.message);res.writeHead(500);res.end('Preview failed')}
});
server.on('error',error=>{console.error(error.message);process.exitCode=1});
server.listen(port,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:'+server.address().port+'/v21.html ('+(cloud?'cloud enabled':'cloud disabled')+')'));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close());
