const multer = require('multer');

// Sử dụng memoryStorage để lưu file tạm thời dưới dạng Buffer trong RAM
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

module.exports = upload;