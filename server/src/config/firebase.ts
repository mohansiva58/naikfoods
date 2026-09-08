import admin from 'firebase-admin';

interface FirebaseRestUser {
    localId: string;
    email?: string;
    displayName?: string;
    photoUrl?: string;
}

interface FirebaseJwtPayload {
    aud?: string;
    email?: string;
    exp?: number;
    iss?: string;
    name?: string;
    picture?: string;
    sub?: string;
    user_id?: string;
}

const getFirebaseApiKey = (): string | undefined => {
    return process.env.VITE_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
};

const getFirebaseProjectId = (): string | undefined => {
    return process.env.VITE_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
};

const base64UrlDecode = (value: string): string => {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=');
    return Buffer.from(padded, 'base64').toString('utf8');
};

const decodeFirebaseTokenForLocalDev = (token: string): admin.auth.DecodedIdToken => {
    const projectId = getFirebaseProjectId();
    if (!projectId) {
        throw new Error('Firebase project ID missing');
    }

    const [, payloadPart] = token.split('.');
    if (!payloadPart) {
        throw new Error('Malformed Firebase token');
    }

    const payload = JSON.parse(base64UrlDecode(payloadPart)) as FirebaseJwtPayload;
    const uid = payload.user_id || payload.sub;
    const expectedIssuer = `https://securetoken.google.com/${projectId}`;
    const now = Math.floor(Date.now() / 1000);

    if (!uid || payload.aud !== projectId || payload.iss !== expectedIssuer || !payload.exp || payload.exp <= now) {
        throw new Error('Firebase token claims do not match local project');
    }

    return {
        uid,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
    } as unknown as admin.auth.DecodedIdToken;
};

const verifyTokenWithFirebaseRest = async (token: string): Promise<admin.auth.DecodedIdToken> => {
    const apiKey = getFirebaseApiKey();
    if (!apiKey) {
        throw new Error('Firebase API key missing');
    }

    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
    });

    if (!response.ok) {
        throw new Error(`Firebase REST token lookup failed (${response.status})`);
    }

    const data = await response.json() as { users?: FirebaseRestUser[] };
    const user = data.users?.[0];
    if (!user?.localId) {
        throw new Error('Firebase REST token lookup returned no user');
    }

    return {
        uid: user.localId,
        email: user.email,
        name: user.displayName,
        picture: user.photoUrl,
    } as unknown as admin.auth.DecodedIdToken;
};

export const initializeFirebase = (): void => {
    try {
        if (admin.apps.length) {
            return;
        }

        const projectId = getFirebaseProjectId();
        const databaseURL = process.env.VITE_FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
        const hasServiceAccount = Boolean(
            process.env.FIREBASE_PRIVATE_KEY_ID &&
            process.env.FIREBASE_PRIVATE_KEY &&
            process.env.FIREBASE_CLIENT_EMAIL &&
            process.env.FIREBASE_CLIENT_ID
        );

        if (!projectId) {
            console.warn('Firebase project ID missing; authenticated API routes will reject Firebase tokens');
            return;
        }

        if (!hasServiceAccount) {
            admin.initializeApp({ projectId, databaseURL });
            console.log('Firebase Admin initialized with project ID');
            return;
        }

        const serviceAccount = {
            type: 'service_account',
            project_id: projectId,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: 'https://accounts.google.com/o/oauth2/auth',
            token_uri: 'https://oauth2.googleapis.com/token',
            auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
            client_x509_cert_url: process.env.FIREBASE_CERT_URL,
        };

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
            databaseURL,
        });

        console.log('Firebase Admin initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error);
        console.warn('Continuing without Firebase Admin; authenticated API routes may reject Firebase tokens');
    }
};

export const verifyFirebaseToken = async (token: string): Promise<admin.auth.DecodedIdToken> => {
    try {
        if (!admin.apps.length) {
            initializeFirebase();
        }
        const decodedToken = await admin.auth().verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        try {
            return await verifyTokenWithFirebaseRest(token);
        } catch (fallbackError) {
            try {
                return decodeFirebaseTokenForLocalDev(token);
            } catch (decodeError) {
                console.warn('Firebase token verification failed:', {
                    admin: (error as Error).message,
                    rest: (fallbackError as Error).message,
                    localClaims: (decodeError as Error).message,
                });
                throw new Error('Invalid or expired token');
            }
        }
    }
};

export default admin;
