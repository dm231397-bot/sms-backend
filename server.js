// server.js
import express from 'express';
import bodyParser from 'body-parser';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config(); // load environment variables

const app = express();
app.use(bodyParser.json());

// Twilio client using environment variables
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Temporary in-memory OTP store (for testing)
const otps = {};

// Endpoint to send OTP
app.post('/send-otp', async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) return res.status(400).json({ error: 'Mobile number required' });

  const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
  otps[mobile] = otp; // store OTP temporarily

  try {
    await client.messages.create({
      body: `Your verification code is ${otp}`,
      from: process.env.TWILIO_FROM, // Twilio phone number
      to: mobile
    });

    res.json({ message: 'OTP sent successfully' }); // remove otp in production
  } catch (err) {
    res.status(500).json({ error: 'Failed to send OTP', details: err.message });
  }
});

// Endpoint to verify OTP
app.post('/verify-otp', (req, res) => {
  const { mobile, otp } = req.body;
  if (otps[mobile] && Number(otp) === otps[mobile]) {
    delete otps[mobile]; // OTP used, remove
    res.json({ message: 'OTP verified successfully' });
  } else {
    res.status(400).json({ error: 'Invalid OTP' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
