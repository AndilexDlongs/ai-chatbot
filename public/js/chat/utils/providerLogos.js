export const PROVIDER_LOGOS = {
  openai: '/assets/logos/openai_dark.svg',
  anthropic: '/assets/logos/claude-ai-icon.svg',
  google: '/assets/logos/gemini.svg',
  meta: '/assets/logos/meta-color.svg',
  deepseek: '/assets/logos/deepseek.svg',
  xai: '/assets/logos/grok-dark.svg',
  perplexity: '/assets/logos/perplexity.svg',
  microsoft: '/assets/logos/copilot-color.svg',
  qwen: '/assets/logos/qwen_dark.svg',
  'unisyn-auto': '/assets/logos/unisyn-ai.svg',
};

export function getProviderKey(info) {
  const s = String(info || '').toLowerCase();
  if (s.includes('anthropic') || s.includes('claude')) return 'anthropic';
  if (s.includes('openai') || s.includes('gpt')) return 'openai';
  if (s.includes('google') || s.includes('gemini') || s.includes('gemma')) return 'google';
  if (s.includes('meta') || s.includes('llama')) return 'meta';
  if (s.includes('deepseek')) return 'deepseek';
  if (s.includes('grok') || s.includes('xai')) return 'xai';
  if (s.includes('perplexity') || s.includes('sonar')) return 'perplexity';
  if (s.includes('microsoft') || s.includes('phi')) return 'microsoft';
  if (s.includes('qwen')) return 'qwen';
  return 'unisyn-auto';
}
