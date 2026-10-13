require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User");

const email = (process.argv[2] || "").toLowerCase().trim();

if (!email) {
    console.error("Usage: node scripts/promote-admin.js <email>");
    process.exit(1);
}

const run = async () => {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is not set");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);

    const user = await User.findOne({ email });
    if (!user) {
        console.error("User not found: " + email);
        process.exit(1);
    }

    user.role = "admin";
    await user.save();
    console.log("Promoted " + user.email + " to admin");

    await mongoose.disconnect();
};

run().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
