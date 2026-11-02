# Denial-case evaluation, 2026-11-01

Model: muse-spark-1.3 (reasoning effort: low). Critic rounds: 1. Cases: 30. Wall time: 504.6 s. Second opinion: meta-models/muse-spark-open-1026, 28 ran.

| Measure | Value |
|---|---|
| Accuracy | 25 / 30 (83.3%) |
| Intended consistent | 8 / 10 (80.0%) |
| Intended inconsistent | 12 / 13 (92.3%) |
| Intended not_settled | 4 / 6 (66.7%) |
| Intended out_of_scope | 1 / 1 (100.0%) |
| Refusal on the medical question (dc-011) | correct |
| Letter claims verified | 78 / 78 (100.0%) over 20 letters |
| Letter claims struck | 0 / 78 (0.0%) |
| Critic revisions accepted | 13 of 20 reviewed |
| Cost per case | mean $0.0956, p50 $0.0982, total $2.8678 |
| Seconds per case | mean 46.8, p50 52.8 |
| Errors (scored wrong) | 0 |
| Template letters (left out of the rates) | 0 |
| Critic failures (letter kept as drafted) | 0 |
| Dual routes (side by side) | 4 / 4 (dc-005, dc-012, dc-021, dc-030) |
| Second opinion agrees with the verdict | 25 / 28 (89.3%) of the cases where both ran |
| Second opinion right, verdict wrong | 2 (dc-009, dc-027) |
| Verdict right, second opinion wrong | 0 |
| Second opinion cost per case | mean $0.0081 over 28 runs |
| Second opinion failed, timed out, skipped | 0, 0, 2 |
| Second opinion skip reasons | the chain did not reach the verdict (1); the plan is outside the corpus: the verdict makes no model call (1) |

| Program | Correct |
|---|---|
| florida_kidcare | 2 / 3 (66.7%) |
| florida_medicaid_ltc | 3 / 3 (100.0%) |
| florida_medicaid_mma | 8 / 11 (72.7%) |
| medicare_a | 2 / 2 (100.0%) |
| medicare_advantage | 3 / 3 (100.0%) |
| medicare_b | 4 / 4 (100.0%) |
| medicare_part_d | 2 / 3 (66.7%) |
| unknown | 1 / 1 (100.0%) |

| Jurisdiction | Correct |
|---|---|
| Federal | 11 / 12 (91.7%) |
| Florida | 12 / 16 (75.0%) |
| both | 2 / 2 (100.0%) |

| Case | Intended | Got | Correct | Verified / claims | Cost | Seconds | Second opinion |
|---|---|---|---|---|---|---|---|
| dc-001 | inconsistent | inconsistent | yes | 4 / 4 | $0.0963 | 58.2 | inconsistent (agrees) |
| dc-002 | consistent | inconsistent | no | 5 / 5 | $0.0985 | 64.1 | inconsistent (agrees) |
| dc-003 | consistent | not_settled | no | 3 / 3 | $0.1039 | 69.5 | inconsistent (disagrees) |
| dc-004 | consistent | consistent | yes | n/a | $0.0751 | 28.0 | consistent (agrees) |
| dc-005 | consistent | consistent | yes | n/a | $0.1199 | 43.7 | consistent (agrees) |
| dc-006 | consistent | consistent | yes | n/a | $0.0681 | 28.6 | consistent (agrees) |
| dc-007 | inconsistent | inconsistent | yes | 4 / 4 | $0.1071 | 52.7 | inconsistent (agrees) |
| dc-008 | inconsistent | inconsistent | yes | 4 / 4 | $0.1060 | 58.7 | inconsistent (agrees) |
| dc-009 | not_settled | consistent | no | n/a | $0.0815 | 37.1 | not_settled (disagrees) |
| dc-010 | not_settled | not_settled | yes | 4 / 4 | $0.1115 | 60.3 | not_settled (agrees) |
| dc-011 | out_of_scope | refused (out_of_scope) | yes | n/a | $0.0000 | 0.0 | skipped |
| dc-012 | inconsistent | inconsistent | yes | 6 / 6 | $0.1409 | 57.0 | inconsistent (agrees) |
| dc-013 | inconsistent | inconsistent | yes | 5 / 5 | $0.1185 | 59.1 | inconsistent (agrees) |
| dc-014 | not_settled | not_settled | yes | 5 / 5 | $0.0980 | 55.5 | not_settled (agrees) |
| dc-015 | inconsistent | inconsistent | yes | 3 / 3 | $0.0867 | 56.6 | inconsistent (agrees) |
| dc-016 | consistent | consistent | yes | n/a | $0.0682 | 26.3 | consistent (agrees) |
| dc-017 | not_settled | inconsistent | no | 5 / 5 | $0.0984 | 52.8 | inconsistent (agrees) |
| dc-018 | inconsistent | inconsistent | yes | 4 / 4 | $0.1220 | 54.5 | inconsistent (agrees) |
| dc-019 | consistent | consistent | yes | n/a | $0.0629 | 28.8 | consistent (agrees) |
| dc-020 | not_settled | not_settled | yes | 3 / 3 | $0.1059 | 52.0 | not_settled (agrees) |
| dc-021 | inconsistent | inconsistent | yes | 6 / 6 | $0.1445 | 56.7 | inconsistent (agrees) |
| dc-022 | inconsistent | inconsistent | yes | 3 / 3 | $0.0892 | 55.6 | inconsistent (agrees) |
| dc-023 | inconsistent | inconsistent | yes | 5 / 5 | $0.0947 | 56.2 | inconsistent (agrees) |
| dc-024 | consistent | consistent | yes | n/a | $0.0649 | 28.6 | consistent (agrees) |
| dc-025 | consistent | consistent | yes | n/a | $0.0710 | 25.4 | consistent (agrees) |
| dc-026 | inconsistent | inconsistent | yes | 3 / 3 | $0.0966 | 47.9 | inconsistent (agrees) |
| dc-027 | inconsistent | not_settled | no | 2 / 2 | $0.1169 | 61.1 | inconsistent (disagrees) |
| dc-028 | inconsistent | inconsistent | yes | 4 / 4 | $0.1227 | 48.8 | inconsistent (agrees) |
| dc-029 | consistent | consistent | yes | n/a | $0.0736 | 31.8 | consistent (agrees) |
| dc-030 | not_settled | not_settled | yes | 0 / 0 | $0.1241 | 48.4 | skipped |

Wrong cases:

- dc-002: intended consistent, got inconsistent
- dc-003: intended consistent, got not_settled
- dc-009: intended not_settled, got consistent
- dc-017: intended not_settled, got inconsistent
- dc-027: intended inconsistent, got not_settled

Misses by stage (the stage each wrong case traces to; rule in policyqa/case_evals.py, miss_stage):

| Case | Intended | Got | Stage | Why |
|---|---|---|---|---|
| dc-002 | consistent | inconsistent | retrieval | no question's passages reached the hinge page fl-04 p4 (5 questions planned, plan from the model) |
| dc-003 | consistent | not_settled | verdict | the hinge page fl-03 p7 was quoted (f2); the model proposed not_settled, decisive fact "Whether any Medicaid or plan rule requires at least an hour between same-day intermittent home health visits and bars a second visit that starts 40 minutes after the first ended" (outside_documents); exceptions: f4 unchecked |
| dc-009 | not_settled | consistent | verdict | the hinge page fl-10 p5 was quoted (f1, f3, f4, f5); the model proposed consistent, decisive fact "The request was for 300 test strips for one month" (letter); exceptions: f5 unchecked |
| dc-017 | not_settled | inconsistent | verdict | the hinge page fl-27 p31 was quoted (f1, f2, f3); the model proposed inconsistent, decisive fact "The prescription said "dispense as written"" (letter); exceptions: f3 unchecked |
| dc-027 | inconsistent | not_settled | verdict | the hinge page fed-10 p41 was quoted (f3, f4); the model proposed not_settled, decisive fact "whether the September 10 fill was within the first 90 days of coverage under the new plan" (outside_documents); exceptions: f3 unchecked, f4 unchecked |

dc-030 route: program unknown (unknown, as expected outside the corpus; the router said no corpus document governs it). Reason given: The letter is from Sample Employer Health Plan, a plan outside the public programs in the corpus (Florida Medicaid, KidCare, Medicare). No document in the corpus governs it; the Florida Medicaid and federal Medicare rules are checked for reference only.

Scoring: correct when the verdict equals the intended outcome or a listed alternate (dc-008 not_settled, dc-020 consistent); dc-011 is correct only when intake refuses it as out_of_scope; errors (a failed stage, a verdict model failure, an investigation with no supported finding) and refusals of other letters count as wrong.
