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
    // reporter (String) – giữ lại để tương thích ngược với dữ liệu cũ
    reporter: String,

    // reportedBy (Object) – liên kết đầy đủ với tài khoản người dùng
    // Được backend điền vào từ JWT session hoặc frontend gửi kèm
    reportedBy: {
        userId:   { type: String, default: null },   // _id của User document
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

module.exports = mongoose.model('Rescue', rescueSchema);