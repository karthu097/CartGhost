import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { analyzeWithGemini } from './geminiService';
import type { AnalyzeRequest, AnalyzeResponse, AnalyzeErrorResponse } from './types';

// Load .env from the project root (one level up from server/)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST'],
  credentials: false,
}));
app.use(express.json({ limit: '50kb' }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  const hasKey = Boolean(GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here');
  res.json({
    status: 'ok',
    geminiConfigured: hasKey,
    mode: hasKey ? 'gemini' : 'fallback',
    timestamp: new Date().toISOString(),
  });
});

// ── Main analysis endpoint ─────────────────────────────────────────────────────
app.post('/api/analyze', async (req: Request, res: Response) => {
  const body = req.body as AnalyzeRequest;

  // Validate required fields
  if (!body.cartId || !body.customerName || body.cartValue === undefined) {
    const errResp: AnalyzeErrorResponse = {
      success: false,
      error: 'Missing required fields: cartId, customerName, cartValue',
      source: 'fallback',
    };
    return res.status(400).json(errResp);
  }

  // Check API key
  const hasKey = Boolean(GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here');

  if (!hasKey) {
    const errResp: AnalyzeErrorResponse = {
      success: false,
      error: 'GEMINI_API_KEY not configured — using fallback engine',
      source: 'fallback',
    };
    return res.status(503).json(errResp);
  }

  try {
    const decision = await analyzeWithGemini(body, GEMINI_API_KEY);
    return res.json(decision);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[CartGhost] Gemini API error:', message);
    const errResp: AnalyzeErrorResponse = {
      success: false,
      error: `Gemini API error: ${message}`,
      source: 'fallback',
    };
    return res.status(502).json(errResp);
  }
});

// ── Global error handler ───────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[CartGhost] Unhandled error:', err.message);
  res.status(500).json({ success: false, error: 'Internal server error', source: 'fallback' });
});

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  const hasKey = Boolean(GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here');
  console.log(`\n🚀 CartGhost API server running on http://localhost:${PORT}`);
  console.log(`🤖 AI Mode: ${hasKey ? '✅ Gemini 3.5 Flash' : '⚠️  Fallback (no GEMINI_API_KEY)'}`);
  if (!hasKey) {
    console.log('   → Set GEMINI_API_KEY in .env to enable Gemini AI');
  }
  console.log(`🏥 Health: http://localhost:${PORT}/api/health\n`);
});

export default app;
