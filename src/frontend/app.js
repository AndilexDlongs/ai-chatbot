// app.js — Group Chat Simulation (4 AI responses)

const qs = (s, el = document) => el.querySelector(s)
const chatContainer = qs("#chatContainer")
const input = qs("#queryInput")
const sendBtn = qs("#sendBtn")

// Utility to scroll to bottom of chat
function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight
}

// Create a user message bubble
function createUserBubble(text) {
  const wrap = document.createElement("div")
  wrap.className = "text-right"
  wrap.innerHTML = `
    <div class="inline-block bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-br-none max-w-[70%]">
      ${text}
    </div>
  `
  return wrap
}

// Create a grid of 4 AI responses
function createAIGroupResponses() {
  const grid = document.createElement("div")
  grid.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"

  // 4 placeholder AIs
  const placeholders = [
    "AI-1: Hey there! I'm good 😄",
    "AI-2: Doing great, thanks for checking in!",
    "AI-3: Always ready to chat 💬",
    "AI-4: Processing... oh wait, I'm fine too 🤖"
  ]

  for (let i = 0; i < 4; i++) {
    const card = document.createElement("div")
    card.className =
      "bg-zinc-800 text-zinc-200 p-4 rounded-2xl flex flex-col justify-between"
    card.innerHTML = `<p>${placeholders[i]}</p>`
    grid.appendChild(card)
  }

  return grid
}

// Handle send event
async function handleSend() {
  const message = input.value.trim()
  if (!message) return

  // Append user message bubble
  const userMsg = createUserBubble(message)
  chatContainer.appendChild(userMsg)
  input.value = ""
  scrollToBottom()

  // Add temporary loading grid
  const loadingGrid = document.createElement("div")
  loadingGrid.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
  for (let i = 0; i < 4; i++) {
    const card = document.createElement("div")
    card.className = "bg-zinc-800 text-zinc-400 p-4 rounded-2xl animate-pulse"
    card.innerHTML = `<p>Thinking...</p>`
    loadingGrid.appendChild(card)
  }
  chatContainer.appendChild(loadingGrid)
  scrollToBottom()

  try {
    // Send to backend proxy (Express → FastAPI)
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: message,
        session_id: "web-user",
      }),
    })
    const data = await res.json()

    // Remove loading grid
    loadingGrid.remove()

    // Create real AI responses grid
    const grid = document.createElement("div")
    grid.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"

    data.results.slice(0, 4).forEach((resp) => {
      const card = document.createElement("div")
      card.className =
        "bg-zinc-800 text-zinc-200 p-4 rounded-2xl flex flex-col justify-between"
      card.innerHTML = `
        <div class="font-semibold text-sm mb-2">${resp.label || resp.model}</div>
        <p class="text-sm leading-relaxed">${resp.text || resp.error || "(no response)"}</p>
      `
      grid.appendChild(card)
    })

    chatContainer.appendChild(grid)
    scrollToBottom()
  } catch (err) {
    console.error(err)
    loadingGrid.remove()
    const errorMsg = document.createElement("div")
    errorMsg.className =
      "text-red-400 bg-red-900/40 border border-red-800 px-4 py-2 rounded-lg mt-2"
    errorMsg.textContent = "Error contacting AI service."
    chatContainer.appendChild(errorMsg)
  }
}


// Event listeners
sendBtn.addEventListener("click", handleSend)
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
})
