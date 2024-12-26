const bcrypt = require("bcryptjs");
const db = require(`../config/db`);

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

// const generateUniqueReferralCode = async () => {
//   let isUnique = false;
//   let referral_code;

//   while (!isUnique) {
//     // Generate a referral code
//     referral_code = generateReferralCode();

//     // Check if the code already exists in the database
//     const result = await new Promise((resolve, reject) => {
//       db.query(
//         "SELECT * FROM users WHERE ?? = ?",
//         ["referral_code", referral_code],
//         (err, results) => {
//           if (err) return reject(err);
//           resolve(results[0]);
//         }
//       );
//     });

//     if (result.count === 0) {
//       isUnique = true;

//     }
//   }

//   return referral_code;
// };

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

module.exports = {
  hashFn,
  comparePasswords,
  generateReferralCode,
  generateUniqueReferralCode,
  generateToken,
  generateRefreshToken,
};
