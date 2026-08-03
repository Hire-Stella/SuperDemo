/**
 * Lightweight lexical embedding for the FIT knowledge base.
 *
 * Why not a real embedding model: the local Postgres is vendored without
 * pgvector, the corpus is a few hundred chunks, and a deterministic scorer is
 * an asset in a client demo — the same question always retrieves the same
 * passage, and there is no API key to expire mid-presentation.
 *
 * This is TF-IDF-ish: a hashed bag-of-words vector plus stored keywords for
 * exact-term boosting. Swap for pgvector + a real embedding model in production
 * (NOT-IMPLEMENTED.md); `KnowledgeRetriever` is the only seam that changes.
 */

export const EMBEDDING_DIM = 256;

const STOPWORDS = new Set([
  'a','about','above','after','again','all','am','an','and','any','are','as','at','be','because',
  'been','before','being','below','between','both','but','by','can','cannot','could','did','do',
  'does','doing','down','during','each','few','for','from','further','had','has','have','having',
  'he','her','here','hers','him','his','how','i','if','in','into','is','it','its','just','me',
  'more','most','my','no','nor','not','now','of','off','on','once','only','or','other','our','out',
  'over','own','same','she','should','so','some','such','than','that','the','their','them','then',
  'there','these','they','this','those','through','to','too','under','until','up','very','was','we',
  'were','what','when','where','which','while','who','whom','why','will','with','would','you','your',
  'please','hello','hi','hey','thanks','thank','okay','ok','yeah','yes','um','uh','like','want',
]);

/**
 * Domain synonyms. Callers say "price", the KB says "fee". Without this the
 * scripted brain under-retrieves and escalates far too eagerly.
 */
const SYNONYMS: Record<string, string[]> = {
  price: ['fee', 'cost', 'charge', 'payment'],
  prices: ['fee', 'cost'],
  cost: ['fee', 'price'],
  costs: ['fee', 'price'],
  charges: ['fee', 'cost'],
  fees: ['fee'],
  expensive: ['fee', 'cost'],
  timing: ['schedule', 'time', 'class'],
  timings: ['schedule', 'time', 'class'],
  time: ['schedule'],
  times: ['schedule'],
  when: ['schedule', 'intake', 'start'],
  start: ['intake', 'schedule'],
  starts: ['intake', 'schedule'],
  begin: ['intake', 'start'],
  duration: ['long', 'week', 'month'],
  long: ['duration', 'week', 'month'],
  register: ['enrol', 'enroll', 'admission', 'join', 'apply'],
  registration: ['enrol', 'admission'],
  enroll: ['enrol', 'admission'],
  join: ['enrol', 'admission'],
  apply: ['enrol', 'admission'],
  admission: ['enrol'],
  document: ['passport', 'certificate', 'emirates'],
  documents: ['passport', 'certificate', 'emirates'],
  paperwork: ['document', 'passport'],
  certificate: ['certification', 'accreditation', 'khda'],
  certified: ['certification'],
  accredited: ['accreditation', 'khda'],
  recognised: ['accreditation', 'attestation'],
  recognized: ['accreditation', 'attestation'],
  attested: ['attestation'],
  location: ['address', 'jlt', 'dubai', 'office'],
  where: ['address', 'location'],
  address: ['location', 'jlt'],
  online: ['blended', 'remote', 'virtual'],
  weekend: ['saturday', 'schedule'],
  evening: ['schedule', 'weekday'],
  installment: ['instalment', 'payment', 'plan'],
  instalments: ['instalment', 'payment'],
  refund: ['refund', 'transfer', 'deferral'],
  company: ['corporate', 'group'],
  corporate: ['company', 'group'],
  group: ['corporate', 'company'],
  staff: ['corporate', 'group', 'team'],
  team: ['corporate', 'group'],
  visa: ['residency', 'immigration', 'sponsor'],
  aba: ['behaviour', 'behavior', 'analysis', 'autism'],
  sen: ['special', 'educational', 'needs', 'inclusion'],
  vat: ['tax', 'fta'],
  tax: ['vat', 'corporate', 'fta'],
  aml: ['money', 'laundering', 'compliance'],
  cpa: ['accountant', 'accounting'],
  cma: ['management', 'accountant'],
  ifrs: ['reporting', 'standards', 'accounting'],
  hr: ['human', 'resources'],
  english: ['language', 'ielts'],
  arabic: ['language'],
  french: ['language'],
  spanish: ['language'],
};

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/** Expand a token list with domain synonyms so query and document meet. */
export function expand(tokens: string[]): string[] {
  const out = new Set(tokens);
  for (const t of tokens) {
    const syn = SYNONYMS[t];
    if (syn) for (const s of syn) out.add(s);
    // crude stem: drop plural 's'
    if (t.length > 4 && t.endsWith('s')) out.add(t.slice(0, -1));
  }
  return [...out];
}

/** Stable string hash → vector slot. */
function slot(token: string): number {
  let h = 2166136261;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % EMBEDDING_DIM;
}

/** L2-normalised hashed bag of words. */
export function embed(text: string): number[] {
  const vec = new Array<number>(EMBEDDING_DIM).fill(0);
  const tokens = expand(tokenize(text));
  if (tokens.length === 0) return vec;

  const counts = new Map<string, number>();
  for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);

  for (const [token, count] of counts) {
    // Sub-linear term frequency: a word repeated ten times isn't ten times as
    // relevant, and long course descriptions shouldn't dominate short FAQs.
    const i = slot(token);
    vec[i] = (vec[i] ?? 0) + 1 + Math.log(count);
  }

  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (norm === 0) return vec;
  return vec.map((v) => v / norm);
}

export function cosine(a: readonly number[], b: readonly number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < n; i++) dot += (a[i] ?? 0) * (b[i] ?? 0);
  // Both sides are pre-normalised, so the dot product IS the cosine.
  return dot;
}

/** Distinct keywords stored alongside a chunk for exact-term boosting. */
export function keywordsOf(text: string): string[] {
  return [...new Set(tokenize(text))].slice(0, 60);
}

/**
 * Split a document into retrieval chunks.
 *
 * Paragraph-first, with a character cap. Course entries are already short and
 * self-contained, so most become a single chunk — which is what we want: a
 * caller asking about ABA fees should retrieve the whole ABA entry, not half of
 * it.
 */
export function chunk(text: string, maxChars = 900): string[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = '';

  for (const p of paragraphs) {
    if (p.length > maxChars) {
      if (current) {
        chunks.push(current);
        current = '';
      }
      // Long paragraph: split on sentence boundaries.
      const sentences = p.match(/[^.!?]+[.!?]+|\S+$/g) ?? [p];
      let buf = '';
      for (const s of sentences) {
        if ((buf + s).length > maxChars && buf) {
          chunks.push(buf.trim());
          buf = '';
        }
        buf += s;
      }
      if (buf.trim()) chunks.push(buf.trim());
      continue;
    }
    if ((current + '\n\n' + p).length > maxChars && current) {
      chunks.push(current);
      current = p;
    } else {
      current = current ? `${current}\n\n${p}` : p;
    }
  }
  if (current) chunks.push(current);
  return chunks.length ? chunks : [text.slice(0, maxChars)];
}
