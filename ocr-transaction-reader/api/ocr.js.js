const Tesseract = require('tesseract.js');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    console.log('Processing image from URL:', imageUrl);

    // OCR processing dengan Tesseract
    const { data: { text, confidence } } = await Tesseract.recognize(
      imageUrl,
      'eng',
      {
        logger: m => console.log(m),
        tessedit_char_whitelist: '0123456789',
        psm: 7,
      }
    );

    // Extract hanya angka dari hasil OCR
    const numbers = text.replace(/[^\d]/g, '');
    
    console.log('OCR Results:', {
      rawText: text,
      extractedNumbers: numbers,
      confidence: confidence
    });

    res.status(200).json({
      success: true,
      extractedNumbers: numbers,
      rawText: text,
      confidence: confidence,
      message: numbers ? 'Numbers extracted successfully' : 'No numbers found'
    });

  } catch (error) {
    console.error('OCR Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      extractedNumbers: null
    });
  }
};