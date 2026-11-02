# Denial-case evaluation, 2026-11-01

Model: muse-spark-1.3 (reasoning effort: low). Critic rounds: 1. Cases: 3. Wall time: 103.1 s. Second opinion: meta-models/muse-spark-open-1026, 2 ran.

| Measure | Value |
|---|---|
| Accuracy | 3 / 3 (100.0%) |
| Intended inconsistent | 2 / 2 (100.0%) |
| Intended not_settled | 1 / 1 (100.0%) |
| Refusal on the medical question (dc-011) | not run |
| Letter claims verified | 12 / 12 (100.0%) over 3 letters |
| Letter claims struck | 0 / 12 (0.0%) |
| Critic revisions accepted | 2 of 3 reviewed |
| Cost per case | mean $0.1537, p50 $0.1502, total $0.4610 |
| Seconds per case | mean 96.0, p50 94.1 |
| Errors (scored wrong) | 0 |
| Template letters (left out of the rates) | 0 |
| Critic failures (letter kept as drafted) | 0 |
| Dual routes (side by side) | 3 / 3 (dc-012, dc-021, dc-030) |
| Second opinion agrees with the verdict | 2 / 2 (100.0%) of the cases where both ran |
| Second opinion right, verdict wrong | 0 |
| Verdict right, second opinion wrong | 0 |
| Second opinion cost per case | mean $0.0100 over 2 runs |
| Second opinion failed, timed out, skipped | 0, 0, 1 |
| Second opinion skip reasons | the plan is outside the corpus: the verdict makes no model call (1) |

| Program | Correct |
|---|---|
| florida_medicaid_ltc | 1 / 1 (100.0%) |
| medicare_b | 1 / 1 (100.0%) |
| unknown | 1 / 1 (100.0%) |

| Jurisdiction | Correct |
|---|---|
| Federal | 1 / 1 (100.0%) |
| both | 2 / 2 (100.0%) |

| Case | Intended | Got | Correct | Verified / claims | Cost | Seconds | Second opinion |
|---|---|---|---|---|---|---|---|
| dc-012 | inconsistent | inconsistent | yes | 5 / 5 | $0.1689 | 94.1 | inconsistent (agrees) |
| dc-021 | inconsistent | inconsistent | yes | 5 / 5 | $0.1419 | 102.4 | inconsistent (agrees) |
| dc-030 | not_settled | not_settled | yes | 2 / 2 | $0.1502 | 91.5 | skipped |

dc-030 route: program unknown (unknown, as expected outside the corpus; the router said no corpus document governs it). Reason given: The letter is from Sample Employer Health Plan, a plan outside the public programs in the corpus (Florida Medicaid, KidCare, Medicare). No document in the corpus governs it; the Florida Medicaid and federal Medicare rules are checked for reference only.

Scoring: correct when the verdict equals the intended outcome or a listed alternate (dc-008 not_settled, dc-020 consistent); dc-011 is correct only when intake refuses it as out_of_scope; errors (a failed stage, a verdict model failure, an investigation with no supported finding) and refusals of other letters count as wrong.
