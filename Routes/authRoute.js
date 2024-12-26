const express = require('express')
const { checkIfUserExists, tokenAuth } = require('../Middlewares/middleware');
const { register, login } = require('../Controllers/authController');

const router = express.Router();

router.post("/register", checkIfUserExists, register);
router.post("/login", tokenAuth, login);

module.exports = router