import { Router } from 'express';
import { db } from '../db/database.js';
import { generateMacroMarketOverview } from '../intelligence/gemini.js';
import { MacroIntelligenceEngine } from '../intelligence/macroIntelligence.js';
import { IntradayMarketMapEngine } from '../intelligence/intradayMarketMap.js';
import { ArahMarketEngine } from '../intelligence/arahMarketEngine.js';
import { CentralMarketContextEngine } from '../intelligence/centralMarketContext.js';
import { DailyReportEngine, WeeklyReportEngine } from '../intelligence/dailyReportEngine.js';
import { requireAuth, AuthenticatedRequest } from '../auth/authService.js';
import { EntitlementService } from '../auth/entitlementService.js';

export const intelligenceRouter = Router();

// GET Central Market Context (Single Source of Truth)
intelligenceRouter.get('/central-context', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const context = await CentralMarketContextEngine.getCentralContext(forceRefresh);
    res.json({
      success: true,
      context,
      timestamp: context.timestamp,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Executive Daily Market Report
intelligenceRouter.get('/daily-report', async (req, res) => {
  try {
    const lang = (req.query.lang === 'en' ? 'en' : 'id') as 'id' | 'en';
    const dateStr = req.query.date as string | undefined;
    const report = await DailyReportEngine.getDailyReport(lang, false, dateStr);
    res.json({
      success: true,
      report,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Force-regenerate Daily Market Report
intelligenceRouter.post('/daily-report/generate', async (req, res) => {
  try {
    const lang = (req.body.lang === 'en' || req.query.lang === 'en' ? 'en' : 'id') as 'id' | 'en';
    const report = await DailyReportEngine.getDailyReport(lang, true);
    res.json({
      success: true,
      report,
      refreshed: true,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Weekly Market Synthesis Report
intelligenceRouter.get('/weekly-report', async (req, res) => {
  try {
    const lang = (req.query.lang === 'en' ? 'en' : 'id') as 'id' | 'en';
    const weekStr = req.query.week as string | undefined;
    const report = await WeeklyReportEngine.getWeeklyReport(lang, false, weekStr);
    res.json({
      success: true,
      report,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Force-regenerate Weekly Market Synthesis Report
intelligenceRouter.post('/weekly-report/generate', async (req, res) => {
  try {
    const lang = (req.body.lang === 'en' || req.query.lang === 'en' ? 'en' : 'id') as 'id' | 'en';
    const report = await WeeklyReportEngine.getWeeklyReport(lang, true);
    res.json({
      success: true,
      report,
      refreshed: true,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Expected vs Actual Learning Matrix
intelligenceRouter.get('/expected-vs-actual', async (req, res) => {
  try {
    const category = req.query.category as string | undefined;
    const impact = req.query.impact as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const items = db.getExpectedVsActualList(category, impact, limit);
    res.json({
      success: true,
      items,
      count: items.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Historical Market Memory & Regime Transition Analysis
intelligenceRouter.get('/historical-memory', async (req, res) => {
  try {
    const analysis = db.getHistoricalMemoryAnalysis();
    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Reports Archive List (Daily & Weekly)
intelligenceRouter.get('/reports-archive', async (_req, res) => {
  try {
    const archive = db.getReportsArchive();
    res.json({
      success: true,
      archive,
      count: archive.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Segment: ARAH MARKET HARI INI (Intraday Triple-Confluence Synthesis)
intelligenceRouter.get('/arah-market', async (req, res) => {
  try {
    const data = await ArahMarketEngine.getArahMarketToday();
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Today's Intraday Market Map (for 13 core assets)
intelligenceRouter.get('/intraday-map', async (req, res) => {
  const map = await IntradayMarketMapEngine.getIntradayMarketMap();
  res.json({
    market_map: map,
    count: map.length,
    timestamp: new Date().toISOString(),
  });
});

// GET active market themes
intelligenceRouter.get('/themes', async (req, res) => {
  const rawThemes = await db.getMarketThemes();
  const themes = rawThemes.map(t => ({
    ...t,
    driver: (t as any).driver || 'Macro Catalyst',
    primary_assets: t.primary_assets || (t as any).affected_assets || [],
    affected_assets: (t as any).affected_assets || t.primary_assets || [],
    affected_currencies: (t as any).affected_currencies || ['USD'],
  }));
  res.json({
    themes,
    count: themes.length,
    timestamp: new Date().toISOString(),
  });
});

// GET Central Bank Speeches analysis
// Classification: HAWKISH / DOVISH / NEUTRAL / MIXED
// WHAT WAS SAID -> WHAT CHANGED -> WHY IT MATTERS -> CURRENCY IMPACT -> ASSET RELEVANCE
intelligenceRouter.get('/central-bank-speeches', (req, res) => {
  const speeches = MacroIntelligenceEngine.getCentralBankSpeeches();
  res.json({
    speeches,
    count: speeches.length,
    timestamp: new Date().toISOString(),
  });
});

// GET 8-Currency Macro Context (USD, EUR, GBP, JPY, AUD, NZD, CAD, CHF)
// Inflation + Employment + Growth + PMI + Interest Rate + Tone + Strength -> STRONG / WEAK / MIXED
intelligenceRouter.get('/macro-context', async (req, res) => {
  const contexts = await MacroIntelligenceEngine.getCurrencyMacroContext();
  res.json({
    contexts,
    count: contexts.length,
    timestamp: new Date().toISOString(),
  });
});

// GET Unified Multimodal Market Context
// Merging NEWS + MACRO + CENTRAL BANK + CURRENCY STRENGTH + MARKET DATA
intelligenceRouter.get('/unified-context', async (req, res) => {
  const unified = await MacroIntelligenceEngine.getUnifiedMarketContext();
  res.json({
    context: unified,
    timestamp: new Date().toISOString(),
  });
});

// GET market impacts
intelligenceRouter.get('/impact', async (req, res) => {
  const events = await db.getAllEvents(20);
  const prices = await db.getAllMarketPrices();
  const strength = await db.getCurrencyStrength();

  // Aggregate high-impact cross correlations
  const highImpactEvents = events.filter(e => e.impact_level === 'CRITICAL' || e.impact_level === 'HIGH');

  res.json({
    high_impact_events: highImpactEvents,
    currency_dispersion: strength,
    market_overview_prices: prices.map(p => ({
      symbol: p.symbol,
      price: p.price,
      change_24h_pct: p.change_24h_pct,
      status: p.status,
    })),
    timestamp: new Date().toISOString(),
  });
});

// GET asset & currency relationship matrix
intelligenceRouter.get('/relationships', (req, res) => {
  const matrix = [
    {
      driver: 'US CPI / Inflation',
      sensitive_currencies: ['USD'],
      primary_assets: ['XAUUSD', 'US100', 'US500', 'US30', 'BTC'],
      transmission_mechanism: 'Shifts real rate discount curve and Treasury yields, directly dictating US Dollar liquidity.',
    },
    {
      driver: 'Federal Reserve FOMC / Powell Rate Decision',
      sensitive_currencies: ['USD', 'EUR', 'JPY'],
      primary_assets: ['XAUUSD', 'US100', 'BTC', 'US500'],
      transmission_mechanism: 'Alters cost of capital; directly impacts gold opportunity cost and high-beta crypto liquidity.',
    },
    {
      driver: 'Bank of Japan Rate Policy & Carry Trade',
      sensitive_currencies: ['JPY', 'USD'],
      primary_assets: ['US100', 'XAUUSD'],
      transmission_mechanism: 'Yen strengthening forces global margin deleveraging across equity index futures.',
    },
    {
      driver: 'Geopolitical Conflict / War Escalation',
      sensitive_currencies: ['CHF', 'USD', 'JPY'],
      primary_assets: ['XAUUSD', 'US30'],
      transmission_mechanism: 'Flight to safety stimulates physical bullion and sovereign bond allocations.',
    },
    {
      driver: 'Crude Oil & OPEC+ Supply Restrictions',
      sensitive_currencies: ['CAD', 'USD'],
      primary_assets: ['US30', 'US500'],
      transmission_mechanism: 'Energy price inflation cascades into consumer cost pressures and transport logistics.',
    },
  ];

  res.json({
    relationship_matrix: matrix,
    timestamp: new Date().toISOString(),
  });
});

// GET latest AI market overview
intelligenceRouter.get('/ai', async (req, res) => {
  let overview = await db.getLatestMarketOverviewAnalysis();
  if (!overview) {
    try {
      overview = await generateMacroMarketOverview();
    } catch (err: any) {
      console.warn('[AI Router] Notice on initial overview fetch:', err.message);
    }
  }

  res.json({
    market_overview: overview,
    timestamp: new Date().toISOString(),
  });
});

// POST refresh AI market overview (Requires authentication, AI_OVERVIEW_REFRESH permission, and usage check)
intelligenceRouter.post('/ai/refresh', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  
  // Check permission
  if (!EntitlementService.canAccessFeature(user, 'AI_OVERVIEW_REFRESH')) {
    res.status(403).json({
      error: 'Upgrade Required: AI Market Overview refresh is available on PRO and INSTITUTIONAL tiers.',
      code: 'PLAN_UPGRADE_REQUIRED',
      required_permission: 'AI_OVERVIEW_REFRESH',
      current_plan: user.plan || 'FREE',
    });
    return;
  }

  // Check and increment usage limits
  const usageCheck = EntitlementService.checkAndIncrementAIUsage(user.id, user);
  if (!usageCheck.allowed) {
    res.status(429).json({
      error: `Daily limit reached: Your ${user.plan || 'FREE'} plan allows ${usageCheck.limit} AI generations per day.`,
      code: 'USAGE_LIMIT_REACHED',
      limit: usageCheck.limit,
      used: usageCheck.used,
    });
    return;
  }

  try {
    const freshOverview = await generateMacroMarketOverview();
    res.json({
      success: true,
      market_overview: freshOverview,
      usage: {
        used: usageCheck.used,
        limit: usageCheck.limit,
        remaining: usageCheck.remaining,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
