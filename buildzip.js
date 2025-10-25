// Netlify Function: buildzip.js
const JSZip = require('jszip');
const fetch = require('node-fetch'); // node v18 may include fetch; include for clarity

exports.handler = async function(event){
  if(event.httpMethod !== 'POST') return { statusCode:405, body:'Method Not Allowed' };
  const body = JSON.parse(event.body||'{}');
  const payload = body.payload || {};
  const zip = new JSZip();

  // Add text file
  const metaText = [
    `Original:\n${payload.original || ''}`,
    `\n\nHindi:\n${payload.translations?.hindi || ''}`,
    `\n\nEnglish:\n${payload.translations?.english || ''}`,
    `\n\nSuggestions:\n${(payload.suggestions||[]).map((s,i)=>`${i+1}. ${s}`).join('\\n')}`,
    `\n\nImages:\n${(payload.images||[]).join('\\n')}`
  ].join('\\n');
  zip.file('shayari.txt', metaText);

  // Try to fetch images and include, otherwise include text links
  const imgFolder = zip.folder('images');
  for(let i=0;i<(payload.images||[]).length;i++){
    const url = payload.images[i];
    try{
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      imgFolder.file(`image_${i+1}.png`, Buffer.from(buf));
    }catch(e){
      imgFolder.file(`image_${i+1}-link.txt`, url);
    }
  }

  const content = await zip.generateAsync({type:'nodebuffer'});
  return { statusCode:200, headers:{ 'Content-Type':'application/zip', 'Content-Disposition':'attachment; filename="shayari-package.zip"' }, body: content.toString('base64'), isBase64Encoded:true };
};