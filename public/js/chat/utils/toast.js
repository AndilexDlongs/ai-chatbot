export function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none';

  const inner = document.createElement('div');
  inner.textContent = message;
  inner.className =
    'text-white text-3xl sm:text-4xl font-bold px-10 py-6 rounded-2xl bg-zinc-900/95 ' +
    'border border-indigo-500/40 shadow-[0_0_50px_rgba(124,58,237,0.6)] ' +
    'backdrop-blur-lg animate-toast-in text-center select-none tracking-tight';

  toast.appendChild(inner);
  document.body.appendChild(toast);

  setTimeout(() => {
    inner.classList.add('animate-toast-out');
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}
