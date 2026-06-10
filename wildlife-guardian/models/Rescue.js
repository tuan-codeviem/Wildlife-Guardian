const mongoose = require('mongoose');

const rescueSchema = new mongoose.Schema({
    animalName: String,     // Tên loài vật
    status: String,         // 'Đang chờ', 'Đang cứu hộ', 'Đã cứu xong'
    location: {             // Tọa độ để hiển thị lên Leaflet
        lat: Number,
        lng: Number
    },
    address: String,        // Địa chỉ văn bản
    photo: String,          // URL ảnh
    description: String,    // Mô tả chi tiết
    reporter: String,       // Người báo cáo (tên)
    reportedBy: {           // Thông tin chi tiết người báo cáo
        userId: String,
        fullName: String,
        email: String,
        avatar: String
    },
    date: String,           // Ngày giờ báo cáo
    phone: String,          // Số điện thoại
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Rescue', rescueSchema);