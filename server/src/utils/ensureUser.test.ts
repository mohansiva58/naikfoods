/** @vitest-environment node */
import { describe, it, expect } from 'vitest';
import { normalizeUserEmail } from './ensureUser';

describe('ensureUser helpers', () => {
    it('normalizeUserEmail lowercases and trims', () => {
        expect(normalizeUserEmail('  Test@Example.COM  ', 'abc12345')).toBe('test@example.com');
    });

    it('normalizeUserEmail falls back when missing', () => {
        expect(normalizeUserEmail(undefined, 'firebaseUid123')).toBe('user_firebase@firebase.local');
    });
});
