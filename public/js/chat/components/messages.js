// public/js/chat/components/messages.js

// This module is responsible for:
// - Building message DOM nodes (user bubbles, AI thinking rows, AI final messages)
// - Markdown normalisation + rendering (marked + DOMPurify)
// - Code block enhancement (header bar + copy code)
// - Message action handlers (copy/edit/good/bad/share, copy-code)

const Icons = {
  good:  '<svg class="icon" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" stroke="currentColor"><path stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M7 11l3 3 7-7"/></svg>',
  bad:   '<svg class="icon" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" stroke="currentColor"><path stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M18 6L6 18M6 6l12 12"/></svg>',
  copy:  '<svg class="icon" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" stroke="currentColor"><rect x="9" y="9" width="13" height="13" rx="2" stroke-width="1.8"/><rect x="2" y="2" width="13" height="13" rx="2" stroke-width="1.8"/></svg>',
  share: '<svg class="icon" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" stroke="currentColor"><path stroke-width="1.8" d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7"/><path stroke-width="1.8" stroke-linecap="round" d="M12 16V4m0 0l4 4m-4-4l-4 4"/></svg>',
  edit:  '<svg class="icon" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" stroke="currentColor"><path stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 20h9"/><path stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>',
};

// Keep these paths as they exist in /public/assets/logos/
const PROVIDER_LOGOS = {
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

// Normalize any model/label/provider string to a provider key
function getProviderKey(info) {
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

function el(html) {
  const d = document.createElement('div');
  d.innerHTML = html.trim();
  return d.firstElementChild;
}

function escapeHTML(s = '') {
  return s.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// --- Markdown normalisation (fix bullets, spacing, etc.) ---
function normalizeMarkdown(raw) {
  // Protect fenced code: split on ```
  const parts = String(raw).split(/```/);
  for (let i = 0; i < parts.length; i += 2) {
    let seg = parts[i];

    // Collapse large vertical gaps
    seg = seg.replace(/\n{3,}/g, '\n\n');

    // Convert bullets like •, –, —, ·, *, ●, etc. → "- "
    seg = seg.replace(/^\s*[•◦▪▫‣∙·●○∘–—*]\s+(.*)$/gm, (_, a) => `- ${a}`);

    // Convert "1) " or "1] " to "1. "
    seg = seg.replace(/^\s*(\d+)[\)\]]\s+(.*)$/gm, (_, n, a) => `${n}. ${a}`);

    parts[i] = seg;
  }
  return parts.join('```');
}

// --- Code block enhancer ---
function guessLanguageFromContent(text) {
  if (/^\s*<!DOCTYPE html>|<html[\s>]/i.test(text)) return 'html';
  if (/^\s*(import .* from|export |const |let |document\.|console\.)/m.test(text)) return 'js';
  if (/^\s*def\s+\w+\(|^\s*import\s+\w+/m.test(text)) return 'python';
  if (/^#include\s+<\w+/.test(text)) return 'cpp';
  if (/^\s*SELECT\b/i.test(text)) return 'sql';
  if (/^\s*package\s+\w+;|public\s+class\b/.test(text)) return 'java';
  return 'code';
}

function enhanceCodeBlocks(container) {
  container.querySelectorAll('pre > code').forEach(code => {
    const pre = code.parentElement;
    const cls = code.className || '';
    let lang = (cls.match(/language-([\w+-]+)/) || [])[1];
    if (!lang) lang = guessLanguageFromContent(code.textContent);

    const wrap = document.createElement('div');
    wrap.className = 'code-block';

    const bar = document.createElement('div');
    bar.className = 'code-bar';
    bar.innerHTML = `
      <span class="lang">${lang}</span>
      <button class="code-copy-btn" data-action="copy-code" title="Copy code" aria-label="Copy code">
        ${Icons.copy}
      </button>
    `;

    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(bar);
    wrap.appendChild(pre);
  });
}

// --- Message builders ---
function createUserBubble(text) {
  const row = el(`<div class="msg-row user-message w-full justify-end"></div>`);
  const col = el(`<div class="msg-col flex flex-col items-end"></div>`);
  const bubble = el(
    `<div class="bubble-user msg-text" data-raw="${String(text).replaceAll('"','&quot;')}">${escapeHTML(text)}</div>`
  );

  const actions = el(`
    <div class="msg-actions user">
      <button class="icon-btn" data-action="copy" title="Copy" aria-label="Copy">${Icons.copy}</button>
      <button class="icon-btn" data-action="edit" title="Edit" aria-label="Edit">${Icons.edit}</button>
    </div>
  `);

  col.appendChild(bubble);
  col.appendChild(actions);
  row.appendChild(col);
  return row;
}

function createAIThinking(modelIdOrLabel, labelText = 'Thinking') {
  const providerKey = getProviderKey(modelIdOrLabel);
  const logo = PROVIDER_LOGOS[providerKey] || PROVIDER_LOGOS['unisyn-auto'];

  const row = el(`<div class="msg-row msg-ai w-full"></div>`);
  const avatar = el(`<div class="ai-avatar"><img src="${logo}" alt="${providerKey}"></div>`);
  const col = el(`<div class="msg-col"></div>`);

  const thinking = el(`
    <div class="thinking">
      <span class="msg-text">${labelText}</span>
      <span class="dots" aria-hidden="true"><span></span><span></span><span></span></span>
    </div>
  `);

  col.appendChild(thinking);
  row.appendChild(avatar);
  row.appendChild(col);
  return { row, col, providerKey };
}

function createAIMessage(modelIdOrLabel, text) {
  const providerKey = getProviderKey(modelIdOrLabel);
  const logo = PROVIDER_LOGOS[providerKey] || PROVIDER_LOGOS['unisyn-auto'];

  const row = el(`<div class="msg-row msg-ai w-full"></div>`);
  const avatar = el(`<div class="ai-avatar"><img src="${logo}" alt="${providerKey}"></div>`);
  const col = el(`<div class="msg-col"></div>`);

  const raw = String(text || '(no response)');
  const normalized = normalizeMarkdown(raw);

  // marked + DOMPurify must be loaded globally in chat page
  const html = DOMPurify.sanitize(marked.parse(normalized, { gfm: true, breaks: true }));

  const body = el(`<div class="msg-text" data-raw="${raw.replaceAll('"','&quot;')}"></div>`);
  body.innerHTML = html;
  enhanceCodeBlocks(body);

  const actions = el(`
    <div class="msg-actions ai">
      <button class="icon-btn" data-action="good"  title="Good">${Icons.good}</button>
      <button class="icon-btn" data-action="bad"   title="Bad">${Icons.bad}</button>
      <button class="icon-btn" data-action="copy"  title="Copy">${Icons.copy}</button>
      <button class="icon-btn" data-action="share" title="Share">${Icons.share}</button>
    </div>
  `);

  col.appendChild(body);
  col.appendChild(actions);
  row.appendChild(avatar);
  row.appendChild(col);
  return row;
}

// --- Action handlers (delegate once) ---
function attachMessageActionHandlers(rootEl = document) {
  // copy/edit/good/bad/share
  rootEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;

    // Copy-code is handled separately below (still uses data-action but scoped)
    if (action === 'copy-code') return;

    const row = btn.closest('.msg-row');
    const textEl = row?.querySelector('.msg-text');
    if (!textEl) return;

    if (action === 'copy') {
      navigator.clipboard.writeText(textEl.innerText).catch(() => {});
    } else if (action === 'edit') {
      const editable = textEl.getAttribute('contenteditable') === 'true';
      textEl.setAttribute('contenteditable', String(!editable));
      if (!editable) textEl.focus();
    } else if (action === 'good' || action === 'bad') {
      // Hook this into your analytics later
      console.log(`Feedback: ${action}`, textEl.innerText.slice(0, 80));
    } else if (action === 'share') {
      const shareData = { text: textEl.innerText };
      if (navigator.share) navigator.share(shareData).catch(() => {});
      else navigator.clipboard.writeText(shareData.text).catch(() => {});
    }
  });

  // copy-code buttons
  rootEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action="copy-code"]');
    if (!btn) return;

    const block = btn.closest('.code-block');
    const code = block?.querySelector('pre > code');
    if (!code) return;

    navigator.clipboard.writeText(code.innerText).catch(() => {});
  });
}

export {
  Icons,
  PROVIDER_LOGOS,
  getProviderKey,
  normalizeMarkdown,
  enhanceCodeBlocks,
  createUserBubble,
  createAIThinking,
  createAIMessage,
  attachMessageActionHandlers,
};
