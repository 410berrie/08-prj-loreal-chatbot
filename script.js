/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");

/* App settings */
const API_URL = "https://api.openai.com/v1/chat/completions";

// System instructions keep the assistant focused on L'Oreal-related beauty topics.
const systemPrompt =
  "You are a helpful L'Oreal beauty assistant. Only answer questions related to L'Oreal products, beauty routines, product recommendations, or safe-for-work beauty topics. If a question is unrelated, unsafe, sexual, hateful, or violent, politely refuse and guide the user back to L'Oreal beauty questions. Keep answers clear, short, and practical.";

// Keep conversation history so the chatbot can remember previous messages.
const messages = [
  { role: "system", content: systemPrompt },
  {
    role: "assistant",
    content:
      "Hello! I can help with L'Oreal products, routines, and beauty recommendations. What would you like to explore?",
  },
];

/* Small helper: add one message bubble to the chat window */
function addMessageBubble(role, text) {
  const row = document.createElement("div");
  row.className = `message-row ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = text;

  row.appendChild(bubble);
  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Quick topic and safety filter */
function isAllowedBeautyQuestion(text) {
  const lowerText = text.toLowerCase();

  const blockedWords = [
    "sex",
    "nude",
    "porn",
    "kill",
    "weapon",
    "hate",
    "racist",
    "violence",
  ];

  // Expanded beauty vocabulary so the chatbot accepts a wider range of product questions.
  const beautyWords = [
    "loreal",
    "l'oreal",
    "paris",
    "skin",
    "skin type",
    "skincare",
    "makeup",
    "cosmetic",
    "cosmetics",
    "foundation",
    "concealer",
    "blush",
    "bronzer",
    "highlighter",
    "lip",
    "lipstick",
    "lip gloss",
    "lip liner",
    "eyeliner",
    "eyeshadow",
    "brow",
    "powder",
    "primer",
    "mascara",
    "serum",
    "retinol",
    "vitamin c",
    "hyaluronic",
    "niacinamide",
    "routine",
    "am routine",
    "pm routine",
    "hair",
    "haircare",
    "scalp",
    "hair mask",
    "leave in",
    "styling",
    "heat protectant",
    "shampoo",
    "conditioner",
    "beauty",
    "fragrance",
    "perfume",
    "eau de parfum",
    "eau de toilette",
    "spf",
    "sunscreen",
    "sunblock",
    "cleanser",
    "exfoliant",
    "toner",
    "moisturizer",
    "moisturiser",
    "acne",
    "dry skin",
    "oily skin",
    "combination skin",
    "sensitive skin",
    "anti aging",
    "wrinkle",
    "dark spot",
    "hyperpigmentation",
    "redness",
    "pores",
    "makeup remover",
    "micellar",
    "maybelline",
    "garnier",
    "lancome",
    "vichy",
    "cerave",
    "kiehl",
    "urban decay",
    "essie",
    "matrix",
    "kerastase",
    "yves saint laurent beauty",
    "ysl beauty",
    "giorgio armani beauty",
    "recommend",
    "recommendation",
    "shade match",
    "undertone",
  ];

  // Follow-up prompts should be allowed even when they do not repeat beauty keywords.
  const followUpWords = [
    "tell me more",
    "more info",
    "more information",
    "can you elaborate",
    "elaborate",
    "expand",
    "explain more",
    "what do you mean",
    "give more details",
    "more details",
    "why",
    "how so",
    "can you clarify",
    "clarify",
  ];

  const hasBlockedWord = blockedWords.some((word) => lowerText.includes(word));
  const hasBeautyWord = beautyWords.some((word) => lowerText.includes(word));

  const hasFollowUpWord = followUpWords.some((word) =>
    lowerText.includes(word),
  );

  // Find the latest assistant message in conversation history.
  const lastAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");

  // Only allow follow-up prompts when the previous assistant response was not a refusal.
  const lastWasRefusal = lastAssistantMessage
    ? lastAssistantMessage.content
        .toLowerCase()
        .includes("i can only help with l'oreal products")
    : false;

  const isFollowUpRequest = hasFollowUpWord && !lastWasRefusal;

  return !hasBlockedWord && (hasBeautyWord || isFollowUpRequest);
}

// Render starter assistant message.
addMessageBubble("assistant", messages[1].content);

/* Call OpenAI Chat Completions API */
async function getAssistantResponse() {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages,
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userMessage = userInput.value.trim();
  if (!userMessage) {
    return;
  }

  // Show user message first (above assistant message).
  addMessageBubble("user", userMessage);
  messages.push({ role: "user", content: userMessage });

  userInput.value = "";
  sendBtn.disabled = true;

  // If question is unrelated or unsafe, refuse politely without calling the API.
  if (!isAllowedBeautyQuestion(userMessage)) {
    const refusalMessage =
      "I can only help with L'Oreal products, beauty routines, and safe-for-work beauty questions. Please ask me about skincare, makeup, haircare, or product recommendations.";
    addMessageBubble("assistant", refusalMessage);
    messages.push({ role: "assistant", content: refusalMessage });
    sendBtn.disabled = false;
    return;
  }

  // Temporary bubble so users know a response is in progress.
  addMessageBubble("assistant", "Typing...");

  try {
    const assistantReply = await getAssistantResponse();

    // Replace the temporary "Typing..." bubble with real response.
    chatWindow.lastElementChild.remove();
    addMessageBubble("assistant", assistantReply);
    messages.push({ role: "assistant", content: assistantReply });
  } catch (error) {
    chatWindow.lastElementChild.remove();
    const errorMessage =
      "Sorry, I could not reach the AI service right now. Please try again in a moment.";
    addMessageBubble("assistant", errorMessage);
    messages.push({ role: "assistant", content: errorMessage });
    console.error(error);
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
});
