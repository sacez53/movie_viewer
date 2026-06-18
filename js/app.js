import { currentUser, onAuthChange, loginWithEmail, registerWithEmail, loginWithGoogle, logout } from "./store/auth.js";
import { initDB, subscribeToMovies } from "./store/db.js";
import { initModal } from "./components/modal.js";
import { showToast, refreshIcons } from "./components/ui.js";
import { renderHome, renderSearch, renderSeen, renderWatchlist, renderFavorites, renderStats, attachSearchLogic } from "./router.js";

const appState = {
    movies: [],
    currentRoute: 'home'
};

// DOM Elements
const authView = document.getElementById('auth-view');
const mainLayout = document.getElementById('main-layout');
const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const googleBtn = document.getElementById('google-login-btn');
const logoutBtn = document.getElementById('logout-btn');
const toggleRegisterBtn = document.getElementById('show-register');
const userEmailSpan = document.getElementById('user-email');
const routerView = document.getElementById('router-view');
const navItems = document.querySelectorAll('.nav-item');

let isRegisterMode = false;
let unsubscribeMovies = null;

// Initialize
function init() {
    refreshIcons();
    initModal(appState);
    
    // Auth State Observer
    onAuthChange((user) => {
        if (user) {
            authView.classList.add('hidden');
            mainLayout.classList.remove('hidden');
            userEmailSpan.textContent = user.email;
            
            initDB(user);
            if (unsubscribeMovies) unsubscribeMovies();
            unsubscribeMovies = subscribeToMovies((movies) => {
                appState.movies = movies;
                navigate(appState.currentRoute); // Re-render current view with new data
            });
            
            // Default route
            navigate('home');
        } else {
            authView.classList.remove('hidden');
            mainLayout.classList.add('hidden');
            if (unsubscribeMovies) {
                unsubscribeMovies();
                unsubscribeMovies = null;
            }
            appState.movies = [];
        }
    });

    setupAuthListeners();
    setupNavigationListeners();
}

function setupAuthListeners() {
    toggleRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        isRegisterMode = !isRegisterMode;
        loginForm.querySelector('h2').textContent = isRegisterMode ? 'Inscription' : 'Connexion';
        loginForm.querySelector('button[type="submit"]').textContent = isRegisterMode ? "S'inscrire" : 'Se connecter';
        toggleRegisterBtn.textContent = isRegisterMode ? 'Se connecter' : "S'inscrire";
        loginForm.querySelector('.auth-switch').firstChild.textContent = isRegisterMode ? "Déjà un compte ? " : "Pas encore de compte ? ";
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginEmail.value;
        const password = loginPassword.value;
        
        try {
            if (isRegisterMode) {
                await registerWithEmail(email, password);
                showToast("Compte créé avec succès !");
            } else {
                await loginWithEmail(email, password);
                showToast("Connexion réussie !");
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    });

    googleBtn.addEventListener('click', async () => {
        try {
            await loginWithGoogle();
        } catch (err) {
            showToast("Erreur de connexion Google", 'error');
        }
    });

    logoutBtn.addEventListener('click', async () => {
        await logout();
        showToast("Déconnecté");
    });
}

function setupNavigationListeners() {
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const route = item.dataset.target;
            navigate(route);
            // Mobile menu close logic here if needed
        });
    });

    // Global click listener for movie cards
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.movie-card');
        if (card) {
            const id = card.dataset.id;
            const type = card.dataset.type;
            if (window.openMovieModal) {
                window.openMovieModal(id, type);
            }
        }
    });
}

function navigate(route) {
    appState.currentRoute = route;
    
    // Update nav active state
    navItems.forEach(item => {
        if (item.dataset.target === route) item.classList.add('active');
        else item.classList.remove('active');
    });

    // Render view
    let html = '';
    switch (route) {
        case 'home': html = renderHome(appState); break;
        case 'search': html = renderSearch(); break;
        case 'seen': html = renderSeen(appState); break;
        case 'watchlist': html = renderWatchlist(appState); break;
        case 'favorites': html = renderFavorites(appState); break;
        case 'stats': html = renderStats(appState); break;
        default: html = renderHome(appState);
    }
    
    routerView.innerHTML = html;
    refreshIcons();

    if (route === 'search') {
        attachSearchLogic();
    }
}

// Start app
document.addEventListener('DOMContentLoaded', init);
