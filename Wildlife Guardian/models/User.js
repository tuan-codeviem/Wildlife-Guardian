const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    avatar: { type: String, default: "https://cdn-icons-png.flaticon.com/512/149/149071.png" },
    username: String, // Thêm để tương thích với code của nhánh Bảo
    friends: { type: [String], default: [] }, // Danh sách ID bạn bè
    friendRequests: { type: [String], default: [] }, // Danh sách ID người gửi lời mời
    unlockedSpecies: { type: [String], default: [] }, // Danh sách tên con vật đã mở khóa
    createdAt: { type: Date, default: Date.now },
});

// Dùng mẫu này để tránh lỗi đè model trong Next.js hoặc khi require nhiều lần
module.exports = mongoose.models.User || mongoose.model("User", userSchema);
