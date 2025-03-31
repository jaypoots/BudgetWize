// Required dependencies
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Google Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Create an Express app
const app = express();
const port = process.env.PORT || 3000;

// Use middleware
app.use(cors({
    origin: 'http://127.0.0.1:5500', // Adjust to match your frontend's URL
}));
app.use(express.json()); // Parse incoming JSON requests

// MySQL connection setup
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'capstone',
});

// Test MySQL connection
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  }
  console.log('Connected to MySQL as ID ' + db.threadId);
});

// POST route to add credit card data
app.post('/api/credit-cards', (req, res) => {
  const { userId, cardNumber, expiryDate, cvv, balance, monthlyPayment, apr, subscriptions } = req.body;

  // Validate inputs
  if (!userId || !cardNumber || !expiryDate || !cvv || !balance || !monthlyPayment || !apr) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // SQL query to insert data into the CREDIT_CARDS table
  const query = `
  INSERT INTO CREDIT_CARDS (user_id, card_number, expiry_date, cvv, balance, monthly_payment, apr, subscriptions)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

  // Execute the query with user data
  db.query(query, [userId, cardNumber, expiryDate, cvv, balance, monthlyPayment, apr, subscriptions], (err, result) => {
    if (err) {
      console.error('Error saving credit card data:', err);
      res.status(500).json({ message: 'Error saving credit card data', error: err.message });
      return;
    }
    res.status(200).json({ message: 'Credit card data saved successfully!' });
  });
});

// POST route to interact with Google Gemini
app.post('/api/gemini', async (req, res) => {
  const { prompt } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' }); // Changed model name
    const result = await model.generateContent(prompt);
    const response = result.response.text(); // Ensure it's the correct type here

    res.status(200).json({ response });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ error: 'Error generating content with Gemini API' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});


