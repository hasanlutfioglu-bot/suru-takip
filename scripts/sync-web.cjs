// Keep the offline single-file application in sync with maintainable sources.
const fs=require('node:fs'),path=require('node:path');
process.chdir(path.resolve(__dirname,'..'));
const write=process.argv.includes('--write'),check=process.argv.includes('--check');
if(!write&&!check)throw Error('Use --check or --write');
const lf=s=>s.replace(/\r\n/g,'\n');
let html=lf(fs.readFileSync('v21.html','utf8'));
const files=['device-state','change-history','sync-review','weighing-drafts','management','lookup'].map(name=>({file:'web/'+name+'.js',marker:'WEB '+name}));
files.push({file:'supabase/functions/_shared/sales-policy.mjs',marker:'SHARED SALES POLICY',stripExports:true},{file:'supabase/functions/_shared/change-history.mjs',marker:'SHARED CHANGE HISTORY',stripExports:true});
const stale=[];
for(const {file,marker,stripExports} of files){
 const start='// BEGIN '+marker+'\n',end='// END '+marker;
 const a=html.indexOf(start),b=html.indexOf(end,a);
 if(a<0||b<0)throw Error('Missing inline source boundary: '+marker);
 let source=lf(fs.readFileSync(file,'utf8')).trimEnd()+'\n';if(stripExports)source=source.replace(/export /g,'');
 const current=html.slice(a+start.length,b);
 if(current!==source){stale.push(file);if(write)html=html.slice(0,a+start.length)+source+html.slice(b)}
}
if(write){fs.writeFileSync('v21.html',html);console.log('Inline sources synchronized.')}
else if(stale.length){console.error('Run npm run build after editing: '+stale.join(', '));process.exitCode=1}
else console.log('PASS: browser and shared domain sources are synchronized');
