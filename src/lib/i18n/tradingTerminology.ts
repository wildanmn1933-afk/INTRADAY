/**
 * Protected Trading Terminology Dictionary & Translation Discipline
 * 
 * CORE ARCHITECTURAL RULE:
 * Established trading, financial, macroeconomic, and technical-analysis terms
 * MUST REMAIN IN ENGLISH in both Indonesian and English modes.
 * 
 * Never perform blind word-for-word translation.
 * WRONG:  "Price Action" -> "Aksi Harga", "Liquidity Sweep" -> "Penyapuan Likuiditas", "Smart Money" -> "Uang Pintar"
 * CORRECT: "Price Action", "Liquidity Sweep", "Smart Money Concepts", "Break of Structure"
 */

export type TermCategory = 
  | 'PRICE_ACTION_SMC'
  | 'EXECUTION_RISK'
  | 'MACRO_FUNDAMENTAL'
  | 'MARKET_METRIC'
  | 'PROPER_NAME';

export interface ProtectedTermEntry {
  locked: true;
  category: TermCategory;
  abbreviation?: string;
  en: string;
  idDescription: string;
  enDescription: string;
  /**
   * Unnatural mechanical translations that MUST be intercepted and sanitized back
   * to the authoritative English trading term.
   */
  bannedTranslations?: string[];
}

export const PROTECTED_TRADING_TERMINOLOGY: Record<string, ProtectedTermEntry> = {
  // === 1. SMART MONEY CONCEPTS & PRICE ACTION ===
  'Price Action': {
    locked: true,
    category: 'PRICE_ACTION_SMC',
    en: 'Price Action',
    idDescription: 'Analisis pergerakan harga murni tanpa lagging indicator',
    enDescription: 'Analysis of raw price movement without lagging indicators',
    bannedTranslations: ['Aksi Harga', 'Tindakan Harga'],
  },
  'Market Structure': {
    locked: true,
    category: 'PRICE_ACTION_SMC',
    en: 'Market Structure',
    idDescription: 'Urutan swing high dan swing low yang membentuk trend pasar',
    enDescription: 'Sequence of swing highs and swing lows defining market trend',
    bannedTranslations: ['Struktur Pasar'],
  },
  'Market Context': {
    locked: true,
    category: 'PRICE_ACTION_SMC',
    en: 'Market Context',
    idDescription: 'Latar belakang makro dan teknikal yang memandu arah harga',
    enDescription: 'Macro and technical backdrop driving price direction',
    bannedTranslations: ['Konteks Pasar'],
  },
  'Order Flow': {
    locked: true,
    category: 'PRICE_ACTION_SMC',
    en: 'Order Flow',
    idDescription: 'Aliran eksekusi order institusional yang menggerakkan pasar',
    enDescription: 'Institutional order execution volume moving the market',
    bannedTranslations: ['Aliran Pesanan', 'Aliran Order'],
  },
  'Liquidity': {
    locked: true,
    category: 'PRICE_ACTION_SMC',
    en: 'Liquidity',
    idDescription: 'Kumpulan stop orders dan pending orders di pasar',
    enDescription: 'Cluster of pending orders and resting stop losses in the market',
    bannedTranslations: ['Likuiditas Pasar'],
  },
  'Liquidity Sweep': {
    locked: true,
    category: 'PRICE_ACTION_SMC',
    en: 'Liquidity Sweep',
    idDescription: 'Pergerakan tajam untuk menyapu resting orders di atas high/low',
    enDescription: 'Sharp price spike sweeping resting stop orders above/below key levels',
    bannedTranslations: ['Penyapuan Likuiditas', 'Sapuan Likuiditas'],
  },
  'Liquidity Grab': {
    locked: true,
    category: 'PRICE_ACTION_SMC',
    en: 'Liquidity Grab',
    idDescription: 'Aksi manipulasi harga untuk mengambil likuiditas trader retail',
    enDescription: 'Price manipulation grabbing liquidity before actual reversal',
    bannedTranslations: ['Pengambilan Likuiditas'],
  },
  'Fair Value Gap': {
    locked: true,
    category: 'PRICE_ACTION_SMC',
    abbreviation: 'FVG',
    en: 'Fair Value Gap',
    idDescription: 'Ketidakseimbangan volume 3 candle (imbalance zone)',
    enDescription: '3-candle price inefficiency / imbalance zone',
    bannedTranslations: ['Kesenjangan Nilai Wajar', 'Celah Nilai Wajar'],
  },
  'Break of Structure': {
    locked: true,
    category: 'PRICE_ACTION_SMC',
    abbreviation: 'BOS',
    en: 'Break of Structure',
    idDescription: 'Penembusan valid swing high/low yang mengonfirmasi kelanjutan trend',
    enDescription: 'Valid break of swing high/low confirming trend continuation',
    bannedTranslations: ['Penembusan Struktur', 'Patah Struktur'],
  },
  'Change of Character': {
    locked: true,
    category: 'PRICE_ACTION_SMC',
    abbreviation: 'CHoCH',
    en: 'Change of Character',
    idDescription: 'Sinyal awal transisi atau pembalikan arah trend',
    enDescription: 'Initial signal of structural trend transition or reversal',
    bannedTranslations: ['Perubahan Karakter'],
  },
  'Higher High': {
    locked: true,
    category: 'PRICE_ACTION_SMC',
    abbreviation: 'HH',
    en: 'Higher High',
    idDescription: 'Puncak harga baru yang lebih tinggi dari puncak sebelumnya',
    enDescription: 'New peak higher than previous swing high',
    bannedTranslations: ['Tinggi Lebih Tinggi'],
  },
  'Higher Low': {
    locked: true,
    category: 'PRICE_ACTION_SMC',
    abbreviation: 'HL',
    en: 'Higher Low',
    idDescription: 'Lembah harga baru yang lebih tinggi dari lembah sebelumnya',
    enDescription: 'New trough higher than previous swing low',
    bannedTranslations: ['Rendah Lebih Tinggi'],
  },
  'Lower High': {
    locked: true,
    category: 'PRICE_ACTION_SMC',
    abbreviation: 'LH',
    en: 'Lower High',
    idDescription: 'Puncak harga baru yang lebih rendah dari puncak sebelumnya',
    enDescription: 'New peak lower than previous swing high',
    bannedTranslations: ['Tinggi Lebih Rendah'],
  },
  'Lower Low': {
    locked: true,
    category: 'PRICE_ACTION_SMC',
    abbreviation: 'LL',
    en: 'Lower Low',
    idDescription: 'Lembah harga baru yang lebih rendah dari lembah sebelumnya',
    enDescription: 'New trough lower than previous swing low',
    bannedTranslations: ['Rendah Lebih Rendah'],
  },
  'Support': {
    locked: true,
    category: 'PRICE_ACTION_SMC',
    en: 'Support',
    idDescription: 'Area lantai harga di mana buying interest terkonsentrasi',
    enDescription: 'Price floor where buying interest is concentrated',
    bannedTranslations: ['Dukungan', 'Penyangga'],
  },
  'Resistance': {
    locked: true,
    category: 'PRICE_ACTION_SMC',
    en: 'Resistance',
    idDescription: 'Area atap harga di mana selling pressure terkonsentrasi',
    enDescription: 'Price ceiling where selling pressure is concentrated',
    bannedTranslations: ['Resistensi', 'Hambatan'],
  },
  'Supply': {
    locked: true,
    category: 'PRICE_ACTION_SMC',
    en: 'Supply',
    idDescription: 'Zona konsentrasi sell order institusional',
    enDescription: 'Institutional sell order block zone',
    bannedTranslations: ['Pasokan'],
  },
  'Demand': {
    locked: true,
    category: 'PRICE_ACTION_SMC',
    en: 'Demand',
    idDescription: 'Zona konsentrasi buy order institusional',
    enDescription: 'Institutional buy order block zone',
    bannedTranslations: ['Permintaan'],
  },
  'Smart Money': {
    locked: true,
    category: 'PRICE_ACTION_SMC',
    en: 'Smart Money',
    idDescription: 'Pelaku pasar institusional (bank sentral, hedge funds, liquidity providers)',
    enDescription: 'Institutional capital (central banks, hedge funds, tier-1 banks)',
    bannedTranslations: ['Uang Pintar', 'Uang Cerdas'],
  },
  'Smart Money Concepts': {
    locked: true,
    category: 'PRICE_ACTION_SMC',
    abbreviation: 'SMC',
    en: 'Smart Money Concepts',
    idDescription: 'Metodologi trading berbasis pemahaman jejak institusional dan likuiditas',
    enDescription: 'Trading framework tracking institutional footprints and liquidity',
    bannedTranslations: ['Konsep Uang Pintar'],
  },
  'Institutional Flow': {
    locked: true,
    category: 'PRICE_ACTION_SMC',
    en: 'Institutional Flow',
    idDescription: 'Arah aliran dana pelaku pasar skala besar',
    enDescription: 'Directional flow of tier-1 institutional capital',
    bannedTranslations: ['Aliran Institusi'],
  },
  'Volume Profile': {
    locked: true,
    category: 'PRICE_ACTION_SMC',
    en: 'Volume Profile',
    idDescription: 'Distribusi volume perdagangan pada setiap level harga',
    enDescription: 'Horizontal distribution of traded volume at price levels',
    bannedTranslations: ['Profil Volume'],
  },
  'Pullback': {
    locked: true,
    category: 'PRICE_ACTION_SMC',
    en: 'Pullback',
    idDescription: 'Koreksi harga sementara berlawanan dengan trend utama',
    enDescription: 'Temporary retracement against prevailing trend',
    bannedTranslations: ['Tarik Balik', 'Mundur'],
  },
  'Reversal': {
    locked: true,
    category: 'PRICE_ACTION_SMC',
    en: 'Reversal',
    idDescription: 'Perubahan arah trend pasar secara menyeluruh',
    enDescription: 'Complete turning point in prevailing market trend',
    bannedTranslations: ['Pembalikan'],
  },
  'Breakout': {
    locked: true,
    category: 'PRICE_ACTION_SMC',
    en: 'Breakout',
    idDescription: 'Penembusan harga keluar dari range konsolidasi atau level kunci',
    enDescription: 'Price penetration through a consolidation range or key level',
    bannedTranslations: ['Penembusan'],
  },
  'Fakeout': {
    locked: true,
    category: 'PRICE_ACTION_SMC',
    en: 'Fakeout',
    idDescription: 'Penembusan palsu untuk menjebak breakout trader (bull/bear trap)',
    enDescription: 'False breakout trapping momentum traders before reversing',
    bannedTranslations: ['Penembusan Palsu', 'Palsu'],
  },
  'Rejection': {
    locked: true,
    category: 'PRICE_ACTION_SMC',
    en: 'Rejection',
    idDescription: 'Penolakan harga cepat dari level tertentu membentuk wick panjang',
    enDescription: 'Sharp price bounce away from a key level leaving wicks',
    bannedTranslations: ['Penolakan'],
  },

  // === 2. EXECUTION & RISK MANAGEMENT ===
  'Entry': {
    locked: true,
    category: 'EXECUTION_RISK',
    en: 'Entry',
    idDescription: 'Titik pembukaan posisi transaksi pasar',
    enDescription: 'Price level where a position is executed',
    bannedTranslations: ['Titik Masuk', 'Masuk Posisi'],
  },
  'Exit': {
    locked: true,
    category: 'EXECUTION_RISK',
    en: 'Exit',
    idDescription: 'Titik penutupan posisi transaksi pasar',
    enDescription: 'Price level where a position is liquidated',
    bannedTranslations: ['Titik Keluar', 'Keluar Posisi'],
  },
  'Stop Loss': {
    locked: true,
    category: 'EXECUTION_RISK',
    abbreviation: 'SL',
    en: 'Stop Loss',
    idDescription: 'Batas proteksi kerugian maksimal yang ditentukan',
    enDescription: 'Predefined price order to limit downside loss',
    bannedTranslations: ['Hentikan Kerugian', 'Stop Rugi'],
  },
  'Take Profit': {
    locked: true,
    category: 'EXECUTION_RISK',
    abbreviation: 'TP',
    en: 'Take Profit',
    idDescription: 'Target harga realisasi keuntungan posisi',
    enDescription: 'Target price level to close trade in profit',
    bannedTranslations: ['Ambil Untung', 'Realisasi Keuntungan'],
  },
  'Risk/Reward': {
    locked: true,
    category: 'EXECUTION_RISK',
    abbreviation: 'RR',
    en: 'Risk/Reward',
    idDescription: 'Rasio perbandingan antara potensi kerugian vs keuntungan (misal 1:3)',
    enDescription: 'Ratio comparing potential loss to upside profit target',
    bannedTranslations: ['Risiko/Imbalan'],
  },
  'Drawdown': {
    locked: true,
    category: 'EXECUTION_RISK',
    en: 'Drawdown',
    idDescription: 'Penurunan saldo akun dari titik puncak ke titik terendah',
    enDescription: 'Peak-to-trough decline in account balance or equity',
    bannedTranslations: ['Penarikan Saldo'],
  },
  'Position Size': {
    locked: true,
    category: 'EXECUTION_RISK',
    en: 'Position Size',
    idDescription: 'Ukuran lot atau volume kontrak transaksi',
    enDescription: 'Calculated lot size or contract volume of a trade',
    bannedTranslations: ['Ukuran Posisi'],
  },
  'Long': {
    locked: true,
    category: 'EXECUTION_RISK',
    en: 'Long',
    idDescription: 'Posisi beli mengharapkan kenaikan harga',
    enDescription: 'Buy position expecting price appreciation',
    bannedTranslations: ['Panjang'],
  },
  'Short': {
    locked: true,
    category: 'EXECUTION_RISK',
    en: 'Short',
    idDescription: 'Posisi jual mengharapkan penurunan harga',
    enDescription: 'Sell position expecting price depreciation',
    bannedTranslations: ['Pendek'],
  },
  'Spread': {
    locked: true,
    category: 'EXECUTION_RISK',
    en: 'Spread',
    idDescription: 'Selisih harga jual (Ask) dan harga beli (Bid)',
    enDescription: 'Difference between Ask and Bid quote',
  },
  'Slippage': {
    locked: true,
    category: 'EXECUTION_RISK',
    en: 'Slippage',
    idDescription: 'Deviasi harga eksekusi dari harga yang diminta saat volatilitas tinggi',
    enDescription: 'Difference between expected execution price and actual filled price',
  },

  // === 3. MACROECONOMIC & INTERMARKET ===
  'Hawkish': {
    locked: true,
    category: 'MACRO_FUNDAMENTAL',
    en: 'Hawkish',
    idDescription: 'Sikap bank sentral yang agresif menaikkan suku bunga untuk meredam inflasi',
    enDescription: 'Monetary stance favoring higher rates to combat inflation',
    bannedTranslations: ['Elang', 'Gaya Elang'],
  },
  'Dovish': {
    locked: true,
    category: 'MACRO_FUNDAMENTAL',
    en: 'Dovish',
    idDescription: 'Sikap bank sentral yang akomodatif menurunkan suku bunga untuk menstimulasi ekonomi',
    enDescription: 'Monetary stance favoring rate cuts to stimulate economic growth',
    bannedTranslations: ['Merpati', 'Gaya Merpati'],
  },
  'Risk-on': {
    locked: true,
    category: 'MACRO_FUNDAMENTAL',
    en: 'Risk-on',
    idDescription: 'Sentimen pasar optimis di mana investor memburu aset berisiko (ekuitas, crypto, komoditas)',
    enDescription: 'Market sentiment favoring high-beta growth assets over safe havens',
    bannedTranslations: ['Risiko Aktif', 'Risiko-Aktif'],
  },
  'Risk-off': {
    locked: true,
    category: 'MACRO_FUNDAMENTAL',
    en: 'Risk-off',
    idDescription: 'Sentimen pasar hati-hati di mana investor beralih ke aset safe-haven (USD, Gold, US Treasuries)',
    enDescription: 'Market sentiment fleeing to safe-haven liquid preservation assets',
    bannedTranslations: ['Risiko Nonaktif', 'Bebas Risiko'],
  },
  'Safe Haven': {
    locked: true,
    category: 'MACRO_FUNDAMENTAL',
    en: 'Safe Haven',
    idDescription: 'Aset lindung nilai saat terjadi krisis geopolitik atau turbulensi pasar (Gold, USD, CHF)',
    enDescription: 'Assets expected to retain or increase in value during market distress',
    bannedTranslations: ['Tempat Perlindungan Aman'],
  },
  'Yield': {
    locked: true,
    category: 'MACRO_FUNDAMENTAL',
    en: 'Yield',
    idDescription: 'Tingkat imbal hasil obligasi pemerintah (misal US 10Y Treasury Yield)',
    enDescription: 'Return earned on sovereign government debt securities',
    bannedTranslations: ['Hasil Panen', 'Imbalan'],
  },
  'Treasury Yield': {
    locked: true,
    category: 'MACRO_FUNDAMENTAL',
    en: 'Treasury Yield',
    idDescription: 'Tingkat imbal hasil surat utang Departemen Keuangan AS',
    enDescription: 'Yield on US government obligations',
    bannedTranslations: ['Imbal Hasil Kas'],
  },
  'Carry Trade': {
    locked: true,
    category: 'MACRO_FUNDAMENTAL',
    en: 'Carry Trade',
    idDescription: 'Strategi meminjam valuta suku bunga rendah untuk membeli aset suku bunga tinggi',
    enDescription: 'Borrowing in low-yield currency to invest in higher-yielding assets',
    bannedTranslations: ['Perdagangan Bawa'],
  },
  'Bullish': {
    locked: true,
    category: 'MARKET_METRIC',
    en: 'Bullish',
    idDescription: 'Ekspektasi atau tren pergerakan harga naik',
    enDescription: 'Upward trending or optimistic price action',
    bannedTranslations: ['Banteng'],
  },
  'Bearish': {
    locked: true,
    category: 'MARKET_METRIC',
    en: 'Bearish',
    idDescription: 'Ekspektasi atau tren pergerakan harga turun',
    enDescription: 'Downward trending or pessimistic price action',
    bannedTranslations: ['Beruang'],
  },
  'Open Interest': {
    locked: true,
    category: 'MARKET_METRIC',
    en: 'Open Interest',
    idDescription: 'Jumlah total kontrak futures/options yang masih terbuka',
    enDescription: 'Total number of outstanding derivative contracts open',
    bannedTranslations: ['Bunga Terbuka', 'Minat Terbuka'],
  },
  'Funding Rate': {
    locked: true,
    category: 'MARKET_METRIC',
    en: 'Funding Rate',
    idDescription: 'Biaya periodik antara long dan short pada perpetual futures',
    enDescription: 'Periodic rate paid between longs and shorts in perpetual swaps',
    bannedTranslations: ['Tingkat Pendanaan'],
  },
};

/**
 * Proper names: Instruments, exchanges, agencies, people, institutions.
 * Strictly NEVER translated.
 */
export const PROTECTED_PROPER_NAMES: readonly string[] = [
  'XAUUSD', 'BTCUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD',
  'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'CADJPY', 'CHFJPY',
  'US100', 'US500', 'US30', 'NASDAQ', 'S&P 500', 'Dow Jones', 'DXY', 'Gold', 'Silver', 'Bitcoin', 'Ethereum',
  'Federal Reserve', 'Fed', 'FOMC', 'ECB', 'BOJ', 'BOE', 'SNB', 'RBA', 'RBNZ', 'Bank Indonesia',
  'Jerome Powell', 'Donald Trump', 'Christine Lagarde', 'Kazuo Ueda',
  'TradingView', 'Bloomberg', 'Reuters', 'CME', 'NYSE', 'Nasdaq',
  'CPI', 'PPI', 'NFP', 'PCE', 'GDP', 'PMI', 'ISM'
];

/**
 * Map of unnatural Indonesian mechanical translations to authoritative English trading terms.
 */
const BANNED_TRANSLATION_MAP: Record<string, string> = {};

// Build lookup table from dictionary
Object.values(PROTECTED_TRADING_TERMINOLOGY).forEach(entry => {
  if (entry.bannedTranslations) {
    entry.bannedTranslations.forEach(banned => {
      BANNED_TRANSLATION_MAP[banned.toLowerCase()] = entry.en;
    });
  }
});

// Additional known mistranslations from naive tools
const EXTRA_MISTRANSLATIONS: Record<string, string> = {
  'aksi harga': 'Price Action',
  'struktur pasar': 'Market Structure',
  'konteks pasar': 'Market Context',
  'uang pintar': 'Smart Money',
  'uang cerdas': 'Smart Money',
  'penyapuan likuiditas': 'Liquidity Sweep',
  'sapuan likuiditas': 'Liquidity Sweep',
  'kesenjangan nilai wajar': 'Fair Value Gap (FVG)',
  'celah nilai wajar': 'Fair Value Gap',
  'penembusan struktur': 'Break of Structure (BOS)',
  'patah struktur': 'Break of Structure (BOS)',
  'perubahan karakter': 'Change of Character (CHoCH)',
  'risiko aktif': 'Risk-on',
  'risiko-aktif': 'Risk-on',
  'risiko nonaktif': 'Risk-off',
  'bebas risiko': 'Risk-off',
  'titik masuk': 'Entry',
  'titik keluar': 'Exit',
  'ambil untung': 'Take Profit (TP)',
  'hentikan kerugian': 'Stop Loss (SL)',
  'tarik balik': 'Pullback',
  'penembusan palsu': 'Fakeout',
  'imbal hasil kas': 'Treasury Yield',
  'perdagangan bawa': 'Carry Trade',
  'minat terbuka': 'Open Interest',
  'bunga terbuka': 'Open Interest',
};

Object.entries(EXTRA_MISTRANSLATIONS).forEach(([k, v]) => {
  BANNED_TRANSLATION_MAP[k.toLowerCase()] = v;
});

/**
 * Checks if a given phrase is a protected trading term or proper name.
 */
export function isProtectedTerm(term: string): boolean {
  if (!term) return false;
  const trimmed = term.trim();
  if (PROTECTED_TRADING_TERMINOLOGY[trimmed]) return true;
  if (PROTECTED_PROPER_NAMES.some(name => name.toLowerCase() === trimmed.toLowerCase())) return true;
  return false;
}

/**
 * Sanitizes any text (such as AI-generated text or incoming feeds) to replace
 * unnatural mechanical Indonesian translations back into authoritative English trading terms.
 */
export function sanitizeTradingTerminology(text: string): string {
  if (!text) return '';

  let sanitized = text;

  // Search and replace banned mechanical translations
  for (const [bannedLower, properEnglish] of Object.entries(BANNED_TRANSLATION_MAP)) {
    // Case-insensitive word boundary or whole phrase replacement
    const escaped = bannedLower.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    if (regex.test(sanitized)) {
      sanitized = sanitized.replace(regex, properEnglish);
    }
  }

  return sanitized;
}

/**
 * Formatter for professional Indonesian trader phrasing:
 * Combines natural Indonesian syntax with protected English trading terms.
 */
export function formatTraderAnalysis(analysis: string, lang: 'id' | 'en'): string {
  if (!analysis) return '';
  // First ensure all protected trading terms are strictly preserved
  const cleaned = sanitizeTradingTerminology(analysis);
  return cleaned;
}
