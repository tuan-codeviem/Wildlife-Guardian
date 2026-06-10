// Hàm hỗ trợ lấy ngôn ngữ hiện tại an toàn
function getLang() {
  return window.currentLang || localStorage.getItem("appLang") || "EN";
}

// ==========================================
// 0. QUẢN LÝ TRẠNG THÁI LOGIN / LOGOUT THÔNG MINH
// ==========================================
const userString = localStorage.getItem("currentUser");
const loginBtns = document.querySelectorAll(".btn-login");

if (userString) {
  // TRƯỜNG HỢP 1: ĐÃ ĐĂNG NHẬP
  const currentUser = JSON.parse(userString);
  const userAvatar =
    currentUser.avatar ||
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  loginBtns.forEach((btn) => {
    // 1. Đổi nút "Log in" thành Avatar
    btn.className = "avatar-btn"; // Xoá class btn-login để mất cái viền hộp đen của nút
    btn.innerHTML = `<img src="${userAvatar}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 2px solid #16a34a; background: white;">`;
    btn.style.padding = "0";
    btn.style.background = "transparent";
    btn.style.border = "none";
    btn.style.width = "38px";
    btn.style.minWidth = "38px";
    btn.style.height = "38px";
    btn.style.outline = "none";
    btn.style.cursor = "pointer";
    btn.style.borderRadius = "50%";
    btn.style.display = "flex";
    btn.style.alignItems = "center";
    btn.style.justifyContent = "center";
    btn.style.alignSelf = "center";

    // 2. Cài đặt hành động: Bấm vào thì mở bảng Mini Profile Tài Khoản
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const popup = document.getElementById("userDropdownPopup");
      if (popup) {
        document.getElementById("dropdownAvatar").src = userAvatar;
        document.getElementById("dropdownName").innerText =
          currentUser.fullName || "User";

        if (popup.style.display === "block") {
          popup.style.display = "none";
          popup.style.opacity = "0";
          popup.style.transform = "translateY(10px) translateX(-50%)";
        } else {
          const rect = btn.getBoundingClientRect();
          popup.style.top = rect.bottom + 10 + "px";
          if (window.innerWidth < 768) {
            popup.style.left = "50%";
          } else {
            popup.style.left = rect.left + rect.width / 2 + "px";
          }
          popup.style.right = "auto";
          popup.style.transform = "translateY(10px) translateX(-50%)";
          popup.style.display = "block";

          // Anim
          setTimeout(() => {
            popup.style.opacity = "1";
            popup.style.transform = "translateY(0) translateX(-50%)";
          }, 10);
        }
      }
    };
  });
} else {
  // TRƯỜNG HỢP 2: CHƯA ĐĂNG NHẬP
  // Đá văng ra trang Login chung của hệ thống
  sessionStorage.setItem("redirectAfterLogin", window.location.href);
  window.location.href = "../../Auth/login.html";
}

// Cài đặt sự kiện cho bảng Dropdown Tài khoản
const dropdownSettingsBtn = document.getElementById("dropdownSettingsBtn");
const dropdownLogoutBtn = document.getElementById("dropdownLogoutBtn");

if (dropdownSettingsBtn) {
  dropdownSettingsBtn.addEventListener("click", () => {
    document.getElementById("userDropdownPopup").style.display = "none";
    openSettingsModal();
  });
}
if (dropdownLogoutBtn) {
  dropdownLogoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.reload();
  });
}

// ==========================================
//              1. THANH NAVBAR
// ==========================================

const navbar = document.getElementById("navbar");
const hamburger = document.getElementById("hamburger");
const mobileNav = document.getElementById("mobileNav");

if (navbar) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });
}

// Khi nhấn vào nút 3 gạch
hamburger.addEventListener("click", () => {
  // Bật/tắt class 'active' để dấu 3 gạch biến thành dấu X
  hamburger.classList.toggle("active");

  // Bật/tắt class 'show' để hiện hoặc ẩn menu
  mobileNav.classList.toggle("show");
});

// Hàm mở bảng Cài đặt hồ sơ
function openSettingsModal() {
  const meString = localStorage.getItem("currentUser");
  if (!meString) return;
  const me = JSON.parse(meString);

  const profileModal = document.getElementById("profileSetupModal");
  const setupNameInput = document.getElementById("setupNameInput");
  const setupAvatarPreview = document.getElementById("setupAvatarPreview");
  const profileModalTitle = document.getElementById("profileModalTitle");
  const profileModalDesc = document.getElementById("profileModalDesc");
  const skipProfileBtn = document.getElementById("skipProfileBtn");
  const closeProfileModal = document.getElementById("closeProfileModal");

  if (profileModal) {
    const t = window.translations[getLang()];
    if (profileModalTitle)
      profileModalTitle.innerText = t.profile_settings_title;
    if (profileModalDesc) profileModalDesc.innerText = t.profile_settings_desc;
    if (setupNameInput) setupNameInput.value = me.fullName || "";
    if (setupAvatarPreview)
      setupAvatarPreview.src =
        me.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    if (skipProfileBtn) skipProfileBtn.style.display = "none"; // Ẩn nút bỏ qua
    if (closeProfileModal) closeProfileModal.style.display = "block"; // Hiện nút X để đóng

    profileModal.style.display = "flex";
  }
}

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

    // 2. Lấy tên thể loại bằng data attribute thay vì innerText để không bị lỗi khi đổi ngôn ngữ
    let selectedCategory = this.getAttribute("data-category");

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

// HÀM HIỂN THỊ BÌNH LUẬN (HỖ TRỢ TRẢ LỜI LỒNG NHAU THÔNG MINH)
window.renderCommentsHTML = function (
  comments,
  postId,
  myId,
  isMyPost = false,
) {
  if (!comments || comments.length === 0) return "";
  const topLevel = comments.filter((c) => !c.replyTo);
  const repliesByParent = {};
  comments.forEach((c) => {
    if (c.replyTo) {
      if (!repliesByParent[c.replyTo]) repliesByParent[c.replyTo] = [];
      repliesByParent[c.replyTo].push(c);
    }
  });

  const renderComment = (c, isReply = false) => {
    const replies = repliesByParent[c._id] || [];
    const t = window.translations[getLang()];
    const dateLocale = getLang() === "EN" ? "en-US" : "vi-VN";
    const replyHtml = isReply
      ? ""
      : `
      ${
        replies.length > 0
          ? `
          <div style="margin-top: 8px;">
              <button class="toggle-replies-btn" data-target="replies-${c._id}" style="background: none; border: none; color: #737373; cursor: pointer; font-weight: 600; font-size: 12px; padding: 0; display: flex; align-items: center; gap: 8px; transition: 0.2s;">
                  <div style="width: 24px; height: 1px; background: #dbdbdb;"></div>
                  <span>${t.view_replies} (${replies.length})</span>
              </button>
              <div id="replies-${c._id}" style="display: none; margin-top: 8px;">
                  ${replies.map((r) => renderComment(r, true)).join("")}
              </div>
          </div>
      `
          : ""
      }
    `;

    // Cho phép xóa nếu: 1. Mình viết comment, HOẶC 2. Mình là chủ bài viết
    const canDelete = (c.userId && c.userId === myId) || isMyPost;
    const deleteBtn = canDelete
      ? `<button class="comment-delete-btn" data-post-id="${postId}" data-comment-id="${c._id}" style="background: none; border: none; color: #8e8e8e; cursor: pointer; padding: 0; display: flex; align-items: center; margin-left: auto; transition: color 0.2s;" title="${t.tooltip_delete_comment}" onmouseover="this.style.color='#ed4956'" onmouseout="this.style.color='#8e8e8e'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="1.5"></circle>
                <circle cx="19" cy="12" r="1.5"></circle>
                <circle cx="5" cy="12" r="1.5"></circle>
            </svg>
        </button>`
      : "";

    let cUser = c.user;
    if (cUser === "Người dùng ẩn danh" || cUser === "Anonymous user")
      cUser = t.anonymous_user;
    let cReplyUser = c.replyToUser;
    if (cReplyUser === "Người dùng ẩn danh" || cReplyUser === "Anonymous user")
      cReplyUser = t.anonymous_user;

    return `
      <div style="display: flex; gap: 12px; margin-bottom: ${isReply ? "12px" : "16px"}; padding-top: ${isReply ? "0" : "8px"};">
          <img src="${c.userAvatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}" alt="Avatar" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 1px solid rgba(255, 255, 255, 0.1);">
          <div style="flex: 1; min-width: 0;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                  <div style="font-size: 14px; line-height: 1.4; color: #000; margin-bottom: 2px;">
                      <strong style="font-weight: 600;">${cUser}</strong>
                      ${cReplyUser ? `<span style="color: #00376b; font-weight: 400;">@${cReplyUser}</span> ` : " "}
                      <span style="font-weight: 400; word-break: break-word;">${c.text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>
                  </div>
                  <button class="comment-like-btn" data-post-id="${postId}" data-comment-id="${c._id}" style="background: none; border: none; color: ${c.likes && myId && c.likes.includes(myId) ? "#e91e63" : "#a8a8a8"}; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; transition: 0.2s; margin-top: 2px;" title="Like">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="${c.likes && myId && c.likes.includes(myId) ? "#e91e63" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="comment-heart-icon"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                  </button>
              </div>
              ${c.media_url ? (c.media_url.includes("/video/") ? `<video src="${c.media_url}" controls style="width: 100%; max-width: 250px; border-radius: 8px; margin-top: 4px; background: #000;"></video>` : `<img src="${c.media_url}" style="width: 100%; max-width: 250px; object-fit: cover; border-radius: 8px; margin-top: 4px; border: 1px solid rgba(255, 255, 255, 0.1);">`) : ""}
              
              <div style="display: flex; gap: 16px; margin-top: 6px; font-size: 12px; font-weight: 600; color: #737373; align-items: center;">
                  <span style="font-weight: 400; color: #8e8e8e;">${new Date(c.createdAt).toLocaleDateString(dateLocale, { day: "numeric", month: "short" })}</span>
                  <button class="comment-like-btn" data-post-id="${postId}" data-comment-id="${c._id}" style="background: none; border: none; color: #737373; font-weight: 600; cursor: pointer; padding: 0;">
                      <span class="comment-like-count">${c.likes && c.likes.length > 0 ? c.likes.length + " " + (getLang() === "EN" && c.likes.length > 1 ? t.likes : t.like) : t.like}</span>
                  </button>
                  <button class="comment-reply-btn" data-post-id="${postId}" data-user="${c.user}" data-comment-id="${isReply ? c.replyTo : c._id}" style="background: none; border: none; color: #737373; font-weight: 600; cursor: pointer; padding: 0;">${t.reply}</button>
                  ${deleteBtn}
              </div>
              ${replyHtml}
          </div>
      </div>
    `;
  };
  return topLevel.map((c) => renderComment(c, false)).join("");
};

// 2.3. HÀM TẢI & HIỂN THỊ BÀI VIẾT (GIAO DIỆN CHUẨN ẢNH)
async function loadPosts(category = "all posts") {
  try {
    const t = window.translations[getLang()];
    // Gửi yêu cầu lọc theo category lên server
    const response = await fetch(`${API_URL}?category=${category}`);
    const posts = await response.json();

    if (!Array.isArray(posts)) {
      console.error("❌ Lỗi dữ liệu từ Server (có thể do lỗi Backend):", posts);
      return;
    }
    console.log("📥 Danh sách bài viết từ Server:", posts);

    const postsFeed = document.getElementById("posts-feed");
    postsFeed.innerHTML = ""; // Xóa sạch bài cũ để nạp bài mới

    // Lấy thông tin tài khoản đang đăng nhập (hoặc ẩn danh) để so sánh quyền xóa và thả tim
    const meString = localStorage.getItem("currentUser");
    const me = meString ? JSON.parse(meString) : null;

    let myId = "ẩn_danh";
    if (me) {
      myId = me._id || me.userId || me.username;
    } else {
      let anonId = localStorage.getItem("anonymousId");
      if (!anonId) {
        anonId = "anon_" + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("anonymousId", anonId);
      }
      myId = anonId;
    }

    const dateLocale = getLang() === "EN" ? "en-US" : "vi-VN";
    let allPostsHTML = "";
    posts.forEach((post) => {
      // Xử lý hiển thị Ảnh hoặc Video thông minh
      let mediaHTML = "";
      if (post.media_url) {
        if (post.media_url.includes("/video/")) {
          mediaHTML = `<video src="${post.media_url}" controls style="width: 100%; max-height: 400px; border-radius: 10px; background: #000;"></video>`;
        } else {
          mediaHTML = `<img src="${post.media_url}" alt="Bài đăng" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 10px;">`;
        }
      }

      // Kiểm tra xem bài này có phải của tài khoản hiện tại không (So sánh bằng ID)
      const isMyPost = me
        ? (post.authorId && post.authorId === myId) ||
          (!post.authorId && post.authorName === me.fullName)
        : false;
      const postOptionsHTML = isMyPost
        ? `
        <div style="display: flex; gap: 12px; align-items: center;">
            <button class="btn-edit-post" data-id="${post._id}" data-content="${post.content ? post.content.replace(/"/g, "&quot;") : ""}" data-category="${post.category}" data-media="${post.media_url || ""}" style="background: none; border: none; color: #888; cursor: pointer; padding: 0; display: flex; align-items: center; transition: 0.2s;" title="${t.tooltip_edit_post}" onmouseover="this.style.color='#0084ff'" onmouseout="this.style.color='#888'">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="btn-menu" data-id="${post._id}" style="background: none; border: none; color: #888; cursor: pointer; padding: 0; display: flex; align-items: center; transition: 0.2s;" title="${t.tooltip_delete_post}" onmouseover="this.style.color='#dc3545'" onmouseout="this.style.color='#888'">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        </div>`
        : "";

      // Tạo HTML cho Huy hiệu bằng thẻ <img> thay vì SVG
      const badgeHTML = post.authorHasBadge
        ? `<img src="badge.png" title="Guardian Badge" style="width: 18px; height: 18px; margin-left: 6px; object-fit: contain;">`
        : "";

      let displayName = post.authorName || t.anonymous_user;
      if (
        displayName === "Người dùng ẩn danh" ||
        displayName === "Anonymous user"
      ) {
        displayName = t.anonymous_user;
      }
      const displayCategory =
        post.category === "story"
          ? t.cat_story
          : post.category === "adoption"
            ? t.cat_adoption
            : post.category === "donations"
              ? t.cat_donations
              : post.category === "organizations"
                ? t.cat_orgs
                : post.category;

      const postHTML = `
                <div class="post-card">
                    
                    <div class="post-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                        <div style="display: flex; gap: 12px; align-items: center;">
    <img class="profile-trigger" data-id="${post.authorId || ""}" data-name="${displayName}" data-avatar="${post.authorAvatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}" src="${post.authorAvatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}" alt="Avatar" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover; cursor: pointer;">
    <div>
        <h4 class="profile-trigger" data-id="${post.authorId || ""}" data-name="${displayName}" data-avatar="${post.authorAvatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}" style="margin: 0 0 4px 0; font-size: 15px; color: #333; font-weight: bold; cursor: pointer; display: flex; align-items: center;">${displayName}${badgeHTML}</h4>
        <span style="font-size: 12px; color: #888;">${new Date(post.createdAt).toLocaleString(dateLocale, { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short", year: "numeric" })}</span>
    </div>
</div>
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <span style="background: #e6f4ea; color: #1e8e3e; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: lowercase;">${displayCategory}</span>
                            ${postOptionsHTML}
                        </div>
                    </div>

                    <div class="post-content" style="margin-bottom: 15px;">
                        <p style="margin: 0 0 15px 0; font-size: 15px; color: #333; line-height: 1.5;">${post.content}</p>
                        ${mediaHTML}
                    </div>

                    <div class="post-actions" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; padding-top: 15px;">
                        <div style="display: flex; gap: 20px;">
                            <button class="btn-like" data-id="${post._id}" style="background: none; border: none; color: #333; font-size: 15px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 600; padding: 0; transition: 0.2s;">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="${post.likes && post.likes.includes(myId) ? "#e91e63" : "none"}" stroke="${post.likes && post.likes.includes(myId) ? "#e91e63" : "currentColor"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="heart-icon"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
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
                        
                        <div class="comments-list" style="max-height: 350px; overflow-y: auto; margin-bottom: 15px; font-size: 14px;">
                            ${window.renderCommentsHTML(post.comments, post._id, myId, isMyPost)}
                        </div>
                        
                        <div style="display: flex; gap: 10px; align-items: flex-end;">
                            <img id="comment-avatar-${post._id}" src="https://cdn-icons-png.flaticon.com/512/149/149071.png" alt="Avatar" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;">
                            <div style="flex: 1;">
                                <div id="comment-media-preview-${post._id}" style="display: none; position: relative; margin-bottom: 8px;">
                                    <img id="comment-media-img-${post._id}" style="max-width: 100%; max-height: 200px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(255, 255, 255, 0.1);">
                                    <button id="remove-comment-media-${post._id}" type="button" style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center;">✕</button>
                                </div>
                                <div style="display: flex; gap: 8px;">
                                    <input type="text" class="comment-input" placeholder="${t.write_comment}" style="flex: 1; padding: 10px 15px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1); outline: none; font-size: 14px;">
                                    <label style="cursor: pointer; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; transition: 0.2s;" title="Attach image">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #666;">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                            <polyline points="21 15 16 10 5 21"></polyline>
                                        </svg> 
                                        <input type="file" class="comment-media-input" data-post-id="${post._id}" accept="image/*" hidden>
                                    </label>
                                    <button class="btn-send-comment" data-id="${post._id}" style="background: #1e8e3e; color: white; border: none; padding: 8px 18px; border-radius: 20px; cursor: pointer; font-weight: bold; font-size: 14px; transition: 0.2s;" title="Send comment">${t.btn_send}</button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
                `;
      postsFeed.innerHTML += postHTML;
      allPostsHTML += postHTML;
    });
    postsFeed.innerHTML = allPostsHTML;

    // ============ THÊM EVENT LISTENERS CHO COMMENT MEDIA INPUT ============
    const allCommentMediaInputs = document.querySelectorAll(
      ".comment-media-input",
    );
    allCommentMediaInputs.forEach((input) => {
      input.addEventListener("change", function () {
        const file = this.files[0];
        if (file) {
          const postId = this.getAttribute("data-post-id");
          const commentMediaPreview = document.getElementById(
            `comment-media-preview-${postId}`,
          );
          const commentMediaImg = document.getElementById(
            `comment-media-img-${postId}`,
          );
          const removeBtn = document.getElementById(
            `remove-comment-media-${postId}`,
          );

          commentMediaImg.src = URL.createObjectURL(file);
          commentMediaPreview.style.display = "block";

          removeBtn.onclick = (evt) => {
            evt.preventDefault();
            input.value = "";
            commentMediaPreview.style.display = "none";
          };
        }
      });
    });

    // CẬP NHẬT AVATAR COMMENT NẾU NGƯỜI DÙNG ĐÃ ĐĂNG NHẬP
    if (meString) {
      const userAvatar =
        me.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
      const allCommentAvatars = document.querySelectorAll(
        "[id^='comment-avatar-']",
      );
      allCommentAvatars.forEach((avatar) => {
        avatar.src = userAvatar;
      });
    }
  } catch (error) {
    console.error("Lỗi khi lấy bài viết:", error);
  }
}

// ==========================================
// XỬ LÝ HỘP THOẠI SỬA BÀI VIẾT
// ==========================================
const editPostMediaInput = document.getElementById("editPostMedia");
if (editPostMediaInput) {
  editPostMediaInput.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
      document.getElementById("editMediaPreviewImg").src =
        URL.createObjectURL(file);
      document.getElementById("editMediaPreviewContainer").style.display =
        "block";
      document
        .getElementById("saveEditPostBtn")
        .setAttribute("data-remove-media", "false");
    }
  });
}

const editRemoveMediaBtn = document.getElementById("editRemoveMediaBtn");
if (editRemoveMediaBtn) {
  editRemoveMediaBtn.addEventListener("click", function () {
    document.getElementById("editPostMedia").value = "";
    document.getElementById("editMediaPreviewContainer").style.display = "none";
    document
      .getElementById("saveEditPostBtn")
      .setAttribute("data-remove-media", "true");
  });
}

const closeEditModalBtn = document.getElementById("closeEditModalBtn");
if (closeEditModalBtn) {
  closeEditModalBtn.addEventListener("click", function () {
    document.getElementById("editPostModal").style.display = "none";
  });
}

const saveEditPostBtn = document.getElementById("saveEditPostBtn");
if (saveEditPostBtn) {
  saveEditPostBtn.addEventListener("click", async function () {
    const postId = this.getAttribute("data-post-id");
    const content = document.getElementById("editPostContent").value;
    const category = document.getElementById("editPostCategory").value;
    const removeMedia = this.getAttribute("data-remove-media");
    const file = document.getElementById("editPostMedia").files[0];

    const meString = localStorage.getItem("currentUser");
    const myUserId = meString
      ? JSON.parse(meString)._id || JSON.parse(meString).userId
      : null;

    const formData = new FormData();
    formData.append("userId", myUserId);
    formData.append("content", content);
    formData.append("category", category);
    formData.append("removeMedia", removeMedia);
    if (file) {
      formData.append("media", file);
    }

    const t = window.translations[getLang()];
    saveEditPostBtn.innerText = t.saving;
    saveEditPostBtn.disabled = true;

    try {
      const response = await fetch(`${API_URL}/${postId}`, {
        method: "PUT",
        body: formData,
      });

      if (response.ok) {
        document.getElementById("editPostModal").style.display = "none";
        loadPosts(); // Xóa sạch và nạp lại list bài đăng
      } else {
        const err = await response.json();
        console.error("Lỗi sửa bài: " + err.message);
      }
    } catch (error) {
      console.error("Lỗi sửa bài:", error);
    } finally {
      saveEditPostBtn.innerText = t.btn_save_changes;
      saveEditPostBtn.disabled = false;
    }
  });
}

// 2.4. HÀM GỬI BÀI VIẾT KHI BẤM NÚT POST
postBtn.addEventListener("click", async function () {
  const content = postInput.value;
  const category = categorySelect.value;
  const file = mediaInput.files[0];

  if (!content && !file) {
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
      me.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    );
    formData.append("authorId", me._id || me.userId);
  }

  try {
    console.log("🔥 GỬI BÀI VIẾT - URL:", API_URL);
    console.log("📦 FormData gửi:", {
      content: content,
      category: category,
      hasFile: !!file,
      fileName: file?.name,
    });

    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    console.log("📥 Response status:", response.status);
    const data = await response.json();
    console.log("📥 Response data:", data);

    if (response.ok) {
      // Đăng xong thì xóa sạch ô nhập
      postInput.value = "";
      mediaInput.value = "";
      mediaPreviewContainer.style.display = "none";

      // QUAN TRỌNG: Gọi lại hàm này để bài mới hiện lên ngay lập tức
      loadPosts();
    } else {
      console.error("❌ Lỗi: " + data.message);
    }
  } catch (error) {
    console.error("❌ Lỗi khi đăng bài:", error);
    console.error("❌ Lỗi hệ thống: " + error.message);
  }
});

// 2.5. TỰ ĐỘNG CHẠY KHI MỞ WEB
loadPosts();

// ==========================================
//               3. BÀI ĐĂNG
// ==========================================

// CHỨC NĂNG TƯƠNG TÁC: LIKE, BOOKMARK (THẢ TIM, LƯU BÀI)
const postsFeedContainer = document.getElementById("posts-feed");

// 0. XỬ LÝ NHẤN ENTER ĐỂ GỬI BÌNH LUẬN
postsFeedContainer.addEventListener("keypress", function (e) {
  if (e.key === "Enter" && e.target.classList.contains("comment-input")) {
    e.preventDefault(); // Tránh bị nhảy dòng (nếu có)
    const sendBtn = e.target
      .closest(".post-comments-section")
      .querySelector(".btn-send-comment");
    if (sendBtn) {
      sendBtn.click(); // Giả lập hành động click vào nút gửi
    }
  }
});

postsFeedContainer.addEventListener("click", async function (e) {
  // 1. XỬ LÝ LIKE
  const likeBtn = e.target.closest(".btn-like");
  if (likeBtn) {
    const postId = likeBtn.getAttribute("data-id");
    const icon = likeBtn.querySelector(".heart-icon");
    const countSpan = likeBtn.querySelector(".like-count");

    let myUserId = "ẩn_danh";
    const meString = localStorage.getItem("currentUser");

    if (meString) {
      // Đã đăng nhập: Lấy ID thật
      const me = JSON.parse(meString);
      myUserId = me._id || me.userId || me.username || "user_macdinh";
    } else {
      // Chưa đăng nhập (Ẩn danh): Cấp cho máy này 1 mã vĩnh viễn
      let anonId = localStorage.getItem("anonymousId");
      if (!anonId) {
        anonId = "anon_" + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("anonymousId", anonId);
      }
      myUserId = anonId;
    }

    try {
      const response = await fetch(`${API_URL}/${postId}/like`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: myUserId }),
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
    const commentMediaInput = commentSection.querySelector(
      ".comment-media-input",
    );
    const commentMediaPreview = document.getElementById(
      `comment-media-preview-${postId}`,
    );
    const commentMediaImg = document.getElementById(
      `comment-media-img-${postId}`,
    );

    let text = inputField.value.trim();
    const mediaFile = commentMediaInput.files[0];

    let replyToId = sendCommentBtn.getAttribute("data-reply-to");
    let replyToUser = sendCommentBtn.getAttribute("data-reply-to-user");

    // Nếu có reply mà người dùng xóa mất chữ @username trong ô nhập thì coi như hủy reply
    if (replyToUser && !inputField.value.includes(`@${replyToUser}`)) {
      sendCommentBtn.removeAttribute("data-reply-to");
      sendCommentBtn.removeAttribute("data-reply-to-user");
      replyToId = null;
      replyToUser = null;
    }

    // Nếu vẫn là reply, cắt bỏ chữ @username ra khỏi text để tránh bị lặp
    if (replyToUser && text.startsWith(`@${replyToUser}`)) {
      text = text.replace(`@${replyToUser}`, "").trim();
    }

    console.log("🔥 GỬI COMMENT:", { text, hasMedia: !!mediaFile, postId });

    if (!text && !mediaFile) {
      console.log("⚠️ Không có nội dung và ảnh");
      return;
    }

    try {
      // Lấy info người dùng từ localStorage
      const meString = localStorage.getItem("currentUser");
      let userName = window.translations[getLang()].anonymous_user;
      let userAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
      let myUserId = "ẩn_danh";

      if (meString) {
        const me = JSON.parse(meString);
        userName = me.fullName || "Người dùng";
        userAvatar =
          me.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        myUserId = me._id || me.userId || "user_macdinh";
      }

      console.log("👤 Người dùng:", { userName, userAvatar });

      const formData = new FormData();
      formData.append("text", text);
      formData.append("user", userName);
      formData.append("userAvatar", userAvatar);
      formData.append("userId", myUserId);
      if (mediaFile) {
        formData.append("media", mediaFile);
        console.log("📸 Gửi ảnh:", mediaFile.name);
      }

      if (replyToId) {
        formData.append("replyTo", replyToId);
        if (replyToUser) formData.append("replyToUser", replyToUser);
      }

      console.log("📤 Gửi request tới:", `${API_URL}/${postId}/comment`);

      const response = await fetch(`${API_URL}/${postId}/comment`, {
        method: "POST",
        body: formData,
      });

      console.log("📥 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Lỗi server:", errorText);
        return;
      }

      const updatedComments = await response.json();
      console.log("✅ Comments mới:", updatedComments);

      if (!updatedComments || !Array.isArray(updatedComments)) {
        console.error("❌ Response không phải là array:", updatedComments);
        return;
      }

      countSpan.innerText = updatedComments.length;
      inputField.value = "";
      commentMediaInput.value = "";
      commentMediaPreview.style.display = "none";

      // Xóa trạng thái đang trả lời
      sendCommentBtn.removeAttribute("data-reply-to");
      sendCommentBtn.removeAttribute("data-reply-to-user");

      // Lấy bình luận mới nhất in ra màn hình
      // RENDER LẠI TOÀN BỘ DANH SÁCH BÌNH LUẬN SIÊU MƯỢT
      const isMyPost =
        document.querySelector(`.btn-edit-post[data-id="${postId}"]`) !== null;
      commentsList.innerHTML = window.renderCommentsHTML(
        updatedComments,
        postId,
        myUserId,
        isMyPost,
      );

      // Tự động xổ câu trả lời ra nếu bạn vừa reply
      if (replyToId) {
        const repliesContainer = document.getElementById(
          `replies-${replyToId}`,
        );
        const toggleBtn = document.querySelector(
          `.toggle-replies-btn[data-target="replies-${replyToId}"]`,
        );
        if (repliesContainer) {
          repliesContainer.style.display = "block";
          if (toggleBtn) {
            const span = toggleBtn.querySelector("span");
            const t = window.translations[getLang()];
            if (span)
              span.innerText = span.innerText.replace(
                t.view_replies.split(" ")[0],
                t.hide_replies.split(" ")[0],
              );
          }
        }
      }
      console.log("✨ Comment đã thêm vào UI");
    } catch (error) {
      console.error("❌ Lỗi gửi bình luận:", error);
      console.error("Lỗi gửi comment: " + error.message);
    }
  }

  // 5. XỬ LÝ KHI BẤM ICON THÙNG RÁC (XÓA BÀI)
  const menuBtn = e.target.closest(".btn-menu");
  if (menuBtn) {
    const postId = menuBtn.getAttribute("data-id");

    // 1. Hiện cái hộp xác nhận xịn xò lên
    document.getElementById("customDeleteConfirm").style.display = "flex";

    // 2. Lén nhét cái ID của bài viết vào nút Tick (để lát nữa bấm Tick thì biết bài nào mà xóa)
    document.getElementById("confirmDeleteBtn").setAttribute("data-id", postId);
  }

  // 5.5 XỬ LÝ KHI BẤM ICON CÂY BÚT (SỬA BÀI)
  const editBtn = e.target.closest(".btn-edit-post");
  if (editBtn) {
    const postId = editBtn.getAttribute("data-id");
    const content = editBtn.getAttribute("data-content");
    const category = editBtn.getAttribute("data-category");
    const media = editBtn.getAttribute("data-media");

    const modal = document.getElementById("editPostModal");
    document.getElementById("editPostMedia").value = "";
    document
      .getElementById("saveEditPostBtn")
      .setAttribute("data-remove-media", "false");
    document
      .getElementById("saveEditPostBtn")
      .setAttribute("data-post-id", postId);

    document.getElementById("editPostContent").value = content;
    document.getElementById("editPostCategory").value = category;

    if (media && media !== "null") {
      document.getElementById("editMediaPreviewImg").src = media;
      document.getElementById("editMediaPreviewContainer").style.display =
        "block";
    } else {
      document.getElementById("editMediaPreviewContainer").style.display =
        "none";
    }

    modal.style.display = "flex";
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
      console.log("Đã copy link bài viết vào bộ nhớ tạm!");
      navigator.clipboard.writeText(window.location.href);
    }
  }

  // 7. XỬ LÝ KHI BẤM THẢ TIM BÌNH LUẬN
  const commentLikeBtn = e.target.closest(".comment-like-btn");
  if (commentLikeBtn) {
    const postId = commentLikeBtn.getAttribute("data-post-id");
    const commentId = commentLikeBtn.getAttribute("data-comment-id");

    let myUserId = "ẩn_danh";
    const meString = localStorage.getItem("currentUser");
    if (meString) {
      const me = JSON.parse(meString);
      myUserId = me._id || me.userId || me.username || "user_macdinh";
    } else {
      myUserId = localStorage.getItem("anonymousId") || "ẩn_danh";
    }

    try {
      const response = await fetch(
        `${API_URL}/${postId}/comment/${commentId}/like`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: myUserId }),
        },
      );
      const data = await response.json();

      const t = window.translations[currentLang];
      // Đồng bộ cả icon tim ở trên và chữ Thích ở dưới
      const likeBtns = document.querySelectorAll(
        `.comment-like-btn[data-comment-id="${commentId}"]`,
      );
      likeBtns.forEach((btn) => {
        const countSpan = btn.querySelector(".comment-like-count");
        const icon = btn.querySelector(".comment-heart-icon");

        if (countSpan) {
          countSpan.innerText =
            data.likesCount > 0
              ? `${data.likesCount} ` +
                (getLang() === "EN" && data.likesCount > 1 ? t.likes : t.like)
              : t.like;
        }

        if (icon) {
          if (data.isLiked) {
            btn.style.color = "#e91e63";
            icon.setAttribute("fill", "#e91e63");
            icon.setAttribute("stroke", "#e91e63");
          } else {
            btn.style.color = "#a8a8a8";
            icon.setAttribute("fill", "none");
            icon.setAttribute("stroke", "currentColor");
          }
        }
      });
    } catch (error) {
      console.error("Lỗi like bình luận:", error);
    }
  }

  // 8. XỬ LÝ KHI BẤM NÚT TRẢ LỜI BÌNH LUẬN
  const commentReplyBtn = e.target.closest(".comment-reply-btn");
  if (commentReplyBtn) {
    const postId = commentReplyBtn.getAttribute("data-post-id");
    const userName = commentReplyBtn.getAttribute("data-user");
    const commentId = commentReplyBtn.getAttribute("data-comment-id");

    const commentSection = document.getElementById(`comments-${postId}`);
    const inputField = commentSection.querySelector(".comment-input");
    const sendBtn = commentSection.querySelector(".btn-send-comment");

    sendBtn.setAttribute("data-reply-to", commentId);
    sendBtn.setAttribute("data-reply-to-user", userName);

    // Điền sẵn @username vào ô nhập
    inputField.value = `@${userName} `;
    inputField.focus();
  }

  // 9. XỬ LÝ KHI BẤM NÚT XEM/ẨN CÂU TRẢ LỜI
  const toggleRepliesBtn = e.target.closest(".toggle-replies-btn");
  if (toggleRepliesBtn) {
    const targetId = toggleRepliesBtn.getAttribute("data-target");
    const repliesContainer = document.getElementById(targetId);
    const span = toggleRepliesBtn.querySelector("span");
    const t = window.translations[getLang()];

    if (repliesContainer.style.display === "none") {
      repliesContainer.style.display = "block";
      if (span)
        span.innerText = span.innerText.replace(
          t.view_replies.split(" ")[0],
          t.hide_replies.split(" ")[0],
        );
    } else {
      repliesContainer.style.display = "none";
      if (span)
        span.innerText = span.innerText.replace(
          t.hide_replies.split(" ")[0],
          t.view_replies.split(" ")[0],
        );
    }
  }

  // 10. XỬ LÝ KHI BẤM NÚT XÓA BÌNH LUẬN
  const deleteCommentBtn = e.target.closest(".comment-delete-btn");
  if (deleteCommentBtn) {
    const postId = deleteCommentBtn.getAttribute("data-post-id");
    const commentId = deleteCommentBtn.getAttribute("data-comment-id");

    const confirmModal = document.getElementById("commentDeleteConfirm");
    const confirmBtn = document.getElementById("confirmDeleteCommentBtn");

    if (confirmModal && confirmBtn) {
      confirmBtn.setAttribute("data-post-id", postId);
      confirmBtn.setAttribute("data-comment-id", commentId);
      confirmModal.style.display = "flex";
    }
  }
});

// ==========================================
//            HỆ THỐNG KẾT BẠN
// ==========================================

const searchFriendInput = document.getElementById("searchFriendInput");
const friendSearchResults = document.getElementById("friendSearchResults");
const pendingRequestsContainer = document.getElementById(
  "pendingRequestsContainer",
);
const requestBadge = document.getElementById("requestBadge");
const btnShowRequests = document.getElementById("btnShowRequests");
const requestsWrapper = document.getElementById("requestsWrapper");

// 0. Mở / Đóng khung lời mời kết bạn khi bấm chuông
if (btnShowRequests && requestsWrapper) {
  btnShowRequests.addEventListener("click", () => {
    if (requestsWrapper.style.display === "none") {
      requestsWrapper.style.display = "block";
      btnShowRequests.style.background = "#eefdf4"; // Đổi màu xanh nhẹ báo đang mở
      btnShowRequests.style.borderColor = "#bbf7d0";
    } else {
      requestsWrapper.style.display = "none";
      btnShowRequests.style.background = "#f8fafc";
      btnShowRequests.style.borderColor = "#e2e8f0";
    }
  });
}

// 1. Gõ để tìm kiếm bạn bè
if (searchFriendInput) {
  searchFriendInput.addEventListener("input", async (e) => {
    const keyword = e.target.value.trim();
    if (!keyword) {
      friendSearchResults.innerHTML = "";
      return;
    }

    const meString = localStorage.getItem("currentUser");
    if (!meString) return;
    const myId = JSON.parse(meString)._id || JSON.parse(meString).userId;

    try {
      const t = window.translations[getLang()];
      const response = await fetch(
        `http://${window.location.hostname}:3000/api/users/search-new/${myId}?q=${keyword}`,
      );
      const data = await response.json();

      if (!data.success || !data.users) return; // BẢO VỆ CHỐNG LỖI MẢNG TRỐNG TỪ SERVER

      friendSearchResults.innerHTML = "";
      data.users.forEach((u) => {
        if (u.status === "friend" || u.status === "received") return; // Bỏ qua nếu đã là bạn hoặc họ đã gửi cho mình

        const isSent = u.status === "sent";
        const btnStyle = isSent
          ? "background: #f1f5f9; color: #333;"
          : "background: #eefdf4; color: #16a34a;";
        const btnText = isSent
          ? t.cancel_request.split(" ")[0]
          : t.btn_add_friend;

        friendSearchResults.innerHTML += `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px; border-radius: 8px; border: 1px solid #eee;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="${u.avatar}" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover;">
              <span style="font-size: 14px; font-weight: 600;">${u.fullName}</span>
            </div>
            <button onclick="toggleFriendRequest('${u._id}', this)" style="${btnStyle} border: none; padding: 6px 12px; border-radius: 15px; font-size: 12px; font-weight: bold; cursor: pointer; transition: 0.2s;">
              ${btnText}
            </button>
          </div>
        `;
      });
    } catch (err) {
      console.error("Lỗi tìm bạn:", err);
    }
  });
}

// 2. Nhấn Thêm Bạn Bè / Hủy
window.toggleFriendRequest = async function (targetId, btnElement) {
  const meString = localStorage.getItem("currentUser");
  if (!meString) return;
  const myId = JSON.parse(meString)._id || JSON.parse(meString).userId;

  btnElement.innerText = "...";
  const t = window.translations[getLang()];
  try {
    const res = await fetch(
      `http://${window.location.hostname}:3000/api/friends/request`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ myId, targetId }),
      },
    );
    const data = await res.json();

    if (data.action === "sent") {
      btnElement.innerText = t.cancel_request.split(" ")[0];
      btnElement.style.background = "#f1f5f9";
      btnElement.style.color = "#333";
    } else {
      btnElement.innerText = t.btn_add_friend;
      btnElement.style.background = "#eefdf4";
      btnElement.style.color = "#16a34a";
    }
  } catch (err) {
    console.error("Lỗi gửi lời mời:", err);
  }
};

// 3. Tải danh sách người gửi lời mời
let lastRequestsString = ""; // Bộ nhớ đệm giúp giảm giật lag
async function loadFriendRequests() {
  const meString = localStorage.getItem("currentUser");
  if (!meString || !pendingRequestsContainer) return;
  const myId = JSON.parse(meString)._id || JSON.parse(meString).userId;

  try {
    const res = await fetch(
      `http://${window.location.hostname}:3000/api/friends/requests/${myId}`,
    );
    const data = await res.json();

    // TỐI ƯU HÓA: Chỉ vẽ lại màn hình khi có lời mời kết bạn MỚI
    const newRequestsString = JSON.stringify(data.requests);
    if (newRequestsString === lastRequestsString) return;
    lastRequestsString = newRequestsString;

    if (data.requests.length > 0) {
      requestBadge.style.display = "flex"; // Sửa lại thành flex để căn giữa số cho đẹp
      requestBadge.innerText = data.requests.length;
      pendingRequestsContainer.innerHTML = "";

      data.requests.forEach((req) => {
        pendingRequestsContainer.innerHTML += `
          <div class="request-item">
            <img src="${req.avatar}">
            <div class="request-info">
              <h4>${req.fullName}</h4>
            </div>
            <div class="request-actions">
              <button class="btn-accept" onclick="respondRequest('${req._id}', 'accept')" style="color: white; font-weight: bold;">✔</button>
              <button class="btn-decline" onclick="respondRequest('${req._id}', 'decline')" style="color: #666; font-weight: bold;">✖</button>
            </div>
          </div>
        `;
      });
    } else {
      requestBadge.style.display = "none";
      pendingRequestsContainer.innerHTML = `<p style="font-size: 13px; color: #888; text-align: center;">${window.translations[getLang()].no_friend_requests}</p>`;
    }
  } catch (err) {}
}

// 4. Bấm Xác nhận hoặc Xóa
window.respondRequest = async function (requesterId, action) {
  const meString = localStorage.getItem("currentUser");
  const myId = JSON.parse(meString)._id || JSON.parse(meString).userId;

  await fetch(`http://${window.location.hostname}:3000/api/friends/respond`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ myId, requesterId, action }),
  });
  loadFriendRequests(); // Tải lại danh sách lời mời
  loadUsersForChat(); // Tải lại danh sách chat (Nếu accept thì sẽ hiện trong chat)
};

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
let lastMessagesString = ""; // Bộ nhớ đệm tin nhắn

// 2. ĐÓNG KHUNG CHAT
closeChat.addEventListener("click", () => {
  chatBox.style.display = "none";
  if (chatInterval) clearInterval(chatInterval); // Tắt auto-refresh
  lastMessagesString = ""; // Reset trạng thái
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

    // TỐI ƯU HÓA SIÊU MƯỢT: Nếu tin nhắn không thay đổi thì KHÔNG vẽ lại HTML (Tránh giật cục)
    const newMessagesString = JSON.stringify(messageList);
    if (newMessagesString === lastMessagesString) return;
    lastMessagesString = newMessagesString;

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
let lastUsersString = ""; // Bộ nhớ đệm danh sách bạn bè

async function loadUsersForChat(searchKeyword = "") {
  try {
    const userListContainer = document.getElementById("userListContainer");
    if (!userListContainer) return;

    const meString = localStorage.getItem("currentUser");
    if (!meString) return; // Nếu chưa đăng nhập thì không làm gì cả
    const me = JSON.parse(meString);

    // Lọc bỏ chính mình ra khỏi danh sách
    const myId = me._id || me.id || me.userId;

    // ĐÃ SỬA: Thay vì tìm toàn bộ mạng xã hội, giờ chỉ tìm những người LÀ BẠN BÈ
    let url = `http://${window.location.hostname}:3000/api/users/friends/${myId}?search=${searchKeyword}`;

    // Nếu không nhập từ khóa tìm kiếm, chỉ lấy những người đã từng nhắn tin
    if (searchKeyword.trim() === "") {
      url = `http://${window.location.hostname}:3000/api/users/recent/${myId}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    // Lọc bỏ chính mình ra khỏi danh sách
    const otherUsers = data.users.filter((u) => u._id !== myId);

    // TỐI ƯU HÓA: Chỉ vẽ lại danh sách nếu có người mới hoặc trạng thái thay đổi
    const newUsersString = JSON.stringify(otherUsers);
    if (newUsersString === lastUsersString) return;
    lastUsersString = newUsersString;

    userListContainer.innerHTML = "";

    if (otherUsers.length === 0) {
      userListContainer.innerHTML = `<p style="text-align: center; color: #888; font-size: 13px; margin-top: 20px;">${window.translations[getLang()].search_to_start}</p>`;
      return;
    }

    otherUsers.forEach((user) => {
      const userDiv = document.createElement("div");
      // Copy CSS y hệt của Anna Tran
      userDiv.style =
        "display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 5px; border-radius: 8px; transition: 0.3s;";
      userDiv.className = "chat-item";

      // Thiết kế giao diện từng người
      userDiv.innerHTML = `
                <div style="position: relative">
                    <img src="${user.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                    <span style="position: absolute; bottom: 2px; right: 0; width: 10px; height: 10px; background: #31a24c; border-radius: 50%; border: 2px solid white;"></span>
                </div>
                <div class="chat-info">
                    <h5 style="margin: 0; font-size: 14px; color: #333">${user.fullName}</h5>
                    <p style="margin: 2px 0 0 0; font-size: 12px; color: #888">${window.translations[getLang()].click_to_message}</p>
                </div>
            `;

      // SỰ KIỆN KHI BẤM CHỌN 1 NGƯỜI ĐỂ CHAT (Vị trí 3 đã nằm gọn ở đây)
      userDiv.onclick = () => {
        currentPartnerId = user._id; // Chốt ID người nhận tin nhắn

        // Mở khung chat (Dúi nhớ check biến chatBox xem có đúng tên không nhé)
        if (typeof chatBox !== "undefined") chatBox.style.display = "flex";
        document.getElementById("chatName").innerText = user.fullName;
        const chatAvatar = document.getElementById("chatAvatar");
        if (chatAvatar)
          chatAvatar.src =
            user.avatar ||
            "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        lastMessagesString = ""; // Reset để tải tin nhắn người mới mượt hơn

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

  // Tự động làm mới danh sách bạn bè 3 giây/lần (Chỉ làm mới khi không gõ tìm kiếm)
  setInterval(() => {
    if (searchInput.value.trim() === "") {
      loadUsersForChat();
    }
  }, 3000);

  // Tự động load lời mời kết bạn và cập nhật liên tục (3 giây/lần)
  loadFriendRequests();
  setInterval(loadFriendRequests, 3000);
}

// Tự động load Avatar của mình khi vào web
document.addEventListener("DOMContentLoaded", () => {
  const meString = localStorage.getItem("currentUser");
  if (meString) {
    const me = JSON.parse(meString);

    // Luôn sử dụng ảnh avatar và tên đã đăng ký làm mặc định
    // (Bỏ qua việc ép người dùng chọn lại avatar khi mới đăng nhập)
    const myAvatarImg = document.getElementById("myAvatar");
    if (myAvatarImg) {
      myAvatarImg.src =
        me.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    }
  }

  // --- CÁC SỰ KIỆN TRONG HỘP THOẠI PROFILE ---

  // 1. Hiển thị ảnh xem trước khi chọn
  const setupAvatarInput = document.getElementById("setupAvatarInput");
  const setupAvatarPreview = document.getElementById("setupAvatarPreview");
  if (setupAvatarInput) {
    setupAvatarInput.addEventListener("change", function () {
      const file = this.files[0];
      if (file) setupAvatarPreview.src = URL.createObjectURL(file);
    });
  }

  // 2. Bấm nút Lưu Hồ Sơ
  const saveProfileBtn = document.getElementById("saveProfileBtn");
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", async () => {
      const me = JSON.parse(localStorage.getItem("currentUser"));
      const name = document.getElementById("setupNameInput").value.trim();
      const file = setupAvatarInput.files[0];

      if (!name) {
        const t = window.translations[getLang()];
        saveProfileBtn.innerText = t.please_enter_name;
        setTimeout(() => {
          saveProfileBtn.innerText = t.btn_save_profile;
        }, 2000);
        return;
      }

      const t = window.translations[getLang()];
      saveProfileBtn.innerText = t.saving;
      saveProfileBtn.disabled = true;

      const formData = new FormData();
      formData.append("fullName", name);
      if (file) formData.append("media", file); // Tái sử dụng key "media" để Multer Cloudinary bắt được

      try {
        const res = await fetch(
          `http://${window.location.hostname}:3000/api/users/${me._id || me.userId}`,
          { method: "PUT", body: formData },
        );
        const data = await res.json();
        if (data.success && data.user) {
          me.fullName = data.user.fullName;
          me.avatar = data.user.avatar;
          localStorage.setItem("currentUser", JSON.stringify(me)); // Lưu lại vào máy
          window.location.reload(); // F5 lại web cho ăn hình
        } else {
          // Bật lại nút nếu bị lỗi để người dùng bấm lại
          saveProfileBtn.innerText =
            t.error_try_again + " " + (data.message || "");
          saveProfileBtn.disabled = false;
        }
      } catch (e) {
        console.error("Lỗi cập nhật:", e);
        saveProfileBtn.innerText = t.network_error;
        saveProfileBtn.disabled = false;
      }
    });
  }

  // 4. Bấm nút X để đóng Cài đặt
  const closeProfileModalBtn = document.getElementById("closeProfileModal");
  if (closeProfileModalBtn) {
    closeProfileModalBtn.addEventListener("click", () => {
      document.getElementById("profileSetupModal").style.display = "none";
    });
  }

  // 3. Bấm nút Bỏ qua (Ẩn danh)
  const skipProfileBtn = document.getElementById("skipProfileBtn");
  if (skipProfileBtn) {
    skipProfileBtn.addEventListener("click", async () => {
      const me = JSON.parse(localStorage.getItem("currentUser"));
      const t = window.translations[getLang()];
      skipProfileBtn.innerText = t.processing;
      skipProfileBtn.disabled = true;

      const formData = new FormData();
      formData.append("fullName", window.translations["EN"].anonymous_user); // Luôn lưu mặc định
      formData.append(
        "avatar",
        "https://cdn-icons-png.flaticon.com/512/149/149071.png",
      ); // Ảnh trống tiêu chuẩn

      try {
        const res = await fetch(
          `http://${window.location.hostname}:3000/api/users/${me._id || me.userId}`,
          { method: "PUT", body: formData },
        );
        const data = await res.json();
        if (data.success) {
          me.fullName = data.user.fullName;
          me.avatar = data.user.avatar;
          localStorage.setItem("currentUser", JSON.stringify(me));
          window.location.reload();
        } else {
          skipProfileBtn.innerText = t.error_try_again;
          skipProfileBtn.disabled = false;
        }
      } catch (e) {
        console.error("Lỗi bỏ qua:", e);
        skipProfileBtn.innerText = t.network_error;
        skipProfileBtn.disabled = false;
      }
    });
  }
});

// --- LOGIC HIỂN THỊ MINI PROFILE & XÓA BÀI ---
document.addEventListener("click", async function (e) {
  const popup = document.getElementById("miniProfilePopup");

  // 0. Đóng Dropdown Avatar nếu click ra ngoài
  const dropdownPopup = document.getElementById("userDropdownPopup");
  if (dropdownPopup && dropdownPopup.style.display === "block") {
    if (!dropdownPopup.contains(e.target) && !e.target.closest(".btn-login")) {
      dropdownPopup.style.display = "none";
    }
  }

  // 0.5 Đóng Mini Profile nếu click ra ngoài
  if (popup && popup.style.display === "block") {
    if (!popup.contains(e.target) && !e.target.closest(".profile-trigger")) {
      popup.style.display = "none";
    }
  }

  // 1. Nếu click vào Avatar hoặc Tên bài viết
  if (e.target.closest(".profile-trigger")) {
    const trigger = e.target.closest(".profile-trigger");
    const name = trigger.getAttribute("data-name");
    const avatar = trigger.getAttribute("data-avatar");
    let authorId = trigger.getAttribute("data-id");

    // Nạp dữ liệu vào popup
    document.getElementById("popupName").innerText = name;
    document.getElementById("popupAvatar").src = avatar;

    const meString = localStorage.getItem("currentUser");
    const me = meString ? JSON.parse(meString) : null;
    const myId = me ? me._id || me.userId : null;

    const popupMessageBtn = document.getElementById("popupMessageBtn");
    const popupAddFriendBtn = document.getElementById("popupAddFriendBtn");

    const t = window.translations[getLang()];
    // Đặt lại giao diện mặc định
    if (popupMessageBtn) popupMessageBtn.style.display = "block";
    if (popupAddFriendBtn) {
      popupAddFriendBtn.style.display = "none";
      popupAddFriendBtn.innerText = t.btn_add_friend;
      popupAddFriendBtn.style.background = "#eefdf4";
      popupAddFriendBtn.style.color = "#16a34a";
    }

    // Xác định xem đây có phải là bài viết của chính mình không (Ưu tiên ID, nếu bài cũ không có ID mới xét bằng Tên)
    const isMyPost = authorId ? authorId === myId : name === me.fullName;

    if (myId) {
      if (isMyPost) {
        if (popupMessageBtn) popupMessageBtn.style.display = "none";
      } else {
        // Tìm kiếm thông tin người này để check trạng thái bạn bè
        if (popupAddFriendBtn) {
          fetch(
            `http://${window.location.hostname}:3000/api/users/search-new/${myId}?q=${encodeURIComponent(name)}`,
          )
            .then((res) => res.json())
            .then((data) => {
              if (!data.success || !Array.isArray(data.users)) return; // BẢO VỆ CHỐNG LỖI MẢNG TRỐNG

              // Ưu tiên tìm theo ID trước, nếu không có ID thì tìm theo tên, hoặc lấy người đầu tiên khớp
              let user = data.users.find((u) => authorId && u._id === authorId);
              if (!user) {
                user = data.users.find(
                  (u) =>
                    u.fullName &&
                    u.fullName.toLowerCase() === name.toLowerCase(),
                );
              }
              if (!user && data.users.length > 0) {
                user = data.users[0];
              }

              if (user) {
                authorId = user._id; // Cập nhật ID chuẩn nhất
                popupAddFriendBtn.setAttribute("data-target-id", authorId);

                if (user.status === "friend" || user.status === "received") {
                  popupAddFriendBtn.style.display = "none"; // Ẩn nếu đã là bạn hoặc họ tự gửi cho mình
                } else {
                  popupAddFriendBtn.style.display = "block"; // Hiện nút kết bạn
                  if (user.status === "sent") {
                    popupAddFriendBtn.innerText = t.cancel_request;
                    popupAddFriendBtn.style.background = "#f1f5f9";
                    popupAddFriendBtn.style.color = "#333";
                  } else {
                    popupAddFriendBtn.innerText = t.btn_add_friend;
                    popupAddFriendBtn.style.background = "#eefdf4";
                    popupAddFriendBtn.style.color = "#16a34a";
                  }
                }
              }
            })
            .catch((err) => console.error(err));
        }
      }
    } else {
      if (popupAddFriendBtn) popupAddFriendBtn.style.display = "none";
    }

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
    const avatar = document.getElementById("popupAvatar").src;

    // Tắt bảng popup nhỏ đi
    popup.style.display = "none";

    // Gọi khung chat xanh lá của Dúi hiện lên
    const chatBox = document.getElementById("chatBox");
    if (chatBox) {
      document.getElementById("chatName").innerText = name; // Cập nhật tên
      const chatAvatar = document.getElementById("chatAvatar");
      if (chatAvatar) chatAvatar.src = avatar; // Cập nhật ảnh
      lastMessagesString = ""; // Xóa cache chat
      chatBox.style.display = "flex"; // Khung của bạn xài flex nên dùng 'flex' cho mượt
    }
  }

  // Thêm: Nếu click vào nút Thêm Bạn Bè / Hủy trong bảng Mini Profile
  if (e.target.id === "popupAddFriendBtn") {
    const targetId = e.target.getAttribute("data-target-id");
    if (targetId) {
      window.toggleFriendRequest(targetId, e.target);
    }
  }

  // --- XỬ LÝ HỘP THOẠI XÓA BÀI CUSTOM ---

  // 1. Nếu bấm nút Hủy (✖) màu đỏ
  if (
    e.target.id === "cancelDeleteBtn" ||
    e.target.closest("#cancelDeleteBtn")
  ) {
    document.getElementById("customDeleteConfirm").style.display = "none"; // Giấu hộp đi
  }

  // 2. Nếu bấm nút Xác nhận (✔) màu xanh
  if (
    e.target.id === "confirmDeleteBtn" ||
    e.target.closest("#confirmDeleteBtn")
  ) {
    const btn =
      e.target.id === "confirmDeleteBtn"
        ? e.target
        : e.target.closest("#confirmDeleteBtn");
    // Lấy lại cái ID bài viết mà mình đã lén nhét vào lúc nãy
    const postId = btn.getAttribute("data-id");

    // Tắt cái hộp đi cho gọn
    document.getElementById("customDeleteConfirm").style.display = "none";

    // Chạy lệnh gọi Server xóa bài
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
  }

  // --- XỬ LÝ HỘP THOẠI XÓA BÌNH LUẬN ---

  if (
    e.target.id === "cancelDeleteCommentBtn" ||
    e.target.closest("#cancelDeleteCommentBtn")
  ) {
    document.getElementById("commentDeleteConfirm").style.display = "none";
  }

  if (
    e.target.id === "confirmDeleteCommentBtn" ||
    e.target.closest("#confirmDeleteCommentBtn")
  ) {
    const btn =
      e.target.id === "confirmDeleteCommentBtn"
        ? e.target
        : e.target.closest("#confirmDeleteCommentBtn");
    const postId = btn.getAttribute("data-post-id");
    const commentId = btn.getAttribute("data-comment-id");

    document.getElementById("commentDeleteConfirm").style.display = "none";

    try {
      const meString = localStorage.getItem("currentUser");
      const myUserId = meString
        ? JSON.parse(meString)._id || JSON.parse(meString).userId
        : "ẩn_danh";

      const response = await fetch(
        `${API_URL}/${postId}/comment/${commentId}?userId=${myUserId}`,
        { method: "DELETE" },
      );

      if (response.ok) {
        const updatedComments = await response.json();
        const commentsList = document.querySelector(
          `#comments-${postId} .comments-list`,
        );
        const countSpan = document.querySelector(
          `.btn-comment[data-id="${postId}"] .comment-count`,
        );

        if (commentsList) {
          const isMyPost =
            document.querySelector(`.btn-edit-post[data-id="${postId}"]`) !==
            null;
          commentsList.innerHTML = window.renderCommentsHTML(
            updatedComments,
            postId,
            myUserId,
            isMyPost,
          );
        }
        if (countSpan) countSpan.innerText = updatedComments.length;
      } else {
        const err = await response.json();
        console.error("Lỗi xóa: " + err.message);
      }
    } catch (err) {
      console.error("Lỗi xóa comment:", err);
    }
  }
});

// ══════════════════════════════════════════════════════════
// HIỆU ỨNG SAO PARALLAX – PHIÊN BẢN TỐI ƯU HIỆU NĂNG 60FPS
// ✅ mousemove throttle bằng RAF ticking flag (passive listener)
// ✅ shadowBlur thay createRadialGradient mỗi frame (cực nhanh)
// ✅ Batch vẽ trắng & xanh riêng → giảm context state switches
// ✅ Mật độ giảm /9000, tỉ lệ green star 6%
// ✅ Canvas GPU layer (willChange + alpha context hint)
// ══════════════════════════════════════════════════════════
const initParticles = () => {
  const canvas = document.getElementById("social-canvas");
  if (!canvas) return;

  canvas.style.willChange = "transform"; // Bật GPU composite layer cho canvas

  // alpha: true giữ transparency, willReadFrequently: false tối ưu cho GPU write
  const ctx = canvas.getContext("2d", {
    alpha: true,
    willReadFrequently: false,
  });

  let w,
    h,
    particles = [];

  // ── Mouse: raw data chỉ được ghi, lerp xảy ra trong RAF ──
  let mouse = { x: 0, y: 0 };
  let targetMouse = { x: 0, y: 0 };
  let ticking = false; // RAF throttle flag – chặn mousemove spam

  document.addEventListener(
    "mousemove",
    (e) => {
      // Chỉ lưu số liệu thô, KHÔNG tính toán nặng ở đây
      targetMouse.x = e.clientX / window.innerWidth - 0.5;
      targetMouse.y = e.clientY / window.innerHeight - 0.5;
      // Throttle: nếu đã có frame pending thì không schedule thêm
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
        });
      }
    },
    { passive: true },
  ); // passive: true → browser không chờ preventDefault

  // ── Resize ──
  const resize = () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  };
  window.addEventListener(
    "resize",
    () => {
      resize();
      createParticles();
    },
    { passive: true },
  );
  resize();

  // ── Star class (tối ưu: shadowBlur thay createRadialGradient) ──
  class Star {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * w;
      this.y = initial ? Math.random() * h : -5;
      this.size = Math.random() * 1.6 + 0.3;
      this.baseOp = Math.random() * 0.5 + 0.2;
      this.opacity = this.baseOp;
      this.speedX = (Math.random() - 0.5) * 0.2;
      this.speedY = Math.random() * 0.18 + 0.04;
      this.depth = Math.random() * 0.8 + 0.2;
      this.twPhase = Math.random() * Math.PI * 2;
      this.twSpeed = Math.random() * 0.018 + 0.004;
      this.isGreen = Math.random() < 0.06; // Giảm từ 10% → 6%
    }

    update() {
      // Dùng mouse đã lerp sẵn (không tính lại trong event)
      this.x += this.speedX + mouse.x * 22 * this.depth * 0.008;
      this.y += this.speedY + mouse.y * 14 * this.depth * 0.005;

      // Twinkle (sin wave)
      this.twPhase += this.twSpeed;
      this.opacity = this.baseOp + Math.sin(this.twPhase) * 0.15;
      if (this.opacity < 0.04) this.opacity = 0.04;
      if (this.opacity > 1.0) this.opacity = 1.0;

      // Wrap / reset
      if (this.x < -5) this.x = w + 5;
      if (this.x > w + 5) this.x = -5;
      if (this.y > h + 5) this.reset(false);
    }
  }

  // ── Create stars – mật độ /9000, cap 200 sao ──
  const createParticles = () => {
    particles = [];
    const count = Math.min(Math.floor((w * h) / 9000), 200);
    for (let i = 0; i < count; i++) particles.push(new Star());
  };
  createParticles();

  const TWO_PI = Math.PI * 2;

  // ── Create Offscreen Canvas for Green Star (Blitting) ──
  // Tối ưu siêu tốc độ: Dùng ảnh render sẵn thay vì tạo Blur mỗi frame
  const greenCanvas = document.createElement("canvas");
  greenCanvas.width = 32;
  greenCanvas.height = 32;
  const gCtx = greenCanvas.getContext("2d", { alpha: true });
  const gradient = gCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.1, "rgba(160, 255, 180, 1)");
  gradient.addColorStop(0.4, "rgba(74, 222, 128, 0.4)");
  gradient.addColorStop(1, "rgba(74, 222, 128, 0)");
  gCtx.fillStyle = gradient;
  gCtx.beginPath();
  gCtx.arc(16, 16, 16, 0, TWO_PI);
  gCtx.fill();

  // ── Animation loop – batch draw theo màu để giảm context state switches ──
  const animate = () => {
    requestAnimationFrame(animate);

    // Lerp mouse 1 lần/frame (không trong mousemove handler)
    mouse.x += (targetMouse.x - mouse.x) * 0.07;
    mouse.y += (targetMouse.y - mouse.y) * 0.07;

    ctx.clearRect(0, 0, w, h);

    // Pass 1: Vẽ tất cả sao TRẮNG trước
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.update();
      if (p.isGreen) continue;
      ctx.globalAlpha = p.opacity;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, TWO_PI);
      ctx.fill();
    }

    // Pass 2: Vẽ sao XANH – dùng kỹ thuật Blitting (drawImage) siêu mượt
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (!p.isGreen) continue;
      ctx.globalAlpha = p.opacity;
      const drawSize = p.size * 6;
      ctx.drawImage(
        greenCanvas,
        p.x - drawSize / 2,
        p.y - drawSize / 2,
        drawSize,
        drawSize,
      );
    }

    // Reset context state về mặc định
    ctx.globalAlpha = 1;
  };

  requestAnimationFrame(animate);
};
initParticles();
