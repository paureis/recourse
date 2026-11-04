#!/usr/bin/env node
/*
  Builds the silent picture for the Recourse video with ffmpeg, row by row, timed to the voice (round 2, Nov 3).

  usage (Git Bash or PowerShell, from the repo root):
    node video/backup.mjs              build every row, concat, then check
    node video/backup.mjs build 3      rebuild row 3 only, then concat and check
    node video/backup.mjs check        check the finished MP4 only (frames, contact sheet, ffprobe, timer holds)

  Every program time comes from video/timeline.mjs, which places the ElevenLabs voice rows end to end with short
  pauses; voice-mix.mjs reads the same timeline, so a cut or a mark cannot drift from its word. at(row, "words") is
  the program time those words start. Pieces end on a word; marks (red ink, video/ink.mjs) draw on at their word.
  The Nov 2 fixed-time cut (180 s, by word proportion) is this file at recourse commit 73de90e.

  THE TABLE (NOV2) holds the Nov 2 take's sources and clip offsets; ROWS below says what plays over which words.
  Needs ffmpeg and ffprobe 8 on PATH. Writes only under T.partsDir, T.checkDir and T.out.
*/
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { TL, at as V, end as E, row as tlRow } from "./timeline.mjs";
import { renderMark } from "./ink.mjs";

// ============================================ THE TABLE ============================================
const TEMP = "C:/Users/pau/AppData/Local/Temp/claude";
const SHOTS2 = TEMP + "/video-shots-2026-11-02";
const NOV2 = {
  take: "nov2",
  // Part 1: the live dc-001 run (case c_6f3143), from the landing to the Trust tick. Part 2: a free reload of
  // c_6f3143 (the top, the exhibit pair and the panel, the letter). Part 3: the photo intake. 25 fps, frame time = index / 25.
  clip: SHOTS2 + "/clip-dc001-2026-11-02.webm",        // 78.16 s, 1,954 frames
  clip2: SHOTS2 + "/clip-dc001-2026-11-02-part2.webm", // 50.00 s, 1,250 frames
  clip3: SHOTS2 + "/photo/clip-photo-2026-11-02.webm", // 17.80 s, 445 frames
  // The click on Confirm falls between frames 25.68 and 25.72; 25.70 makes the Trust tick (77.12) read 51.42,
  // the page's own Confirm-to-tick time.
  timerZero: 25.70,
  stills: {
    letterPage: TEMP + "/video-shots/seg1-letter-page-view.png", // row 1: a local page of dc-001's text
    landing: SHOTS2 + "/seg2-landing-view.png",
    landingEnd: SHOTS2 + "/seg8-landing-view.png",
    pastedTop: SHOTS2 + "/seg2-pasted-letter-top-view.png",     // "1,144 of 6,000 characters. Ready."
    exhibitPair: SHOTS2 + "/seg4-exhibit-pair-view.png",        // part 2, scrollY 363, the clip piece's scroll
    seeThePage: SHOTS2 + "/seg4-see-the-page-view.png",
    // Nov 3, 6:30 pm ET: a free reload of c_6f3143 at 1280 by 800 (headless, no clicks; one cached vision-check POST),
    // scrolled to page 1 of the appeal letter (scrollY 1314). The letter's date line reads the viewing day.
    // Recaptured at 2x the same evening (same scroll) so row 5 can frame the sheet alone: the side column's header there
    // says "33 days left" (Nov 3) while the deadline beat says 34 (Nov 2), so it stays out of frame.
    letterPage1: TEMP + "/video-shots-2026-11-03/seg5-letter-page1-2x.png",
    letterSheet: SHOTS2 + "/seg5-letter-sheet-view.png",        // page 2 of 2 with sidenotes 2 and 3
    caseTop: SHOTS2 + "/seg5-second-opinion-view.png",          // the top: the stamp, "Appeal by Dec 6, 2026", the second opinion
    notSettled: SHOTS2 + "/seg6-notsettled-stamp-view.png",     // c_d2d12f reload
  },
  // Ranges that must never reach the output. The build stops if a piece touches one. [from, to, why, source]
  badClip: [
    [25.72, 26.84, "after the Confirm click: the confirmed card flashes, 'Loading the case...', then the glide to the slip"],
    [62.76, 63.20, "the stamp lands with a layout jump, then the scroll to the very top (mid-scroll frames)"],
    [0.00, 0.36, "page load: blank and first-paint frames", "clip2"],
    [16.24, 17.10, "the panel closes at 16.24 and focus goes back to the crop", "clip2"],
    [0.00, 3.08, "page load: white frames until the first paint", "clip3"],
    [15.60, 15.68, "the case card arrives with a full-page jump", "clip3"],
  ],
  // Row 3's five run segments: the earliest `in` each may start from, the `out` the timer stops on (the latest
  // usable frame for C, the fixed events for D and E). The timeline decides how much of each plays.
  run: {
    A: { in: 26.88, maxPlay: 4.0 },              // "Planning the questions...", the record sheet open
    B: { in: 40.00, maxPlay: 8.6 },              // the first finding lands at 40.48; "Question 3 of 7", then 4 of 7 (static from 46)
    C: { in: 57.60, maxOut: 62.68 },             // "Question 7 of 7", Steelman from 58.00 (static to 62.72; the stamp jump at 62.76)
    D: { out: 66.40, minIn: 63.40 },             // the stamp at the top; "is deciding..." turns to "agrees" at 66.00
    E: { in: 75.84, out: 77.12 },                // "Trust: Checking the letter against itself..." ticks at 77.12
  },
  out: TEMP + "/video-edit/take-2026-11-03b.mp4",
  partsDir: TEMP + "/video-edit/take-parts-3b",
  checkDir: TEMP + "/video-edit/take-check-3b",
};
if (String(process.env.BACKUP_TAKE || "nov2").toLowerCase() !== "nov2") throw new Error("only the Nov 2 take builds on the voice timeline; the Oct 29 build is in git history");
const T = { ...NOV2, length: TL.length };
// ========================================= END OF THE TABLE =========================================

const FPS = 25;
const W = 1280, H = 800;
const C = { ink: "0x1b1b1b", bond: "0xffffff", faded: "0x4e493d", red: "0xb3261e", manila: "0xe6d3a3", hairline: "0xcebd93" };
const FONT = { sans: "arial.ttf", bold: "arialbd.ttf", mono: "CascadiaMono.ttf", big: "impact.ttf" };
const TIMER = { x: 1032, y: 748, w: 236, h: 40 };

const pf = (s) => Math.floor(s * FPS + 0.5 + 1e-9); // program seconds -> frame index
const cf = (s) => Math.ceil(s * FPS - 1e-6);        // clip seconds -> the first clip frame at or after it
const sec = (f) => +(f / FPS).toFixed(2);
const fontArg = (f) => "'C\\:/Windows/Fonts/" + f + "'";
const log = { rows: [], marks: [], timer: [], shots: [] };
const shot = (t, what) => log.shots.push([+t.toFixed(2), what]);

// ============================================ THE ROWS ============================================
// Pieces run back to back; each ends at `to` (program seconds). A still may push in (`push`); marks are red ink drawn
// on the piece (page coordinates, under the push). Layers sit over the row (cards, chips, the numbers).
const R = (n) => tlRow(n);
const ink = {
  underline: (x0, x1, y, o = {}) => ({ kind: "underline", x0, x1, y, ...o }),
  ellipse: (box, o = {}) => ({ kind: "ellipse", box, ...o }),
  arrow: (from, to, o = {}) => ({ kind: "arrow", from, to, ...o }),
  check: (x, y, size, o = {}) => ({ kind: "check", x, y, size, ...o }),
};

function rows() {
  // row 2: the Confirm view scrolls from clip 22.84 and settles at 23.80; it lands 0.1 s before "Confirm" is said
  const confirmFrom = V(2, "Confirm") - 0.96 - 0.1;
  // row 3: the run segments, cut on the voice
  const segA = { to: V(3, "and answers") - 0.1 }, segB = { to: V(3, "Before it decides") - 0.1 };
  const segC = { to: V(3, "Then the stamp") - 0.1 }, segD = { to: V(3, "this takes") - 0.1 }, segE = { to: R(3).to };
  // row 4: the panel opens 0.2 s into the clip piece; the cut is on "See"
  const panelCut = V(4, "See the page") + 0.12;
  return [
    { n: 1, pieces: [
        { still: "letterPage", to: R(1).to, push: { x: 688, y: 563, zoom: 0.07 },
          // "Its reason: ..." the reason line (dc-001's sentence, x 517 to 860, ink y 555 to 571)
          marks: [{ ...ink.underline(515, 862, 577), at: V(1, "reason"), what: "row1-reason-line" }] },
      ],
      layers: [{ kind: "card1", at: V(1, "Most people"), fade: 0.4 }] },
    { n: 2, pieces: [
        { still: "landing", to: V(2, "Add the letter") - 0.1, push: { x: 640, y: 300, zoom: 0.035 } },
        // the photo: the desk, the press on "Choose a PDF or image" (6.76), the thumbnail and "Reading your letter" (7.28)
        { clip: [6.24], src: "clip3", max: 9.40, to: V(2, "or paste it") - 0.1,
          marks: [{ ...ink.ellipse([919, 293, 979, 333], { padX: 6, padY: 6, draw: 0.3, width: 3.6 }), atPiece: 0, untilPiece: 1.0, what: "row2-photo-click" }] },
        { clip: [5.00], src: "clip3", max: 6.16, to: V(2, "and click") - 0.1 },
        { still: "pastedTop", to: V(2, "Muse Spark") - 0.1,
          marks: [{ ...ink.arrow([440, 728], [312, 767]), at: V(2, "Read this letter") - 0.15, what: "row2-read-this-letter" }] },
        // "Reading your letter" to "Finding the program, done" (16.44); the card arrives on "card"
        { clipEnd: 16.44, to: V(2, "card") },
        { clip: [16.48, 17.48], hold: true, to: confirmFrom },
        { clip: [22.84, 25.68], hold: true, to: R(2).to,
          marks: [{ ...ink.arrow([352, 598], [254, 636]), at: V(2, "Confirm") - 0.1, what: "row2-confirm" }] },
      ] },
    { n: 3, run: true, segs: { A: segA, B: segB, C: segC, D: segD, E: segE },
      // "Then the stamp." under the stamp (x 134 to 664, y 122 to 258 at the top of the page)
      marks: { D: [{ ...ink.underline(160, 650, 270, { slope: -6, width: 4.6 }), at: V(3, "the stamp") - 0.05, what: "row3-stamp" }] } },
    { n: 4, pieces: [
        { still: "exhibitPair", to: panelCut,
          marks: [
            // "The letter says": the letter's line "limits private duty nursing to 8 hours per" (ink x 248 to 577, y 209 to 225)
            { ...ink.underline(244, 580, 231), at: V(4, "The letter says") + 0.05, what: "row4-letter-8-hours" },
            // "The policy says up to twenty-four hours": "up to 24 hours" (x 879 to 983, y 154 to 168)
            { ...ink.ellipse([879, 153, 983, 169], { padX: 5, padY: 9, tilt: -1.5, width: 3.8 }), at: V(4, "up to twenty-four") - 0.1, what: "row4-policy-24-hours" },
            // "Click See the page": the click ring on Exhibit 2's crop, where the click lands (901, 321)
            { ...ink.ellipse([873, 305, 929, 337], { padX: 6, padY: 6, draw: 0.3, width: 3.8, seed: 41 }), at: V(4, "Click") - 0.05, toCut: true, what: "row4-click-see-the-page" },
          ] },
        // the panel opens (11.24), the page and the highlight draw (11.60, 11.84); from 12.2 the frame is the still below
        { clip: [11.04], src: "clip2", max: 14.20, to: V(4, "located") - 0.15,
          // the same ring, already drawn, until the panel opens (0.2 s in)
          marks: [{ ...ink.ellipse([873, 305, 929, 337], { padX: 6, padY: 6, draw: 0.08, width: 3.8, seed: 41 }), atPiece: 0, untilPiece: 0.2, what: "row4-click-ring-on-clip" }] },
        { still: "seeThePage", to: R(4).to, push: { x: 1000, y: 700, zoom: 0.04 },
          marks: [
            // "Every quote is located on the real page": the highlight on page 5 (x 862 to 1201, y 367 to 393)
            { ...ink.arrow([786, 438], [852, 389], { bulge: -0.15, head: 13, width: 3.8 }), at: V(4, "located") - 0.1, what: "row4-located-on-page" },
            // "Here, it matches": "and matches the quote." (x 821 to 983, ink y 765 to 778)
            { ...ink.underline(818, 986, 785), at: V(4, "Here it matches"), what: "row4-matches" },
          ] },
      ] },
    { n: 5, pieces: [
        // on the sheet only (the window is x 69 to 743, the side column starts at 764), gliding from the date line down to the claims
        { still: "letterPage1", to: V(5, "Every claim") - 0.1, pan: { zoom: 1.9, from: [406, 300], to: [406, 510] }, what: "row5-letter-page-1" },
        { still: "letterSheet", to: V(5, "The deadline comes") - 0.1, push: { x: 400, y: 330, zoom: 0.035 }, what: "row5-letter-page-2",
          marks: [
            // "carries a citation": sidenote mark 3 (x 296 to 303, y 283 to 299) and its "Found on page 5" (x 819 to 932)
            { ...ink.ellipse([296, 283, 304, 299], { padX: 6, padY: 5, width: 3.2, draw: 0.3 }), at: V(5, "citation") - 0.1, what: "row5-citation-3" },
            { ...ink.underline(816, 935, 448), at: V(5, "passed the same"), what: "row5-found-on-page" },
          ] },
        { still: "caseTop", to: V(5, "Last a second") - 0.1,
          marks: [
            // "December sixth": "Dec 6, 2026" (x 877 to 1030, y 143 to 168); "with the days left": "34 days left" (x 736 to 879)
            { ...ink.arrow([1112, 116], [1040, 152], { bulge: 0.2, head: 15 }), at: V(5, "December") - 0.2, what: "row5-december-sixth" },
            { ...ink.underline(733, 883, 209), at: V(5, "days left") - 0.15, what: "row5-days-left" },
          ] },
        // the same still: push in on "Second opinion: Muse Spark Open agrees." (x 138 to 442, y 311 to 324) until "Here",
        // then the check on "agrees"
        { still: "caseTop", to: R(5).to, push: { x: 290, y: 318, zoom: 0.7, center: [560, 420], until: V(5, "Here it agrees") - 0.1 },
          marks: [
            { ...ink.underline(214, 446, 331, { width: 3.4 }), at: V(5, "Here it agrees") - 0.05, draw: 0.35, what: "row5-second-opinion-line" },
            { ...ink.check(462, 324, 22, { width: 3.6 }), at: V(5, "agrees") - 0.05, draw: 0.3, what: "row5-agrees-check" },
          ] },
      ] },
    { n: 6, pieces: [
        { still: "notSettled", to: R(6).to, push: { x: 400, y: 190, zoom: 0.05 },
          // "the documents do not settle it": under the stamp (x 134 to 664, y 122 to 258)
          marks: [{ ...ink.underline(160, 650, 270, { slope: -6, width: 4.6 }), at: V(6, "do not settle") - 0.1, what: "row6-not-settled" }] },
      ] },
    { n: 7, card: "numbers" },
    { n: 8, pieces: [{ still: "landingEnd", to: R(8).to, push: { x: 640, y: 380, zoom: 0.04 } }],
      layers: [
        { kind: "chip", text: "recourse-murex.vercel.app", at: V(8, "recourse-murex") - 0.1, xy: [690, 586], fade: 0.3 },
        { kind: "chip", text: "github.com/paureis/recourse", at: V(8, "paureis") - 0.1, xy: [690, 662], fade: 0.3 },
      ] },
  ].map((r) => ({ ...r, from: R(r.n).from, to: R(r.n).to }));
}
const ROWS = rows();

// Row 7: the numbers, one stat a sentence (the same facts as the Nov 2 card lines). `count` lands as the number is said.
function numbersSpec() {
  const fin = (w) => E(7, w) - 0.05; // a count lands just before the voice finishes its number
  return [
    { at: V(7, "We tested") - 0.15, big: [{ n: 30, land: fin("thirty") }], label: "reviewed denial letters", sub: "tested three times" },
    { at: V(7, "The verdict was") - 0.15, big: [{ n: 25, land: fin("twenty-five") }, { n: 28, land: fin("twenty-eight"), pre: "–" }],
      label: "of 30 verdicts right", sub: "12 or 13 of 13 where the denial\ndid not match the policy", subAt: V(7, "twelve") - 0.1 },
    { at: V(7, "All two hundred") - 0.15, big: [{ n: 224, land: fin("twenty-four") }], label: "of 224 letter claims\nverified against the page", sub: "71 of 71, 75 of 75, 78 of 78" },
    { at: V(7, "The open model") - 0.15, big: [{ n: 79, land: fin("seventy-nine") }], label: "of 84: the open model\nagreed", sub: "Muse Spark Open" },
    { at: V(7, "About ten cents") - 0.15, big: [{ n: 10, land: fin("cents"), money: true }], label: "about, per case", sub: "" },
    { at: V(7, "Every number") - 0.15, repo: true, label: "Every number is\nin the repo:", url: "github.com/paureis/recourse", urlAt: V(7, "repo") - 0.15 },
  ];
}
// ========================================= END OF THE ROWS =========================================

function ff(args, opts = {}) {
  const r = spawnSync(opts.bin || "ffmpeg", opts.bin ? args : ["-hide_banner", "-v", "error", "-y", ...args],
    { cwd: T.partsDir, encoding: opts.binary ? "buffer" : "utf8", maxBuffer: 1 << 30 });
  if (r.status !== 0) {
    process.stderr.write(String(r.stderr));
    throw new Error((opts.bin || "ffmpeg") + " failed: " + args.join(" ").slice(0, 400));
  }
  return r;
}
let fileSeq = 0, curRow = 0;
function textFile(text) {
  const name = "txt-row" + curRow + "-" + String(++fileSeq).padStart(3, "0") + ".txt";
  fs.writeFileSync(path.join(T.partsDir, name), text, { encoding: "utf8" });
  return name;
}
function drawtext(o) {
  const parts = ["fontfile=" + fontArg(o.font), "textfile=" + textFile(o.text), "fontsize=" + o.size,
    "fontcolor=" + o.color, "x=" + o.x, "y=" + o.y, "expansion=" + (o.expand ? "normal" : "none")];
  if (o.spacing) parts.push("line_spacing=" + o.spacing);
  if (o.enable) parts.push("enable='" + o.enable + "'");
  if (o.alpha) parts.push("alpha='" + o.alpha + "'");
  return "drawtext=" + parts.join(":");
}
// drawtext draws a newline as a box glyph, so a text with "\n" becomes one drawtext per line
function splitLines(o) {
  return o.text.split("\n").map((line, k) => ({ ...o, text: line, y: o.y + k * (o.size + (o.spacing || 0)), spacing: undefined }));
}
function makeImage(name, w, h, bg, opsIn) {
  const ops = opsIn.flatMap((o) => o.box || !o.text.includes("\n") ? [o] : splitLines(o));
  const vf = ops.map((o) => o.box
    ? "drawbox=x=" + o.box[0] + ":y=" + o.box[1] + ":w=" + o.box[2] + ":h=" + o.box[3] + ":color=" + o.color + ":t=" + (o.t || "fill")
    : drawtext(o)).join(",");
  ff(["-f", "lavfi", "-i", "color=c=" + bg + ":s=" + w + "x" + h + ":d=0.04", ...(vf ? ["-vf", vf] : []), "-frames:v", "1", "-update", "1", name]);
  return name;
}
// the ink box of a text drawn at (0, 0): render it dark on white and scan
function measureText(font, size, text) {
  const name = "measure.png";
  makeImage(name, 1200, size * 2, "white", [{ font, text, size, color: "black", x: 0, y: 0 }]);
  const r = ff(["-v", "error", "-i", name, "-f", "rawvideo", "-pix_fmt", "gray", "-"], { bin: "ffmpeg", binary: true });
  const b = r.stdout, w = 1200, h = size * 2;
  let x0 = w, x1 = -1, y0 = h, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (b[y * w + x] < 128) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return { x0, x1, y0, y1 };
}

// ---------- one row ----------
function buildRow(row) {
  curRow = row.n; fileSeq = 0;
  const args = [], chains = [], used = [];
  let nIn = 0;
  const input = (a) => { args.push(...a); return nIn++; };
  const rowF0 = pf(row.from), rowF = pf(row.to) - rowF0;
  const rowDur = (rowF / FPS).toFixed(2);
  const local = (p) => p - rowF0 / FPS; // program seconds -> row seconds
  const norm = "setsar=1,settb=AVTB,setpts=N/" + FPS + "/TB";
  const pieces = [];
  const rlog = { row: row.n, program: [sec(rowF0), sec(pf(row.to))], frames: rowF, pieces: [], layers: [] };
  const markDir = path.join(T.partsDir, "marks");

  if (row.run) {
    // the five segments: each piece runs to its `to`; play as much footage as fits, honest timer on top
    let prev = row.from;
    for (const id of ["A", "B", "C", "D", "E"]) {
      const s = T.run[id], to = row.segs[id].to;
      const n = pf(to) - pf(prev);
      let inT, outT;
      if (id === "A" || id === "B") { inT = s.in; outT = s.in + Math.min(s.maxPlay, (n - 8) / FPS); }       // hold at least 0.32 s
      else if (id === "C") { inT = s.in; outT = Math.min(s.maxOut, s.in + (n - 8) / FPS); }
      else if (id === "D") { outT = s.out; inT = Math.max(s.minIn, s.out - (n - 1) / FPS); }
      else { inT = s.in; outT = s.out; }
      pieces.push({ clip: [+inT.toFixed(2), +outT.toFixed(2)], hold: true, to, from: prev, seg: { id, out: outT, final: id === "E" },
        marks: (row.marks && row.marks[id]) || [] });
      prev = to;
    }
  } else if (row.pieces) {
    let prev = row.from;
    for (const p of row.pieces) pieces.push({ ...p, from: prev }), (prev = p.to);
  }

  pieces.forEach((p, k) => {
    const pF0 = pf(p.from), n = pf(p.to) - pF0;
    if (n <= 0) throw new Error("row " + row.n + " piece " + k + " has " + n + " frames");
    const plocal = (t) => t - pF0 / FPS;
    let chain;
    const plog = { program: [sec(pF0), sec(pf(p.to))], frames: n };
    if (p.still) {
      const file = T.stills[p.still];
      const i = input(["-loop", "1", "-framerate", String(FPS), "-t", (n / FPS + 0.2).toFixed(2), "-i", file]);
      chain = "[" + i + ":v]format=rgb24,trim=end_frame=" + n + "," + norm;
      Object.assign(plog, { source: path.basename(file), push: p.push || undefined });
      if (p.what) shot(sec(pF0) + 0.3, p.what);
    } else {
      // a clip piece (from T.clip, or from the table entry its `src` names)
      const src = p.src || "clip";
      if (!T[src]) throw new Error("row " + row.n + " piece " + k + ": no clip source " + src);
      let a, last;
      if (p.hold) {
        a = cf(p.clip[0]); last = cf(p.clip[1]);
        if (last - a + 1 > n) throw new Error("row " + row.n + " piece " + k + ": " + (last - a + 1) + " clip frames do not fit in " + n);
      } else if (p.clipEnd !== undefined) {
        last = cf(p.clipEnd); a = last - n + 1;
      } else {
        a = cf(p.clip[0]); last = a + n - 1;
        if (p.max !== undefined && last > cf(p.max)) throw new Error("row " + row.n + " piece " + k + ": plays to clip " + sec(last) + ", past " + p.max);
      }
      const played = last - a + 1;
      const i = input(["-t", (last / FPS + 1).toFixed(2), "-i", T[src]]);
      chain = "[" + i + ":v]trim=start_frame=" + a + ":end_frame=" + (last + 1) + ",format=rgb24,setpts=PTS-STARTPTS" +
        (n > played ? ",tpad=stop_mode=clone:stop=" + (n - played) : "") + ",trim=end_frame=" + n + "," + norm;
      for (const [b0, b1, why, bsrc] of T.badClip) {
        if ((bsrc || "clip") !== src) continue;
        if (sec(a) <= b1 && sec(last) >= b0) throw new Error("row " + row.n + " piece " + k + " uses " + src + " " + sec(a) + " to " + sec(last) + ", inside a bad range: " + why);
      }
      used.push([src, sec(a), sec(last)]);
      Object.assign(plog, { source: src, clipFirst: sec(a), clipLast: sec(last), playFrames: played, holdFrames: n - played });
      if (p.seg) {
        // the elapsed timer: clip time of the frame shown, minus the zero; stops on the frame at `out`
        const stop = last;
        const A = (a / FPS - T.timerZero).toFixed(2), P = ((stop - a) / FPS).toFixed(2);
        const Rr = "round((" + A + "+min(t," + P + "))*10)";
        const tx = TIMER.x, ty = TIMER.y;
        chain += ",drawbox=x=" + tx + ":y=" + ty + ":w=" + TIMER.w + ":h=" + TIMER.h + ":color=" + C.ink + ":t=fill";
        if (p.seg.final) {
          chain += "," + drawtext({ font: FONT.mono, text: "elapsed", size: 20, color: C.bond, x: tx + 14, y: ty + 10, enable: "lt(t," + P + ")" });
          chain += "," + drawtext({ font: FONT.mono, text: "reviewed", size: 20, color: C.bond, x: tx + 14, y: ty + 10, enable: "gte(t," + P + ")" });
        } else {
          chain += "," + drawtext({ font: FONT.mono, text: "elapsed", size: 20, color: C.bond, x: tx + 14, y: ty + 10 });
        }
        chain += "," + drawtext({ font: FONT.mono, text: "%{eif:floor(" + Rr + "/10):d}.%{eif:mod(" + Rr + ",10):d} s", expand: true,
          size: 20, color: C.bond, x: "'" + (tx + TIMER.w - 14) + "-tw'", y: ty + 10 });
        const tIn = Math.round((a / FPS - T.timerZero) * 10) / 10, tOut = Math.round((stop / FPS - T.timerZero) * 10) / 10;
        Object.assign(plog, { seg: p.seg.id, timerIn: tIn, timerOut: tOut });
        log.timer.push({ seg: p.seg.id, clipIn: sec(a), clipOut: sec(stop), timerIn: tIn, timerOut: tOut,
          playS: +((stop - a) / FPS).toFixed(2), holdS: +((n - (stop - a)) / FPS).toFixed(2), program: [sec(pF0), sec(pf(p.to))],
          holdProgram: [sec(pF0 + stop - a), sec(pf(p.to))] });
      }
    }
    // red ink marks, in page coordinates, under any push
    let cur = "[pc" + k + "]";
    chains.push(chain + cur);
    (p.marks || []).forEach((m, j) => {
      const name = "r" + row.n + "p" + k + "m" + j;
      const mk = renderMark(m, markDir, name);
      const at = m.atPiece !== undefined ? m.atPiece : plocal(m.at);
      const untilEnd = m.untilPiece !== undefined ? m.untilPiece : m.toCut ? n / FPS : n / FPS - 0.2; // fades over the piece's last 0.2 s, or holds to the cut
      if (at < 0 || at > untilEnd - 0.2) throw new Error("row " + row.n + " mark " + (m.what || name) + " at " + at.toFixed(2) + " s does not fit its piece (" + (n / FPS).toFixed(2) + " s)");
      const mi = input(["-framerate", String(FPS), "-i", path.join(markDir, mk.pattern)]);
      const hold = (untilEnd - at + 1).toFixed(2);
      chains.push("[" + mi + ":v]format=rgba,tpad=stop_mode=clone:stop_duration=" + hold + ",fade=t=out:st=" + (untilEnd - at).toFixed(3) +
        ":d=0.2:alpha=1,setpts=PTS-STARTPTS+" + at.toFixed(3) + "/TB[mk" + k + "_" + j + "]");
      const out = "[pc" + k + "_" + j + "]";
      chains.push(cur + "[mk" + k + "_" + j + "]overlay=x=" + mk.x + ":y=" + mk.y + ":format=rgb:eof_action=pass:enable='between(t," + at.toFixed(3) + "," + (untilEnd + 0.2).toFixed(3) + ")'" + out);
      cur = out;
      const prog = pF0 / FPS + at;
      log.marks.push({ row: row.n, what: m.what || name, kind: m.kind, start: +prog.toFixed(2), drawn: +(prog + mk.frames / FPS).toFixed(2), until: +(pF0 / FPS + untilEnd).toFixed(2), box: [mk.x, mk.y, mk.w, mk.h] });
      shot(prog + mk.frames / FPS + 0.08, "mark-" + (m.what || name));
    });
    // the push-in: zoom toward (x, y), eased, on every frame (marks included), from a 3x upscale for sub-pixel steps
    if (p.push) {
      const S = 3, z0 = p.push.zoom;
      const dF = p.push.until !== undefined ? Math.max(1, pf(p.push.until) - pF0) : n - 1;
      const u = "clip(on/" + dF + ",0,1)", e = "(3*" + u + "*" + u + "-2*" + u + "*" + u + "*" + u + ")";
      const z = "1+" + z0 + "*" + e;
      const [cx, cy] = p.push.center || [p.push.x, p.push.y];
      const sx = "(" + p.push.x + "+(" + (cx - p.push.x) + ")*" + e + ")", sy = "(" + p.push.y + "+(" + (cy - p.push.y) + ")*" + e + ")";
      const X = "max(0,min(" + S * W + "-" + S * W + "/zoom," + S + "*(" + p.push.x + "-" + sx + "/zoom)))";
      const Y = "max(0,min(" + S * H + "-" + S * H + "/zoom," + S + "*(" + p.push.y + "-" + sy + "/zoom)))";
      chains.push(cur + "scale=" + S * W + ":" + S * H + ":flags=bicubic,zoompan=z='" + z + "':x='" + X + "':y='" + Y + "':d=1:s=" + W + "x" + H + ":fps=" + FPS + ",format=rgb24," + norm + "[p" + k + "]");
    } else if (p.pan) {
      // a fixed zoom with the window's centre gliding from `from` to `to` (1x page coordinates), eased; the still is a
      // 2x capture, so the crop is near native resolution
      const S = 2, z = p.pan.zoom;
      const u = "clip(on/" + (n - 1) + ",0,1)", e = "(3*" + u + "*" + u + "-2*" + u + "*" + u + "*" + u + ")";
      const cx = "(" + p.pan.from[0] + "+(" + (p.pan.to[0] - p.pan.from[0]) + ")*" + e + ")", cy = "(" + p.pan.from[1] + "+(" + (p.pan.to[1] - p.pan.from[1]) + ")*" + e + ")";
      const X = S + "*(" + cx + "-" + W / 2 + "/zoom)", Y = S + "*(" + cy + "-" + H / 2 + "/zoom)";
      chains.push(cur + "scale=" + S * W + ":" + S * H + ":flags=bicubic,zoompan=z='" + z + "':x='" + X + "':y='" + Y + "':d=1:s=" + W + "x" + H + ":fps=" + FPS + ",format=rgb24," + norm + "[p" + k + "]");
    } else {
      chains.push(cur + "null[p" + k + "]");
    }
    rlog.pieces.push(plog);
  });

  let cur;
  if (row.card === "numbers") {
    cur = numbersRow(row, rowF, input, chains, local);
    rlog.pieces.push({ program: [sec(rowF0), sec(pf(row.to))], frames: rowF, source: "the numbers, made in the edit" });
  } else {
    chains.push(pieces.map((_, k) => "[p" + k + "]").join("") + "concat=n=" + pieces.length + ":v=1:a=0[base]");
    cur = "[base]";
  }

  function overlay(under, png, x, y, at, until, fade, id) {
    const i = input(["-loop", "1", "-framerate", String(FPS), "-t", (rowF / FPS + 0.2).toFixed(2), "-i", png]);
    chains.push("[" + i + ":v]format=rgba,fade=t=in:st=" + at.toFixed(2) + ":d=" + fade + ":alpha=1[l" + id + "]");
    const out = "[o" + id + "]";
    chains.push(under + "[l" + id + "]overlay=x=" + x + ":y=" + y + ":format=rgb:eof_action=pass:enable='between(t," + at.toFixed(2) + "," + until + ")'" + out);
    return out;
  }
  for (const [k, L] of (row.layers || []).entries()) {
    const at = local(L.at);
    if (L.kind === "card1") {
      const img = makeImage("card-row1.png", 680, 184, C.bond, [
        { box: [0, 0, 680, 184], color: C.ink, t: 2 },
        { font: FONT.bold, text: "Denials are rarely appealed.", size: 36, color: C.ink, x: 34, y: 32 },
        { font: FONT.bold, text: "43 to 67% of appeals succeed.", size: 36, color: C.ink, x: 34, y: 78 },
        { font: FONT.sans, text: "(KFF, 2025 data)", size: 22, color: C.faded, x: 34, y: 132 },
      ]);
      cur = overlay(cur, img, 300, 612, at, rowDur, L.fade, "c" + k);
      rlog.layers.push({ what: "KFF card", at: +L.at.toFixed(2) });
      shot(L.at + L.fade + 0.1, "row1-kff-card");
    } else if (L.kind === "chip") {
      const img = makeImage("chip-" + k + ".png", 480, 58, C.ink, [{ font: FONT.bold, text: L.text, size: 28, color: C.bond, x: "(w-tw)/2", y: 15 }]);
      cur = overlay(cur, img, L.xy[0], L.xy[1], at, rowDur, L.fade, "u" + k);
      rlog.layers.push({ what: "URL chip " + L.text, at: +L.at.toFixed(2) });
      shot(L.at + L.fade + 0.1, "row8-chip-" + L.text.split(/[./]/)[0]);
    }
  }
  chains.push(cur + "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p[out]");

  const graphFile = "row-" + row.n + ".graph.txt";
  fs.writeFileSync(path.join(T.partsDir, graphFile), chains.join(";\n"), "utf8");
  const outFile = "row-" + row.n + ".mp4";
  ff([...args, "-/filter_complex", graphFile, "-map", "[out]", "-frames:v", String(rowF), "-r", String(FPS),
    "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p",
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
    "-video_track_timescale", "12800", "-an", outFile]);
  const got = probeFrames(path.join(T.partsDir, outFile));
  if (got !== rowF) throw new Error("row " + row.n + ": " + got + " frames, expected " + rowF);
  rlog.clipUsed = used;
  shot(sec(rowF0), "row" + row.n + "-start");
  console.log("row " + row.n + ": " + rowF + " frames (" + rowDur + " s), ok");
  return rlog;
}

// Row 7: a bond sheet on the manila folder; six tiles, one per spoken sentence; each number counts up and lands
// as the voice finishes it, then a red ink underline draws under it.
function numbersRow(row, rowF, input, chains, local) {
  const base = makeImage("numbers-base.png", W, H, C.manila, [
    { box: [96, 56, 1088, 688], color: C.bond },
    { box: [96, 56, 1088, 688], color: C.ink, t: 1 },
    { font: FONT.mono, text: "CASE EVALUATION · three full runs", size: 18, color: C.faded, x: 136, y: 92 },
    { box: [136, 126, 1008, 1], color: C.hairline },
  ]);
  const i = input(["-loop", "1", "-framerate", String(FPS), "-t", (rowF / FPS + 0.2).toFixed(2), "-i", base]);
  let chain = "[" + i + ":v]format=rgb24,trim=end_frame=" + rowF + ",setsar=1,settb=AVTB,setpts=N/" + FPS + "/TB";
  const cols = [136, 480, 824], tops = [160, 448];
  const BIG = 118;
  const fade = (t) => "clip((t-" + t.toFixed(3) + ")/0.3,0,1)";
  const marks = [];
  numbersSpec().forEach((s, k) => {
    const x0 = cols[k % 3], y0 = tops[Math.floor(k / 3)], at = local(s.at);
    const en = "gte(t," + at.toFixed(3) + ")";
    chain += ",drawbox=x=" + x0 + ":y=" + y0 + ":w=300:h=3:color=" + C.ink + ":t=fill:enable='" + en + "'";
    if (s.big) {
      let x = x0;
      let bigBox = null;
      for (const b of s.big) {
        const finalText = (b.pre || "") + (b.money ? "$0.10" : String(b.n));
        const mbox = measureText(FONT.big, BIG, finalText);
        const t1 = local(b.land), t0 = t1 - 0.8;
        const ease = "(1-pow(1-clip((t-" + t0.toFixed(3) + ")/0.8,0,1),3))";
        const num = b.money ? "$0.%{eif:round(10*" + ease + "):d:2}" : (b.pre || "") + "%{eif:round(" + b.n + "*" + ease + "):d}";
        // a later counter in the same tile (the "–28") shows only once its count starts
        const enN = b.pre ? "gte(t," + t0.toFixed(3) + ")" : en;
        chain += "," + drawtext({ font: FONT.big, text: num, expand: true, size: BIG, color: C.ink, x, y: y0 + 22, enable: enN, alpha: b.pre ? fade(t0) : fade(at) });
        bigBox = { x0: x0, x1: x + mbox.x1, y1: y0 + 22 + mbox.y1 };
        x += mbox.x1 + 2;
        log.shots.push([+(row.from + t1 + 0.12 + (pf(row.from) / FPS - row.from)).toFixed(2), "row7-count-" + (b.money ? "10c" : b.n)]);
      }
      const lastLand = local(s.big.at(-1).land);
      marks.push({ m: ink.underline(bigBox.x0 - 2, bigBox.x1 + 4, bigBox.y1 + 9, { width: 4.4 }), at: lastLand + 0.05, what: "row7-underline-" + k });
      const lines = s.label.split("\n");
      lines.forEach((ln, j) => { chain += "," + drawtext({ font: FONT.bold, text: ln, size: 24, color: C.ink, x: x0, y: y0 + 162 + j * 32, enable: en, alpha: fade(at) }); });
      const subY = y0 + 162 + lines.length * 32 + 10;
      const subAt = s.subAt !== undefined ? local(s.subAt) : at;
      s.sub.split("\n").filter(Boolean).forEach((ln, j) => { chain += "," + drawtext({ font: FONT.sans, text: ln, size: 19, color: C.faded, x: x0, y: subY + j * 26, enable: "gte(t," + subAt.toFixed(3) + ")", alpha: fade(subAt) }); });
    } else {
      const lines = s.label.split("\n");
      lines.forEach((ln, j) => { chain += "," + drawtext({ font: FONT.bold, text: ln, size: 30, color: C.ink, x: x0, y: y0 + 30 + j * 40, enable: en, alpha: fade(at) }); });
      const uy = y0 + 30 + lines.length * 40 + 22;
      chain += "," + drawtext({ font: FONT.mono, text: s.url, size: 20, color: C.ink, x: x0, y: uy, enable: en, alpha: fade(at) });
      const ub = measureText(FONT.mono, 20, s.url);
      marks.push({ m: ink.underline(x0 - 2, x0 + ub.x1 + 3, uy + ub.y1 + 7, { width: 3.8 }), at: local(s.urlAt), what: "row7-repo-url" });
    }
    shot(row.from + at + 0.4, "row7-tile-" + (k + 1));
  });
  chains.push(chain + "[n0]");
  let cur = "[n0]";
  const markDir = path.join(T.partsDir, "marks");
  marks.forEach(({ m, at, what }, j) => {
    const mk = renderMark({ ...m, draw: 0.35 }, markDir, "r7m" + j);
    const mi = input(["-framerate", String(FPS), "-i", path.join(markDir, mk.pattern)]);
    chains.push("[" + mi + ":v]format=rgba,tpad=stop_mode=clone:stop_duration=" + (rowF / FPS).toFixed(2) + ",setpts=PTS-STARTPTS+" + at.toFixed(3) + "/TB[nm" + j + "]");
    chains.push(cur + "[nm" + j + "]overlay=x=" + mk.x + ":y=" + mk.y + ":format=rgb:eof_action=pass:enable='gte(t," + at.toFixed(3) + ")'[nn" + j + "]");
    cur = "[nn" + j + "]";
    const prog = pf(row.from) / FPS + at;
    log.marks.push({ row: 7, what, kind: m.kind, start: +prog.toFixed(2), drawn: +(prog + mk.frames / FPS).toFixed(2), box: [mk.x, mk.y, mk.w, mk.h] });
  });
  return cur;
}

function probeFrames(file) {
  const r = ff(["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", file], { bin: "ffprobe" });
  return parseInt(r.stdout.trim(), 10);
}

function concatRows() {
  const list = ROWS.map((r) => "file 'row-" + r.n + ".mp4'").join("\n") + "\n";
  fs.writeFileSync(path.join(T.partsDir, "rows.txt"), list, "utf8");
  ff(["-f", "concat", "-safe", "0", "-i", "rows.txt", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-t", (pf(T.length) / FPS).toFixed(2),
    "-movflags", "+faststart", T.out]);
}

// ---------- checks on the finished file ----------
function check() {
  fs.rmSync(T.checkDir, { recursive: true, force: true });
  fs.mkdirSync(T.checkDir, { recursive: true });
  const r = ff(["-v", "error", "-count_frames", "-show_entries",
    "format=duration,size:stream=codec_type,codec_name,width,height,pix_fmt,r_frame_rate,nb_read_frames,duration",
    "-of", "json", T.out], { bin: "ffprobe" });
  const probe = JSON.parse(r.stdout);

  const shots = [...log.shots];
  const lastF = (t) => t - 1 / FPS;
  shots.push([+lastF(pf(T.length) / FPS).toFixed(2), "last-frame"]);
  for (const s of log.timer) {
    shots.push([s.program[0], "seg" + s.seg + "-in-timer-" + s.timerIn]);
    shots.push([+lastF(s.holdProgram[1]).toFixed(2), "seg" + s.seg + "-hold-end-timer-" + s.timerOut]);
  }
  shots.sort((a, b) => a[0] - b[0]);
  const names = [];
  for (const [t, what] of shots) {
    const name = "t" + t.toFixed(2).padStart(6, "0") + "-" + what + ".png";
    ff(["-ss", t.toFixed(3), "-i", T.out, "-frames:v", "1", "-update", "1", path.join(T.checkDir, name)]);
    names.push(name);
  }
  // a contact sheet, five across, each frame labelled with its time and name
  const cols = 5, tw = 320, th = 200, rowsN = Math.ceil(names.length / cols);
  const thumbDir = path.join(T.checkDir, "thumbs");
  fs.mkdirSync(thumbDir, { recursive: true });
  names.forEach((n, k) => {
    const lab = textFile(n.replace(/\.png$/, "").slice(0, 44));
    ff(["-i", path.join(T.checkDir, n), "-vf", "scale=" + tw + ":" + th + ",drawtext=fontfile=" + fontArg(FONT.mono) + ":textfile=" + lab +
      ":fontsize=11:fontcolor=white:box=1:boxcolor=black@0.7:x=3:y=3", "-frames:v", "1", "-update", "1", path.join(thumbDir, String(k).padStart(3, "0") + ".png")]);
  });
  ff(["-framerate", "1", "-i", path.join(thumbDir, "%03d.png"), "-vf", "tile=" + cols + "x" + rowsN + ":padding=2:color=white",
    "-frames:v", "1", "-update", "1", path.join(T.checkDir, "contact-sheet.png")]);

  // the timer chip: pixels that change between consecutive frames inside the chip, across row 3
  const r3row = ROWS.find((x) => x.run);
  const s0 = pf(r3row.from) / FPS, dur = (pf(r3row.to) - pf(r3row.from)) / FPS;
  const r3 = ff(["-v", "error", "-ss", s0.toFixed(3), "-i", T.out, "-t", dur.toFixed(3), "-vf", "crop=" + TIMER.w + ":" + TIMER.h + ":" + TIMER.x + ":" + TIMER.y + ",format=gray",
    "-f", "rawvideo", "-"], { bin: "ffmpeg", binary: true });
  const buf = r3.stdout, sz = TIMER.w * TIMER.h, nf = Math.floor(buf.length / sz);
  const changes = [];
  for (let f = 1; f < nf; f++) {
    let c = 0;
    for (let p = 0; p < sz; p++) if (Math.abs(buf[f * sz + p] - buf[(f - 1) * sz + p]) > 64) c++;
    if (c > 8) changes.push(+(s0 + f / FPS).toFixed(2));
  }
  const holdViolations = [];
  for (const s of log.timer) {
    const [h0, h1] = s.holdProgram;
    for (const t of changes) if (t > h0 + 1e-6 && t < h1 - 1e-6) holdViolations.push({ seg: s.seg, t });
  }
  const report = { file: T.out, probe, frames: names, timerChangeFrames: changes.length, holdViolations, marks: log.marks, timer: log.timer,
    timerChangesBySegment: log.timer.map((s) => ({ seg: s.seg, play: [s.program[0], s.holdProgram[0]], hold: s.holdProgram,
      changesInPlay: changes.filter((t) => t > s.program[0] && t <= s.holdProgram[0] + 1e-6).length,
      changesInHold: changes.filter((t) => t > s.holdProgram[0] + 1e-6 && t < s.holdProgram[1] - 1e-6).length })) };
  fs.writeFileSync(path.join(T.checkDir, "check.json"), JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify({ duration: probe.format.duration, frames: names.length, holdViolations, timer: log.timer.map((s) => [s.seg, s.timerIn, s.timerOut, s.playS, s.holdS]), timerChangesBySegment: report.timerChangesBySegment }, null, 1));
  if (holdViolations.length) throw new Error("the timer moved during a hold");
}

// ---------- main ----------
fs.mkdirSync(T.partsDir, { recursive: true });
const [mode = "all", only] = process.argv.slice(2);
const total = ROWS.reduce((s, r) => s + pf(r.to) - pf(r.from), 0);
if (total !== pf(T.length)) throw new Error("rows add up to " + total + " frames, not " + pf(T.length));
for (let k = 1; k < ROWS.length; k++) if (ROWS[k].from !== ROWS[k - 1].to) throw new Error("gap before row " + ROWS[k].n);

const logFile = path.join(T.partsDir, "build-log.json");
const prior = fs.existsSync(logFile) ? JSON.parse(fs.readFileSync(logFile, "utf8")) : { rows: [] };
if (mode === "all" || mode === "build") {
  for (const row of ROWS) {
    if (only && String(row.n) !== String(only)) continue;
    log.rows.push(buildRow(row));
  }
  if (only) {
    // keep the other rows' entries from the last full build
    const keep = (arr, isOther) => (arr || []).filter(isOther);
    for (const r of prior.rows) if (!log.rows.find((x) => x.row === r.row)) log.rows.push(r);
    log.marks.push(...keep(prior.marks, (m) => String(m.row) !== String(only)));
    if (String(only) !== "3") log.timer = prior.timer || [];
    log.shots.push(...keep(prior.shots, ([t]) => { const rr = ROWS.find((x) => t >= x.from && t < x.to); return !rr || String(rr.n) !== String(only); }));
    log.rows.sort((a, b) => a.row - b.row);
  }
  fs.writeFileSync(logFile, JSON.stringify(log, null, 2), "utf8");
  const missing = ROWS.filter((r) => !fs.existsSync(path.join(T.partsDir, "row-" + r.n + ".mp4"))).map((r) => r.n);
  if (missing.length) {
    console.log("rows not built yet: " + missing.join(", ") + "; run without a row number first");
    process.exit(1);
  }
  concatRows();
  console.log("wrote " + T.out + " (" + (pf(T.length) / FPS).toFixed(2) + " s)");
}
if (mode === "check") Object.assign(log, prior);
if (mode === "all" || mode === "build" || mode === "check") check();
