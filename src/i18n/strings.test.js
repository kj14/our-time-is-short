import { describe, it, expect } from 'vitest';
import { strings } from './strings';

describe('strings', () => {
    it('has matching keys in ja and en', () => {
        const jaKeys = Object.keys(strings.ja).sort();
        const enKeys = Object.keys(strings.en).sort();
        expect(jaKeys).toEqual(enKeys);
    });

    it('every value is a non-empty string', () => {
        for (const lang of ['ja', 'en']) {
            for (const [key, value] of Object.entries(strings[lang])) {
                expect(typeof value).toBe('string');
                expect(value.length, `${lang}.${key} is empty`).toBeGreaterThan(0);
            }
        }
    });
});
