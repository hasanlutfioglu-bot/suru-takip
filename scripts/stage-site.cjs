const fs=require('node:fs'),path=require('node:path');
const output=path.resolve('_site');fs.mkdirSync(output,{recursive:true});
const assets=['index.html','v21.html','manifest.webmanifest','sw.js','oauth-consent.html','data-info.html','delete-account.html','icons'];
for(const item of assets)fs.cpSync(item,path.join(output,item),{recursive:true});
// Preserve old source versions in Git while serving the supported application.
for(const name of ['v17.html','v18.html','v19.html','v20.html','v215-light.html'])fs.writeFileSync(path.join(output,name),'<!doctype html><html lang="tr"><meta charset="utf-8"><title>Sürü Takip</title><script>location.replace("./v21.html"+location.search+location.hash)</script><a href="./v21.html">Sürü Takip’i aç</a></html>');
console.log('Public app assets staged; server functions, database scripts and legal drafts are excluded.');
