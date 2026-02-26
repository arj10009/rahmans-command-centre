const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Rahman\'s backend is running! 👑' });
});

/**
 * POST /api/voice/process
 * Handles voice transcription and parsing
 *
 * Body:
 * - audio: base64 encoded audio data
 * - context: 'calendar' or 'todo'
 */
app.post('/api/voice/process', async (req, res) => {
  try {
    const { audio, context } = req.body;

    if (!audio || !context) {
      return res.status(400).json({ error: 'Missing audio or context' });
    }

    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Decode base64 audio to buffer
    const audioBuffer = Buffer.from(audio, 'base64');

    // Step 1: Transcribe audio using Whisper
    console.log('🎤 Transcribing audio...');
    const transcript = await transcribeAudio(audioBuffer);

    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ error: 'Could not transcribe audio' });
    }

    console.log(`📝 Transcript: "${transcript}"`);

    // Step 2: Parse transcript with GPT-4.1-mini based on context
    console.log(`🤖 Parsing with GPT-4.1-mini (context: ${context})...`);
    const parsed = await parseWithGPT(transcript, context);

    console.log('✅ Processing complete');
    res.json({
      transcript,
      parsed,
      context
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      error: error.message || 'Processing failed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Transcribe audio using OpenAI Whisper API
 */
async function transcribeAudio(audioBuffer) {
  try {
    const form = new FormData();
    form.append('file', audioBuffer, 'audio.webm');
    form.append('model', 'whisper-1');

    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        timeout: 30000
      }
    );

    return response.data.text || '';
  } catch (error) {
    console.error('Whisper API error:', error.response?.data || error.message);
    throw new Error(`Transcription failed: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Parse transcript using GPT-4.1-mini
 */
async function parseWithGPT(transcript, context) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });

  let systemPrompt;

  if (context === 'calendar') {
    systemPrompt = `You are a calendar assistant for Rahman. Today is ${dayName}, ${todayStr}.
Extract calendar events from user speech. Return ONLY valid JSON, no markdown, no code blocks:
{"events": [{"title": "string", "date": "YYYY-MM-DD", "time": "HH:MM" or null}]}
If user says "tomorrow", "next Monday", etc., calculate the correct date.
If no specific time mentioned, set time to null.
Always return an array, even if empty.`;
  } else {
    systemPrompt = `You are a to-do list assistant for Rahman.
Extract tasks from user speech. Return ONLY valid JSON, no markdown, no code blocks:
{"tasks": [{"title": "string", "priority": "high" or "medium" or "low", "notes": "string or empty"}]}
Infer priority: "urgent", "ASAP", "important" = high. "whenever", "at some point" = low. Default = medium.
Extract extra details as notes. Always return an array, even if empty.`;
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: transcript }
        ],
        temperature: 0.2,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const content = response.data.choices[0].message.content.trim();

    // Parse JSON, handling potential markdown code fences
    let jsonStr = content;
    if (jsonStr.includes('```')) {
      jsonStr = jsonStr.replace(/```(?:json)?\s*/g, '').trim();
    }

    const parsed = JSON.parse(jsonStr);
    return parsed;
  } catch (error) {
    console.error('GPT API error:', error.response?.data || error.message);
    throw new Error(`Parsing failed: ${error.response?.data?.error?.message || error.message}`);
  }
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n👑 Rahman's Backend Server\n`);
  console.log(`✅ Running on http://localhost:${PORT}`);
  console.log(`📝 Transcript endpoint: POST /api/voice/process`);
  console.log(`💚 Health check: GET /health\n`);
});
