const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { normalizeList, normalizeModes } = require("../services/recommendationService");

// Creates a login token that is valid for 7 days
const createToken = (userId, role) => {
    return jwt.sign({ id: userId, role: role || "user" }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Keep the auth payloads consistent and never leak the password hash
const toPublicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    githubUsername: user.githubUsername,
    role: user.role,
    skills: user.skills || [],
    interests: user.interests || [],
    preferredModes: user.preferredModes || [],
    preferredLocation: user.preferredLocation || ""
});

const normalizeLocation = (value) => {
    if (typeof value !== "string") {
        return "";
    }
    return value.trim().replace(/\s+/g, " ").slice(0, 100);
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
        const { name, email, password, githubUsername, skills, interests, preferredModes, preferredLocation } = req.body;

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
            role,
            skills: normalizeList(skills),
            interests: normalizeList(interests),
            preferredModes: normalizeModes(preferredModes),
            preferredLocation: normalizeLocation(preferredLocation)
        });

        const token = createToken(user._id, user.role);

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            token,
            user: toPublicUser(user)
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
            user: toPublicUser(user)
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

const updateMe = async (req, res) => {
        const user = await User.findById(req.user);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const { name, githubUsername, skills, interests, preferredModes, preferredLocation } = req.body;

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Name cannot be empty"
                });
            }
            user.name = name.trim();
        }

        if (githubUsername !== undefined) {
            user.githubUsername = typeof githubUsername === "string" ? githubUsername.trim() : "";
        }

        if (skills !== undefined) {
            if (!Array.isArray(skills) && typeof skills !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "skills must be an array or comma-separated string"
                });
            }
            user.skills = normalizeList(skills);
        }

        if (interests !== undefined) {
            if (!Array.isArray(interests) && typeof interests !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "interests must be an array or comma-separated string"
                });
            }
            user.interests = normalizeList(interests);
        }

        if (preferredModes !== undefined) {
            if (Array.isArray(preferredModes) || typeof preferredModes === "string") {
                user.preferredModes = normalizeModes(preferredModes);
            } else {
                return res.status(400).json({
                    success: false,
                    message: "preferredModes must be an array or comma-separated string"
                });
            }
        }

        if (preferredLocation !== undefined) {
            if (typeof preferredLocation !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "preferredLocation must be a string"
                });
            }
            user.preferredLocation = normalizeLocation(preferredLocation);
        }

        await user.save();

        res.json({
            success: true,
            message: "Profile updated successfully",
            user
        });
};

module.exports = {register,login,getMe,updateMe};