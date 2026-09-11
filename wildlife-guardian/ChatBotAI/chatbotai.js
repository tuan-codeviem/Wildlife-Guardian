
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
          <button class="qr-btn" data-i18n="qr_1"><span>⚡</span> Làm sao để báo cáo động vật khẩn cấp?</button>
          <button class="qr-btn" data-i18n="qr_2"><span>🌍</span> Tôi muốn giao lưu với cộng đồng!</button>
          <button class="qr-btn" data-i18n="qr_3"><span>🎮</span> Tôi muốn vừa học vừa chơi!</button>
          <button class="qr-btn" data-i18n="qr_4"><span>📚</span> Nơi tra cứu thông tin các loài?</button>
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
   DRAGGABLE (BUTTON & HEADER ONLY)
════════════════════════════════════════════════════ */
let isDragging = false;
let dragMoved = false;
let hasBeenDragged = false;
let startX, startY, offsetX, offsetY;

function onDragStart(e) {
    // Chỉ cho phép kéo thả từ nút tròn (khi đóng) hoặc thanh tiêu đề cwHeader (khi mở)
    const isBtn = e.target.closest("#chatbotBtn");
    const isHeader = e.target.closest("#cwHeader");
    if (!isBtn && !isHeader) return;

    // Tuyệt đối không kéo thả khi bấm nút Close, Input, hoặc khu vực tin nhắn
    if (e.target.closest("#cwClose") || e.target.closest("input") || e.target.closest(".cw-msgs")) return;

    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

    startX = clientX;
    startY = clientY;
    const rect = chatbotContainer.getBoundingClientRect();
    offsetX = clientX - rect.left;
    offsetY = clientY - rect.top;
    isDragging = false;
    dragMoved = false;

    document.body.style.userSelect = "none";
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

    if (Math.abs(clientX - startX) > 4 || Math.abs(clientY - startY) > 4) {
        isDragging = true;
        dragMoved = true;
        hasBeenDragged = true;
        if (chatbotContainer) chatbotContainer.classList.add("is-dragging");
    }
    if (isDragging) {
        if (e.type.includes('touch')) e.preventDefault();
        const rect = chatbotContainer.getBoundingClientRect();
        const pad = 12;
        let newLeft = clientX - offsetX;
        let newTop = clientY - offsetY;

        // Giới hạn trong màn hình
        newLeft = Math.max(pad, Math.min(window.innerWidth - rect.width - pad, newLeft));
        newTop = Math.max(pad, Math.min(window.innerHeight - rect.height - pad, newTop));

        chatbotContainer.style.left = `${newLeft}px`;
        chatbotContainer.style.top = `${newTop}px`;
        chatbotContainer.style.bottom = "auto";
        chatbotContainer.style.right = "auto";
    }
}

function onDragEnd() {
    document.body.style.userSelect = "";
    if (chatbotContainer) chatbotContainer.classList.remove("is-dragging");
    document.querySelectorAll('iframe, canvas').forEach(el => el.style.pointerEvents = '');
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("mouseup", onDragEnd);
    document.removeEventListener("touchmove", onDragMove);
    document.removeEventListener("touchend", onDragEnd);

    setTimeout(() => {
        dragMoved = false;
        isDragging = false;
    }, 60);
}

// Gán sự kiện kéo thả
if (chatbotContainer) {
    chatbotContainer.addEventListener("mousedown", onDragStart);
    chatbotContainer.addEventListener("touchstart", onDragStart, { passive: false });
}

/* ════════════════════════════════════════════════════
   OPEN / CLOSE
════════════════════════════════════════════════════ */
function openChatWindow() {
    if (!chatWindow) return;
    chatWindow.classList.add("active");
    if (openBtn) {
        openBtn.style.opacity = "0";
        openBtn.style.pointerEvents = "none";
        openBtn.style.transform = "scale(0.85)";
    }

    // Nếu người dùng đã từng kéo thả, điều chỉnh hướng mở cửa sổ thông minh
    if (hasBeenDragged && chatbotContainer) {
        const rect = chatbotContainer.getBoundingClientRect();
        if (rect.top < 400) {
            chatWindow.style.bottom = "auto";
            chatWindow.style.top = "76px";
        } else {
            chatWindow.style.top = "auto";
            chatWindow.style.bottom = "76px";
        }
        if (rect.left < 380) {
            chatWindow.style.right = "auto";
            chatWindow.style.left = "0px";
        } else {
            chatWindow.style.left = "auto";
            chatWindow.style.right = "0px";
        }
    } else {
        // Trạng thái mặc định: KHÔNG can thiệp style.top/left, giữ nguyên CSS bottom: 28px; right: 28px
        chatWindow.style.top = "";
        chatWindow.style.bottom = "";
        chatWindow.style.left = "";
        chatWindow.style.right = "";
    }

    setTimeout(() => {
        if (inputEl) inputEl.focus();
        if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
    }, 60);
}

function closeChatWindow() {
    if (!chatWindow) return;
    chatWindow.classList.remove("active");
    if (openBtn) {
        openBtn.style.opacity = "1";
        openBtn.style.pointerEvents = "auto";
        openBtn.style.transform = "scale(1)";
        openBtn.style.display = "flex";
    }
}

if (openBtn && chatWindow) {
    openBtn.addEventListener("click", (e) => {
        if (!isDragging && !dragMoved) {
            openChatWindow();
        }
    });
}

if (closeBtn && chatWindow) {
    closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeChatWindow();
    });
}

// Đóng cửa sổ bằng phím Escape
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && chatWindow && chatWindow.classList.contains("active")) {
        closeChatWindow();
    }
});

// Resize dọn dẹp vị trí
window.addEventListener("resize", () => {
    if (!hasBeenDragged && chatbotContainer) {
        chatbotContainer.style.top = "";
        chatbotContainer.style.left = "";
        chatbotContainer.style.bottom = "";
        chatbotContainer.style.right = "";
    }
});

/* ════════════════════════════════════════════════════
   MESSAGE FORMATTING & SMART RESPONSES
════════════════════════════════════════════════════ */
function formatMessage(text) {
    if (!text) return '';
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="chat-link" target="_blank">$1</a>');
    html = html.replace(/\n/g, '<br>');
    return html;
}

function getSmartFallbackResponse(userMessage, lang) {
    const isVi = (lang === "VI");
    const lower = (userMessage || '').toLowerCase();

    // 1. Báo cáo khẩn cấp
    if (lower.includes('báo cáo') || lower.includes('khẩn cấp') || lower.includes('cứu hộ') || lower.includes('report') || lower.includes('rescue')) {
        return isVi
            ? `🚨 <strong>Báo cáo động vật khẩn cấp:</strong><br>Bạn hãy nhấn nút <strong>🚨 Report Now</strong> trên thanh menu hoặc vào trang <a href="../RescueMap/rescuemap/index.html?action=report" class="chat-link">Rescue Map (Bản đồ cứu hộ)</a>. Tại đó bạn chỉ cần bật camera chụp ảnh, hệ thống sẽ tự lấy vị trí GPS và thông báo đến trạm cứu hộ gần nhất!`
            : `🚨 <strong>Emergency Wildlife Report:</strong><br>Click the <strong>🚨 Report Now</strong> button on the menu or visit the <a href="../RescueMap/rescuemap/index.html?action=report" class="chat-link">Rescue Map</a> to take a photo, detect your GPS coordinates, and notify the nearest rescue team!`;
    }

    // 2. Mạng xã hội / Cộng đồng
    if (lower.includes('cộng đồng') || lower.includes('giao lưu') || lower.includes('social') || lower.includes('bài viết') || lower.includes('community')) {
        return isVi
            ? `🌍 <strong>Cộng đồng Wildlife Guardian:</strong><br>Hãy ghé thăm trang <a href="../Social/frontend/index.html" class="chat-link">Social (Mạng xã hội)</a> để cùng chia sẻ hình ảnh, thảo luận câu chuyện bảo tồn và kết nối với hàng nghìn tình nguyện viên khác!`
            : `🌍 <strong>Wildlife Community:</strong><br>Visit our <a href="../Social/frontend/index.html" class="chat-link">Social Hub</a> to share rescue stories, discuss conservation efforts, and connect with guardians worldwide!`;
    }

    // 3. Game
    if (lower.includes('game') || lower.includes('chơi') || lower.includes('học') || lower.includes('play')) {
        return isVi
            ? `🎮 <strong>Trải nghiệm Game 3D Unity:</strong><br>Bạn có thể vào mục <a href="../Game/GameUnity.html" class="chat-link">Game</a> để tham gia cuộc phiêu lưu tương tác giải cứu động vật hoang dã cực kỳ thú vị và hấp dẫn!`
            : `🎮 <strong>Interactive 3D Game:</strong><br>Check out our <a href="../Game/GameUnity.html" class="chat-link">Game Section</a> to play an immersive Unity 3D wildlife rescue adventure!`;
    }

    // 4. Thư viện loài
    if (lower.includes('loài') || lower.includes('thư viện') || lower.includes('tra cứu') || lower.includes('species') || lower.includes('động vật')) {
        return isVi
            ? `📚 <strong>Thư viện các loài động vật:</strong><br>Bạn có thể tra cứu thông tin sinh học, hình ảnh và tình trạng bảo tồn sách đỏ của hàng trăm loài tại <a href="../SpeciesLibarary/SpeciesLibarary.html" class="chat-link">Species Library</a>!`
            : `📚 <strong>Species Library:</strong><br>Explore detailed profiles, Red List conservation statuses, and biological facts for hundreds of species at the <a href="../SpeciesLibarary/SpeciesLibarary.html" class="chat-link">Species Library</a>!`;
    }

    // Mặc định
    return isVi
        ? `🦅 <strong>Phoenix AI đã nhận được câu hỏi của bạn!</strong><br>Hiện tại kết nối máy chủ đang bận một chút, bạn có thể tham khảo nhanh các mục trên thanh điều hướng như <strong>Rescue Map</strong>, <strong>Species Library</strong> hoặc thử gửi lại câu hỏi sau ít phút nhé! 😊`
        : `🦅 <strong>Phoenix AI received your question!</strong><br>The server connection is temporarily busy. You can explore our main features on the top navigation bar like <strong>Rescue Map</strong> and <strong>Species Library</strong>, or try asking again in a moment! 😊`;
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
    appendMessage("user", formatMessage(userMessage));

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

        const bubble = loadEl.querySelector(".msg-bubble");
        if (bubble) bubble.innerHTML = formatMessage(response.text);
        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (error) {
        console.warn("Chatbot API Error / Offline:", error);
        const lang = window.currentLang || localStorage.getItem("lang") || "EN";
        const smartReply = getSmartFallbackResponse(userMessage, lang);

        const bubble = loadEl.querySelector(".msg-bubble");
        if (bubble) {
            bubble.innerHTML = smartReply;
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

        const checkScroll = () => {
            if (!scrollHint) return;
            if (quickRepliesBox.scrollWidth - quickRepliesBox.clientWidth <= quickRepliesBox.scrollLeft + 2) {
                scrollHint.classList.add("hidden");
            } else {
                scrollHint.classList.remove("hidden");
            }
        };

        checkScroll();
        quickRepliesBox.addEventListener("scroll", checkScroll);

        // Hỗ trợ cuộn ngang bằng con lăn chuột
        quickRepliesBox.addEventListener("wheel", (evt) => {
            evt.preventDefault();
            quickRepliesBox.scrollLeft += evt.deltaY;
        });

        const qrButtons = quickRepliesBox.querySelectorAll(".qr-btn");
        qrButtons.forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                let text = btn.textContent.replace(/[⚡🌍🎮📚]/g, "").trim();
                chatInput.value = text;
                btn.classList.add("selected");
                sendMessage();
                setTimeout(() => {
                    btn.classList.remove("selected");
                }, 400);
            });
        });
    }
});