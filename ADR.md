# Architecture Decision Records (ADR)

This document tracks the major architectural and technical decisions made during the development and refactoring of the e-shop platform.

---

## 1. UI Refactoring Approach (Web Components + Tailwind)

**Context:** The platform's frontend needed a massive aesthetic overhaul to transition from a generic, basic marketplace into a "curated collectible showroom" providing a luxury, app-like experience (soft purple gradient accents, glassmorphism, minimal layout). 

**Options Considered:**
1. **Rewrite in React/Next.js:** Port all existing UI logic from Lit to React to take advantage of its vast component ecosystem.
2. **Refactor Existing Lit Elements:** Keep the existing Web Components built on `lit` and apply the new aesthetic purely via structural updates and Tailwind CSS.

**Decision:** We chose to **refactor the existing Lit Web Components**. 

**Tradeoffs (Pros and Cons):**
- **Pros:** 
  - Substantially faster delivery time.
  - Zero addition to the dependency payload.
  - Avoids regressions in existing routing, state logic, and API calls.
- **Cons:** 
  - Lit HTML template literals with heavy Tailwind utility classes can become visually cluttered and harder to read down the line.
  - We do not get access to pre-built React ecosystem libraries (like Radix or Framer Motion) for complex micro-animations.

---

## 2. Component Styling Strategy (Utility-First)

**Context:** Due to the complex "luxury" design (involving gradients like `bg-gradient-to-r from-purple-500 to-indigo-400`, backdrop blurs, and hover-lift micro-interactions), component stylesheets could easily become bloated.

**Options Considered:**
1. **CSS Modules / Custom CSS Classes:** Extract repeated styling into named custom CSS classes inside `index.css` (e.g. using Tailwind's `@apply` functionality).
2. **Inline Utility-First:** Maintain all styling directly on the elements via Tailwind CSS v4 utility classes.

**Decision:** We chose the **Inline Utility-First** approach.

**Tradeoffs (Pros and Cons):**
- **Pros:** 
  - Single source of truth within the component scope.
  - Easy to rapidly iterate on designs without constantly context-switching to a CSS file.
  - Eliminates "dead CSS" as class names are always strictly bound to active elements.
- **Cons:**
  - Very verbose HTML tags (e.g., buttons and cards have over 15 classes).
  - Updating a repeated style (like a primary button used inside multiple different components) requires a search-and-replace instead of updating a single CSS class.

---

## 3. Directory Version Control (Data Integrity)

**Context:** The backend server requires a dedicated `data/` directory to write operational logs or local database files. We needed to ensure that version control (`git`) completely ignores the contents of this folder without losing the folder structural tracking itself when cloning the project.

**Options Considered:**
1. **Folder-Level `.gitignore`**: Place a specific `.gitignore` file acting within the `data/` folder dictating the ignoring rules.
2. **Root Level Rules with `.gitkeep`**: Manage all rules globally inside `server/.gitignore` and simply drop a blank placeholder `.gitkeep` file into the `data/` folder.

**Decision:** We chose to use **Root Level Rules combined with a `.gitkeep` file**.

**Tradeoffs (Pros and Cons):**
- **Pros:** 
  - Retains a single source of truth for the entire server project (the main `server/.gitignore`).
  - Universally recognized standard convention for creating tracked, "empty" folders.
- **Cons:** 
  - If the `.gitkeep` file is accidentally deleted, the entire empty directory could fall out of Git tracking.
  - A slightly unintuitive syntax requirement inside `.gitignore` (`!data/.gitkeep`) to exempt the placeholder file from the global ignore rule.
