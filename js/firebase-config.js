import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { CONFIG } from "./config.js";

// Initialize Firebase
const app = initializeApp(CONFIG.FIREBASE);

// Export services
export const auth = getAuth(app);
export const db = getDatabase(app);
