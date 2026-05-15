// ==========================================
// 0. QUẢN LÝ TRẠNG THÁI LOGIN / LOGOUT THÔNG MINH
// ==========================================
const userString = localStorage.getItem("currentUser");
const loginBtns = document.querySelectorAll(".btn-login");

if (userString) {
  // TRƯỜNG HỢP 1: ĐÃ ĐĂNG NHẬP
  const currentUser = JSON.parse(userString);

  loginBtns.forEach((btn) => {
    // 1. Đổi icon thành mũi tên trái (← Logout)
    btn.innerHTML = `← Log out`;

    // 2. Cài đặt hành động: Bấm vào thì Đăng xuất
    btn.onclick = (e) => {
      e.preventDefault();
      localStorage.removeItem("currentUser");
      window.location.reload();
    };
  });
} else {
  // TRƯỜNG HỢP 2: CHƯA ĐĂNG NHẬP
  loginBtns.forEach((btn) => {
    // 1. Đổi icon thành mũi tên phải (→ Login)
    btn.innerHTML = `→ Log in`;

    // 2. Cài đặt hành động: Bấm vào thì chở qua trang Đăng nhập
    btn.onclick = (e) => {
      e.preventDefault();
      window.location.href = "login/login.html";
    };
  });
}

// ==========================================
//              1. THANH NAVBAR
// ==========================================

const hamburger = document.getElementById("hamburger");
const mobileNav = document.getElementById("mobileNav");

// Khi nhấn vào nút 3 gạch
hamburger.addEventListener("click", () => {
  // Bật/tắt class 'active' để dấu 3 gạch biến thành dấu X
  hamburger.classList.toggle("active");

  // Bật/tắt class 'show' để hiện hoặc ẩn menu
  mobileNav.classList.toggle("show");
});

// Xử lý khi nhấn vào các tab trên máy tính (đổi màu xanh)
const navItems = document.querySelectorAll(".nav-item");
navItems.forEach((item) => {
  item.addEventListener("click", function () {
    document.querySelector(".nav-item.active").classList.remove("active");
    this.classList.add("active");
  });
});

// ==========================================
//              2. POST, BÀI ĐĂNG
// ==========================================

const API_URL = `http://${window.location.hostname}:3000/api/posts`; // Cổng backend của Tuấn

// 2.1. TÌM VÀ KẾT NỐI VỚI CÁC THÀNH PHẦN TRÊN HTML
const postBtn = document.getElementById("btn-post");
const postInput = document.getElementById("post-content");
const categorySelect = document.getElementById("post-category");
const mediaInput = document.getElementById("post-media");
const postsFeed = document.getElementById("posts-feed");
const filterButtons = document.querySelectorAll(".filter-btn");

// 2.2. HIỆU ỨNG NÚT LỌC BÀI VIẾT (ĐỔI MÀU + GỌI LỆNH LỌC)
filterButtons.forEach((button) => {
  button.addEventListener("click", function () {
    // 1. Đổi màu giao diện
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    this.classList.add("active");

    // 2. Lấy tên thể loại và ép về chữ thường
    let selectedCategory = this.innerText.trim().toLowerCase();

    // Xử lý ngoại lệ: Nút ghi "Stories" nhưng Database lưu là "story"
    if (selectedCategory === "stories") {
      selectedCategory = "story";
    }

    console.log("🔥 Đang yêu cầu lọc thể loại:", selectedCategory);

    // 3. Gọi hàm tải bài viết
    loadPosts(selectedCategory);
  });
});

// 2.2.5 HIỂN THỊ ẢNH XEM TRƯỚC KHI CHỌN FILE
const mediaPreviewContainer = document.getElementById(
  "media-preview-container",
);
const mediaPreviewImg = document.getElementById("media-preview-img");
const removeMediaBtn = document.getElementById("remove-media-btn");

mediaInput.addEventListener("change", function () {
  const file = this.files[0];
  if (file) {
    mediaPreviewImg.src = URL.createObjectURL(file);
    mediaPreviewContainer.style.display = "block";
  }
});

removeMediaBtn.addEventListener("click", function () {
  mediaInput.value = "";
  mediaPreviewContainer.style.display = "none";
});

// 2.3. HÀM TẢI & HIỂN THỊ BÀI VIẾT (GIAO DIỆN CHUẨN ẢNH)
async function loadPosts(category = "all posts") {
  try {
    // Gửi yêu cầu lọc theo category lên server
    const response = await fetch(`${API_URL}?category=${category}`);
    const posts = await response.json();

    const postsFeed = document.getElementById("posts-feed");
    postsFeed.innerHTML = ""; // Xóa sạch bài cũ để nạp bài mới

    posts.forEach((post) => {
      const postHTML = `
                <div class="post-card" style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #eee;">
                    
                    <div class="post-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                        <div style="display: flex; gap: 12px; align-items: center;">
    <img class="profile-trigger" data-name="${post.authorName || "Người dùng ẩn danh"}" data-avatar="${post.authorAvatar || "https://i.pravatar.cc/150?img=11"}" src="${post.authorAvatar || "https://i.pravatar.cc/150?img=11"}" alt="Avatar" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover; cursor: pointer;">
    <div>
        <h4 class="profile-trigger" data-name="${post.authorName || "Người dùng ẩn danh"}" data-avatar="${post.authorAvatar || "https://i.pravatar.cc/150?img=11"}" style="margin: 0 0 4px 0; font-size: 15px; color: #333; font-weight: bold; cursor: pointer;">${post.authorName || "Người dùng ẩn danh"}</h4>
        <span style="font-size: 12px; color: #888;">${new Date(post.createdAt).toLocaleString("vi-VN")}</span>
    </div>
</div>
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <span style="background: #e6f4ea; color: #1e8e3e; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: lowercase;">${post.category}</span>
                            <button class="btn-menu" data-id="${post._id}" style="background: none; border: none; color: #888; cursor: pointer; padding: 0; display: flex; align-items: center;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="1.5"></circle>
        <circle cx="19" cy="12" r="1.5"></circle>
        <circle cx="5" cy="12" r="1.5"></circle>
    </svg>
</button>
                        </div>
                    </div>

                    <div class="post-content" style="margin-bottom: 15px;">
                        <p style="margin: 0 0 15px 0; font-size: 15px; color: #333; line-height: 1.5;">${post.content}</p>
                        ${post.media_url ? `<img src="${post.media_url.includes("http") ? post.media_url : "http://localhost:3000/" + post.media_url.replace(/\\/g, "/")}" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 10px;">` : ""}
                    </div>

                    <div class="post-actions" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; padding-top: 15px;">
                        <div style="display: flex; gap: 20px;">
                            <button class="btn-like" data-id="${post._id}" style="background: none; border: none; color: #333; font-size: 15px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 600; padding: 0; transition: 0.2s;">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="${post.likes && post.likes.includes("user_hacker_001") ? "#e91e63" : "none"}" stroke="${post.likes && post.likes.includes("user_hacker_001") ? "#e91e63" : "currentColor"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="heart-icon"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                <span class="like-count">${post.likes ? post.likes.length : 0}</span>
                            </button>
                            <button class="btn-comment" data-id="${post._id}" style="background: none; border: none; color: #333; font-size: 15px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 600; padding: 0;">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                <span class="comment-count">${post.comments ? post.comments.length : 0}</span>
                            </button>
                            <button class="btn-share" data-id="${post._id}" style="background: none; border: none; color: #333; font-size: 15px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 600; padding: 0;">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="18" cy="5" r="3"></circle>
        <circle cx="6" cy="12" r="3"></circle>
        <circle cx="18" cy="19" r="3"></circle>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
    </svg>
</button>
                        </div>
                        
                    </div>

                    <div class="post-comments-section" id="comments-${post._id}" style="display: none; border-top: 1px solid #eee; padding-top: 15px; margin-top: 15px;">
                        
                        <div class="comments-list" style="max-height: 200px; overflow-y: auto; margin-bottom: 10px; font-size: 14px;">
                            ${
                              post.comments && post.comments.length > 0
                                ? post.comments
                                    .map(
                                      (c) => `
                                <div style="background: #f8f9fa; padding: 10px 15px; border-radius: 12px; margin-bottom: 8px;">
                                    <strong style="color: #333;">${c.user}</strong>: 
                                    <span style="color: #555;">${c.text}</span>
                                </div>
                            `,
                                    )
                                    .join("")
                                : ""
                            }
                        </div>
                        
                        <div style="display: flex; gap: 10px;">
                            <input type="text" class="comment-input" placeholder="Viết bình luận..." style="flex: 1; padding: 10px 15px; border-radius: 20px; border: 1px solid #ddd; outline: none; font-size: 14px;">
                            <button class="btn-send-comment" data-id="${post._id}" style="background: #1e8e3e; color: white; border: none; padding: 8px 20px; border-radius: 20px; cursor: pointer; font-weight: bold; font-size: 14px;">Gửi</button>
                        </div>
                    </div>

                </div>
                `;
      postsFeed.innerHTML += postHTML;
    });
  } catch (error) {
    console.error("Lỗi khi lấy bài viết:", error);
  }
}

// 2.4. HÀM GỬI BÀI VIẾT KHI BẤM NÚT POST
postBtn.addEventListener("click", async function () {
  const content = postInput.value;
  const category = categorySelect.value;
  const file = mediaInput.files[0];

  if (!content && !file) {
    alert("Vui lòng nhập nội dung hoặc chọn ảnh!");
    return;
  }

  const formData = new FormData();
  formData.append("content", content);
  formData.append("category", category);
  if (file) {
    formData.append("media", file);
  }

  // --- ĐOẠN CODE LẤY THÔNG TIN NGƯỜI DÙNG ĐỂ GỬI KÈM BÀI VIẾT ---
  const meString = localStorage.getItem("currentUser");
  if (meString) {
    const me = JSON.parse(meString);
    formData.append("authorName", me.fullName);
    formData.append(
      "authorAvatar",
      me.avatar || "https://i.pravatar.cc/150?img=11",
    );
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      // Đăng xong thì xóa sạch ô nhập
      postInput.value = "";
      mediaInput.value = "";
      mediaPreviewContainer.style.display = "none";

      // QUAN TRỌNG: Gọi lại hàm này để bài mới hiện lên ngay lập tức
      loadPosts();
    }
  } catch (error) {
    console.error("Lỗi khi đăng bài:", error);
  }
});

// 2.5. TỰ ĐỘNG CHẠY KHI MỞ WEB
loadPosts();

// ==========================================
//               3. BÀI ĐĂNG
// ==========================================

// CHỨC NĂNG TƯƠNG TÁC: LIKE, BOOKMARK (THẢ TIM, LƯU BÀI)
const postsFeedContainer = document.getElementById("posts-feed");

postsFeedContainer.addEventListener("click", async function (e) {
  // 1. XỬ LÝ LIKE
  const likeBtn = e.target.closest(".btn-like");
  if (likeBtn) {
    const postId = likeBtn.getAttribute("data-id");
    const icon = likeBtn.querySelector(".heart-icon");
    const countSpan = likeBtn.querySelector(".like-count");
    try {
      const response = await fetch(`${API_URL}/${postId}/like`, {
        method: "PUT",
      });
      const data = await response.json();
      countSpan.innerText = data.likesCount;
      if (data.isLiked) {
        icon.setAttribute("fill", "#e91e63");
        icon.setAttribute("stroke", "#e91e63");
      } else {
        icon.setAttribute("fill", "none");
        icon.setAttribute("stroke", "currentColor");
      }
    } catch (error) {
      console.error("Lỗi thả tim:", error);
    }
  }

  // 2. XỬ LÝ BOOKMARK
  const bookmarkBtn = e.target.closest(".btn-bookmark");
  if (bookmarkBtn) {
    const icon = bookmarkBtn.querySelector(".bookmark-icon");
    if (icon.getAttribute("fill") === "none") {
      icon.setAttribute("fill", "#10b981");
      icon.setAttribute("stroke", "#10b981");
    } else {
      icon.setAttribute("fill", "none");
      icon.setAttribute("stroke", "currentColor");
    }
  }

  // 3. XỬ LÝ BẬT/TẮT KHUNG COMMENT
  const commentBtn = e.target.closest(".btn-comment");
  if (commentBtn) {
    const postId = commentBtn.getAttribute("data-id");
    const commentSection = document.getElementById(`comments-${postId}`);
    if (
      commentSection.style.display === "none" ||
      commentSection.style.display === ""
    ) {
      commentSection.style.display = "block";
    } else {
      commentSection.style.display = "none";
    }
  }

  // 4. XỬ LÝ GỬI COMMENT
  const sendCommentBtn = e.target.closest(".btn-send-comment");
  if (sendCommentBtn) {
    const postId = sendCommentBtn.getAttribute("data-id");
    const commentSection = document.getElementById(`comments-${postId}`);
    const inputField = commentSection.querySelector(".comment-input");
    const commentsList = commentSection.querySelector(".comments-list");
    const countSpan = document.querySelector(
      `.btn-comment[data-id="${postId}"] .comment-count`,
    );

    const text = inputField.value.trim();
    if (!text) return; // Chữ return nay đã nằm gọn gàng an toàn bên trong function!

    try {
      const response = await fetch(`${API_URL}/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text }),
      });
      const updatedComments = await response.json();
      countSpan.innerText = updatedComments.length;
      inputField.value = "";

      // Lấy bình luận mới nhất in ra màn hình
      const newComment = updatedComments[updatedComments.length - 1];
      commentsList.innerHTML += `
                <div style="background: #f8f9fa; padding: 10px 15px; border-radius: 12px; margin-bottom: 8px;">
                    <strong style="color: #333;">${newComment.user}</strong>: 
                    <span style="color: #555;">${newComment.text}</span>
                </div>
            `;
    } catch (error) {
      console.error("Lỗi gửi bình luận:", error);
    }
  }

  // 5. XỬ LÝ KHI BẤM DẤU 3 CHẤM (XÓA BÀI)
  // Lưu ý: Ở hàm loadPosts, bạn nhớ thêm class "btn-menu" cho cái nút 3 chấm nhé
  const menuBtn = e.target.closest(".btn-menu");
  if (menuBtn) {
    const postId = menuBtn.getAttribute("data-id");

    // 1. Hiện cái hộp xác nhận xịn xò lên
    document.getElementById("customDeleteConfirm").style.display = "flex";

    // 2. Lén nhét cái ID của bài viết vào nút Tick (để lát nữa bấm Tick thì biết bài nào mà xóa)
    document.getElementById("confirmDeleteBtn").setAttribute("data-id", postId);
  }

  // 6. XỬ LÝ KHI BẤM NÚT SHARE
  const shareBtn = e.target.closest(".btn-share");
  if (shareBtn) {
    const postId = shareBtn.getAttribute("data-id");
    // Lấy nội dung bài viết để share
    const postCard = shareBtn.closest(".post-card");
    const content = postCard.querySelector(".post-content p").innerText;

    if (navigator.share) {
      navigator
        .share({
          title: "Wildlife Guardian Platform",
          text: content,
          url: window.location.href, // Link trang web hiện tại
        })
        .then(() => {
          console.log("Chia sẻ thành công!");
        })
        .catch((err) => {
          console.log("Lỗi share:", err);
        });
    } else {
      // Nếu trình duyệt không hỗ trợ Share API (như một số bản cũ trên PC)
      alert("Đã copy link bài viết vào bộ nhớ tạm!");
      navigator.clipboard.writeText(window.location.href);
    }
  }
});

// ==========================================
//                4. MESSAGES
// ==========================================

// LOGIC MESSENGER (CHAT)
const chatBox = document.getElementById("chatBox");
const closeChat = document.getElementById("closeChat");
const chatName = document.getElementById("chatName");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChatBtn");

let chatInterval = null; // Biến dùng để auto-load tin nhắn

// 2. ĐÓNG KHUNG CHAT
closeChat.addEventListener("click", () => {
  chatBox.style.display = "none";
  if (chatInterval) clearInterval(chatInterval); // Tắt auto-refresh
});

// 3. HÀM TẢI TIN NHẮN TỪ SERVER VÀ VẼ RA MÀN HÌNH
async function loadChatMessages() {
  if (!currentPartnerId) return;

  try {
    const me = JSON.parse(localStorage.getItem("currentUser"));
    const myId = me._id || me.userId; // Lại dùng chiêu bao lô ở đây

    const response = await fetch(
      `http://${window.location.hostname}:3000/api/messages/${myId}/${currentPartnerId}`,
    );
    const data = await response.json();
    const messageList = data.messages || data || [];

    const chatMessages = document.getElementById("chatMessages");
    if (!chatMessages) return;

    chatMessages.innerHTML = "";

    messageList.forEach((msg) => {
      const isMe = msg.sender === myId; // So sánh bằng myId chuẩn

      const msgHTML = `
                <div style="display: flex; justify-content: ${isMe ? "flex-end" : "flex-start"}; margin-bottom: 10px;">
                    <div style="background: ${isMe ? "#31a24c" : "#f0f2f5"}; color: ${isMe ? "white" : "black"}; padding: 8px 12px; border-radius: 15px; max-width: 70%; word-wrap: break-word;">
                        ${msg.text}
                    </div>
                </div>
            `;
      chatMessages.innerHTML += msgHTML;
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
  } catch (error) {
    console.error("Lỗi tải chat:", error);
  }
}

// 4. GỬI TIN NHẮN
async function sendMessage() {
  const chatInput = document.getElementById("chatInput");
  const text = chatInput.value.trim();
  if (!text) return;

  // Chiêu bao lô: Tìm bằng được ID thật của mình
  const me = JSON.parse(localStorage.getItem("currentUser"));
  const myId = me._id || me.userId;

  try {
    await fetch(`http://${window.location.hostname}:3000/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: myId, // Gửi bằng myId
        receiver: currentPartnerId,
        text: text,
      }),
    });

    chatInput.value = ""; // Xóa chữ trong ô nhập sau khi gửi
    loadChatMessages(); // Gọi hàm tải lại tin nhắn ngay lập tức cho nóng!
  } catch (error) {
    console.error("Lỗi gửi chat:", error);
  }
}

// Bấm nút gửi hoặc nhấn Enter để gửi
sendChatBtn.addEventListener("click", sendMessage);
chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// ==========================================
// TÍNH NĂNG TÌM KIẾM & HIỂN THỊ NGƯỜI DÙNG ĐỂ CHAT
// ==========================================
let currentPartnerId = null; // Biến lưu ID người đang chat cùng

async function loadUsersForChat(searchKeyword = "") {
  try {
    const response = await fetch(
      `http://localhost:3000/api/users?search=${searchKeyword}`,
    );
    const data = await response.json();

    const userListContainer = document.getElementById("userListContainer");
    if (!userListContainer) return;
    userListContainer.innerHTML = "";

    const meString = localStorage.getItem("currentUser");
    if (!meString) return; // Nếu chưa đăng nhập thì không làm gì cả
    const me = JSON.parse(meString);

    // Lọc bỏ chính mình ra khỏi danh sách
    const myId = me._id || me.id || me.userId;

    // Lọc bỏ chính mình ra khỏi danh sách
    const otherUsers = data.users.filter((u) => u._id !== myId);

    otherUsers.forEach((user) => {
      const userDiv = document.createElement("div");
      // Copy CSS y hệt của Anna Tran
      userDiv.style =
        "display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 5px; border-radius: 8px; transition: 0.3s;";
      userDiv.className = "chat-item";

      // Thiết kế giao diện từng người
      userDiv.innerHTML = `
                <div style="position: relative">
                    <img src="${user.avatar || "https://i.pravatar.cc/150?img=11"}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                    <span style="position: absolute; bottom: 2px; right: 0; width: 10px; height: 10px; background: #31a24c; border-radius: 50%; border: 2px solid white;"></span>
                </div>
                <div class="chat-info">
                    <h5 style="margin: 0; font-size: 14px; color: #333">${user.fullName}</h5>
                    <p style="margin: 2px 0 0 0; font-size: 12px; color: #888">Bấm để nhắn tin...</p>
                </div>
            `;

      // SỰ KIỆN KHI BẤM CHỌN 1 NGƯỜI ĐỂ CHAT (Vị trí 3 đã nằm gọn ở đây)
      userDiv.onclick = () => {
        currentPartnerId = user._id; // Chốt ID người nhận tin nhắn

        // Mở khung chat (Dúi nhớ check biến chatBox xem có đúng tên không nhé)
        if (typeof chatBox !== "undefined") chatBox.style.display = "flex";
        document.getElementById("chatName").innerText = user.fullName;

        // Gọi hàm tải tin nhắn cũ
        if (typeof loadChatMessages === "function") loadChatMessages();

        // Tự động quét tin nhắn mới mỗi 2 giây
        if (typeof chatInterval !== "undefined" && chatInterval)
          clearInterval(chatInterval);
        if (typeof loadChatMessages === "function")
          chatInterval = setInterval(loadChatMessages, 2000);
      };

      userListContainer.appendChild(userDiv);
    });
  } catch (error) {
    console.error("Lỗi tải danh sách người dùng:", error);
  }
}

// Bắt sự kiện gõ phím vào ô tìm kiếm
const searchInput = document.getElementById("searchUser");
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    loadUsersForChat(e.target.value);
  });

  // Tự động gọi lần đầu tiên khi vừa vào web
  loadUsersForChat();
}

// Tự động load Avatar của mình khi vào web
document.addEventListener("DOMContentLoaded", () => {
  const meString = localStorage.getItem("currentUser");
  if (meString) {
    const me = JSON.parse(meString);
    const myAvatarImg = document.getElementById("myAvatar");
    if (myAvatarImg) {
      myAvatarImg.src = me.avatar || "https://i.pravatar.cc/150?img=11";
    }
  }
});

// --- LOGIC HIỂN THỊ MINI PROFILE ---
document.addEventListener("click", function (e) {
  const popup = document.getElementById("miniProfilePopup");

  // 1. Nếu click vào Avatar hoặc Tên bài viết
  if (e.target.closest(".profile-trigger")) {
    const trigger = e.target.closest(".profile-trigger");
    const name = trigger.getAttribute("data-name");
    const avatar = trigger.getAttribute("data-avatar");

    // Nạp dữ liệu vào popup
    document.getElementById("popupName").innerText = name;
    document.getElementById("popupAvatar").src = avatar;

    // Lấy vị trí chuột để đặt popup hiện lên đúng chỗ đó
    popup.style.left = e.pageX + "px";
    popup.style.top = e.pageY + 15 + "px";
    popup.style.display = "block";
  }

  // 2. Nếu click vào nút X để đóng
  if (e.target.id === "closeMiniProfile") {
    popup.style.display = "none";
  }

  // 3. Nếu click vào nút "Nhắn tin" trong bảng Mini Profile
  if (e.target.id === "popupMessageBtn") {
    // Lấy tên từ bảng popup
    const name = document.getElementById("popupName").innerText;

    // Tắt bảng popup nhỏ đi
    popup.style.display = "none";

    // Gọi khung chat xanh lá của Dúi hiện lên
    const chatBox = document.getElementById("chatBox");
    if (chatBox) {
      document.getElementById("chatName").innerText = name; // Cập nhật tên
      chatBox.style.display = "flex"; // Khung của bạn xài flex nên dùng 'flex' cho mượt
    }
  }

  // 4. Nếu click vào dấu X của khung chat xanh lá để tắt
  if (e.target.id === "closeChat" || e.target.closest("#closeChat")) {
    document.getElementById("chatBox").style.display = "none";
  }

  // --- XỬ LÝ HỘP THOẠI XÓA BÀI CUSTOM ---

  // 1. Nếu bấm nút Hủy (✖) màu đỏ
  document
    .getElementById("cancelDeleteBtn")
    .addEventListener("click", function () {
      document.getElementById("customDeleteConfirm").style.display = "none"; // Giấu hộp đi
    });

  // 2. Nếu bấm nút Xác nhận (✔) màu xanh
  document
    .getElementById("confirmDeleteBtn")
    .addEventListener("click", async function () {
      // Lấy lại cái ID bài viết mà mình đã lén nhét vào lúc nãy
      const postId = this.getAttribute("data-id");

      // Tắt cái hộp đi cho gọn
      document.getElementById("customDeleteConfirm").style.display = "none";

      // Chạy lệnh gọi Server xóa bài (Y chang code cũ của Dúi)
      try {
        const response = await fetch(`${API_URL}/${postId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          loadPosts(); // Xóa xong thì tải lại danh sách bài viết
        }
      } catch (error) {
        console.error("Lỗi xóa bài:", error);
      }
    });
});
