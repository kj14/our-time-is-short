// Tiny i18n hook. Default language is derived from the user's country
// (Japan → ja, anything else → en) but can be overridden by storing
// 'lifevis_language' in localStorage. Components call useT(language) and
// receive a t(key, vars?) function.

import { strings } from './strings';
import type { Language } from '../types';

export const SUPPORTED_LANGUAGES: readonly Language[] = ['ja', 'en'] as const;
const DEFAULT_LANGUAGE: Language = 'en';

export function languageFromCountry(country: string | undefined | null): Language {
    if (country === 'Japan') return 'ja';
    return DEFAULT_LANGUAGE;
}

export function getStoredLanguageOverride(): Language | null {
    try {
        const raw = localStorage.getItem('lifevis_language');
        return raw && (SUPPORTED_LANGUAGES as readonly string[]).includes(raw)
            ? (raw as Language)
            : null;
    } catch {
        return null;
    }
}

export function resolveLanguage(country: string | undefined | null): Language {
    return getStoredLanguageOverride() ?? languageFromCountry(country);
}

export type Translator = (key: string, vars?: Record<string, string | number>) => string;

// Returns a translator bound to the chosen language.
// Components that already know the language pass it directly:
//   const t = useT(country);
//   <button>{t('common.save')}</button>
//
// Vars can be interpolated with {name} placeholders.
export function useT(country: string | undefined | null): Translator {
    const lang = resolveLanguage(country);
    const dict = strings[lang] || strings[DEFAULT_LANGUAGE];

    return function t(key, vars) {
        let template = dict[key];
        if (template == null) {
            // Missing key: fall back to the other language, then to the key itself.
            const otherLang: Language = lang === 'ja' ? 'en' : 'ja';
            template = strings[otherLang]?.[key] ?? key;
        }
        if (!vars) return template;
        return Object.entries(vars).reduce(
            (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
            template
        );
    };
}

// Convenience predicate for the small number of code paths that still
// use isJapan boolean toggles. Prefer useT(country) in new code.
export function isJapaneseLanguage(country: string | undefined | null): boolean {
    return resolveLanguage(country) === 'ja';
}
