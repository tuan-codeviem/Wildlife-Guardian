const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.json()); // THIẾU CÁI NÀY LÀ KHÔNG LƯU ĐƯỢC DATA
app.use(express.static('.')); // Để chạy được file HTML/CSS/JS

const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🔥 Kết nối MongoDB thành công!'))
  .catch(err => console.error('❌ Lỗi:', err.message));

const Rescue = require('./models/Rescue');

// API lấy dữ liệu (Dùng cho hàm loadReportsFromDB ở trên)
app.get('/api/rescuemap', async (req, res) => {
    const rescues = await Rescue.find();
    res.json(rescues);
});

// API lưu dữ liệu (Dùng cho sự kiện click map)
app.post('/api/rescuemap', async (req, res) => {
    try {
        const newRescue = new Rescue(req.body);
        await newRescue.save();
        res.status(201).send({ message: "Đã gửi báo cáo cứu hộ thành công!" });
    } catch (error) {
        res.status(400).send({ error: "Không thể lưu báo cáo" });
    }
});

app.listen(port, () => console.log(`🚀 Chạy tại http://localhost:${port}`));
const User = require('./models/User');

// API Đăng ký (Dùng để tạo tài khoản mới vào CSDL)
app.post('/api/register', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.status(201).send({ message: "Tạo tài khoản thành công!" });
    } catch (error) {
        res.status(400).send({ error: "Tên đăng nhập đã tồn tại!" });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    console.log("Đang đăng nhập với:", username, password); // Log này sẽ hiện ở terminal Node.js

    const user = await User.findOne({ username, password });
    console.log("Kết quả tìm kiếm user:", user); 

    if (user) {
        res.json({ success: true, message: "Đăng nhập thành công!" });
    } else {
        res.status(401).json({ success: false, message: "Sai tài khoản hoặc mật khẩu!" });
    }
});
// Thêm vào file server.js hiện tại của bạn
app.post('/api/forgotpassword', async (req, res) => {
    const { email } = req.body;
    try {
        // Tìm trong database, trường 'username' lưu email như ảnh bạn chụp
        const user = await User.findOne({ username: email });

        if (user) {
            // Giả lập gửi mail thành công
            res.json({ success: true, message: "Link khôi phục đã gửi đến " + email });
        } else {
            res.status(404).json({ success: false, message: "Không tìm thấy tài khoản này!" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi Server!" });
    }
});
