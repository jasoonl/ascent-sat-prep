const { chromium } = require(process.env.PW);
(async()=>{ const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 const p=await (await b.newContext({viewport:{width:1360,height:860}})).newPage();
 await p.goto('http://localhost:8765/index.html'); await p.evaluate(()=>localStorage.clear()); await p.reload();
 await p.fill('#w-name','Maya'); await p.click('#wform button[type=submit]'); await p.waitForSelector('.page-head h1');
 await p.screenshot({path:'/tmp/shots/fix/home-icons.png'}); await b.close(); })();
