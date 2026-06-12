
// Auto-detect API base URL: localhost:3000 for dev, origin for production
const API_BASE_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:3000' : location.origin;

/* ════════════════════════════════════════════════════
   AUTO-INJECT: Chatbot HTML if not present
════════════════════════════════════════════════════ */
if (!document.getElementById("wgChatbot")) {
    const chatbotHTML = `
  <div class="wg-chatbot" id="wgChatbot">
    <button class="chatbot-btn" id="chatbotBtn" title="Drag me anywhere!">
      <svg class="pixel-phoenix" viewBox="0 0 32 32" width="32" height="32">
        <rect x="12" y="16" width="8" height="8" fill="#FF6B35" />
        <rect x="14" y="12" width="4" height="4" fill="#FF6B35" />
        <rect x="18" y="13" width="2" height="2" fill="#FFD93D" />
        <rect x="15" y="13" width="2" height="2" fill="#1a1a1a" />
        <rect x="8" y="16" width="4" height="6" fill="#FF8C42" />
        <rect x="20" y="16" width="4" height="6" fill="#FF8C42" />
        <rect x="10" y="24" width="2" height="4" fill="#FF6B35" />
        <rect x="14" y="24" width="2" height="6" fill="#FFD93D" />
        <rect x="18" y="24" width="2" height="4" fill="#FF6B35" />
        <rect x="13" y="8" width="2" height="4" fill="#FFD93D" />
        <rect x="15" y="6" width="2" height="6" fill="#FF6B35" />
        <rect x="17" y="8" width="2" height="4" fill="#FFD93D" />
      </svg>
      <div class="cb-ring r1"></div>
      <div class="cb-ring r2"></div>
      <div class="cb-star">✦</div>
    </button>

    <div class="chatbot-window" id="chatbotWindow">
      <div class="cw-header" id="cwHeader">
        <div class="cwh-info">
          <div class="cwh-avatar">
            <svg viewBox="0 0 32 32" width="22" height="22">
              <rect x="12" y="16" width="8" height="8" fill="#FF6B35" />
              <rect x="14" y="12" width="4" height="4" fill="#FF6B35" />
              <rect x="18" y="13" width="2" height="2" fill="#FFD93D" />
              <rect x="15" y="13" width="2" height="2" fill="#1a1a1a" />
              <rect x="8" y="16" width="4" height="6" fill="#FF8C42" />
              <rect x="20" y="16" width="4" height="6" fill="#FF8C42" />
            </svg>
            <span class="cwh-online"></span>
          </div>
          <div>
            <h4>Phoenix AI</h4>
            <p>Wildlife Assistant · Online</p>
          </div>
        </div>
        <button class="cw-close" id="cwClose">✕</button>
      </div>
      <div class="cw-msgs" id="cwMsgs">
        <div class="msg bot">
          <div class="msg-av"><svg viewBox="0 0 32 32" width="15" height="15">
              <rect x="12" y="16" width="8" height="8" fill="#FF6B35" />
              <rect x="14" y="12" width="4" height="4" fill="#FF6B35" />
              <rect x="8" y="16" width="4" height="6" fill="#FF8C42" />
              <rect x="20" y="16" width="4" height="6" fill="#FF8C42" />
            </svg></div>
          <div class="msg-bubble" data-i18n="chatbot_greeting">Hello! I'm Phoenix 🦅 Your wildlife guardian assistant! How can I help you today?
          </div>
        </div>
      </div>
      <div class="quick-replies-wrapper" id="qrWrapper">
        <div class="quick-replies" id="quickReplies">
          <button class="qr-btn" data-i18n="qr_1"><span>⚡</span> How can I report an emergency?</button>
          <button class="qr-btn" data-i18n="qr_2"><span>💡</span> What is Wildlife Guardian?</button>
          <button class="qr-btn" data-i18n="qr_3"><span>🐾</span> Can I donate to a specific animal?</button>
          <button class="qr-btn" data-i18n="qr_4"><span>🌿</span> Tips for helping local birds?</button>
        </div>
        <div class="qr-scroll-hint">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
        </div>
      </div>
      <div class="cw-input">
        <input type="text" id="cwInput" placeholder="Ask Phoenix anything…" />
        <button id="cwSend"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg></button>
      </div>
    </div>
  </div>`;
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);
}

// ── UI References ──
const chatbotContainer = document.getElementById("wgChatbot");
const chatWindow = document.getElementById("chatbotWindow");
const openBtn = document.getElementById("chatbotBtn");
const closeBtn = document.getElementById("cwClose");
const chatBox = document.getElementById("cwMsgs");
const inputEl = document.getElementById("cwInput");
const sendBtn = document.getElementById("cwSend");

/* ════════════════════════════════════════════════════
   DRAGGABLE
════════════════════════════════════════════════════ */
let isDragging = false;
let startX, startY, offsetX, offsetY;

function onDragStart(e) {
    // Ignore clicks inside text input or message area
    if (e.target.closest("input") || e.target.closest(".cw-msgs")) return;

    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

    startX = clientX;
    startY = clientY;
    const rect = chatbotContainer.getBoundingClientRect();
    offsetX = clientX - rect.left;
    offsetY = clientY - rect.top;
    isDragging = false;

    document.body.style.userSelect = "none";
    if (chatbotContainer) chatbotContainer.classList.add("is-dragging");

    // Ngăn iframe/canvas Unity nuốt mất sự kiện chuột khi kéo
    document.querySelectorAll('iframe, canvas').forEach(el => el.style.pointerEvents = 'none');

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
    if (chatbotContainer) chatbotContainer.classList.remove("is-dragging");

    // Khôi phục lại sự kiện chuột cho Game Unity
    document.querySelectorAll('iframe, canvas').forEach(el => el.style.pointerEvents = '');
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
    
    const PAD = 15; // Safe padding

    if (activeRect.right > window.innerWidth - PAD) { x -= (activeRect.right - (window.innerWidth - PAD)); moved = true; }
    if (activeRect.bottom > window.innerHeight - PAD) { y -= (activeRect.bottom - (window.innerHeight - PAD)); moved = true; }
    if (activeRect.left < PAD) { x += (PAD - activeRect.left); moved = true; }
    if (activeRect.top < PAD) { y += (PAD - activeRect.top); moved = true; }

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
            if (openBtn) {
                openBtn.style.opacity = "0";
                openBtn.style.pointerEvents = "none";
            }
            clampToViewport();
            setTimeout(clampToViewport, 50); // Bắt ngay khi DOM bắt đầu render class active
            setTimeout(clampToViewport, 360); // Đảm bảo clamp sau khi animation kết thúc
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
}

async function sendMessage() {
    if (!inputEl || !chatBox) return;
    const userMessage = inputEl.value.trim();
    if (!userMessage) return;
    inputEl.value = "";

    // Show user message
    appendMessage("user", userMessage);

    // Show loading dots
    const loadEl = appendMessage("bot", '<span class="typing"><span></span><span></span><span></span></span>');

    const lang = window.currentLang || localStorage.getItem("lang") || "EN";
    const languageRule = lang === "VI"
        ? "1. Luôn trả lời bằng Tiếng Việt (Vietnamese)."
        : "1. Luôn trả lời bằng Tiếng Anh (English).";

    try {
                const res = await fetch(`${API_BASE_URL}/api/chatbot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userMessage, languageRule })
        });
        const response = await res.json();
        if (!response.success) throw new Error(response.error || 'Server error');

        // Replace loading with actual response
        const bubble = loadEl.querySelector(".msg-bubble");
        if (bubble) bubble.textContent = response.text;
        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (error) {
        console.error("Chatbot API Error:", error);

        const lang = window.currentLang || localStorage.getItem("lang") || "EN";
        const friendlyErrorMsg = lang === "VI"
            ? "Oops! Xin lỗi bạn, hiện tại máy chủ đang hơi quá tải hoặc mất kết nối. Bạn có thể vui lòng đặt lại câu hỏi sau một lát được không? 😓"
            : "Oops! Sorry, the server is currently experiencing high demand or disconnected. Could you please try asking your question again in a moment? 😓";

        const bubble = loadEl.querySelector(".msg-bubble");
        if (bubble) {
            bubble.textContent = friendlyErrorMsg;
        }
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// Attach send events
if (sendBtn) sendBtn.addEventListener("click", sendMessage);
if (inputEl) inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
});

/* ════════════════════════════════════════════════════
   QUICK REPLIES LOGIC
════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
    const quickRepliesBox = document.getElementById("quickReplies");
    const chatInput = document.getElementById("cwInput") || document.querySelector(".inputarea input");

    if (quickRepliesBox && chatInput) {
        const scrollHint = document.querySelector(".qr-scroll-hint");

        // Function to check if scrolled to end
        const checkScroll = () => {
            if (!scrollHint) return;
            // Cho khoảng dung sai 2px
            if (quickRepliesBox.scrollWidth - quickRepliesBox.clientWidth <= quickRepliesBox.scrollLeft + 2) {
                scrollHint.classList.add("hidden");
            } else {
                scrollHint.classList.remove("hidden");
            }
        };

        // Check initially
        checkScroll();

        // Listen to scroll events
        quickRepliesBox.addEventListener("scroll", checkScroll);

        // Hỗ trợ cuộn ngang bằng con lăn chuột (Tăng cường UX)
        quickRepliesBox.addEventListener("wheel", (evt) => {
            evt.preventDefault();
            quickRepliesBox.scrollLeft += evt.deltaY;
            // Không cần gọi checkScroll ở đây vì sự kiện "scroll" sẽ tự bắt
        });

        const qrButtons = quickRepliesBox.querySelectorAll(".qr-btn");
        qrButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                // Lấy nội dung chữ, loại bỏ các icon emoji (⚡💡🐾🌿)
                let text = btn.textContent.replace(/[⚡💡🐾🌿]/g, "").trim();

                // Điền vào ô input
                chatInput.value = text;

                // Kích hoạt animation phản hồi
                btn.classList.add("selected");

                // Trực tiếp focus vào ô chat để user tiện nhấn Enter ngay
                chatInput.focus();

                // Gỡ animation sau khi hoàn thành
                setTimeout(() => {
                    btn.classList.remove("selected");
                }, 400);
            });
        });
    }
});