import { CONFIG } from "../config.js";

const BASE_URL = 'https://api.themoviedb.org/3';

function getHeaders() {
    return {
        'Authorization': `Bearer ${CONFIG.TMDB_BEARER_TOKEN}`,
        'accept': 'application/json'
    };
}

export async function searchMovies(query) {
    if (!query) return [];
    
    try {
        const response = await fetch(`${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=fr-FR&page=1`, {
            headers: getHeaders()
        });
        
        if (!response.ok) throw new Error('Erreur API TMDB');
        
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error("Search Error:", error);
        throw error;
    }
}

export async function getMovieDetails(movieId) {
    try {
        const response = await fetch(`${BASE_URL}/movie/${movieId}?language=fr-FR`, {
            headers: getHeaders()
        });
        
        if (!response.ok) throw new Error('Erreur API TMDB');
        
        return await response.json();
    } catch (error) {
        console.error("Details Error:", error);
        throw error;
    }
}

export function getImageUrl(path, size = 'w500') {
    if (!path) return 'https://via.placeholder.com/500x750?text=Affiche+non+disponible';
    return `https://image.tmdb.org/t/p/${size}${path}`;
}
