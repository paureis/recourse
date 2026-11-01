"use client";

import { Fragment, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  API_URL,
  INTAKE_MODE,
  citationLabel,
  isFixtureCase,
  letterParts,
  letterPlainText,
  sentenceStruck,
  type CitationRef,
  type Letter,
  type LetterParts,
  type LetterSentence,
  type Paragraph,
} from "@/lib/case";
import { InlineReferenceChip, QuoteFigure, groupCitations, pageFolio, shortDocName } from "@/components/investigation/CitationChip";
import { CouldNotVerifyTag } from "@/components/investigation/CouldNotVerifyTag";
import { usePageViewer } from "@/components/investigation/PageViewer";
import { FootnoteRef, MARGIN_BLOCK, MarginNote, noteRegionId, useOverlayPlacement, type NoteGroup } from "./Sidenotes";

const ACTION =
  "inline-flex min-h-12 w-full items-center justify-center px-5 text-[18px] font-semibold sm:w-auto";

/* "Copied." stays for two seconds, then the status line clears. */
const COPIED_MS = 2000;

/*
  The sheet at desktop is US Letter: 620 px wide at 1,280 (8.5 in), so a page
  is 802 px tall (11 in), and it scales in proportion at 1,024. Inner margins
  72 px on every side (1 in), a 24 px strip of desk between pages, the folio
  in the bottom margin.
*/
const PAGE_RATIO = 802 / 620;
const PAGE_GAP = 24;
const MARGIN = 72;
/* Space between two margin notes, and between a note and the next paragraph's notes. */
const NOTE_GAP = 20;

/*
  The appeal letter. On the phone and tablet: set on bond in a hairline frame,
  the date line, To, Re, the salutation, the paragraphs, the closing word and
  the name, then the fields to sign with (Oct 31, N1 and N8); every claim
  sentence with a small citation chip (title, page; the quote on toggle). At
  desktop width (desk): the Annotated Letter, a real document: US Letter pages
  of bond with a 1 px ink edge on the darker desk, each with its folio ("Page 1
  of 2"); a date line, the inside address and the Re line; the salutation on
  its own line; the paragraphs at 18 px; the closing word and the name on lines
  of their own, then the fields to fill in by hand in gold wash ("Fill in", gold
  being reserved for what the person must check or complete). A paragraph that
  crosses a page's bottom margin breaks at a line boundary and resumes at the
  next page's top margin (Oct 31, N2; see the layout below).

  Beside the sheet, the margin: next to the sheet head the deadline, Copy the
  letter and Download as text; next to each paragraph its notes, set as
  sidenotes. A note starts at its paragraph's first line, clears the note
  above it, and stacks downward past its paragraph when the notes are taller
  than the paragraph; the paragraphs never stretch and no blank sheet opens.
  Each note is in the DOM right after its paragraph. A claim sentence ends in
  its footnote number; the number opens the expanded quote over the margin
  below the note, and "page N" opens the page image there; one thing open at
  a time, Escape closes it and returns focus. A sentence the verifier struck,
  or a claim it could not verify, is shown struck with "Could not verify",
  never hidden, and is left out of what is copied, downloaded, or printed.

  Printing the page prints the sheet alone (globals.css, data-print-sheet).
*/
export function AppealLetter({
  letter,
  caseId,
  desk = false,
  today = null,
  deadlineLine = null,
}: {
  letter: Letter;
  caseId: string;
  desk?: boolean;
  /* The date line at the letter's head: the sheet's, and the phone letter's top (N8). */
  today?: Date | null;
  /* "Appeal by Dec 6, 2026, 41 days left", in the margin beside the sheet head (desk only). */
  deadlineLine?: string | null;
}) {
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paragraphs = letter.paragraphs ?? [];

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const onCopy = async () => {
    if (timer.current) clearTimeout(timer.current);
    setCopy("idle");
    const ok = await writeClipboard(letterPlainText(letter));
    setCopy(ok ? "copied" : "failed");
    if (ok) timer.current = setTimeout(() => setCopy("idle"), COPIED_MS);
  };

  const onDownload = () => {
    const blob = new Blob([letterPlainText(letter)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `appeal-letter-${caseId}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const liveDownload = INTAKE_MODE === "live" && !isFixtureCase(caseId);
  const actions = (
    <>
      <div className={desk ? "flex flex-wrap gap-3" : "mt-4 flex flex-col gap-3 sm:flex-row"}>
        <button type="button" onClick={onCopy} className={`${ACTION} bg-ink text-bond`} data-copy="true">
          Copy the letter
        </button>
        {liveDownload ? (
          <a
            href={`${API_URL}/case/${encodeURIComponent(caseId)}/letter.txt`}
            download={`appeal-letter-${caseId}.txt`}
            className={`${ACTION} border border-ink bg-bond text-ink`}
            data-download="live"
          >
            Download as text
          </a>
        ) : (
          <button type="button" onClick={onDownload} className={`${ACTION} border border-ink bg-bond text-ink`} data-download="fixture">
            Download as text
          </button>
        )}
      </div>
      <p role="status" aria-live="polite" className="mt-2 min-h-7 text-[16px] font-semibold" data-copy-status={copy}>
        {copy === "copied" ? "Copied." : copy === "failed" ? "Could not copy. Select the letter text and copy it by hand." : ""}
      </p>
      <p className={`mt-1 text-[16px] text-muted ${desk ? "lg:text-[15px]" : ""}`}>
        Struck sentences are left out of the copy and the download. Each verified claim keeps a short citation in brackets.
      </p>
    </>
  );

  if (!desk) {
    return (
      <div className="mt-4">
        <LetterFrame to={letter.to} re={letter.re} paragraphs={paragraphs} label="Appeal letter" kind="final" today={today} />
        {actions}
      </div>
    );
  }

  return <Sheet letter={letter} paragraphs={paragraphs} actions={actions} today={today} deadlineLine={deadlineLine} />;
}

/*
  Footnote numbers run through the letter, one per margin note: a paragraph's
  verified (document, page) pairs merge into one note, so two sentences citing
  the same page carry the same number. A struck sentence that still names a
  citation gets its own note, marked "Could not verify".
*/
function numberNotes(paragraphs: Paragraph[]): NoteGroup[][] {
  let next = 1;
  return paragraphs.map((p) => {
    const sentences = p.sentences ?? [];
    const verified = groupCitations(sentences.filter((s) => !sentenceStruck(s) && s.claim && s.citation).map((s) => s.citation as CitationRef));
    const groups: NoteGroup[] = verified.map((citations) => ({ n: next++, citations, struck: false }));
    for (const s of sentences) {
      if (sentenceStruck(s) && s.citation) groups.push({ n: next++, citations: [s.citation], struck: true });
    }
    return groups;
  });
}

function noteFor(groups: NoteGroup[], s: LetterSentence): NoteGroup | null {
  if (!s.citation) return null;
  const struck = sentenceStruck(s);
  if (struck) return groups.find((g) => g.struck && g.citations[0] === s.citation) ?? null;
  if (!s.claim) return null;
  const c = s.citation;
  return groups.find((g) => !g.struck && g.citations[0].doc_id === c.doc_id && g.citations[0].page === c.page) ?? null;
}

function Sheet({
  letter,
  paragraphs,
  actions,
  today,
  deadlineLine,
}: {
  letter: Letter;
  paragraphs: Paragraph[];
  actions: ReactNode;
  today: Date | null;
  deadlineLine: string | null;
}) {
  const noteBase = useId();
  /* The salutation and the sign-off as lines of their own (N1); the notes number the paragraphs between them. */
  const parts = useMemo(() => letterParts(paragraphs), [paragraphs]);
  const body = parts.paragraphs;
  const groups = numberNotes(body);
  /* The one expanded quote, by footnote number. Pages open through the viewer provider; one of the two at a time. */
  const [openNote, setOpenNote] = useState<number | null>(null);
  const viewer = usePageViewer();
  const viewerOpenKey = viewer?.state.open?.placement === "margin" ? viewer.state.open.key : null;
  const closeIf = viewer?.actions.closeIf;
  const frameRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const [pages, setPages] = useState<{ n: number; height: number }>({ n: 1, height: 802 });
  /* The lowest point of the margin notes and of an open overlay, in the article's coordinates; the frame grows to the larger. */
  const notesBottom = useRef(0);
  const overlayBottom = useRef(0);
  const fitFrame = useCallback(() => {
    const article = articleRef.current;
    const frame = frameRef.current;
    if (!article || !frame) return;
    const need = Math.max(notesBottom.current, overlayBottom.current);
    frame.style.minHeight = need > article.offsetHeight ? `${need}px` : "";
  }, []);

  const toggleNote = useCallback(
    (n: number) => {
      if (viewerOpenKey && closeIf) closeIf(viewerOpenKey);
      setOpenNote((o) => (o === n ? null : n));
    },
    [viewerOpenKey, closeIf],
  );
  const closeQuote = useCallback(() => setOpenNote(null), []);

  /* Escape closes the expanded quote and returns focus to its footnote number. */
  useEffect(() => {
    if (openNote === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      const n = openNote;
      setOpenNote(null);
      frameRef.current?.querySelector<HTMLElement>(`[data-footnote="${n}"]`)?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openNote]);

  /*
    Pagination and the sidenotes, measured once per layout change (Oct 31, N2).
    A paragraph that crosses a page's bottom margin breaks at a line boundary:
    the lines that fit stay, the rest resume at the next page's top margin. The
    break is two floats at the paragraph's start (BreakFloats): a zero-width one
    as tall as the lines that stay, then a full-width one that clears it and is
    as tall as the rest of the page, the desk strip and the next top margin, so
    the next line box cannot sit beside it and starts under it. No text node is
    split and nothing re-renders. A second pair breaks a paragraph a second
    time (a remainder longer than a page, or the closing block's pull below).
    At least two lines stay on each side; a
    paragraph that cannot give two to each side, the head block and the closing
    block move whole (a spacer before them). The closing block never stands
    alone: when it would move, even from inside the bottom margin, the
    paragraph above gives it its last two lines (from its tail when it already
    spans a page, the tail has four or more and a pair is free; Oct 31 fix round).
    Lines are counted from the paragraph's line height; a paragraph whose height
    is not a whole number of lines (an inline element taller than the line)
    moves whole. Then each margin block is placed at its anchor's top or under
    the block above it, whichever is lower. Spacers and floats are reset before
    every measure, and only their heights and the note offsets are written, so
    nothing re-renders but the page count.
  */
  useLayoutEffect(() => {
    const article = articleRef.current;
    const frame = frameRef.current;
    if (!article || !frame) return;
    let raf = 0;
    const layout = () => {
      const width = article.offsetWidth;
      if (width === 0) return;
      const pageH = Math.round(width * PAGE_RATIO);
      const pitch = pageH + PAGE_GAP;
      const room = pageH - 2 * MARGIN;
      const spacers = Array.from(article.querySelectorAll<HTMLElement>("[data-page-spacer]"));
      for (const s of spacers) s.style.height = "0px";
      for (const f of Array.from(article.querySelectorAll<HTMLElement>("[data-break-float]"))) {
        f.style.display = "";
        f.style.height = "";
      }
      article.style.minHeight = "";
      const pageOf = (y: number) => Math.floor(y / pitch);
      const limitOf = (k: number) => k * pitch + pageH - MARGIN;
      const nextTopOf = (k: number) => (k + 1) * pitch + MARGIN;
      /* The paragraph's lines, when its height is a whole number of them. */
      const linesOf = (block: HTMLElement): { n: number; lh: number; p: HTMLElement } | null => {
        const p = block.querySelector<HTMLElement>(":scope > p");
        if (!p || !p.querySelector("[data-break-float]")) return null;
        const lh = parseFloat(getComputedStyle(p).lineHeight);
        if (!(lh > 0)) return null;
        /* The fractional height: offsetHeight rounds, and the rounding outgrows the tolerance on a long paragraph. */
        const ph = p.getBoundingClientRect().height;
        const n = Math.round(ph / lh);
        return n > 0 && Math.abs(n * lh - ph) < 0.5 ? { n, lh, p } : null;
      };
      /*
        Keep f lines of the paragraph's segment that starts at top on its page; the rest start at the next page's
        top margin. pair 0 breaks the paragraph's first segment; pair 1 breaks the segment after that break (the
        closing block's pull from a paragraph that already spans a page, Oct 31 fix round).
      */
      const breakAt = (p: HTMLElement, lh: number, f: number, top: number, pair: 0 | 1 = 0) => {
        const floats = Array.from(p.querySelectorAll<HTMLElement>(":scope > [data-break-float]"));
        const [hold, gap] = floats.slice(pair * 2, pair * 2 + 2);
        /* The hold float ends half a line into the first line that moves, so rounding never moves the line above it. */
        const holdH = f * lh + lh / 2;
        hold.style.display = "block";
        hold.style.height = `${holdH}px`;
        gap.style.display = "block";
        gap.style.height = `${nextTopOf(pageOf(top)) - top - holdH}px`;
      };
      /* Where a segment of n lines at top that crosses its page's bottom margin breaks: the lines kept, or null. */
      const splitLines = (top: number, n: number, lh: number): number | null => {
        const fit = Math.floor((limitOf(pageOf(top)) - top + 0.5) / lh);
        const f = n - fit < 2 ? n - 2 : fit;
        return f >= 2 && n - f >= 2 ? f : null;
      };
      /* lines: measured before any break, since a broken paragraph is no longer a whole number of lines. */
      type Para = { block: HTMLElement; spacer: HTMLElement; lines: { n: number; lh: number; p: HTMLElement }; tail: { top: number; n: number } | null; pairs: number };
      /*
        The closing block would stand alone on the next page: the paragraph above gives it its last two lines,
        from its last segment on this page (its tail when it already spans a page, with four lines or more, while
        a float pair is free), or moves with it when it is short and unbroken. False when it cannot.
      */
      const pull = (para: Para, k: number, h: number): boolean => {
        const pl = para.lines;
        const pt = para.block.offsetTop;
        if (para.tail) {
          if (para.pairs >= 2 || para.tail.n < 4 || pageOf(para.tail.top) !== k) return false;
          breakAt(pl.p, pl.lh, para.tail.n - 2, para.tail.top, 1);
          return true;
        }
        if (pageOf(pt) !== k) return false;
        if (pl.n >= 4) {
          breakAt(pl.p, pl.lh, pl.n - 2, pt);
          return true;
        }
        if (para.block.offsetHeight + parseFloat(getComputedStyle(para.block).marginBottom) + h > room) return false;
        para.spacer.style.height = `${nextTopOf(k) - pt}px`;
        return true;
      };
      let bottom = MARGIN;
      /* The paragraph above the current block; tail: where its lines resume after its last break, and how many. */
      let prevPara: Para | null = null;
      for (const s of spacers) {
        const block = s.nextElementSibling as HTMLElement | null;
        if (!block) continue;
        const top = block.offsetTop;
        const h = block.offsetHeight;
        const k = pageOf(top);
        const limit = limitOf(k);
        const lines = linesOf(block);
        let tail: { top: number; n: number } | null = null;
        let pairs = 0;
        if (top + h > limit) {
          const f = lines && top <= limit ? splitLines(top, lines.n, lines.lh) : null;
          if (block.dataset.block === "signoff" && prevPara && pull(prevPara, k, h)) {
            const moved = block.offsetTop;
            if (moved + h > limitOf(pageOf(moved))) s.style.height = `${nextTopOf(pageOf(moved)) - moved}px`;
          } else if (lines && f !== null) {
            breakAt(lines.p, lines.lh, f, top);
            tail = { top: nextTopOf(k), n: lines.n - f };
            pairs = 1;
            /* A tail longer than a page breaks once more (the second pair). */
            const f2 = tail.n * lines.lh > room ? splitLines(tail.top, tail.n, lines.lh) : null;
            if (f2 !== null) {
              breakAt(lines.p, lines.lh, f2, tail.top, 1);
              tail = { top: nextTopOf(pageOf(tail.top)), n: tail.n - f2 };
              pairs = 2;
            }
          } else if (h <= room || top > limit) {
            s.style.height = `${nextTopOf(k) - top}px`;
          }
        }
        if (lines) prevPara = { block, spacer: s, lines, tail, pairs };
        bottom = block.offsetTop + block.offsetHeight;
      }
      const n = Math.max(1, Math.floor((bottom + MARGIN - 1) / pitch) + 1);
      article.style.minHeight = `${n * pageH + (n - 1) * PAGE_GAP}px`;

      let prev = -Infinity;
      for (const m of Array.from(article.querySelectorAll<HTMLElement>("[data-margin-anchor]"))) {
        const anchor = article.querySelector<HTMLElement>(`[data-block="${m.dataset.marginAnchor}"]`);
        if (!anchor) continue;
        const top = Math.max(anchor.offsetTop, prev + NOTE_GAP);
        m.style.top = `${top}px`;
        prev = top + m.offsetHeight;
      }
      notesBottom.current = prev;
      fitFrame();
      setPages((p) => (p.n === n && p.height === pageH ? p : { n, height: pageH }));
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(layout);
    };
    layout();
    const ro = new ResizeObserver(schedule);
    ro.observe(article);
    for (const el of Array.from(article.querySelectorAll<HTMLElement>("[data-block], [data-margin-anchor]"))) ro.observe(el);
    void document.fonts?.ready.then(schedule);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [paragraphs, fitFrame]);

  /* An open overlay hangs below its note, or opens upward when it would run past the last page (Sidenotes.tsx). */
  useOverlayPlacement(articleRef, overlayBottom, fitFrame, openNote, viewerOpenKey);

  const dateLine = letterDate(today);

  return (
    <div className="mt-8" data-sheet="annotated">
      <div ref={frameRef} className="relative" data-letter-frame="true">
        <article
          ref={articleRef}
          aria-label="Appeal letter"
          /* z-10: the letter, with its margin overlays, stacks above the sections after it. */
          className="relative isolate z-10 w-[calc((100%-48px)*620/1040)] px-[72px] pt-[72px]"
          data-letter="true"
          data-print-sheet="true"
          data-pages={pages.n}
        >
          {/* The pages, behind the text: bond with a 1 px ink edge, the desk between them, the folio in the bottom margin. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10" data-print-hide="true" data-sheet-pages="true">
            {Array.from({ length: pages.n }, (_, k) => (
              <div
                key={k}
                className="absolute inset-x-0 border border-ink bg-bond"
                style={{ top: k * (pages.height + PAGE_GAP), height: pages.height }}
                data-sheet-page={k + 1}
              >
                <p className="absolute right-[72px] bottom-8 text-[14px] text-muted tabular-nums">
                  Page {k + 1} of {pages.n}
                </p>
              </div>
            ))}
          </div>

          <div data-page-spacer="true" />
          <div className="mb-7" data-block="head" data-sheet-head="true">
            {dateLine ? (
              <p className="text-[17px] tabular-nums" data-letter-date="true">
                {dateLine}
              </p>
            ) : null}
            {/* Set like a letter: the addressee as the inside address, then the Re line; no rules. */}
            <dl className={`text-[17px] leading-snug ${dateLine ? "mt-7" : ""}`}>
              <div>
                <dt className="sr-only">To:</dt>
                <dd className="font-semibold" data-letter-to="true">
                  {letter.to}
                </dd>
              </div>
              <div className="mt-6 flex gap-2">
                <dt className="shrink-0 font-semibold">Re:</dt>
                <dd>{letter.re}</dd>
              </div>
            </dl>
          </div>
          <div className={MARGIN_BLOCK} data-margin-anchor="head" data-print-hide="true" data-letter-actions="true">
            {deadlineLine ? (
              <p className="mb-4 text-[17px] leading-snug font-semibold tabular-nums" data-letter-deadline="true">
                {deadlineLine}
              </p>
            ) : null}
            {actions}
          </div>

          {parts.salutation ? (
            <p className="mb-5 text-[18px] leading-[1.6]" data-letter-salutation="true">
              {parts.salutation}
            </p>
          ) : null}
          {body.map((p, i) => (
            <Fragment key={i}>
              <div data-page-spacer="true" />
              <SheetParagraph
                sentences={p.sentences ?? []}
                index={i}
                groups={groups[i]}
                noteBase={noteBase}
                openNote={openNote}
                onToggleNote={toggleNote}
                onOpenPage={closeQuote}
              />
            </Fragment>
          ))}

          <div data-page-spacer="true" />
          <div className={parts.closing ? "" : "pt-3"} data-block="signoff" data-signature="true">
            <SignOff closing={parts.closing} askName={askName(paragraphs)} text="text-[18px] leading-[1.6]" fill />
          </div>
        </article>
      </div>
    </div>
  );
}

/* The date line at the letter's head: today, as "October 31, 2026". */
function letterDate(today: Date | null): string | null {
  return today ? today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;
}

/* The name is asked once: when the letter already carries a name placeholder ("[Your name]"), the fields drop Name. */
function askName(paragraphs: Paragraph[]): boolean {
  return !paragraphs.some((p) => (p.sentences ?? []).some((s) => /\[[^\]\n]*name[^\]\n]*\]/i.test(s.text)));
}

/*
  The closing block: the closing word and the name the letter signs off with,
  on lines of their own (N1), then the fields a letter is signed with, each a
  gold-wash field marked "Fill in", so they cannot be mistaken for text the
  service wrote. In print they are plain ruled lines. The sheet and the phone
  letter share it (N8); the read-only first draft shows the closing lines only
  (fields: false), its name as plain text (fill: false).
*/
function SignOff({
  closing,
  askName,
  text,
  fill,
  fields = true,
}: {
  closing: LetterParts["closing"];
  askName: boolean;
  /* The paragraphs' type, so the closing lines read as the letter's own text. */
  text: string;
  /* The name placeholder as the gold-wash "Fill in" field (the final letter), or the bracket text (the draft). */
  fill: boolean;
  fields?: boolean;
}) {
  return (
    <>
      {closing ? (
        <div className={text} data-letter-closing="true">
          <p>{closing.word}</p>
          {closing.name ? <p data-letter-name="true">{fill ? withFields(closing.name) : closing.name}</p> : null}
        </div>
      ) : null}
      {fields ? <SignatureFields askName={askName} className={closing ? "mt-6" : ""} /> : null}
    </>
  );
}

function SignatureFields({ askName, className }: { askName: boolean; className: string }) {
  const SIGNATURE_FIELDS = askName ? ["Signature", "Name", "Member ID", "Date"] : ["Signature", "Member ID", "Date"];
  return (
    <ul className={["grid grid-cols-2 items-end gap-x-8 gap-y-5", className].filter(Boolean).join(" ")} data-signature-fields="true">
      {SIGNATURE_FIELDS.map((label) => (
        <li key={label} className={!askName && label === "Signature" ? "col-span-2 max-w-[calc(50%-16px)]" : ""}>
          <p className="text-[14px] leading-5 text-muted">{label}</p>
          <span
            className={`mt-1 flex ${label === "Signature" ? "h-12" : "h-9"} items-end border-b-2 border-gold bg-gold-wash px-2 pb-1 text-[14px] leading-5 font-semibold text-ink print:border-ink print:bg-transparent`}
            data-fill-in={label}
          >
            <span className="print:invisible">Fill in</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/*
  The page break inside a paragraph (N2): two pairs of floats at its start (the second pair for a second break,
  when the closing block takes two lines from a paragraph that already spans a page), display: none until the
  sheet's layout shows them and sets their heights; empty, out of the reading order, and never printed.
*/
function BreakFloats() {
  return (
    <>
      <span aria-hidden="true" className="float-left hidden w-0" data-break-float="hold" data-print-hide="true" />
      <span aria-hidden="true" className="float-left clear-left hidden w-full" data-break-float="gap" data-print-hide="true" />
      <span aria-hidden="true" className="float-left clear-left hidden w-0" data-break-float="hold" data-print-hide="true" />
      <span aria-hidden="true" className="float-left clear-left hidden w-full" data-break-float="gap" data-print-hide="true" />
    </>
  );
}

/*
  A bracketed placeholder the letter leaves for the person ("[Your name]")
  becomes a gold-wash field marked "Fill in"; in print it is the bracket text
  again, so nothing prints as a label.
*/
const PLACEHOLDER = /\[([^\]\n]{1,40})\]/g;

function withFields(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(PLACEHOLDER)) {
    const at = m.index ?? 0;
    if (at > last) parts.push(text.slice(last, at));
    parts.push(
      <span key={at} className="box-decoration-clone border-b-2 border-gold bg-gold-wash px-1 print:border-0 print:bg-transparent print:px-0" data-fill-in={m[1]}>
        <span className="mr-1.5 text-[14px] font-semibold print:hidden">Fill in</span>
        <span className="sr-only">: </span>
        <span className="print:hidden">{m[1]}</span>
        <span className="hidden print:inline">[{m[1]}]</span>
      </span>,
    );
    last = at + m[0].length;
  }
  if (parts.length === 0) return text;
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/*
  One paragraph of the sheet and, right after it in the DOM, its margin notes
  (absolute, placed by the sheet's layout). Each claim sentence ends in its
  footnote number, which opens the note's expanded quote.
*/
function SheetParagraph({
  sentences,
  index,
  groups,
  noteBase,
  openNote,
  onToggleNote,
  onOpenPage,
}: {
  sentences: LetterSentence[];
  index: number;
  groups: NoteGroup[];
  noteBase: string;
  openNote: number | null;
  onToggleNote: (n: number) => void;
  onOpenPage: () => void;
}) {
  return (
    <>
      <div className="mb-5" data-block={`p${index}`} data-paragraph={index}>
        <p className="text-[18px] leading-[1.6]">
          <BreakFloats />
          {sentences.map((s, i) => {
            const struck = sentenceStruck(s);
            const note = noteFor(groups, s);
            return (
              <span key={i} data-sentence={struck ? "struck" : s.claim ? "claim" : "plain"}>
                {i > 0 ? " " : ""}
                {struck ? (
                  <>
                    <s className="decoration-ink decoration-2">{s.text}</s> <CouldNotVerifyTag inline />
                  </>
                ) : (
                  withFields(s.text)
                )}
                {note ? (
                  <FootnoteRef
                    n={note.n}
                    label={`${shortDocName(note.citations[0])}, ${pageFolio(note.citations[0])}`}
                    open={openNote === note.n}
                    controls={noteRegionId(noteBase, note.n)}
                    onToggle={() => onToggleNote(note.n)}
                  />
                ) : null}
                {!struck && s.claim && s.verified && s.citation ? (
                  <span className="hidden print:inline">
                    {" "}
                    [cite: {citationLabel(s.citation)}, p. {s.citation.page}]
                  </span>
                ) : null}
              </span>
            );
          })}
        </p>
      </div>
      {groups.length > 0 ? (
        <ul aria-label={`Citations for paragraph ${index + 1}`} className={`${MARGIN_BLOCK} space-y-5`} data-margin-anchor={`p${index}`} data-margin={index} data-print-hide="true">
          {groups.map((g) => (
            <MarginNote
              key={g.n}
              group={g}
              noteBase={noteBase}
              open={openNote === g.n}
              onClose={() => onToggleNote(g.n)}
              onOpenPage={onOpenPage}
            />
          ))}
        </ul>
      ) : null}
    </>
  );
}

/*
  The letter block: a bond sheet with a 1 px ink edge, To and Re, the
  salutation, the paragraphs, the closing word and the name. The final letter
  on the phone and the read-only first draft share it, so they read alike. The
  final letter is complete (Oct 31, N8): the date line at its top, as the
  desktop sheet's, and the fields to sign with under the sign-off, in two
  columns inside the frame's inset.
*/
const FRAME_TEXT = "text-[18px] leading-[1.9] lg:text-[17px]";

export function LetterFrame({
  to,
  re,
  paragraphs,
  label,
  kind,
  id,
  today = null,
}: {
  to: string;
  re: string;
  paragraphs: Paragraph[];
  label: string;
  kind: "final" | "draft";
  id?: string;
  /* The date line at the top (the final letter only). */
  today?: Date | null;
}) {
  const parts = letterParts(paragraphs);
  const final = kind === "final";
  const dateLine = final ? letterDate(today) : null;
  return (
    <article
      id={id}
      aria-label={label}
      className="border border-ink bg-bond px-4 py-5 sm:px-7 sm:py-7"
      data-letter={kind === "final" ? "true" : undefined}
      data-draft={kind === "draft" ? "true" : undefined}
      /* Printing from a narrow window (or the browser's print layout, narrower than 1,024 px) prints this letter alone too. */
      data-print-sheet={kind === "final" ? "true" : undefined}
    >
      {dateLine ? (
        <p className="mb-4 text-[17px] leading-snug tabular-nums" data-letter-date="true">
          {dateLine}
        </p>
      ) : null}
      <dl className="space-y-1 border-b border-hairline pb-4 text-[17px] leading-snug">
        <div className="flex gap-2">
          <dt className="shrink-0 font-bold">To:</dt>
          <dd>{to}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 font-bold">Re:</dt>
          <dd>{re}</dd>
        </div>
      </dl>
      <div className="mt-4 space-y-5">
        {parts.salutation ? (
          <p className={FRAME_TEXT} data-letter-salutation="true">
            {parts.salutation}
          </p>
        ) : null}
        {parts.paragraphs.map((p, i) => (
          <LetterParagraph key={i} sentences={p.sentences ?? []} index={i} />
        ))}
        {parts.closing || final ? (
          <div className={parts.closing ? "" : "pt-3"} data-signature={final ? "true" : undefined}>
            <SignOff closing={parts.closing} askName={askName(paragraphs)} text={FRAME_TEXT} fill={final} fields={final} />
          </div>
        ) : null}
      </div>
    </article>
  );
}

function LetterParagraph({ sentences, index }: { sentences: LetterSentence[]; index: number }) {
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  const base = useId();
  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div data-paragraph={index}>
      <p className="text-[18px] leading-[1.9] lg:text-[17px]">
        {sentences.map((s, i) => {
          const struck = sentenceStruck(s);
          const chip = !struck && s.claim && s.citation ? s.citation : null;
          return (
            <span key={i} data-sentence={struck ? "struck" : s.claim ? "claim" : "plain"}>
              {i > 0 ? " " : ""}
              {struck ? (
                <>
                  <s className="decoration-ink decoration-2">{s.text}</s> <CouldNotVerifyTag inline />
                </>
              ) : (
                s.text
              )}
              {chip ? (
                <>
                  {" "}
                  <span className="print:hidden">
                    <InlineChip citation={chip} open={open.has(i)} controls={`${base}-q${i}`} onToggle={() => toggle(i)} />
                  </span>
                  <span className="hidden print:inline">
                    [cite: {citationLabel(chip)}, p. {chip.page}]
                  </span>
                </>
              ) : null}
            </span>
          );
        })}
      </p>
      {sentences.map((s, i) =>
        open.has(i) && s.citation && !sentenceStruck(s) ? (
          <div key={i} className="print:hidden">
            <QuoteFigure id={`${base}-q${i}`} citation={s.citation} />
          </div>
        ) : null,
      )}
    </div>
  );
}

/*
  A small reference inside a line of text: a short document name and page on
  a paper tint, no box, so the line keeps its rhythm; a transparent extension
  makes the hit area 44px tall.
*/
export function InlineChip(props: { citation: CitationRef; open: boolean; controls: string; onToggle: () => void }) {
  return <InlineReferenceChip {...props} />;
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall back below */
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}
