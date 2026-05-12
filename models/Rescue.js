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
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Rescue', rescueSchema);