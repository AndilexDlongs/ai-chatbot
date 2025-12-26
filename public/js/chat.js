console.log('✅ chat.js loaded')

// --- CHAT LOGIC ---
const qs = (s, el = document) => el.querySelector(s)
const chatContainer = qs('#chatContainer')
const input = qs('#queryInput')
const sendBtn = qs('#sendBtn')
const textInputWrapper = qs('#textInputWrapper') // <-- ADD THIS
const expandBtn = qs('#expandBtn')               // <-- ADD THIS

const Icons = {
  good:  '<svg class="icon" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" stroke="currentColor"><path stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M7 11l3 3 7-7"/></svg>',
  bad:   '<svg class="icon" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" stroke="currentColor"><path stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M18 6L6 18M6 6l12 12"/></svg>',
  copy:  '<svg class="icon" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" stroke="currentColor"><rect x="9" y="9" width="13" height="13" rx="2" stroke-width="1.8"/><rect x="2" y="2" width="13" height="13" rx="2" stroke-width="1.8"/></svg>',
  share: '<svg class="icon" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" stroke="currentColor"><path stroke-width="1.8" d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7"/><path stroke-width="1.8" stroke-linecap="round" d="M12 16V4m0 0l4 4m-4-4l-4 4"/></svg>',
  edit:  '<svg class="icon" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" stroke="currentColor"><path stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 20h9"/><path stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>',
}

// ✅ Provider → logo (keep these paths as they exist in /assets/logos/)
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
}

// 🔎 Normalize any model/label/provider to a provider key
function getProviderKey(info) {
  const s = String(info || '').toLowerCase()
  if (s.includes('anthropic') || s.includes('claude')) return 'anthropic'
  if (s.includes('openai') || s.includes('gpt')) return 'openai'
  if (s.includes('google') || s.includes('gemini') || s.includes('gemma')) return 'google'
  if (s.includes('meta') || s.includes('llama')) return 'meta'
  if (s.includes('deepseek')) return 'deepseek'
  if (s.includes('grok') || s.includes('xai')) return 'xai'
  if (s.includes('perplexity') || s.includes('sonar')) return 'perplexity'
  if (s.includes('microsoft') || s.includes('phi')) return 'microsoft'
  if (s.includes('qwen')) return 'qwen'
  return 'unisyn-auto'
}

function el(html) {
  const d = document.createElement('div')
  d.innerHTML = html.trim()
  return d.firstElementChild
}

// ✅ USER BUBBLE with actions (right)
function createUserBubble(text) {
  const row = el(`<div class="msg-row user-message w-full justify-end"></div>`)
  const col = el(`<div class="msg-col flex flex-col items-end"></div>`)
  const bubble = el(`<div class="bubble-user msg-text" data-raw="${text.replaceAll('"','&quot;')}">${escapeHTML(text)}</div>`)
  const actions = el(`
    <div class="msg-actions user">
      <button class="icon-btn" data-action="copy" title="Copy" aria-label="Copy">${Icons.copy}</button>
      <button class="icon-btn" data-action="edit" title="Edit" aria-label="Edit">${Icons.edit}</button>
    </div>
  `);
  col.appendChild(bubble)
  col.appendChild(actions)
  row.appendChild(col)
  return row
}

// ✅ AI THINKING (logo left + dots)
function createAIThinking(modelIdOrLabel, labelText='Thinking') {
  const providerKey = getProviderKey(modelIdOrLabel)
  const logo = PROVIDER_LOGOS[providerKey] || PROVIDER_LOGOS['unisyn-auto']
  const row = el(`<div class="msg-row msg-ai w-full"></div>`)
  const avatar = el(`<div class="ai-avatar"><img src="${logo}" alt="${providerKey}"></div>`)
  const col = el(`<div class="msg-col"></div>`)
  const thinking = el(`
    <div class="thinking">
      <span class="msg-text">${labelText}</span>
      <span class="dots" aria-hidden="true"><span></span><span></span><span></span></span>
    </div>
  `)
  col.appendChild(thinking)
  row.appendChild(avatar)
  row.appendChild(col)
  return { row, col, providerKey }
}

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


// ✅ AI MESSAGE (clean body + actions; no bubble bg)
function createAIMessage(modelIdOrLabel, text) {
  const providerKey = getProviderKey(modelIdOrLabel);
  const logo = PROVIDER_LOGOS[providerKey] || PROVIDER_LOGOS['unisyn-auto'];

  const row = el(`<div class="msg-row msg-ai w-full"></div>`);
  const avatar = el(`<div class="ai-avatar"><img src="${logo}" alt="${providerKey}"></div>`);
  const col = el(`<div class="msg-col"></div>`);

  const raw = String(text || '(no response)');
  const normalized = normalizeMarkdown(raw); // 👈 bullet + spacing fixes here
  const html = DOMPurify.sanitize(marked.parse(normalized, { gfm: true, breaks: true }));

  const body = el(`<div class="msg-text" data-raw="${raw.replaceAll('"','&quot;')}"></div>`);
  body.innerHTML = html;
  enhanceCodeBlocks(body); // 👈 add code header + copy

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

function escapeHTML(s='') {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
}


// Make all textareas with .auto-expanding-textarea grow automatically
// const allTextareas = document.querySelectorAll('.auto-expanding-textarea');

// allTextareas.forEach(area => {
//   area.addEventListener('input', () => {
//     area.style.height = 'auto';
//     area.style.height = area.scrollHeight + 'px';
//   });
// });


// Utility to scroll to bottom
// function scrollToBottom() {
//   if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight
// }

function scrollToBottom() {
  const mainArea = document.querySelector('main'); // Select the scrolling container
  if (mainArea) {
    mainArea.scrollTo({
      top: mainArea.scrollHeight,
      behavior: 'smooth',
    });
  }
}

// // Create user bubble (right-aligned to full section width)
// function createUserBubble(text) {
//   const wrap = document.createElement('div')
//   // full width row, content pushed to the right
//   wrap.className = 'user-message flex justify-end w-full'
//   wrap.innerHTML = `
//     <div class="inline-block bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-br-none max-w-[70%] text-left">
//       ${text}
//     </div>
//   `
//   return wrap
// }

// --- LLM SELECTION DROPDOWN ---
const chooseBtn = document.getElementById('chooseLLMBtn')
const dropdown = document.getElementById('llmDropdown')
const applyBtn = document.getElementById('applyLLMs')

let selectedLLMs = []

if (chooseBtn && dropdown && applyBtn) {
  chooseBtn.addEventListener('click', () => {
    dropdown.classList.toggle('hidden')
  })

  applyBtn.addEventListener('click', () => {
    selectedLLMs = Array.from(
      dropdown.querySelectorAll('input[type="checkbox"]:checked')
    ).map(cb => cb.value)
    dropdown.classList.add('hidden')
    console.log('Selected LLMs:', selectedLLMs)
  })
}

// Handle send
async function handleSend() {
  const message = input.value.trim()
  if (!message) return

  // --- Trigger UI transition on first send ---
  if (!window.chatStarted) {
    window.chatStarted = true

    // 1️⃣ Fade out logo + tagline
    const heroSection = document.querySelector('.flex.flex-col.items-center.mb-8')
    if (heroSection) heroSection.classList.add('fade-out')
    setTimeout(() => heroSection?.remove(), 400)

    // 2️⃣ Move "Who do you want to talk to?" button to top bar
    const topBar = document.querySelector('header > div.flex.items-center.justify-between')
    const llmButtonContainer = document.getElementById('llmButtonContainer')
    const chooseBtn = document.getElementById('chooseLLMBtn')

    if (topBar && llmButtonContainer && chooseBtn) {
      chooseBtn.textContent = '🧠 Change who I’m speaking to'
      llmButtonContainer.style.margin = '0'
      llmButtonContainer.classList.remove('mt-3')
      llmButtonContainer.classList.add('absolute', 'left-1/2', '-translate-x-1/2')
      topBar.insertBefore(llmButtonContainer, topBar.querySelector('#settingsBtn'))
    }

    // 4️⃣ Let the main chat column use all available width
    const shell = document.getElementById('chatShell')
    if (shell) {
      shell.classList.add('chat-shell-wide')
    }

    // 5️⃣ Frame the chat container so you can see its width clearly
    const container = document.getElementById('chatContainer')
    if (container) {
      container.classList.add('fullwidth-chat')
    }

    // Move textbox to bottom section after first send
    const textbox = document.getElementById('textboxContainer');
    const bottomRegion = document.getElementById('bottomTextboxArea');

    if (textbox && bottomRegion) {
      bottomRegion.appendChild(textbox);
    }
  }

  // append user bubble
  chatContainer.appendChild(createUserBubble(message))
  input.value = ''
  input.style.height = 'auto'

  // *** ADD THIS BLOCK ***
  // Reset container height if it was expanded
  // *** UPDATE THIS BLOCK ***
  // Reset container height if it was expanded
  if (textInputWrapper) {
    textInputWrapper.style.maxHeight = '400px';
  }

  scrollToBottom()

  // Per-model "Thinking..." placeholders (stacked vertically, full width)
  // THINKING rows (one per model), then replace with finals
  const modelsToSend = (selectedLLMs && selectedLLMs.length) ? selectedLLMs : ['unisyn-auto']
  const pending = []
  modelsToSend.forEach(m => {
    const thinking = createAIThinking(m, 'Thinking')
    chatContainer.appendChild(thinking.row)
    pending.push(thinking)
  })
  scrollToBottom()

try {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: message,
      session_id: 'test-1',
      models: modelsToSend,
      conversation_type: 'isolated',
    }),
  })

  const data = await res.json()

  // Remove all thinking rows
  pending.forEach(p => p.row.remove())

    const results = Array.isArray(data.results) ? data.results : [data]
    results.forEach(resp => {
      const idOrLabel = resp.model || resp.provider || resp.vendor || resp.label || 'unisyn-auto'
      const finalRow = createAIMessage(idOrLabel, resp.text)
      chatContainer.appendChild(finalRow)
    })
    scrollToBottom()
  } catch (e) {
    pending.forEach(p => p.row.remove())
    const errorMsg = document.createElement('div')
    errorMsg.className = 'text-red-400 mt-2'
    errorMsg.textContent = 'Error contacting AI service.'
    chatContainer.appendChild(errorMsg)
    scrollToBottom()
  }
}


if (sendBtn && input) {
  sendBtn.addEventListener('click', handleSend)
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  })

  // auto-grow textarea vertically
  input.addEventListener('input', () => {
    input.style.height = 'auto'
    input.style.height = input.scrollHeight + 'px'
  })
}

// Handle expand button click
// Handle expand button click
if (expandBtn && textInputWrapper) {
  const defaultHeight = '400px';
  const expandedHeight = '900px';

  // Set the initial max-height just in case
  textInputWrapper.style.maxHeight = defaultHeight;

  expandBtn.addEventListener('click', () => {
    // Check the current inline style
    const isExpanded = textInputWrapper.style.maxHeight === expandedHeight;
    
    if (isExpanded) {
      // Collapse it
      textInputWrapper.style.maxHeight = defaultHeight;
      console.log('Collapsing to 400px');
    } else {
      // Expand it
      textInputWrapper.style.maxHeight = expandedHeight;
      console.log('Expanding to 900px');
    }
  });
} else {
  console.error('❌ Could not find #expandBtn or #textInputWrapper');
}

// --- LLM auto-select / limit logic ---
document.addEventListener('DOMContentLoaded', () => {
  const autoSelect = document.querySelector('input[value="unisyn-auto"]')
  const allCheckBoxes = document.querySelectorAll('#llmDropdown input[type="checkbox"]')

  if (!autoSelect) return

  autoSelect.addEventListener('change', () => {
    const others = Array.from(allCheckBoxes).filter(cb => cb !== autoSelect)

    if (autoSelect.checked) {
      // Uncheck and disable all others
      others.forEach(cb => {
        cb.checked = false
        cb.disabled = true
        cb.parentElement.classList.add('opacity-40', 'cursor-not-allowed')
      })
    } else {
      // Re-enable them when Unisyn is unchecked
      others.forEach(cb => {
        cb.disabled = false
        cb.parentElement.classList.remove('opacity-40', 'cursor-not-allowed')
      })
    }
  })
})

document.addEventListener('DOMContentLoaded', () => {
  const allCheckboxes = document.querySelectorAll('#llmDropdown input[type="checkbox"]')
  const autoSelect = document.querySelector('input[value="unisyn-auto"]')

  const MAX_SELECTION = 4

  allCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      // If Unisyn auto-select is turned on, stop any other action
      if (autoSelect && autoSelect.checked && cb !== autoSelect) {
        cb.checked = false
        return
      }

      // Enforce 4-model limit (excluding Unisyn)
      const selected = Array.from(allCheckboxes).filter(
        c => c.checked && c !== autoSelect
      )

      if (selected.length > MAX_SELECTION) {
        cb.checked = false
        showToast(`You can select up to ${MAX_SELECTION} models only.`)
      }
    })
  })

  // --- Helper toast ---
  function showToast(message) {
    const toast = document.createElement('div')
    toast.className =
      'fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none'

    const inner = document.createElement('div')
    inner.textContent = message
    inner.className =
      'text-white text-3xl sm:text-4xl font-bold px-10 py-6 rounded-2xl bg-zinc-900/95 ' +
      'border border-indigo-500/40 shadow-[0_0_50px_rgba(124,58,237,0.6)] ' +
      'backdrop-blur-lg animate-toast-in text-center select-none tracking-tight'

    toast.appendChild(inner)
    document.body.appendChild(toast)

    setTimeout(() => {
      inner.classList.add('animate-toast-out')
      setTimeout(() => toast.remove(), 400)
    }, 2500)
  }
})

document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar')
  const toggleBtn = document.getElementById('sidebarToggle')

  if (sidebar && toggleBtn) {
    const root = document.documentElement
    const collapsedWidth = '5rem'
    const expandedWidth = '16rem'

    // initial value
    root.style.setProperty('--sidebar-width', collapsedWidth)

    toggleBtn.addEventListener('click', () => {
      const expanded = sidebar.classList.toggle('sidebar-expanded')
      root.style.setProperty(
        '--sidebar-width',
        expanded ? expandedWidth : collapsedWidth
      )
    })
  }
})


document.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]')
  if (!btn) return
  const action = btn.dataset.action
  const row = btn.closest('.msg-row')
  const textEl = row?.querySelector('.msg-text')
  if (!textEl) return

  if (action === 'copy') {
    navigator.clipboard.writeText(textEl.innerText).then(() => {
      console.log('Copied')
    })
  } else if (action === 'edit') {
    // Toggle edit mode for user message
    const editable = textEl.getAttribute('contenteditable') === 'true'
    textEl.setAttribute('contenteditable', String(!editable))
    if (!editable) textEl.focus()
  } else if (action === 'good' || action === 'bad') {
    console.log(`Feedback: ${action}`, textEl.innerText.slice(0, 80))
  } else if (action === 'share') {
    const shareData = { text: textEl.innerText }
    if (navigator.share) navigator.share(shareData).catch(()=>{})
    else navigator.clipboard.writeText(shareData.text)
  }
})


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

// copy button for code blocks
document.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action="copy-code"]');
  if (!btn) return;
  const block = btn.closest('.code-block');
  const code = block?.querySelector('pre > code');
  if (!code) return;
  navigator.clipboard.writeText(code.innerText);
});
