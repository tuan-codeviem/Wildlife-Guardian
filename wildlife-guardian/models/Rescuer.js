const mongoose = require('mongoose');

/**
 * Schema Người cứu trợ (Rescuer) với GeoJSON Point cho Geospatial queries
 * Hỗ trợ truy vấn không gian trong bán kính 5 mét ($nearSphere hoặc $geoWithin)
 */
const rescuerSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    avatar: { type: String, default: "https://cdn-icons-png.flaticon.com/512/149/149071.png" },
    status: {
        type: String,
        enum: ['active', 'busy', 'offline'],
        default: 'active'
    },
    // GeoJSON Point format - BẮT BUỘC để index 2dsphere hoạt động chính xác trong MongoDB
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [Kinh độ (Longitude), Vĩ độ (Latitude)] - Lưu ý thứ tự Lng trước, Lat sau!
            required: true
        }
    },
    lastActiveAt: { type: Date, default: Date.now }
});

// Tạo chỉ mục không gian 2dsphere để tối ưu hóa truy vấn tọa độ
rescuerSchema.index({ location: '2dsphere' });

module.exports = mongoose.models.Rescuer || mongoose.model('Rescuer', rescuerSchema);
