const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors"); 
const multer = require("multer");
const path = require("path");
require("dotenv").config(); 

// ==========================================
// 1. KHỞI TẠO APP & CẤU HÌNH MIDDLEWARE
// ==========================================
const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // Bắt buộc phải có để Frontend và Backend nói chuyện được với nhau
app.use(express.json()); // Giúp server đọc được dữ liệu dạng chữ
app.use(express.static('.')); // Để chạy được file HTML/CSS/JS
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Cho phép lấy ảnh từ thư mục uploads

// ==========================================
// 2. KẾT NỐI MONGODB 
// ==========================================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("🔥 Đã kết nối Database MongoDB thành công cho dự án Wildlife Guardian!");
  })
  .catch((err) => {
    console.error("❌ Lỗi kết nối Database:", err.message);
  });

// ==========================================
// 3. KHỞI TẠO CÁC MODEL DATABASE
// ==========================================
const Post = require("./models/Post");
const Rescue = require('./models/Rescue');

// Model Tin Nhắn (Message)
const messageSchema = new mongoose.Schema({
  sender: String, 
  receiver: String, 
  text: String, 
  timestamp: { type: Date, default: Date.now },
});
const Message = mongoose.model("Message", messageSchema);

// Model Người Dùng (User)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: String,
  avatar: String,
  username: String // Thêm để tương thích với code của nhánh Bảo
});
// Dùng dòng này để tránh lỗi đè model nếu file ./models/User.js cũng đang tồn tại
const User = mongoose.models.User || mongoose.model("User", userSchema);

// ==========================================
// 4. CẤU HÌNH MULTER (Trợ lý nhận file)
// ==========================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// ==========================================
// 5. CÁC API BÀI VIẾT (POSTS)
// ==========================================

// Tải bài viết
app.get("/api/posts", async (req, res) => {
  try {
    const { category } = req.query; 
    let filter = {};
    if (category && category.toLowerCase() !== "all posts") {
      filter = { category: new RegExp(category, "i") };
    }
    const posts = await Post.find(filter).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tải bài viết!" });
  }
});

// Đăng bài viết mới
app.post("/api/posts", upload.single("media"), async (req, res) => {
  try {
    const newPost = new Post({
      content: req.body.content,
      category: req.body.category,
      authorName: req.body.authorName || "Người dùng ẩn danh",
      authorAvatar: req.body.authorAvatar || "https://i.pravatar.cc/150?img=11",
      media_url: req.file ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}` : null,
    });
    await newPost.save(); 
    res.status(201).json(newPost); 
  } catch (error) {
    res.status(500).json({ message: "Lỗi không đăng được bài" });
  }
});

// Thả tim bài viết
app.put("/api/posts/:id/like", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const myUserId = "user_hacker_001";
    const hasLiked = post.likes.includes(myUserId);

    if (hasLiked) {
      post.likes = post.likes.filter((id) => id !== myUserId);
    } else {
      post.likes.push(myUserId);
    }
    await post.save();
    res.json({ likesCount: post.likes.length, isLiked: !hasLiked });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống thả tim!" });
  }
});

// Bình luận bài viết
app.post("/api/posts/:id/comment", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const newComment = {
      user: "Người dùng Wildlife", 
      text: req.body.text, 
    };
    post.comments.push(newComment);
    await post.save();
    res.json(post.comments);
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống bình luận!" });
  }
});

// Xóa bài viết
app.delete("/api/posts/:id", async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa bài viết thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa bài!" });
  }
});

// ==========================================
// 6. CÁC API TIN NHẮN CHAT (MESSENGER)
// ==========================================

// Lấy lịch sử chat giữa 2 người
app.get("/api/messages/:user1/:user2", async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    }).sort({ timestamp: 1, createdAt: 1 }); // Sắp xếp cũ -> mới
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi tải tin nhắn!" });
  }
});

// Gửi tin nhắn
app.post("/api/messages", async (req, res) => {
  try {
    const { sender, receiver, text } = req.body;
    const newMessage = new Message({ sender: sender || "me", receiver, text });
    await newMessage.save();
    res.json({ success: true, message: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi lưu tin nhắn!" });
  }
});

// ==========================================
// 7. CÁC API TÀI KHOẢN (ĐĂNG KÝ / ĐĂNG NHẬP)
// ==========================================

// Đăng ký
app.post("/api/register", async (req, res) => {
  try {
    const { email, password, fullName, username } = req.body;
    const existUser = await User.findOne({ $or: [{ email: email }, { username: username }] });
    
    if (existUser) return res.status(400).json({ success: false, message: "Email hoặc tài khoản đã tồn tại!" });

    const newUser = new User({
      email: email || username, // Hỗ trợ cả form cũ và mới
      username: username || email,
      password: password,
      fullName: fullName || (email ? email.split("@")[0] : username), 
      avatar: "https://i.pravatar.cc/150?u=" + (email || username), 
    });
    await newUser.save();
    res.status(201).json({ success: true, message: "Đăng ký thành công!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Đăng nhập
app.post("/api/login", async (req, res) => {
  try {
    const { email, username, password } = req.body;
    // Tìm bằng email hoặc username đều được
    const loginIdentifier = email || username; 
    const user = await User.findOne({ 
      $or: [{ email: loginIdentifier }, { username: loginIdentifier }], 
      password: password 
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "Sai tài khoản hoặc mật khẩu!" });
    }

    res.json({
      success: true,
      message: "Đăng nhập thành công!",
      user: {
        userId: user._id,
        fullName: user.fullName,
        avatar: user.avatar,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Tìm kiếm người dùng
app.get("/api/users", async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    const users = await User.find({
      fullName: { $regex: searchQuery, $options: "i" },
    }).select("_id fullName avatar"); 
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi tìm người!" });
  }
});

// Quên mật khẩu
app.post('/api/forgotpassword', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ $or: [{ email: email }, { username: email }] });
    if (user) {
      res.json({ success: true, message: "Link khôi phục đã gửi đến " + email });
    } else {
      res.status(404).json({ success: false, message: "Không tìm thấy tài khoản này!" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi Server!" });
  }
});

// ==========================================
// 8. CÁC API BẢN ĐỒ CỨU HỘ (RESCUE MAP)
// ==========================================

app.get('/api/rescuemap', async (req, res) => {
  try {
    const rescues = await Rescue.find();
    res.json(rescues);
  } catch (error) {
    res.status(500).json({ error: "Lỗi tải dữ liệu bản đồ" });
  }
});

app.post('/api/rescuemap', async (req, res) => {
  try {
    const newRescue = new Rescue(req.body);
    await newRescue.save();
    res.status(201).send({ message: "Đã gửi báo cáo cứu hộ thành công!" });
  } catch (error) {
    res.status(400).send({ error: "Không thể lưu báo cáo" });
  }
});

// ==========================================
// 9. BẬT MÁY CHỦ
// ==========================================
app.listen(port, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${port}`);
});