const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=__dirname, out=path.join(root,'dist');
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
for(const item of ['index.html','manifest.webmanifest','fassung.json','sw.js','year7','year8','year9','year10','assets','spiele']){
 fs.cpSync(path.join(root,item),path.join(out,item),{recursive:true});
}
const spielSeiten=['year7','year8','year9','year10'].flatMap(j=>['games','sled','climb','kick'].map(s=>j+'/'+s));
for(const dir of ['','year7','year8','year9','year10',...spielSeiten]){
 const html=fs.readFileSync(path.join(out,dir,'index.html'),'utf8');
 for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
 for(const match of html.replace(/<script[\s\S]*?<\/script>/g,'').matchAll(/(?:href|src)="([^"#]+)"/g)){
  if(/^(https?:|data:)/.test(match[1]))continue;
  if(!fs.existsSync(path.resolve(out,dir,match[1].split(/[?#]/)[0])))throw new Error('Missing local link: '+match[1]);
 }
}
new vm.Script(fs.readFileSync(path.join(out,'assets/learning.js'),'utf8'));
new vm.Script(fs.readFileSync(path.join(out,'sw.js'),'utf8'));
for(const f of ['figuren.js','sled/musik.js','sled/game.js','climb/musik.js','climb/game.js','kick/spieler.js','kick/musik.js','kick/game.js'])new vm.Script(fs.readFileSync(path.join(out,'spiele',f),'utf8'));
for(const j of ['year7','year8','year9','year10'])new vm.Script(fs.readFileSync(path.join(out,j,'games/data.js'),'utf8'));
const start=fs.readFileSync(path.join(out,'index.html'),'utf8');
const sites=JSON.parse(start.match(/const SITES = (\[[\s\S]*?\]);/)[1]);
for(const site of sites)if(!fs.existsSync(path.join(out,site.path,'index.html')))throw new Error('Missing year '+site.path);
console.log('Static build: five pages, 16 game pages, script syntax and local links checked.');
