import { qs, qsa } from '../utils/dom.js';
import { chatState } from '../state.js';
import { showToast } from '../utils/toast.js';

export function initLLMDropdown() {
  const chooseBtn = qs('#chooseLLMBtn');
  const dropdown = qs('#llmDropdown');
  const applyBtn = qs('#applyLLMs');
  if (!chooseBtn || !dropdown || !applyBtn) return;

  const allCheckboxes = qsa('#llmDropdown input[type="checkbox"]');
  const autoSelect = qs('input[value="unisyn-auto"]', dropdown);
  const MAX_SELECTION = 4;

  chooseBtn.addEventListener('click', () => dropdown.classList.toggle('hidden'));

  applyBtn.addEventListener('click', () => {
    chatState.selectedLLMs = allCheckboxes.filter(cb => cb.checked).map(cb => cb.value);
    dropdown.classList.add('hidden');
  });

  if (autoSelect) {
    autoSelect.addEventListener('change', () => {
      const others = allCheckboxes.filter(cb => cb !== autoSelect);
      if (autoSelect.checked) {
        others.forEach(cb => {
          cb.checked = false;
          cb.disabled = true;
          cb.parentElement?.classList.add('opacity-40', 'cursor-not-allowed');
        });
      } else {
        others.forEach(cb => {
          cb.disabled = false;
          cb.parentElement?.classList.remove('opacity-40', 'cursor-not-allowed');
        });
      }
    });
  }

  allCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      if (autoSelect?.checked && cb !== autoSelect) {
        cb.checked = false;
        return;
      }

      const selected = allCheckboxes.filter(c => c.checked && c !== autoSelect);
      if (selected.length > MAX_SELECTION) {
        cb.checked = false;
        showToast(`You can select up to ${MAX_SELECTION} models only.`);
      }
    });
  });
}
