# E-Shop Platform (Social Marketplace)

A luxury "curated collectible showroom" marketplace designed with a premium, app-like experience. This application uses a modern UI built with Web Components and Tailwind CSS, backed by a Node.js/Express server utilizing HTTP polling.

## Project Structure

This project is organized into two main directories:
- `client`: The frontend UI application, built with [Lit](https://lit.dev/) (Web Components) and [Tailwind CSS](https://tailwindcss.com/) via Vite.
- `server`: The backend API, built with [Express.js](https://expressjs.com/) and Node.js. It stores sample data locally in a `data/` folder, generated on its first start.

---

## Getting Started

To run this project locally on your machine, you will need to start both the backend server and the frontend client in two separate terminal windows.

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ recommended)
- `npm` (comes with Node.js)

### 1. Running the Backend Server

The backend requires dependencies to be installed and runs on port `3000` by default.

1. Open your terminal and navigate to the server directory:
   ```bash
   cd server
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Start the backend development server:
   ```bash
   npm run dev
   ```
   *Note: It uses nodemon so any changes in the server they will be updated automatically.*

The server create data in the data folder for the project.

---

### 2. Running the Frontend Client

The frontend client acts as the user interface and proxies API calls to the local development backend.

1. Open a **new, separate** terminal window.
2. Navigate to the client directory:
   ```bash
   cd client
   ```
3. Install the client dependencies:
   ```bash
   npm install
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

Vite will start a local server and give you a URL (typically `http://localhost:5173`). Open that URL in your browser to view and interact with the application.

---

## Additional Information

- **Styling Architecture**: The interface is built using an inline utility-first approach with Tailwind CSS v4, which avoids separate CSS files while allowing for complex custom gradients, glassmorphism, and minimal layouts directly on Lit web components.
- **Proxy setup**: For local development, the `vite.config.js` in the `client/` directory proxies any request routed to `/api` directly to your local backend (`http://localhost:3000`), avoiding any cross-origin (CORS) issues.
- **Data Persistence**: Data on the backend is persistently logged into `.json` files inside `server/data/`. If you want to reset your DB back to the original demo sample state, shut down your server, delete the generated JSON files in `server/data/` (but keep the folder or the `.gitkeep`), and restart the server.
