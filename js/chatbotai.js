

// Tính năng ẩn/hiện chatbox và kéo thả
const widget = document.querySelector(".draggable-widget");
const aiAssistBtn = document.querySelector(".AIassit");
const chatContainer = document.querySelector(".chatwindow");
const closeBtn = document.querySelector(".close");

let isDragging = false;
let startX, startY, offsetX, offsetY;

widget.addEventListener("mousedown", (e) => {
    // Bỏ qua việc kéo nếu click vào ô nhập liệu, nút gửi hoặc vùng hiển thị tin nhắn
    if (e.target.closest('.inputarea') || e.target.closest('.chat')) return;

    isDragging = false;
    startX = e.clientX;
    startY = e.clientY;
    
    const rect = widget.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
});

function adjustBounds() {
    const activeElement = chatContainer.classList.contains("active") ? chatContainer : aiAssistBtn;
    const rect = activeElement.getBoundingClientRect();
    const widgetRect = widget.getBoundingClientRect();

    let adjustedLeft = widgetRect.left;
    let adjustedTop = widgetRect.top;
    let needsAdjustment = false;

    // Chặn kẹt mép phải/dưới trước
    if (rect.right > window.innerWidth) { adjustedLeft -= (rect.right - window.innerWidth); needsAdjustment = true; }
    if (rect.bottom > window.innerHeight) { adjustedTop -= (rect.bottom - window.innerHeight); needsAdjustment = true; }
    
    // Chặn kẹt mép trái/trên sau (Ưu tiên đè lên để luôn hiện phần trên cùng của hộp chat giúp có thể nắm kéo lại)
    if (rect.left < 0) { adjustedLeft -= rect.left; needsAdjustment = true; }
    if (rect.top < 0) { adjustedTop -= rect.top; needsAdjustment = true; }

    // Nếu bị lọt ra ngoài hoặc đã từng bị kéo thả khỏi vị trí góc dưới bên phải, thì cập nhật lại toạ độ
    if (needsAdjustment || widget.style.left !== "") {
        widget.style.left = `${adjustedLeft}px`;
        widget.style.top = `${adjustedTop}px`;
        widget.style.bottom = "auto";
        widget.style.right = "auto";
    }
}

function onMouseMove(e) {
    // Nếu chuột di chuyển quá 3px thì mới tính là hành động kéo (tránh click nhầm)
    if (Math.abs(e.clientX - startX) > 3 || Math.abs(e.clientY - startY) > 3) {
        isDragging = true;
    }
    if (isDragging) {
        widget.style.left = `${e.clientX - offsetX}px`;
        widget.style.top = `${e.clientY - offsetY}px`;
        widget.style.bottom = "auto";
        widget.style.right = "auto";

        adjustBounds();
    }
}

function onMouseUp() {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
}

aiAssistBtn.addEventListener("click", () => {
    if (!isDragging) {
        chatContainer.classList.add("active");
        aiAssistBtn.style.display = "none";
        adjustBounds(); // Tự động dò và đẩy hộp thoại lọt vào màn hình ngay khi mở
    }
});

closeBtn.addEventListener("click", () => {
    if (!isDragging) {
        chatContainer.classList.remove("active");
        aiAssistBtn.style.display = "block";
        adjustBounds(); // Đảm bảo linh thú không bị kẹt khi thu nhỏ lại
    }
});




//Hàm và thư viện xử lý ChatBot
import {GoogleGenAI} from "@google/genai";

const API_KEY = "KeyODay";
const ai = new GoogleGenAI({apiKey : API_KEY});

document.querySelector(".inputarea button").addEventListener("click",sendMessage);

async function sendMessage(){
    const userMessage = document.querySelector(".inputarea input").value;
    if(!userMessage.trim()) return;


    const chatWindow = document.querySelector(".chatwindow .chat");

    chatWindow.insertAdjacentHTML("beforeend",`
        <div class="user">
                <p>${userMessage}</p>
            </div>`);


    document.querySelector(".inputarea input").value = "";


    const loading = "loading-"+ Date.now();
    chatWindow.insertAdjacentHTML("beforeend",`
        <div class="model" id="${loading}">
                <p>Đang suy nghĩ</p>
            </div>`)
    
    try{
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userMessage,
            config:{
                systemInstruction: `Bạn là trợ lý ảo của dự án web Wildlife Guardian.
                Luật lệ bắt buộc của bạn:
                1. LUÔN LUÔN trả lời bằng tiếng Việt.
                2. Bạn chỉ được phép tư vấn, trả lời các câu hỏi liên quan đến bảo vệ động vật hoang dã, thiên nhiên, môi trường và các thông tin về trang web Wildlife Guardian.
                3. Nếu người dùng hỏi về các chủ đề khác (như toán học, lập trình, giải trí, chính trị...), hãy lịch sự từ chối và lái câu chuyện quay về chủ đề động vật hoang dã.
                4. Trả lời ngắn gọn, thân thiện và súc tích.`
            }
        });


        document.getElementById(loading).innerHTML = `<p>${response.text}</p>`;
    }catch(error){
        
        document.getElementById(loading).innerHTML=`<p style="color:red">${error.message}</p>`
    }


}