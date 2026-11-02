#!/usr/bin/env node
/*
  Builds the silent three-minute video for the Recourse entry with ffmpeg, row by row per video/edit.md.

  usage (Git Bash or PowerShell, from anywhere):
    node video/backup.mjs              build every row, concat, then check
    node video/backup.mjs build 3      rebuild row 3 only, then concat and check
    node video/backup.mjs check        check the finished MP4 only (frames, ffprobe, timer holds)

  For a new take, change only THE TABLE below: the clip path, the timer zero, the five run segments,
  the clip offsets of rows 2 and 4, the bad clip ranges, and the still paths. Every program time comes from
  edit.md and stays as it is; cue times come from script.md by word proportion inside each row.
  The table holds two takes: NOV2 (default, video/take-2026-11-02.md) and OCT29 (the Nov 1 build);
  BACKUP_TAKE=oct29 selects the second.

  Needs ffmpeg and ffprobe 8 on PATH. Writes only under T.partsDir, T.checkDir and T.out.
*/
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// ============================================ THE TABLE ============================================
const TEMP = "C:/Users/pau/AppData/Local/Temp/claude";
// Two takes, one table each. NOV2 (the default) is the Nov 2 headless take on the current site. OCT29 holds the
// values of the Nov 1 build (backup-2026-11-01.mp4, from the Oct 29 clip), so that build can be reproduced:
//   BACKUP_TAKE=oct29 node video/backup.mjs     (writes backup-2026-11-01.mp4 and backup-parts again)
// A clip piece reads T.clip unless it names another source with `src` (NOV2's row 4 piece reads T.clip2).
// Every clip offset is a frame time: decode index / 25 (the files are 25 fps constant, first frame 0.00).
const SHOTS2 = TEMP + "/video-shots-2026-11-02";
const NOV2 = {
  take: "nov2",
  // Part 1: the live dc-001 run (case c_6f3143), from the landing to the Trust tick; the take script stopped
  // there on a bug in its own stamp check. Part 2: a free reload of c_6f3143 for shots 4 (the top) to 8.
  clip: SHOTS2 + "/clip-dc001-2026-11-02.webm",        // 78.16 s, 1,954 frames
  clip2: SHOTS2 + "/clip-dc001-2026-11-02-part2.webm", // 50.00 s, 1,250 frames
  // The click on Confirm falls between frames 25.68 (last Confirm view) and 25.72 (the confirmed card). 25.70 makes
  // the Trust-tick frame (77.12) read 51.42, the page's own Confirm-to-tick time; the first finding (40.48 -> 14.78,
  // page 14.80), Steelman (58.00 -> 32.30, page 32.30) and the stamp (62.76 -> 37.06, page 37.09) agree with it.
  timerZero: 25.70,
  stills: {
    letterPage: TEMP + "/video-shots/seg1-letter-page-view.png", // row 1 (current: a local page of dc-001's text)
    landing: SHOTS2 + "/seg2-landing-view.png",                 // row 2 (Nov 2, the proof sheet, 34 days left)
    landingEnd: SHOTS2 + "/seg8-landing-view.png",              // row 8 (Nov 2, end of part 2)
    pastedTop: SHOTS2 + "/seg2-pasted-letter-top-view.png",     // row 2 (after Ctrl+Home; "1,144 of 6,000 characters. Ready.")
    exhibitPair: SHOTS2 + "/seg4-exhibit-pair-view.png",        // row 4 (part 2, scrollY 363, the same scroll as the clip piece)
    seeThePage: SHOTS2 + "/seg4-see-the-page-view.png",         // row 4 (the panel, page 5, the highlight, the vision line)
    letterSheet: SHOTS2 + "/seg5-letter-sheet-view.png",        // row 5 (page 2 of 2 with sidenotes 2 and 3)
    deadline: SHOTS2 + "/seg5-deadline-view.png",               // row 5 (the top: "Appeal by Dec 6, 2026" with the leaf)
    secondOpinion: SHOTS2 + "/seg5-second-opinion-view.png",    // row 5 (the top: "Second opinion: Muse Spark Open agrees.")
    notSettled: SHOTS2 + "/seg6-notsettled-stamp-view.png",     // row 6 (c_d2d12f reload, "Not stated in the letter")
  },
  // Ranges that must never reach the output. The build stops if a piece touches one. [from, to, why, source]
  badClip: [
    [25.72, 26.84, "after the Confirm click: the confirmed card flashes (25.72), 'Loading the case...' (by 25.80, to 26.04), 'Loading case c_6f3143...' (26.08), then the glide to the slip (to 26.80)"],
    [62.76, 63.20, "the stamp lands with a layout jump (62.76), then the scroll to the very top (63.04 to 63.20): mid-scroll frames"],
    [0.00, 0.36, "page load: blank and first-paint frames (luma jumps at 0.28 and 0.32)", "clip2"],
    [16.24, 17.10, "the panel closes at 16.24 and focus goes back to the crop until the click on bond (no outline seen; kept out anyway)", "clip2"],
  ],
  // Row 3: the five run segments. Play from `in`; the timer stops on the frame at `out` and holds there.
  // `extendTo` lets the picture run on under the stopped timer (not needed on Nov 2: the tick is drawn whole at 77.12).
  run: [
    { id: "A", in: 26.88, out: 30.88, to: 45.0 },             // "Planning the questions...", the record sheet open
    { id: "B", in: 40.00, out: 46.00, to: 56.0 },             // the first finding lands at 40.48; "Question 3 of 7", then 4 of 7
    { id: "C", in: 57.60, out: 60.60, to: 62.8 },             // "Question 7 of 7", "Steelman: Weighing the payer's side..." from 58.00
    { id: "D", in: 63.40, out: 66.40, to: 66.4 },             // the stamp at the top, "is deciding..." to "agrees" at 66.00
    { id: "E", in: 75.84, out: 77.12, to: 70.0, final: true }, // "Trust: Checking the letter against itself..." ticks at 77.12
  ],
  // Row 2, program 0:20 to 0:40. A clip piece with hold: true plays to the frame at clip[1] and holds it.
  row2: [
    { still: "landing", to: 25.0 },
    { clip: [6.44, 8.12], to: 26.7 },              // the desk, first frame 6.44 (the click on "Start with your letter")
    { still: "pastedTop", to: 29.0 },
    { clip: [12.68, 16.44], to: 32.8 },            // "Reading your letter": "Reading the letter, done" at 15.44, "Finding the program, done" at 16.44
    { clip: [16.48, 18.00], hold: true, to: 37.1 }, // the case card arrives at 16.48; hold on 18.00 (the card, the Check row at the foot)
    { clip: [22.84, 25.68], to: 40.0 },            // after "Looks right" (21.48): the scroll to Confirm, cut on the click (25.68 is the last frame before it)
  ],
  // Row 4, program 1:10 to 1:40. The clip piece carries the click: the panel opens at 11.24 ("Loading page 5"),
  // the page draws at 11.60, the highlight at 11.84; frames to 14.20 hold the open panel (it closes at 16.24).
  row4: [
    { still: "exhibitPair", to: 84.0 },
    { clip: [11.04, 14.20], src: "clip2", to: 87.2 },
    { still: "seeThePage", to: 100.0 },
  ],
  // The click ring on Exhibit 2's crop ("See page 5 of ..."): its box on part 2 at scrollY 363 is x 661 to 1142,
  // y 299 to 343 (the frame at 11.04 shows it there); the ring sits on its centre, where the click landed.
  row4Ring: [901, 321],
  // Row 5's push-in: the second opinion line on seg5-second-opinion-view.png, x 138 to 444, y 310 to 324.
  row5Push: { x: 291, y: 317 },
  out: TEMP + "/video-edit/take-2026-11-02.mp4",
  partsDir: TEMP + "/video-edit/take-parts",
  checkDir: TEMP + "/video-edit/take-check",
};
const OCT29 = {
  take: "oct29",
  clip: TEMP + "/video-shots/clip-dc001.webm", // the run, 1280x800, 25 fps; every clip offset below is a time in this file
  timerZero: 19.3,                              // clip time of the Confirm click: timer = clip time - timerZero
  stills: {
    letterPage: TEMP + "/video-shots/seg1-letter-page-view.png",   // row 1 (current: a local page of dc-001's text)
    landing: TEMP + "/video-edit/today/landing-view.png",           // rows 2 and 8 (Oct 31, with the proof sheet)
    landingEnd: TEMP + "/video-edit/today/landing-view.png",
    pastedTop: TEMP + "/video-shots/seg2-pasted-letter-top-view.png", // row 2 (Oct 29; no current capture)
    exhibitPair: TEMP + "/video-shots/seg4-exhibit-pair-view.png",  // row 4 (Oct 29; same scroll as the clip piece)
    seeThePage: TEMP + "/video-shots/seg4-see-the-page-view.png",   // row 4 (Oct 29; no current capture)
    letterSheet: TEMP + "/video-shots/seg5-letter-sheet-view.png",  // row 5 (Oct 29; no current capture with sidenotes)
    deadline: TEMP + "/video-edit/today/c7cf7ad-view.png",          // row 5 deadline and second opinion (Oct 31, "caseTop")
    secondOpinion: TEMP + "/video-edit/today/c7cf7ad-view.png",
    notSettled: TEMP + "/video-edit/today/cd2d12f-view.png",        // row 6 (Oct 31)
  },
  // Clip ranges that must never reach the output (edit.md, "Cuts around bad frames"). The build stops if one does.
  badClip: [
    [94.72, 99.39, "the Oct 29 band line in the header from 94.72 (row 4's piece from 99.40 is scrolled past the header)"],
    [96.02, 97.02, "the grey full-page-screenshot frame at 96.52"],
    [102.60, 9999, "the black focus outline on Exhibit 2 from 102.60"],
  ],
  // Row 3: the five run segments. Play from `in`; the timer stops on the frame at `out` and holds there.
  // `extendTo` lets the picture run on under the stopped timer (the editor's choice on segment E).
  run: [
    { id: "A", in: 20.9, out: 24.9, to: 45.0 },
    { id: "B", in: 40.6, out: 46.6, to: 56.0 },
    { id: "C", in: 58.2, out: 61.2, to: 62.8 },
    { id: "D", in: 66.96, out: 70.0, to: 66.4 },
    { id: "E", in: 91.9, out: 93.2, extendTo: 93.4, to: 70.0, final: true },
  ],
  row2: [
    { still: "landing", to: 25.0 },
    { clip: [3.7, 5.4], to: 26.7 },
    { still: "pastedTop", to: 29.0 },
    { clip: [6.72, 10.5], to: 32.8 },
    { clip: [14.96, 16.48], hold: true, to: 37.1 },
    { clip: [16.48, 19.36], to: 40.0 },
  ],
  row4: [
    { still: "exhibitPair", to: 84.0 },
    { clip: [99.40, 102.56], to: 87.2 },
    { still: "seeThePage", to: 100.0 },
  ],
  // the "See page 5" control at 1280, measured on clip frame 99.40: x 660 to 1142, y 299 to 341
  row4Ring: [901, 320],
  // second opinion line on the Oct 31 capture: x 138 to 442, y 311 to 324 (re-measured)
  row5Push: { x: 290, y: 317.5 },
  out: TEMP + "/video-edit/backup-2026-11-01.mp4",
  partsDir: TEMP + "/video-edit/backup-parts",
  checkDir: TEMP + "/video-edit/backup-check",
};
const TAKE = String(process.env.BACKUP_TAKE || "nov2").toLowerCase() === "oct29" ? OCT29 : NOV2;
const T = {
  ...TAKE,
  // Row 7, the numbers card (edit.md "The numbers card"): one line per spoken sentence of script.md row 7.
  // `text` is what shows (\n breaks a long line in two); `cue` is the first words of its spoken sentence.
  // To change the card: edit this list, then `node video/backup.mjs build 7` (rebuilds row 7 only and re-concatenates).
  numbersCard: [
    { text: "Tested on 30 reviewed denial letters, three times", cue: "We tested" },
    { text: "Verdict right on 25 to 28 of 30; 12 or 13 of 13 where the denial\ndid not match the policy", cue: "The verdict was" },
    { text: "All 224 letter claims verified against the page\n(71 of 71, 75 of 75, 78 of 78)", cue: "All two hundred" },
    { text: "Open model (Muse Spark Open) agreed on 79 of 84", cue: "The open model" },
    { text: "About $0.10 a case", cue: "About ten cents" },
    { text: "Test data built before the event \u00b7 every number is in the repo:\ngithub.com/paureis/recourse", cue: "The test data" },
  ],
  script: "C:/Users/pau/recourse/video/script.md",
  length: 180,
};

// The rows, in program seconds (edit.md). Pieces end at `to`; a clip piece plays from `clip[0]`.
// A clip piece with hold: true plays until the frame at clip[1] and holds that frame to `to`.
const ROWS = [
  { n: 1, from: 0, to: 20, pieces: [{ still: "letterPage", to: 20 }],
    layers: [
      { kind: "ellipse", box: [517, 552, 857, 572], cue: "Its reason", fade: 0.3 },
      { kind: "card1", cue: "Most people stop here", fade: 0.4 },
    ] },
  { n: 2, from: 20, to: 40, pieces: T.row2 },
  { n: 3, from: 40, to: 70, run: true },
  { n: 4, from: 70, to: 100, pieces: T.row4,
    // The headless clip has no cursor: a ring on Exhibit 2's crop (the take's row4Ring) from half a second before
    // the panel opens, which the take's row 4 clip piece puts 0.2 s after its first frame (program 84.2).
    layers: [{ kind: "click", at: T.row4Ring, from: 83.7, until: 84.2, fade: 0.08 }] },
  { n: 5, from: 100, to: 125, pieces: [
      { still: "letterSheet", to: 108.5 },
      { still: "deadline", to: 114.0 },
      { still: "secondOpinion", to: 125.0, pushIn: { ...T.row5Push, zoom: 0.06 } },
    ] },
  { n: 6, from: 125, to: 135, pieces: [{ still: "notSettled", to: 135 }] },
  { n: 7, from: 135, to: 165, card: "numbers", lines: T.numbersCard },
  { n: 8, from: 165, to: 180, pieces: [{ still: "landingEnd", to: 180 }],
    layers: [
      { kind: "chip", text: "recourse-murex.vercel.app", cue: "recourse-murex", xy: [690, 586], fade: 0.3 },
      { kind: "chip", text: "github.com/paureis/recourse", cue: "paureis slash recourse", xy: [690, 662], fade: 0.3 },
    ] },
];
// ========================================= END OF THE TABLES =========================================

const FPS = 25;
const W = 1280, H = 800;
const C = { ink: "0x1b1b1b", bond: "0xffffff", faded: "0x4e493d", red: "0xb3261e", manila: "0xe6d3a3" };
const RED_RGB = [179, 38, 30];
const FONT = { sans: "arial.ttf", bold: "arialbd.ttf", mono: "CascadiaMono.ttf" };
const TIMER = { x: 1032, y: 748, w: 236, h: 40 };

const pf = (s) => Math.floor(s * FPS + 0.5 + 1e-9); // program seconds -> frame index (half frames round up)
const cf = (s) => Math.ceil(s * FPS - 1e-6);        // clip seconds -> the first clip frame at or after it
const sec = (f) => +(f / FPS).toFixed(2);
const fontArg = (f) => "'C\\:/Windows/Fonts/" + f + "'";
const log = { rows: [], cues: {}, timer: [] };

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
  return "drawtext=" + parts.join(":");
}

// ---------- cue times from script.md, by word proportion inside the row ----------
function spokenRows() {
  const rows = {};
  for (const line of fs.readFileSync(T.script, "utf8").split(/\r?\n/)) {
    const m = /^\|\s*(\d)\s*\|/.exec(line);
    if (!m) continue;
    const cells = line.split("|").map((c) => c.trim());
    rows[+m[1]] = cells[4];
  }
  return rows;
}
const norm = (w) => w.toLowerCase().split(/\[\^\d+\]/).join("").split(/[^a-z0-9-]/).join("");
function cueTime(row, phrase) {
  const spoken = spokenRows()[row.n];
  if (!spoken) throw new Error("no spoken text for row " + row.n + " in " + T.script);
  const words = spoken.split(/\s+/).filter(Boolean).map(norm);
  const want = phrase.split(/\s+/).map(norm);
  const i = words.findIndex((_, k) => want.every((w, j) => words[k + j] === w));
  if (i < 0) throw new Error("cue '" + phrase + "' not found in row " + row.n);
  const t = row.from + (i / words.length) * (row.to - row.from);
  const snapped = pf(t) / FPS; // on a frame
  log.cues[row.n + ": " + phrase] = { wordIndex: i, words: words.length, at: +snapped.toFixed(2) };
  return snapped;
}

// ---------- images made once per build ----------
function makeImage(name, w, h, bg, opsIn) {
  // drawtext draws a newline as a box glyph, so a text with "\n" becomes one drawtext per line
  const ops = opsIn.flatMap((o) => o.box || !o.text.includes("\n") ? [o]
    : o.text.split("\n").map((line, k) => ({ ...o, text: line, y: o.y + k * (o.size + (o.spacing || 0)), spacing: undefined })));
  const vf = ops.map((o) => o.box
    ? "drawbox=x=" + o.box[0] + ":y=" + o.box[1] + ":w=" + o.box[2] + ":h=" + o.box[3] + ":color=" + o.color + ":t=" + (o.t || "fill")
    : drawtext(o)).join(",");
  ff(["-f", "lavfi", "-i", "color=c=" + bg + ":s=" + w + "x" + h + ":d=0.04", ...(vf ? ["-vf", vf] : []), "-frames:v", "1", "-update", "1", name]);
  return name;
}
function makeEllipse(name, a, b, stroke) {
  const w = Math.ceil(2 * a + 4 * stroke), h = Math.ceil(2 * b + 4 * stroke), cx = w / 2, cy = h / 2;
  const dx = "(X-" + cx + ")", dy = "(Y-" + cy + ")";
  const F = "(" + dx + "*" + dx + "/" + a * a + "+" + dy + "*" + dy + "/" + b * b + "-1)";
  const G = "(2*sqrt(" + dx + "*" + dx + "/" + a ** 4 + "+" + dy + "*" + dy + "/" + b ** 4 + ")+0.000001)";
  const alpha = "255*clip(" + (stroke / 2 + 0.5) + "-abs(" + F + ")/" + G + ",0,1)";
  const vf = "format=rgba,geq=r=" + RED_RGB[0] + ":g=" + RED_RGB[1] + ":b=" + RED_RGB[2] + ":a='" + alpha + "'";
  ff(["-f", "lavfi", "-i", "color=c=black@0.0:s=" + w + "x" + h + ":d=0.04", "-vf", vf, "-frames:v", "1", "-update", "1", name]);
  return { name, w, h };
}

// ---------- one row ----------
function buildRow(row) {
  curRow = row.n; fileSeq = 0;
  const args = [], chains = [], used = [];
  let nIn = 0;
  const input = (a) => { args.push(...a); return nIn++; };
  const rowF = pf(row.to) - pf(row.from);
  const rowDur = (row.to - row.from).toFixed(2);
  const norm = "setsar=1,settb=AVTB,setpts=N/" + FPS + "/TB";
  const pieces = [];
  const rlog = { row: row.n, program: [row.from, row.to], frames: rowF, pieces: [] };

  if (row.run) {
    let prev = row.from;
    for (const s of T.run) pieces.push({ ...s, clip: [s.in, s.out], hold: true, from: prev, seg: s }), (prev = s.to);
  } else if (row.pieces) {
    let prev = row.from;
    for (const p of row.pieces) pieces.push({ ...p, from: prev }), (prev = p.to);
  }

  pieces.forEach((p, k) => {
    const n = pf(p.to) - pf(p.from);
    const tag = "[p" + k + "]";
    if (p.still) {
      const file = T.stills[p.still];
      if (p.pushIn) {
        const i = input(["-i", file]);
        const u = "(on/" + (n - 1) + ")";
        const z = "1+" + p.pushIn.zoom + "*(3*" + u + "*" + u + "-2*" + u + "*" + u + "*" + u + ")";
        const X = 4 * p.pushIn.x, Y = 4 * p.pushIn.y;
        chains.push("[" + i + ":v]format=rgb24,scale=" + 4 * W + ":" + 4 * H + ":flags=lanczos,zoompan=z='" + z + "':x='" + X + "-" + X + "/zoom':y='" + Y + "-" + Y + "/zoom':d=" + n + ":s=" + W + "x" + H + ":fps=" + FPS + ",format=rgb24,trim=end_frame=" + n + "," + norm + tag);
      } else {
        const i = input(["-loop", "1", "-framerate", String(FPS), "-t", (n / FPS + 0.2).toFixed(2), "-i", file]);
        chains.push("[" + i + ":v]format=rgb24,trim=end_frame=" + n + "," + norm + tag);
      }
      rlog.pieces.push({ program: [sec(pf(p.from)), sec(pf(p.to))], frames: n, source: path.basename(file), pushIn: p.pushIn || undefined });
      return;
    }
    // a clip piece (from T.clip, or from the table entry its `src` names)
    const src = p.src || "clip";
    if (!T[src]) throw new Error("row " + row.n + " piece " + k + ": no clip source " + src + " in the table");
    const a = cf(p.clip[0]);
    const lastWanted = p.extendTo ? cf(p.extendTo) : cf(p.clip[1]);
    let first = a, last, chain;
    const i = input(["-t", (lastWanted / FPS + 1).toFixed(2), "-i", T[src]]);
    if (p.hold) {
      last = lastWanted;
      const played = last - a + 1;
      if (played > n) throw new Error("row " + row.n + " piece " + k + ": " + played + " clip frames do not fit in " + n);
      chain = "[" + i + ":v]trim=start_frame=" + a + ":end_frame=" + (last + 1) + ",format=rgb24,setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop=" + (n - played) + ",trim=end_frame=" + n + "," + norm;
    } else {
      last = a + n - 1;
      if (Math.abs(last - cf(p.clip[1])) > 1) throw new Error("row " + row.n + " piece " + k + ": ends on clip frame " + sec(last) + ", not near " + p.clip[1]);
      chain = "[" + i + ":v]trim=start_frame=" + a + ":end_frame=" + (last + 1) + ",format=rgb24," + norm;
    }
    for (const [b0, b1, why, bsrc] of T.badClip) {
      if ((bsrc || "clip") !== src) continue;
      if (sec(first) <= b1 && sec(last) >= b0) throw new Error("row " + row.n + " piece " + k + " uses " + src + " " + sec(first) + " to " + sec(last) + ", inside a bad range: " + why);
    }
    used.push(src === "clip" ? [sec(first), sec(last)] : [src, sec(first), sec(last)]);
    const plog = { program: [sec(pf(p.from)), sec(pf(p.to))], frames: n, source: src, clipFirst: sec(first), clipLast: sec(last),
      playFrames: last - first + 1, holdFrames: n - (last - first + 1) };
    if (p.seg) {
      // the elapsed timer: clip time of the frame shown, minus the zero; stops on the frame at `out`
      const stop = cf(p.seg.out);
      const A = (a / FPS - T.timerZero).toFixed(2), P = ((stop - a) / FPS).toFixed(2);
      const R = "round((" + A + "+min(t," + P + "))*10)";
      const tx = TIMER.x, ty = TIMER.y;
      chain += ",drawbox=x=" + tx + ":y=" + ty + ":w=" + TIMER.w + ":h=" + TIMER.h + ":color=" + C.ink + ":t=fill";
      if (p.seg.final) {
        chain += "," + drawtext({ font: FONT.mono, text: "elapsed", size: 20, color: C.bond, x: tx + 14, y: ty + 10, enable: "lt(t," + P + ")" });
        chain += "," + drawtext({ font: FONT.mono, text: "reviewed", size: 20, color: C.bond, x: tx + 14, y: ty + 10, enable: "gte(t," + P + ")" });
      } else {
        chain += "," + drawtext({ font: FONT.mono, text: "elapsed", size: 20, color: C.bond, x: tx + 14, y: ty + 10 });
      }
      chain += "," + drawtext({ font: FONT.mono, text: "%{eif:floor(" + R + "/10):d}.%{eif:mod(" + R + ",10):d} s", expand: true,
        size: 20, color: C.bond, x: "'" + (tx + TIMER.w - 14) + "-tw'", y: ty + 10 });
      const tIn = Math.round((a / FPS - T.timerZero) * 10) / 10, tOut = Math.round((stop / FPS - T.timerZero) * 10) / 10;
      Object.assign(plog, { seg: p.seg.id, timerIn: tIn, timerOut: tOut, timerStopsAtClip: sec(stop), timerStopsAtProgram: sec(pf(p.from) + stop - a) });
      log.timer.push({ seg: p.seg.id, clipIn: sec(a), clipOut: sec(stop), extendTo: p.extendTo ? sec(last) : undefined, timerIn: tIn, timerOut: tOut,
        playS: +((stop - a) / FPS).toFixed(2), holdS: +((n - (stop - a)) / FPS).toFixed(2), program: [sec(pf(p.from)), sec(pf(p.to))],
        holdProgram: [sec(pf(p.from) + stop - a), sec(pf(p.to))] });
    }
    chains.push(chain + tag);
    rlog.pieces.push(plog);
  });

  let cur;
  if (row.card === "numbers") {
    const base = makeImage("numbers-base.png", W, H, C.manila, [
      { box: [96, 72, 1088, 656], color: C.bond },
      { box: [96, 72, 1088, 656], color: C.ink, t: 1 },
    ]);
    const i = input(["-loop", "1", "-framerate", String(FPS), "-t", (rowF / FPS + 0.2).toFixed(2), "-i", base]);
    chains.push("[" + i + ":v]format=rgb24,trim=end_frame=" + rowF + "," + norm + "[base]");
    rlog.pieces.push({ program: [row.from, row.to], frames: rowF, source: "numbers card (made in the edit)" });
    cur = "[base]";
    const lh = 46, gap = 30;
    const total = row.lines.reduce((s, l) => s + l.text.split("\n").length * lh, 0) + gap * (row.lines.length - 1);
    let y = 72 + Math.round((656 - total) / 2);
    row.lines.forEach((l, k) => {
      const nl = l.text.split("\n").length;
      const img = makeImage("numbers-line-" + (k + 1) + ".png", 980, nl * lh, C.bond,
        [{ font: FONT.sans, text: l.text, size: 33, color: C.ink, x: 0, y: 6, spacing: 13 }]);
      const at = cueTime(row, l.cue) - row.from;
      cur = overlay(cur, img, 152, y, at, rowDur, 0.3, "n" + k);
      rlog.layers = rlog.layers || [];
      rlog.layers.push({ what: "numbers line " + (k + 1), at: +(row.from + at).toFixed(2), y });
      y += nl * lh + gap;
    });
  } else {
    chains.push(pieces.map((_, k) => "[p" + k + "]").join("") + "concat=n=" + pieces.length + ":v=1:a=0[base]");
    cur = "[base]";
  }

  function overlay(under, png, x, y, at, until, fade, id, raw) {
    const i = input(["-loop", "1", "-framerate", String(FPS), "-t", (rowF / FPS + 0.2).toFixed(2), "-i", png]);
    chains.push("[" + i + ":v]format=rgba,fade=t=in:st=" + at.toFixed(2) + ":d=" + fade + ":alpha=1[l" + id + "]");
    const out = "[o" + id + "]";
    chains.push(under + "[l" + id + "]overlay=x=" + x + ":y=" + y + ":format=rgb:eof_action=pass:enable='between(t," + at.toFixed(2) + "," + until + ")'" + out);
    return out;
  }

  for (const [k, L] of (row.layers || []).entries()) {
    rlog.layers = rlog.layers || [];
    if (L.kind === "ellipse") {
      const [x0, y0, x1, y1] = L.box;
      const e = makeEllipse("ellipse-row" + row.n + ".png", (x1 - x0) / 2 + 16, (y1 - y0) / 2 + 12, 3.5);
      const at = cueTime(row, L.cue) - row.from;
      cur = overlay(cur, e.name, Math.round((x0 + x1) / 2 - e.w / 2), Math.round((y0 + y1) / 2 - e.h / 2), at, rowDur, L.fade, "e" + k);
      rlog.layers.push({ what: "red ellipse around x " + x0 + " to " + x1 + ", y " + y0 + " to " + y1, at: +(row.from + at).toFixed(2) });
    } else if (L.kind === "card1") {
      const img = makeImage("card-row1.png", 680, 184, C.bond, [
        { box: [0, 0, 680, 184], color: C.ink, t: 2 },
        { font: FONT.bold, text: "Denials are rarely appealed.", size: 36, color: C.ink, x: 34, y: 32 },
        { font: FONT.bold, text: "43 to 67% of appeals succeed.", size: 36, color: C.ink, x: 34, y: 78 },
        { font: FONT.sans, text: "(KFF, 2025 data)", size: 22, color: C.faded, x: 34, y: 132 },
      ]);
      const at = cueTime(row, L.cue) - row.from;
      cur = overlay(cur, img, 300, 612, at, rowDur, L.fade, "c" + k);
      rlog.layers.push({ what: "KFF card at x 300, y 612, 680 by 184", at: +(row.from + at).toFixed(2) });
    } else if (L.kind === "click") {
      const e = makeEllipse("click-ring.png", 24, 24, 4);
      const at = L.from - row.from, until = (L.until - row.from - 0.5 / FPS).toFixed(3);
      cur = overlay(cur, e.name, L.at[0] - e.w / 2, L.at[1] - e.h / 2, at, until, L.fade, "k" + k);
      rlog.layers.push({ what: "click ring at " + L.at.join(","), at: L.from, until: L.until });
    } else if (L.kind === "chip") {
      const img = makeImage("chip-" + k + ".png", 480, 58, C.ink, [
        { font: FONT.bold, text: L.text, size: 28, color: C.bond, x: "(w-tw)/2", y: 15 },
      ]);
      const at = cueTime(row, L.cue) - row.from;
      cur = overlay(cur, img, L.xy[0], L.xy[1], at, rowDur, L.fade, "u" + k);
      rlog.layers.push({ what: "URL chip " + L.text, at: +(row.from + at).toFixed(2) });
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
  console.log("row " + row.n + ": " + rowF + " frames, ok");
  return rlog;
}

function probeFrames(file) {
  const r = ff(["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", file], { bin: "ffprobe" });
  return parseInt(r.stdout.trim(), 10);
}

function concatRows() {
  const list = ROWS.map((r) => "file 'row-" + r.n + ".mp4'").join("\n") + "\n";
  fs.writeFileSync(path.join(T.partsDir, "rows.txt"), list, "utf8");
  ff(["-f", "concat", "-safe", "0", "-i", "rows.txt", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-t", String(T.length),
    "-movflags", "+faststart", T.out]);
}

// ---------- checks on the finished file ----------
function check() {
  fs.mkdirSync(T.checkDir, { recursive: true });
  const r = ff(["-v", "error", "-count_frames", "-show_entries",
    "format=duration,size:stream=codec_type,codec_name,width,height,pix_fmt,r_frame_rate,nb_read_frames,duration,channels,sample_rate",
    "-of", "json", T.out], { bin: "ffprobe" });
  const probe = JSON.parse(r.stdout);
  const faststart = (() => {
    const fd = fs.openSync(T.out, "r"); const b = Buffer.alloc(64); fs.readSync(fd, b, 0, 64, 0); fs.closeSync(fd);
    const s = b.toString("latin1"); return s.indexOf("moov") >= 0 && s.indexOf("moov") < s.indexOf("mdat") || s.indexOf("mdat") < 0 && s.indexOf("moov") > 0;
  })();

  // frames to look at: name -> program time
  const shots = [];
  const add = (t, what) => shots.push([+t.toFixed(2), what]);
  const lastF = (t) => t - 1 / FPS;
  for (const r of ROWS) { add(r.from, "row" + r.n + "-start"); }
  add(lastF(T.length), "row8-last-frame");
  for (const s of log.timer) {
    add(s.program[0], "seg" + s.seg + "-in-timer-" + s.timerIn);
    add(s.holdProgram[0], "seg" + s.seg + "-out-timer-" + s.timerOut);
    add(lastF(s.holdProgram[1]), "seg" + s.seg + "-hold-end-timer-" + s.timerOut);
  }
  for (const [k, v] of Object.entries(log.cues)) {
    const name = k.split(": ")[0] === "7" ? "numbers-line-" + k.split(": ")[1].split(" ").join("-")
      : k.split(": ")[0] === "8" ? "url-" + k.split(": ")[1].split(" ").join("-") : "row" + k.split(": ")[0] + "-cue-" + k.split(": ")[1].split(" ").join("-");
    add(v.at + 0.6, name);
  }
  add(83.8, "row4-click-ring");
  add(84.16, "row4-click-ring-last-frame-clip-99.56");
  add(84.2, "row4-panel-opening-clip-99.60");
  add(87.16, "row4-clip-last-frame-102.56");
  add(87.2, "row4-see-the-page");
  add(25.0, "row2-desk-clip-3.72"); add(26.72, "row2-pasted-letter-still"); add(29.0, "row2-reading-clip-6.72");
  add(32.8, "row2-case-card-clip-14.96"); add(37.12, "row2-scroll-clip-16.48"); add(lastF(40), "row2-last-clip-19.32");
  add(108.52, "row5-deadline-beat"); add(114.0, "row5-second-opinion-zoom-start"); add(lastF(125), "row5-zoom-end");
  for (const s of log.timer) if (s.extendTo) add(s.holdProgram[0] + (cf(s.extendTo) - cf(s.clipOut)) / FPS, "seg" + s.seg + "-extended-to-" + s.extendTo + "-timer-stopped");
  shots.sort((a, b) => a[0] - b[0]);
  const names = [];
  for (const [t, what] of shots) {
    const name = "t" + t.toFixed(2).padStart(6, "0") + "-" + what + ".png";
    ff(["-ss", t.toFixed(3), "-i", T.out, "-frames:v", "1", "-update", "1", path.join(T.checkDir, name)]);
    names.push(name);
  }

  // timer chip: count the pixels that change between consecutive frames inside the chip, across row 3
  const r3 = ff(["-v", "error", "-ss", "40", "-i", T.out, "-t", "30", "-vf", "crop=" + TIMER.w + ":" + TIMER.h + ":" + TIMER.x + ":" + TIMER.y + ",format=gray",
    "-f", "rawvideo", "-"], { bin: "ffmpeg", binary: true });
  const buf = r3.stdout, sz = TIMER.w * TIMER.h, nf = Math.floor(buf.length / sz);
  const changes = [];
  for (let f = 1; f < nf; f++) {
    let c = 0;
    for (let p = 0; p < sz; p++) if (Math.abs(buf[f * sz + p] - buf[(f - 1) * sz + p]) > 64) c++;
    if (c > 8) changes.push(+(40 + f / FPS).toFixed(2));
  }
  const holdViolations = [];
  for (const s of log.timer) {
    const [h0, h1] = s.holdProgram;
    for (const t of changes) if (t > h0 + 1e-6 && t < h1 - 1e-6) holdViolations.push({ seg: s.seg, t });
  }
  const report = { file: T.out, probe, faststart, frames: names, timerChangeFrames: changes.length, holdViolations,
    timerChangesBySegment: log.timer.map((s) => ({ seg: s.seg, play: [s.program[0], s.holdProgram[0]], hold: s.holdProgram,
      changesInPlay: changes.filter((t) => t > s.program[0] && t <= s.holdProgram[0] + 1e-6).length,
      changesInHold: changes.filter((t) => t > s.holdProgram[0] + 1e-6 && t < s.holdProgram[1] - 1e-6).length })) };
  fs.writeFileSync(path.join(T.checkDir, "check.json"), JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify({ probe: report.probe, faststart, frames: names.length, holdViolations, timerChangesBySegment: report.timerChangesBySegment }, null, 2));
  if (holdViolations.length) throw new Error("the timer moved during a hold");
}

// ---------- main ----------
fs.mkdirSync(T.partsDir, { recursive: true });
const [mode = "all", only] = process.argv.slice(2);
const total = ROWS.reduce((s, r) => s + pf(r.to) - pf(r.from), 0);
if (total !== pf(T.length)) throw new Error("rows add up to " + total + " frames, not " + pf(T.length));
for (let k = 1; k < ROWS.length; k++) if (ROWS[k].from !== ROWS[k - 1].to) throw new Error("gap before row " + ROWS[k].n);
if (T.run[T.run.length - 1].to !== ROWS.find((r) => r.run).to) throw new Error("segment E must end with row 3");

const logFile = path.join(T.partsDir, "build-log.json");
const prior = fs.existsSync(logFile) ? JSON.parse(fs.readFileSync(logFile, "utf8")) : { rows: [] };
if (mode === "all" || mode === "build") {
  for (const row of ROWS) {
    if (only && String(row.n) !== String(only)) {
      // still compute cues and the timer table for the log
      continue;
    }
    const rl = buildRow(row);
    log.rows.push(rl);
  }
  if (only) {
    // keep the other rows' entries from the last full build
    for (const r of prior.rows) if (!log.rows.find((x) => x.row === r.row)) log.rows.push(r);
    for (const [k, v] of Object.entries(prior.cues || {})) if (!(k in log.cues)) log.cues[k] = v;
    if (!log.timer.length) log.timer = prior.timer || [];
    log.rows.sort((a, b) => a.row - b.row);
  }
  fs.writeFileSync(logFile, JSON.stringify(log, null, 2), "utf8");
  const missing = ROWS.filter((r) => !fs.existsSync(path.join(T.partsDir, "row-" + r.n + ".mp4"))).map((r) => r.n);
  if (missing.length) {
    console.log("rows not built yet: " + missing.join(", ") + "; run without a row number first");
    process.exit(1);
  }
  concatRows();
  console.log("wrote " + T.out);
}
if (mode === "check" && !log.timer.length) Object.assign(log, prior);
if (mode === "all" || mode === "build" || mode === "check") check();
