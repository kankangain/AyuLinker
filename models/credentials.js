const nodemailer = require("nodemailer");

// Generate a random username from firstname + lastname + 4-digit number
function generateUsername(firstname) {
  const cleanName = firstname.toLowerCase().replace(/\s+/g, "");
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const username = `${cleanName}${randomNum}`;
  return username;
}

function generateRandomPassword(length = 8, firstname = "") {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!%*?&";
  let pwd = "";
  for (let i = 0; i < length; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const namePart = firstname ? firstname.slice(0, 4) : "";
  return namePart + pwd;
}

// Send credentials email with user’s name
async function sendCredentials(email, firstname, lastname, username, plainPassword) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  const space = " ";
  const fullName = `${firstname}${space}${lastname}`;

  await transporter.sendMail({
    from: `"AyuLinker" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your AyuLinker Login Credentials",
   text: `👋 Hello ${fullName}\n
Welcome to AyuLinker 🌱\n
Your account has been created successfully.\n\n
Username: ${username}
Password: ${plainPassword}\n\n
Please keep this info safe 🔒 and do not share it.\n
We hope you enjoy using the app! ✨\n
~ AyuLinker Team`
  });
}

module.exports = {
  generateUsername,
  generateRandomPassword,
  sendCredentials
};
