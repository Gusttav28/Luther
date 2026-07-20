# Luther agent map

Luther is a personal finance application (income, expenses, savings, balance, category plans, and purchase projects), initially modeled after the owner's Excel workbook.

## Sources of truth

- Work tracker: `specs/` folders in this repository. Each governed work item lives at `specs/<work-slug>/` with `requirements.md`, `design.md`, and `tasks.md`. There is no external tracker.
- Git platform: this GitHub repository (`main` branch, feature branches per work item).
- Repository documentation: `README.md`, `specs/`, `progress/`, `reviews/`.
- Engineering harness: this file plus `.agents/*.md`.

Do not make a substantive project change unless the governed work item exists under `specs/`, has a human-approved spec, and is in the phase required by its role contract.

## Agent roles

| Role | Contract | Authority |
| --- | --- | --- |
| Leader | `.agents/leader.md` | Orchestrates work. Never implements or approves it. |
| Spec Author | `.agents/spec-author.md` | Defines requirements, design, tasks, risks, and traceability. |
| Implementer | `.agents/implementer.md` | Implements only a human-approved specification. |
| Reviewer | `.agents/reviewer.md` | Independently verifies implementation and emits a verdict. |

## Lifecycle

`Backlog -> Specification -> Human Approval -> Implementation -> Review -> Human Completion`

Only the human owner (Gustavo) approves the transition from specification to implementation and from approved review to completion.

## Hard boundaries

- No implementation without a human-approved spec package.
- One governed work item per implementation chain.
- Implementer and Reviewer must be different agents.
- Financial data is sensitive: require explicit security requirements, minimum-necessary access, and no secrets committed to the repository.
- New dependencies require explicit approval in the spec.

## Stop conditions

Stop and ask the human owner when: no governed work item exists, required approval is missing, scope is ambiguous, source data (e.g., the reference Excel workbook) is missing, or a role would need another role's authority.

## Mandatory entrypoint

Begin as the Leader. Load additional context progressively and only when the active governed work requires it.
