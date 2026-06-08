const mongoose = require('mongoose');

const rescueSchema = new mongoose.Schema({
    animalName: String,     // Tên loài vật
    status: String,         // 'Đang chờ', 'Đang cứu hộ', 'Đã cứu xong'
    location: {             // Tọa độ để hiển thị lên Leaflet
        lat: Number,
        lng: Number
    },
    description: String,    // Mô tả chi tiết
    reporter: String,       // Người báo cáo
    photo: String,          // Sửa Lỗi 1 & 5: Lưu URL ảnh thực tế tải lên từ Cloudinary
    address: String,        // Lưu thêm text địa chỉ (nếu có)
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Rescue', rescueSchema);