export async function callLLMApi(payload) {
  const llmApiUrl = process.env.LLM_API_BASE_URL || 'http://localhost:8000/api';

  const response = await fetch(`${llmApiUrl}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return data;
}
