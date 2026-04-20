# Architecture Decision Records (ADR)

This document explains the main technical decisions made while building the Social marketplace. It focuses on what was chosen, why it was chosen, and the pros and cons.

---

## 1. UI Styling & Component Approach (Brutalist Design)

**Context:**  
The UI design changed from a soft, normal look to a bold "brutalist" style.  
This style uses:
- Thin black borders (1px)
- Strong colors (orange, fuchsia, green)
- Sharp edges (no rounded corners)
- Hard shadows instead of soft blur effects

---

**Options Considered:**

1. **React / Next.js with styled-components**  
   Rebuild everything using React and advanced styling tools.

2. **CSS Modules / SCSS**  
   Use separate CSS files for reusable styles.

3. **Lit + Tailwind CSS (inline)**  
   Keep using Lit components and style directly using Tailwind classes.

---

**Decision:**  
We chose **Lit + Tailwind CSS (inline styling)**.

---

**Pros:**
- Faster to build (no full rewrite needed)
- No extra libraries added
- Styles are written close to the HTML (easy to track)

**Cons:**
- Code becomes long and messy (too many classes in one line)
- Hard to update styles globally (no central style file)

---

## 2. Client-Side State Management

**Context:**  
The app needs to manage:
- User login state
- Marketplace items
- Chat messages
- Checkout sessions  

All without refreshing the page.

---

**Options Considered:**

1. **Global State (Redux / MobX)**  
   One central store for all app data.

2. **Props + Events (Native approach)**  
   Pass data down through components and send events up.

---

**Decision:**  
We chose **Props + Event Bubbling**.

---

**Pros:**
- Simple and easy to understand
- Uses built-in browser features (CustomEvent)
- No extra complexity

**Cons:**
- Data has to be passed through many components (prop drilling)
- Some actions require re-fetching data from the server (less efficient)

---

## 3. Data Storage (Backend)

**Context:**  
The backend needs to store:
- Users
- Items
- Chats
- Transactions  

But setting up a full database felt too heavy for early development.

---

**Options Considered:**

1. **Real Database (MongoDB / Postgres)**  
   Proper production-ready setup.

2. **In-Memory Storage**  
   Store everything in arrays (lost on server restart).

3. **Local JSON Files (fs module)**  
   Save data in files on the server.

---

**Decision:**  
We chose **Local JSON file storage using `fs`**, stored in `server/data/`.

We also used:
- `.gitignore` → to ignore actual data
- `.gitkeep` → to keep the folder in Git

---

**Pros:**
- Very fast to set up
- No database needed
- Data stays even after server restarts

**Cons:**
- Not safe for production
- Can break if multiple users write at the same time (no locking system)
- Doesn’t scale well

---