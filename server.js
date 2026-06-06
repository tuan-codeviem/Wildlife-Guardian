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
const Feedback = require('./Wildlife Guardian/RescueMap/models/Feedback');

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
        const newRescue = new Rescue(req.body);
        await newRescue.save();
        res.status(201).json({ message: "Đã gửi báo cáo cứu hộ thành công!" });
    } catch (error) {
        console.error("❌ Lỗi khi lưu vào DB:", error);
        res.status(400).json({ error: "Không thể lưu báo cáo" });
    }
});

// ════════════════════════════════════════════════
// FEEDBACK ROUTES
// ════════════════════════════════════════════════

// Gửi phản hồi mới
app.post('/api/feedback', async (req, res) => {
    try {
        const { name, email, location, type, content, rating } = req.body;
        if (!name || !content) {
            return res.status(400).json({ error: 'Tên và nội dung là bắt buộc!' });
        }
        if (content.length < 10) {
            return res.status(400).json({ error: 'Nội dung quá ngắn (tối thiểu 10 ký tự)!' });
        }
        const newFeedback = new Feedback({ name, email, location, type, content, rating: rating || 0 });
        await newFeedback.save();
        console.log(`💬 Phản hồi mới từ "${name}": ${type} | ⭐ ${rating || 0}/5`);
        res.status(201).json({ success: true, message: 'Phản hồi đã được ghi nhận thành công!' });
    } catch (error) {
        console.error('❌ Lỗi khi lưu phản hồi:', error);
        res.status(500).json({ error: 'Không thể lưu phản hồi. Vui lòng thử lại!' });
    }
});

// Lấy danh sách phản hồi (dùng cho admin)
app.get('/api/feedback', async (req, res) => {
    try {
        const feedbacks = await Feedback.find().sort({ createdAt: -1 }).limit(100);
        res.json(feedbacks);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi tải danh sách phản hồi' });
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