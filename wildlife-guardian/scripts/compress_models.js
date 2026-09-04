const fs = require('fs-extra');
const path = require('path');
const gltfPipeline = require('gltf-pipeline');
const processGlb = gltfPipeline.processGlb;

const MODELS_DIR = path.join(__dirname, '../assets/models');

async function compressModels() {
    console.log("🚀 Bắt đầu quá trình nén Draco cho các mô hình 3D...");
    
    if (!fs.existsSync(MODELS_DIR)) {
        console.error("❌ Không tìm thấy thư mục models tại:", MODELS_DIR);
        console.log("💡 Vui lòng tạo thư mục assets/models và bỏ file .glb vào đó.");
        return;
    }

    const files = fs.readdirSync(MODELS_DIR).filter(f => f.endsWith('.glb'));
    if (files.length === 0) {
        console.log("⚠️ Không có file .glb nào trong thư mục models.");
        return;
    }

    console.log(`🧊 Đã tìm thấy ${files.length} file .glb. Bắt đầu nén...`);

    const options = {
        dracoOptions: {
            compressionLevel: 10, // Mức nén cao nhất (0-10)
            quantizePositionBits: 14,
            quantizeNormalBits: 10,
            quantizeTexcoordBits: 12,
            quantizeColorBits: 8,
            quantizeGenericBits: 12,
        }
    };

    let successCount = 0;

    for (const file of files) {
        const filePath = path.join(MODELS_DIR, file);
        try {
            console.log(`\n⏳ Đang nén file: ${file}...`);
            const originalStats = fs.statSync(filePath);
            const originalSizeMB = (originalStats.size / (1024 * 1024)).toFixed(2);
            
            const glbBuffer = fs.readFileSync(filePath);
            
            // Xử lý nén
            const results = await processGlb(glbBuffer, options);
            
            // Ghi đè file đã nén
            fs.writeFileSync(filePath, results.glb);
            
            const compressedStats = fs.statSync(filePath);
            const compressedSizeMB = (compressedStats.size / (1024 * 1024)).toFixed(2);
            
            const savedPercentage = (((originalStats.size - compressedStats.size) / originalStats.size) * 100).toFixed(1);
            
            console.log(`   ✅ Nén thành công ${file}!`);
            console.log(`   📉 Kích thước: ${originalSizeMB} MB -> ${compressedSizeMB} MB (Giảm ${savedPercentage}%)`);
            successCount++;
        } catch (error) {
            console.error(`   ❌ Lỗi khi nén file ${file}:`, error.message);
        }
    }

    console.log(`\n🎉 Hoàn tất nén ${successCount}/${files.length} file!`);
    console.log("💡 Mẹo: Bây giờ bạn có thể chạy 'node scripts/uploadCloudinary.js' để đưa file siêu nhẹ lên Cloud!");
}

compressModels();
