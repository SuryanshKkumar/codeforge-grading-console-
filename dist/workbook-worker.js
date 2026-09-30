importScripts('vendor/xlsx.full.min.js');
self.onmessage=({data})=>{
 try{
  const bytes=new Uint8Array(data);
  if(bytes[0]!==0x50||bytes[1]!==0x4b)throw Error('This file is not an .xlsx workbook. Save it as Excel Workbook (.xlsx) and try again.');
  const wb=XLSX.read(data,{type:'array',cellDates:true,cellFormula:true,sheetRows:50002});
  if(!wb.SheetNames.length)throw Error('The workbook contains no worksheets.');
  const sheet=wb.Sheets[wb.SheetNames[0]];
  if(!sheet['!ref'])throw Error('The first worksheet is empty.');
  const range=XLSX.utils.decode_range(sheet['!fullref']||sheet['!ref']);
  if(range.e.r>50000)throw Error('The first worksheet exceeds 50,000 student rows.');
  if(range.s.c!==0 || range.e.c!==2 || range.s.r!==0)throw Error('Start in cell A1 and use exactly three columns: BITS ID, Course, Total Marks.');
  const rows=[];
  for(let r=0;r<=range.e.r;r++){
   const row=[];
   for(let c=0;c<3;c++){
    const addr=XLSX.utils.encode_cell({r,c}),cell=sheet[addr];
    if(cell?.f)throw Error(`Cell ${addr} contains a formula. Paste values before importing.`);
    if(cell?.t==='e')throw Error(`Cell ${addr} contains an Excel error. Correct it before importing.`);
    let value=cell?.v??null;
    // Preserve numeric IDs with explicit zero-padding in the workbook.
    const header=String(sheet[XLSX.utils.encode_cell({r:0,c})]?.v??'').toLowerCase();
    if(r>0 && header.includes('id') && cell?.t==='n' && /^0\d+$/.test(cell?.w??''))value=cell.w;
    row.push(value);
   }
   rows.push(row);
  }
  self.postMessage({rows,sheet:wb.SheetNames[0],sheetCount:wb.SheetNames.length});
 }catch(error){self.postMessage({error:error.message||'Unable to read this workbook.'});}
};
