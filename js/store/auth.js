import { auth } from "../firebase-config.js";
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// État local de l'utilisateur
export let currentUser = null;
let authStateListeners = [];

export function onAuthChange(callback) {
    authStateListeners.push(callback);
    return () => {
        authStateListeners = authStateListeners.filter(cb => cb !== callback);
    };
}

// Initialiser l'écouteur global
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    authStateListeners.forEach(cb => cb(user));
});

export async function loginWithEmail(email, password) {
    return await signInWithEmailAndPassword(auth, email, password);
}

export async function registerWithEmail(email, password) {
    return await createUserWithEmailAndPassword(auth, email, password);
}

export async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return await signInWithPopup(auth, provider);
}

export async function logout() {
    return await signOut(auth);
}
