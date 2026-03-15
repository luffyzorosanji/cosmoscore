exports.handler = async function(event, context) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { signName, signDates, element, planet, period } = JSON.parse(event.body);

    const today = new Date().toDateString();
    const prompt = `You are an expert astrologer. Generate a horoscope reading for ${signName} (${signDates}), a ${element} sign ruled by ${planet}, for ${period} period as of ${today}.

Respond ONLY with valid JSON, no markdown, no extra text:
{
  "overall": <integer 5-10>,
  "love": <integer 4-10>,
  "career": <integer 4-10>,
  "finance": <integer 4-10>,
  "love_insight": "<2 specific sentences about love for ${signName} this ${period}>",
  "career_insight": "<2 specific sentences about career for ${signName} this ${period}>",
  "finance_insight": "<2 specific sentences about finance for ${signName} this ${period}>",
  "overall_insight": "<2 sentences overall cosmic message for ${signName}>",
  "lucky_color": "<one color>",
  "lucky_day": "<one day of week>",
  "lucky_numbers": "<three numbers>"
}`;

    // API key is stored safely in Netlify environment variables
    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        max_tokens: 600,
        temperature: 0.8,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error('Groq API error: ' + response.status);
    }

    const data = await response.json();
    const text = data.choices[0].message.content.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(parsed)
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
