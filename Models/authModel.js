const db = require(`../config/db`);
const { generateToken, generateRefreshToken, generateReferralCode, generateUniqueReferralCode } = require(`../Utils/utils`);

class Auth {
  static register(newUser) {
    return new Promise((resolve, reject) => {
      const token = generateToken();
      const refresh_token = generateRefreshToken();
      // generateReferralCode();
      // const referral_code = generateUniqueReferralCode();
      db.query(
        "INSERT INTO users (first_name, last_name, email, phone, password, referral_code, country, token, refresh_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          newUser.first_name,
          newUser.last_name,
          newUser.email,
          newUser.phone,
          newUser.password,
          newUser.referral_code,
          newUser.country,
          token,
          refresh_token
        ],
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        }
      );
    });
  }

  static findUserByEmail(email) {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM users WHERE ?? = ?",
        ["email", email],
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        }
      );
    });
  }

  // static findUserById(id) {
  //   return new Promise((resolve, reject) => {
  //     db.query("SELECT * FROM users WHERE ?? =?", ["id", id], (err, result) => {
  //       if (err) reject(err);
  //       resolve(result);
  //     });
  //   });
  // }

  static handleReferral(referralCode) {
    return new Promise((resolve, reject) => {
      const companyId = 1;
      // const id = insertId;
      console.log("Referral Code Received:", referralCode); 

      if (referralCode) {
        // If referral code is provided, check for a matching user
        db.query(
          "SELECT id FROM Users WHERE referral_code = ?",
          [referralCode],
          (err, results) => {
            if (err) return reject(err);

            if (results.length > 0) {
              // If referral code is valid, increment the user's referral count
              const userId = results[0].id;
              db.query(
                "UPDATE Users SET referral_count = referral_count + 1 WHERE id = ?",
                [userId],
                (err, result) => {
                  if (err) return reject(err);
                  resolve({ result, userId, message: "Referral count updated for referrer" });
                }
              );
            } else {
              // If referral code is invalid, increment the company referral count
              db.query(
                "UPDATE Users SET referral_count = referral_count + 1 WHERE id = ?",
                [companyId],
                (err, result) => {
                  if (err) return reject(err);
                  resolve({result, companyId, message:"Referral count updated for company"});
                }
              );
            }
          }
        );
      } else if(!referralCode) {
        // If no referral code is provided, add to company account by default
        console.log("No referral code provided, updating company referral count...");
        db.query(
          "UPDATE Users SET referral_count = referral_count + 1 WHERE id = ?",
          [companyId],
          (err, result) => {
            if (err) {
              console.error("Error updating company referral count:", err);
              return reject(err);
            }
            resolve({
              result,
              companyId,
              message: "Referral count updated for company",
            });
          }
        );
      }
    });
  }
}; 
//       } else {
//         // If no referral code, add to company account by default
//         db.query(
//           "UPDATE Users SET referral_count = referral_count + 1 WHERE id = ?",
//           [companyId],
//           (err, result) => {
//             if (err) return reject(err);
//             resolve({result, companyId, message: "Referral count updated for company"});
//           }
//         );
//       }
//     });
//   }
// }

module.exports = Auth;

// {
//   "first_name": "",
//   "last_name": "",
//   "email": "",
//   "phone": "",
//   "password": "",
//   "confirm_password": "",
//   "referral_code": "",
//   "country": ""
//   }

