require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./wildlife-guardian/models/User");

async function initAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      console.error("Lỗi: Bạn cần cấu hình ADMIN_EMAIL và ADMIN_PASSWORD trong file .env!");
      process.exit(1);
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    let admin = await User.findOne({ email });
    if (admin) {
      admin.role = "admin";
      admin.password = hashedPassword; // Set to hashed '1'
      await admin.save();
      console.log("Updated existing admin user to have admin role");
    } else {
      admin = new User({
        email: email,
        username: "admin",
        password: hashedPassword,
        fullName: "Admin",
        role: "admin"
      });
      await admin.save();
      console.log("Created new admin user");
    }
  } catch (error) {
    console.error("Error creating admin:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

initAdmin();
