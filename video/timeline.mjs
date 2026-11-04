// The video's one timeline, driven by the voice (Nov 3 round 2). backup.mjs (the picture) and voice-mix.mjs (the sound)
// both read it, so a cut, a mark and the word it belongs to cannot drift apart.
//
//   node video/timeline.mjs          print the rows, the phrases and every silence between them
//
// Each row clip (rowN.mp3, ElevenLabs) plays as recorded, its own pauses kept. A row starts `lead` seconds before
// its first word and ends `tail` seconds after its last word; the next row starts there. Where the picture needs a
// beat (a panel opening, a count landing), `pauses` adds that much silence before the named words: the voice is cut
// there (voice-mix.mjs cuts at the quietest point between the two words) and the rest of the row moves later.
// at(row, "words") is the program time a word sequence starts; end(row, "words") is when it ends.
import fs from "node:fs";
import path from "node:path";

export const FPS = 25;
export const VOICE_DIR = process.env.VOICE_DIR || "C:/Users/pau/AppData/Local/Temp/claude/video-edit/voice";
export const MAX_PAUSE = 0.8;     // the longest silence allowed between two sentences inside a row
export const MAX_ROW_GAP = 1.0;   // the longest silence allowed between two rows

// [the words the extra pause goes before, seconds added to the voice's own pause]
export const VOICE_ROWS = [
  { n: 1, lead: 0.5, tail: 0.5, pauses: [] },
  { n: 2, lead: 0.4, tail: 0.5, pauses: [["or paste it", 0.3], ["then Confirm", 0.35]] },
  { n: 3, lead: 0.4, tail: 0.55, pauses: [] },
  { n: 4, lead: 0.35, tail: 0.5, pauses: [["Every quote is located", 0.2], ["Here it matches", 0.2]] },
  { n: 5, lead: 0.35, tail: 0.5, pauses: [["Every claim", 0.25], ["The deadline comes", 0.3], ["Last a second", 0.2], ["Here it agrees", 0.25]] },
  { n: 6, lead: 0.4, tail: 0.5, pauses: [] },
  { n: 7, lead: 0.4, tail: 0.5, pauses: [["The verdict was", 0.35], ["All two hundred", 0.3], ["The open model", 0.35], ["About ten cents", 0.3], ["Every number", 0.35]] },
  { n: 8, lead: 0.4, tail: 2.0, pauses: [] },
];

const norm = (w) => w.toLowerCase().split(/[^a-z0-9-]/).join("");
const snap = (t) => Math.round(t * FPS) / FPS;
const r2 = (x) => Math.round(x * 100) / 100;

export function rowWords(n) {
  const all = JSON.parse(fs.readFileSync(path.join(VOICE_DIR, "row" + n + ".words.json"), "utf8")).words;
  // a leading "[warmly]"-style tag is a direction to the voice, not a spoken word
  return all.filter((w) => w.type === "word" && !w.text.startsWith("[")).map((w) => ({ ...w, key: norm(w.text) }));
}
function find(words, phrase, n) {
  const want = phrase.split(/\s+/).map(norm);
  const i = words.findIndex((_, k) => want.every((w, j) => words[k + j] && words[k + j].key === w));
  if (i < 0) throw new Error("row " + n + ": '" + phrase + "' is not in the transcript");
  return [i, i + want.length - 1];
}

function build() {
  const rows = [];
  let t = 0;
  for (const spec of VOICE_ROWS) {
    const words = rowWords(spec.n);
    const from = snap(t);
    // phrase k starts at word starts[k]; its words play at clip time + offset[k]
    const splits = spec.pauses.map(([p, extra]) => ({ i: find(words, p, spec.n)[0], extra, words: p })).sort((a, b) => a.i - b.i);
    const phrases = [];
    let offset = from + spec.lead - words[0].start;
    let first = 0;
    for (const s of [...splits, { i: words.length, extra: 0 }]) {
      phrases.push({ first, last: s.i - 1, offset, text: words.slice(first, s.i).map((w) => w.text).join(" ") });
      offset += s.extra;
      first = s.i;
    }
    const lastP = phrases.at(-1);
    const to = snap(words.at(-1).end + lastP.offset + spec.tail);
    const off = (i) => phrases.find((p) => i >= p.first && i <= p.last).offset;
    const prog = words.map((w, i) => ({ ...w, at: w.start + off(i), endAt: w.end + off(i) }));
    rows.push({ n: spec.n, from, to, lead: spec.lead, tail: spec.tail, words: prog, phrases });
    t = to;
  }
  return { rows, length: rows.at(-1).to };
}

export const TL = build();
export const row = (n) => TL.rows.find((r) => r.n === n);
export function at(n, phrase) { const r = row(n); return r.words[find(r.words, phrase, n)[0]].at; }
export function end(n, phrase) { const r = row(n); return r.words[find(r.words, phrase, n)[1]].endAt; }

// every silence of 0.3 s or more between two words, and the one between rows
export function gaps() {
  const out = [];
  TL.rows.forEach((r, k) => {
    for (let i = 1; i < r.words.length; i++) {
      const g = r.words[i].at - r.words[i - 1].endAt;
      if (g >= 0.3) out.push({ row: r.n, kind: "inside row", before: r.words[i].text, after: r.words[i - 1].text, at: r2(r.words[i - 1].endAt), silence: r2(g) });
    }
    if (k) {
      const p = TL.rows[k - 1];
      out.push({ row: r.n, kind: "between rows", before: r.words[0].text, after: p.words.at(-1).text, at: r2(p.words.at(-1).endAt), silence: r2(r.words[0].at - p.words.at(-1).endAt) });
    }
  });
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"))) {
  for (const r of TL.rows) {
    console.log("row " + r.n + "  " + r.from.toFixed(2) + " to " + r.to.toFixed(2) + "  (" + (r.to - r.from).toFixed(2) + " s)");
    for (const p of r.phrases) console.log("   " + r2(r.words[p.first].at).toFixed(2) + " to " + r2(r.words[p.last].endAt).toFixed(2) + "  " + p.text);
  }
  const g = gaps();
  console.log("\nsilences of 0.3 s or more:");
  for (const x of g) console.log("  row " + x.row + "  " + x.kind.padEnd(12) + " " + x.silence.toFixed(2) + " s at " + x.at.toFixed(2) + "  '" + x.after + "' -> '" + x.before + "'");
  const inRow = g.filter((x) => x.kind === "inside row"), between = g.filter((x) => x.kind === "between rows");
  console.log("\nlargest inside a row: " + Math.max(...inRow.map((x) => x.silence)).toFixed(2) + " s (limit " + MAX_PAUSE + ")");
  console.log("largest between rows: " + Math.max(...between.map((x) => x.silence)).toFixed(2) + " s (limit " + MAX_ROW_GAP + ")");
  console.log("length " + TL.length.toFixed(2) + " s");
}
