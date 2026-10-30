const { chromium } = require(process.env.PW);
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 const c=await b.newContext({viewport:{width:390,height:800},colorScheme:'dark',deviceScaleFactor:1});
 const p=await c.newPage(); await p.goto('http://localhost:8765/index.html');
 await p.fill('#w-name','Sam'); await p.screenshot({path:'/tmp/shots/m-welcome.png'}); await p.click('#wform button[type=submit]'); await p.waitForSelector('.page-head h1');
 await p.screenshot({path:'/tmp/shots/m-home-dark.png'});
 await p.evaluate(()=>UI.quickSet({title:'t',skills:['trig','bi'],n:6,diff:2}));
 await p.waitForSelector('.sess'); await p.screenshot({path:'/tmp/shots/m-q.png'});
 await b.close();})();
