const express = require('express')
const { checkIfUserExists } = require('../Middlewares/middleware');
const { register, login, requestReset, resetPassword } = require('../Controllers/authController');

const router = express.Router();

router.post("/register", checkIfUserExists, register);
router.post("/login", login);
router.post("/reset", requestReset, resetPassword);

module.exports = router