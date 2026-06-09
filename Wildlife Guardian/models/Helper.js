const mongoose = require('mongoose');

const helperSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, required: true },
    verified: { type: Boolean, default: false },
    phone: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true },
    isClinic: { type: Boolean, default: false },
    specialty: { type: String, default: "" },
    available: { type: String, default: "24/7" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Helper || mongoose.model('Helper', helperSchema);