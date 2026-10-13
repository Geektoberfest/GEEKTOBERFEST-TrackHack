require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/db/db");

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    connectDB().catch((error) => {
        console.error("MongoDB connection failed: " + error.message);
        process.exit(1);
    });

    app.listen(PORT, () => {
        console.log("Server running on port " + PORT);
    });
}

module.exports = app;