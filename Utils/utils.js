const bcrypt = require("bcryptjs");
const db = require(`../config/db`);
// const nodemailer = require("nodemailer");
require("dotenv").config();

const hashFn = async (value) => {
  const salt = await bcrypt.genSalt(10);
  const hash = bcrypt.hash(value, salt);

  return hash;
};

const comparePasswords = async (password, hashedPassword) => {
  const isMatch = await bcrypt.compare(password, hashedPassword);
  return isMatch;
};

const generateReferralCode = (first_name) => {
  if (!first_name) {
    throw new Error("first_name is required to generate a referral code");
  }
  const randomString = Math.random().toString(36).substring(2, 6).toUpperCase(); // Random string of 4 characters
  const generatedCode = `${first_name
    .slice(0, 3)
    .toUpperCase()}${randomString}`;
  return generatedCode;
};

const generateUniqueReferralCode = async (first_name) => {
  if (!first_name) {
    throw new Error(
      "first_name is required to generate a unique referral code"
    );
  }
  // Generate a referral code
  const referral_code = await generateReferralCode(first_name);
  console.log(referral_code);

  // Check if the code already exists in the database
  const exists = await new Promise((resolve, reject) => {
    const sql = "SELECT COUNT(*) AS count FROM users WHERE referral_code = ?";
    db.query(sql, [referral_code], (err, results) => {
      if (err) return reject(err);
      resolve(results[0].count > 0); // Resolve to true if referral code exists
    });
  });

  // If it exists, generate a new one recursively
  if (exists) {
    return generateUniqueReferralCode();
  }

  return referral_code;
};

const generateToken = () => {
  return require("crypto").randomBytes(16).toString("hex"); // 32-character unique token
};

const generateRefreshToken = () => {
  return require("crypto").randomBytes(16).toString("hex");
};



const sgMail = require('@sendgrid/mail');

// Set the API key from the .env file
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send an email using SendGrid
 * @param {string} to - Recipient's email address
 * @param {string} subject - Subject of the email
 * @param {string} text - Plain text content of the email
 * @returns {Promise<void>}
 */
const sendEmail = async (to, subject, text) => {
  try {
    const msg = {
      to,
      from: process.env.FROM_EMAIL, // Verified sender email
      subject,
      text,
    };

    await sgMail.send(msg);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error.response?.body || error.message);
    throw error; // Optional: propagate error to handle it higher up
  }
};
;



module.exports = {
  hashFn,
  comparePasswords,
  generateReferralCode,
  generateUniqueReferralCode,
  generateToken,
  generateRefreshToken,
  sendEmail
};
