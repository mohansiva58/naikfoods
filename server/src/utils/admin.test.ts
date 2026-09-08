/** @vitest-environment node */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isAdminEmail, parseAdminEmails } from './admin';

describe('admin utils', () => {
    const prev = process.env.ADMIN_EMAILS;

    beforeEach(() => {
        process.env.ADMIN_EMAILS = 'owner@example.com, other@example.com ';
    });

    afterEach(() => {
        process.env.ADMIN_EMAILS = prev;
    });

    it('parseAdminEmails normalizes', () => {
        expect(parseAdminEmails()).toEqual(['owner@example.com', 'other@example.com']);
    });

    it('isAdminEmail is case-insensitive', () => {
        expect(isAdminEmail('OWNER@EXAMPLE.COM')).toBe(true);
        expect(isAdminEmail('nope@example.com')).toBe(false);
    });
});
