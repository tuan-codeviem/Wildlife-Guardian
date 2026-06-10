# Hướng dẫn Backend: Tích hợp "Người đăng" (reportedBy) vào Route POST /api/rescuemap

## Tổng quan luồng dữ liệu

```
[Frontend] → gửi reportedBy từ localStorage
     ↓
[Backend Route POST /api/rescuemap] → xác thực JWT token (nếu có)
     ↓
[Mongoose] → lưu reportedBy vào Rescue document
     ↓
[Frontend GET /api/rescuemap] → hiển thị "Người đăng" trên card
```

---

## Phương án 1: Đơn giản (Frontend gửi reportedBy, Backend tin tưởng)

Phù hợp cho môi trường **development** hoặc khi chưa có JWT:

```js
// server.js hoặc routes/rescue.js
app.post('/api/rescuemap', async (req, res) => {
  try {
    const {
      animalName, status, location, description,
      phone, address, date, photo,
      reportedBy  // ← Frontend gửi kèm từ localStorage
    } = req.body;

    const rescue = new Rescue({
      animalName,
      status,
      location,
      description,
      phone,
      address,
      date,
      photo,
      // Lưu reportedBy từ frontend
      reportedBy: {
        userId:   reportedBy?.userId   || null,
        fullName: reportedBy?.fullName || 'Khách',
        email:    reportedBy?.email    || '',
        avatar:   reportedBy?.avatar   || ''
      },
      // Đồng thời lưu reporter String để tương thích ngược
      reporter: reportedBy?.fullName || 'Khách'
    });

    const saved = await rescue.save();
    res.json({ success: true, id: saved._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

---

## Phương án 2: Bảo mật hơn (JWT Middleware xác thực)

Phù hợp cho **production** – Backend tự lấy thông tin user từ token, không tin tưởng frontend:

### Bước 1: Tạo file middleware/auth.js

```js
// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'wildlife_guardian_secret_2024';

/**
 * Middleware xác thực JWT.
 * Nếu có token hợp lệ → gán req.user = { userId, fullName, email, avatar }
 * Nếu không có token → req.user = null (không block request)
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Lấy thông tin mới nhất từ DB (tránh dùng data cũ trong token)
    const user = await User.findById(decoded.userId).select('fullName email avatar username');
    if (!user) {
      req.user = null;
      return next();
    }

    req.user = {
      userId:   user._id.toString(),
      fullName: user.fullName || user.username || 'Người dùng',
      email:    user.email,
      avatar:   user.avatar || ''
    };
    next();
  } catch (err) {
    // Token hết hạn hoặc không hợp lệ → coi như khách
    req.user = null;
    next();
  }
}

module.exports = { optionalAuth };
```

### Bước 2: Áp dụng middleware vào route

```js
// server.js hoặc routes/rescue.js
const { optionalAuth } = require('./middleware/auth');

app.post('/api/rescuemap', optionalAuth, async (req, res) => {
  try {
    const {
      animalName, status, location, description,
      phone, address, date, photo,
      reportedBy: clientReportedBy  // Frontend vẫn gửi kèm làm fallback
    } = req.body;

    // Ưu tiên dùng req.user (từ JWT đã xác thực), fallback sang frontend data
    const resolvedUser = req.user || clientReportedBy || { fullName: 'Khách' };

    const rescue = new Rescue({
      animalName,
      status,
      location,
      description,
      phone,
      address,
      date,
      photo,
      reportedBy: {
        userId:   resolvedUser.userId   || null,
        fullName: resolvedUser.fullName || 'Khách',
        email:    resolvedUser.email    || '',
        avatar:   resolvedUser.avatar   || ''
      },
      reporter: resolvedUser.fullName || 'Khách'
    });

    const saved = await rescue.save();
    res.json({ success: true, id: saved._id });
  } catch (err) {
    console.error('❌ Lỗi lưu rescue report:', err);
    res.status(500).json({ error: err.message });
  }
});
```

### Bước 3: Frontend gửi kèm token khi submit

```js
// Trong submitReport() của script1.js – thêm Authorization header
const token = localStorage.getItem('authToken'); // hoặc key bạn dùng để lưu JWT

const response = await fetch(getApiUrl('/api/rescuemap'), {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  },
  body: JSON.stringify(payload)
});
```

---

## Route GET – Đảm bảo trả về reportedBy

```js
app.get('/api/rescuemap', async (req, res) => {
  try {
    // .lean() trả về plain JS object, nhanh hơn Mongoose document
    const rescues = await Rescue.find().sort({ createdAt: -1 }).lean();
    res.json(rescues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

---

## Tóm tắt key trong localStorage (Frontend)

| Key | Giá trị | Dùng để |
|-----|---------|---------|
| `currentUser` | JSON object `{ _id, fullName, email, avatar }` | Hiển thị "Người đăng" trong form |
| `isLoggedIn` | `"true"` | Check trạng thái đăng nhập |
| `username` | String | Tương thích với code cũ |
| `authToken` | JWT string | Gửi lên backend để xác thực (nếu dùng Phương án 2) |
