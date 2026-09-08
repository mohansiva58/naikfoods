import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { authService } from '@/services/authService';
import { api } from '@/services/api';
import { toast } from 'sonner';

import { AuthContext, AuthContextType } from './auth-context';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = authService.onAuthStateChange((user) => {
            setUser(user);
            setLoading(false);
        });

        authService.completeRedirectSignIn()
            .then((signedInUser) => {
                if (signedInUser) {
                    toast.success('Signed in with Google!');
                    api.post('/users/login-notify').catch((err) => console.error('Login notify error:', err));
                }
            })
            .catch((err) => {
                console.error('Redirect sign-in error:', err);
            });

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            setLoading(true);
            await authService.signInWithEmail(email, password);
            toast.success('Signed in successfully!');
            api.post('/users/login-notify').catch((err) => console.error('Login notify error:', err));
        } catch (error: unknown) {
            const firebaseError = error as { code: string };
            const errorCode = firebaseError.code;
            let errorMessage = 'Failed to sign in';

            if (errorCode === 'auth/user-not-found') {
                errorMessage = 'No account found with this email';
            } else if (errorCode === 'auth/wrong-password') {
                errorMessage = 'Incorrect password';
            } else if (errorCode === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            } else if (errorCode === 'auth/invalid-credential') {
                errorMessage = 'Invalid email or password';
            } else if (errorCode === 'auth/too-many-requests') {
                errorMessage = 'Too many attempts. Please try again later';
            }

            toast.error(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email: string, password: string) => {
        try {
            setLoading(true);
            await authService.signUpWithEmail(email, password);
            toast.success('Account created successfully!');
            api.post('/users/login-notify').catch((err) => console.error('Login notify error:', err));
        } catch (error: unknown) {
            const firebaseError = error as { code: string };
            const errorCode = firebaseError.code;
            let errorMessage = 'Failed to create account';

            if (errorCode === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered. Please sign in instead.';
                toast.error(errorMessage, {
                    description: 'Click below to switch to sign in',
                });
            } else if (errorCode === 'auth/weak-password') {
                errorMessage = 'Password should be at least 6 characters';
                toast.error(errorMessage);
            } else if (errorCode === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
                toast.error(errorMessage);
            } else {
                toast.error(errorMessage);
            }

            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signInWithGoogle = async () => {
        try {
            setLoading(true);
            await authService.signInWithGoogle();
            toast.success('Signed in with Google!');
            api.post('/users/login-notify').catch((err) => console.error('Login notify error:', err));
        } catch (error: unknown) {
            const firebaseError = error as { code: string };
            const errorCode = firebaseError.code;
            let errorMessage = 'Failed to sign in with Google';

            if (errorCode === 'auth/popup-closed-by-user') {
                errorMessage = 'Sign in cancelled';
            } else if (errorCode === 'auth/popup-blocked') {
                errorMessage = 'Please allow popups for this site';
            }

            toast.error(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            await authService.signOut();
            toast.success('Signed out successfully');
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error(err.message || 'Failed to sign out');
        }
    };

    const value = {
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
