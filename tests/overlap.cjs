const { chromium } = require(process.env.PW);
const OUT='/tmp/shots/fix'; require('fs').mkdirSync(OUT,{recursive:true});
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2}); const p=await c.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_/.test(m.text()))errs.push(m.text())});
  await p.goto('http://localhost:8765/index.html'); await p.evaluate(()=>localStorage.clear()); await p.reload();
  await p.fill('#w-name','Maya'); await p.fill('#w-date','2027-03-13'); await p.click('#wform button[type=submit]'); await p.waitForSelector('.page-head h1');
  // seed some history so lists are populated
  await p.evaluate(()=>{ UI.quickSet({title:'seed',skills:[],n:12,diff:'mixed',tutor:false}); });
  await p.waitForSelector('.sess');
  await p.evaluate(()=>{ const S=Store.profile().session; S.mods[0].ans = S.mods[0].qs.map((q,i)=> i%2?0:null); Store.save(true); });
  await p.evaluate(()=>UI.finishSessionNow()); await p.waitForSelector('.results');
  const routes=['home','practice','tests','progress','plan','skills','mistakes','parent','settings'];
  const report=[];
  for(const r of routes){
    await p.goto('http://localhost:8765/index.html#/'+r); await p.waitForSelector('.page-head h1');
    await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
    await p.waitForTimeout(250);
    const m=await p.evaluate(()=>{ const tb=document.querySelector('.tabbar').getBoundingClientRect(); const page=document.querySelector('.page'); const last=[...page.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().height>0).pop(); const lb=page.lastElementChild.getBoundingClientRect();
      return {tabTop:Math.round(tb.top), pageBottom:Math.round(lb.bottom), overflowX: document.documentElement.scrollWidth>innerWidth}; });
    report.push([r,m]);
    if(r==='progress') await p.screenshot({path:OUT+'/progress-bottom.png'});
  }
  // in-session footer check on a question screen
  await p.goto('http://localhost:8765/index.html#/practice'); await p.evaluate(()=>UI.quickSet({title:'Check',skills:['bnd'],n:5,diff:2,tutor:true})); await p.waitForSelector('.sess');
  await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight)); await p.waitForTimeout(250);
  const s=await p.evaluate(()=>{ const f=document.querySelector('.sess-foot').getBoundingClientRect(); const ch=[...document.querySelectorAll('.choice')].pop().getBoundingClientRect(); return {footTop:Math.round(f.top), lastChoiceBottom:Math.round(ch.bottom)}; });
  report.push(['session',s]); await p.screenshot({path:OUT+'/session-bottom.png'});
  console.log(JSON.stringify(report,null,0)); console.log('errors',errs);
  await b.close();
})();
