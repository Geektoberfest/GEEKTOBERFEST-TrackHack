const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../src/models/User");

let counter = 0;

const uniqueEmail = () => {
    counter += 1;
    return `test-user-${Date.now()}-${counter}@example.com`;
};

const createUser = async (overrides = {}) => {
    const password = overrides.password || "password123";
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        name: overrides.name || "Test User",
        email: (overrides.email || uniqueEmail()).toLowerCase(),
        password: hashedPassword,
        githubUsername: overrides.githubUsername || "",
        role: overrides.role || "user"
    });

    return user;
};

const authHeaderFor = (user) => {
    const id = user._id ? user._id.toString() : user.toString();
    const role = user.role || "user";
    const token = jwt.sign({ id, role }, process.env.JWT_SECRET || "test-jwt-secret");
    return "Bearer " + token;
};

module.exports = { createUser, authHeaderFor };
