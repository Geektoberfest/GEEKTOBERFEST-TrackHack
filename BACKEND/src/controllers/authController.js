const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Creates a login token that is valid for 7 days
const createToken = (userId, role) => {
    return jwt.sign({ id: userId, role: role || "user" }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Emails listed in ADMIN_EMAILS are elevated to admin on register/login.
// Removing an email from the list does not demote existing admins;
// use the admin API or promote script for that.
const adminEmails = () => {
    return (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
};

const register = async (req, res) => {
    try {
        const { name, email, password, githubUsername } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email is already registered"
            });
        }

        // Hash the password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Never trust a client-sent role; admins are bootstrapped via ADMIN_EMAILS
        const role = adminEmails().includes(email.toLowerCase()) ? "admin" : "user";

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            githubUsername,
            role
        });

        const token = createToken(user._id, user.role);

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                githubUsername: user.githubUsername,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error: " + error.message
        });
    }
};

const login = async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        
        const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Bootstrap path for pre-existing accounts listed in ADMIN_EMAILS
        if (user.role !== "admin" && adminEmails().includes(user.email)) {
            user.role = "admin";
            await user.save();
        }

        const token = createToken(user._id, user.role);

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                githubUsername: user.githubUsername,
                role: user.role
            }
        });
    
};


const getMe = async (req, res) => {
        const user = await User.findById(req.user);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            user
        });
};

module.exports = {register,login,getMe};