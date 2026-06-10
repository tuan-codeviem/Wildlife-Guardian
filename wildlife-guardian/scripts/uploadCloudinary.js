const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

// Sửa đường dẫn .env vì script nằm trong thư mục Wildlife Guardian/scripts/
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ASSETS_DIR = path.join(__dirname, "../assets");
const IMAGES_DIR = path.join(ASSETS_DIR, "images");
const MODELS_DIR = path.join(ASSETS_DIR, "models");

const ANIMALS_JSON = path.join(__dirname, "animals.json");

const uploadFile = async (filePath, folder, resourceType = "auto") => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `wildlife-guardian/${folder}`,
      use_filename: true,
      unique_filename: false,
      resource_type: resourceType,
    });
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Lỗi khi upload file ${filePath}:`, error.message);
    return null;
  }
};

const runBatchUpload = async () => {
  console.log("🚀 Bắt đầu quét thư mục assets và đồng bộ với animals.json...");

  if (!fs.existsSync(ANIMALS_JSON)) {
    console.error("❌ Không tìm thấy file animals.json trong thư mục scripts!");
    return;
  }

  let animalsData = [];
  try {
    animalsData = JSON.parse(fs.readFileSync(ANIMALS_JSON, "utf8"));
  } catch (err) {
    console.error("❌ Lỗi khi đọc file animals.json:", err.message);
    return;
  }

  let isUpdated = false;

  // 1. Upload Images
  if (fs.existsSync(IMAGES_DIR)) {
    const images = fs.readdirSync(IMAGES_DIR).filter(f => !f.startsWith("."));
    console.log(`🖼️  Tìm thấy ${images.length} ảnh tĩnh...`);
    for (const img of images) {
      const speciesId = path.parse(img).name; // Ví dụ: "asian-elephant"
      const targetAnimal = animalsData.find(a => a.speciesId === speciesId);
      
      if (!targetAnimal) {
        console.log(`   ⚠️  Bỏ qua ${img} vì không tìm thấy speciesId="${speciesId}" trong animals.json`);
        continue;
      }

      console.log(`   ⬆️ Đang tải lên ảnh cho [${speciesId}]...`);
      const filePath = path.join(IMAGES_DIR, img);
      const url = await uploadFile(filePath, "images", "image");
      
      if (url) {
        targetAnimal.thumbnailUrl = url;
        isUpdated = true;
        console.log(`   ✅ Thành công! Đã ghi link ảnh vào animals.json`);
      }
    }
  } else {
    console.log("⚠️ Không tìm thấy thư mục images.");
  }

  // 2. Upload Models (.glb)
  if (fs.existsSync(MODELS_DIR)) {
    const models = fs.readdirSync(MODELS_DIR).filter(f => f.endsWith(".glb"));
    console.log(`\n🧊 Tìm thấy ${models.length} file 3D (.glb)...`);
    for (const model of models) {
      const speciesId = path.parse(model).name;
      const targetAnimal = animalsData.find(a => a.speciesId === speciesId);
      
      if (!targetAnimal) {
        console.log(`   ⚠️  Bỏ qua ${model} vì không tìm thấy speciesId="${speciesId}" trong animals.json`);
        continue;
      }

      console.log(`   ⬆️ Đang tải lên 3D Model cho [${speciesId}]...`);
      const filePath = path.join(MODELS_DIR, model);
      // LƯU Ý QUAN TRỌNG: File .glb phải dùng resource_type: "raw"
      const url = await uploadFile(filePath, "models", "raw");
      
      if (url) {
        targetAnimal.model3dUrl = url;
        isUpdated = true;
        console.log(`   ✅ Thành công! Đã ghi link 3D vào animals.json`);
      }
    }
  } else {
    console.log("⚠️ Không tìm thấy thư mục models.");
  }

  // Xuất file JSON
  if (isUpdated) {
    fs.writeFileSync(ANIMALS_JSON, JSON.stringify(animalsData, null, 2), "utf8");
    console.log(`\n🎉 HOÀN TẤT! File animals.json đã được tự động cập nhật!`);
    console.log("💡 Mẹo: Bây giờ bạn chỉ cần chạy 'node \"Wildlife Guardian/scripts/seed.js\"' là dữ liệu mới sẽ lên thẳng Database!");
  } else {
    console.log(`\n💤 Không có dữ liệu nào được cập nhật vào animals.json.`);
  }
};

// Chạy Script
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  console.error("❌ Lỗi: Không tìm thấy Cloudinary keys trong file .env!");
  process.exit(1);
} else {
  runBatchUpload();
}
