export const qs = (s, el = document) => el.querySelector(s);
export const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));

export function el(html) {
  const d = document.createElement('div');
  d.innerHTML = html.trim();
  return d.firstElementChild;
}
