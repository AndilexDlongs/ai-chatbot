import { qs } from '../utils/dom.js';

export function initSidebar() {
  const sidebar = qs('#sidebar');
  const toggleBtn = qs('#sidebarToggle');
  if (!sidebar || !toggleBtn) return;

  const root = document.documentElement;
  const collapsedWidth = '5rem';
  const expandedWidth = '16rem';

  root.style.setProperty('--sidebar-width', collapsedWidth);

  toggleBtn.addEventListener('click', () => {
    const expanded = sidebar.classList.toggle('sidebar-expanded');
    root.style.setProperty('--sidebar-width', expanded ? expandedWidth : collapsedWidth);
  });
}
