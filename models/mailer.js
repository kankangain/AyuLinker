const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", 
  auth: {
    user: process.env.EMAIL_USER,   
    pass: process.env.EMAIL_PASS    
  }
});

async function sendOTP(email, otp) {
  const mailOptions = {
    from: `"AyuLinker" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "OTP for AyuLinker Registration",
    text: `Thank You for registering with Ayulinker. Your OTP is ${otp}. It will expire in 5 minutes.`
  };
  await transporter.sendMail(mailOptions);
}

module.exports = sendOTP;
