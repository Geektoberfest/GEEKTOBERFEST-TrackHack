const express = require("express");
const router = express.Router();

const { listUsers, updateUserRole, deleteUser } = require("../controllers/adminController");
const { auth, requireAdmin } = require("../middleware/auth.middleware");

router.use(auth, requireAdmin);

router.get("/users", listUsers);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

module.exports = router;
