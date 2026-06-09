// QUẢN LÝ NGÔN NGỮ (EN / VI)
// ==========================================
const translations = {
  EN: {
    nav_home: "Home",
    nav_rescue: "Rescue Map",
    nav_social: "Social",
    nav_species: "Species Library",
    nav_game: "Game",
    nav_contact: "Contact Us",
    btn_report: "🚨 Report Now",
    btn_login: "→ Log in",
    post_placeholder: "Share something with the community...",
    btn_photo: " Photo",
    cat_story: "Story",
    cat_adoption: "Adoption",
    cat_donations: "Donations",
    cat_orgs: "Organizations",
    btn_post: "Post",
    filter_all: "All Posts",
    filter_adoption: "Adoption",
    filter_donations: "Donations",
    filter_orgs: "Organizations",
    filter_stories: "Stories",
    title_friends: "Friends",
    search_friends_placeholder: "Enter a name to find friends...",
    title_requests: "Requests",
    no_invitations: "No invitations",
    title_messages: "Messages",
    search_messages_placeholder: "Search friends...",
    btn_message: "Message",
    btn_add_friend: "Add friend",
    btn_settings: " Settings",
    btn_logout: " Log out",
    del_post_title: "Delete post?",
    del_post_desc: "Are you sure you want to delete this post?",
    btn_delete: "Delete",
    btn_cancel: "Cancel",
    del_comment_title: "Delete comment?",
    del_comment_desc: "Are you sure you want to delete this comment?",
    edit_post_title: "Edit post",
    btn_change_media: " Change media",
    btn_save_changes: "Save changes",
    update_profile_title: "Update profile",
    update_profile_desc: "Choose an avatar and display name to get started!",
    name_placeholder: "Your display name...",
    btn_save_profile: "Save Profile",
    btn_skip: "Skip (Anonymous)",
    view_replies: "View replies",
    hide_replies: "Hide replies",
    anonymous_user: "Anonymous user",
    write_comment: "Write a comment...",
    attach_image: " Attach image",
    btn_send: "Send",
    saving: "Saving...",
    cancel_request: "Cancel request",
    no_friend_requests: "No friend requests",
    click_to_message: "Click to message...",
    please_enter_name: "Please enter a name!",
    error_try_again: "Error! Please try again",
    network_error: "Network error! Try again",
    processing: "Processing...",
    search_to_start: "Let's search to start a conversation!",
    like: "Like",
    likes: "Likes",
    reply: "Reply",
    tooltip_edit_post: "Edit post",
    tooltip_delete_post: "Delete post",
    tooltip_delete_comment: "Delete comment",
    profile_settings_title: "Profile settings",
    profile_settings_desc: "Change your name and avatar.",
  },
  VI: {
    nav_home: "Trang chủ",
    nav_rescue: "Bản đồ cứu hộ",
    nav_social: "Cộng đồng",
    nav_species: "Thư viện loài",
    nav_game: "Trò chơi",
    nav_contact: "Liên hệ",
    btn_report: "🚨 Báo cáo",
    btn_login: "→ Đăng nhập",
    post_placeholder: "Chia sẻ điều gì đó với cộng đồng...",
    btn_photo: " Ảnh",
    cat_story: "Câu chuyện",
    cat_adoption: "Nhận nuôi",
    cat_donations: "Quyên góp",
    cat_orgs: "Tổ chức",
    btn_post: "Đăng",
    filter_all: "Tất cả",
    filter_adoption: "Nhận nuôi",
    filter_donations: "Quyên góp",
    filter_orgs: "Tổ chức",
    filter_stories: "Câu chuyện",
    title_friends: "Bạn bè",
    search_friends_placeholder: "Nhập tên để tìm bạn...",
    title_requests: "Lời mời",
    no_invitations: "Không có lời mời",
    title_messages: "Tin nhắn",
    search_messages_placeholder: "Tìm kiếm bạn bè...",
    btn_message: "Nhắn tin",
    btn_add_friend: "Thêm bạn bè",
    btn_settings: " Cài đặt",
    btn_logout: " Đăng xuất",
    del_post_title: "Xóa bài viết?",
    del_post_desc: "Bạn có chắc chắn muốn xóa bài viết này không?",
    btn_delete: "Xóa",
    btn_cancel: "Hủy",
    del_comment_title: "Xóa bình luận?",
    del_comment_desc: "Bạn có chắc chắn muốn xóa bình luận này không?",
    edit_post_title: "Chỉnh sửa bài viết",
    btn_change_media: " Đổi ảnh/video",
    btn_save_changes: "Lưu thay đổi",
    update_profile_title: "Cập nhật hồ sơ",
    update_profile_desc:
      "Hãy chọn ảnh đại diện và tên hiển thị để bắt đầu nhé!",
    name_placeholder: "Tên hiển thị của bạn...",
    btn_save_profile: "Lưu hồ sơ",
    btn_skip: "Để sau (Ẩn danh)",
    view_replies: "Xem câu trả lời",
    hide_replies: "Ẩn câu trả lời",
    anonymous_user: "Người dùng ẩn danh",
    write_comment: "Viết bình luận...",
    attach_image: " Đính kèm ảnh",
    btn_send: "Gửi",
    saving: "Đang lưu...",
    cancel_request: "Hủy lời mời",
    no_friend_requests: "Chưa có lời mời",
    click_to_message: "Bấm để nhắn tin...",
    please_enter_name: "Vui lòng nhập tên!",
    error_try_again: "Lỗi! Vui lòng thử lại",
    network_error: "Lỗi mạng! Thử lại",
    processing: "Đang xử lý...",
    search_to_start: "Hãy tìm kiếm để bắt đầu cuộc trò chuyện!",
    like: "Thích",
    likes: "Thích",
    reply: "Trả lời",
    tooltip_edit_post: "Sửa bài viết",
    tooltip_delete_post: "Xóa bài viết",
    tooltip_delete_comment: "Xóa bình luận",
    profile_settings_title: "Cài đặt hồ sơ",
    profile_settings_desc: "Thay đổi tên và ảnh đại diện của bạn.",
  },
};
window.translations = translations;

let currentLang = localStorage.getItem("appLang") || "EN";
window.currentLang = currentLang;

function applyLanguage() {
  const t = translations[currentLang];
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (t[key]) {
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.setAttribute("placeholder", t[key]);
      } else {
        if (el.children.length === 0) {
          el.textContent = t[key];
        } else {
          for (let node of el.childNodes) {
            if (node.nodeType === 3 && node.nodeValue.trim().length > 0) {
              node.nodeValue = t[key];
              break;
            }
          }
        }
      }
    }
  });

  if (typeof loadPosts === "function") {
    const activeBtn = document.querySelector(".filter-btn.active");
    if (activeBtn) {
        loadPosts(activeBtn.getAttribute("data-category") || "all posts");
    }
  }

  if (typeof loadFriendRequests === "function") loadFriendRequests();
  if (typeof loadUsersForChat === "function") {
    const searchEl = document.getElementById("searchUser");
    loadUsersForChat(searchEl ? searchEl.value : "");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const langToggleBtns = document.querySelectorAll(".lang-toggle-btn");
  const langTexts = document.querySelectorAll(".lang-text");

  // Nạp ngôn ngữ vào lúc mới khởi động trang
  langTexts.forEach((span) => (span.innerText = currentLang));
  applyLanguage();

  langToggleBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentLang = currentLang === "EN" ? "VI" : "EN";
      window.currentLang = currentLang;
      localStorage.setItem("appLang", currentLang); // Lưu vào bộ nhớ máy để dùng cho tính năng đa ngôn ngữ
      langTexts.forEach((span) => (span.innerText = currentLang));
      applyLanguage();

      langToggleBtns.forEach((b) => {
        let currentRotation = parseInt(b.getAttribute("data-rotation") || "0");
        let newRotation = currentRotation + 180; // Xoay thêm nửa vòng 180 độ
        b.style.transform = `rotate(${newRotation}deg)`;
        b.setAttribute("data-rotation", newRotation);
      });
    });
  });
});
