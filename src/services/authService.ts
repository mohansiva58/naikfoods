import { initializeApp } from 'firebase/app';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    getRedirectResult,
    User,
} from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const authService = {
    // Email/Password Authentication
    signUpWithEmail: async (email: string, password: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        localStorage.setItem('firebaseToken', token);
        return userCredential.user;
    },

    signInWithEmail: async (email: string, password: string) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        localStorage.setItem('firebaseToken', token);
        return userCredential.user;
    },

    // Popup sign-in works on Vercel/custom domains without /__/auth proxy setup.
    signInWithGoogle: async (): Promise<User> => {
        googleProvider.setCustomParameters({});
        const result = await signInWithPopup(auth, googleProvider);
        const token = await result.user.getIdToken();
        localStorage.setItem('firebaseToken', token);
        return result.user;
    },

    completeRedirectSignIn: async (): Promise<User | null> => {
        const result = await getRedirectResult(auth);
        if (!result?.user) return null;
        const token = await result.user.getIdToken();
        localStorage.setItem('firebaseToken', token);
        return result.user;
    },

    // Sign Out
    signOut: async () => {
        await signOut(auth);
        localStorage.removeItem('firebaseToken');
    },

    // Get Current User
    getCurrentUser: (): User | null => {
        return auth.currentUser;
    },

    // Get ID Token
    getIdToken: async (): Promise<string | null> => {
        if (typeof auth.authStateReady === 'function') {
            await auth.authStateReady();
        }
        const user = auth.currentUser;
        if (user) {
            return await user.getIdToken();
        }
        return null;
    },

    // Auth State Observer
    onAuthStateChange: (callback: (user: User | null) => void) => {
        return onAuthStateChanged(auth, async (user) => {
            if (user) {
                const token = await user.getIdToken();
                localStorage.setItem('firebaseToken', token);
            } else {
                localStorage.removeItem('firebaseToken');
            }
            callback(user);
        });
    },
};

export { auth };
export default authService;
