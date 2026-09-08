/**
 * Utility function to check if popups are blocked
 * This can be used to provide better error messages to users
 */
export const isPopupBlocked = (): boolean => {
    try {
        const popup = window.open('', '', 'width=1,height=1');
        if (!popup || popup.closed) {
            return true;
        }
        popup.close();
        return false;
    } catch (e) {
        return true;
    }
};

/**
 * Helper to handle popup authentication errors with better messaging
 */
export const getPopupErrorMessage = (error: unknown): string => {
    const err = error as { code?: string; message?: string };
    
    if (err.code === 'auth/popup-blocked') {
        return 'Popup was blocked by your browser. Please enable popups for this site and try again.';
    }
    
    if (err.code === 'auth/popup-closed-by-user') {
        return 'Sign-in was cancelled.';
    }
    
    if (err.message?.includes('Cross-Origin-Opener-Policy')) {
        return 'There was a security issue with the popup. Please try again or refresh the page.';
    }
    
    if (err.message?.includes('Popup was blocked')) {
        return 'Popup was blocked by your browser. Please enable popups and try again.';
    }
    
    return 'Sign in failed. Please try again.';
};
