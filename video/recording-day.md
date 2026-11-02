# Recording day checklist, Tuesday Nov 3, 2026

One page to follow on the day. Drawn from `video/edit.md` ("Recording day, what to film" and the time claim) and the checklist in `video/outline.md`. Where the two disagree, Alvaro's Oct 31 decisions in `edit.md` rule. Lines marked "added" are not in either source.

Decided by Alvaro (Nov 1, 2026, by prompt): yes as written, with all three added lines kept (the viewport check, the guest window, Do not disturb).

Cost of the day: the warm-up case plus the take, two live dc-001 runs, about $0.20 to $0.30. Everything else is a free reload.

## 1. Before the take (about 15 minutes ahead)

1. Health. Run `curl https://alpau-reis--recourse-api.us-east.modal.run/health`. It should answer in under a second with `"ok":true`. A slow answer means the container is cold, so run it again.
2. Browser. Open https://recourse-murex.vercel.app at a 1280 by 800 viewport, zoom 100%, no extensions in frame. Added: check the size in the console with `innerWidth + " x " + innerHeight`, which must print `1280 x 800`. Added: a fresh Chrome guest window shows no extensions and no bookmarks.
3. Clipboard. Copy the full text of `cases/letters/dc-001.txt` (1,145 characters).
4. Out of frame. Close the golden-set build, the harness and the review pages (tabs and windows). Added: turn on Windows Do not disturb so no notification lands in the take.
5. Never film dc-002, dc-017 or the `c_notsettled` fixture.

## 2. The warm-up case (10 minutes before the take)

1. Run dc-001 on the site the same way as shots 2 and 3 below, without recording.
2. Stopwatch: start it on the Confirm click, and stop it when the Trust stage ticks ("Trust: Checking the letter against itself..." gets its tick).
3. Read the time against the 75 s rule:

| Warm-up reaches reviewed in | The script says |
|---|---|
| 75 s or less | "about a minute" (as written) |
| 76 to 100 s | "about a minute and a half", Alvaro's call |
| over 100 s | suspect a cold container or a slow API; health again, then decide on the backup take (section 5) |

The same rule applies to the take itself. The on-screen timer in the edit shows the real number, so the spoken claim has to match it.

## 3. The shots, in order (2 to 6 are one continuous recording)

| # | Do | Wait for |
|---|---|---|
| 1 | Load the landing. Record 5 s without moving. | The proof sheet under the top sheet, "Appeal by Dec 6, 2026" with "33 days left" (Tuesday's count). The Lead appears after the page hydrates. |
| 2 | Click "Start with your letter". Click into "Text of the letter" and paste. Press Ctrl+Home inside the box so the letter shows from its first line. Click "Read this letter". | "1,145 of 6,000 characters. Ready." before the click. Then "Reading your letter" ticking, then the case card. |
| 3 | If a row shows a gold "Check", click "Looks right". Scroll about 1,900 px down to "Confirm" and click it. **Start the stopwatch on this click.** | The URL changes to `/case/c_...`. |
| 4 | One scroll to bring the slip and the record sheet into view. Do not touch the page until the verdict. When the stamp lands, scroll to the very top. | The first finding (about 20 s), Steelman, the stamp (about 47 s), "Second opinion: Muse Spark Open agrees." (about 50 s), the Trust tick. **Stop the stopwatch at the tick.** At the top: the stamp, the Lead with the calendar leaf, the slip. |
| 5 | Scroll to the exhibit pair. Click "See the page" on Exhibit 2. Hold 5 s. Do not press Escape (it leaves a black focus outline on the crop). | The red highlight on page 5 and "Muse Spark vision check: the highlighted text reads ... and matches the quote." |
| 6 | Click "Close" on the panel, then click empty bond to drop the focus. Scroll slowly to "Appeal letter" and down to page 2 with sidenotes 1 to 3. Back to the top for the Lead and the second opinion line. | The sidenotes beside the letter; "Appeal by Dec 6, 2026" with the leaf; "Second opinion: Muse Spark Open agrees." |
| 7 | Load `/case/c_d2d12f` (free reload, decision 7; no live dc-010 run) and scroll to the top. | 2.5 s after the stamp attaches: "The documents do not settle it.", "Find what would settle it", "Amount: Not stated in the letter". |
| 8 | Retakes by reload in the same sitting: the new case's page, `c_d2d12f`, the landing (section 4). | Each page settled for 3 s. |

**Write down right after the take:** the new case id, the stopwatch time, and the receipt's reviewed time. The edit's timer has to end on the real number.

Rows 1 and 7 of the cut list need nothing filmed. The letter still is current and the numbers card is made in the edit.

## 4. The retakes (the 8 stale stills)

Most are already in the continuous take. Reload only what the take missed or got wrong.

| Stale still | Covered by | If missed, reload |
|---|---|---|
| `seg2-landing-view.png`, `seg8-landing-view.png` | Shot 1 | The landing |
| `seg2-pasted-letter-top-view.png` | Shot 2 (Ctrl+Home) | `/case/new`, paste, do not submit |
| `seg4-exhibit-pair-view.png` | Shot 5 | The new case page |
| `seg4-see-the-page-view.png` | Shot 5 | The new case page, "See the page" (cached, free) |
| `seg5-letter-sheet-view.png` | Shot 6 | The new case page |
| `seg5-second-opinion-view.png` | Shot 6 | The new case page |
| `seg6-notsettled-stamp-view.png` | Shot 7 | `/case/c_d2d12f` |

## 5. The backup take

Use the backup when the take runs over 100 s, a stage fails, or the stamp says something other than "The denial appears inconsistent with the policy." The backup is the Oct 29 clip, `C:\Users\pau\AppData\Local\Temp\claude\video-shots\clip-dc001.webm`, cut per `edit.md` (five segments, the timer ending on 73.9 s), with the stills retaken by reload of `c_7cf7ad`. The clip shows the Oct 29 site; that was accepted in decision 1. Never put the timer on `/case/c_sample`, because its replay timing is unverified. Keep the `video-shots` and `video-edit` folders under Temp until the edit is done; the backup lives there.

## Not verified

- Whether the case page scrolls itself when the verdict lands. Shot 4 assumes you scroll by hand.
- That a Tuesday run shows no gold "Check" row (none on Oct 29).
- The script's spoken timing per row. The read-aloud is still owed.
