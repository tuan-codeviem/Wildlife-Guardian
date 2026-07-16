const mongoose = require("mongoose");

const speciesSchema = new mongoose.Schema({
    speciesId: { type: String, required: true, unique: true }, // e.g., "bengal-tiger"
    animalName: {
        en: { type: String, required: true },
        vi: { type: String, required: true }
    },
    scientificName: { type: String, required: true },
    status: {
        en: { type: String, required: true },
        vi: { type: String, required: true }
    },
    category: {
        en: { type: String, required: true }, // e.g., "Mammal"
        vi: { type: String, required: true }  // e.g., "Thú"
    },
    distribution: {
        en: { type: String, required: true },
        vi: { type: String, required: true }
    },
    habitat: {
        en: { type: String, required: true },
        vi: { type: String, required: true }
    },
    diet: {
        en: { type: String, required: true },
        vi: { type: String, required: true }
    },
    behavior: {
        en: { type: String, required: true },
        vi: { type: String, required: true }
    },
    funFact: {
        en: { type: String, required: true },
        vi: { type: String, required: true }
    },
    thumbnailUrl: { type: String, required: true }, // URL ảnh 2D từ Cloudinary
    model3dUrl: { type: String, required: true },   // URL file .glb từ Cloudinary
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Species || mongoose.model("Species", speciesSchema);
