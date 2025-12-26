// public/js/chat/components/topnav.js

/**
 * Top Nav logic:
 * - Share button
 * - (Optional) place for future: settings button, title updates, etc.
 *
 * Requires in DOM:
 *  - #shareBtn (button)
 */
export function initTopNav() {
  const shareBtn = document.getElementById('shareBtn');
  if (!shareBtn) return;

  shareBtn.addEventListener('click', async () => {
    // Prefer Web Share API on supported devices
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: document.title || 'Unisyn AI',
          text: 'Join my Unisyn AI chat',
          url,
        });
        return;
      }

      // Fallback: copy link to clipboard
      await navigator.clipboard.writeText(url);
      // Minimal feedback (no dependency on toast module)
      shareBtn.classList.add('ring-2', 'ring-indigo-500/40');
      setTimeout(() => shareBtn.classList.remove('ring-2', 'ring-indigo-500/40'), 600);
      console.log('✅ Link copied to clipboard');
    } catch (err) {
      console.error('❌ Share failed:', err);
    }
  });
}
