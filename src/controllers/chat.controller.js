import { callLLMApi } from '../services/llm.service.js';

export async function chatProxy(req, res) {
  try {
    const data = await callLLMApi(req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
