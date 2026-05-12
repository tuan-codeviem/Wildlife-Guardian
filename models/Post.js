const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  content: String,
  category: String,
  media_url: String, // Ngăn này để lưu link ảnh/video nè Dúi
  likes: { type: [String], default: [] }, // THÊM DÒNG NÀY ĐỂ LƯU TIM
  comments: [
    {
      user: String,
      text: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Post", postSchema);
