// app.js — UI simulation only (no AI or API logic)

const qs = (s, el = document) => el.querySelector(s);
const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));

const input = qs("#queryInput");
const sendBtn = qs("#sendBtn");
const resultsWrap = qs("#resultsWrap");
const results = qs("#results");
const statusEl = qs("#status");

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (m) => {
    return (
      {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[m] || m
    );
  });
}

// Creates a mock response card
function renderCard(prompt) {
  const wrap = document.createElement("div");
  wrap.className =
    "fade-in card-surface rounded-2xl p-4 transition";

  wrap.innerHTML = `
    <div class="flex items-center justify-between mb-2 gap-2">
      <div class="text-sm font-medium text-zinc-100">Mock Model</div>
    </div>
    <div class="relative response-bubble p-3">
      <pre class="mono whitespace-pre-wrap text-[13.5px] leading-6 response-body">
${esc("You asked: " + prompt + "\n\nThis is just a mock response for UI testing.")}
      </pre>
    </div>
  `;
  return wrap;
}

async function handleSend() {
  const prompt = input.value.trim();
  if (!prompt) return;

  resultsWrap.classList.remove("hidden");
  statusEl.textContent = "Generating response…";
  results.innerHTML = "";

  // Simulate loading delay
  await new Promise((r) => setTimeout(r, 600));

  results.appendChild(renderCard(prompt));
  statusEl.textContent = "Done — 1 mock response";

  input.value = "";
}

sendBtn.addEventListener("click", handleSend);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});
