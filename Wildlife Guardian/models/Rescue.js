const mongoose = require('mongoose');

const rescueSchema = new mongoose.Schema({
    animalName:  String,          // Tên loài vật
    status:      String,          // 'emergency' | 'progress' | 'rescued'
    location: {                   // Tọa độ GPS
        lat: Number,
        lng: Number
    },
    description: String,          // Mô tả chi tiết
    phone:       String,          // SĐT liên hệ

    // ── Người đăng báo cáo ─────────────────────────────────────────────
    reporter: String,             // Tương thích ngược (tên người dùng dạng String)
    reportedBy: {                 // Liên kết đầy đủ với tài khoản người dùng
        userId:   { type: String, default: null },
        fullName: { type: String, default: 'Khách' },
        email:    { type: String, default: '' },
        avatar:   { type: String, default: '' }
    },
    // ────────────────────────────────────────────────────────────────────

    photo:     String,            // URL ảnh Cloudinary hoặc Base64 fallback
    address:   String,            // Địa chỉ text (reverse geocode)
    date:      String,            // Chuỗi ngày giờ hiển thị (vi-VN)
    createdAt: { type: Date, default: Date.now }
});

// Dùng mẫu này để tránh lỗi đè model khi require nhiều lần
module.exports = mongoose.models.Rescue || mongoose.model('Rescue', rescueSchema);