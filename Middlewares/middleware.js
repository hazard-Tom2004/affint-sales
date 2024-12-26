const User = require("../Models/authModel");
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.checkIfUserExists = async (req, res, next) => {
  const { email } = req.body;
  const users = await User.findUserByEmail(email);
  if (users.includes(email)) {
    return res.status(400).send({
      success: false,
      message: "User with this email already exist!",
    });
  }
  return next();
};

exports.updateReferralCount = async (req, res, next) => {
  const { referral_code } = req.body;
  try {
    // Call the handleReferral function and get the result
    const result = await User.handleReferral(referral_code);

    // Send an appropriate response
    res.status(200).json({
        message: result.message,
        id: result.userId || result.companyId,
    });
  }
  // const user = await User.handleReferral(referral_code);
  // if (user.includes(referral_code)) {
  //   return referral_count++;
  // }
catch (error) {
  // Handle errors
  res.status(500).json({
      message: "Error updating referral count",
      error: error.message,
  });
}
}
  // return next();
// };

//middleware to check if there is an access token to grant login access
exports.tokenAuth = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Bearer token
  console.log(req.header);
  console.log(req.header("Authorization")?.split(" "));

  if (!token) {
    return res.status(401).send({
      success: false,
      message: "Access denied! No token provided.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).send({
      success: false,
      message: "Invalid token",
    });
  }
};

// Middleware to handle refresh token
exports.refreshTokenAuth = async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res
      .status(401)
      .send({ success: false, message: "Refresh token is required" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Verify refresh token against the database
    const user = await User.findUserById(decoded.id);

    if (!user || user[0].refresh_token !== refreshToken) {
      return res
        .status(403)
        .send({ success: false, message: "Invalid refresh token" });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { id: user[0].id, email: user[0].email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Attach new access token to the response object
    res.locals.accessToken = newAccessToken;
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    res
      .status(403)
      .send({ success: false, message: "Invalid or expired refresh token" });
  }
};
