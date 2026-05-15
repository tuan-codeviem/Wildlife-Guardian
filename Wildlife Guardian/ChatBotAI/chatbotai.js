const chatbot = document.querySelector(".chat-bot-AI");     
const chatWindow = document.querySelector(".chatwindow");
const AIbtn = document.querySelector(".AIassit");
const closeBtn = document.querySelector(".close");

let dakeoMouse = false;
let startX,startY,offsetX,offsetY;


// ĐÃ SỬA: Chuyển logic bắt đầu kéo thành một hàm riêng để dùng chung cho cả chuột và cảm ứng
function batDauKeo(e) {
    if(e.target.closest(".inputarea input")||e.target.closest(".chat")) return;
    
    // ĐÃ SỬA: Xác định lấy toạ độ từ touch (cảm ứng) hay client (chuột máy tính)
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

    startX = clientX;
    startY = clientY;
    const chatbotAI = chatbot.getBoundingClientRect();
    offsetX = clientX - chatbotAI.left;
    offsetY = clientY - chatbotAI.top;
    dakeoMouse = false;
    
    document.body.style.userSelect = "none"; // Ngăn bôi đen chữ khi kéo
    
    // ĐÃ SỬA: Thêm các sự kiện touchmove và touchend dành riêng cho thiết bị cảm ứng
    if (e.type.includes('touch')) {
        document.addEventListener("touchmove", dichuyenMouse, { passive: false });
        document.addEventListener("touchend", thaMouse);
    } else {
        document.addEventListener("mousemove", dichuyenMouse);
        document.addEventListener("mouseup", thaMouse);
    }
}

// ĐÃ SỬA: Gắn sự kiện mousedown cho máy tính và touchstart cho điện thoại
chatbot.addEventListener("mousedown", batDauKeo);
chatbot.addEventListener("touchstart", batDauKeo, { passive: false });

function chongketMouse(){
    const isActive = chatWindow.classList.contains("active") ? chatWindow : AIbtn;
    let bandauActive = isActive.getBoundingClientRect();
    let bandau = chatbot.getBoundingClientRect();
    let bandauX = bandau.left;
    let bandauY = bandau.top;
    let dakeo = false;


    if(bandauActive.right > window.innerWidth) {bandauX -=(bandauActive.right-window.innerWidth); dakeo=true;}
    if(bandauActive.bottom>window.innerHeight){bandauY-=(bandauActive.bottom-window.innerHeight);dakeo=true}

    if(bandauActive.left<0){bandauX-=bandauActive.left;dakeo=true};
    if(bandauActive.top<0){bandauY-=bandauActive.top;dakeo=true};

    if(dakeo||chatbot.style.left!==""){
        chatbot.style.left = bandauX +"px";
        chatbot.style.top=bandauY + "px";
        chatbot.style.bottom="auto";
        chatbot.style.right = "auto";
    }
}

function dichuyenMouse(e){
    // ĐÃ SỬA: Lấy đúng tọa độ khi di chuyển trên điện thoại hoặc máy tính
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

    if(Math.abs(clientX-startX)>3 || Math.abs(clientY-startY)>3){
        dakeoMouse=true;
    }
    if(dakeoMouse){
        // ĐÃ SỬA: Ngăn màn hình web cuộn lên xuống trong khi người dùng đang giữ kéo chatbot trên điện thoại
        if(e.type.includes('touch')) e.preventDefault(); 
        chatbot.style.left= `${clientX-offsetX}px`;
        chatbot.style.top=`${clientY-offsetY}px`;
        chatbot.style.bottom="auto";
        chatbot.style.right="auto";
        chongketMouse();
    }
}

function thaMouse(e){
    document.body.style.userSelect = ""; // Khôi phục lại trạng thái bình thường
    document.removeEventListener("mousemove", dichuyenMouse);
    document.removeEventListener("mouseup", thaMouse);
    // ĐÃ SỬA: Gỡ bỏ sự kiện touchmove và touchend để trả lại trạng thái web bình thường sau khi thả tay
    document.removeEventListener("touchmove", dichuyenMouse);
    document.removeEventListener("touchend", thaMouse);
}

// Khi mở Chat
AIbtn.addEventListener("click", () => {
    if (!dakeoMouse) {
        chatWindow.classList.add("active");
        // AIbtn.style.display ="none"; // ĐỪNG dùng dòng này
        AIbtn.style.opacity = "0"; // Làm mờ đi
        AIbtn.style.pointerEvents = "none"; // Không cho bấm vào khi đang ẩn
        chongketMouse();
    }
});

// Khi đóng Chat
closeBtn.addEventListener("click", () => {
    if (!dakeoMouse) {
        chatWindow.classList.remove("active");
        // closeBtn.style.display="block"; // Chỗ này bạn đang dùng nhầm closeBtn, hãy sửa thành AIbtn
        AIbtn.style.opacity = "1"; // Hiện lại con chim
        AIbtn.style.pointerEvents = "auto"; // Cho phép bấm lại
        AIbtn.style.display = "flex"; // Đảm bảo dùng flex để con chim ở giữa
        chongketMouse();
    }
});


import {GoogleGenAI} from "@google/genai"

const API_KEY = "AIzaSyBRkY6sJjREIOPMtNxaR8zIggyN8H2UB_0";
const ai = new GoogleGenAI({apiKey:API_KEY})

document.querySelector(".inputarea button").addEventListener("click",sendMessage);

async function sendMessage(){
    const userMessage = document.querySelector(".inputarea input").value;
    if(!userMessage.trim()) return;

    // Làm trống ô nhập liệu sau khi người dùng bấm gửi
    document.querySelector(".inputarea input").value = "";

    const chatBox = document.querySelector(".chatwindow .chat");

    chatBox.insertAdjacentHTML("beforeend",`
            <div class="user">
                <p>${userMessage}</p>
            `);
    
    const loading = "loading-"+ Date.now();
    chatBox.insertAdjacentHTML("beforeend",`
            <div class="model" id="${loading}">
                <p>Đang suy nghĩ</p>
            `);
    
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
        document.getElementById(loading).innerHTML=`<p style="color:red">${error.message}</p>`;
    }
}