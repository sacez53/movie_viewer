import { db } from "../firebase-config.js";
import { currentUser } from "./auth.js";
import { ref, set, get, remove, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

let userMoviesRef = null;
let dbListeners = [];

// Appelé quand l'utilisateur change pour configurer la référence DB
export function initDB(user) {
    if (user) {
        userMoviesRef = ref(db, `users/${user.uid}/movies`);
    } else {
        userMoviesRef = null;
    }
}

// Ajouter ou mettre à jour un film
export async function saveMovie(movieData) {
    if (!userMoviesRef) throw new Error("Utilisateur non connecté");
    const movieRef = ref(db, `users/${currentUser.uid}/movies/${movieData.id}`);
    
    // Structure par défaut si nouveau
    const dataToSave = {
        id: movieData.id,
        title: movieData.title,
        poster_path: movieData.poster_path,
        release_date: movieData.release_date,
        vote_average: movieData.vote_average,
        genres: movieData.genres || movieData.genre_ids || [],
        
        // Données utilisateur
        status: movieData.status || 'watchlist', // 'seen' or 'watchlist'
        watchlistPriority: movieData.watchlistPriority || 'normal',
        personalRating: movieData.personalRating || 0,
        comment: movieData.comment || '',
        viewDate: movieData.viewDate || '',
        isFavorite: movieData.isFavorite || false,
        addedAt: movieData.addedAt || Date.now(),
        updatedAt: Date.now()
    };

    await set(movieRef, dataToSave);
    return dataToSave;
}

// Retirer un film
export async function removeMovie(movieId) {
    if (!userMoviesRef) throw new Error("Utilisateur non connecté");
    const movieRef = ref(db, `users/${currentUser.uid}/movies/${movieId}`);
    await remove(movieRef);
}

// Écouter tous les films de l'utilisateur en temps réel
export function subscribeToMovies(callback) {
    if (!userMoviesRef) return () => {};
    
    const unsubscribe = onValue(userMoviesRef, (snapshot) => {
        const data = snapshot.val();
        const moviesList = data ? Object.values(data) : [];
        // Tri par date d'ajout (plus récent d'abord)
        moviesList.sort((a, b) => b.addedAt - a.addedAt);
        callback(moviesList);
    });
    
    return unsubscribe;
}
