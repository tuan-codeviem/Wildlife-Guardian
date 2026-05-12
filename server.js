const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors"); // Bắt buộc phải có để Frontend và Backend nói chuyện được với nhau
const multer = require("multer");
const path = require("path");
require("dotenv").config(); // Gọi file .env

// KẾT NỐI VỚI CÁI NGĂN CHỨA TRONG MONGODB
const Post = require("./models/Post");
// MODEL TIN NHẮN (MESSAGE) - Khởi tạo ngay trong server.js cho nhanh
const messageSchema = new mongoose.Schema({
  sender: String, // Người gửi
  receiver: String, // Người nhận
  text: String, // Nội dung
  timestamp: { type: Date, default: Date.now },
});
const Message = mongoose.model("Message", messageSchema);
// MODEL NGƯỜI DÙNG (USER)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: String,
  avatar: String,
});
const User = mongoose.model("User", userSchema);
const app = express();
const port = process.env.PORT || 3000;

// ==========================================
// 1. CẤU HÌNH MIDDLEWARE (Người trung gian)
// ==========================================
app.use(cors());
app.use(express.json()); // Giúp server đọc được dữ liệu dạng chữ

// Mở cửa sổ cho thư mục 'uploads' để Frontend lấy ảnh ra xem được
app.use("/uploads", express.static("uploads"));

// ==========================================
// 2. KẾT NỐI MONGODB (Trái tim hệ thống của bạn)
// ==========================================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(
      "🔥 Đã kết nối Database MongoDB thành công cho dự án Wildlife Guardian!",
    );
  })
  .catch((err) => {
    console.error("❌ Lỗi kết nối Database:", err.message);
  });

// ==========================================
// 3. CẤU HÌNH MULTER (Trợ lý nhận file)
// ==========================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ném ảnh vào thư mục uploads
  },
  filename: (req, file, cb) => {
    // Đổi tên ảnh thành thời gian hiện tại để không bị trùng tên
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// ==========================================
// 4. CÁC ĐƯỜNG ỐNG API
// ==========================================

// API 1: Tải bài viết (Có hỗ trợ lọc theo Category)
app.get("/api/posts", async (req, res) => {
  try {
    const { category } = req.query; // Lấy cái tên thể loại từ đường link (nếu có)
    let filter = {};

    // Nếu người dùng chọn lọc (khác "all"), thì tạo bộ lọc cho MongoDB
    if (category && category.toLowerCase() !== "all posts") {
      filter = { category: new RegExp(category, "i") };
    }

    const posts = await Post.find(filter).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tải bài viết!" });
  }
});

// API 2: Đăng bài viết mới (Có kèm ảnh)
app.post("/api/posts", upload.single("media"), async (req, res) => {
  try {
    const newPost = new Post({
      content: req.body.content,
      category: req.body.category,
      // Nếu có up ảnh thì lưu đường dẫn, không thì để trống
      media_url: req.file
        ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
        : null,
    });

    await newPost.save(); // Lưu vào Database
    res.status(201).json(newPost); // Trả về cho Frontend biết là thành công
  } catch (error) {
    console.error("Lỗi đăng bài:", error);
    res.status(500).json({ message: "Lỗi không đăng được bài" });
  }
});

// ==========================================
// API 3: THẢ TIM BÀI VIẾT (LIKE / UNLIKE)
// ==========================================
app.put("/api/posts/:id/like", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Giả lập ID của bạn
    const myUserId = "user_hacker_001";

    // Kiểm tra xem ID của bạn đã có trong mảng thả tim chưa
    const hasLiked = post.likes.includes(myUserId);

    if (hasLiked) {
      // ĐÃ THẢ TIM RỒI -> Bấm thêm phát nữa là RÚT TIM LẠI
      post.likes = post.likes.filter((id) => id !== myUserId);
    } else {
      // CHƯA THẢ TIM -> BƠM ID VÀO MẢNG
      post.likes.push(myUserId);
    }

    // Lưu lại vào Database
    await post.save();

    // Trả kết quả về cho Frontend
    res.json({ likesCount: post.likes.length, isLiked: !hasLiked });
  } catch (error) {
    console.error("Lỗi thả tim:", error);
    res.status(500).json({ message: "Lỗi hệ thống thả tim!" });
  }
});

// ==========================================
// API 4: BÌNH LUẬN BÀI VIẾT (COMMENT)
// ==========================================
app.post("/api/posts/:id/comment", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Tạo một gói bình luận mới
    const newComment = {
      user: "Người dùng Wildlife", // Giả lập tên của bạn
      text: req.body.text, // Đoạn chữ mà Frontend sẽ gửi lên
    };

    // Nhét bình luận vào mảng comments của bài viết
    post.comments.push(newComment);

    // Lưu lại vào Database
    await post.save();

    // Trả kết quả (danh sách bình luận mới nhất) về cho Frontend
    res.json(post.comments);
  } catch (error) {
    console.error("Lỗi bình luận:", error);
    res.status(500).json({ message: "Lỗi hệ thống bình luận!" });
  }
});

// ==========================================
// API 5: XÓA BÀI VIẾT
// ==========================================
app.delete("/api/posts/:id", async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa bài viết thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa bài!" });
  }
});

// =================== API MESSENGER ===================

// 1. API Lấy tin nhắn giữa 2 người
app.get("/api/messages/:chatId", async (req, res) => {
  try {
    const myId = "me"; // Tạm thời mặc định mình là "me"
    const partnerId = req.params.chatId;

    // Tìm tất cả tin nhắn giữa mình và người kia
    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: partnerId },
        { sender: partnerId, receiver: myId },
      ],
    }).sort("timestamp");

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Lỗi lấy tin nhắn" });
  }
});

// 2. API Gửi tin nhắn mới
app.post("/api/messages", async (req, res) => {
  try {
    const newMessage = new Message({
      sender: req.body.sender || "me",
      receiver: req.body.receiver,
      text: req.body.text,
    });
    await newMessage.save();
    res.json(newMessage);
  } catch (error) {
    res.status(500).json({ error: "Lỗi gửi tin nhắn" });
  }
});

// =================== API LOGIN & REGISTER ===================

// 1. API Đăng Ký (Tạo tài khoản)
app.post("/api/register", async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Kiểm tra xem email đã có ai xài chưa
    const existUser = await User.findOne({ email });
    if (existUser)
      return res
        .status(400)
        .json({ success: false, message: "Email đã được sử dụng!" });

    // Tạo user mới
    const newUser = new User({
      email: email,
      password: password,
      fullName: fullName || email.split("@")[0], // Nếu không nhập tên thì lấy chữ trước @
      avatar: "https://i.pravatar.cc/150?u=" + email, // Cấp đại 1 cái avatar
    });

    await newUser.save();
    res.json({ success: true, message: "Đăng ký thành công!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// 2. API Đăng Nhập
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Lục trong Database xem có ông nào khớp email và pass không
    const user = await User.findOne({ email, password });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Sai email hoặc mật khẩu nha!" });
    }

    // Đăng nhập thành công -> Trả thông tin (ID thật, tên, ảnh) về cho Frontend (Tuyệt đối không trả password)
    res.json({
      success: true,
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

// 3. API Lấy danh sách người dùng (Có chức năng tìm kiếm)
app.get("/api/users", async (req, res) => {
  try {
    // Lấy chữ người dùng gõ vào ô tìm kiếm (nếu không gõ gì thì lấy hết)
    const searchQuery = req.query.search || "";

    // Lục trong Database những ai có tên chứa chữ đó (không phân biệt hoa thường)
    const users = await User.find({
      fullName: { $regex: searchQuery, $options: "i" },
    }).select("_id fullName avatar"); // Chỉ lấy ID, Tên và Ảnh, tuyệt đối không lấy Password

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi tìm người!" });
  }
});

// ==========================================
// API QUẢN LÝ TIN NHẮN CHAT
// ==========================================

// 1. API Gửi tin nhắn (Lưu vào Database)
app.post("/api/messages", async (req, res) => {
  try {
    const { sender, receiver, text } = req.body;
    // Tạo tin nhắn mới
    const newMessage = new Message({ sender, receiver, text });
    await newMessage.save();
    res.json({ success: true, message: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi lưu tin nhắn!" });
  }
});

// 2. API Lấy lịch sử chat giữa 2 người
app.get("/api/messages/:user1/:user2", async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    // Tìm tất cả tin nhắn mà A gửi cho B, HOẶC B gửi cho A
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    }).sort({ createdAt: 1 }); // Sắp xếp theo thời gian cũ -> mới

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi tải tin nhắn!" });
  }
});

// ==========================================
//               BẬT MÁY CHỦ
// ==========================================
app.listen(port, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${port}`);
});
