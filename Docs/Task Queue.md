Worker:
PostgreSQL
     │
     ▼
Task Queue
     │
 ┌───┼────────┐
 ▼   ▼        ▼
W1   W2       W3
 │   │        │
 └── Hermes ──┘




 Task:

 {
  "id": "TASK-881",
  "type": "competitor_research",
  "entity_id": "OP-018",
  "agent": "competitor-researcher",
  "priority": 7,
  "status": "queued",
  "attempts": 0
}

State:

QUEUED
  ↓
RUNNING
  ↓
COMPLETED
  ↓
REVIEW
  ↓
ACCEPTED



Fehler:

RUNNING
   ↓
FAILED
   ↓
RETRY
   ↓
FAILED
   ↓
HUMAN_REVIEW


