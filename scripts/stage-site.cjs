const fs=require('node:fs'),path=require('node:path');
const output=path.resolve('_site');fs.mkdirSync(output,{recursive:true});
const assets=['index.html','v17.html','v18.html','v19.html','v20.html','v21.html','manifest.webmanifest','sw.js','oauth-consent.html','data-info.html','delete-account.html','icons'];
for(const item of assets)fs.cpSync(item,path.join(output,item),{recursive:true});
console.log('Public app assets staged; server functions, database scripts and legal drafts are excluded.');
