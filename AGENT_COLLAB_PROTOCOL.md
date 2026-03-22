# Agent Collaboration Protocol (Web MVP)

Version: 1.0  
Date: 2026-03-21  
Applies to: `frontend`, `backend`, integration and release workflow

## 1) Purpose

This protocol ensures multiple technical agents work in parallel without conflicts, while actively helping each other through clear contracts, staged handoffs, and strict ownership boundaries.

## 2) Agent Roles and Ownership

### PM / Integration Agent
- Owns scope, milestones, priorities, blockers, and final integration gates.
- Maintains `Execution Board - Web MVP.md`.
- Runs cross-stream readiness checks and release decision.

### Backend Agent
- Owns `backend/**` implementation and backend tests.
- Owns API contracts for endpoint behavior.
- Must publish request/response examples and error envelopes.

### Frontend Agent
- Owns `frontend/**` implementation and frontend checks.
- Integrates only against published backend contracts.
- Must report contract mismatches immediately.

## 3) Non-Interference Rules (Hard Constraints)

1. **Single ownership per area**
   - Backend agent cannot edit `frontend/**`.
   - Frontend agent cannot edit `backend/**`.
   - PM agent does not implement domain logic unless explicitly reassigned.

2. **No shared file edits without lock**
   - If two agents need the same file, one acquires lock, the other waits.
   - Lock owner must finish quickly and release explicitly.

3. **No silent contract changes**
   - API shape changes require a contract update and notification in status report.
   - Frontend must not guess changed payloads.

4. **No hidden blockers**
   - Any blocker older than 30 minutes must be escalated to PM agent.

## 4) File Lock Protocol

Lock states:
- `LOCKED_BY_BACKEND`
- `LOCKED_BY_FRONTEND`
- `LOCKED_BY_PM`
- `UNLOCKED`

Lock rules:
1. Announce lock in status update with file path and expected duration.
2. Keep lock duration minimal (target <= 45 minutes).
3. Release lock with a completion update.
4. If lock exceeds ETA by > 15 minutes, send revised ETA.

Recommended lock note format:
- `LOCK: <path> | owner: <agent> | eta: <minutes> | reason: <task>`

## 5) Development Stages (Parallel but Synchronized)

### Stage 0 - Planning
- PM defines milestone scope, acceptance criteria, and dependencies.
- Output: task list split by owner.

### Stage 1 - Contract Freeze
- Backend publishes endpoint contract draft.
- Frontend validates feasibility and asks clarifications.
- Output: frozen contract for current milestone.

### Stage 2 - Parallel Build
- Backend implements endpoints and tests.
- Frontend implements UI flow using frozen contract.
- Output: both streams pass local quality gates.

### Stage 3 - Handoff and Integration
- Backend provides sample data and test credentials.
- Frontend runs live integration against backend.
- Output: integrated happy-path flow.

### Stage 4 - Verification and Sign-off
- PM runs integration checklist and release gate.
- Output: milestone accepted or returned with defects.

## 6) Mandatory Status Update Format

Each agent reports with this template:

1. **Done**
2. **In progress**
3. **Blocked**
4. **Needs from other agent**
5. **Next 1-2 steps**
6. **ETA**

Example:
- Done: Implemented `POST /auth/login` + tests.
- In progress: `POST /auth/refresh`.
- Blocked: none.
- Needs from other agent: frontend needs final refresh response schema.
- Next: finish refresh; publish examples.
- ETA: 40 min.

## 7) Help-First Collaboration Rules

To actively help (not only avoid conflict):
1. Backend always shares realistic response examples and edge cases.
2. Frontend reports unclear/fragile API points with concrete reproduction steps.
3. PM resolves priority conflicts and re-sequences tasks quickly.
4. Any agent can propose improvements, but owner decides implementation.
5. Feedback must be actionable: include path, expected behavior, actual behavior.

## 8) Contract Change Procedure

When backend needs to change API:
1. Mark change type: `compatible` or `breaking`.
2. Update contract source (`API Surface v1 - Web MVP.md` or a dedicated changelog).
3. Notify frontend in status update.
4. For breaking changes, provide migration note and deadline.
5. PM confirms impact and adjusts milestone plan.

## 9) Quality Gates by Stream

### Backend gate
- `npm run lint`
- `npm run build`
- `npm run test`
- `npm run test:e2e` (for milestone sign-off)

### Frontend gate
- `npm run lint`
- `npm run build`

### Integration smoke gate
- register
- login
- load courses
- enroll in a course
- open lesson
- update progress

## 10) Escalation and Conflict Resolution

Escalate to PM immediately if:
- API disagreement lasts > 20 minutes.
- Critical blocker has no owner.
- Two agents claim same file ownership.
- Milestone ETA slips by > 1 day.

Resolution policy:
1. PM decides priority and owner.
2. Contract source of truth wins over assumptions.
3. Short-term workaround allowed only with explicit TODO and deadline.

## 11) Definition of Done (Milestone Level)

A milestone is done only when:
1. Backend and frontend quality gates pass.
2. Integration smoke flow passes end-to-end.
3. No unresolved critical blockers.
4. Contracts and board are updated.
5. PM signs off.

## 12) Working Agreement

- Optimize for throughput, not local perfection.
- Prefer small, frequent handoffs over large delayed drops.
- Make dependencies explicit early.
- Communicate risks before they become blockers.

