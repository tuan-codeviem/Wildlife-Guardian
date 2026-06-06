const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary'); 
const upload = require('../middlewares/upload');    

// Bắt POST request tại endpoint /api/upload
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không tìm thấy file nào được gửi lên!' });
    }

    // Chuyển file buffer sang chuỗi Base64
    const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Upload lên Cloudinary
    const result = await cloudinary.uploader.upload(fileBase64, {
      folder: 'wildlife_guardian_uploads', // Tự động tạo thư mục này trên Cloudinary của bạn
    });

    res.status(200).json({
      message: 'Upload ảnh thành công!',
      url: result.secure_url,
      public_id: result.public_id
    });

  } catch (error) {
    console.error('Lỗi khi upload Cloudinary:', error);
    res.status(500).json({ error: 'Lỗi server khi upload ảnh.' });
  }
});

module.exports = router; 