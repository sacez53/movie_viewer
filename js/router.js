import { searchMovies } from "./api/tmdb.js";
import { createMovieCardHTML, refreshIcons } from "./components/ui.js";

// Vues de base
export function renderHome(appState) {
    const recent = [...appState.movies].slice(0, 5);
    const html = `
        <div class="page-header">
            <div>
                <h1>Tableau de bord</h1>
                <p class="text-secondary">Bienvenue sur votre collection de films.</p>
            </div>
        </div>
        <div style="margin-bottom: var(--spacing-6);">
            <h2 style="margin-bottom: var(--spacing-4);">Ajouts récents</h2>
            ${recent.length > 0 
                ? `<div class="movie-grid">${recent.map(m => createMovieCardHTML(m, 'saved')).join('')}</div>`
                : `<div class="empty-state"><i data-lucide="film"></i><p>Votre bibliothèque est vide. Commencez par rechercher des films !</p></div>`
            }
        </div>
    `;
    return html;
}

export function renderSearch() {
    const html = `
        <div class="page-header">
            <div>
                <h1>Recherche</h1>
                <p class="text-secondary">Trouvez des films sur TMDB.</p>
            </div>
        </div>
        <div class="search-bar-container">
            <i data-lucide="search" class="search-icon"></i>
            <input type="text" id="search-input" class="search-input" placeholder="Titre du film...">
        </div>
        <div id="search-results" class="movie-grid">
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i data-lucide="search"></i>
                <p>Tapez un titre pour rechercher.</p>
            </div>
        </div>
    `;
    return html;
}

export function renderSeen(appState) {
    const seenMovies = appState.movies.filter(m => m.status === 'seen');
    const html = `
        <div class="page-header">
            <div>
                <h1>Films Vus</h1>
                <p class="text-secondary">${seenMovies.length} film(s) regardé(s).</p>
            </div>
        </div>
        ${seenMovies.length > 0 
            ? `<div class="movie-grid">${seenMovies.map(m => createMovieCardHTML(m, 'saved')).join('')}</div>`
            : `<div class="empty-state"><i data-lucide="check-circle"></i><p>Aucun film marqué comme vu.</p></div>`
        }
    `;
    return html;
}

export function renderWatchlist(appState) {
    const wlMovies = appState.movies.filter(m => m.status === 'watchlist');
    const html = `
        <div class="page-header">
            <div>
                <h1>À Voir</h1>
                <p class="text-secondary">${wlMovies.length} film(s) dans votre liste.</p>
            </div>
        </div>
        ${wlMovies.length > 0 
            ? `<div class="movie-grid">${wlMovies.map(m => createMovieCardHTML(m, 'saved')).join('')}</div>`
            : `<div class="empty-state"><i data-lucide="bookmark"></i><p>Votre liste à voir est vide.</p></div>`
        }
    `;
    return html;
}

export function renderFavorites(appState) {
    const favMovies = appState.movies.filter(m => m.isFavorite);
    const html = `
        <div class="page-header">
            <div>
                <h1>Favoris</h1>
                <p class="text-secondary">Vos films coups de cœur.</p>
            </div>
        </div>
        ${favMovies.length > 0 
            ? `<div class="movie-grid">${favMovies.map(m => createMovieCardHTML(m, 'saved')).join('')}</div>`
            : `<div class="empty-state"><i data-lucide="heart"></i><p>Aucun favori pour le moment.</p></div>`
        }
    `;
    return html;
}

export function renderStats(appState) {
    const total = appState.movies.length;
    const seenCount = appState.movies.filter(m => m.status === 'seen').length;
    const wlCount = appState.movies.filter(m => m.status === 'watchlist').length;
    
    const rated = appState.movies.filter(m => m.status === 'seen' && m.personalRating > 0);
    const avgRating = rated.length > 0 
        ? (rated.reduce((acc, m) => acc + m.personalRating, 0) / rated.length).toFixed(1) 
        : '-';

    const html = `
        <div class="page-header">
            <div>
                <h1>Statistiques</h1>
                <p class="text-secondary">Aperçu de votre activité.</p>
            </div>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:1.5rem;">
            <div class="glass-panel" style="padding:1.5rem; border-radius:var(--radius-lg); text-align:center;">
                <i data-lucide="film" style="color:var(--color-text-secondary); width:32px; height:32px; margin-bottom:1rem;"></i>
                <h3 style="font-size:2rem; color:var(--color-accent-primary);">${total}</h3>
                <p class="text-secondary">Total Films</p>
            </div>
            <div class="glass-panel" style="padding:1.5rem; border-radius:var(--radius-lg); text-align:center;">
                <i data-lucide="check-circle" style="color:var(--color-success); width:32px; height:32px; margin-bottom:1rem;"></i>
                <h3 style="font-size:2rem; color:var(--color-success);">${seenCount}</h3>
                <p class="text-secondary">Films Vus</p>
            </div>
            <div class="glass-panel" style="padding:1.5rem; border-radius:var(--radius-lg); text-align:center;">
                <i data-lucide="bookmark" style="color:var(--color-info); width:32px; height:32px; margin-bottom:1rem;"></i>
                <h3 style="font-size:2rem; color:var(--color-info);">${wlCount}</h3>
                <p class="text-secondary">À Voir</p>
            </div>
            <div class="glass-panel" style="padding:1.5rem; border-radius:var(--radius-lg); text-align:center;">
                <i data-lucide="star" style="color:var(--color-accent-primary); width:32px; height:32px; margin-bottom:1rem;"></i>
                <h3 style="font-size:2rem; color:var(--color-accent-primary);">${avgRating}</h3>
                <p class="text-secondary">Note Moyenne</p>
            </div>
        </div>
    `;
    return html;
}

// Search Logic attaching to DOM
let searchTimeout;
export function attachSearchLogic() {
    const input = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results');
    if (!input || !resultsContainer) return;

    input.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(searchTimeout);
        
        if (query.length < 2) {
            resultsContainer.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;"><i data-lucide="search"></i><p>Tapez un titre pour rechercher.</p></div>`;
            refreshIcons();
            return;
        }

        resultsContainer.innerHTML = Array(4).fill(`<div class="skeleton" style="aspect-ratio:2/3;"></div>`).join('');

        searchTimeout = setTimeout(async () => {
            try {
                const results = await searchMovies(query);
                if (results.length === 0) {
                    resultsContainer.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;"><i data-lucide="alert-circle"></i><p>Aucun résultat pour "${query}".</p></div>`;
                } else {
                    resultsContainer.innerHTML = results.map(m => createMovieCardHTML(m, 'search')).join('');
                }
                refreshIcons();
            } catch (err) {
                resultsContainer.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;"><i data-lucide="alert-triangle" style="color:var(--color-error);"></i><p>Erreur lors de la recherche.</p></div>`;
                refreshIcons();
            }
        }, 500);
    });
}
