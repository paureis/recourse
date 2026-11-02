# Recourse: the three-minute video, edit list

Drafted Oct 31, 2026, for Alvaro's yes or no row by row. Recording Tuesday Nov 3, submission Wednesday Nov 4.

## What this is

The cut list for the three-minute video, built from `video/outline.md`, `video/script.md` (389 spoken words, unchanged here), `video/shots-2026-10-29.md` and the Oct 29 clip and stills in `C:\Users\pau\AppData\Local\Temp\claude\video-shots\`.

The stills and the clip show the site of Oct 29 evening. The site at recourse `06ff755` changed on Oct 30: the landing proof sheet, the calendar leaf at the deadline Lead, the band's reviewed lines, the 44 px crop control, the 16 px sidenote gutter, "Not stated in the letter", and no photo door at desktop. Section 5 marks each still current or stale.

Every clip offset below comes from a frame I extracted and looked at, under `C:\Users\pau\AppData\Local\Temp\claude\video-edit\frames\` (file `f_<seconds>.png`). Comparison captures of today's site (Oct 31, read-only, no model cost) are in `...\video-edit\today\`.

The clip is 126.6 s by ffprobe: 3,165 frames at 25 fps, last frame at 126.56 s. On screen, events show 0.1 to 0.2 s earlier than the shots record's offsets up to 101 s. The panel close is the exception: it shows at 102.60 s, not 103.5. The offsets below are the frame times.

## The cut list

| # | Time | Words, target | On-screen source | Edit actions |
|---|---|---|---|---|
| 1 | 0:00 to 0:20 | 47 words, 20 s | `seg1-letter-page-view.png`, held 20 s | Circle "limits private duty nursing to 8 hours per day" (x 517 to 857, y 552 to 572). Draw it on "Its reason". Text card from "Most people stop here" (row 1 note). |
| 2 | 0:20 to 0:40 | 38 words, 20 s | Clip 0.4 to 3.6, 3.7 to 5.4, `seg2-pasted-letter-top-view.png`, clip 6.72 to 10.5, 14.96 to 19.36. Primary: recording day, film live (decision 1). | Cut the read wait 10.5 to 14.96. Holds on the landing, the pasted letter and the case card (row 2 note). No timer. |
| 3 | 0:40 to 1:10 | 66 words, 30 s | Clip 20.9 to 24.9, 40.6 to 46.6, 58.2 to 61.2, 66.96 to 70.0, 91.9 to 93.2. Primary: recording day, film live (decision 1). | Elapsed timer overlay, zero at clip 19.3. Five segments, four cuts, frozen-timer holds. Ends on "reviewed 73.9 s" (section 3). |
| 4 | 1:10 to 1:40 | 62 words, 30 s | `seg4-exhibit-pair-view.png` 14 s; clip 99.40 to 102.56 (3.2 s); `seg4-see-the-page-view.png` 12.8 s | The clip piece carries the click: the panel opens at 99.60 and the page draws at 100.00. Cut before 102.60, where the focus outline appears. Add a click marker on "See the page"; the headless clip has no cursor. |
| 5 | 1:40 to 2:05 | 50 words, 25 s | `seg5-letter-sheet-view.png` 8.5 s; deadline shot 5.5 s (decision 3); `seg5-second-opinion-view.png` 11 s | Slow push-in to the second opinion line (x 138 to 445, y 310 to 326 in the still) on "Here, it agrees." |
| 6 | 2:05 to 2:15 | 23 words, 10 s | `seg6-notsettled-stamp-view.png` (stale) or today's reload of `c_d2d12f` (decision 7) | Hold 10 s on the stamp and "Find what would settle it". The outline's "two seconds" is shorter than the row's 23 words, so the script's 10 s span rules. |
| 7 | 2:15 to 2:45 | 75 words, 30 s | The numbers card, made in the edit (section 6) | One line per spoken sentence. Bring each line in as it is spoken. |
| 8 | 2:45 to 3:00 | 29 words, 15 s | `seg8-landing-view.png` (stale), so a landing retake (decision 2) | Overlay "recourse-murex.vercel.app" and "github.com/paureis/recourse" as they are spoken. |

Total: 390 words over 180 s (389 before the Nov 1 card change). Row 7 is the fastest row (75 words in 30 s, about 150 a minute, against about 130 for the whole script). The script's timings are a draft until Alvaro reads them aloud.

### Notes per row

Row 1. The still is a local rendering of dc-001's text (`seg1-letter-page.html`), not a site page, so the Oct 30 changes do not touch it. I measured the phrase's box in that HTML at 1280 by 800 (scrollY 0): x 517.1, y 551.7, 340.1 by 20 px. The text card reads "Denials are rarely appealed. 43 to 67% of appeals succeed. (KFF, 2025 data)" (script row 1). It goes in over the letter's lower half from "Most people stop here." The "SAMPLE LETTER FOR DEMONSTRATION" banner stays (shots problem 17).

Row 2, from the clip, with holds, in program time:

| Program | Clip | Play | Hold | Spoken over it |
|---|---|---|---|---|
| 0:20.0 to 0:25.0 | 0.4 to 3.6, the landing | 3.2 s | 1.8 s | "This is Recourse, a coverage denial appeal agent." |
| 0:25.0 to 0:29.0 | 3.7 to 5.4, the desk; then `seg2-pasted-letter-top-view.png` | 1.7 s | 2.3 s on the still | "Paste the letter and click Read this letter." |
| 0:29.0 to 0:32.8 | 6.72 to 10.5, "Reading your letter" ticking "Reading the letter, done" | 3.8 s | 0 | "Muse Spark reads it into a case card." |
| 0:32.8 to 0:37.1 | 14.96 to 16.48, the case card | 1.5 s | 2.8 s on 16.48 | "Fix anything wrong," |
| 0:37.1 to 0:40.0 | 16.48 to 19.36, the scroll to Confirm, cut on the click | 2.9 s | 0 | "then Confirm. Nothing runs until you say the card is right." |

Clip 0.24 is a white frame and 0.32 is the first landing frame. The letter is pasted at 5.76 and "Read this letter" is pressed at 6.68. Clip 5.76 to 6.68 shows the end of the letter with the focus ring (problem 3), so the still replaces it (decision 4). The card arrives at 14.96. The page jumps there (layout shift 0.32, problem 16), and that jump is the cut point. The click lands between 19.36 and 19.40. Frame 19.40 is the first one after it.

The script's on-screen note for row 2 says click "Paste text". At 1280 that door does not exist: it is `lg:hidden` in `web/src/components/intake/EntryForm.tsx`, and the text box sits on the desk. The spoken words do not name it, so nothing changes in the script.

The case card flagged no Check row on Oct 29 (problem 1). Row 2 no longer speaks of it (the Oct 29 evening decision).

Row 3. See section 3. The stale still `seg3-stamp-view.png` is not used.

Row 4, in program time:

| Program | Source | Spoken over it |
|---|---|---|
| 1:10.0 to 1:24.0 | `seg4-exhibit-pair-view.png` | "Here is the gap. ... it states no eight-hour limit." (31 words) |
| 1:24.0 to 1:27.2 | Clip 99.40 to 102.56 | "Click See the page." |
| 1:27.2 to 1:40.0 | `seg4-see-the-page-view.png` (red highlight, "Muse Spark vision check: the highlighted text reads ... and matches the quote.") | "Every quote is located on the real page ... Nothing is taken on trust." |

In the clip piece, 99.40 to 99.56 is the exhibit pair. At 99.60 the panel opens with "Loading page 5 of Florida Medicaid Private Duty Nursing ...". At 100.00 the page and the highlight draw, and the vision line is on screen by 100.6. Frames 100.6 to 102.56 do not change.

Row 5, in program time:

| Program | Source | Spoken over it |
|---|---|---|
| 1:40.0 to 1:48.5 | `seg5-letter-sheet-view.png` (page 2 of 3, sidenotes 1 to 3) | "Then the appeal letter ... passed the same check." |
| 1:48.5 to 1:54.0 | The deadline shot (decision 3) | "The deadline comes from the letter, December sixth, with the days left." |
| 1:54.0 to 2:05.0 | `seg5-second-opinion-view.png` | "Last, a second opinion ... Here, it agrees." |

There is a clip alternative for the letter: 110.5 to 118.3 scrolls slowly through the letter. It shows page 1 without sidenotes at first, has the old gutter, and jumps at 108.28 and 108.68 just before it. The stills read better.

Row 8. Take the landing from the same day as the run. The proof sheet's day count is today's: 36 on Oct 31, 33 on Nov 3. The case page's count is fixed at the case's opening: 38 on `c_7cf7ad`, a Tuesday case 33.

## The run, cut to about fifteen seconds

Script row 3 has 30 s for 66 words. The outline asked for the run cut to about 15 s. The cut plays 17.3 s of the clip in five segments and holds the last frame of each one to fill the rest (12.7 s). The timer runs only while footage plays, jumps forward at each cut, and stops on a hold. It never shows a time the run did not reach, and it ends on the run's real total (decision 6).

The timer is clip time minus 19.3 s. With that zero, the frames match the event log's elapsed times. The first finding first shows at clip 41.0 (timer 21.7; log 21.7). The verdict lands at 66.44 (47.1; log 47.0). "Agrees" first shows at 69.5 (50.2; log 50.2). The Trust tick first shows at 93.2 (73.9; log 73.9).

| Seg | Clip in | Clip out | Play | Timer at in | Timer at out | Hold (timer stopped) | Program | On screen | Spoken over it |
|---|---|---|---|---|---|---|---|---|---|
| A | 20.9 | 24.9 | 4.0 s | 1.6 | 5.6 | 1.0 s | 0:40.0 to 0:45.0 | The slip: Intake and Routing ticked, Investigation "Planning the questions...", the record sheet open | "Now it works the case. It plans its own questions about the policy" |
| B | 40.6 | 46.6 | 6.0 s | 21.3 | 27.3 | 5.0 s | 0:45.0 to 0:56.0 | The first finding lands at 41.0 with its tick and the rule's words; the slip reads "Question 3 of 6", then "Question 4 of 6" | "and answers each one with the rule, quoted word for word. A verifier checks every quote, and anything it cannot support is struck out, in plain view." |
| C | 58.2 | 61.2 | 3.0 s | 38.9 | 41.9 | 3.8 s | 0:56.0 to 1:02.8 | Investigation ticked; "Steelman: Weighing the payer's side..." | "Before it decides, it argues the payer's side first, as strongly as the documents allow." |
| D | 66.96 | 70.0 | 3.0 s | 47.7 | 50.7 | 0.6 s | 1:02.8 to 1:06.4 | The stamp "The denial appears inconsistent with the policy.", "6 of 6 findings verified", the second opinion line turning to "agrees" at 69.5 | "Then the stamp. On the site" |
| E | 91.9 | 93.2 | 1.3 s | 72.6 | 73.9 | 2.3 s | 1:06.4 to 1:10.0 | "Trust: Checking the letter against itself..." ticks at 93.2 | "this takes about a minute." |

The final reading is "reviewed 73.9 s". Hold it on the frame at 93.2. On that frame the Trust tick is still drawing; it is full at 93.4. To show the full tick, extend E to 93.4 and stop the timer at 73.9 on the 93.2 frame. That puts 0.2 s of picture under a stopped timer. The decision is the editor's.

Cut points checked by frame:
- 20.84 is the last frame of the glide to the slip. 20.9 is settled.
- 40.6 still reads "Planning the questions...".
- 58.2 reads "Question 6 of 6". The Steelman line shows by 58.6.
- 66.88 is mid-scroll and 66.96 is the first frame at the stamp.
- 91.9 shows Trust running.

Segment A's screen is still (only "Planning the questions..." shows). The first finding at 41.0 brings two small layout shifts (scores 0.036 and 0.019, problem 16), which read as the record growing.

Problem 5 (the stale "Second opinion: Muse Spark Open is deciding..." line): in the clip that line is live, not stale. It reads "is deciding..." from 66.96 to 69.4 and "agrees" from 69.5. Segment D shows the change as it happened, and its hold sits on "agrees". The stale still `seg3-stamp-view.png` is not used. To show less of "is deciding...", start D later (69.0 gives 1.0 s of play); the timer stays honest either way.

Problem 6 (the 24 px scroll in `seg3-stamp-view.png`): the cut does not use that still. Segments D and E come from the same scroll position (the run script centred `[data-verdict]`). In both, the "Recourse" wordmark touches the top edge, and the case line "CASE c_7cf7ad · Sample Health Plan · opened Oct 29, 2026" reads whole (frames 67.0 and 91.9). No edit action. A Tuesday take avoids it by scrolling to the very top when the verdict lands.

What the segments still show of the Oct 29 site: the open ring before "Appeal by Dec 6, 2026" in D and E, where the site now draws the calendar leaf. The cut ends at 93.2, before 94.72, so the old band line "Letter checked: the first draft stands." never shows. The finding line cut with an ellipsis ("...request a Medicaid ...", problem 4) shows in C, D and E.

## Cuts around bad frames

| Record offset (s) | Source | Frames I looked at | Found | Keep out of the cut |
|---|---|---|---|---|
| 2.7 | Problem 15 | 2.1, 2.7, 3.3 | Clean. There is no frame-to-frame change between 0.32 and 3.64 (the full page equals the viewport on the landing). | Nothing to cut. |
| 16.0 | Problem 15 | 15.36, 15.40, 15.44, 15.4, 15.60, 15.64, 15.68, 16.0, 16.48, 16.52, 16.56, 16.6 | Clean. The jump at 16.52 is the first wheel step of the scroll to Confirm, not a bad frame. The small changes at 15.36 to 15.60 look identical to the eye. | Nothing to cut. Row 2 cuts at 16.48 anyway. |
| 67.9 | Problem 15 | 67.3, 67.9, 68.5 | Clean. | Nothing to cut. |
| 96.7 | Problem 15 | 96.1, 96.48, 96.52, 96.56, 96.60, 96.7, 96.92, 96.96, 97.3, 97.32, 97.36 | Bad: exactly one frame, at 96.52. It is grey, with the shrunken full page as a strip of thumbnails at the left; its mean luma is 135 against 214 either side. 96.48 and 96.56 are clean. Scroll jumps follow at 96.96 and 97.36. | 96.02 to 97.02. Row 4 starts at 99.40. |
| 99.1 | Problem 15 | 98.5, 99.1, 99.7 | Clean. The panel opens at 99.60. | Nothing to cut. |
| 101.2 | Problem 15 | 100.6, 101.2, 101.8, 102.36, 102.40, 102.44 | Clean. No displaced panel in the encoded clip, and no frame change between 100.0 and 102.4. | Nothing to cut. |
| 108.4 | Problem 15 | 107.8, 108.4, 109.0 | No grey or shrunken frame. Three different scroll positions: the page jumps at 108.28 and 108.68 (the run script scrolling the letter into view). | 107.78 to 109.18, if the clip's letter scroll is ever used. |
| 103.5 to 126.9 | Problem 11 | 102.56, 102.60, 102.64, 102.72, 102.76, 102.80, 103.0, 126.5 | The black focus outline on Exhibit 2's crop starts at 102.60, the frame where the panel closes, not at 103.5. It stays to the last frame wherever the exhibit is in view. | Keep out 102.60 to 126.56. Row 4 ends at 102.56, the frame before the close, without the half-second margin, because 102.36 to 102.56 are clean and the panel is still open. |
| 94.72 to end | Seen while checking 93.4 | 94.0, 94.8, 126.5 | The band line "Letter checked: the first draft stands." (the Oct 29 wording) appears with the layout shift at 94.72 and stays in the header to the end. | Do not use the header after 94.72. Row 3 ends at 93.2. |

How I found the frames: the mean luma of every frame (`signalstats`) and the change from each frame to the next (`tblend` difference). Then I extracted and viewed the frames at each offset, at 0.6 s either side, and at every spike near them. The data is in `...\video-edit\yavg.txt` and `diff.txt`; the contact sheets are in `...\video-edit\sheets\`.

## Stills per row, stale or current

Current means the still matches the deployed site at `06ff755`. Stale names the one change that differs. Free retake means a reload with no model cost: the vision check answers from the cache, and today's reloads of `c_7cf7ad` and `c_d2d12f` sent one cached `vision-check` POST each.

| Still | Row | State at 06ff755 | Free retake |
|---|---|---|---|
| `seg1-letter-page-view.png` | 1 | Current. A local page of dc-001's text, not a site page. | Not needed |
| `seg2-pasted-letter-top-view.png` | 2 | Stale. Shows "Take a photo" beside the box; the photo door is now hidden from 1024 px (today's `/case/new` shows only "Choose a PDF or image" and "Try a sample letter"). | Yes: `/case/new`, paste dc-001, do not submit |
| `seg2-landing-view.png` (clip 0.4 to 3.6 is the same page) | 2 | Stale. No proof sheet; the landing now has "The sample case, decided." with the stamp, the Lead and the exhibit pair under the top sheet. | Yes: the landing |
| `seg2-case-card-view.png` (alternative for row 5's deadline) | 2, 5 | Current as far as the Oct 30 list goes: dc-001 has no empty field, and the doors are not on the card. Not compared today, because a retake needs a live read. | No: needs "Read this letter" (a model call) |
| `seg4-exhibit-pair-view.png` | 4 | Stale. The crop control is now 44 px tall at 1280 (was 41.5); the crop sits 1.3 px lower. Not visible at a glance. | Yes: `c_7cf7ad` |
| `seg4-see-the-page-view.png` | 4 | Stale only behind the panel (the same 1.3 px). Not compared, because I did not open the panel today. | Yes: `c_7cf7ad`, then "See the page" (cached vision check) |
| `seg5-letter-sheet-view.png` | 5 | Stale. The sidenotes now end 16 px left of the index tabs (column 764 to 1168, rail at 1184). The letter's date line reads the viewing day (Oct 29 here, Oct 31 in today's capture). | Yes: `c_7cf7ad` |
| `seg5-deadline-view.png` | 5 | Current. Today's `c_7cf7ad` shows the same plain line "Appeal by Dec 6, 2026, 38 days left" in the letter section. Only the letter's date line moves with the day. | Not needed |
| `seg5-second-opinion-view.png` | 5 | Stale. The band reads "Letter checked. The draft stands as written." (was "Letter checked: the first draft stands."), and a calendar leaf replaces the open ring before "Appeal by Dec 6, 2026". | Yes: `c_7cf7ad` (today: `today\c7cf7ad-view.png`) |
| `seg6-notsettled-stamp-view.png` | 6 | Stale. "Amount: Not found" now reads "Not stated in the letter". The band now reads "Letter checked. 1 of 1 issue fixed." | Yes: `c_d2d12f` (today: `today\cd2d12f-view.png` shows both) |
| `seg8-landing-view.png` | 8 | Stale. No proof sheet. | Yes: the landing (today: `today\landing-view.png`) |

Count: 11 stills in the list, 8 stale and 3 current. Of the 9 the cut list uses first, 7 are stale. Every stale still has a free retake. The clip is stale in the same ways, by time range:
- the landing (0.3 to 3.6)
- the photo door (3.7 to 14.9)
- the ring at the Lead (from 20.4)
- the crop control (exhibit views)
- the band line (from 94.72)
- the sidenote gutter (110.5 to 118.3)

## The numbers card

On screen, numerals; in the voice, words (row 7 as written). One line per spoken sentence:

| # | On the card | Spoken sentence | Source |
|---|---|---|---|
| 1 | Tested on 30 reviewed denial letters, three times | "We tested it on thirty reviewed denial letters, three times." | `results/case-evals-2026-10-29.md`, `results/case-evals-2026-10-30.md` and `results/case-evals-2026-11-01-full.md` (Cases: 30 each); `cases/README.md` (the review) |
| 2 | Verdict right on 25 to 28 of 30; 12 or 13 of 13 where the denial did not match the policy | "The verdict was right on twenty-five to twenty-eight of thirty, and on twelve or thirteen of the thirteen where the denial did not match the policy." | Accuracy 28 / 30 and Intended inconsistent 13 / 13 (Oct 29); 26 / 30 and 12 / 13 (Oct 30); 25 / 30 and 12 / 13 (Nov 1); README, Run-to-run variance |
| 3 | All 224 letter claims verified against the page (71 of 71, 75 of 75, 78 of 78) | "All two hundred twenty-four letter claims were verified against the page." | Letter claims verified 71 / 71 (Oct 29), 75 / 75 (Oct 30) and 78 / 78 (Nov 1), 0 struck in all three |
| 4 | Open model (Muse Spark Open) agreed on 79 of 84 | "The open model agreed on seventy-nine of eighty-four." | Second opinion agrees 26 / 28 (Oct 29), 28 / 28 (Oct 30) and 25 / 28 (Nov 1) |
| 5 | About $0.10 a case | "About ten cents a case." | Cost per case mean $0.0942 (Oct 29), $0.0935 (Oct 30) and $0.0956 (Nov 1) |
| 6 | Test data built before the event · every number is in the repo: github.com/paureis/recourse | "The test data was built before the event, and every number is in the repo." | README, "Before the event (dataset and groundwork, Oct 21 to 26)" |

The outline's card also lists the judge agreement (84% on 50 answers, kappa 0.70), the time and the dataset size. The script does not speak them, so they stay off the card. That matches the script's alternative line for row 7, which is not taken.

## The time claim

The script says "On the site this takes about a minute." Every measured time:

| Where | When | Seconds | Source |
|---|---|---|---|
| Eval run, 30 cases, three at a time, mean (p50) | Oct 29 | 38.5 (41.7) | `results/case-evals-2026-10-29.md` |
| Eval run, dc-001 | Oct 29 | 54.7 | `results/case-evals-2026-10-29.json` |
| Eval run, mean (p50) | Oct 30 | 45.3 (49.0) | `results/case-evals-2026-10-30.md` |
| Eval run, dc-001; slowest case dc-002 | Oct 30 | 65.5; 69.3 | `results/case-evals-2026-10-30.json` |
| Site, dc-001 rehearsal, Confirm to reviewed (receipt 51) | Oct 29, 11:54 am ET | 51.7 | `video/rehearsal-2026-10-29.md` |
| Site, dc-001 `c_7cf7ad`, Confirm to reviewed (receipt 73) | Oct 29, 9:20 pm ET | 73.9 | `video/shots-2026-10-29.md`; the frames above agree (73.9 with zero at 19.3) |
| Site, dc-010 `c_d2d12f`, Confirm to reviewed (receipt 71) | Oct 29, 9:24 pm ET | 72.1 | `video/shots-2026-10-29.md` |
| Site, dc-012 dual `c_d8240f` | Oct 30 afternoon | 71 | `DECISIONS.md`, Oct 30, 1:00 to 3:30 pm |
| Site, dc-012 dual `c_a3435e`, to reviewed | Oct 30 evening, after the Modal deploy | 64 | `DECISIONS.md`, Oct 30, 6:00 to 8:30 pm |

Every site run since the noon rehearsal took 64 to 74 s, and the eval means are 38.5 and 45.3 s. "About a minute" holds for all of them.

Recommendation for recording day:
1. Run the warm-up case (outline checklist 2) and time it from Confirm to the Trust tick.
2. Keep "about a minute" if the warm-up and the take reach reviewed in 75 s or less. 75 is just above the slowest site run measured (73.9).
3. From 76 to 100 s, the honest phrase is "about a minute and a half". Changing it is Alvaro's call, since it changes the script's words.
4. Over 100 s, suspect a cold container or a slow API, and use the backup take rather than the claim. The backup is the Oct 29 clip with this cut list, ending on its timer at 73.9.

Whatever the take, the timer's final reading is on screen. The spoken claim has to agree with it. `c_sample` is a recorded replay; its replay timing is unverified here, so do not put the timer on it.

## Recording day, what to film

Before filming, from the outline's checklist:
1. `curl https://alpau-reis--recourse-api.us-east.modal.run/health` answers in under a second.
2. One warm-up case ten minutes before the take ($0.10). Time it (section 7).
3. Browser at 1280 by 800, zoom 100 percent, no extensions in frame, https://recourse-murex.vercel.app.
4. dc-001's text from `cases/letters/dc-001.txt` in the clipboard. Backup take: `/case/c_sample`.
5. Never dc-002 or dc-017. Never the `c_notsettled` fixture. The golden-set build, the harness and the review pages stay out of frame (close those tabs and windows).

Shots, in order. Shots 2 to 6 are one continuous recording.

| # | Row | Do | Wait for |
|---|---|---|---|
| 1 | 2, 8 | Load the landing. Record 5 s without moving. | The proof sheet under the top sheet with "Appeal by Dec 6, 2026" and the day count shown (33 on Nov 3); the Lead appears after the page hydrates. |
| 2 | 2 | Click "Start with your letter". Click into "Text of the letter", paste, then press Ctrl+Home inside the box so the letter shows from its first line (decision 4). Click "Read this letter". | About "1,145 of 6,000 characters. Ready." before the click (the file is 1,145 characters; the box's count moves by the line endings of the paste); then "Reading your letter" ticking, and the case card (5.6 to 8.4 s so far). |
| 3 | 2 | If a row shows a gold "Check", click "Looks right". Scroll about 1,900 px down to "Confirm" and click it. | The case page URL `/case/c_...`. Start the stopwatch at the click. |
| 4 | 3 | One scroll to bring the slip and the record sheet into view. Do not touch the page until the verdict. When the stamp lands, scroll to the very top, so the stamp, the Lead with the calendar leaf and the slip are in view. | The first finding (about 20 s), Steelman, the stamp (about 47 s), "Second opinion: Muse Spark Open agrees." (about 50 s), the Trust tick. Stop the stopwatch at the tick. |
| 5 | 4 | Scroll to the exhibit pair. Click "See the page" on Exhibit 2. Hold 5 s. Do not press Escape: it leaves a black focus outline on the crop (problem 11). Stop on the open panel. | The red highlight on page 5 and the line "Muse Spark vision check: the highlighted text reads ... and matches the quote." |
| 6 | 5 | Close the panel with "Close", then click empty bond to drop the focus. Scroll slowly to "Appeal letter" and down to page 2 with sidenotes 1 to 3. Back to the top for the Lead and for the second opinion line. | The sidenotes beside the letter with the 16 px gutter; "Appeal by Dec 6, 2026" with the leaf; "Second opinion: Muse Spark Open agrees." |
| 7 | 6 | Load `/case/c_d2d12f` (free; decision 7) and scroll to the top. Or, if Alvaro keeps the live run: run dc-010 once before filming ($0.10) and film its own case page after reviewed. | 2.5 s after the stamp attaches: "The documents do not settle it.", "Find what would settle it", "Amount: Not stated in the letter". If a live dc-010 says anything else, use `c_d2d12f`. |
| 8 | 4, 5, 6, 8 | If any retake was approved (decision 2), take it from the reloads in the same sitting: `c_7cf7ad` or the new case, `c_d2d12f`, the landing. | Each page settled for 3 s. |

Rows 1 and 7 need nothing filmed: the letter still is current and the card is made in the edit.

## Decisions for Alvaro

1. Film the run fresh on Tuesday (rows 2 to 5), and keep the Oct 29 clip with this cut list only as the backup take? The clip shows the Oct 29 site (the old landing, the photo door, the open ring at the Lead, the old band line), and judges who open the link will see the Oct 30 site. Recommended: yes.
2. Retake the stale stills on Tuesday, in the same sitting as the run, rather than today? The reloads are free either way. On Tuesday the landing's day count (33) and the letter's date line (November 3) will match the new case. Recommended: yes.
3. Take row 5's deadline beat from the Lead at the top of the reviewed case page, rather than the case card's red stamp (problem 13) or the letter section's plain line? The voice says "December sixth, with the days left". The Lead shows exactly that in 30 px type with the new calendar leaf, on the page being described. The red stamp belongs to the intake card from a minute earlier. Recommended: yes.
4. Show the pasted letter from its top (`seg2-pasted-letter-top-view.png`, or Ctrl+Home on Tuesday) instead of the scrolled view with the focus ring (problem 3)? The top shows the "SAMPLE LETTER" banner, the plan and the date the viewer just saw on the letter. The scrolled view starts mid-sentence. Recommended: yes.
5. Keep "about a minute" if Tuesday's warm-up and take reach reviewed in 75 s or less? Every site run since the noon rehearsal took 64 to 74 s, and the on-screen timer will show the real number beside the claim. Recommended: yes.
6. Fill row 3's 30 s with about 17 s of run footage and frozen-timer holds, rather than 30 s of continuous run? The outline asked for about 15 s of run, and a timer that stops on a held frame never shows a time the run did not reach. Recommended: yes.
7. Take the not-settled shot (row 6) from a reload of `c_d2d12f`, the live dc-010 run of Oct 29, rather than a new live dc-010 run on Tuesday? dc-010 came back consistent in the Oct 30 live probe (the model's variance), so a Tuesday run may not say "not settled". `c_d2d12f` is already a live run of the same letter on the deployed site. Recommended: yes.
8. Use the numbers card text in section 6 as written? Each line is one spoken sentence of row 7, with numerals from the two eval files. Recommended: yes.

Decided by Alvaro (Oct 31, 2026, by prompt): yes to all eight. Tuesday's screen recording is the primary take and the Oct 29 clip with this cut list is the backup; the stale stills are retaken on Tuesday in the same sitting; the deadline beat is the Lead with the calendar leaf; the pasted letter is shown from its top; "about a minute" stays while the take reaches reviewed in 75 s or less; row 3 is five segments with frozen-timer holds; row 6 is a reload of `c_d2d12f`; the numbers card as written, without the judge line.

## What I could not verify

- The Steelman line's first frame lies between 58.0 and 58.6; I did not narrow it further.
- `seg4-see-the-page-view.png` and `seg2-case-card-view.png` were not compared with today's site (the first needs the panel opened; the second needs a live read).
- `c_sample`'s replay timing.
- Whether the case page scrolls itself when the verdict lands. On Oct 29 the run script scrolled it (`run.mjs` line 162), so shot 4 assumes Alvaro scrolls.
- The voice timings per row are word counts at the script's spans. Nobody has read them aloud against the cut.
