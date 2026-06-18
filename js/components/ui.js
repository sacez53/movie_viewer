import { getImageUrl } from "../api/tmdb.js";

// Helper for Lucide icons initialization after DOM update
export function refreshIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Generate a Movie Card HTML string
export function createMovieCardHTML(movie, type = 'search') {
    const isSaved = type !== 'search';
    const posterUrl = getImageUrl(movie.poster_path);
    const title = movie.title || movie.name;
    const year = movie.release_date ? movie.release_date.substring(0, 4) : 'N/A';
    
    // For saved movies, show user rating or status
    let metaHTML = `<span>${year}</span>`;
    
    if (isSaved) {
        if (movie.status === 'seen' && movie.personalRating > 0) {
            metaHTML += `<span class="rating-badge"><i data-lucide="star"></i> ${movie.personalRating}/10</span>`;
        } else if (movie.status === 'watchlist') {
            const priorities = { 'high': 'Haute', 'normal': 'Normale', 'low': 'Basse' };
            metaHTML += `<span>Prio: ${priorities[movie.watchlistPriority] || 'Normale'}</span>`;
        }
    } else {
        if (movie.vote_average) {
            metaHTML += `<span class="rating-badge"><i data-lucide="star"></i> ${movie.vote_average.toFixed(1)}</span>`;
        }
    }

    const badgeHTML = isSaved && movie.isFavorite 
        ? `<div style="position:absolute; top:8px; right:8px; color:#e5b05c;"><i data-lucide="heart" fill="currentColor"></i></div>` 
        : '';

    return `
        <div class="movie-card" data-id="${movie.id}" data-type="${type}">
            <img src="${posterUrl}" alt="${title}" class="movie-poster" loading="lazy">
            ${badgeHTML}
            <div class="movie-info">
                <h3 class="movie-title truncate">${title}</h3>
                <div class="movie-meta">
                    ${metaHTML}
                </div>
            </div>
        </div>
    `;
}

// Show toast notification
export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} glass-panel`;
    toast.style.cssText = `
        padding: 1rem;
        margin-bottom: 0.5rem;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        animation: slideIn 0.3s ease forwards;
        background: ${type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'var(--color-bg-surface-glass)'};
        border-left: 4px solid ${type === 'error' ? 'var(--color-error)' : 'var(--color-accent-primary)'};
    `;

    toast.innerHTML = `
        <i data-lucide="${type === 'error' ? 'alert-circle' : 'info'}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    refreshIcons();

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add these keyframes to your layout.css or just inject them
if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
        .toast-container { position: fixed; bottom: 20px; right: 20px; z-index: 1000; display: flex; flex-direction: column; }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
    `;
    document.head.appendChild(style);
}
