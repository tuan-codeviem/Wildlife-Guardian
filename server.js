const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

// ===== GOOGLE GEN AI SETUP =====
const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ===== CLOUDINARY SETUP =====
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("🌥️  Cloudinary đã sẵn sàng!");

// ==========================================
// 1. KHỞI TẠO APP & CẤU HÌNH MIDDLEWARE
// ==========================================
const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // Bắt buộc phải có để Frontend và Backend nói chuyện được với nhau
app.use(express.json()); // Giúp server đọc được dữ liệu dạng chữ
app.use(express.static(".")); // Để chạy được file HTML/CSS/JS
// Sửa dòng này
app.use("/uploads", express.static(path.join(__dirname, "wildlife-guardian/Social/uploads")));

// Chuyển hướng người dùng về trang chủ khi truy cập đường dẫn gốc "/"
app.get("/", (req, res) => {
  res.redirect("/wildlife-guardian/Home/Home.html");
});

// ==========================================
// 2. KẾT NỐI MONGODB
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
// 3. KHỞI TẠO CÁC MODEL DATABASE
// ==========================================
// Sửa lại thành như thế này
const Post = require("./wildlife-guardian/models/Post");
const Rescue = require("./wildlife-guardian/models/Rescue");
const Message = require("./wildlife-guardian/models/Message");
const User = require("./wildlife-guardian/models/User");
const Species = require("./wildlife-guardian/models/Species");

// ==========================================
// 4. CẤU HÌNH MULTER (Trợ lý nhận file) - CLOUDINARY
// ==========================================
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "wildlife_guardian",
    resource_type: "auto",
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Max 50MB
});

// Bọc multer lại để bắt lỗi nếu Cloudinary cấu hình sai hoặc rớt mạng
const uploadFile = (req, res, next) => {
  const uploader = upload.single("media");
  uploader(req, res, function (err) {
    if (err) {
      console.error("❌ Lỗi Multer/Cloudinary:", err);
      return res
        .status(400)
        .json({ message: "Lỗi tải ảnh lên Cloudinary: " + err.message });
    }
    next();
  });
};

// ==========================================
// 4.5 API THƯ VIỆN ĐỘNG VẬT (SPECIES)
// ==========================================

// Lấy toàn bộ danh sách động vật
app.get("/api/species", async (req, res) => {
  try {
    const speciesList = await Species.find();
    res.json({ success: true, species: speciesList });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi tải danh sách động vật!" });
  }
});

// Lấy danh sách ID động vật đã mở khóa của 1 User
app.get("/api/users/:id/unlocked", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng" });
    res.json({ success: true, unlockedSpecies: user.unlockedSpecies });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Mở khóa một động vật mới cho User
app.post("/api/users/:id/unlock", async (req, res) => {
  try {
    const { speciesId } = req.body;
    if (!speciesId)
      return res
        .status(400)
        .json({ success: false, message: "Thiếu speciesId" });

    const user = await User.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng" });

    if (!user.unlockedSpecies.includes(speciesId)) {
      user.unlockedSpecies.push(speciesId);
      await user.save();
    }
    res.json({
      success: true,
      message: "Đã mở khóa thành công!",
      unlockedSpecies: user.unlockedSpecies,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ==========================================
// 5. CÁC API BÀI VIẾT (POSTS)
// ==========================================

// Tải bài viết
app.get("/api/posts", async (req, res) => {
  try {
    const { category } = req.query;
    let filter = {};
    if (category && category.toLowerCase() !== "all posts") {
      // Xử lý escape ký tự đặc biệt để tránh lỗi sập server do Regex
      const escapeRegex = category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter = { category: new RegExp(escapeRegex, "i") };
    }

    // Dùng .lean() để có thể chỉnh sửa object kết quả trả về từ Mongoose
    const posts = await Post.find(filter).sort({ createdAt: -1 }).lean();

    // --- BẮT ĐẦU: LOGIC CHECK HUY HIỆU GUARDIAN DỰA TRÊN GAME ---
    const authorIds = posts
      .map((p) => p.authorId)
      .filter((id) => id && mongoose.Types.ObjectId.isValid(id));
    const users = await User.find({ _id: { $in: authorIds } }).select(
      "_id hasGuardianBadge highestUnlockedLevel",
    );

    const badgeMap = {};
    users.forEach((u) => {
      // Điều kiện: Level >= 3 VÀ có huy hiệu Guardian
      badgeMap[u._id.toString()] =
        u.highestUnlockedLevel >= 3 && u.hasGuardianBadge === true;
    });

    const postsWithBadge = posts.map((p) => ({
      ...p,
      authorHasBadge: p.authorId
        ? badgeMap[p.authorId.toString()] || false
        : false,
    }));
    // --- KẾT THÚC ---

    res.json(postsWithBadge);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tải bài viết!" });
  }
});

// Đăng bài viết mới
app.post("/api/posts", uploadFile, async (req, res) => {
  try {
    console.log("📝 POST /api/posts - req.file:", req.file);

    // 🛠 Bắt link ảnh trả về từ Cloudinary (Bao phủ mọi trường hợp path, secure_url, url)
    let imageUrl = null;
    if (req.file) {
      imageUrl = req.file.path;
    }
    console.log("🔗 Link ảnh chuẩn bị lưu vào Database:", imageUrl);

    const newPost = new Post({
      content: req.body.content,
      category: req.body.category,
      authorName: req.body.authorName || "Người dùng ẩn danh",
      authorAvatar: req.body.authorAvatar || "https://i.pravatar.cc/150?img=11",
      authorId: req.body.authorId,
      media_url: imageUrl,
    });
    await newPost.save();
    console.log("✅ Bài viết đã lưu thành công:", newPost);
    res.status(201).json(newPost);
  } catch (error) {
    console.error("❌ Lỗi đăng bài:", error);
    res
      .status(500)
      .json({ message: "Lỗi không lưu được bài: " + error.message });
  }
});

// Thả tim bài viết
app.put("/api/posts/:id/like", async (req, res) => {
  try {
    const postId = req.params.id;
    // Bắt lấy ID của người bấm (Dúi, Shark, hoặc ẩn danh) từ giao diện gửi lên
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "Thiếu thông tin người dùng!" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài viết!" });
    }

    // Kiểm tra xem ông này đã thả tim chưa
    const hasLiked = post.likes.includes(userId);

    if (hasLiked) {
      // Có rồi thì xóa đi (Rút lại tim)
      post.likes = post.likes.filter((id) => id !== userId);
    } else {
      // Chưa có thì nhét tên vào (Thả tim)
      post.likes.push(userId);
    }

    await post.save();

    // Trả kết quả về cho giao diện chớp chớp
    res.json({ likesCount: post.likes.length, isLiked: !hasLiked });
  } catch (error) {
    console.error("Lỗi tim:", error);
    res.status(500).json({ message: "Lỗi hệ thống thả tim!" });
  }
});

// Thả tim BÌNH LUẬN
app.put("/api/posts/:postId/comment/:commentId/like", async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { userId } = req.body;

    if (!userId)
      return res.status(400).json({ message: "Thiếu thông tin người dùng!" });

    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({ message: "Không tìm thấy bài viết!" });

    const comment = post.comments.find((c) => c._id.toString() === commentId);
    if (!comment)
      return res.status(404).json({ message: "Không tìm thấy bình luận!" });

    if (!comment.likes) comment.likes = [];

    const hasLiked = comment.likes.includes(userId);
    if (hasLiked) {
      // Rút tim
      comment.likes = comment.likes.filter((id) => id !== userId);
    } else {
      // Thả tim
      comment.likes.push(userId);
    }

    post.markModified("comments");
    await post.save();
    res.json({ likesCount: comment.likes.length, isLiked: !hasLiked });
  } catch (error) {
    console.error("Lỗi tim comment:", error);
    res.status(500).json({ message: "Lỗi hệ thống thả tim bình luận!" });
  }
});

// Bình luận bài viết (có hỗ trợ upload ảnh - CLOUDINARY)
app.post("/api/posts/:id/comment", uploadFile, async (req, res) => {
  try {
    console.log("📝 POST /api/posts/:id/comment");
    console.log("Params:", req.params);
    console.log("Body:", req.body);
    console.log("File:", req.file);

    const post = await Post.findById(req.params.id);

    if (!post) {
      console.error("❌ Không tìm thấy bài viết:", req.params.id);
      return res.status(404).json({ message: "Không tìm thấy bài viết!" });
    }

    // 🛠 Bắt link ảnh cho phần bình luận (Comment)
    let imageUrl = null;
    if (req.file) {
      imageUrl = req.file.path;
    }
    console.log("🔗 Link ảnh comment chuẩn bị lưu vào Database:", imageUrl);

    const newComment = {
      userId: req.body.userId,
      user: req.body.user || "Người dùng Wildlife",
      userAvatar: req.body.userAvatar || "https://i.pravatar.cc/150?img=11",
      text: req.body.text,
      media_url: imageUrl,
      replyTo: req.body.replyTo || null, // Lưu ID của bình luận cha (nếu có)
      replyToUser: req.body.replyToUser || null, // Lưu Tên người được nhắc tới
      createdAt: new Date(),
    };

    console.log("💬 Comment mới:", newComment);
    post.comments.push(newComment);
    await post.save();

    console.log("✅ Đã lưu comment");
    res.json(post.comments);
  } catch (error) {
    console.error("❌ Lỗi comment:", error);
    res
      .status(500)
      .json({ message: "Lỗi hệ thống bình luận! " + error.message });
  }
});

// Xóa bình luận
app.delete("/api/posts/:postId/comment/:commentId", async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { userId } = req.query; // Nhận từ query string

    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({ message: "Không tìm thấy bài viết!" });

    const comment = post.comments.find((c) => c._id.toString() === commentId);
    if (!comment)
      return res.status(404).json({ message: "Không tìm thấy bình luận!" });

    // Kiểm tra quyền: Người viết comment HOẶC Chủ bài viết được phép xóa
    const isCommentOwner = comment.userId && comment.userId === userId;
    const isPostOwner = post.authorId && post.authorId === userId;

    if (!isCommentOwner && !isPostOwner) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa bình luận này!" });
    }

    // Lọc bỏ bình luận cần xóa và cả các bình luận trả lời cho nó để tránh bị mồ côi
    post.comments = post.comments.filter(
      (c) => c._id.toString() !== commentId && c.replyTo !== commentId,
    );
    post.markModified("comments");
    await post.save();
    res.json(post.comments);
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống khi xóa bình luận!" });
  }
});

// Cập nhật bài viết (Sửa bài)
app.put("/api/posts/:id", uploadFile, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, content, category, removeMedia } = req.body;

    const post = await Post.findById(id);
    if (!post)
      return res.status(404).json({ message: "Không tìm thấy bài viết!" });

    if (post.authorId && post.authorId !== userId) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền sửa bài viết này!" });
    }

    post.content = content || post.content;
    post.category = category || post.category;

    if (req.file) {
      let imageUrl = req.file.path;
      post.media_url = imageUrl;
    } else if (removeMedia === "true") {
      post.media_url = null; // Xóa ảnh nếu người dùng bấm nút ✕
    }

    await post.save();
    res.json(post);
  } catch (error) {
    console.error("Lỗi sửa bài:", error);
    res.status(500).json({ message: "Lỗi khi sửa bài viết!" });
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

    // Chỉ tìm kiếm bằng email hoặc username nếu chúng có giá trị
    const searchConditions = [];
    if (email) searchConditions.push({ email: email });
    if (username) searchConditions.push({ username: username });

    if (searchConditions.length > 0) {
      const existUser = await User.findOne({ $or: searchConditions });
      if (existUser)
        return res.status(400).json({
          success: false,
          message: "Email hoặc tài khoản đã tồn tại!",
        });
    }

    const newUser = new User({
      email: email || username, // Hỗ trợ cả form cũ và mới
      username: username || email,
      password: password,
      fullName: fullName || (email ? email.split("@")[0] : username),
      avatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
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
      password: password,
    });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Sai tài khoản hoặc mật khẩu!" });
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

// Tìm kiếm BẠN BÈ (Dành cho phần Messages)
app.get("/api/users/friends/:myId", async (req, res) => {
  try {
    const { myId } = req.params;
    const searchQuery = req.query.search || "";

    const me = await User.findById(myId);
    if (!me) return res.json({ success: true, users: [] }); // Tránh lỗi null

    const myFriends = me.friends || []; // Tránh lỗi undefined array
    const friendsList = await User.find({
      _id: { $in: myFriends },
      fullName: { $regex: searchQuery, $options: "i" },
    }).select("_id fullName avatar");
    res.json({ success: true, users: friendsList });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi tìm bạn bè!" });
  }
});

// Lấy danh sách những người đã từng chat
app.get("/api/users/recent/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    }).sort({ timestamp: -1 }); // Lấy tin nhắn mới nhất

    // Lọc ra các ID không trùng lặp
    const partnerIds = [
      ...new Set(
        messages.map((m) => (m.sender === userId ? m.receiver : m.sender)),
      ),
    ];

    const users = await User.find({ _id: { $in: partnerIds } }).select(
      "_id fullName avatar",
    );

    // ĐẢM BẢO THỨ TỰ: Sắp xếp danh sách users đúng theo thứ tự nhắn tin gần đây nhất
    users.sort((a, b) => {
      return (
        partnerIds.indexOf(a._id.toString()) -
        partnerIds.indexOf(b._id.toString())
      );
    });

    res.json({ success: true, users });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi tải danh sách người nhắn tin!" });
  }
});

// Cập nhật Profile (Đổi tên & Ảnh đại diện)
app.put("/api/users/:id", uploadFile, async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, avatar } = req.body;
    let updateData = {};

    if (fullName) updateData.fullName = fullName;

    // Nếu người dùng tải ảnh thật từ máy tính lên
    if (req.file) {
      let imageUrl = req.file.path;
      updateData.avatar = imageUrl;
    } else if (avatar) {
      // Nếu người dùng chọn "Ẩn danh" thì lưu cái ảnh trống
      updateData.avatar = avatar;
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Lỗi cập nhật profile:", error);
    res.status(500).json({ success: false, message: "Lỗi cập nhật profile!" });
  }
});

// ==========================================
// HỆ THỐNG KẾT BẠN (FRIENDS SYSTEM)
// ==========================================

// 1. Tìm người dùng mới để kết bạn (Không tìm chính mình)
app.get("/api/users/search-new/:myId", async (req, res) => {
  try {
    const { myId } = req.params;
    const search = req.query.q || "";
    const me = await User.findById(myId);

    if (!me) return res.json({ success: true, users: [] });

    const users = await User.find({
      fullName: { $regex: search, $options: "i" },
      _id: { $ne: myId }, // Không tự tìm chính mình
    }).limit(10); // Lấy tối đa 10 người cho nhẹ

    // Xác định trạng thái nút bấm (Thêm bạn bè, Hủy, hay Đã là bạn)
    const results = users.map((u) => {
      let status = "none";
      const myFriends = me.friends || [];
      const myRequests = me.friendRequests || [];
      const targetRequests = u.friendRequests || [];

      if (myFriends.includes(u._id.toString())) status = "friend";
      else if (targetRequests.includes(myId))
        status = "sent"; // Mình đã gửi cho họ
      else if (myRequests.includes(u._id.toString())) status = "received"; // Họ gửi cho mình

      return { _id: u._id, fullName: u.fullName, avatar: u.avatar, status };
    });

    res.json({ success: true, users: results });
  } catch (error) {
    console.error("Lỗi tìm kiếm bạn bè:", error);
    res.status(500).json({ success: false, message: "Lỗi tìm kiếm!" });
  }
});

// 2. Gửi hoặc Hủy lời mời kết bạn
app.post("/api/friends/request", async (req, res) => {
  try {
    const { myId, targetId } = req.body;
    const targetUser = await User.findById(targetId);

    if (!targetUser)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng!" });
    if (!targetUser.friendRequests) targetUser.friendRequests = [];

    if (targetUser.friendRequests.includes(myId)) {
      // Nếu đã gửi rồi -> Hủy
      targetUser.friendRequests = targetUser.friendRequests.filter(
        (id) => id !== myId,
      );
      await targetUser.save();
      res.json({ success: true, action: "cancelled" });
    } else {
      // Chưa gửi -> Thêm vào danh sách chờ của họ
      targetUser.friendRequests.push(myId);
      await targetUser.save();
      res.json({ success: true, action: "sent" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống!" });
  }
});

// 3. Trả lời lời mời (Xác nhận / Xóa)
app.post("/api/friends/respond", async (req, res) => {
  try {
    const { myId, requesterId, action } = req.body;
    const me = await User.findById(myId);
    const requester = await User.findById(requesterId);

    if (!me || !requester)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy user!" });

    if (!me.friendRequests) me.friendRequests = [];
    if (!me.friends) me.friends = [];
    if (!requester.friends) requester.friends = [];

    me.friendRequests = me.friendRequests.filter((id) => id !== requesterId); // Xóa khỏi hàng đợi
    if (action === "accept") {
      if (!me.friends.includes(requesterId)) me.friends.push(requesterId);
      if (!requester.friends.includes(myId)) requester.friends.push(myId);
      await requester.save();
    }
    await me.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi xử lý!" });
  }
});

// 4. Lấy danh sách Lời mời kết bạn
app.get("/api/friends/requests/:myId", async (req, res) => {
  try {
    const me = await User.findById(req.params.myId);
    if (!me) return res.json({ success: true, requests: [] });

    const myRequests = me.friendRequests || [];
    const requesters = await User.find({
      _id: { $in: myRequests },
    }).select("_id fullName avatar");

    // Đảm bảo thứ tự ổn định cho danh sách lời mời kết bạn để giao diện không bị giật
    requesters.sort((a, b) => {
      return (
        myRequests.indexOf(a._id.toString()) -
        myRequests.indexOf(b._id.toString())
      );
    });

    res.json({ success: true, requests: requesters });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi tải lời mời!" });
  }
});

// ==========================================
// TÍNH NĂNG MỞ KHÓA ĐỘNG VẬT TRONG SPECIES LIBRARY
// ==========================================

// ==========================================
// API ĐỒNG BỘ TIẾN TRÌNH GAME (UNITY)
// ==========================================
app.put("/api/users/update-game-progress/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // Nhận 3 biến từ cục JSON của file SaveManager.cs (Unity)
    const { highestUnlockedLevel, unlockedSpecies, hasGuardianBadge } =
      req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        // Cập nhật Level cao nhất và Huy hiệu
        $set: {
          highestUnlockedLevel: highestUnlockedLevel,
          hasGuardianBadge: hasGuardianBadge,
        },
        // Thêm các loài vật mới vào mảng (không thêm trùng lặp)
        $addToSet: {
          unlockedSpecies: { $each: unlockedSpecies || [] },
        },
      },
      { new: true }, // Yêu cầu Mongoose trả về data mới nhất
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy User!" });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật tiến trình game thành công!",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Lỗi khi lưu tiến trình game:", error);
    res.status(500).json({ success: false, message: "Lỗi Server!" });
  }
});
// Thêm vào server.js
app.get("/api/users/game-progress/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Trả về đúng cấu trúc PlayerData trong Unity
    res.json({
      highestUnlockedLevel: user.highestUnlockedLevel || 1,
      unlockedSpecies: user.unlockedSpecies || [],
      hasGuardianBadge: user.hasGuardianBadge || false,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
});

// ==========================================
// 8. CÁC API BẢN ĐỒ CỨU HỘ (RESCUE MAP)
// ==========================================

app.get("/api/rescuemap", async (req, res) => {
  try {
    const rescues = await Rescue.find();
    res.json(rescues);
  } catch (error) {
    res.status(500).json({ error: "Lỗi tải dữ liệu bản đồ" });
  }
});

app.post("/api/rescuemap", async (req, res) => {
  try {
    const newRescue = new Rescue(req.body);
    await newRescue.save();
    res.status(201).send({ message: "Đã gửi báo cáo cứu hộ thành công!" });
  } catch (error) {
    res.status(400).send({ error: "Không thể lưu báo cáo" });
  }
});

app.delete("/api/rescuemap/:id", async (req, res) => {
  try {
    await Rescue.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Đã xóa báo cáo thành công!" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Không thể xóa báo cáo" });
  }
});

// ==========================================
// 8. API CHATBOT AI
// ==========================================
app.post("/api/chatbot", async (req, res) => {
  try {
    const { userMessage, languageRule } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: `Bạn là Phoenix AI, trợ lý ảo của trang web Wildlife Guardian.
QUY TẮC BẮT BUỘC VỀ ĐỊNH DẠNG: Tuyệt đối không sử dụng bất kỳ định dạng Markdown nào trong câu trả lời. Không sử dụng dấu sao (*) để in đậm, in nghiêng hay làm gạch đầu dòng. Chỉ trả lời bằng văn bản thuần túy (Plain text). Nếu cần liệt kê, hãy dùng dấu gạch ngang (-). Trả lời ngắn gọn, súc tích và thân thiện.
        ${languageRule}
        2. Bạn chỉ được phép tư vấn, trả lời các câu hỏi liên quan đến bảo vệ động vật hoang dã, thiên nhiên, môi trường và các thông tin về trang web Wildlife Guardian.
        3. Nếu người dùng hỏi về các chủ đề khác (như toán học, lập trình, giải trí, chính trị...), hãy lịch sự từ chối và lái câu chuyện quay về chủ đề động vật hoang dã.
        4. Trả lời ngắn gọn, thân thiện và súc tích.
        5. Bạn có thể trả lời về các vấn đề liên quan tới sơ cứu cơ bản cho động vật bị thương`
      }
    });
    res.json({ success: true, text: response.text });
  } catch (error) {
    console.error("Lỗi Chatbot:", error);
    res.status(500).json({ success: false, error: "Lỗi kết nối tới AI" });
  }
});

// ==========================================
// 9. BẬT MÁY CHỦ
// ==========================================
app.listen(port, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${port}`);
});
