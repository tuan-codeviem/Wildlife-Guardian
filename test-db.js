const mongoose = require("mongoose");
const Rescue = require("./wildlife-guardian/models/Rescue");
const path = require("path");
const fs = require("fs");
const envPath = fs.existsSync(path.join(__dirname, ".env")) ? path.join(__dirname, ".env") : path.join(__dirname, "../.env");
require("dotenv").config({ path: envPath });

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const rescues = await Rescue.find().sort({ createdAt: -1 });
        console.log("Success:", rescues.length);
    } catch (err) {
        console.error("Lỗi:", err);
    }
    mongoose.connection.close();
});
