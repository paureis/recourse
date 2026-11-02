# Denial-case evaluation, 2026-11-01

Model: muse-spark-1.3 (reasoning effort: low). Critic rounds: 1. Cases: 2. Wall time: 65.7 s. Second opinion: meta-models/muse-spark-open-1026, 2 ran.

| Measure | Value |
|---|---|
| Accuracy | 2 / 2 (100.0%) |
| Intended consistent | 1 / 1 (100.0%) |
| Intended inconsistent | 1 / 1 (100.0%) |
| Refusal on the medical question (dc-011) | not run |
| Letter claims verified | 3 / 3 (100.0%) over 1 letters |
| Letter claims struck | 0 / 3 (0.0%) |
| Critic revisions accepted | 1 of 1 reviewed |
| Cost per case | mean $0.0835, p50 $0.0835, total $0.1669 |
| Seconds per case | mean 51.6, p50 51.6 |
| Errors (scored wrong) | 0 |
| Template letters (left out of the rates) | 0 |
| Critic failures (letter kept as drafted) | 0 |
| Dual routes (side by side) | 0 |
| Second opinion agrees with the verdict | 2 / 2 (100.0%) of the cases where both ran |
| Second opinion right, verdict wrong | 0 |
| Verdict right, second opinion wrong | 0 |
| Second opinion cost per case | mean $0.0068 over 2 runs |
| Second opinion failed, timed out, skipped | 0, 0, 0 |

| Program | Correct |
|---|---|
| florida_medicaid_mma | 1 / 1 (100.0%) |
| medicare_part_d | 1 / 1 (100.0%) |

| Jurisdiction | Correct |
|---|---|
| Federal | 1 / 1 (100.0%) |
| Florida | 1 / 1 (100.0%) |

| Case | Intended | Got | Correct | Verified / claims | Cost | Seconds | Second opinion |
|---|---|---|---|---|---|---|---|
| dc-003 | consistent | consistent | yes | n/a | $0.0662 | 37.9 | consistent (agrees) |
| dc-027 | inconsistent | inconsistent | yes | 3 / 3 | $0.1007 | 65.3 | inconsistent (agrees) |

Scoring: correct when the verdict equals the intended outcome or a listed alternate (dc-008 not_settled, dc-020 consistent); dc-011 is correct only when intake refuses it as out_of_scope; errors (a failed stage, a verdict model failure, an investigation with no supported finding) and refusals of other letters count as wrong.
