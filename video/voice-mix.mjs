// Places the eight ElevenLabs voice rows on the picture and writes the mixed MP4 (round 2, Nov 3).
//
//   node video/voice-mix.mjs          plan, mix and mux
//   node video/voice-mix.mjs plan     print the placement and the silences only
//
// The placement comes from video/timeline.mjs, the same timeline the picture (backup.mjs) is cut to: each row clip
// plays as recorded, and where the timeline adds a pause the clip is cut at the quietest point between the two
// words. A phrase that would overlap the next one, or run past its row, stops the build.
// Music: if voice/music.mp3 exists it is trimmed (or looped) to the video, faded in 1 s and out 2 s, and held about
// 20 dB under the voice while the voice speaks (about 14 dB under in the gaps), on an envelope from the word times.
// The mix is loudness-normalized in two passes to -16 LUFS integrated, true peak -1.5 dBTP (loudnorm aims at -1.9 so the AAC encode stays under -1.5), AAC 48 kHz stereo.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { TL, VOICE_DIR, gaps, MAX_PAUSE, MAX_ROW_GAP } from "./timeline.mjs";

const EDIT = "C:/Users/pau/AppData/Local/Temp/claude/video-edit";
const PICTURE = path.join(EDIT, "take-2026-11-03b.mp4");
const OUT = path.join(EDIT, "recourse-demo-2026-11-03b.mp4");
const MUSIC = path.join(VOICE_DIR, "music.mp3");
const RATE = 48000;
const LENGTH = Math.round(TL.length * 25) / 25;
const FADE = 0.008;       // a fade at every cut, so no cut clicks
const UNDER_SPEECH = 20;  // dB the music sits under the voice while it speaks
const UNDER_GAP = 14;     // dB under in the gaps
const r2 = (x) => Math.round(x * 100) / 100;

function ff(args, opts = {}) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-v", opts.v || "error", "-y", ...args],
    { encoding: opts.binary ? "buffer" : "utf8", maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error("ffmpeg failed: " + String(r.stderr).slice(0, 800));
  return r;
}
function decode(file, ch = 1) {
  const r = ff(["-i", file, "-ac", String(ch), "-ar", String(RATE), "-f", "f32le", "-"], { binary: true });
  const b = r.stdout;
  return new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4).slice();
}
// The quietest 10 ms window between a and b (seconds), as a cut point.
function quietest(pcm, a, b) {
  const win = Math.round(RATE * 0.01);
  let best = a, bestE = Infinity;
  for (let t = Math.max(0, a); t + 0.01 <= b; t += 0.005) {
    const i0 = Math.round(t * RATE);
    let e = 0;
    for (let i = i0; i < i0 + win && i < pcm.length; i++) e += pcm[i] * pcm[i];
    if (e < bestE) { bestE = e; best = t + 0.005; }
  }
  return best;
}

function plan() {
  const placed = [], problems = [];
  for (const row of TL.rows) {
    const pcm = decode(path.join(VOICE_DIR, "row" + row.n + ".mp3"));
    const dur = pcm.length / RATE;
    const w = row.words; // clip times: start/end; program times: at/endAt
    row.phrases.forEach((p, k) => {
      const from = k === 0 ? Math.max(0, w[p.first].start - 0.06) : quietest(pcm, w[p.first - 1].end - 0.03, w[p.first].start + 0.03);
      const to = k + 1 < row.phrases.length ? quietest(pcm, w[p.last].end - 0.03, w[p.last + 1].start + 0.03) : Math.min(dur, w[p.last].end + 0.3);
      const startProg = from + p.offset, endProg = to + p.offset;
      if (k && startProg < placed.at(-1).endProg - 1e-6) problems.push(`row ${row.n}: '${p.text.slice(0, 30)}' overlaps the phrase before`);
      if (w[p.last].endAt > row.to - 0.05) problems.push(`row ${row.n}: '${p.text.slice(0, 30)}' speaks past the row's end`);
      placed.push({ row: row.n, text: p.text, from, to, offset: p.offset, at: r2(w[p.first].at), speechEnd: r2(w[p.last].endAt), startProg, endProg, pcm });
    });
  }
  if (problems.length) throw new Error("the placement does not fit:\n" + problems.join("\n"));
  return placed;
}

function writeWav(file, samples, ch = 1) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767))), i * 2);
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVE", 8); h.write("fmt ", 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(ch, 22); h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2 * ch, 28); h.writeUInt16LE(2 * ch, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(data.length, 40);
  fs.writeFileSync(file, Buffer.concat([h, data]));
}
// integrated loudness (LUFS) of a file, by ffmpeg's ebur128
function lufs(file) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", "ebur128", "-f", "null", "-"], { encoding: "utf8" });
  const m = /Integrated loudness:\s*I:\s*(-?[\d.]+) LUFS/.exec(r.stderr);
  if (!m) throw new Error("no loudness for " + file);
  return +m[1];
}

function mix(placed) {
  const N = Math.round(LENGTH * RATE);
  const voice = new Float32Array(N);
  const f = Math.round(FADE * RATE);
  for (const p of placed) {
    const i0 = Math.round(p.from * RATE), i1 = Math.round(p.to * RATE);
    const o = Math.round((p.from + p.offset) * RATE);
    for (let i = i0; i < i1; i++) {
      const g = Math.min(1, (i - i0) / f, (i1 - 1 - i) / f);
      const j = o + (i - i0);
      if (j >= 0 && j < N) voice[j] += p.pcm[i] * Math.max(0, g);
    }
  }
  const voiceWav = path.join(VOICE_DIR, "voice-track-3b.wav");
  writeWav(voiceWav, voice);
  let mixWav = voiceWav, music = null;
  if (fs.existsSync(MUSIC)) {
    const vL = lufs(voiceWav), mL = lufs(MUSIC);
    // the voice's loudness while it speaks: the track's integrated loudness is gated, so it is close to the speech level
    const gSpeech = Math.pow(10, (vL - UNDER_SPEECH - mL) / 20), gGap = Math.pow(10, (vL - UNDER_GAP - mL) / 20);
    let m = decode(MUSIC, 2);
    const mN = m.length / 2;
    // loop with a 1 s crossfade if the music is shorter than the video
    if (mN < N) {
      const xf = RATE, out = new Float32Array(N * 2);
      let pos = 0;
      while (pos < N) {
        for (let i = 0; i < mN && pos + i < N; i++) {
          const g = pos > 0 && i < xf ? i / xf : 1;
          for (let c = 0; c < 2; c++) out[(pos + i) * 2 + c] = out[(pos + i) * 2 + c] * (pos > 0 && i < xf ? 1 - g : 1) + m[i * 2 + c] * g;
        }
        pos += mN - xf;
      }
      m = out;
    }
    // speech mask from the word times (0.25 s either side), smoothed with 0.3 s ramps
    const mask = new Float32Array(N);
    for (const r of TL.rows) for (const w of r.words) {
      const a = Math.max(0, Math.round((w.at - 0.25) * RATE)), b = Math.min(N, Math.round((w.endAt + 0.25) * RATE));
      for (let i = a; i < b; i++) mask[i] = 1;
    }
    const ramp = Math.round(0.3 * RATE);
    const env = new Float32Array(N);
    let cur = 0;
    for (let i = 0; i < N; i++) { cur += (mask[i] - cur) / ramp * 3; env[i] = cur; }      // attack/release about 0.1 s
    const fin = RATE, fout = 2 * RATE;
    const out = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) {
      const g = (gGap + (gSpeech - gGap) * Math.min(1, Math.max(0, env[i]))) * Math.min(1, i / fin, (N - 1 - i) / fout);
      for (let c = 0; c < 2; c++) out[i * 2 + c] = voice[i] + m[i * 2 + c] * g;
    }
    mixWav = path.join(VOICE_DIR, "mix-3b.wav");
    writeWav(mixWav, out, 2);
    music = { voiceLUFS: vL, musicLUFS: mL, speechGainDb: r2(vL - UNDER_SPEECH - mL), gapGainDb: r2(vL - UNDER_GAP - mL), musicSeconds: r2(mN / RATE), looped: mN < N };
  }
  // two-pass loudness normalization
  const p1 = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", mixWav, "-af", "loudnorm=I=-16:TP=-1.9:LRA=11:print_format=json", "-f", "null", "-"], { encoding: "utf8" });
  const j = JSON.parse(p1.stderr.slice(p1.stderr.lastIndexOf("{"), p1.stderr.lastIndexOf("}") + 1));
  const ln = "loudnorm=I=-16:TP=-1.9:LRA=11:measured_I=" + j.input_i + ":measured_TP=" + j.input_tp + ":measured_LRA=" + j.input_lra +
    ":measured_thresh=" + j.input_thresh + ":offset=" + j.target_offset + ":linear=true";
  ff(["-i", PICTURE, "-i", mixWav, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
    "-af", ln + ",aresample=" + RATE, "-c:a", "aac", "-b:a", "192k", "-ar", String(RATE), "-ac", "2",
    "-t", LENGTH.toFixed(2), "-movflags", "+faststart", OUT]);
  return { voiceWav, mixWav, music, firstPass: { I: j.input_i, TP: j.input_tp } };
}

const mode = process.argv[2] || "all";
const placed = plan();
console.log("phrase placement (program seconds):");
for (const p of placed) console.log("  row " + p.row + "  " + p.at.toFixed(2) + " to " + p.speechEnd.toFixed(2) + "  " + p.text.slice(0, 70));
const g = gaps();
const inRow = g.filter((x) => x.kind === "inside row"), between = g.filter((x) => x.kind === "between rows");
console.log("largest silence inside a row: " + Math.max(...inRow.map((x) => x.silence)).toFixed(2) + " s (limit " + MAX_PAUSE + ")");
console.log("largest silence between rows: " + Math.max(...between.map((x) => x.silence)).toFixed(2) + " s (limit " + MAX_ROW_GAP + ")");
if (Math.max(...inRow.map((x) => x.silence)) > MAX_PAUSE || Math.max(...between.map((x) => x.silence)) > MAX_ROW_GAP) throw new Error("a silence is over its limit");
console.log("length " + LENGTH.toFixed(2) + " s; picture " + PICTURE);
if (mode === "all") {
  const res = mix(placed);
  console.log(JSON.stringify(res, null, 1));
  console.log("wrote " + OUT);
}
