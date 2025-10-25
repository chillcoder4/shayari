/* Frontend JS: calls Netlify serverless function to interact with Gemini (server-side).
   Requirements: Deploy on Netlify and set environment variable GEMINI_API_KEY in Netlify settings.
*/
const generateBtn = document.getElementById('generate');
const shayariEl = document.getElementById('shayari');
const nameEl = document.getElementById('name');
const results = document.getElementById('results');
const origText = document.getElementById('origText');
const hinText = document.getElementById('hinText');
const engText = document.getElementById('engText');
const suggestionsList = document.getElementById('suggestions');
const imagesDiv = document.getElementById('images');
const copyAll = document.getElementById('copyAll');
const downloadZip = document.getElementById('downloadZip');

generateBtn.addEventListener('click', async () => {
  const text = shayariEl.value.trim();
  if(!text){ alert('Please enter a shayari first.'); return; }

  generateBtn.disabled = true;
  generateBtn.textContent = 'Creating...';

  try{
    const resp = await fetch('/.netlify/functions/generate', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ shayari:text, name: nameEl.value || 'Visitor' })
    });
    if(!resp.ok) throw new Error(await resp.text());
    const data = await resp.json();
    // populate UI
    results.classList.remove('hidden');
    origText.textContent = data.original || text;
    hinText.textContent = data.hindi || data.translations?.hindi || '';
    engText.textContent = data.english || data.translations?.english || '';
    suggestionsList.innerHTML = '';
    (data.suggestions || []).forEach(s => {
      const li = document.createElement('li'); li.textContent = s; suggestionsList.appendChild(li);
    });
    imagesDiv.innerHTML = '';
    (data.images || []).forEach(url => {
      const img = document.createElement('img'); img.src = url; img.loading = 'lazy'; imagesDiv.appendChild(img);
    });

    // store last result for download
    window.__lastResult = data;

  }catch(err){
    console.error(err);
    alert('Error: '+err.message);
  }finally{
    generateBtn.disabled = false;
    generateBtn.textContent = 'Suggest & Create';
  }
});

copyAll.addEventListener('click', ()=>{
  const txt = [
    'Original:\\n', origText.textContent, '\\n\\nHindi:\\n', hinText.textContent, '\\n\\nEnglish:\\n', engText.textContent, '\\n\\nSuggestions:\\n',
    ...Array.from(suggestionsList.querySelectorAll('li')).map((l,i)=>`${i+1}. ${l.textContent}`)
  ].join('');
  navigator.clipboard.writeText(txt).then(()=>alert('Copied to clipboard!'));
});

downloadZip.addEventListener('click', async ()=>{
  const data = window.__lastResult;
  if(!data){ alert('No generated result yet.'); return; }
  // request server to build zip
  const resp = await fetch('/.netlify/functions/buildzip', {
    method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({payload:data})
  });
  if(!resp.ok){ alert('Could not make zip: '+(await resp.text())); return; }
  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'shayari-package.zip'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});