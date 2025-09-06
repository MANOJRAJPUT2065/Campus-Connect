import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import os from 'os';
import path from 'path';
import OpenAI from 'openai';

dotenv.config();

const router = express.Router();

// Optional providers
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_STT_MODEL = process.env.OPENAI_STT_MODEL || 'whisper-1';

let openai = null;
if (OPENAI_API_KEY) {
  try {
    openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    console.log('✅ Voice: OpenAI client ready for STT');
  } catch (e) {
    console.log('⚠️  Voice: failed to init OpenAI client:', e?.message || e);
  }
}

// POST /api/voice/tts -> generate speech audio (base64)
router.post('/tts', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }

    if (!ELEVENLABS_API_KEY || !ELEVENLABS_VOICE_ID) {
      return res.status(503).json({ success: false, error: 'TTS not configured (missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID)' });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(ELEVENLABS_VOICE_ID)}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.4, similarity_boost: 0.7 }
      })
    });

    if (!response.ok) {
      const errTxt = await response.text();
      return res.status(500).json({ success: false, error: 'TTS provider error', details: errTxt.slice(0, 500) });
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return res.json({ success: true, contentType: 'audio/mpeg', audioBase64: base64 });

  } catch (error) {
    console.error('TTS error:', error);
    return res.status(500).json({ success: false, error: 'Failed to synthesize speech' });
  }
});

// POST /api/voice/stt -> transcribe audio (base64)
// Body: { audioBase64: string, mimeType?: string }
router.post('/stt', async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body || {};
    if (!audioBase64) {
      return res.status(400).json({ success: false, error: 'audioBase64 is required' });
    }
    if (!openai) {
      return res.status(503).json({ success: false, error: 'STT not configured (missing OPENAI_API_KEY)' });
    }

    // Write temp file for OpenAI Whisper
    const buf = Buffer.from(audioBase64, 'base64');
    const tmp = path.join(os.tmpdir(), `upload-${Date.now()}.webm`);
    await fs.promises.writeFile(tmp, buf);

    try {
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tmp),
        model: OPENAI_STT_MODEL,
      });
      return res.json({ success: true, text: transcription.text || '' });
    } finally {
      fs.promises.unlink(tmp).catch(() => {});
    }
  } catch (error) {
    console.error('STT error:', error);
    return res.status(500).json({ success: false, error: 'Failed to transcribe audio' });
  }
});

export default router;


