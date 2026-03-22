# Risk Register MVP - Web

## Scope

This register tracks key product and engineering risks for the backend-first web MVP of Learn.Aibot.KZ.

## Risk Table

| ID | Risk | Type | Probability | Impact | Mitigation | Owner |
|---|---|---|---|---|---|---|
| R1 | Scope expands beyond MVP boundaries | Product | High | High | Freeze scope by milestone gates and enforce out-of-scope policy | Product Lead |
| R2 | Progress tracking becomes inconsistent under retries | Technical | Medium | High | Use idempotent upsert endpoint, DB unique constraints, integration tests | Backend Lead |
| R3 | Instructor content quality is uneven | Product | Medium | High | Add publish checklist and admin moderation workflow | Content Ops |
| R4 | Auth and RBAC misconfiguration exposes protected routes | Security | Medium | Critical | Centralized guards, route-level tests, security checklist in CI | Backend Lead |
| R5 | Performance degradation on course catalog and progress queries | Technical | Medium | High | Index design, query profiling, cache hot read paths | Backend + DevOps |
| R6 | Limited observability delays incident response | Operations | Medium | Medium | Request IDs, structured logs, basic dashboards and alerts | DevOps |
| R7 | Video links expire incorrectly or leak assets | Security/Technical | Low | High | Signed URLs with TTL policy and access checks before issuance | Backend Lead |
| R8 | Instructor workflow blocked by poor UX/API gaps | Delivery | Medium | Medium | Early API contract reviews with frontend, weekly integration sessions | Engineering Manager |

## Escalation Rules

- **Critical risks** (impact = Critical): immediate triage within same day.
- **High risks:** mitigation task added to current sprint.
- **Medium risks:** tracked with owner and due date in next sprint planning.

## Review Cadence

- Weekly risk review during delivery sync.
- Re-score probability/impact at each phase gate:
  - end of Foundation;
  - end of Learning Core;
  - pre-staging launch.

## Current Focus Risks (MVP start)

- `R1` Scope control
- `R2` Progress consistency
- `R4` Auth/RBAC correctness
- `R5` Read-path performance
