export const GRADES = Object.freeze(['A','A-','B','B-','C','C-','D','E']);
export const DEFAULT_CUTOFFS = Object.freeze([80,70,60,50,40,30,20]);
export const HEADERS = ['BITS ID','Course','Total Marks'];
export const MAX_ROWS = 50000;
export function normalizeHeader(v) {
  const s=String(v??'').trim().toLowerCase().replace(/[’']/g,'').replace(/\s+/g,' ');
  if(['bits id','students bits id','student bits id'].includes(s))return 'BITS ID';
  if(s==='course')return 'Course';
  if(['total marks','total marks (out of 100)'].includes(s))return 'Total Marks';
  return s;
}
export function validateRows(rows) {
  const errors=[]; const records=[];
  const issue=(row,field,message)=>errors.push({row,field,message});
  if(!rows.length)return {records,errors:[{row:1,field:'Headers',message:'The worksheet is empty.'}]};
  const headers=rows[0].map(normalizeHeader);
  if(headers.length!==3 || new Set(headers).size!==3 || HEADERS.some(h=>!headers.includes(h))) {
    issue(1,'Headers','Use exactly three columns: BITS ID, Course, Total Marks.');
    return {records,errors};
  }
  if(rows.length>MAX_ROWS+1) {
    issue(0,'File',`Use at most ${MAX_ROWS.toLocaleString()} student rows.`);return {records,errors};
  }
  const seen=new Set();
  rows.slice(1).forEach((cells,i)=>{
    const row=i+2;
    if(cells.every(v=>v==null || String(v).trim()===''))return;
    if(cells.slice(3).some(v=>v!=null && String(v).trim()!==''))issue(row,'Columns','Remove values outside the three required columns.');
    const idRaw=cells[headers.indexOf('BITS ID')];
    const courseRaw=cells[headers.indexOf('Course')];
    const markRaw=cells[headers.indexOf('Total Marks')];
    const id=String(idRaw??'').trim(),course=String(courseRaw??'').trim();
    if(!id || !['number','string'].includes(typeof idRaw))issue(row,'BITS ID','Enter a student BITS ID.');
    else if(id.length>100 || /[\r\n\x00-\x1f]/.test(id))issue(row,'BITS ID','Use an ID of at most 100 characters without line breaks.');
    else if(typeof idRaw==='number' && (!Number.isSafeInteger(idRaw)||idRaw<0))issue(row,'BITS ID','Store this ID as text to preserve its digits.');
    if(!course || typeof courseRaw!=='string')issue(row,'Course','Enter a course name as text.');
    else if(course.length>150 || /[\r\n\x00-\x1f]/.test(course))issue(row,'Course','Use a course name of at most 150 characters without line breaks.');
    const markType=['number','string'].includes(typeof markRaw);
    const validNumber=markType && String(markRaw).trim()!=='' && /^\d+(?:\.0+)?$/.test(String(markRaw).trim());
    const marks=validNumber?Number(markRaw):NaN;
    if(!Number.isInteger(marks)||marks<0||marks>100)issue(row,'Total Marks','Enter a whole number from 0 to 100. NC students must be excluded.');
    const key=JSON.stringify([id.toUpperCase(),course]);
    if(id&&course&&seen.has(key))issue(row,'BITS ID','This student appears more than once in this course.');
    seen.add(key);records.push({id,course,marks,row});
  });
  if(!records.length && !errors.length)issue(2,'Data','Add at least one student row below the headers.');
  return {records:errors.length?[]:records,errors};
}
export function validateCutoffs(cutoffs) {
  if(cutoffs.length!==7)return 'Enter all seven grade cutoffs.';
  for(let i=0;i<7;i++) {
    if(!Number.isInteger(cutoffs[i])||cutoffs[i]<1||cutoffs[i]>100)return `${GRADES[i]} minimum must be a whole number between 1 and 100.`;
    if(i>0 && cutoffs[i]>=cutoffs[i-1])return `${GRADES[i]} minimum must be lower than ${GRADES[i-1]} minimum.`;
  }
  return '';
}
export function bands(cutoffs) {
  if(validateCutoffs(cutoffs))return [];
  return GRADES.map((grade,i)=>({grade,min:i===7?0:cutoffs[i],max:i===0?100:cutoffs[i-1]-1}));
}
export function gradeFor(marks,cutoffs=DEFAULT_CUTOFFS) {
  if(!Number.isInteger(marks)||marks<0||marks>100||validateCutoffs(cutoffs))return null;
  const idx=cutoffs.findIndex(n=>marks>=n);return GRADES[idx===-1?7:idx];
}
export function statistics(records) {
  if(!records.length)return {count:0,min:null,max:null,mean:null,median:null,std:null};
  const m=records.map(x=>x.marks).sort((a,b)=>a-b),n=m.length,mean=m.reduce((a,b)=>a+b,0)/n;
  return {count:n,min:m[0],max:m[n-1],mean,median:n%2?m[(n-1)/2]:(m[n/2-1]+m[n/2])/2,std:Math.sqrt(m.reduce((a,b)=>a+(b-mean)**2,0)/n)};
}
export function histogram(records) {
  const bins=Array(10).fill(0);records.forEach(r=>bins[Math.min(9,Math.floor(r.marks/10))]++);return bins;
}
export function distribution(records,cutoffs) {
  const counts=Object.fromEntries(GRADES.map(g=>[g,0]));let unassigned=0;
  for(const r of records){const grade=gradeFor(r.marks,cutoffs);if(grade)counts[grade]++;else unassigned++;}
  return {counts,unassigned};
}
export function impact(records,cutoffs,baseline=DEFAULT_CUTOFFS) {
  if(validateCutoffs(cutoffs))return null;
  return records.filter(r=>gradeFor(r.marks,cutoffs)!==gradeFor(r.marks,baseline)).length;
}
export function csvCell(value) {
  let s=String(value??'');
  // Keep spreadsheet programs from interpreting untrusted text as a formula.
  if(typeof value==='string' && /^[\s\uFEFF]*[=+@-]/.test(s))s="'"+s;
  return '"'+s.replace(/"/g,'""')+'"';
}
export function buildCSV(records,cutoffs,instructor,course) {
  if(!instructor.trim())throw Error('Enter the instructor name before exporting.');
  const err=validateCutoffs(cutoffs);if(err)throw Error(err);
  if(!records.length || records.some(r=>r.course!==course))throw Error('Select a course with student records.');
  const rows=[['BITS ID','Course','Total Marks','Grade','Instructor']];
  records.forEach(r=>{const g=gradeFor(r.marks,cutoffs);if(!g)throw Error('Every student must have a grade.');rows.push([r.id,r.course,r.marks,g,instructor.trim()]);});
  return '\uFEFF'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n')+'\r\n';
}
export function safeFilename(course) {return course.normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-|-$/g,'').slice(0,65)||'course';}
export function demoRows() {
  const marks=[18,24,29,32,35,38,41,43,45,47,49,50,52,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,82,84,86,88,90,93,97,100];
  return [HEADERS,...marks.map((m,i)=>[`DEMO${String(i+1).padStart(4,'0')}`,'Data Structures',m]),...[42,50,61,70,79,80,90,100,0,29,33,55].map((m,i)=>[`DEMO${String(i+1).padStart(4,'0')}`,'Linear Algebra',m])];
}
