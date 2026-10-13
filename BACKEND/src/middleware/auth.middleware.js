const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "No token provided, access denied"
        });
    }

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.id;

        // Resolve the role from the database so demotions take effect
        // immediately. Tokens issued before roles existed carry no role,
        // and documents created before roles existed have none either;
        // both fall back to "user".
        try {
            const user = await User.findById(decoded.id).select("role");
            req.role = (user && user.role) || decoded.role || "user";
        } catch (error) {
            req.role = decoded.role || "user";
        }

        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

const requireAdmin = (req, res, next) => {
    if (req.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });
    }

    next();
};

module.exports = { auth, requireAdmin };
