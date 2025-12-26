import { qs } from '../utils/dom.js';
import { chatState } from '../state.js';
import { sendChat } from '../services/chatApi.js';
import { createUserBubble, createAIThinking, createAIMessage } from './messages.js';

export function initMainContent() {
  const chatContainer = qs('#chatContainer');
  const input = qs('#queryInput');
  const sendBtn = qs('#sendBtn');
  const textInputWrapper = qs('#textInputWrapper');
  const expandBtn = qs('#expandBtn');

  if (!chatContainer || !input || !sendBtn) return;

  // textarea autogrow
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = input.scrollHeight + 'px';
  });

  // expand/collapse input
  if (expandBtn && textInputWrapper) {
    const defaultHeight = '400px';
    const expandedHeight = '900px';
    textInputWrapper.style.maxHeight = defaultHeight;

    expandBtn.addEventListener('click', () => {
      const isExpanded = textInputWrapper.style.maxHeight === expandedHeight;
      textInputWrapper.style.maxHeight = isExpanded ? defaultHeight : expandedHeight;
    });
  }

  async function handleSend() {
    const message = input.value.trim();
    if (!message) return;

    // UI transition once
    if (!chatState.chatStarted) {
      chatState.chatStarted = true;
      const heroSection = document.querySelector('.flex.flex-col.items-center.mb-8');
      heroSection?.classList.add('fade-out');
      setTimeout(() => heroSection?.remove(), 400);
    }

    chatContainer.appendChild(createUserBubble(message));
    input.value = '';
    input.style.height = 'auto';

    if (textInputWrapper) textInputWrapper.style.maxHeight = '400px';

    const modelsToSend = chatState.selectedLLMs.length ? chatState.selectedLLMs : ['unisyn-auto'];

    const pending = modelsToSend.map(m => {
      const t = createAIThinking(m, 'Thinking');
      chatContainer.appendChild(t.row);
      return t;
    });

    scrollToBottom();

    try {
      const data = await sendChat({
        prompt: message,
        session_id: 'test-1',
        models: modelsToSend,
        conversation_type: 'isolated',
      });

      pending.forEach(p => p.row.remove());

      const results = Array.isArray(data.results) ? data.results : [data];
      results.forEach(resp => {
        const idOrLabel = resp.model || resp.provider || resp.vendor || resp.label || 'unisyn-auto';
        chatContainer.appendChild(createAIMessage(idOrLabel, resp.text));
      });

      scrollToBottom();
    } catch (err) {
      pending.forEach(p => p.row.remove());
      const errorMsg = document.createElement('div');
      errorMsg.className = 'text-red-400 mt-2';
      errorMsg.textContent = 'Error contacting AI service.';
      chatContainer.appendChild(errorMsg);
      scrollToBottom();
    }
  }

  sendBtn.addEventListener('click', handleSend);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });
}

function scrollToBottom() {
  const mainArea = document.querySelector('main');
  if (!mainArea) return;
  mainArea.scrollTo({ top: mainArea.scrollHeight, behavior: 'smooth' });
}
