---
name: emil-kowalski-design
description: Guidelines and principles for Emil Kowalski style design - focused on craft, micro-interactions, spring animations, tactile feedback, crisp typography, and refined visual detail.
---

# Emil Kowalski Design Principles

This skill provides design directives and code guidelines based on Emil Kowalski's philosophy of interface design, craft, micro-interactions, and motion design.

## Core Design Principles

### 1. Tactile & Dynamic Micro-Interactions
- **Spring Animations**: Use fluid spring transitions (`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]` or `framer-motion` spring dynamics) instead of linear transitions.
- **Active State Feedback**: Scale down slightly on press (`active:scale-[0.98]` or `active:scale-95`).
- **Focus Rings & Hover**: Subtle 1px inner/outer rings (`ring-1 ring-white/10 hover:ring-emerald-500/30 hover:border-emerald-500/40`).

### 2. High-Contrast Typography & Hierarchy
- Use precise font size scales (`text-xs` to `text-3xl`), font weights (`font-semibold`, `font-bold`, `font-extrabold`), and letter spacing (`tracking-tight`, `tracking-wider`).
- Subtitles and metadata should be clear yet secondary using controlled muted colors (`text-gray-400`, `text-slate-400`, `text-emerald-400/80`).

### 3. Glassmorphism, Subtle Gradients & Layers
- Use translucent background overlays (`backdrop-blur-md bg-white/80 dark:bg-black/60`).
- Subtle borders using 1px opacity bounds (`border border-gray-200/60 dark:border-white/10`).
- Multi-layered shadows (`shadow-sm`, `shadow-xl shadow-black/20`).

### 4. Interactive Components
- **Sonner-style Toasts**: Clean floating popups with smooth spring entrance/exit.
- **CmdK / Spotlight Search**: Keyboard accessible, instant search, grouped results.
- **Tabs & Segmented Controls**: Animated tab indicator gliding underneath active items.

### 5. University / Campus Student Appeal
- Fast, energetic, live scores indicator (blinking status, real-time feel).
- Interactive voting / reactions / social buzz badges (herd mentality, crowd hype).
- Sleek dark mode by default with vibrant accent glows (emerald, neon green, sports energetic colors).
