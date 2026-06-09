const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  avatar: { type: String, default: "https://cdn-icons-png.flaticon.com/512/149/149071.png" },
  unlockedSpecies: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
