// Netlify Function: generate.js
// Uses the @google/generative-ai SDK to call Gemini server-side.
// Make sure to set GEMINI_API_KEY in Netlify environment variables.
const { GoogleGenerativeAI } = require('@google/generative-ai');
const apiKey = process.env.GEMINI_API_KEY;

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  const body = JSON.parse(event.body || '{}');
  const shayari = (body.shayari || '').trim();
  const name = body.name || 'Visitor';
  if(!shayari) return { statusCode: 400, body: 'No shayari provided' };

  try {
    if(!apiKey) return { statusCode: 500, body: 'Server missing GEMINI_API_KEY environment variable' };

    const googleAI = new GoogleGenerativeAI(apiKey);
    const model = googleAI.getGenerativeModel({ model: 'gemini-1.5-pro' }); // pick model available to your key

    // Compose a prompt that asks for translations, suggestions, and 2 image prompts
    const prompt = `You are a romantic poetry assistant. The user provided this shayari:\\n\"\"\"${shayari}\"\"\"\\nRespond JSON only with keys: original, translations:{hindi,english}, suggestions:array(2-3), imagePrompts:array(2). Keep strings short and poetic.`;

    const response = await model.generateContent({
      content: [{ type: 'text', text: prompt }],
      // optional params: temperature, maxOutputTokens
      maxOutputTokens: 800
    });

    // response parsing may vary by SDK; attempt to get text
    const raw = response?.output?.text || response?.text || JSON.stringify(response);
    // try to extract JSON
    let parsed;
    try{ parsed = JSON.parse(raw); }catch(e){
      // try to extract JSON substring
      const start = raw.indexOf('{'); const end = raw.lastIndexOf('}');
      if(start>=0 && end>start) parsed = JSON.parse(raw.slice(start, end+1));
    }

    // fallback minimal structure
    const original = parsed?.original || shayari;
    const translations = parsed?.translations || { hindi: parsed?.hindi || '', english: parsed?.english || '' };
    const suggestions = parsed?.suggestions || (parsed?.lines && Array.isArray(parsed.lines) ? parsed.lines.slice(0,3) : []);
    const imagePrompts = parsed?.imagePrompts || parsed?.images || [];

    // Generate images using the model's image generation if available OR call an image endpoint.
    // For simplicity we will ask the model to produce two image prompts and then call the image generator if supported.
    const images = [];
    for(const ip of imagePrompts.slice(0,2)){
      try{
        const imgResp = await model.generateContent({
          content: [{ type:'text', text: `Create an image prompt and then return a base64 PNG: ${ip}` }],
          maxOutputTokens: 1000
        });
        // Many deployments don't return base64 directly. Instead, here we call the model to produce an image URL placeholder.
        // For production, integrate with Gemini's image generation API properly.
        images.push('https://via.placeholder.com/800x600.png?text=' + encodeURIComponent(ip.substring(0,40)));
      }catch(e){
        images.push('https://via.placeholder.com/800x600.png?text=' + encodeURIComponent(ip.substring(0,40)));
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        original, translations, suggestions, images
      })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: String(err) };
  }
};