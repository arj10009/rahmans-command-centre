const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const FormData = require('form-data');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TRANSCRIPTION_LANGUAGE = (process.env.TRANSCRIPTION_LANGUAGE || 'en').trim();
const MIN_VOICE_BYTES = 512;
const MIN_NOTE_VOICE_BYTES = 128;

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
    const { audio, context, mimeType, byteLength } = req.body;

    if (!audio || !context) {
      return res.status(400).json({ error: 'Missing audio or context' });
    }

    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Decode base64 audio to buffer
    const audioBuffer = Buffer.from(audio, 'base64');
    if (!audioBuffer.length || audioBuffer.length < MIN_VOICE_BYTES) {
      return res.status(400).json({
        error: 'No usable audio captured. Record for 1-2 seconds and try again.'
      });
    }

    // Step 1: Transcribe audio using Whisper
    console.log(`🎤 Transcribing audio... mime=${mimeType || 'unknown'} bytes=${audioBuffer.length} clientBytes=${byteLength || 'n/a'}`);
    const transcript = await transcribeAudio(audioBuffer, mimeType, {
      prompt: 'Transcribe clear spoken English for a personal productivity app. Names may include Rahman and Arjun.'
    });

    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ error: 'Could not transcribe audio' });
    }

    console.log(`📝 Transcript: "${transcript}"`);

    // Step 2: Parse transcript with GPT-4.1-mini based on context
    console.log(`🤖 Parsing with GPT-4.1-mini (context: ${context})...`);
    const parsed = await parseWithGPT(transcript, context);

    // Fallback for TODO extraction when model returns no tasks for usable speech
    if (context === 'todo') {
      if (!Array.isArray(parsed.tasks)) {
        parsed.tasks = [];
      }
      if (parsed.tasks.length === 0) {
        const fallbackTasks = fallbackTodoTasksFromTranscript(transcript);
        if (fallbackTasks.length > 0) {
          parsed.tasks = fallbackTasks;
          console.log('🛟 Applied fallback task extraction');
        }
      }
      console.log(`🧾 Parsed tasks count: ${parsed.tasks.length}`);
    }

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
 * POST /api/voice/transcribe
 * Transcribes raw audio and returns plain text only
 */
app.post('/api/voice/transcribe', async (req, res) => {
  try {
    const { audio, mimeType, byteLength } = req.body;

    if (!audio) {
      return res.status(400).json({ error: 'Missing audio' });
    }

    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const audioBuffer = Buffer.from(audio, 'base64');
    if (!audioBuffer.length || audioBuffer.length < MIN_NOTE_VOICE_BYTES) {
      return res.status(400).json({
        error: 'Audio is too short. Try speaking for at least 1 second.'
      });
    }

    console.log(`🎙️ Notes transcription... mime=${mimeType || 'unknown'} bytes=${audioBuffer.length} clientBytes=${byteLength || 'n/a'}`);
    const transcript = await transcribeAudio(audioBuffer, mimeType, {
      prompt: 'Transcribe spoken English note text accurately. Prefer English words only.'
    });

    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ error: 'Could not transcribe audio' });
    }

    res.json({ transcript });
  } catch (error) {
    console.error('❌ Notes transcription error:', error.message);
    res.status(500).json({
      error: error.message || 'Transcription failed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Transcribe audio using OpenAI Whisper API
 */
async function transcribeAudio(audioBuffer, rawMimeType, options = {}) {
  try {
    const { filename, contentType } = getAudioFileMeta(rawMimeType);
    const language = options.language || TRANSCRIPTION_LANGUAGE;
    const prompt = options.prompt || '';

    const form = new FormData();
    form.append('file', audioBuffer, { filename, contentType });
    form.append('model', 'whisper-1');
    if (language) {
      form.append('language', language);
    }
    if (prompt) {
      form.append('prompt', prompt);
    }
    form.append('temperature', '0');

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

function getAudioFileMeta(rawMimeType) {
  const normalized = (rawMimeType || 'audio/webm').split(';')[0].trim().toLowerCase();
  const extensionByMimeType = {
    'audio/webm': 'webm',
    'audio/mp4': 'mp4',
    'audio/x-m4a': 'm4a',
    'audio/m4a': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/ogg': 'ogg'
  };

  const extension = extensionByMimeType[normalized] || 'webm';
  return {
    filename: `audio.${extension}`,
    contentType: normalized || 'audio/webm'
  };
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
{"events": [{"title": "string", "date": "YYYY-MM-DD", "time": "HH:MM" or null, "notes": "string or empty"}]}
If user says "tomorrow", "next Monday", etc., calculate the correct date.
If no specific time mentioned, set time to null.
Put extra context in notes.
Always return an array, even if empty.`;
  } else {
    systemPrompt = `You are a to-do list assistant for Rahman.
Extract tasks from user speech. Return ONLY valid JSON, no markdown, no code blocks:
{"tasks": [{"title": "string", "priority": "high" or "medium" or "low", "notes": "string or empty"}]}
Infer priority: "urgent", "ASAP", "important" = high. "whenever", "at some point" = low. Default = medium.
Extract extra details as notes.
If transcript has at least one plausible actionable item, return at least one task.
Only return an empty array for pure filler/greeting/noise (e.g. "oh", "um", "hello").`;
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

function fallbackTodoTasksFromTranscript(transcript) {
  if (!transcript) {
    return [];
  }

  const cleaned = transcript
    .replace(/[^\w\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return [];
  }

  const lowered = cleaned.toLowerCase();
  const fillerOnly = new Set(['oh', 'uh', 'um', 'hmm', 'huh', 'hello', 'hi', 'hey', 'test']);
  if (fillerOnly.has(lowered)) {
    return [];
  }

  let title = cleaned
    .replace(/^(add|create|set|make|new)\s+(a\s+)?(task|todo)\s*/i, '')
    .replace(/^(todo|to do)\s*/i, '')
    .replace(/^(remind me to|i need to|need to)\s*/i, '')
    .trim();

  if (!title) {
    title = cleaned;
  }

  const words = title.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [];
  }

  // Avoid creating useless single-token noise tasks.
  if (words.length === 1 && words[0].length < 4) {
    return [];
  }

  if (title.length > 120) {
    title = `${title.slice(0, 117).trim()}...`;
  }

  return [{
    title: title.charAt(0).toUpperCase() + title.slice(1),
    priority: 'medium',
    notes: ''
  }];
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
