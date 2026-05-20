// server.js
import express from 'express';
import bodyParser from 'body-parser';
import twilio from 'twilio';

const app = express();
app.use(bodyParser.json());

// Check if environment variables are set
const { TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM } = process.env;
if (!TWILIO_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM) {
  console.error('Twilio environment variables are missing! Please set TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM.');
}

// Only create Twilio client if variables exist
let client;
if (TWILIO_SID && TWILIO_AUTH_TOKEN) {
  client = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);
}

// In-memory OTP store (for testing; replace with DB in production)
const otps = {};

// Health check / landing page
app.get('/', (req, res) => {
  res.send('✅ SMS Backend Running Successfully');
});

// Send OTP endpoint
app.post('/send-otp', async (req, res) => {
  if (!client) return res.status(500).json({ error: 'Twilio not configured properly' });

  const { mobile } = req.body;
  if (!mobile) return res.status(400).json({ error: 'Mobile number is required' });

  const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
  otps[mobile] = otp;

  try {
    await client.messages.create({
      body: `Your verification code is ${otp}`,
      from: TWILIO_FROM,
      to: mobile
    });
    res.json({ message: 'OTP sent successfully' }); // Remove OTP from response in production
  } catch (err) {
    res.status(500).json({ error: 'Failed to send OTP', details: err.message });
  }
});

// Verify OTP endpoint
app.post('/verify-otp', (req, res) => {
  const { mobile, otp } = req.body;
  if (!mobile || !otp) return res.status(400).json({ error: 'Mobile and OTP required' });

  if (otps[mobile] && Number(otp) === otps[mobile]) {
    delete otps[mobile]; // OTP used
    res.json({ message: 'OTP verified successfully' });
  } else {
    res.status(400).json({ error: 'Invalid OTP' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
