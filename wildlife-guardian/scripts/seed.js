const mongoose = require("mongoose");
require("dotenv").config();
const Species = require("../models/Species");

// Đọc dữ liệu từ file animals.json
const sampleSpecies = require("./animals.json");

// Hàm kết nối DB và chèn dữ liệu
const seedDatabase = async () => {
  try {
    console.log("⏳ Đang kết nối tới MongoDB...");
    // Sửa lại đường dẫn file .env do thư mục scripts đã chuyển vào trong Wildlife Guardian
    require("dotenv").config({ path: "../../.env" });
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Kết nối MongoDB thành công!");

    // Xóa dữ liệu cũ (Tùy chọn, bỏ comment nếu muốn reset sạch data)
    await Species.deleteMany({});
    console.log("🧹 Đã dọn sạch dữ liệu cũ trong collection Species.");

    // Chèn 10 con vật mẫu
    await Species.insertMany(sampleSpecies);
    console.log(`🎉 Đã bơm thành công ${sampleSpecies.length} loài động vật vào Database!`);

  } catch (err) {
    console.error("❌ Lỗi bơm dữ liệu:", err);
  } finally {
    // Đóng kết nối
    mongoose.connection.close();
    console.log("🔌 Đã đóng kết nối Database.");
  }
};

// Chạy hàm
seedDatabase();
