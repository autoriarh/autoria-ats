export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cv, job } = req.body;

  if (!cv || !job) {
    return res.status(400).json({ error: 'CV e vaga são obrigatórios' });
  }

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
        system: `Você é especialista em ATS e recrutamento brasileiro. Analise o currículo versus a vaga e retorne APENAS JSON válido, sem markdown:
{
  "score": <número 0-100>,
  "verdict": "<frase curta e honesta>",
  "keywords_found": ["até 6 termos encontrados no CV"],
  "keywords_missing": ["até 6 termos críticos ausentes"],
  "keywords_suggested": ["até 4 termos complementares"],
  "tips": [
    {"tag": "Resumo profissional", "text": "dica em 1-2 frases"},
    {"tag": "Experiências", "text": "dica em 1-2 frases"},
    {"tag": "Palavras-chave", "text": "dica em 1-2 frases"},
    {"tag": "Formato ATS", "text": "dica em 1-2 frases"}
  ],
  "rewritten_summary": "resumo reescrito em 3-4 linhas, primeira pessoa, tom humano"
}`,
        messages: [{ role: 'user', content: `CURRÍCULO:\n${cv}\n\nVAGA:\n${job}` }]
      })
    });

    const data = await response.json();
    const raw = data.content.filter(b => b.type ===
