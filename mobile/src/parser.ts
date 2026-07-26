import type {
  BallEvent,
  DismissalType,
  ExtraType,
  Player,
  PlayerId,
} from './types';

/**
 * Context the parser needs to resolve names and fill sensible defaults.
 */
export interface ParseContext {
  battingPlayers: Player[];
  bowlingPlayers: Player[];
  currentStrikerId?: PlayerId;
  currentNonStrikerId?: PlayerId;
  currentBowlerId?: PlayerId;
}

export interface ParseResult {
  event: Omit<BallEvent, 'id' | 'timestamp'>;
  notes: string[];
}

// Cardinal run words (Hindi + English + digits).
const RUN_WORDS: Record<string, number> = {
  '0': 0, zero: 0, dot: 0, duck: 0,
  '1': 1, ek: 1, single: 1, one: 1,
  '2': 2, do: 2, double: 2, two: 2, doha: 2,
  '3': 3, teen: 3, triple: 3, three: 3,
  '4': 4, char: 4, char4: 4, chauka: 4, choka: 4, chowka: 4, four: 4, boundary: 4,
  '5': 5, panch: 5, paanch: 5, five: 5,
  '6': 6, chakka: 6, chhakka: 6, chhaka: 6, chaka: 6, six: 6, sixer: 6, six6: 6,
};

// Ordinals (which ball / over) — must NOT be read as runs.
const ORDINAL_WORDS = new Set([
  'pehli', 'pehla', 'pehle', 'first',
  'dusri', 'dusra', 'doosri', 'doosra', 'second',
  'teesri', 'teesra', 'tisri', 'third',
  'chauthi', 'chautha', 'fourth',
  'panchvi', 'paanchvi', 'fifth',
  'chhati', 'sixth', 'aakhri', 'last',
]);

const BOWLING_WORDS = [
  'bowl', 'ball', 'gend', 'gaind', 'over', 'daala', 'daali', 'dali', 'dala',
  'karwai', 'karayi', 'karaai', 'phenki', 'feki', 'fenki', 'bowling', 'delivery',
];

const RUN_CONTEXT_WORDS = [
  'run', 'runs', 'liya', 'liye', 'li', 'banaye', 'banaya', 'mara', 'maara',
  'lagaya', 'lagaye', 'scored', 'took', 'mari',
];

const WICKET_WORDS = [
  'out', 'aut', 'wicket', 'vikaat', 'bold', 'bowled', 'clean', 'catch',
  'caught', 'lbw', 'stumped', 'stump', 'gaya', 'gayi',
];

const EXTRA_PATTERNS: { type: Exclude<ExtraType, null>; words: string[] }[] = [
  { type: 'noball', words: ['no ball', 'noball', 'no-ball', 'nabad'] },
  { type: 'wide', words: ['wide', 'vaid', 'vide'] },
  { type: 'legbye', words: ['leg bye', 'legbye', 'leg-bye', 'leg by'] },
  { type: 'bye', words: ['bye', 'baiy'] },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Split a transcript into clauses on connectors (aur / or / and / comma). */
function splitClauses(text: string): string[] {
  return text
    .split(/\s+(?:aur|or|and)\s+|,/g)
    .map((c) => c.trim())
    .filter(Boolean);
}

function simplify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, '');
}

/** Levenshtein distance for fuzzy name matching against speech noise. */
function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[a.length][b.length];
}

/** Find the best matching player for a spoken token within a roster. */
function matchPlayer(
  token: string,
  players: Player[],
): Player | undefined {
  const t = simplify(token);
  if (!t) return undefined;
  let best: { player: Player; score: number } | undefined;
  for (const p of players) {
    const target = simplify(p.name);
    if (!target) continue;
    let score: number;
    if (target === t) score = 0;
    else if (target.startsWith(t) || t.startsWith(target)) score = 1;
    else if (target.includes(t) || t.includes(target)) score = 2;
    else {
      const d = editDistance(t, target);
      // Allow up to ~40% edits for speech recognition slips.
      if (d <= Math.max(1, Math.floor(target.length * 0.4))) score = 2 + d;
      else continue;
    }
    if (!best || score < best.score) best = { player: p, score };
  }
  return best?.player;
}

/**
 * Extract the name spoken before the "ne" marker (Hindi ergative),
 * e.g. "rahul ne single liya" -> "rahul". Falls back to first token.
 */
function extractSubjectToken(clause: string): string | undefined {
  const words = clause.split(' ');
  const neIndex = words.findIndex((w) => w === 'ne' || w === 'né');
  if (neIndex > 0) {
    // Use the word immediately before "ne".
    return words[neIndex - 1];
  }
  return words[0];
}

function hasAny(text: string, words: string[]): boolean {
  return words.some((w) =>
    w.includes(' ') ? text.includes(w) : text.split(' ').includes(w),
  );
}

function detectExtra(text: string): { type: ExtraType; runs: number } {
  for (const { type, words } of EXTRA_PATTERNS) {
    if (words.some((w) => text.includes(w))) {
      return { type, runs: 1 };
    }
  }
  return { type: null, runs: 0 };
}

function detectDismissal(text: string): DismissalType | undefined {
  if (text.includes('lbw')) return 'lbw';
  if (hasAny(text, ['catch', 'caught', 'lapka', 'lapak'])) return 'caught';
  if (hasAny(text, ['stump', 'stumped'])) return 'stumped';
  if (text.includes('run out') || text.includes('runout')) return 'runout';
  if (hasAny(text, ['bold', 'bowled', 'clean'])) return 'bowled';
  return undefined;
}

/** Read runs from a clause, ignoring ordinal words. */
function extractRuns(clause: string): number | undefined {
  const words = clause.split(' ');
  for (const w of words) {
    if (ORDINAL_WORDS.has(w)) continue;
    if (w in RUN_WORDS) return RUN_WORDS[w];
  }
  return undefined;
}

/**
 * Parse a Hinglish/English scoring sentence into a ball-event draft.
 * The result is always usable — anything ambiguous is left at a safe
 * default and surfaced through `notes` so the scorer can fix it before
 * approving.
 */
export function parseTranscript(
  transcript: string,
  ctx: ParseContext,
): ParseResult {
  const notes: string[] = [];
  const text = normalize(transcript);
  const clauses = splitClauses(text);

  let strikerId = ctx.currentStrikerId;
  let bowlerId = ctx.currentBowlerId;
  let runs = 0;
  let runsFound = false;

  for (const clause of clauses) {
    const isBowlingClause = hasAny(clause, BOWLING_WORDS);
    const isBattingClause = hasAny(clause, RUN_CONTEXT_WORDS) || hasAny(clause, WICKET_WORDS);
    const subject = extractSubjectToken(clause);

    if (isBowlingClause && subject) {
      const match = matchPlayer(subject, ctx.bowlingPlayers);
      if (match) {
        bowlerId = match.id;
      } else {
        notes.push(`Could not match bowler "${subject}" — please pick manually.`);
      }
    }

    if (isBattingClause && subject) {
      const match = matchPlayer(subject, ctx.battingPlayers);
      if (match) {
        strikerId = match.id;
      } else if (!isBowlingClause) {
        notes.push(`Could not match batter "${subject}" — please pick manually.`);
      }
    }

    // Runs belong to the batting clause; if there's no clear batting clause,
    // still try to read a run number from a non-bowling clause.
    if (!isBowlingClause || isBattingClause) {
      const r = extractRuns(clause);
      if (r !== undefined) {
        runs = r;
        runsFound = true;
      }
    }
  }

  const extra = detectExtra(text);
  const isWicket = hasAny(text, WICKET_WORDS) && !text.includes('not out');
  const dismissalType = isWicket ? detectDismissal(text) ?? 'other' : undefined;

  // A wide/no-ball is not a legal delivery (doesn't advance the over).
  const isLegalDelivery = extra.type !== 'wide' && extra.type !== 'noball';

  if (!runsFound && !isWicket && !extra.type) {
    notes.push('No runs detected — recorded as a dot ball (0). Edit if needed.');
  }
  if (!bowlerId) {
    notes.push('Bowler not set — using none. Please select the bowler.');
  }
  if (!strikerId && !extra.type) {
    notes.push('Striker not set — please select the batter on strike.');
  }

  const event: Omit<BallEvent, 'id' | 'timestamp'> = {
    strikerId,
    nonStrikerId: ctx.currentNonStrikerId,
    bowlerId,
    runs,
    extra: extra.type,
    extraRuns: extra.runs,
    isWicket,
    dismissalType,
    outPlayerId: isWicket ? strikerId : undefined,
    isLegalDelivery,
    transcript,
  };

  return { event, notes };
}
