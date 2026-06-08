const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));

const port = process.env.PORT || 3000;

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('🔥 Kết nối MongoDB thành công!'))
    .catch(err => console.error('❌ Lỗi kết nối Database:', err.message));

// Import Models
const Rescue   = require('./Wildlife Guardian/RescueMap/models/Rescue');
const User     = require('./Wildlife Guardian/RescueMap/models/User');

// Nhúng Route Upload xử lý tải ảnh lên Cloudinary
const uploadRoute = require('./upload.route');
app.use('/api/upload', uploadRoute);

// ─────────────────────────────────────────────────────────────
// PROXY: Reverse Geocoding qua Nominatim (tránh CORS ở browser)
// Frontend gọi: GET /api/geocode?lat=...&lng=...&zoom=16
// ─────────────────────────────────────────────────────────────
app.get('/api/geocode', async (req, res) => {
    const { lat, lng, zoom = 16 } = req.query;
    if (!lat || !lng) {
        return res.status(400).json({ error: 'Thiếu tham số lat hoặc lng' });
    }
    try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=${zoom}&accept-language=vi`;
        const response = await fetch(nominatimUrl, {
            headers: {
                'User-Agent': 'WildlifeGuardian/1.0 (admin@example.com) - Educational Project',
                'Accept-Language': 'vi'
            }
        });
        if (!response.ok) {
            return res.status(response.status).json({ error: 'Nominatim trả lỗi: ' + response.status });
        }
        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error('❌ Lỗi proxy geocode:', err.message);
        res.status(500).json({ error: 'Không thể kết nối tới Nominatim' });
    }
});

// Lấy dữ liệu
app.get('/api/rescuemap', async (req, res) => {
    try {
        const rescues = await Rescue.find();
        res.json(rescues);
    } catch (error) {
        res.status(500).json({ error: "Lỗi tải dữ liệu" });
    }
});

// Cất dữ liệu
app.post('/api/rescuemap', async (req, res) => {
    try {
        console.log("📥 Photo nhận được:", req.body.photo
            ? req.body.photo.substring(0, 80) + '...'
            : 'NULL - không có ảnh!');
        const newRescue = new Rescue(req.body);
        const saved = await newRescue.save();
        res.status(201).json({ 
            message: "Đã gửi báo cáo cứu hộ thành công!",
            id: saved._id.toString()  // Trả về ID để frontend có thể patch ảnh ngay nếu cần
        });
    } catch (error) {
        console.error("❌ Lỗi khi lưu vào DB:", error);
        res.status(400).json({ error: "Không thể lưu báo cáo" });
    }
});

// Cập nhật ảnh cho một báo cáo (gọi khi photo chưa được lưu trong POST ban đầu)
app.patch('/api/rescuemap/:id/photo', async (req, res) => {
    try {
        const { photo } = req.body;
        if (!photo) return res.status(400).json({ error: 'Thiếu trường photo' });

        const updated = await Rescue.findByIdAndUpdate(
            req.params.id,
            { $set: { photo: photo } },
            { new: true }
        );

        if (!updated) return res.status(404).json({ error: 'Không tìm thấy báo cáo' });

        console.log(`✅ Đã cập nhật photo cho báo cáo ${req.params.id}:`, photo.substring(0, 60) + '...');
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Lỗi patch photo:', error);
        res.status(500).json({ error: 'Lỗi server khi cập nhật photo' });
    }
});

// Cập nhật address cho một báo cáo (để lưu vĩnh viễn kết quả geocode)
app.patch('/api/rescuemap/:id/address', async (req, res) => {
    try {
        const { address } = req.body;
        if (!address) return res.status(400).json({ error: 'Thiếu trường address' });

        const updated = await Rescue.findByIdAndUpdate(
            req.params.id,
            { $set: { address: address } },
            { new: true }
        );

        if (!updated) return res.status(404).json({ error: 'Không tìm thấy báo cáo' });

        res.json({ success: true });
    } catch (error) {
        console.error('❌ Lỗi patch address:', error);
        res.status(500).json({ error: 'Lỗi server khi cập nhật address' });
    }
});

// Auth Routes
app.post('/api/register', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.status(201).json({ message: "Tạo tài khoản thành công!" });
    } catch (error) {
        res.status(400).json({ error: "Tên đăng nhập đã tồn tại!" });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password });
        if (user) {
            res.json({ success: true, message: "Đăng nhập thành công!" });
        } else {
            res.status(401).json({ success: false, message: "Sai tài khoản hoặc mật khẩu!" });
        }
    } catch (error) {

        res.status(500).json({ success: false, message: "Lỗi Server!" });
    }
});

app.post('/api/forgotpassword', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ username: email });
        if (user) {
            res.json({ success: true, message: "Link khôi phục đã gửi đến " + email });
        } else {
            res.status(404).json({ success: false, message: "Không tìm thấy tài khoản này!" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi Server!" });
    }
});

// Khởi động server
app.listen(port, '0.0.0.0', () => console.log(`🚀 Chạy tại http://127.0.0.1:${port} (Sẵn sàng kết nối)`));