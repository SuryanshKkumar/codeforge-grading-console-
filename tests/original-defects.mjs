import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.CODEFORGE_PLAYWRIGHT_PATH||'playwright');
const ctx={};vm.runInNewContext(fs.readFileSync(new URL('../dist/vendor/xlsx.full.min.js',import.meta.url),'utf8'),ctx);const XLSX=ctx.XLSX;
const artifactDir=process.env.CODEFORGE_QA_DIR||'qa';fs.mkdirSync(artifactDir,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CODEFORGE_CHROME_PATH?{executablePath:process.env.CODEFORGE_CHROME_PATH}:{})});
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],findings=[];
page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
await page.route('https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js',r=>r.fulfill({path:fileURLToPath(new URL('../dist/vendor/xlsx.full.min.js',import.meta.url)),contentType:'text/javascript'}));
async function probe(name,fn){const evidence=await fn();findings.push({name,evidence});console.log(name+': '+JSON.stringify(evidence));}
const bytes=rows=>{const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['BITS ID','Course','Total Marks'],...rows]),'Marks');return Buffer.from(XLSX.write(wb,{type:'array',bookType:'xlsx'}));};
try{
 await page.goto(new URL('../reference/original.html',import.meta.url).href);
 await probe('XLSX input mismatch',async()=>await page.locator('#file').getAttribute('accept'));
 await probe('Reset before course throws',async()=>{await page.locator('#resetRanges').click();return errors.splice(0);});
 await page.locator('#instructor').fill('Tester');
 await page.locator('#file').setInputFiles({name:'first.xlsx',mimeType:'application/octet-stream',buffer:bytes([['S1','CS',20],['S2','CS',90]])});
 await page.waitForFunction(()=>data.length===2);
 await probe('Duplicate course choices within one upload',async()=>await page.locator('#course option').allTextContents());
 await page.locator('#course').selectOption('CS');
 await probe('Reversed minimum and maximum labels',async()=>await page.locator('.stat').allTextContents());
 await probe('Missing 100 accepted by range validation',async()=>page.evaluate(()=>{document.getElementById('Amax').value=99;const result=validateRanges();return {error:result,gradeAmax:document.getElementById('Amax').value};}));
 await probe('Single-mark grade rejected',async()=>page.evaluate(()=>{buildGradeUI();document.getElementById('Amin').value=100;cascadeMaxFrom(0);return validateRanges();}));
 await probe('Cleared instructor does not disable export',async()=>{await page.evaluate(()=>{buildGradeUI();updateAll();});await page.locator('#instructor').fill('');return {exportDisabled:await page.locator('#download').isDisabled()};});
 await page.locator('#instructor').fill('Tester');
 await probe('Course change resets edited cutoffs',async()=>page.evaluate(()=>{document.getElementById('Amin').value=85;course.onchange();return {minimumAfterChange:document.getElementById('Amin').value};}));
 await probe('Numeric strings corrupt mean and median',async()=>page.evaluate(()=>{data=[{'BITS ID':'S1',Course:'CS','Total Marks':'80'},{'BITS ID':'S2',Course:'CS','Total Marks':'70'}];computeStats();return {average:avg.textContent,median:med.textContent};}));
 await probe('Constant scores cause non-finite bell-curve coordinates',async()=>page.evaluate(()=>{const points=[];drawBellCurve({beginPath(){},moveTo(x,y){points.push(y)},lineTo(x,y){points.push(y)},stroke(){}},[70,70],1);return {nonFinite:points.filter(n=>!Number.isFinite(n)).length};}));
 await probe('Repeated upload keeps old course options and stale selection',async()=>{await page.locator('#file').setInputFiles({name:'second.xlsx',mimeType:'application/octet-stream',buffer:bytes([['S3','Math',60]])});await page.waitForFunction(()=>data.length===1);return page.evaluate(()=>{computeStats();return {options:[...course.options].map(x=>x.value),selected:course.value,average:avg.textContent,median:med.textContent};});});
 await probe('Mobile layout wider than viewport',async()=>page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,deviceWidth:screen.width,hasViewportMeta:!!document.querySelector('meta[name="viewport"]')})));
 fs.writeFileSync(path.join(artifactDir,'original-defects.json'),JSON.stringify(findings,null,2));
 assert.equal(findings.length,12);
}finally{await browser.close();}
