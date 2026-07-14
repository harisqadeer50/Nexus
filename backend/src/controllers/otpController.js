const nodemailer = require('nodemailer');
const User = require('../models/User');

// Store OTPs temporarily in memory
const otpStore = {};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Send OTP to email
// @route   POST /api/otp/send
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = generateOTP();

    // Store OTP with 5 minute expiry
    otpStore[email] = {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };

    // Create transporter - using Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Nexus Platform - Your OTP Code',
      html: `
        <h2>Your OTP Code</h2>
        <p>Your one-time password is:</p>
        <h1 style="color: #4F46E5; font-size: 36px; letter-spacing: 8px;">${otp}</h1>
        <p>This code expires in 5 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: `OTP sent to ${email}` });

  } catch (error) {
    // For demo purposes - if email fails, return OTP directly
    const email = req.body.email;
    if (otpStore[email]) {
      return res.status(200).json({
        message: 'Email service unavailable - Demo OTP below',
        demoOTP: otpStore[email].otp,
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/otp/verify
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const storedData = otpStore[email];

    if (!storedData) {
      return res.status(400).json({ message: 'No OTP found for this email' });
    }

    if (Date.now() > storedData.expiresAt) {
      delete otpStore[email];
      return res.status(400).json({ message: 'OTP has expired' });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // OTP is valid - clear it
    delete otpStore[email];

    res.status(200).json({ message: 'OTP verified successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { sendOTP, verifyOTP };