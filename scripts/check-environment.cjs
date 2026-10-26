const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const pkg=require('../package.json');
const nodeMajor=Number(process.versions.node.split('.')[0]);
console.log('Node:',process.version,nodeMajor>=24?'OK':'REQUIRES 24+');
let missing=false;
for(const [name,version] of Object.entries(pkg.devDependencies)){
 try{const actual=require(name+'/package.json').version;console.log(name+':',actual,actual===version?'OK':'VERSION MISMATCH');if(actual!==version)missing=true}catch(e){console.log(name+': MISSING');missing=true}
}
async function checkBrowser(){try{const browser=await require('playwright').chromium.launch({headless:true});console.log('Chromium headless: launch OK');await browser.close()}catch(e){console.log('Chromium headless: unavailable; run npx playwright install chromium --only-shell');process.exitCode=1}}
checkBrowser();
// Check versions without printing environment values or credentials.
for(const [command,args] of [['java',['-version']],['gradle',['--version']],['adb',['version']]]){
 const result=spawnSync(command,args,{encoding:'utf8',windowsHide:true});
 console.log(command+':',result.error?'not available':(result.stdout||result.stderr).trim().split(/\r?\n/).slice(0,3).join(' '));
}
console.log('Android requires JDK 17, Gradle 8.13 and SDK platform 36. Missing Android tools do not block web tests.');
console.log('Database credentials and live services were not accessed.');
if(nodeMajor<24||missing)process.exitCode=1;
