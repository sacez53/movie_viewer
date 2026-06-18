import { getMovieDetails, getImageUrl } from "../api/tmdb.js";
import { saveMovie, removeMovie } from "../store/db.js";
import { showToast, refreshIcons } from "../components/ui.js";

export function initModal(appState) {
    const modal = document.getElementById('movie-modal');
    const modalBody = document.getElementById('modal-body');
    const closeBtn = document.querySelector('.close-modal-btn');

    function closeModal() {
        modal.classList.add('hidden');
    }

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    window.openMovieModal = async (movieId, type) => {
        // Find movie from state or fetch it
        let movie = null;
        if (type === 'search') {
            modalBody.innerHTML = `<div class="skeleton" style="height: 400px; width: 100%;"></div>`;
            modal.classList.remove('hidden');
            try {
                movie = await getMovieDetails(movieId);
            } catch (err) {
                showToast("Erreur lors de la récupération des détails", "error");
                closeModal();
                return;
            }
        } else {
            movie = appState.movies.find(m => m.id == movieId);
            if (!movie) return;
            modal.classList.remove('hidden');
        }

        renderModalContent(movie, type, appState);
    };

    function renderModalContent(movie, type, appState) {
        // Check if it's already in our DB
        const savedMovie = appState.movies.find(m => m.id === movie.id);
        const data = savedMovie || movie;
        
        const isSaved = !!savedMovie;
        const status = data.status || 'watchlist';
        const posterUrl = getImageUrl(data.poster_path);
        const backdropUrl = data.backdrop_path ? getImageUrl(data.backdrop_path, 'w1280') : '';
        const genres = (data.genres || []).map(g => g.name || g).join(', ');

        modalBody.innerHTML = `
            ${backdropUrl ? `<div class="modal-hero" style="background-image: url('${backdropUrl}')"></div>` : '<div class="modal-hero"></div>'}
            
            <div class="modal-body-content">
                <img src="${posterUrl}" class="modal-poster" alt="Affiche">
                
                <div class="modal-info">
                    <h2 style="font-size:2.5rem; margin-bottom:0.5rem; line-height:1.2;">${data.title || data.name}</h2>
                    <p class="text-secondary" style="font-size:0.875rem; margin-bottom:1.5rem; display:flex; gap:0.5rem; align-items:center;">
                        <span style="background:rgba(255,255,255,0.1); padding:2px 8px; border-radius:4px;">${data.release_date?.substring(0,4) || 'N/A'}</span>
                        <span>•</span>
                        <span>${genres}</span>
                        <span>•</span>
                        <span style="color:var(--color-accent-primary); display:flex; align-items:center; gap:4px;">
                            <i data-lucide="star" style="width:14px; height:14px;" fill="currentColor"></i>
                            ${data.vote_average?.toFixed(1) || '-'} / 10
                        </span>
                    </p>
                    
                    <p style="font-size:1rem; line-height:1.6; color:rgba(255,255,255,0.85);">${data.overview || 'Aucun synopsis disponible.'}</p>
                    
                    <form id="movie-details-form" class="glass-panel" style="margin-top:2rem; padding:1.5rem; border-radius:var(--radius-lg); display:flex; flex-direction:column; gap:1.5rem;">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                            <div class="form-group" style="margin-bottom:0; flex:1; min-width:200px;">
                                <label>Statut du film</label>
                                <select id="movie-status" style="background:rgba(0,0,0,0.4);">
                                    <option value="watchlist" ${status === 'watchlist' ? 'selected' : ''}>Dans ma liste "À voir"</option>
                                    <option value="seen" ${status === 'seen' ? 'selected' : ''}>Déjà vu</option>
                                </select>
                            </div>
                            
                            <button type="button" id="toggle-fav-btn" class="btn btn-outline ${data.isFavorite ? 'text-accent' : ''}" style="gap:0.5rem;">
                                <i data-lucide="heart" ${data.isFavorite ? 'fill="currentColor"' : ''}></i>
                                <span>${data.isFavorite ? 'En favoris' : 'Marquer comme favori'}</span>
                            </button>
                        </div>
                        
                        <div id="watchlist-options" style="display: ${status === 'watchlist' ? 'block' : 'none'};">
                            <div class="form-group" style="margin-bottom:0;">
                                <label>Priorité de visionnage</label>
                                <select id="movie-prio" style="background:rgba(0,0,0,0.4);">
                                    <option value="high" ${data.watchlistPriority === 'high' ? 'selected' : ''}>🔥 Priorité Haute</option>
                                    <option value="normal" ${data.watchlistPriority === 'normal' ? 'selected' : ''}>📅 Normale</option>
                                    <option value="low" ${data.watchlistPriority === 'low' ? 'selected' : ''}>⏳ Plus tard</option>
                                </select>
                            </div>
                        </div>

                        <div id="seen-options" style="display: ${status === 'seen' ? 'flex' : 'none'}; gap:1rem; flex-wrap:wrap;">
                            <div class="form-group" style="margin-bottom:0; flex:1;">
                                <label>Ma Note (sur 10)</label>
                                <input type="number" id="movie-rating" min="0" max="10" step="0.5" value="${data.personalRating || ''}" placeholder="Ex: 8.5" style="background:rgba(0,0,0,0.4);">
                            </div>
                            <div class="form-group" style="margin-bottom:0; flex:1;">
                                <label>Date de visionnage</label>
                                <input type="date" id="movie-view-date" value="${data.viewDate || ''}" style="background:rgba(0,0,0,0.4);">
                            </div>
                        </div>

                        <div class="form-group" style="margin-bottom:0;">
                            <label>Commentaire personnel</label>
                            <textarea id="movie-comment" placeholder="Qu'avez-vous pensé de ce film... ?" style="background:rgba(0,0,0,0.4);">${data.comment || ''}</textarea>
                        </div>

                        <div style="display:flex; gap:1rem; margin-top:0.5rem;">
                            <button type="submit" class="btn btn-primary" style="flex:2; justify-content:center;">
                                <i data-lucide="save"></i> ${isSaved ? 'Enregistrer les modifications' : 'Ajouter à ma bibliothèque'}
                            </button>
                            ${isSaved ? `<button type="button" id="remove-movie-btn" class="btn btn-outline" style="flex:1; justify-content:center; color:var(--color-error); border-color:rgba(239, 68, 68, 0.3);"><i data-lucide="trash-2"></i> Retirer</button>` : ''}
                        </div>
                    </form>
                </div>
            </div>
        `;
        refreshIcons();

        // Logic
        const form = document.getElementById('movie-details-form');
        const statusSelect = document.getElementById('movie-status');
        const watchOpts = document.getElementById('watchlist-options');
        const seenOpts = document.getElementById('seen-options');
        const favBtn = document.getElementById('toggle-fav-btn');
        let isFav = data.isFavorite || false;

        statusSelect.addEventListener('change', (e) => {
            if (e.target.value === 'seen') {
                watchOpts.style.display = 'none';
                seenOpts.style.display = 'flex';
            } else {
                watchOpts.style.display = 'block';
                seenOpts.style.display = 'none';
            }
        });

        favBtn.addEventListener('click', () => {
            isFav = !isFav;
            if (isFav) {
                favBtn.classList.add('text-accent');
                favBtn.innerHTML = `<i data-lucide="heart" fill="currentColor"></i>`;
            } else {
                favBtn.classList.remove('text-accent');
                favBtn.innerHTML = `<i data-lucide="heart"></i>`;
            }
            refreshIcons();
        });

        const removeBtn = document.getElementById('remove-movie-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', async () => {
                if(confirm("Retirer ce film de votre bibliothèque ?")) {
                    try {
                        await removeMovie(data.id);
                        showToast("Film retiré");
                        closeModal();
                    } catch(err) {
                        showToast("Erreur lors de la suppression", "error");
                    }
                }
            });
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const saveData = {
                ...data,
                status: statusSelect.value,
                isFavorite: isFav,
                watchlistPriority: document.getElementById('movie-prio')?.value || 'normal',
                personalRating: Number(document.getElementById('movie-rating')?.value || 0),
                viewDate: document.getElementById('movie-view-date')?.value || '',
                comment: document.getElementById('movie-comment').value
            };

            try {
                await saveMovie(saveData);
                showToast("Film sauvegardé !");
                closeModal();
            } catch (err) {
                showToast("Erreur lors de la sauvegarde", "error");
            }
        });
    }
}
