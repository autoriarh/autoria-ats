module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { cv, job } = req.body || {};
  if (!cv || !job) return res.status(400).json({ error: 'CV e vaga são obrigatórios' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: 'Você é especialista em ATS e recrutamento brasileiro. Analise o currículo versus a vaga. Retorne SOMENTE um objeto JSON válido, sem nenhum texto antes ou depois, sem markdown, sem backticks. O JSON deve ter exatamente estas chaves: score (número inteiro entre 0 e 100), verdict (string), keywords_found (array de strings), keywords_missing (array de strings), keywords_suggested (array de strings), tips (array de objetos com tag e text), rewritten_summary (string).',
        messages: [{ role: 'user', content: `CURRÍCULO:\n${cv}\n\nVAGA:\n${job}\n\nRetorne apenas o JSON.` }]
      })
    });

    const data = await response.json();
    
    if (!data.content || !data.content[0]) {
      return res.status(500).json({ error: 'Resposta inválida da API', details: JSON.stringify(data) });
    }

    const raw = data.content[0].text;
    
    // Clean and parse JSON
    const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleaned);
    
    // Ensure score is between 0-100
    result.score = Math.min(100, Math.max(0, parseInt(result.score) || 0));
    
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
