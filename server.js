// server.js
import express from 'express';
import bodyParser from 'body-parser';
import twilio from 'twilio';
import cors from 'cors';

const app = express();
app.use(cors());          // Allow cross-origin requests
app.use(bodyParser.json());

const { TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM } = process.env;

// Twilio client
let client;
if (TWILIO_SID && TWILIO_AUTH_TOKEN) {
  client = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);
} else {
  console.error('Twilio environment variables missing! Set TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM on Render.');
}

// In-memory OTP store
const otps = {};

// Health check
app.get('/', (req, res) => {
  res.send('✅ SMS Backend Running Successfully');
});

// Send OTP
app.post('/send-otp', async (req, res) => {
  if (!client) return res.status(500).json({ error: 'Twilio not configured properly' });

  const { mobile } = req.body;
  if (!mobile) return res.status(400).json({ error: 'Mobile number required' });

  const otp = Math.floor(100000 + Math.random() * 900000);
  otps[mobile] = otp; // store temporarily

  try {
    await client.messages.create({
      body: `Your verification code is ${otp}`,
      from: TWILIO_FROM,
      to: mobile
    });
    res.json({ message: 'OTP sent successfully' }); // remove otp from response in production
  } catch (err) {
    res.status(500).json({ error: 'Failed to send OTP', details: err.message });
  }
});

// Verify OTP
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
