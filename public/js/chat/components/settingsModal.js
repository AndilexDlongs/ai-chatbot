// public/js/chat/components/settingsModal.js

/**
 * Settings modal logic:
 * - Open/close modal
 * - Persist API base URL to localStorage
 *
 * Requires in DOM:
 *  - #settingsModal (wrapper)
 *  - #apiBaseInput (input)
 *  - #settingsCancel (button)
 *  - #settingsSave (button)
 *
 * Optional in DOM (recommended):
 *  - #settingsBtn (button)  -> opens modal
 *
 * Storage key:
 *  - "unisyn_api_base"
 */
const STORAGE_KEY = 'unisyn_api_base';

export function getApiBase() {
  return (
    localStorage.getItem(STORAGE_KEY) ||
    'http://localhost:8787'
  );
}

export function setApiBase(url) {
  localStorage.setItem(STORAGE_KEY, String(url || '').trim());
}

export function initSettingsModal() {
  const modal = document.getElementById('settingsModal');
  const apiBaseInput = document.getElementById('apiBaseInput');
  const cancelBtn = document.getElementById('settingsCancel');
  const saveBtn = document.getElementById('settingsSave');
  const settingsBtn = document.getElementById('settingsBtn'); // optional

  if (!modal || !apiBaseInput || !cancelBtn || !saveBtn) {
    // If your UI doesn't include settings, that's okay.
    // This avoids breaking the whole app.
    return;
  }

  // Prefill from storage
  apiBaseInput.value = getApiBase();

  function open() {
    apiBaseInput.value = getApiBase();
    modal.classList.remove('hidden');
    // focus for quick editing
    setTimeout(() => apiBaseInput.focus(), 0);
  }

  function close() {
    modal.classList.add('hidden');
  }

  // Open by button if present
  if (settingsBtn) {
    settingsBtn.addEventListener('click', open);
  }

  // Close by Cancel
  cancelBtn.addEventListener('click', close);

  // Save
  saveBtn.addEventListener('click', () => {
    const value = apiBaseInput.value.trim();
    if (!value) return;

    setApiBase(value);
    close();
    console.log('✅ Saved API base:', value);
  });

  // Close on overlay click (click outside the card)
  modal.addEventListener('click', (e) => {
    const clickedBackdrop = e.target === modal || e.target.classList.contains('bg-black/60');
    if (clickedBackdrop) close();
  });

  // ESC closes
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) close();
  });
}
