const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Vercel serverless function wrapper for Express
const submitHandler = require('./api/submit');
app.post('/api/submit', submitHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`=============================================================`);
  console.log(`  SURYA E.M High School Admission Portal Local Server`);
  console.log(`  Running at: http://localhost:${PORT}`);
  console.log(`  Mock Mode : ${process.env.MOCK_MODE === 'true' ? 'ENABLED (Simulating integration)' : 'DISABLED'}`);
  console.log(`=============================================================`);
});
