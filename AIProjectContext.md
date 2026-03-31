# Pomody Studio OS — AI Project Context

## 1. Product Vision
Pomody Studio OS is a productivity web app designed as a study-focused operating system.
It combines a lockscreen-style immersive interface with productivity tools.

Main goal:
Reduce friction when studying by centralizing timer, tasks, calendar and AI planning.

---

## 2. Tech Stack

Frontend:
- React + Vite
- TailwindCSS
- Shadcn UI
- SPA (no page reloads)

Backend:
- Supabase (Database + Auth + Storage)
- Edge Functions (TypeScript/Deno)

AI:
- External LLM API for NLP parsing (Premium feature)

---

## 3. Core Modules

### Timer System
Study methods:
- Pomodoro (25/5)
- 50/10
- Deep Work (90/15)

Automatic study/break cycles.

---

### Calendar System
Inspired by Google Calendar but optimized for students.

Entities:

Event:
- fixed time events (exams, classes)

Task:
- flexible work without fixed hour

StudySession:
- automatically generated study blocks linked to tasks

---

## 4. Product Philosophy

This is NOT a generic calendar.

This is:
Google Calendar + Study Optimization System.

Timer, calendar and tasks must interact together.

---

## 5. UX Principles

- Minimal friction
- Glassmorphism UI
- Calm / lofi aesthetic
- Everything happens without page reloads

---

## 6. Premium Features

Natural language input:
Example:
"I have a physics exam on April 10"

AI must return structured JSON:
{
  title,
  date,
  type
}

Edge Functions call AI securely.

---

## 7. Architecture Rules

- Frontend never calls AI directly.
- AI calls go through Edge Functions.
- Database is source of truth.
- UI reflects DB state only.

---

## 8. Development Rules for AI Assistants

When modifying code:
- Do not rewrite entire components unnecessarily.
- Preserve visual style.
- Prefer small refactors.
- Follow existing folder structure.