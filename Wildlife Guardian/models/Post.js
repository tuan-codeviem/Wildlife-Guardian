const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  content: String,
  category: String,
  media_url: String, // Ngăn này để lưu link ảnh/video nè Dúi
  authorName: String,
  authorAvatar: String,
  authorId: String, // Lưu ID người đăng để phân quyền xóa/sửa bài
  likes: { type: [String], default: [] }, // THÊM DÒNG NÀY ĐỂ LƯU TIM
  comments: [
    {
      userId: String, // Thêm ID để biết ai là chủ comment
      user: String,
      userAvatar: String, // Thêm avatar người bình luận
      text: String,
      media_url: String, // Thêm ảnh cho comment
      likes: { type: [String], default: [] }, // Lưu danh sách thả tim của bình luận
      replyTo: { type: String, default: null }, // Lưu ID của bình luận cha
      replyToUser: { type: String, default: null }, // Lưu tên người được nhắc tới
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Post", postSchema);
