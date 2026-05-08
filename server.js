const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config(); // Gọi file .env

const app = express();
const port = process.env.PORT || 3000;

// Lệnh kết nối với MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('🔥 Đã kết nối Database MongoDB thành công cho dự án Wildlife Guardian!');
  })
  .catch((err) => {
    console.error('❌ Lỗi kết nối Database:', err.message);
  });

// Bật máy chủ Node.js
app.listen(port, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${port}`);
});