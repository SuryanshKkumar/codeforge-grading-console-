import {GRADES,DEFAULT_CUTOFFS,HEADERS,validateRows,validateCutoffs,bands,gradeFor,statistics,histogram,distribution,impact,buildCSV,safeFilename,demoRows} from './core.mjs';
const $=id=>document.getElementById(id);
const THEME_PALETTES={
 ocean:{grades:['#176b53','#177d84','#315bce','#6361ba','#a13c80','#b15726','#9d740a','#a74848'],backgrounds:['#daf4e7','#d9f3f4','#e5edff','#eeebfc','#f9e6f2','#ffebdf','#fff1c9','#fae5e3'],bars:['#70c4b4','#49b7a5','#2f9e99','#3198b6','#3886c9','#456dd0','#5c61c1','#7856ae','#aa568a','#d16a52']},
 sunset:{grades:['#ad422d','#b36718','#9f710a','#347450','#247d83','#4555ab','#853f8d','#8d414f'],backgrounds:['#ffe5da','#fff0d9','#fff2c9','#e4f3d8','#ddf2f2','#e6eaff','#f4e5fb','#f9e4e9'],bars:['#e5b647','#e7a733','#e38e39','#e27a3e','#de6544','#cd504a','#b34b67','#95527d','#755b90','#4e6997']},
 berry:{grades:['#723aae','#98429a','#b23775','#b64e47','#a57312','#45762d','#187c80','#4858b6'],backgrounds:['#eee2ff','#f6e4fc','#ffe3ef','#ffebe4','#fff0d2','#eaf4df','#dff4f2','#e7ebff'],bars:['#3fa5a6','#559fba','#647fca','#6b69c6','#8254be','#9948af','#b54a9e','#cc5188','#da6573','#e77a5c']}
};
let currentTheme='ocean';
let COLORS=THEME_PALETTES.ocean.grades;
let BACKGROUNDS=THEME_PALETTES.ocean.backgrounds;
let state={records:[],course:'',drafts:new Map(),filename:'',demo:false,sheet:'',page:0,busy:false};
let importGeneration=0;
let pendingAction=null;
let exportSnapshot=null;
const pageSize=10;
const records=()=>state.records.filter(r=>r.course===state.course);
const draft=()=>state.drafts.get(state.course);
const fmt=n=>n===null?'—':Number.isInteger(n)?String(n):n.toFixed(2);
function node(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
function chip(g){const i=GRADES.indexOf(g),el=node('span',g,'grade-chip');el.style.background=BACKGROUNDS[i];el.style.color=COLORS[i];return el;}
function notify(text,warning=false){$('message').textContent=text;$('message').className=warning?'warning':'';$('message').hidden=false;}
function pause(d){if(d?.startedAt){d.elapsedMs+=Date.now()-d.startedAt;d.startedAt=null;}}
function resume(d){if(d&&!d.startedAt&&!d.finalized)d.startedAt=Date.now();}
function elapsed(d){return d?d.elapsedMs+(d.startedAt?Date.now()-d.startedAt:0):0;}
function updateTimer(){const seconds=Math.floor(elapsed(draft())/1000);$('timer').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;}
function confirmAction({title,detail,action},callback){pendingAction=callback;$('confirm-title').textContent=title;$('confirm-detail').textContent=detail;$('confirm-action').textContent=action;$('confirm-dialog').showModal();}
$('confirm-dialog').addEventListener('close',()=>{const action=pendingAction;pendingAction=null;if($('confirm-dialog').returnValue==='confirm')action?.();});
function installDataset(validated,meta){
 const apply=()=>{
  pause(draft());state={...state,records:validated.records,course:'',drafts:new Map(),filename:meta.filename,demo:!!meta.demo,sheet:meta.sheet||'Marks',page:0};
  const courses=[...new Set(state.records.map(r=>r.course))].sort((a,b)=>a.localeCompare(b));
  $('course').replaceChildren(...courses.map(c=>new Option(c,c)));$('course').disabled=false;
  $('file-status').textContent=meta.filename;$('upload-label').textContent=meta.filename;
  $('course-hint').textContent=`${courses.length} course${courses.length===1?'':'s'} · ${state.records.length} students total`;
  $('import-errors').hidden=true;$('search').value='';$('grade-filter').value='';$('sort').value='id';
  selectCourse(courses[0]);
  notify(meta.demo?'You’re trying a sample class: 60 fictional records across two courses. Feel free to change the boundaries.':`Imported ${state.records.length} students from “${meta.sheet}”.${meta.sheetCount>1?` This workbook has ${meta.sheetCount} worksheets; only the first was imported.`:''}`,meta.sheetCount>1);
 };
 if(state.records.length)confirmAction({title:'Replace this workbook?',detail:'The current student data and all course grade drafts will be cleared. Download any results you need first.',action:'Replace workbook'},apply);else apply();
}
function selectCourse(course){pause(draft());state.course=course;state.page=0;$('course').value=course;
 if(!state.drafts.has(course))state.drafts.set(course,{cutoffs:[...DEFAULT_CUTOFFS],undo:[],elapsedMs:0,startedAt:null,finalized:false,exports:0});
 resume(draft());$('search').value='';$('grade-filter').value='';buildInputs();render();updateTimer();
}
function showErrors(errors){$('import-errors').hidden=false;$('error-summary').textContent=`${errors.length} issue${errors.length===1?'':'s'} found. Nothing was imported.${state.records.length?' Your current workbook is unchanged.':''}${errors.length>25?' Showing the first 25 issues.':''}`;$('error-list').replaceChildren(...errors.slice(0,25).map(e=>node('li',`${e.row?`Row ${e.row} · `:''}${e.field}: ${e.message}`)));$('message').hidden=true;}
async function importFile(file){
 if(!file)return;
 const gen=++importGeneration;
 if(!/\.xlsx$/i.test(file.name)){showErrors([{row:0,field:'File',message:'Choose an Excel Workbook (.xlsx).'}]);return;}
 if(file.size>5*1024*1024){showErrors([{row:0,field:'File',message:'The file is larger than 5 MB. Split it into smaller workbooks.'}]);return;}
 setBusy(true);
 try{
  const buffer=await file.arrayBuffer();
  const result=await new Promise((resolve,reject)=>{
   const worker=new Worker('workbook-worker.js');
   const timeout=setTimeout(()=>{worker.terminate();reject(Error('Reading took too long. Try a smaller, values-only workbook.'));},15000);
   const done=()=>{clearTimeout(timeout);worker.terminate();};
   worker.onmessage=e=>{done();e.data.error?reject(Error(e.data.error)):resolve(e.data);};
   worker.onerror=()=>{done();reject(Error('The spreadsheet reader could not load. Refresh this page and try again.'));};
   worker.postMessage(buffer,[buffer]);
  });
  if(gen!==importGeneration)return;
  const validation=validateRows(result.rows);
  if(validation.errors.length){showErrors(validation.errors);return;}
  installDataset(validation,{filename:file.name,sheet:result.sheet,sheetCount:result.sheetCount});
 }catch(e){if(gen===importGeneration)showErrors([{row:0,field:'Workbook',message:e.message}]);}
 finally{if(gen===importGeneration)setBusy(false);}
}
function setBusy(busy){state.busy=busy;$('file').disabled=busy;$('demo').disabled=busy;$('upload-label').textContent=busy?'Checking workbook…':state.filename||'Choose an Excel file';$('review').disabled=busy||!canExport();}
function buildInputs(){
 $('band-inputs').replaceChildren();const d=draft();
 GRADES.forEach((g,i)=>{const row=node('div',undefined,'band-row');row.style.setProperty('--grade-tint',BACKGROUNDS[i]);row.style.setProperty('--grade-colour',COLORS[i]);row.append(chip(g));
  if(i<7){const input=node('input');input.id=`cutoff-${i}`;input.type='number';input.min='1';input.max='100';input.step='1';input.disabled=!d;input.value=d?(Number.isFinite(d.cutoffs[i])?String(d.cutoffs[i]):''):String(DEFAULT_CUTOFFS[i]);input.setAttribute('aria-label',`${g} minimum mark`);input.setAttribute('aria-describedby','range-error');input.addEventListener('input',()=>{const previous=[...d.cutoffs];const value=input.value.trim();d.cutoffs[i]=value===''?NaN:Number(value);if(!sameCutoffs(previous,d.cutoffs)){d.undo.push(previous);if(d.undo.length>30)d.undo.shift();markEdited();render();}});row.append(input);}
  else row.append(node('span','0','fixed-zero'));
  const range=node('span','—','band-range');range.id=`band-range-${i}`;row.append(range);
  const count=node('span','—');count.id=`band-count-${i}`;row.append(count);$('band-inputs').append(row);
 });
}
function sameCutoffs(a,b){return a.every((v,i)=>Object.is(v,b[i]));}
function markEdited(){const d=draft();if(d){d.finalized=false;resume(d);}state.page=0;}
function render(){
 const rs=records(),d=draft(),cuts=d?.cutoffs??DEFAULT_CUTOFFS,err=validateCutoffs(cuts),stats=statistics(rs),dist=distribution(rs,cuts),bs=bands(cuts);
 $('course-title').textContent=state.course||'Course overview';$('course-meta').textContent=state.course?`${rs.length} students · Marks out of 100`:'Your class will appear here after you add a workbook.';
 $('dataset-badge').hidden=!rs.length;$('dataset-badge').textContent=state.demo?'SAMPLE DATA':'WORKBOOK LOADED';
 $('stat-count').textContent=rs.length?rs.length.toLocaleString():'—';$('stat-mean').textContent=fmt(stats.mean);$('stat-median').textContent=fmt(stats.median);$('stat-range').textContent=rs.length?`${stats.min} / ${stats.max}`:'—';
 $('count-note').textContent=rs.length?'All records validated':'In selected course';
 $('range-error').hidden=!err;$('range-error').textContent=err;
 GRADES.forEach((g,i)=>{$(`band-range-${i}`).textContent=bs.length?`${bs[i].min}–${bs[i].max}`:'—';$(`band-count-${i}`).textContent=rs.length&&!err?dist.counts[g]:'—';if(i<7)$(`cutoff-${i}`).setAttribute('aria-invalid',String(!!err));});
 $('coverage').textContent=err?'Check the grade cutoffs':'✓ All marks from 0–100 covered';$('coverage').style.color=err?'#ab2929':'';
 $('reset').disabled=!d||sameCutoffs(cuts,DEFAULT_CUTOFFS);$('undo').disabled=!d?.undo.length;
 $('assigned-count').textContent=rs.length?(err?'Fix cutoffs to assign grades':`${rs.length} of ${rs.length} assigned`):'No students yet';
 $('grade-bar').replaceChildren();$('grade-legend').replaceChildren();
 GRADES.forEach((g,i)=>{const count=err?0:dist.counts[g];const bar=node('span');bar.style.width=rs.length?`${100*count/rs.length}%`:'0';bar.style.background=COLORS[i];$('grade-bar').append(bar);const legend=node('div',undefined,'legend-item');const dot=node('i');dot.style.background=COLORS[i];legend.append(dot,node('span',g),node('strong',rs.length&&!err?`${count} · ${Math.round(count/rs.length*100)}%`:'—'));$('grade-legend').append(legend);});
 $('insight-text').textContent=rs.length?stats.std===0?`All ${rs.length} students have the same mark (${stats.min}). No normal-distribution assumption is applied.`:`The cohort average is ${fmt(stats.mean)}. Standard deviation is ${fmt(stats.std)} marks.`:'Start with the default bands, then adjust them to suit your course.';
 renderHistogram(rs);
 for(const id of ['search','grade-filter','sort'])$(id).disabled=!rs.length;
 const changed=impact(rs,cuts);$('impact-label').textContent=rs.length?(err?'Fix the grade boundaries to preview student grades.':`${changed} student${changed===1?'':'s'} changed from the default grade bands.`):'Preview each student’s grade before exporting.';
 $('student-total').textContent=rs.length;renderTable();renderReadiness();
}
function renderHistogram(rs){
 if(!rs.length)return;
 const bins=histogram(rs),peak=Math.max(...bins,1),top=Math.ceil(peak/4)*4;
 const W=Math.max(280,$('histogram').clientWidth),H=240,L=30,R=14,T=25,B=48,innerW=W-L-R,innerH=H-T-B,step=innerW/10,compact=W<440;
 let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="hist-title hist-desc"><title id="hist-title">Marks distribution for the selected course</title><desc id="hist-desc">${bins.map((n,i)=>`${i*10} to ${i===9?100:i*10+9}: ${n} students`).join('. ')}</desc>`;
 for(let j=0;j<=4;j++){const y=T+innerH-j*innerH/4;svg+=`<line x1="${L}" y1="${y}" x2="${W-R}" y2="${y}" stroke="#e8edf4" ${j?'stroke-dasharray="3 4"':''}/><text x="${L-9}" y="${y+4}" text-anchor="end" font-size="12" fill="#718096">${top*j/4}</text>`;}
 bins.forEach((n,i)=>{const x=L+i*step+5,h=n/top*innerH,y=T+innerH-h;svg+=`<rect x="${x}" y="${y}" width="${step-10}" height="${h}" rx="3" fill="${THEME_PALETTES[currentTheme].bars[i]}"><title>${i*10}–${i===9?100:i*10+9}: ${n} students</title></rect>${n?`<text x="${x+(step-10)/2}" y="${y-6}" text-anchor="middle" font-size="12" fill="#425a7b">${n}</text>`:''}<text x="${x+(step-10)/2}" y="${H-26}" text-anchor="middle" font-size="12" fill="#64758b">${compact?(i===9?'90+':i*10):`${i*10}–${i===9?100:i*10+9}`}</text>`;});
 svg+=`<text x="${W/2}" y="${H-5}" text-anchor="middle" font-size="12" fill="#64758b">${compact?'Marks · 10-point bands · 100 included':'Marks out of 100'}</text></svg>`;$('histogram').innerHTML=svg;$('chart-data').hidden=false;$('chart-data-content').textContent=bins.map((n,i)=>`${i*10}–${i===9?100:i*10+9}: ${n} student${n===1?'':'s'}`).join(' · ');
}
function renderTable(){
 const d=draft(),cuts=d?.cutoffs??DEFAULT_CUTOFFS,query=$('search').value.trim().toLowerCase(),filter=$('grade-filter').value;
 let list=records().filter(r=>r.id.toLowerCase().includes(query)&&(!filter||gradeFor(r.marks,cuts)===filter));
 list.sort($('sort').value==='high'?(a,b)=>b.marks-a.marks||a.id.localeCompare(b.id):$('sort').value==='low'?(a,b)=>a.marks-b.marks||a.id.localeCompare(b.id):(a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}));
 const pages=Math.max(1,Math.ceil(list.length/pageSize));state.page=Math.min(state.page,pages-1);const start=state.page*pageSize;
 $('student-body').replaceChildren();
 for(const r of list.slice(start,start+pageSize)){
  const tr=node('tr'),g=gradeFor(r.marks,cuts),base=gradeFor(r.marks),gradeCell=node('td'),changeCell=node('td');gradeCell.append(g?chip(g):node('span','Pending'));
  changeCell.append(g&&g!==base?node('span',`${base} → ${g}`,'changed'):node('span',g?'Unchanged':'Check cutoffs','same'));
  tr.append(node('td',r.id),node('td',`${r.marks} / 100`),gradeCell,changeCell);$('student-body').append(tr);
 }
 if(!list.length){const tr=node('tr'),td=node('td',state.records.length?'No students match these filters.':'Your student list will appear here after import.','table-empty');td.colSpan=4;tr.append(td);$('student-body').append(tr);}
 $('page-label').textContent=list.length?`${start+1}–${Math.min(start+pageSize,list.length)} of ${list.length} students`:'0 students';$('prev').disabled=state.page===0;$('next').disabled=state.page>=pages-1;
}
function canExport(){return !!draft()&&records().length>0&&!validateCutoffs(draft().cutoffs)&&!!$('instructor').value.trim();}
function renderReadiness(){const d=draft(),rs=records();$('review').disabled=state.busy||!canExport();
 if(d?.finalized){$('ready-title').textContent='Your grades are ready';$('ready-detail').textContent=`${rs.length} students included. You can revise boundaries and export again.`;}
 else if(!rs.length){$('ready-title').textContent='Ready when you are';$('ready-detail').textContent='Add your marks and your name. We’ll take it from there.';}
 else if(validateCutoffs(d.cutoffs)){$('ready-title').textContent='Grade boundaries need attention';$('ready-detail').textContent='Correct the highlighted cutoffs before exporting.';}
 else if(!$('instructor').value.trim()){$('ready-title').textContent='One more detail';$('ready-detail').textContent='Enter the instructor name to review and export grades.';}
 else{$('ready-title').textContent=`All ${rs.length} students have a grade.`;$('ready-detail').textContent='Take one last look, then download your results.';}
}
function downloadBlob(content,type,filename){const url=URL.createObjectURL(new Blob([content],{type}));const a=node('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function reviewExport(){if(!canExport())return;const d=draft(),rs=records(),teacher=$('instructor').value.trim();exportSnapshot={records:rs.map(r=>({...r})),cutoffs:[...d.cutoffs],instructor:teacher,course:state.course,source:state.filename,demo:state.demo};
 $('export-context').textContent=`${state.course} · ${teacher}${state.demo?' · Sample data':''}`;$('export-count').textContent=rs.length;$('export-changes').textContent=impact(rs,d.cutoffs);$('export-status').textContent='';$('export-bands').replaceChildren(...bands(d.cutoffs).map(b=>{const el=node('div');el.append(chip(b.grade),node('span',`${b.min}–${b.max}`));return el;}));$('export-dialog').showModal();}
$('download').addEventListener('click',()=>{try{const s=exportSnapshot;if(!s)return;const csv=buildCSV(s.records,s.cutoffs,s.instructor,s.course);downloadBlob(csv,'text/csv;charset=utf-8',`${safeFilename(s.course)}-grades.csv`);const d=draft();pause(d);d.finalized=true;d.exports++;updateTimer();renderReadiness();$('export-status').textContent=`CSV download started: ${s.records.length} students. Export ${d.exports} for this course.`;}catch(e){$('export-status').textContent=e.message;}});
$('audit').addEventListener('click',()=>{const s=exportSnapshot;if(!s)return;const report={app:'CodeForge challenge prototype',exportedAt:new Date().toISOString(),course:s.course,instructor:s.instructor,sourceWorkbook:s.source,sampleData:s.demo,studentCount:s.records.length,gradeBands:bands(s.cutoffs),distribution:distribution(s.records,s.cutoffs).counts,statistics:statistics(s.records),changedFromDefault:impact(s.records,s.cutoffs),reviewSeconds:Math.floor(elapsed(draft())/1000),policy:'Whole-number marks 0–100. NC students excluded. First worksheet only.'};downloadBlob(JSON.stringify(report,null,2),'application/json',`${safeFilename(s.course)}-grading-audit.json`);$('export-status').textContent='Audit download started. Download the CSV to finalize this course.';});
$('file').addEventListener('change',e=>{const file=e.target.files[0];e.target.value='';importFile(file);});
$('demo').addEventListener('click',()=>installDataset(validateRows(demoRows()),{filename:'Sample marks · 60 students',demo:true,sheet:'Marks'}));
$('course').addEventListener('change',e=>selectCourse(e.target.value));
$('instructor').addEventListener('input',()=>{if(draft()?.finalized)markEdited();renderReadiness();});
$('template').addEventListener('click',()=>{if(!window.XLSX){notify('The template generator could not load. Refresh the page and try again.',true);return;}const wb=XLSX.utils.book_new(),ws=XLSX.utils.aoa_to_sheet([HEADERS]);ws['!cols']=[{wch:22},{wch:30},{wch:18}];XLSX.utils.book_append_sheet(wb,ws,'Marks');const bytes=XLSX.write(wb,{type:'array',bookType:'xlsx'});downloadBlob(bytes,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','CodeForge-marks-template.xlsx');notify('Blank template downloaded. Add student rows beneath the three headers.');});
$('reset').addEventListener('click',()=>confirmAction({title:'Reset this course’s boundaries?',detail:'The default grade bands will be restored for this course. You can undo this change.',action:'Reset boundaries'},()=>{const d=draft();d.undo.push([...d.cutoffs]);d.cutoffs=[...DEFAULT_CUTOFFS];markEdited();buildInputs();render();}));
$('undo').addEventListener('click',()=>{const d=draft();if(d?.undo.length){d.cutoffs=d.undo.pop();markEdited();buildInputs();render();}});
for(const id of ['search','grade-filter','sort'])$(id).addEventListener(id==='search'?'input':'change',()=>{state.page=0;renderTable();});
$('prev').addEventListener('click',()=>{state.page--;renderTable();});$('next').addEventListener('click',()=>{state.page++;renderTable();});
$('review').addEventListener('click',reviewExport);$('close-export').addEventListener('click',()=>$('export-dialog').close());
$('export-dialog').addEventListener('close',()=>{exportSnapshot=null;});
$('grade-filter').append(...GRADES.map(g=>new Option(g,g)));
function setTheme(name,{save=true,redraw=true}={}){
 currentTheme=Object.hasOwn(THEME_PALETTES,name)?name:'ocean';
 document.documentElement.dataset.theme=currentTheme;
 COLORS=THEME_PALETTES[currentTheme].grades;BACKGROUNDS=THEME_PALETTES[currentTheme].backgrounds;
 for(const button of document.querySelectorAll('[data-theme-choice]'))button.setAttribute('aria-pressed',String(button.dataset.themeChoice===currentTheme));
 if(save){try{localStorage.setItem('codeforge-theme',currentTheme);}catch{/* The theme still works when browser storage is unavailable. */}}
 if(redraw){buildInputs();render();}
}
let savedTheme='ocean';try{savedTheme=localStorage.getItem('codeforge-theme')||'ocean';}catch{}
setTheme(savedTheme,{save:false,redraw:false});
for(const button of document.querySelectorAll('[data-theme-choice]'))button.addEventListener('click',()=>setTheme(button.dataset.themeChoice));
buildInputs();render();updateTimer();setInterval(updateTimer,1000);

new ResizeObserver(()=>renderHistogram(records())).observe($('histogram'));
for(const link of document.querySelectorAll('.nav-link'))link.addEventListener('click',()=>{for(const l of document.querySelectorAll('.nav-link')){l.classList.toggle('active',l===link);l.removeAttribute('aria-current');}link.setAttribute('aria-current','location');});
