const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const https = require("https");
require("dotenv").config();

const uploadRoute = require("./upload.route");

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

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ==========================================
// CHỐT CHẶN CORS TUYỆT ĐỐI BẰNG TAY (Chống lỗi Failed to fetch)
// ==========================================
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') return res.status(200).json({});
    next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(express.static("."));
app.use(
    "/uploads",
    express.static(path.join(__dirname, "Wildlife Guardian/Social/uploads")),
);

app.use("/api/upload", uploadRoute);

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
const Post = require("./Wildlife Guardian/models/Post");
const Rescue = require("./Wildlife Guardian/models/Rescue");
const Message = require("./Wildlife Guardian/models/Message");
const User = require("./Wildlife Guardian/models/User");
const Species = require("./Wildlife Guardian/models/Species");

// ==========================================
// 4. CẤU HÌNH MULTER - CLOUDINARY
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
    limits: { fileSize: 50 * 1024 * 1024 },
});

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
app.get("/api/species", async (req, res) => {
    try {
        const speciesList = await Species.find();
        res.json({ success: true, species: speciesList });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi tải danh sách động vật!" });
    }
});

app.get("/api/users/:id/unlocked", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
        res.json({ success: true, unlockedSpecies: user.unlockedSpecies });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});

app.post("/api/users/:id/unlock", async (req, res) => {
    try {
        const { speciesId } = req.body;
        if (!speciesId) return res.status(400).json({ success: false, message: "Thiếu speciesId" });

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });

        if (!user.unlockedSpecies.includes(speciesId)) {
            user.unlockedSpecies.push(speciesId);
            await user.save();
        }
        res.json({ success: true, message: "Đã mở khóa thành công!", unlockedSpecies: user.unlockedSpecies });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});

// ==========================================
// 5. CÁC API BÀI VIẾT (POSTS)
// ==========================================
app.get("/api/posts", async (req, res) => {
    try {
        const { category } = req.query;
        let filter = {};
        if (category && category.toLowerCase() !== "all posts") {
            const escapeRegex = category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            filter = { category: new RegExp(escapeRegex, "i") };
        }
        const posts = await Post.find(filter).sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: "Lỗi tải bài viết!" });
    }
});

app.post("/api/posts", uploadFile, async (req, res) => {
    try {
        let imageUrl = null;
        if (req.file) {
            imageUrl = req.file.path;
        }

        const newPost = new Post({
            content: req.body.content,
            category: req.body.category,
            authorName: req.body.authorName || "Người dùng ẩn danh",
            authorAvatar: req.body.authorAvatar || "https://i.pravatar.cc/150?img=11",
            authorId: req.body.authorId,
            media_url: imageUrl,
        });
        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        res.status(500).json({ message: "Lỗi không lưu được bài: " + error.message });
    }
});

app.put("/api/posts/:id/like", async (req, res) => {
    try {
        const postId = req.params.id;
        const { userId } = req.body;

        if (!userId) return res.status(400).json({ message: "Thiếu thông tin người dùng!" });

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết!" });

        const hasLiked = post.likes.includes(userId);
        if (hasLiked) {
            post.likes = post.likes.filter((id) => id !== userId);
        } else {
            post.likes.push(userId);
        }

        await post.save();
        res.json({ likesCount: post.likes.length, isLiked: !hasLiked });
    } catch (error) {
        res.status(500).json({ message: "Lỗi hệ thống thả tim!" });
    }
});

app.put("/api/posts/:postId/comment/:commentId/like", async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const { userId } = req.body;

        if (!userId) return res.status(400).json({ message: "Thiếu thông tin người dùng!" });

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết!" });

        const comment = post.comments.find((c) => c._id.toString() === commentId);
        if (!comment) return res.status(404).json({ message: "Không tìm thấy bình luận!" });

        if (!comment.likes) comment.likes = [];

        const hasLiked = comment.likes.includes(userId);
        if (hasLiked) {
            comment.likes = comment.likes.filter((id) => id !== userId);
        } else {
            comment.likes.push(userId);
        }

        post.markModified("comments");
        await post.save();
        res.json({ likesCount: comment.likes.length, isLiked: !hasLiked });
    } catch (error) {
        res.status(500).json({ message: "Lỗi hệ thống thả tim bình luận!" });
    }
});

app.post("/api/posts/:id/comment", uploadFile, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết!" });

        let imageUrl = null;
        if (req.file) {
            imageUrl = req.file.path;
        }

        const newComment = {
            userId: req.body.userId,
            user: req.body.user || "Người dùng Wildlife",
            userAvatar: req.body.userAvatar || "https://i.pravatar.cc/150?img=11",
            text: req.body.text,
            media_url: imageUrl,
            replyTo: req.body.replyTo || null,
            replyToUser: req.body.replyToUser || null,
            createdAt: new Date(),
        };

        post.comments.push(newComment);
        await post.save();
        res.json(post.comments);
    } catch (error) {
        res.status(500).json({ message: "Lỗi hệ thống bình luận! " + error.message });
    }
});

app.delete("/api/posts/:postId/comment/:commentId", async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const { userId } = req.query;

        if (!userId) {
            return res.status(401).json({ message: "Thiếu thông tin người dùng!" });
        }

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết!" });

        const comment = post.comments.find((c) => c._id.toString() === commentId);
        if (!comment) return res.status(404).json({ message: "Không tìm thấy bình luận!" });

        // FIX SO SÁNH ID
        const isCommentOwner = comment.userId && comment.userId.toString() === userId.toString();
        const isPostOwner = post.authorId && post.authorId.toString() === userId.toString();

        if (!isCommentOwner && !isPostOwner) {
            return res.status(403).json({ message: "Bạn không có quyền xóa bình luận này!" });
        }

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

app.put("/api/posts/:id", uploadFile, async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, content, category, removeMedia } = req.body;

        if (!userId) {
            return res.status(401).json({ message: "Thiếu thông tin người dùng!" });
        }

        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết!" });

        // FIX SO SÁNH ID
        if (post.authorId && post.authorId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Bạn không có quyền sửa bài viết này!" });
        }

        post.content = content || post.content;
        post.category = category || post.category;

        if (req.file) {
            let imageUrl = req.file.path;
            post.media_url = imageUrl;
        } else if (removeMedia === "true") {
            post.media_url = null;
        }

        await post.save();
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi sửa bài viết!" });
    }
});

app.delete("/api/posts/:id", async (req, res) => {
    try {
        // Thay đổi: Nhận thêm userId từ query để bảo mật
        const userId = req.query.userId;
        if (!userId) {
            return res.status(401).json({ message: "Vui lòng đăng nhập để xóa bài!" });
        }

        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết!" });

        // Kiểm tra xem người yêu cầu xóa có phải là chủ bài viết không
        if (post.authorId && post.authorId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Bạn không có quyền xóa bài viết này!" });
        }

        await Post.deleteOne({ _id: post._id });
        res.json({ message: "Đã xóa bài viết thành công!" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi xóa bài!" });
    }
});

// ==========================================
// 6. CÁC API TIN NHẮN CHAT (MESSENGER)
// ==========================================
app.get("/api/messages/:user1/:user2", async (req, res) => {
    try {
        const { user1, user2 } = req.params;
        const messages = await Message.find({
            $or: [
                { sender: user1, receiver: user2 },
                { sender: user2, receiver: user1 },
            ],
        }).sort({ timestamp: 1, createdAt: 1 });
        res.json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi tải tin nhắn!" });
    }
});

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
app.post("/api/register", async (req, res) => {
    try {
        const { email, password, fullName, username } = req.body;

        const searchConditions = [];
        if (email) searchConditions.push({ email: email });
        if (username) searchConditions.push({ username: username });

        if (searchConditions.length > 0) {
            const existUser = await User.findOne({ $or: searchConditions });
            if (existUser)
                return res.status(400).json({ success: false, message: "Email hoặc tài khoản đã tồn tại!" });
        }

        const newUser = new User({
            email: email || username,
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

app.post("/api/login", async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const loginIdentifier = email || username;
        const user = await User.findOne({
            $or: [{ email: loginIdentifier }, { username: loginIdentifier }],
            password: password,
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

app.get("/api/users/friends/:myId", async (req, res) => {
    try {
        const { myId } = req.params;
        const searchQuery = req.query.search || "";

        const me = await User.findById(myId);
        if (!me) return res.json({ success: true, users: [] });

        const myFriends = me.friends || [];
        const friendsList = await User.find({
            _id: { $in: myFriends },
            fullName: { $regex: searchQuery, $options: "i" },
        }).select("_id fullName avatar");
        res.json({ success: true, users: friendsList });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi tìm bạn bè!" });
    }
});

app.get("/api/users/recent/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const messages = await Message.find({
            $or: [{ sender: userId }, { receiver: userId }],
        }).sort({ timestamp: -1 });

        const partnerIds = [
            ...new Set(
                messages.map((m) => (m.sender === userId ? m.receiver : m.sender)),
            ),
        ];

        const users = await User.find({ _id: { $in: partnerIds } }).select("_id fullName avatar");

        users.sort((a, b) => {
            return (
                partnerIds.indexOf(a._id.toString()) -
                partnerIds.indexOf(b._id.toString())
            );
        });

        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi tải danh sách người nhắn tin!" });
    }
});

app.put("/api/users/:id", uploadFile, async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, avatar } = req.body;
        let updateData = {};

        if (fullName) updateData.fullName = fullName;

        if (req.file) {
            let imageUrl = req.file.path;
            updateData.avatar = imageUrl;
        } else if (avatar) {
            updateData.avatar = avatar;
        }

        const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });
        res.json({ success: true, user: updatedUser });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi cập nhật profile!" });
    }
});

// ==========================================
// HỆ THỐNG KẾT BẠN (FRIENDS SYSTEM)
// ==========================================
app.get("/api/users/search-new/:myId", async (req, res) => {
    try {
        const { myId } = req.params;
        const search = req.query.q || "";
        const me = await User.findById(myId);

        if (!me) return res.json({ success: true, users: [] });

        const users = await User.find({
            fullName: { $regex: search, $options: "i" },
            _id: { $ne: myId },
        }).limit(10);

        const results = users.map((u) => {
            let status = "none";
            const myFriends = me.friends || [];
            const myRequests = me.friendRequests || [];
            const targetRequests = u.friendRequests || [];

            if (myFriends.includes(u._id.toString())) status = "friend";
            else if (targetRequests.includes(myId)) status = "sent";
            else if (myRequests.includes(u._id.toString())) status = "received";

            return { _id: u._id, fullName: u.fullName, avatar: u.avatar, status };
        });

        res.json({ success: true, users: results });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi tìm kiếm!" });
    }
});

app.post("/api/friends/request", async (req, res) => {
    try {
        const { myId, targetId } = req.body;
        const targetUser = await User.findById(targetId);

        if (!targetUser) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng!" });
        if (!targetUser.friendRequests) targetUser.friendRequests = [];

        if (targetUser.friendRequests.includes(myId)) {
            targetUser.friendRequests = targetUser.friendRequests.filter((id) => id !== myId);
            await targetUser.save();
            res.json({ success: true, action: "cancelled" });
        } else {
            targetUser.friendRequests.push(myId);
            await targetUser.save();
            res.json({ success: true, action: "sent" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống!" });
    }
});

app.post("/api/friends/respond", async (req, res) => {
    try {
        const { myId, requesterId, action } = req.body;
        const me = await User.findById(myId);
        const requester = await User.findById(requesterId);

        if (!me || !requester) return res.status(404).json({ success: false, message: "Không tìm thấy user!" });

        if (!me.friendRequests) me.friendRequests = [];
        if (!me.friends) me.friends = [];
        if (!requester.friends) requester.friends = [];

        me.friendRequests = me.friendRequests.filter((id) => id !== requesterId);
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

app.get("/api/friends/requests/:myId", async (req, res) => {
    try {
        const me = await User.findById(req.params.myId);
        if (!me) return res.json({ success: true, requests: [] });

        const myRequests = me.friendRequests || [];
        const requesters = await User.find({ _id: { $in: myRequests } }).select("_id fullName avatar");

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

app.post("/api/forgot-password", async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({
            $or: [{ email: email }, { username: email }],
        });
        if (user) {
            res.json({ success: true, message: "Link khôi phục đã gửi đến " + email });
        } else {
            res.status(404).json({ success: false, message: "Không tìm thấy tài khoản này!" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi Server!" });
    }
});

app.post("/api/feedback", async (req, res) => {
    try {
        res.status(200).json({ success: true, message: "Đã nhận phản hồi" });
    } catch (error) {
        res.status(500).json({ error: "Lỗi lưu phản hồi" });
    }
});

// ==========================================
// TÍNH NĂNG MỞ KHÓA ĐỘNG VẬT
// ==========================================
app.post("/api/users/:id/unlock", async (req, res) => {
    try {
        const { speciesName } = req.body;
        if (!speciesName) return res.status(400).json({ success: false, message: "Thiếu tên con vật!" });

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });

        if (!user.unlockedSpecies) user.unlockedSpecies = [];
        if (!user.unlockedSpecies.includes(speciesName)) {
            user.unlockedSpecies.push(speciesName);
            await user.save();
        }

        res.json({ success: true, message: `Đã lưu ${speciesName} vào danh sách mở khóa!` });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi Server!" });
    }
});

app.get("/api/users/:id/unlocked", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
        res.json({ success: true, unlockedSpecies: user.unlockedSpecies || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi Server!" });
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
        res.status(201).send({ message: "Đã gửi báo cáo cứu hộ thành công!", id: newRescue._id });
    } catch (error) {
        res.status(400).send({ error: "Không thể lưu báo cáo" });
    }
});

app.patch("/api/rescuemap/:id/address", async (req, res) => {
    try {
        const { address } = req.body;
        await Rescue.findByIdAndUpdate(req.params.id, { address });
        res.json({ message: "Đã cập nhật địa chỉ" });
    } catch (error) {
        res.status(500).json({ error: "Lỗi cập nhật địa chỉ" });
    }
});

app.patch("/api/rescuemap/:id/photo", async (req, res) => {
    try {
        const { photo } = req.body;
        await Rescue.findByIdAndUpdate(req.params.id, { photo });
        res.json({ message: "Đã cập nhật ảnh" });
    } catch (error) {
        res.status(500).json({ error: "Lỗi cập nhật ảnh" });
    }
});

// --- ĐOẠN API XÓA ĐÃ ĐƯỢC FIX LỖI ÉP KIỂU BẰNG toString() ---
// --- Xóa bản ghi cứu hộ (Có gắn bộ theo dõi lỗi) ---
// --- Xóa bản ghi cứu hộ (Đã Fix lỗi lệch kiểu dữ liệu ID) ---
app.delete("/api/rescuemap/:id", async (req, res) => {
    try {
        const reportId = req.params.id.trim();
        const userId = (req.query.userId || "").trim();

        console.log(`\n==========================================`);
        console.log(`🗑️ [DELETE] YÊU CẦU XÓA BÁO CÁO CỨU HỘ`);
        console.log(`- ID Báo cáo: '${reportId}'`);
        console.log(`- Người yêu cầu (userId): '${userId}'`);

        if (!userId) {
            console.log("❌ Từ chối: Thiếu userId từ Frontend.");
            return res.status(401).json({ success: false, message: "Bạn cần đăng nhập để thực hiện thao tác này!" });
        }

        let rescue = null;

        if (mongoose.Types.ObjectId.isValid(reportId)) {
            rescue = await Rescue.findById(reportId);
        } else {
            console.log("❌ Từ chối: ID báo cáo không hợp lệ.");
            return res.status(400).json({ success: false, message: "ID báo cáo không hợp lệ!" });
        }

        if (!rescue) {
            console.log("❌ Từ chối: Bản ghi không tồn tại trong DB.");
            return res.status(404).json({ success: false, message: "Không tìm thấy báo cáo hoặc đã bị xóa!" });
        }

        let ownerId = null;
        if (rescue.reportedBy && rescue.reportedBy.userId) {
            ownerId = rescue.reportedBy.userId.toString().trim();
        } else if (rescue.reportedBy && typeof rescue.reportedBy === 'string') {
            ownerId = rescue.reportedBy.toString().trim();
        }

        console.log(`- Chủ nhân thực sự (ownerId): '${ownerId}'`);

        if (!ownerId || ownerId !== userId) {
            console.log("❌ Từ chối: Sai quyền sở hữu.");
            return res.status(403).json({ success: false, message: `Bạn không có quyền! Bài này của ID: ${ownerId || 'Khách'}` });
        }

        // Sử dụng deleteOne để bắt chính xác kết quả phản hồi từ Database
        const deleteResult = await Rescue.deleteOne({ _id: rescue._id });
        console.log(`✅ [DELETE] Thực thi xóa MongoDB:`, deleteResult);

        if (deleteResult.deletedCount === 0) {
            console.log("⚠️ Cảnh báo: Lệnh chạy thành công nhưng không có bản ghi nào bị xóa (Có thể do lỗi _id).");
            return res.status(500).json({ success: false, message: "Lỗi DB: Không thể xóa bản ghi!" });
        }

        console.log(`==========================================\n`);
        res.json({ success: true, message: "Đã xóa báo cáo thành công!" });

    } catch (error) {
        console.error("❌ Lỗi Server nghiêm trọng khi xóa:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống Server: " + error.message });
    }
});
app.get("/api/geocode", async (req, res) => {
    try {
        const { lat, lng, zoom } = req.query;
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=${zoom || 18}&addressdetails=1`;

        https.get(url, { headers: { "User-Agent": "WildlifeGuardian/1.0" } }, (response) => {
            let data = "";
            response.on("data", chunk => data += chunk);
            response.on("end", () => res.json(JSON.parse(data)));
        }).on("error", (err) => {
            res.status(500).json({ error: "Lỗi khi gọi API Geocode" });
        });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi gọi API Geocode" });
    }
});

// ==========================================
// CHỐT CHẶN BẢO MẬT 404 CHO MỌI API
// Đảm bảo luôn trả về JSON thay vì trang HTML báo lỗi của Express
// ==========================================
app.use("/api", (req, res) => {
    res.status(404).json({ success: false, message: `Lỗi 404: Không tìm thấy API - ${req.method} ${req.originalUrl}. Hãy kiểm tra lại Server!` });
});

// ==========================================
// CHỐT CHẶN CUỐI CÙNG: BẮT MỌI LỖI CRASH (500)
// Đảm bảo luôn trả về JSON dù Express có bị sập do bất kỳ lý do gì
// ==========================================
app.use((err, req, res, next) => {
    console.error("🔥 [CRASH EXPRESS BẤT NGỜ]:", err);
    res.status(500).json({ success: false, message: "Lỗi hệ thống ngầm Server: " + err.message });
});

app.listen(port, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${port}`);
});