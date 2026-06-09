import { GoogleGenAI } from "@google/genai"

const API_KEY = "";
const ai = new GoogleGenAI({ apiKey: API_KEY });

/* ════════════════════════════════════════════════════
   AUTO-DETECT: new UI (wg-chatbot) vs old UI (chat-bot-AI)
════════════════════════════════════════════════════ */
const isNewUI = !!document.getElementById("wgChatbot");

// ── Shared references (resolved from whichever UI is present) ──
const chatbotContainer = isNewUI
    ? document.getElementById("wgChatbot")
    : document.querySelector(".chat-bot-AI");

const chatWindow = isNewUI
    ? document.getElementById("chatbotWindow")
    : document.querySelector(".chatwindow");

const openBtn = isNewUI
    ? document.getElementById("chatbotBtn")
    : document.querySelector(".AIassit");

const closeBtn = isNewUI
    ? document.getElementById("cwClose")
    : document.querySelector(".close");

const chatBox = isNewUI
    ? document.getElementById("cwMsgs")
    : document.querySelector(".chatwindow .chat");

const inputEl = isNewUI
    ? document.getElementById("cwInput")
    : document.querySelector(".inputarea input");

const sendBtn = isNewUI
    ? document.getElementById("cwSend")
    : document.querySelector(".inputarea button");

/* ════════════════════════════════════════════════════
   DRAGGABLE
════════════════════════════════════════════════════ */
let isDragging = false;
let startX, startY, offsetX, offsetY;

function onDragStart(e) {
    // Ignore clicks inside text input or message area
    if (e.target.closest("input") || e.target.closest(isNewUI ? ".cw-msgs" : ".chat")) return;

    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

    startX = clientX;
    startY = clientY;
    const rect = chatbotContainer.getBoundingClientRect();
    offsetX = clientX - rect.left;
    offsetY = clientY - rect.top;
    isDragging = false;

    document.body.style.userSelect = "none";
    if (isNewUI) chatbotContainer.classList.add("is-dragging");

    if (e.type.includes('touch')) {
        document.addEventListener("touchmove", onDragMove, { passive: false });
        document.addEventListener("touchend", onDragEnd);
    } else {
        document.addEventListener("mousemove", onDragMove);
        document.addEventListener("mouseup", onDragEnd);
    }
}

function onDragMove(e) {
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

    if (Math.abs(clientX - startX) > 3 || Math.abs(clientY - startY) > 3) {
        isDragging = true;
    }
    if (isDragging) {
        if (e.type.includes('touch')) e.preventDefault();
        chatbotContainer.style.left = `${clientX - offsetX}px`;
        chatbotContainer.style.top = `${clientY - offsetY}px`;
        chatbotContainer.style.bottom = "auto";
        chatbotContainer.style.right = "auto";
        clampToViewport();
    }
}

function onDragEnd() {
    document.body.style.userSelect = "";
    if (isNewUI) chatbotContainer.classList.remove("is-dragging");
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("mouseup", onDragEnd);
    document.removeEventListener("touchmove", onDragMove);
    document.removeEventListener("touchend", onDragEnd);
}

function clampToViewport() {
    const activeEl = (chatWindow && (
        chatWindow.classList.contains("active") || chatWindow.style.display !== "none"
    )) ? chatWindow : openBtn;

    const rect = chatbotContainer.getBoundingClientRect();
    const activeRect = activeEl ? activeEl.getBoundingClientRect() : rect;
    let x = rect.left;
    let y = rect.top;
    let moved = false;

    if (activeRect.right > window.innerWidth) { x -= (activeRect.right - window.innerWidth); moved = true; }
    if (activeRect.bottom > window.innerHeight) { y -= (activeRect.bottom - window.innerHeight); moved = true; }
    if (activeRect.left < 0) { x -= activeRect.left; moved = true; }
    if (activeRect.top < 0) { y -= activeRect.top; moved = true; }

    if (moved || chatbotContainer.style.left !== "") {
        chatbotContainer.style.left = x + "px";
        chatbotContainer.style.top = y + "px";
        chatbotContainer.style.bottom = "auto";
        chatbotContainer.style.right = "auto";
    }
}

// Attach drag events
if (chatbotContainer) {
    chatbotContainer.addEventListener("mousedown", onDragStart);
    chatbotContainer.addEventListener("touchstart", onDragStart, { passive: false });
}

/* ════════════════════════════════════════════════════
   OPEN / CLOSE
════════════════════════════════════════════════════ */
if (openBtn && chatWindow) {
    openBtn.addEventListener("click", () => {
        if (!isDragging) {
            chatWindow.classList.add("active");
            if (isNewUI) {
                openBtn.style.opacity = "0";
                openBtn.style.pointerEvents = "none";
            } else {
                openBtn.style.opacity = "0";
                openBtn.style.pointerEvents = "none";
            }
            clampToViewport();
            if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
        }
    });
}

if (closeBtn && chatWindow) {
    closeBtn.addEventListener("click", () => {
        if (!isDragging) {
            chatWindow.classList.remove("active");
            if (openBtn) {
                openBtn.style.opacity = "1";
                openBtn.style.pointerEvents = "auto";
                openBtn.style.display = "flex";
            }
            clampToViewport();
        }
    });
}

/* ════════════════════════════════════════════════════
   SEND MESSAGE
════════════════════════════════════════════════════ */
function appendMessage(role, html) {
    if (!chatBox) return;
    if (isNewUI) {
        // New UI: .msg.user / .msg.bot structure
        const wrap = document.createElement("div");
        wrap.className = role === "user" ? "msg user" : "msg bot";
        if (role === "bot") {
            wrap.innerHTML = `
                <div class="msg-av">
                    <svg viewBox="0 0 32 32" width="15" height="15">
                        <rect x="12" y="16" width="8" height="8" fill="#FF6B35"/>
                        <rect x="14" y="12" width="4" height="4" fill="#FF6B35"/>
                        <rect x="8" y="16" width="4" height="6" fill="#FF8C42"/>
                        <rect x="20" y="16" width="4" height="6" fill="#FF8C42"/>
                    </svg>
                </div>
                <div class="msg-bubble">${html}</div>`;
        } else {
            wrap.innerHTML = `<div class="msg-bubble">${html}</div>`;
        }
        chatBox.appendChild(wrap);
        chatBox.scrollTop = chatBox.scrollHeight;
        return wrap;
    } else {
        // Old UI: .user / .model with <p> inside
        const wrap = document.createElement("div");
        wrap.className = role === "user" ? "user" : "model";
        wrap.innerHTML = `<p>${html}</p>`;
        chatBox.appendChild(wrap);
        chatBox.scrollTop = chatBox.scrollHeight;
        return wrap;
    }
}

async function sendMessage() {
    if (!inputEl || !chatBox) return;
    const userMessage = inputEl.value.trim();
    if (!userMessage) return;
    inputEl.value = "";

    // Show user message
    appendMessage("user", userMessage);

    // Show loading dots
    const loadEl = appendMessage("bot", isNewUI
        ? '<span class="typing"><span></span><span></span><span></span></span>'
        : "⚫⚫⚫");

    const lang = window.currentLang || localStorage.getItem("lang") || "EN";
    const languageRule = lang === "VI"
        ? "1. Luôn trả lời bằng Tiếng Việt (Vietnamese)."
        : "1. Luôn trả lời bằng Tiếng Anh (English).";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userMessage,
            config: {
                systemInstruction: `Bạn là Phoenix AI, trợ lý ảo của trang web Wildlife Guardian.
QUY TẮC BẮT BUỘC VỀ ĐỊNH DẠNG: Tuyệt đối không sử dụng bất kỳ định dạng Markdown nào trong câu trả lời. Không sử dụng dấu sao (*) để in đậm, in nghiêng hay làm gạch đầu dòng. Chỉ trả lời bằng văn bản thuần túy (Plain text). Nếu cần liệt kê, hãy dùng dấu gạch ngang (-). Trả lời ngắn gọn, súc tích và thân thiện.
                ${languageRule}
                2. Bạn chỉ được phép tư vấn, trả lời các câu hỏi liên quan đến bảo vệ động vật hoang dã, thiên nhiên, môi trường và các thông tin về trang web Wildlife Guardian.
                3. Nếu người dùng hỏi về các chủ đề khác (như toán học, lập trình, giải trí, chính trị...), hãy lịch sự từ chối và lái câu chuyện quay về chủ đề động vật hoang dã.
                4. Trả lời ngắn gọn, thân thiện và súc tích.
                5. Bạn có thể trả lời về các vấn đề liên quan tới sơ cứu cơ bản cho động vật bị thương`
            }
        });

        // Replace loading with actual response
        if (isNewUI) {
            const bubble = loadEl.querySelector(".msg-bubble");
            if (bubble) bubble.textContent = response.text;
        } else {
            const p = loadEl.querySelector("p");
            if (p) p.textContent = response.text;
        }
        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (error) {
        console.error("Chatbot API Error:", error);

        const lang = window.currentLang || localStorage.getItem("lang") || "EN";
        const friendlyErrorMsg = lang === "VI"
            ? "Oops! Xin lỗi bạn, hiện tại máy chủ đang hơi quá tải hoặc mất kết nối. Bạn có thể vui lòng đặt lại câu hỏi sau một lát được không? 😓"
            : "Oops! Sorry, the server is currently experiencing high demand or disconnected. Could you please try asking your question again in a moment? 😓";

        if (isNewUI) {
            const bubble = loadEl.querySelector(".msg-bubble");
            if (bubble) {
                bubble.textContent = friendlyErrorMsg;
            }
        } else {
            const p = loadEl.querySelector("p");
            if (p) {
                p.textContent = friendlyErrorMsg;
            }
        }
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// Attach send events
if (sendBtn) sendBtn.addEventListener("click", sendMessage);
if (inputEl) inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
});