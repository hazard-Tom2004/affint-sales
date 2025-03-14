const db = require(`../config/db`);
const Auth = require(`../Models/authModel`);
const {
  hashFn,
  comparePasswords,
  sendEmail,
  generateUniqueReferralCode,
} = require(`../Utils/utils`);
const User = require(`../Models/authModel`);
const jwt = require("jsonwebtoken");
require("dotenv").config();
const crypto = require("crypto")

// User's registration
exports.register = async (req, res) => {
  // console.log("Request body", req.body);
  const {
    first_name,
    last_name,
    email,
    phone,
    password,
    confirm_password,
    referral_code,
    country,
  } = req.body;
  // Ensuring all fields are provided
  if (
    !first_name ||
    !last_name ||
    !email ||
    !phone ||
    !password ||
    !confirm_password ||
    !country
  ) {
    return res.status(400).send({
      success: false,
      message: "All fields are required!!!",
    });
  }

  if (password != confirm_password) {
    return res.status(400).send({
      success: false,
      message: "Passwords do not match",
    });
  }
  try {
    const hashedPassword = await hashFn(password);
    // await generateReferralCode(first_name);

    const uniqueRefCode = await generateUniqueReferralCode(first_name);
    const ref_code = referral_code || null;
    const referralUpdateResult = await User.handleReferral(ref_code);
    console.log(
      "Referral Update Result:",
      referralUpdateResult,
      referralUpdateResult.message
    ); // Optional: log success message

    const newUser = {
      first_name,
      last_name,
      email,
      phone,
      password: hashedPassword,
      confirm_password,
      referral_code: uniqueRefCode,
      country,
    };
    const user = await Auth.register(newUser);
    console.log(user);
    res.status(201).send({
      id: user.insertId,
      success: true,
      message: "User registered successfully",
      data: {
        first_name,
        last_name,
        email,
        phone,
        referral_code: uniqueRefCode,
      },
    });
  } catch (err) {
    console.log(err);
    if (err?.errno == 1062) {
      return res.status(400).send({
        message: err?.sqlMessage,
      });
    }
    return res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

//login controllers
exports.login = async (req, res) => {
  console.log("Request body", req.body);
  const { email, password } = req.body;
  // ensure all fields are provided
  if (!email || !password) {
    return res
      .status(400)
      .send({ success: false, message: "All fields are required" });
  }
  //get user from database with email
  const user = await User.findUserByEmail(email);
  if (user.length === 0) {
    console.log(user);
    return res.status(404).send({
      success: false,
      message: `User with email (${email}) does not exists`,
    });
  }
  // Generate JWT token
  const token = jwt.sign(
    { id: user[0].id, username: user[0].username },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    }
  );

  // res.send({ token });
  const refresh_token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "24h",
    }
  );

  //To compare passwords
  if (await comparePasswords(password, user[0].password)) {
    return res.status(200).send({
      success: true,
      message: "User logged in successfully",
      data: {
        first_name: user[0].first_name,
        last_name: user[0].last_name,
        email: user[0].email,
        token,
        refresh_token,
      },
    });
  } else {
    return res.status(400).send({
      success: false,
      message: "Incorrect credentials!",
    });
  }
};

exports.requestReset = async (req, res, next) => {
  
  try {
    const { email } = req.body;
    // ensure all fields are provided
    
    console.log("Request body", email);
    if (!email) {
      return res.status(400)
        .send({ success: false, message: "Email is required" });
    }
    //get user from database with email
    const user = await User.findUserByEmail(email);
    console.log("This is the user", user)
    if (!user) {
      return res.status(404).send({
        success: false,
        message: `User with email (${email}) does not exists`,
      });
    }

    // Generate reset token and expiration
    const resetToken = await crypto.randomBytes(32).toString("hex");
    const resetTokenExpiration = new Date(Date.now() + 3600000); // 1 hour from now

    // Update user record with the token
    await User.updateResetToken(user.id, resetToken, resetTokenExpiration);

    // Send reset email
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    console.log("This is the user email",email)
    await sendEmail(
      email || "tom3525001@gmail.com",
      "Password Reset",
      `Click here to reset your password: ${resetLink}`
    );

    res.status(200).send({
      success: true,
      message: "Reset link sent to your email.",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Server error. An error occured",
      error,
    });
    // next(error)
    console.log(error)
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    // Find user by token
    const user = await User.findByResetToken(token);
    if (!user || new Date(user.reset_token_expiration) < new Date())
      return res.status(400).send({
        success: false,
        message: "Invalid or expired token.",
      });

    //hash new password
    const hashedPassword = await hashFn(newPassword);

    // Update user's password and clear the token
    await User.updatePassword(user.id, hashedPassword);
    await User.clearResetToken(user.id);

    res.status(200).send({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (error) {
    console.log(error)
    res.status(500).send({
      success: false,
      message: "Server error.",
      error,
    });
  }
};
