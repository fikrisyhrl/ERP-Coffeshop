let app;

try {
  app = require('../server');
} catch (err) {
  console.error('Fatal initialization error in server.js on Vercel:', err);
  const express = require('express');
  app = express();
  app.use((req, res) => {
    res.status(500).json({
      success: false,
      error: 'Vercel Serverless Function Initialization Error',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });
}

// Handler Serverless Function Vercel
module.exports = app;
