// ==================== Express Server with API Proxy ====================
// Virtual Data - Poker Hand Logger Server
// Version: 3.6.0 - Security Enhanced

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static('.'));

// ==================== API Proxy Routes ====================

/**
 * Gemini API Proxy
 * Hides API key from client-side code
 */
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({
        success: false,
        error: 'Image data is required'
      });
    }

    // Validate API key exists
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: GEMINI_API_KEY not set'
      });
    }

    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

    // Forward request to Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: "분석할 포커 칩 이미지입니다. 각 컬러별 칩 개수를 정확히 세어주세요."
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageData
              }
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[Gemini API Error]', response.status, errorData);
      return res.status(response.status).json({
        success: false,
        error: `Gemini API error: ${response.statusText}`
      });
    }

    const data = await response.json();

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('[API Proxy Error]', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== Health Check ====================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '3.6.0',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// ==================== Default Route ====================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ==================== Error Handling ====================

app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// ==================== Start Server ====================

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ======================================');
  console.log('   Virtual Data - Poker Hand Logger');
  console.log('   Version: 3.6.0 - Security Enhanced');
  console.log('🚀 ======================================');
  console.log('');
  console.log(`📄 Main App:    http://localhost:${PORT}/`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Environment:  ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 API Key:      ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log('');
  console.log('⚠️  Press Ctrl+C to stop the server');
  console.log('');
});
