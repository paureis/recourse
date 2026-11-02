# Rehearsal on the deployed site, Monday Nov 2, 2026, 12:15 to 12:40 pm ET

Driven by Claude in the Claude desktop app's browser pane at a 1280 by 800 viewport, following `video/recording-day.md` once through, without recording. One live case, $0.11. The site is recourse `main` (web unchanged since cd64e22); the API on Modal is df659d8.

## The warm-up time

| Event | From the Confirm click |
|---|---|
| Investigation running, six questions planned | by 10 s |
| The stamp ("The denial appears inconsistent with the policy.") | 31.5 s |
| Action done, Trust running | by 39 s |
| The Trust tick | 58.7 s |

The receipt's total: 57 seconds, $0.1079 (investigation 27 s, verdict 3.7 s, letter 12 s, self-check 14 s; the second opinion 8.4 s beside the letter). 6 of 6 findings verified, 4 of 4 letter sentences, 0 struck, the second opinion agrees, self-check 0 issues. Case `c_7f789d`.

Against the 75 s rule: 58.7 s, so "about a minute" stands as written. Every site run since Oct 29 is now 52 to 74 s (this one inside the range).

Timing method: a click listener on the Confirm button and a MutationObserver on `li[data-slip-stage="trust"][data-state="done"]`, both installed in the page before the click, timestamps in `Date.now()`. The soft navigation from `/case/new` to `/case/c_7f789d` kept the page, so the timer survived.

## Shots, as the checklist describes them

| # | Held | Notes |
|---|---|---|
| 1 | Yes | The landing at 1280 by 800, the proof sheet, "Appeal by Dec 6, 2026", "34 days left" (Monday's count). |
| 2 | Yes, one number | The desk shows "Choose a PDF or image" and "Try a sample letter" only. The count read "1,144 of 6,000 characters. Ready." because the text was set without the file's trailing newline; a clipboard paste of the file gives 1,145. "Reading your letter" took about 4.5 s to the card. |
| 3 | Yes, with the Check row | The card flagged one row, "Member's age group", with a gold Check and "Looks right". Confirm was disabled ("1 detail still to check before you can confirm.") until it was answered. Confirm sits at 1,900 px. |
| 4 | Yes | After one scroll (to 1,058 px) the slip and the record sheet were in view. The page did not scroll itself when the stamp landed; the scroll trace moved only with my own scroll and by 142 px when the slip folded into the band after the Trust tick. At the top after the tick: the stamp, the Lead with the calendar leaf, 6 of 6, 4 of 4, 0 struck, "Second opinion: Muse Spark Open agrees.", the band "Letter checked. The draft stands as written." |
| 5 | Yes, one wording fix | At 1280 there is no "See the page" text. The crop in Exhibit 2 is the control (read as "See page 5 of Florida Medicaid Private Duty Nursing ..."); the text button shows only under 1024. Clicking the crop opened the panel: page 5, the red highlight, Zoom and Close, and "Muse Spark vision check: the highlighted text reads ... and matches the quote." |
| 6 | Yes, one wording note | Close returned focus to the crop button (so the "click empty bond" step is needed, as written). The letter ran three pages today; page 2 carried sidenote 3 with "Found on page 5". |
| 7 | Yes, with a caveat about the pane | `/case/c_d2d12f` shows "The documents do not settle it.", "Find what would settle it", "Amount: Not stated in the letter", "Letter checked. 1 of 1 issue fixed.", "Appeal by Nov 29, 2026 · 27 days left". In the app's browser pane, hidden behind the chat, the page sat on "Loading the case…" for 16 s on the first hard load and 73 s on a reload before the client fetched the case (the API itself answered in 121 ms). A headless Chromium control loaded the same URL four times: HTML in about 0.1 s, the API call at 0.39 s, the page settled in 0.49 to 0.74 s. The delay is the hidden pane throttling the page's client code, not the site. Tuesday's foreground Chrome is not affected. |

## Changes made to the checklist from this run

- Shot 3 names the row that was flagged today and that Confirm waits for the answer.
- Shot 5 names the control at 1280: the crop in Exhibit 2, not a "See the page" text.
- Shot 6 says "page 2 with its sidenotes" (the split depends on the letter's length).
- The "Not verified" list is replaced by what this run verified.

## Not done in this rehearsal

- No screen recording was made (the pane cannot record; Alvaro's practice recording is Tuesday's own warm-up).
- The take's viewport check and Do not disturb are Alvaro's machine's.
- The vision check answered from the cache (216 ms) on `c_d2d12f`; on the new case it ran live inside the panel's 5 s hold.
