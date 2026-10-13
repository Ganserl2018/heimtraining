const {chromium}=require('/home/claude/heimtraining/node_modules/playwright-core');
const fs=require('fs');
const font=fs.readFileSync('/tmp/qa-font/node_modules/@fontsource/anton/files/anton-latin-400-normal.woff2').toString('base64');
exports.open=async(port=8793)=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p=await b.newPage({viewport:{width:402,height:815},deviceScaleFactor:2});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/style.css*',async r=>{const t=fs.readFileSync(process.env.CSS||'/home/claude/heimtraining/style.css','utf8').replace(/env\(safe-area-inset-bottom,\s*0px\)/g,'34px').replace(/env\(safe-area-inset-top,\s*0px\)/g,'14px').replace(/env\(safe-area-inset-top\)/g,'14px').replace(/env\(safe-area-inset-bottom\)/g,'34px');await r.fulfill({body:t,contentType:'text/css'})});
  await p.goto('http://localhost:'+port+'/');
  await p.addStyleTag({content:`@font-face{font-family:Anton;src:url(data:font/woff2;base64,${font}) format('woff2')}
   .tabbar{padding-bottom:calc(34px + 26px) !important}`});
  await p.waitForTimeout(900);
  return {b,p,errs};
};
// misst: Scrollhöhe, und ob unterstes sichtbares Element unter der Tab-Leiste liegt
exports.fit=async p=>p.evaluate(()=>{
  const c=document.getElementById('content'),tb=document.querySelector('.tabbar').getBoundingClientRect();
  let maxB=0;c.querySelectorAll('*').forEach(e=>{if(e.children.length&&!['BUTTON'].includes(e.tagName))return;if(e.closest('[aria-hidden=true]'))return;const r=e.getBoundingClientRect();if(r.height>0&&r.width>0&&getComputedStyle(e).visibility!=='hidden')maxB=Math.max(maxB,r.bottom)});
  return {sh:c.scrollHeight,ch:c.clientHeight,tabTop:Math.round(tb.top),lastBottom:Math.round(maxB)};});
