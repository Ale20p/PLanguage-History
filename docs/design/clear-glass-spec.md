# Design Specification: "Clear Glass" Theme

This document defines the "Clear Glass" design system, UI guidelines, and styling tokens for the Programming Language Genealogy & Evolution platform. The visual aesthetic is a literal see-through interface: highly interactive, completely transparent, lightweight, and modern.

---

## 1. Design Concept & Philosophy

The "Clear Glass" aesthetic relies on layers, depth, light, and motion without frosted effects. 
* **Depth:** Use multiple completely transparent layers with drop shadows to establish visual hierarchy. Avoid any `backdrop-blur` completely.
* **Light:** Emulate light refraction using thin, semi-transparent white borders (`border-white/10`) to simulate the edges of glass plates.
* **Vibrancy:** Introduce subtle colored backdrops (blobs) behind the glass panels to create soft, colorful refractions.
* **Motion:** Interaction should feel natural and fluid, using spring-based physics instead of linear easing curves.

---

## 2. Color Palette & Typography

### 2.1 Base Theme (Sleek Dark Mode)
The interface is designed primarily as a premium dark theme to highlight the glowing connections of the force-directed graph.

* **Background Base:** Space Gray / Deep Blue-Gray
  * Primary: `#0A0E17` (Deep Space)
  * Card/Panel Base: `rgba(15, 23, 42, 0.45)` (Slate 900 with 45% opacity)
* **Glass Border:** `rgba(255, 255, 255, 0.08)` (Soft white shine)
* **Typography:** 
  * Main: `rgba(243, 244, 246, 1)` (Gray 100)
  * Secondary / Muted: `rgba(156, 163, 175, 1)` (Gray 400)

### 2.2 Paradigm Accent Colors
To help users categorize languages visually in the force-directed graph, nodes and links are accented based on programming paradigms:

| Paradigm | Accent Color | Hex Code | Glow/Refraction Style |
| :--- | :--- | :--- | :--- |
| **Object-Oriented** | Emerald Green | `#10B981` | `shadow-emerald-500/20` |
| **Functional** | Cyber Purple | `#8B5CF6` | `shadow-violet-500/20` |
| **Procedural/Imperative**| Electric Blue | `#3B82F6` | `shadow-blue-500/20` |
| **Multi-Paradigm** | Solar Orange | `#F59E0B` | `shadow-amber-500/20` |
| **System/Low-Level** | Crimson Red | `#EF4444` | `shadow-red-500/20` |

---

## 3. Tailwind CSS Configurations

To implement the Clear Glass theme, apply the following Tailwind configuration and custom utility classes.

### 3.1 Class Combinations
* **Standard Glass Panel:**
  ```html
  <div class="bg-transparent border border-white/10 shadow-2xl rounded-2xl">
    <!-- Panel Content -->
  </div>
  ```
* **High-Contrast Glass Panel (for Modals):**
  ```html
  <div class="bg-transparent border border-white/15 shadow-2xl rounded-3xl">
    <!-- Modal Content -->
  </div>
  ```

---

## 4. UI Component Specifications

### 4.1 Search Bar
* **Aesthetic:** Capsule shape (`rounded-full`), semi-transparent input background, active glow.
* **States:**
  * Idle: `bg-white/5 border border-white/10 text-gray-300`
  * Focus: `bg-white/10 border-indigo-500/50 ring-2 ring-indigo-500/20 text-white`
  * Micro-interaction: Smooth transition duration of `150ms`.

### 4.2 Interactive Language Modals
* **Layout:** Centered pop-up, split layout:
  * **Left Pane (40%):** Static language details (Name, Creators, Paradigm tags, Release Date, Website link).
  * **Right Pane (60%):** Rich content (Markdown description and a syntax-highlighted code snippet box).
* **Backdrop Overlay:** Full-screen overlay `bg-black/80` without any blur.

---

## 5. Animation & Motion Spec (Framer Motion)

Animations are driven by spring-based configurations to simulate physical weight and bounce.

### 5.1 Modal In/Out (Spring Physics)
```javascript
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 25 
    } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 15,
    transition: { 
      duration: 0.2, 
      ease: "easeInOut" 
    } 
  }
};
```

### 5.2 Hover States (Nodes & Cards)
* **Scale-up effect:** Scaling interactive items by `1.03x` on hover with a smooth layout transition.
* **Glow Intensification:** Hovering over glass elements smoothly transition shadows from `shadow-black/50` to `shadow-[accent-color]/30`.
