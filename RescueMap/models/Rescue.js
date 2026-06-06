const mongoose = require('mongoose');

const rescueSchema = new mongoose.Schema({
    animalName: String,     // Tên loài vật
    status: String,         // 'Đang chờ', 'Đang cứu hộ', 'Đã cứu xong'
    location: {             // Tọa độ để hiển thị lên bản đồ 3D
        lat: Number,
        lng: Number
    },
    address: String,        // Địa chỉ chuỗi
    photo: String,          // Ảnh Base64
    description: String,    // Mô tả chi tiết
    reporter: String,       // Người báo cáo
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Rescue', rescueSchema);