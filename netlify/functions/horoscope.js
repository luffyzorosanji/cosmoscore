exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { signName, signDates, element, planet, period } = JSON.parse(event.body);
    const today = new Date().toDateString();
    const prompt = `You are an expert astrologer. Generate horoscope for ${signName} (${signDates}), ${element} sign ruled by ${planet}, for ${period} as of ${today}. Reply ONLY valid JSON no markdown: {"overall":<5-10>,"love":<4-10>,"career":<4-10>,"finance":<4-10>,"love_insight":"<2 sentences>","career_insight":"<2 sentences>","finance_insight":"<2 sentences>","overall_insight":"<2 sentences>","lucky_color":"<color>","lucky_day":"<day>","lucky_numbers":"<3 numbers>"}`;
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        max_tokens: 500,
        temperature: 0.8,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!response.ok) throw new Error('Groq error: ' + response.status);
    const data = await response.json();
    const text = data.choices[0].message.content.trim().replace(/```json|```/g,'').trim();
    const parsed = JSON.parse(text);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(parsed)
    };
  } catch(err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
