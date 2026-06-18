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
        const genres = (data.genres || []).map(g => g.name || g).join(', ');

        modalBody.innerHTML = `
            <div style="display:flex; gap:2rem; flex-wrap:wrap;">
                <div style="flex: 1; min-width: 250px;">
                    <img src="${posterUrl}" style="width:100%; border-radius:var(--radius-md); box-shadow:var(--shadow-lg);" alt="Affiche">
                </div>
                <div style="flex: 2; min-width: 300px; display:flex; flex-direction:column; gap:1rem;">
                    <h2>${data.title || data.name}</h2>
                    <p class="text-secondary">${data.release_date?.substring(0,4)} • ${genres} • TMDB: ${data.vote_average?.toFixed(1)}/10</p>
                    <p>${data.overview || 'Aucun synopsis disponible.'}</p>
                    
                    <hr style="border:0; border-top:1px solid rgba(255,255,255,0.1); margin: 1rem 0;">
                    
                    <form id="movie-details-form" style="display:flex; flex-direction:column; gap:1rem;">
                        <div style="display:flex; gap:1rem; align-items:center;">
                            <label><strong>Statut:</strong></label>
                            <select id="movie-status" style="max-width: 200px;">
                                <option value="watchlist" ${status === 'watchlist' ? 'selected' : ''}>À voir</option>
                                <option value="seen" ${status === 'seen' ? 'selected' : ''}>Vu</option>
                            </select>
                            
                            <button type="button" id="toggle-fav-btn" class="btn btn-icon ${data.isFavorite ? 'text-accent' : ''}" title="Favori">
                                <i data-lucide="heart" ${data.isFavorite ? 'fill="currentColor"' : ''}></i>
                            </button>
                        </div>
                        
                        <div id="watchlist-options" style="display: ${status === 'watchlist' ? 'block' : 'none'};">
                            <label>Priorité :</label>
                            <select id="movie-prio">
                                <option value="low" ${data.watchlistPriority === 'low' ? 'selected' : ''}>Plus tard</option>
                                <option value="normal" ${data.watchlistPriority === 'normal' ? 'selected' : ''}>Normale</option>
                                <option value="high" ${data.watchlistPriority === 'high' ? 'selected' : ''}>Haute</option>
                            </select>
                        </div>

                        <div id="seen-options" style="display: ${status === 'seen' ? 'block' : 'none'}; gap:1rem; flex-direction:column;">
                            <div>
                                <label>Ma Note (sur 10) :</label>
                                <input type="number" id="movie-rating" min="0" max="10" value="${data.personalRating || ''}" placeholder="Ex: 8">
                            </div>
                            <div style="margin-top:1rem;">
                                <label>Date de visionnage :</label>
                                <input type="date" id="movie-view-date" value="${data.viewDate || ''}">
                            </div>
                        </div>

                        <div>
                            <label>Commentaire personnel :</label>
                            <textarea id="movie-comment" placeholder="Qu'avez-vous pensé de ce film...">${data.comment || ''}</textarea>
                        </div>

                        <div style="display:flex; gap:1rem; margin-top:1rem;">
                            <button type="submit" class="btn btn-primary" style="flex:1;"><i data-lucide="save"></i> ${isSaved ? 'Mettre à jour' : 'Ajouter à ma bibliothèque'}</button>
                            ${isSaved ? `<button type="button" id="remove-movie-btn" class="btn btn-outline" style="color:var(--color-error); border-color:var(--color-error);"><i data-lucide="trash-2"></i> Retirer</button>` : ''}
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
