# Evaluation of section 20 (bug bash, round two: the UI final look), Oct 31 to Nov 1, 2026

A fresh Opus evaluator that had not seen the build graded the uncommitted web change (plus DESIGN.md) against
section 20 of `case-page-brief.md` (N1 to N10 with the two decision blocks), on its own baseline: a worktree of
`546ee08` built with `next start` on port 3021 against the repo's web on 3022, headless Chromium, device scale 1,
`animations: "disabled"`, one page at a time; no live model call; the builder's folder not read. Its scripts and
captures are under `C:\Users\pau\AppData\Local\Temp\claude\bash2-web-eval\`. The orchestrator wrote this record from
the evaluator's reply.

## Grades

| Item | Grade |
|---|---|
| N1 salutation and closing | PASS |
| N2 paragraph break | PASS, on the measured outcome Alvaro accepted |
| N3 strip ends on a word | PASS |
| N4 today's count | PASS on code and on an intercepted live-shaped record; the live cases UNVERIFIED until the deploy |
| N5 band's words | PASS |
| N6 landing sentence | PASS |
| N7 preload | PASS for the header; the live console UNVERIFIED (the warning never reproduces locally) |
| N8 phone letter complete | PASS |
| N9 card link on its own row | PASS |
| N10 verification | PASS |
| Accessibility | PASS |

## Evidence

N1. At 1280, 1024, 768 and 390 the salutation "Dear Appeals Department," is one element with 20 px under it; the
first paragraph starts "I am writing to appeal"; "Sincerely," is one line, then the gold "Fill in Your name" field
with no trailing period. The DOM and aria order: date, salutation, paragraphs, closing, name, fields at 1280 and 390.
No footnote or chip inside the salutation or the closing; footnotes 1 and 2 and the chips stay on their sentences.
The clipboard after "Copy the letter" holds the salutation, the paragraphs, "Sincerely," and "[Your name]" on their
own lines; the download is identical apart from the clipboard's CRLF. The print PDF is 2 Letter pages on both builds,
with the three lines on their own on the change. A unit check of `letterParts` (25 of 25 on the change, 0 of 24 on
the base) covers a struck first or last sentence not split, a claim sentence keeping its closing, a struck sentence
in the middle whole, the initial and "Jr." keeping their period, every closing form, and no change without a
salutation or closing. The fixture letters have no salutation or closing, so only `c_sample` changes.

N2. `c_sample` at 1280: three pages, folios 1 of 3 to 3 of 3; p1 is 6 lines then 3, p3 is 3 then 2; the closing block
on page 3 with p3's last two lines; free space under the last line 20.6 px on page 1 (line height 28.8), 276.9 on page
2, 356.3 on page 3; 0 of 39 text lines outside a page body. 1440 identical to 1280. 1024: three pages, the paragraphs
moved whole (page 1 has 63.3 px left, one line once the 20 px paragraph gap is taken, so the two-line rule refuses the
split). The base's page 1 at 1280 had 262.2 px free. `c_rejected`, `c_checkerror` and `c_error` at 1024: 3 pages on
the base, 2 on the change; p1 breaks 4 of 6 (`c_error` 4 of 4); the closing block on page 2; 0 lines outside a page
body. `c_rejected` at 1280 identical to the base. Idempotence: 0 style or child writes in 4 s idle at 1280 and 1024;
the quote and page overlays open and close with the spacer and float heights identical before and after; the 1280 to
1024 to 1280 round trip returns the same layout. Each sidenote sits at its paragraph's top (0.4 px off) or under the
note above it. Print 2 pages on both builds.

N3. On the 7 verdict fixtures at 4 widths (28 strips) the strip ends on a whole word plus the ellipsis (the struck
strip on `c_dual` ends on "nursing,..."); the strip box has the same size and x as the base in 28 of 28 (y +52 at
1280 from N9's row); heights 30 px at 1280 and 1024, 50 at 768 and 390; the strip's aria snapshot identical in 28 of
28.

N4. `days_left` and `daysLeft` remain only in the type, the fixture, the replay and a comment; no display path reads
them. `c_sample`'s counts read 35 on Nov 1, equal to `daysUntil("2026-12-06")`. A live-shaped record (the recorded
sample with a stored 39) served through route interception: the base shows 39 in the Lead, the letter's margin line
and the filing sheet; the change shows 35 in all three at 1280 and 390. The copied and downloaded text has no deadline
line on either build.

N5. The self-check reads "The revision was not accepted: ...; the draft stands as written." and "The draft stands as
written."; the receipt reads "...; the draft stands as written, letter sentences verified 4 of 4" on `c_sample`,
`c_rejected` and `c_checkerror`. No "first draft stands" in `web/src` or any test; only in history records.

N6. The landing HTML reads "Add the denial letter as a photo, a PDF or its text."; the base has the old sentence; no
repo document quotes the old one as current.

N7. The base landing's `Link` header carries `</sample/fl-04-p5.png>; rel=preload; as="image"`; the change's carries
only the font. The deployed site sends the image preload on `/` and on its RSC prefetch response, which supports the
cause the builder gave. Through client navigation from the landing to `c_sample`, `/case/new` and `c_consistent`, the
image header appears on the base (on `/`) and on no response on the change. The console is empty on both builds in all
101 captures and the navigation runs, so the warning has no local control; the live console after the deploy is the
check.

N8. The date line "November 1, 2026" at the top of the frame at 17 px at 390 and 768; the fields inside the frame's
padding (20 and 16 px at 390, 28 at 768), 129 px wide at 390 and 234 at 768; Signature alone on its row on
`c_sample`; `c_rejected`, `c_checkerror` and `c_error` show Signature, Name, Member ID and Date in two rows; the
labels 14 px muted at 8.96:1 on white; the fields are not controls (Signature 48 px, the others 36, as on the desktop).

N9. At 1280 the link is at y 379.2, 8 px under the last value (bottom 371.2), its right edge at 1143, the block's
edge; at 1440 the same with the right edge at 1223; the open full card starts at 423.2, the link's bottom; the exhibit
pair's top 371.2 on the base and 423.2 on the change at both widths (DESIGN.md's "y 423" right). A dc-010-shaped
record (an empty Amount, intercepted): on the base the link overlaps "Not stated in the letter"; on the change the
value and the link are on separate rows and the value whole. At 1024 `c_fail` is byte-identical and `c_consistent`
differs only in its strip.

N10. `tsc --noEmit`, lint and build exit 0. The control: the evaluator's own expected list, written before comparing,
gave a union of 35 (it omitted `c_checkerror` from N5, whose receipt carries the phrase, without changing the union);
50 captures, all 35 inside the union differ and all 15 outside it are byte-identical, so the set can fail both ways;
the same 35 and 15 as the builder's. Attribution of the single-item captures: `c_consistent`, `c_notsettled` and
`c_dual` at 1024, 768 and 390 differ only in the strip's band; the landing only in its first paragraph (29 px taller at
390); `c_fail` at 1280 +52 px from the link's row. Determinism: 6 pairs repeated, each build byte-identical to itself.
Two corrections to the raw run: the base `c_sample` at 1280 and its print were first captured before midnight (the
date line October 31) and re-captured after it, still differing from the change only as expected; `c_rejected` at
1024 and `c_checkerror` at 390 also differ in the stamp's ink texture (the SVG turbulence filter rendering
differently when the page height changes; stable within a build; unrelated to any item).

Accessibility. The heading outline identical in 51 of 51 capture pairs (`c_sample`, the landing and the intake at every
width); the salutation 17.2:1 (ink on bond), the labels 8.96:1, the fill-in text 15.8:1 on gold wash; the moved link
165.7 by 44; the reader order as in N1; the name field reads "Fill in : Your name", the existing pattern.

## Findings, ranked (none blocking)

1. Sure, low. DESIGN.md's landing numbers at 390 are stale after N6: page height 2,045 to 2,074, proof sheet top 656
   to 685, the stamp 735 to 862 becomes 764 to 891 (the stamp still inside the first screen; 1280, 1024 and 768
   unchanged). Fixed in the fix round.
2. Maybe, low. On `c_rejected`, `c_checkerror` and `c_error` at 1024, note 2 sits beside page 1 while its footnote mark
   is on page 2, by the brief's rule that a note anchors to its paragraph's first line. Recorded for Alvaro; a change
   would anchor a note to its claim's line.
3. Sure, low. The Signature and Name labels sit 12 px apart in the same row (the 48 px Signature field and the 36 px
   fields are bottom-aligned), the existing desktop pattern now also on the phone; only on letters whose sign-off has
   no name placeholder. Accepted as the base's pattern.
4. Maybe, untested by any fixture. The closing block pulls two lines only when the paragraph above was not already
   broken; if that paragraph spans a page break and the closing block then crosses the next page's margin, the block
   moves alone. Given to the fix round if small.
5. Maybe, low. A salutation with a period ("Dear Dr. Smith,") stays inline; `closingName` drops the period of "Esq."
   and "Ph.D.". Recorded; a change goes to the web first and then to the Python port.
6. Note. The landing's own crop image now loads at low priority as well as losing the preload; it sits below the fold.

## Not verified

The live checks after the deploy (`/case/c_7cf7ad` and `/case/c_d2d12f` counts, the dc-010 link row, the live console
free of the preload warning); the API's own text download for live cases (recourse `546ee08`, outside the web change).

## Cleanup

Both servers stopped by PID; the worktree removed and pruned (`git worktree list` shows only main); the repo tree
unchanged apart from a rebuilt `web/.next`; the evaluator's scratch folder 70 MB.
