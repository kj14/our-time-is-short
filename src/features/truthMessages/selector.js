// Picks a Truth Message template that the current universe can satisfy.
// Filtering rules: every entry in `template.requires` must be satisfiable
//   - 'anyPerson'  → at least one person exists
//   - 'self'       → user data is loaded
//   - relationship → at least one person with that relationship
// Then picks pseudo-randomly excluding the most recently shown ids.

import { TEMPLATES } from './templates';

const RECENT_LIMIT = 4;

export function buildContext({ user, people, basis = 'life', userLifeExpectancy }) {
    const peopleByRelationship = {};
    for (const p of people) {
        const r = p.relationship || 'other';
        (peopleByRelationship[r] ||= []).push(p);
    }
    const userRemainingYears = Math.max(0, userLifeExpectancy - user.age);
    const userLifePercentLived = userLifeExpectancy > 0
        ? Math.min(100, (user.age / userLifeExpectancy) * 100)
        : 0;
    return {
        userAge: user.age,
        userCountry: user.country,
        basis,
        people,
        peopleByRelationship,
        userLifeExpectancy,
        userRemainingYears,
        userLifePercentLived
    };
}

export function isSatisfied(template, ctx) {
    for (const req of template.requires) {
        if (req === 'anyPerson') {
            if (ctx.people.length === 0) return false;
        } else if (req === 'self') {
            if (ctx.userAge == null) return false;
        } else {
            // a specific relationship
            if (!ctx.peopleByRelationship[req] || ctx.peopleByRelationship[req].length === 0) return false;
        }
    }
    return true;
}

export function pickTruthMessage(ctx, seenIds = []) {
    const eligible = TEMPLATES.filter((t) => isSatisfied(t, ctx));
    if (eligible.length === 0) return null;

    const recent = new Set(seenIds.slice(-RECENT_LIMIT));
    const fresh = eligible.filter((t) => !recent.has(t.id));
    const pool = fresh.length > 0 ? fresh : eligible;

    const template = pool[Math.floor(Math.random() * pool.length)];
    const out = template.compute(ctx);
    return { id: template.id, question: out.q, answer: out.a };
}
