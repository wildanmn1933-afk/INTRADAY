/**
 * Shared Type Definitions for Real-Time Market Intelligence Platform
 */

export type UserRole = 'USER' | 'ADMIN';
export type SubscriptionPlan = 'FREE' | 'PRO' | 'INSTITUTIONAL';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  salt: string;
  name: string;
  role: UserRole;
  is_verified: boolean;
  verification_status?: 'pending_verification' | 'verified';
  avatar_url?: string;
  plan?: SubscriptionPlan;
  subscription_status?: 'active' | 'trialing' | 'canceled' | 'none' | 'pending';
  subscription_expires_at?: string;
  last_order_id?: string;
  payment_method?: string;
  billing_cycle?: 'monthly' | 'annual';
  created_at: string;
  updated_at: string;
}

export interface VerificationToken {
  id: string;
  user_id: string;
  email: string;
  token: string;
  code?: string; // 6-digit numeric OTP code
  expires_at: string;
  created_at: string;
  used_at?: string;
  type?: 'email_verification' | 'password_reset' | 'magic_link';
}

export interface UserPreferences {
  user_id: string;
  timezone: string;
  language: string;
  theme: 'dark' | 'midnight';
  default_market_view: string;
  density: 'compact' | 'normal';
  audio_alerts: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserWatchlist {
  id: string;
  user_id: string;
  symbol: string;
  asset_type: 'ASSET' | 'CURRENCY' | 'INDEX' | 'COMMODITY' | 'CRYPTO';
  notes?: string;
  added_at: string;
}

export interface UserAlert {
  id: string;
  user_id: string;
  symbol: string;
  condition: 'ABOVE' | 'BELOW' | 'IMPACT_HIGH' | 'BREAKING_EVENT';
  target_value?: number;
  is_active: boolean;
  triggered_at?: string;
  created_at: string;
}

export type SourceType = 'TELEGRAM' | 'CURRENCY_STRENGTH' | 'MARKET_DATA' | 'ECONOMIC_CALENDAR' | 'NEWS_WIRE';
export type SourceStatus = 'LIVE' | 'RECENT' | 'DELAYED' | 'HISTORICAL' | 'UNAVAILABLE' | 'ERROR';

export interface Source {
  id: string;
  name: string;
  type: SourceType;
  endpoint_url: string;
  is_enabled: boolean;
  status: SourceStatus;
  last_success_at: string | null;
  last_error_at: string | null;
  last_error_message: string | null;
  error_count: number;
  interval_seconds: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TelegramChannel {
  id: string;
  handle: string; // e.g. "@SM_News_24"
  title: string;
  source_id: string;
  is_enabled: boolean;
  language: string;
  last_scraped_message_id?: number | string;
  last_ingested_at: string | null;
  status: SourceStatus;
  error_count: number;
  created_at: string;
  updated_at: string;
}

export type NewsCategory = 'MACRO' | 'CENTRAL_BANK' | 'COMMODITY' | 'COMMODITIES' | 'CRYPTO' | 'EQUITIES' | 'EQUITY' | 'GEOPOLITICS' | 'MICRO';
export type NewsStatus = 'RAW' | 'PARSED' | 'NORMALIZED' | 'DEDUPLICATED' | 'EVENT_LINKED' | 'FAILED';

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source_id: string;
  source_name: string;
  source_url: string;
  language: string;
  published_at: string;
  received_at: string;
  updated_at: string;
  event_id: string | null;
  affected_assets: string[];
  affected_currencies: string[];
  category: NewsCategory;
  status: NewsStatus;
  raw_payload?: string;
  entities_extracted?: {
    figures?: string[];
    rates?: string[];
    organizations?: string[];
    direction?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  };
}

export type EventImpact = 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';

export interface PairImpact {
  pair: string; // e.g. 'XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'USDCHF', 'AUDUSD', 'US100', 'US500', 'US30', 'BTC'
  displayName?: string;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  strength: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'MILD';
  rationale: string;
  mechanism?: string;
  confidence?: number;
}

export interface MarketEvent {
  id: string; // Canonical Event ID
  title: string; // Canonical Event Title (e.g. "US CPI Rises 3.1% YoY in Latest Print")
  summary: string; // Concise, fact-grounded summary
  primary_category: NewsCategory;
  impact_level: EventImpact;
  first_detected_at: string;
  last_updated_at: string;
  source_count: number;
  source_names: string[];
  affected_assets: string[]; // e.g. ['XAUUSD', 'US100', 'US500', 'US30', 'BTC']
  affected_currencies: string[]; // e.g. ['USD', 'EUR']
  key_facts: string[];
  image_url?: string;
  is_duplicate_resolved: boolean;
  ai_analysis_id?: string;
  pair_impacts?: PairImpact[];
}

export interface EventSource {
  id: string;
  event_id: string;
  news_id: string;
  source_name: string;
  source_url: string;
  language: string;
  original_title: string;
  original_content: string;
  published_at: string;
  matched_reason: string;
  similarity_score: number;
  created_at: string;
}

export interface MarketPrice {
  symbol: string; // e.g. 'XAUUSD', 'BTC', 'US30', 'US500', 'US100', 'US10Y', 'DXY', 'EURUSD'
  display_name: string;
  asset_type: 'COMMODITY' | 'CRYPTO' | 'INDEX' | 'FOREX' | 'BOND';
  price: number;
  change_24h: number;
  change_24h_pct: number;
  high_24h: number;
  low_24h: number;
  volume_24h: number;
  source: string;
  timestamp: string;
  last_updated: string;
  status: SourceStatus;
  sparkline_1h: number[];
  tv_symbol?: string;
  tradingview_url?: string;
  is_delayed?: boolean;
}

export interface MarketSession {
  session_name: 'SYDNEY' | 'TOKYO' | 'LONDON' | 'NEW_YORK';
  is_open: boolean;
  opens_at_utc: string;
  closes_at_utc: string;
  current_status: 'OPEN' | 'CLOSED' | 'CLOSING_SOON';
}

export interface CurrencyStrength {
  currency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'NZD' | 'CAD' | 'CHF';
  strength_score: number; // 0.0 - 10.0 scale from provider
  change_direction: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  rank: number;
  source: string;
  timestamp: string;
  last_updated: string;
  status: SourceStatus;
  raw_delta?: number;
}

export interface CurrencyStrengthHistory {
  id: string;
  currency: string;
  strength_score: number;
  timestamp: string;
}

export interface EconomicEvent {
  id: string; // e.g. "Core CPI m/m", "Non-Farm Employment Change", "Federal Funds Rate"
  event_name: string;
  country_code: string; // e.g. "US", "EU", "GB", "JP"
  currency: string; // "USD", "EUR", "GBP", "JPY", etc.
  impact: EventImpact;
  date_time_utc: string;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
  revised_from?: string | null;
  status: 'UPCOMING' | 'RELEASED' | 'DELAYED';
  source: string;
  last_updated: string;
  data_status?: 'LIVE' | 'DELAYED' | 'UNAVAILABLE';
  // Measurable Intelligence fields
  surprise?: string | null; // Actual vs Forecast: e.g. "+0.2% (BEAT)", "-15K (MISS)", "IN-LINE"
  change?: string | null; // Actual vs Previous: e.g. "+0.1%", "-0.2%"
  confidence?: number; // 0 - 100
  freshness?: string; // age of data: e.g. "12m ago", "2h ago", "Upcoming"
  market_reaction?: {
    primary_asset: string;
    r1m?: string; // reaction after 1m e.g. "+14 pips" or "+0.18%"
    r5m?: string; // reaction after 5m
    r15m?: string; // reaction after 15m
    r1h?: string; // reaction after 1h
    r4h?: string; // reaction after 4h
  };
  fundamental_implication?: string; // Theoretical fundamental meaning
  actual_market_reaction?: string; // Real observed market reaction
}

export type CentralBankTone = 'HAWKISH' | 'DOVISH' | 'NEUTRAL' | 'MIXED';

export interface CentralBankSpeech {
  id: string;
  speaker: string; // e.g. "Jerome Powell (Fed Chair)", "Christine Lagarde (ECB President)"
  central_bank: 'FED' | 'ECB' | 'BOE' | 'BOJ' | 'RBA' | 'RBNZ' | 'BOC' | 'SNB';
  currency: string;
  title: string;
  date_time_utc: string;
  tone: CentralBankTone;
  what_was_said: string; // Core quotes and statements
  what_changed: string; // Shift compared to previous statement & recent data
  why_it_matters: string; // Strategic policy transmission mechanism
  currency_impact: string; // Direct effect on currency crosses
  asset_relevance: string; // Direct effect on XAUUSD, US100, Treasuries, BTC
  previous_stance: string;
  confidence: number;
  source: string;
  timestamp: string;
}

export type MacroConditionStatus = 'STRONG' | 'WEAK' | 'MIXED';

export interface CurrencyMacroContext {
  currency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'NZD' | 'CAD' | 'CHF';
  status: MacroConditionStatus;
  score: number; // 0.0 - 10.0 scale
  inflation: {
    value: string;
    assessment: 'ELEVATED' | 'TARGET' | 'COOLING' | 'SUB_TARGET';
    evidence: string;
  };
  employment: {
    value: string;
    assessment: 'ROBUST' | 'BALANCED' | 'SOFTENING' | 'WEAK';
    evidence: string;
  };
  growth: {
    value: string;
    assessment: 'EXPANSION' | 'STABLE' | 'SLOWDOWN' | 'CONTRACTION';
    evidence: string;
  };
  pmi: {
    value: string;
    assessment: 'EXPANSION' | 'NEUTRAL' | 'CONTRACTION';
    evidence: string;
  };
  interest_rate: {
    value: string;
    assessment: 'RESTRICTIVE' | 'NEUTRAL' | 'ACCOMMODATIVE';
    evidence: string;
  };
  central_bank_tone: {
    value: CentralBankTone;
    evidence: string;
  };
  currency_strength: {
    score: number;
    rank: number;
    direction: string;
  };
  evidence_summary: string;
  causal_chain: string; // e.g. "Inflation Sticky + Strong Labor -> Fed Cut Delay -> USD Yield Support"
  confidence: number;
  last_updated: string;
  source: string;
}

export interface UnifiedMarketContext {
  regime: string;
  sentiment: 'RISK_ON' | 'RISK_OFF' | 'MIXED' | 'NEUTRAL';
  summary: string;
  pillars: {
    news_wire_summary: string;
    macro_data_summary: string;
    central_bank_summary: string;
    currency_strength_summary: string;
    market_data_summary: string;
  };
  causal_conclusions: Array<{
    title: string;
    steps: string[];
    source: string;
    timestamp: string;
    evidence: string;
    confidence: number;
    status: 'BULLISH' | 'BEARISH' | 'MIXED' | 'INSUFFICIENT_CURRENT_DATA';
  }>;
  asset_outlook: Array<{
    asset: string;
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'MIXED';
    fundamental_implication: string;
    actual_market_reaction: string;
    confidence: number;
  }>;
  confidence: number;
  timestamp: string;
}

export interface MarketTheme {
  id: string;
  title: string;
  description: string;
  active_since: string;
  primary_assets: string[];
  sentiment: 'BULLISH' | 'BEARISH' | 'MIXED' | 'RISK_ON' | 'RISK_OFF';
  evidence_events: string[];
}

export interface AIAnalysis {
  id: string;
  event_id?: string;
  analysis_type: 'EVENT_ANALYSIS' | 'MARKET_OVERVIEW' | 'THEME_ANALYSIS';
  title: string;
  summary: string;
  context_data_used: {
    news_titles: string[];
    market_prices: Record<string, number>;
    currency_strength: Record<string, number>;
    macro_releases: string[];
  };
  key_implications: string[];
  affected_assets_outlook: Array<{
    asset: string;
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    rationale: string;
  }>;
  confidence: number;
  disclaimer: string;
  created_at: string;
  is_insufficient_data: boolean;
}

export interface SystemHealth {
  uptime_seconds: number;
  db_status: 'HEALTHY' | 'DEGRADED';
  active_sse_connections: number;
  total_events: number;
  total_news_items: number;
  total_sources: number;
  active_sources: number;
  last_ingest_time: string | null;
  ingest_error_count_24h: number;
}

export type MarketDirectionBias = 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'MIXED';

export interface IntradayAssetBias {
  symbol: string; // 'XAUUSD', 'BTC', 'US30', 'US500', 'US100', 'US10Y', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF'
  display_name: string;
  asset_type: 'COMMODITY' | 'CRYPTO' | 'INDEX' | 'FOREX' | 'BOND';
  price: number;
  change_24h_pct: number;
  sparkline_1h?: number[];
  
  // Overall Intraday Bias
  overall_bias: MarketDirectionBias;
  direction_score: number; // -100 to +100
  confidence: number; // 0 - 100%

  // Separated Biases
  fundamental_bias: MarketDirectionBias;
  fundamental_score: number; // -100 to +100
  price_action_bias: MarketDirectionBias;
  price_action_score: number; // -100 to +100

  // Evidence & Drivers
  top_drivers: string[]; // 3-5 specific drivers grounded in real data
  conflicting_factors: string[]; // Countervailing evidence
  today_key_catalyst: string; // Key event/speech/release impacting today
  current_market_reaction: string; // Actual intraday reaction observed
  conditions_to_change_bias: string; // Invalidation / pivot trigger
  
  // Data Integrity & Provenance
  source: string;
  timestamp: string;
  last_updated: string;
  status: SourceStatus;
  tv_symbol?: string;
  tradingview_url?: string;
}

export interface TodayCatalyst {
  id: string;
  event_name: string;
  date_time_utc: string;
  country_code: string;
  currency: string;
  importance: EventImpact;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
  surprise: string | null; // e.g. "+0.2% (BEAT)", "-15K (MISS)", "IN-LINE"
  change: string | null; // e.g. "+0.1%"
  related_assets: string[];
  status: 'UPCOMING' | 'RELEASED' | 'DELAYED';
  actual_market_reaction: string;
  fundamental_implication: string;
  source: string;
  last_updated: string;
  data_status: 'LIVE' | 'RECENT' | 'DELAYED' | 'UNAVAILABLE';
}

export interface DailyMarketSnapshot {
  id: string; // e.g. "snapshot_2026-09-19"
  date: string; // "YYYY-MM-DD"
  timestamp: string; // ISO
  title: string;
  market_biases: Record<string, {
    symbol: string;
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'MIXED';
    score: number;
    price: number;
    change_24h_pct: number;
    strength_label: string; // "Strong" | "Moderate" | "Weak"
    major_catalyst: string;
    last_updated: string;
  }>;
  currency_strength: Array<{
    currency: string;
    score: number;
    rank: number;
    direction: string;
    change_vs_yesterday?: number;
    change_vs_7d?: number;
  }>;
  major_catalysts: Array<{
    event_name: string;
    currency: string;
    impact: string;
    actual?: string | null;
    forecast?: string | null;
    market_reaction?: string;
  }>;
  market_reaction_summary: string;
  ai_summary: string;
  ai_why: string[];
  ai_risk: string[];
  ai_context: string[];
  historical_insights: string[];
  created_at: string;
}

export interface MarketMemoryInsight {
  id: string;
  type: 'CURRENCY' | 'ASSET' | 'CORRELATION' | 'MACRO';
  title: string;
  description: string;
  evidence: string;
  metric: string;
  confidence: number;
  created_at: string;
}

export interface HistoricalCurrencyComparison {
  currency: string;
  today_score: number;
  yesterday_score: number;
  three_day_score: number;
  seven_day_score: number;
  delta_yesterday: number;
  delta_3d: number;
  delta_7d: number;
  trend: 'STRENGTHENING' | 'WEAKENING' | 'STABLE';
}

// ==========================================
// SEGMENT: ARAH MARKET HARI INI (INTRADAY TRIPLE-CONFLUENCE)
// ==========================================

export type TripleConfluenceStatus =
  | 'HIGH_CONVICTION' // 3/3 Aligned (Fundamental + Intermarket + Price Action)
  | 'MODERATE'        // 2/3 Aligned
  | 'CAUTION_TRAP'    // Only 1/3 (Price Action opposes Fundamental/Intermarket)
  | 'NEUTRAL_CHOP';   // Indecisive / mixed flows

export type TradingSessionName = 'SYDNEY' | 'TOKYO' | 'LONDON' | 'NEW_YORK' | 'OVERLAP';

export interface IntermarketSpreadItem {
  id: string;
  name: string;
  formulaLabel: string;
  currentValue: number;
  unit: string;
  changeSessionBps: number;
  trend: 'WIDENING' | 'NARROWING' | 'STABLE';
  targetPair: string; // e.g. 'USDJPY', 'EURUSD', 'XAUUSD', 'US500'
  interpretation: string;
}

export interface CurrencyStrengthConfluenceItem {
  isForex: boolean;
  baseCurrency: string;
  baseScore: number;
  baseRank: number;
  quoteCurrency: string;
  quoteScore: number;
  quoteRank: number;
  netDifferential: number; // baseScore - quoteScore e.g. +1.8
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  alignment: 'CONFIRMED' | 'DIVERGENCE' | 'NEUTRAL';
  advantageLabel: string; // e.g. 'USD (#5, 4.3) leads JPY (#8, 0.5) by +3.8'
  summary: string;
}

export interface IntradayPairConfluence {
  pair: string;
  displayName: string;
  currentPrice: number;
  change24hPct: number;
  directionalBias: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH';
  confluenceStatus: TripleConfluenceStatus;
  convictionScore: number;
  // Currency Strength Confluence (Khusus Pasangan Forex)
  currencyStrength?: CurrencyStrengthConfluenceItem;
  fundamental: {
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    keyDriver: string;
    score: number;
  };
  intermarket: {
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    primarySymptom: string;
    score: number;
    spreadImpact?: string;
  };
  priceAction: {
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    structure: 'SESSION_BREAKOUT' | 'RETEST_SUPPORT' | 'RETEST_RESISTANCE' | 'CHOP_RANGE';
    actionableZone: string;
    score: number;
  };
  intradayPlan: {
    recommendedAction: 'LOOK_FOR_BUY' | 'LOOK_FOR_SELL' | 'WAIT_ON_SUPPORT' | 'CAUTION_NO_TRADE';
    invalidationTrigger: string;
    warningNote?: string;
  };
  tvSymbol?: string;
}

export interface IndexCorrelationMetrics {
  us100Price: number;
  us100Change: number;
  us30Price: number;
  us30Change: number;
  ratioUs100ToUs30: number; // e.g. 0.456 (US100 / US30)
  ratioTrend: 'OUTPERFORMING' | 'UNDERPERFORMING' | 'EQUAL';
  marketRotationRegime: 'TECH_LEADERSHIP' | 'FLIGHT_TO_VALUE' | 'BROAD_RALLY' | 'BROAD_SELLOFF' | 'BALANCED_ROTATION';
  regimeDescription: string;
  tacticalPlaybook: {
    preferredAsset: 'US100' | 'US30' | 'NEUTRAL';
    reason: string;
    yieldConditionTrigger: string;
  };
}

export interface ArahMarketTodayData {
  activeSession: TradingSessionName;
  sessionStatusText: string;
  globalRegime: {
    title: string;
    badgeColor: string;
    riskScore: number;
    dxyBiasVsOpen: 'ABOVE_OPEN' | 'BELOW_OPEN' | 'AT_OPEN';
    summaryNarrative: string;
    topCatalystHeadline?: string;
  };
  intermarketSpreads: IntermarketSpreadItem[];
  indexCorrelation?: IndexCorrelationMetrics;
  anomalyAlerts: Array<{
    id: string;
    severity: 'WARNING' | 'OPPORTUNITY';
    title: string;
    description: string;
    affectedPairs: string[];
    actionAdvice: string;
  }>;
  pairs: IntradayPairConfluence[];
  generatedAt: string;
}

export interface DailyReportAssetItem {
  symbol: string;
  name: string;
  price: number;
  change_24h_pct: number;
  category: 'FOREX' | 'COMMODITY' | 'CRYPTO' | 'INDEX' | 'BOND';
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  key_level_support?: string;
  key_level_resistance?: string;
  catalyst?: string;
}

export interface DailyReportCurrencyItem {
  currency: string;
  score: number;
  status: 'LEADER' | 'LAGGARD' | 'NEUTRAL';
  bias: 'STRONG' | 'WEAK' | 'MIXED';
}

// ==========================================
// MARKET INTELLIGENCE REPORTING SYSTEM
// ==========================================

export type EpistemicTag = 'FACT' | 'REACTION' | 'AI_INTERPRETATION' | 'UNCERTAINTY';

export type MarketImpactLevel = 'HIGH_IMPACT' | 'MODERATE_IMPACT' | 'LOW_IMPACT' | 'NO_SIGNIFICANT_REACTION';

export interface EpistemicStatement {
  text: string;
  tag: EpistemicTag;
  citation?: string;
}

export interface ExpectedVsActualItem {
  id: string;
  event_name: string;
  category: 'INFLATION' | 'CENTRAL_BANK' | 'EMPLOYMENT' | 'GROWTH' | 'GEOPOLITICS' | 'EARNINGS';
  expected_scenario: string; // "Inflation remains elevated → expectations for rate cuts decrease → USD potentially strengthens"
  actual_event: string;      // "Inflation came in below expectations (Core 2.8% vs 3.1% exp)"
  market_reaction: string;   // "US 10Y yields tumbled 9 bps, DXY plunged 0.6%, Gold surged $28/oz"
  observed_outcome: string;  // "Rate cut probabilities repriced higher; USD weakened and real yields declined"
  impact_level: MarketImpactLevel;
  date: string;
  assets_impacted: string[];
  historical_lesson: string;
}

export interface MarketImpactRankedEvent {
  id: string;
  headline: string;
  category: string;
  impact_level: MarketImpactLevel;
  price_reaction_magnitude: string; // e.g. "+1.42% in Gold, -0.68% in DXY"
  why_it_mattered_or_ignored: string; // Reason based on real market data
  epistemic_type: EpistemicTag;
  timestamp: string;
}

export interface DailyMarketReportData {
  id: string;
  title: string;
  reportDate: string;
  session: string;
  language: 'id' | 'en';
  generatedAt: string;
  isHistorical?: boolean;

  // 1. Executive Summary with epistemic distinctions
  executiveSummary: EpistemicStatement[];

  // 2. Overall Market Environment
  overallMarketEnvironment: {
    regime: string;
    riskScore: number;
    stance: 'RISK_ON' | 'RISK_OFF' | 'ROTATIONAL' | 'NEUTRAL';
    volatilityState: string;
    summary: string;
  };

  // 3. Major Macro Catalysts
  majorMacroCatalysts: Array<{
    id: string;
    catalyst: string;
    driver: string;
    impact_level: MarketImpactLevel;
    epistemic_tag: EpistemicTag;
    transmission_channel: string;
  }>;

  // 4. Important Economic Releases
  importantEconomicReleases: Array<{
    time: string;
    currency: string;
    event_name: string;
    forecast?: string;
    actual?: string;
    previous?: string;
    surprise_factor: 'ABOVE_CONSENSUS' | 'IN_LINE' | 'BELOW_CONSENSUS' | 'PENDING';
    market_reaction: string;
    impact_level: MarketImpactLevel;
  }>;

  // 5. Central Bank / Fed-related Developments
  centralBankDevelopments: {
    fedStance: string;
    ratePathExpectation: string;
    speechesAndComments: Array<{
      speaker: string;
      institution: string;
      quoteSummary: string;
      marketInterpretation: string;
      epistemic_tag: EpistemicTag;
    }>;
    yieldCurveImplication: string;
  };

  // 6. Fundamental Market Bias
  fundamentalMarketBias: Array<{
    asset: string;
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    conviction: 'HIGH' | 'MODERATE' | 'LOW';
    primaryDriver: string;
    realYieldEffect: string;
    liquidityCondition: string;
  }>;

  // 7. Asset Reaction
  assetReactions: {
    xauusd: {
      price: number;
      change24hPct: number;
      sessionHigh: number;
      sessionLow: number;
      primaryCatalyst: string;
      intermarketLinkage: string; // real yields & USD correlation
      technicalStructure: string;
      epistemic_tag: EpistemicTag;
    };
    majorIndices: {
      sp500: { price: number; change24hPct: number; analysis: string };
      nasdaq: { price: number; change24hPct: number; analysis: string };
      dow: { price: number; change24hPct: number; analysis: string };
      breadthAndLeadership: string;
      epistemic_tag: EpistemicTag;
    };
    fxCurrencyStrength: {
      dxyIndex: { price: number; change24hPct: number; driver: string };
      topStrongest: string;
      topWeakest: string;
      relativeYieldDifferentials: string;
      ranking: DailyReportCurrencyItem[];
    };
    cryptoAnalysis: {
      btcPrice: number;
      btcChange24hPct: number;
      ethPrice: number;
      ethChange24hPct: number;
      etfInstitutionalFlow: string;
      liquidityCorrelation: string;
      epistemic_tag: EpistemicTag;
    };
  };

  // 8. Important Price Action
  importantPriceAction: Array<{
    asset: string;
    sessionObserved: string;
    pattern: string;
    structuralObservation: string;
    volumeOrLiquidityCharacteristic: string;
  }>;

  // 9. Key Support / Resistance / Liquidity Areas
  keySupportResistanceLiquidity: Array<{
    asset: string;
    currentPrice: number;
    immediateSupport: string;
    majorSupport: string;
    immediateResistance: string;
    majorResistance: string;
    liquidityPoolZones: string;
  }>;

  // 10. Session Recaps
  sessionRecaps: {
    asia: {
      sessionRangeSummary: string;
      keyCatalystOrHeadline: string;
      liquidityFlows: string;
      handoverToLondon: string;
    };
    london: {
      sessionRangeSummary: string;
      keyCatalystOrHeadline: string;
      liquidityFlows: string;
      handoverToNewYork: string;
    };
    newYork: {
      sessionRangeSummary: string;
      keyCatalystOrHeadline: string;
      liquidityFlows: string;
      dayEndSettlement: string;
    };
  };

  // 11. Biggest Market Movers
  biggestMarketMovers: Array<{
    symbol: string;
    name: string;
    price: number;
    changePct: number;
    direction: 'SURGE' | 'DUMP' | 'ROTATE';
    catalystExplanation: string;
  }>;

  // 12. Catalysts That Actually Moved Price
  catalystsThatActuallyMovedPrice: MarketImpactRankedEvent[];

  // 13. Important News That Had Little or No Market Impact (No-impact filter!)
  importantNewsWithLittleOrNoImpact: Array<{
    headline: string;
    source: string;
    expectedImpactByRetail: string;
    actualMarketReaction: string;
    whyMarketIgnoredIt: string; // e.g. already priced in, superseded by treasury yields
  }>;

  // 14. Fundamental vs Price Action Relationship
  fundamentalVsPriceActionRelationship: Array<{
    asset: string;
    fundamentalNarrative: string;
    actualPriceBehavior: string;
    alignmentStatus: 'ALIGNED' | 'DIVERGENT' | 'TEMPORARILY_DISCONNECTED';
    inDepthExplanation: string;
  }>;

  // 15. What Changed During The Day
  whatChangedDuringTheDay: Array<{
    timeframe: string;
    previousState: string;
    catalystTrigger: string;
    newState: string;
    traderSignificance: string;
  }>;

  // 16. End-of-Day Market State
  endOfDayMarketState: {
    closingTone: string;
    overnightRiskFactors: string[];
    liquidityOutlook: string;
    crossAssetPositioning: string;
  };

  // 17. Key Takeaways
  keyTakeaways: string[];

  // 18. Expected vs Actual Learning Module
  expectedVsActualRecap: ExpectedVsActualItem[];

  // Quick reference pulse
  marketPulse: DailyReportAssetItem[];
}

export interface WeeklyMarketReportData {
  id: string;
  title: string;
  weekRange: string;
  weekNumber: number;
  year: number;
  language: 'id' | 'en';
  generatedAt: string;
  aggregatedDailyCount: number;

  // 1. Weekly Executive Summary with epistemic tags
  weeklyExecutiveSummary: EpistemicStatement[];

  // 2. Major Macro Themes
  majorMacroThemes: Array<{
    theme: string;
    narrative: string;
    persistence: 'EMERGING' | 'ESTABLISHED' | 'WANING';
    crossAssetImpact: string;
  }>;

  // 3. Biggest Catalysts
  biggestCatalysts: MarketImpactRankedEvent[];

  // 4. Economic Data Recap
  economicDataRecap: Array<{
    date: string;
    event_name: string;
    currency: string;
    consensus: string;
    actual: string;
    surpriseFactor: string;
    marketRepricing: string;
  }>;

  // 5. Central Bank / Monetary Policy Developments
  centralBankDevelopments: Array<{
    bank: string;
    weeklyShift: string;
    forwardGuidance: string;
    marketPricingImpact: string;
  }>;

  // 6. Asset Performance
  assetPerformance: {
    xauusd: {
      weeklyOpen: number;
      weeklyClose: number;
      changePct: number;
      weeklyHigh: number;
      weeklyLow: number;
      weeklyAnalysis: string;
      realYieldTransmission: string;
    };
    indices: {
      sp500ChangePct: number;
      nasdaqChangePct: number;
      dowChangePct: number;
      breadthAnalysis: string;
      sectorRotationSummary: string;
    };
    fxCurrencyStrengthChanges: Array<{
      currency: string;
      weeklyDelta: number;
      endOfWeekScore: number;
      trend: 'STRENGTHENING' | 'WEAKENING' | 'RANGE';
      primaryMacroDriver: string;
    }>;
    cryptoPerformance: {
      btcWeeklyChangePct: number;
      ethWeeklyChangePct: number;
      weeklyNarrative: string;
      macroLiquidityCorrelation: string;
    };
  };

  // 7. Volatility Environment
  volatilityEnvironment: {
    vixCurrent: number;
    vixWeeklyChange: number;
    volatilityRegime: 'COMPRESSED' | 'NORMAL' | 'EXPANDING' | 'ELEVATED';
    implicationForIntradayTraders: string;
  };

  // 8. Market Regime
  marketRegime: {
    currentRegime: string;
    regimeStability: 'STABLE' | 'TRANSITIONING' | 'VOLATILE';
    daysInCurrentRegime: number;
    shiftProbability: string;
    riskAppetiteSummary: string;
  };

  // 9. Major Price Action Events
  majorPriceActionEvents: Array<{
    day: string;
    asset: string;
    eventDescription: string;
    structuralSignificance: string;
  }>;

  // 10. Fundamental vs Price Action Comparison
  fundamentalVsPriceActionComparison: Array<{
    asset: string;
    fundamentalNarrative: string;
    weeklyPriceReality: string;
    relationshipStatus: 'COHERENT' | 'DECOUPLED' | 'OVERSHOT';
    analyticalLesson: string;
  }>;

  // 11. Expected Scenario vs Actual Outcome
  expectedVsActualOutcomes: ExpectedVsActualItem[];

  // 12. Catalysts With Strong Market Impact
  catalystsWithStrongMarketImpact: Array<{
    catalyst: string;
    assetImpacted: string;
    observedMagnitude: string;
    transmissionChannel: string;
    takeaway: string;
  }>;

  // 13. Catalysts With Weak / No Market Impact
  catalystsWithWeakOrNoMarketImpact: Array<{
    catalyst: string;
    whyIgnored: string;
    traderLesson: string;
  }>;

  // 14. Important Changes From Previous Week
  importantChangesFromPreviousWeek: Array<{
    metric: string;
    previousWeekState: string;
    currentWeekState: string;
    marketImplication: string;
  }>;

  // 15. Recurring Market Patterns
  recurringMarketPatterns: Array<{
    patternName: string;
    occurrenceContext: string;
    historicalConfirmationRate: string;
    thisWeekEvidence: string;
  }>;

  // 16. Cross-Asset Relationships
  crossAssetRelationships: Array<{
    pairOrRatio: string;
    historicalCorrelation: string;
    currentObservedBehavior: string;
    divergenceOrConfirmation: string;
  }>;

  // 17. Key Lessons From The Week
  keyLessonsFromWeek: string[];

  // 18. Next Week Watchlist
  nextWeekWatchlist: Array<{
    asset: string;
    thesis: string;
    keyCatalystToWatch: string;
    invalidationTrigger: string;
  }>;

  // 19. Important Upcoming Events
  importantUpcomingEvents: Array<{
    date: string;
    timeUtc: string;
    event_name: string;
    currency: string;
    expectedImpact: 'HIGH' | 'MODERATE';
    consensusNote: string;
  }>;

  // 20. Key Levels To Monitor
  keyLevelsToMonitor: Array<{
    asset: string;
    currentPrice: number;
    weeklyPivot: string;
    majorResistance: string;
    majorSupport: string;
    liquidityTarget: string;
  }>;
}

export interface HistoricalMemoryAnalysis {
  repeatedCatalysts: Array<{
    catalystName: string;
    frequencyCount: number;
    averageMarketReaction: string;
    primaryImpactedAssets: string[];
    typicalOutcome: string;
  }>;
  repeatedMarketReactions: Array<{
    scenario: string;
    historicalReactions: string[];
    frequencyScore: number;
    predictabilityScore: number; // 0-100
    riskDisclaimer: string;
  }>;
  marketRegimeTransitions: Array<{
    date: string;
    fromRegime: string;
    toRegime: string;
    triggeringCatalyst: string;
    durationDays: number;
  }>;
  recurringCorrelations: Array<{
    assetA: string;
    assetB: string;
    rollingCorrelation30d: number;
    historicalNorm: number;
    status: 'ALIGNED' | 'DIVERGING' | 'INVERTED';
    explanation: string;
  }>;
  historicalEconomicEventReactions: Array<{
    eventType: string;
    totalSamples: number;
    hawkishSurpriseReaction: string;
    dovishSurpriseReaction: string;
    goldReactionAvg: string;
    dollarReactionAvg: string;
  }>;
  expectationVsActualStats: {
    totalLoggedScenarios: number;
    consensusAlignedRatePct: number;
    marketReversalRatePct: number;
    mostSurprisingCategory: string;
  };
}

export interface ReportArchiveItem {
  id: string;
  type: 'DAILY' | 'WEEKLY';
  dateOrWeek: string;
  title: string;
  regime: string;
  riskScore: number;
  generatedAt: string;
}

// ==========================================
// CENTRAL CONNECTED MARKET INTELLIGENCE SYSTEM
// Single Source of Truth for All Modules
// ==========================================

export interface DataQualityReport {
  score: number; // 0 - 100
  status: 'OPTIMAL' | 'DEGRADED' | 'STALE';
  feedCoverage: {
    pricesCount: number;
    currencyStrengthCount: number;
    newsEventsCount: number;
    economicCalendarCount: number;
  };
  freshnessSeconds: number;
  lastSyncEpoch: number;
  sourcesVerified: string[];
}

export type DivergenceType =
  | 'GOLD_YIELD_DIVERGENCE'
  | 'GOLD_DXY_DIVERGENCE'
  | 'EQUITY_YIELD_DIVERGENCE'
  | 'CARRY_SPREAD_DIVERGENCE'
  | 'FOREX_STRENGTH_DIVERGENCE'
  | 'CROSS_ASSET_REGIME_DIVERGENCE';

export interface DetectedMarketDivergence {
  id: string;
  type: DivergenceType;
  severity: 'CRITICAL' | 'WARNING' | 'NOTE';
  instruments: string[];
  title: string;
  observedCondition: string;
  structuralCause: string;
  marketImplication: string;
  actionableContext: string;
  detectedAt: string;
}

export interface CanonicalAssetBias {
  symbol: string;
  displayName: string;
  assetType: 'FOREX' | 'COMMODITY' | 'CRYPTO' | 'INDEX' | 'BOND';
  price: number;
  change24hPct: number;
  bias: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH';
  convictionScore: number; // 0 - 100
  confluenceStatus: 'HIGH_CONVICTION' | 'MODERATE' | 'CAUTION_TRAP' | 'NEUTRAL_CHOP';
  fundamentalDriver: string;
  intermarketDriver: string;
  technicalStructure: string;
  invalidationTrigger: string;
  hasActiveDivergence: boolean;
  divergenceSummary?: string;
  lastUpdated: string;
}

export interface CentralMarketContext {
  id: string;
  epoch: number;
  timestamp: string;
  activeSession: TradingSessionName;
  sessionStatusText: string;

  // Data Integrity & Synchronization Metadata
  dataQuality: DataQualityReport;

  // Single Synchronized Macro & Global Risk Regime
  globalRegime: {
    regimeId: 'HAWKISH_YIELD_PRESSURE' | 'RISK_ON_EXPANSION' | 'GLOBAL_FLIGHT_TO_SAFETY' | 'DOVISH_LIQUIDITY_EASING' | 'BALANCED_ROTATION';
    title: string;
    riskScore: number; // -100 to +100
    badgeColor: string;
    dxyBiasVsOpen: 'ABOVE_OPEN' | 'BELOW_OPEN' | 'AT_OPEN';
    summaryNarrative: string;
    dominantCatalyst: string;
  };

  // Synchronized Rates, Yields & Spreads
  ratesAndYields: {
    us10yPrice: number;
    us10yChangePct: number;
    us10yChangeBps: number;
    yieldCondition: 'EASING' | 'TIGHTENING' | 'CONSOLIDATING';
    realYieldEstimate: number;
    usDeSpread: number;
    usJpSpread: number;
  };

  // Synchronized G8 Currency Hierarchy
  currencyHierarchy: {
    rankings: Array<{
      currency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'NZD' | 'CAD' | 'CHF';
      score: number;
      rank: number;
      direction: string;
    }>;
    strongest: { currency: string; score: number };
    weakest: { currency: string; score: number };
    divergenceDelta: number;
  };

  // Cross-Asset Intermarket Transmissions
  crossAssetTransmissions: Array<{
    asset: string;
    relationshipWithYield: string;
    expectedBehavior: string;
    actualBehavior: string;
    alignmentStatus: 'ALIGNED' | 'DIVERGENT';
    tacticalNote: string;
  }>;

  // Detected Inter-Instrument Divergences (No Forced Harmony)
  divergences: DetectedMarketDivergence[];

  // Single Canonical Asset Bias Registry
  canonicalBiases: Record<string, CanonicalAssetBias>;

  // Synchronized Catalysts
  upcomingKeyRelease?: {
    currency: string;
    event_name: string;
    impact: string;
    date_time_utc: string;
  };
  todayCatalysts: TodayCatalyst[];
}

