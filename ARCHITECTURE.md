# 🧠 POMODY OS — Architecture & Product Vision

## 🎯 Visión del Producto
Pomody OS no es una "todo-list". Es un **Sistema Operativo de Estudio** que centraliza:
* **Calendar:** Hub principal (Estilo Google Calendar).
* **AI Omnibar:** Creación de eventos mediante lenguaje natural (Gemini).
* **Workspace:** Cada evento es un espacio de trabajo con Pomodoro y Notas.

---

## 🏗️ Tech Stack
* **Frontend:** React + TypeScript + Vite + Tailwind CSS.
* **Backend:** Supabase (Auth, PostgreSQL, RLS).
* **AI:** Google Gemini (Edge Functions para parsing).

---

## 🗄️ Modelo de Datos (Single Source of Truth)
### Tablas Críticas:
1. **profiles:** Datos de usuario e info de Premium/Gemini Key.
2. **calendars:** Soporte multi-calendario (Personal, Facultad, etc.).
3. **events:** El núcleo. Vincula tiempo, tipo de estudio y estado de completado.

---

## 🎨 UI Principles
* **Estética:** Minimalista, Glassmorphism, bordes redondeados (`rounded-3xl`).
* **Interacción:** Sidebar por Hover, Ventanas Modales centrales desde el Dock.
* **Vibe:** "Rice" de Linux (Hyprland inspired).

---

## 🛠️ Reglas de Desarrollo (Para IAs y Devs)
1. **No Inventar:** Nunca crear campos que no existan en el esquema de Supabase.
2. **Seguridad:** Respetar RLS (`auth.uid() = user_id`) a rajatabla.
3. **Spotify:** Detectar `is_premium` para decidir entre SDK Nativo o Fallback (Deep Links).