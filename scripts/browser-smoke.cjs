// Optional: PLAYWRIGHT_MODULE must resolve to a Playwright package; browser install is separate.
const {mkdirSync}=require('node:fs');
const {join}=require('node:path');
const capture=process.env.BROWSER_CAPTURE_DIR;
if(capture)mkdirSync(capture,{recursive:true});
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
 const errors=[];const page=await browser.newPage({viewport:{width:1440,height:1100}});page.on('pageerror',e=>errors.push(e.message));
 const origin=process.env.SMOKE_ORIGIN || 'http://127.0.0.1:3000';
 await page.goto(origin,{waitUntil:'networkidle'});
 if(capture)await page.screenshot({path:join(capture,'desktop.png'),fullPage:true});
 await page.getByRole('button',{name:'Check my rights',exact:true}).click();await page.getByText('Here’s where you stand.',{exact:true}).waitFor();
 const amount=await page.locator('.award').first().innerText();if(amount!=='€250.00')throw Error('Unexpected award: '+amount);
 await page.locator('nav button').click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');if(await page.getByRole('dialog').count())throw Error('Drawer did not close');
 await page.getByRole('searchbox').fill('weather');await page.getByRole('button',{name:'Search sourcebook'}).click();await page.getByText('Keyword discovery and labeled precomputed examples.',{exact:false}).waitFor();
 const mobile=await browser.newPage({viewport:{width:390,height:844}});await mobile.goto(origin,{waitUntil:'networkidle'});
 if(capture)await mobile.screenshot({path:join(capture,'mobile.png'),fullPage:true});
 const overflow=await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(overflow)throw Error('Mobile horizontal overflow');
 await mobile.getByRole('button',{name:'Check my rights',exact:true}).click();await mobile.getByText('Here’s where you stand.',{exact:true}).waitFor();
 console.log(JSON.stringify({desktop:'passed',mobile:'passed',award:amount,drawer:'Escape closes',search:'passed',horizontalOverflow:overflow,consoleErrors:errors}));if(errors.length)process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
