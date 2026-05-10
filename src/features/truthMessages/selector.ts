// Picks a Truth Message template that the current universe can satisfy.
// Filtering rules: every entry in `template.requires` must be satisfiable
//   - 'anyPerson'  → at least one person exists
//   - 'self'       → user data is loaded
//   - relationship → at least one person with that relationship
// Then picks pseudo-randomly excluding the most recently shown ids.

import { TEMPLATES } from './templates';
import type {
    CalculationBasis,
    Person,
    Relationship,
    TruthContext,
    TruthMessageOutput,
    TruthTemplate,
    UserData
} from '../../types';

const RECENT_LIMIT = 4;

export function buildContext({
    user,
    people,
    basis = 'life',
    userLifeExpectancy
}: {
    user: Pick<UserData, 'country' | 'age'>;
    people: Person[];
    basis?: CalculationBasis;
    userLifeExpectancy: number;
}): TruthContext {
    const peopleByRelationship: Record<Relationship, Person[]> = {
        parent: [], child: [], sibling: [], spouse: [],
        partner: [], friend: [], mentor: [], other: []
    };
    for (const p of people) {
        const r: Relationship = (p.relationship || 'other') as Relationship;
        peopleByRelationship[r].push(p);
        // A person flagged isMentor counts as 'mentor' regardless of their stored relationship.
        if (p.isMentor) {
            peopleByRelationship.mentor.push(p);
        }
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

export function isSatisfied(template: TruthTemplate, ctx: TruthContext): boolean {
    for (const req of template.requires) {
        if (req === 'anyPerson') {
            if (ctx.people.length === 0) return false;
        } else if (req === 'self') {
            if (ctx.userAge == null) return false;
        } else {
            // a specific relationship — selector guarantees non-empty
            const list = ctx.peopleByRelationship[req as Relationship];
            if (list.length === 0) return false;
        }
    }
    return true;
}

export function pickTruthMessage(
    ctx: TruthContext,
    seenIds: string[] = []
): TruthMessageOutput | null {
    const eligible = TEMPLATES.filter((t) => isSatisfied(t, ctx));
    if (eligible.length === 0) return null;

    const recent = new Set(seenIds.slice(-RECENT_LIMIT));
    const fresh = eligible.filter((t) => !recent.has(t.id));
    const pool = fresh.length > 0 ? fresh : eligible;

    const template = pool[Math.floor(Math.random() * pool.length)];
    const out = template.compute(ctx);
    return { id: template.id, question: out.q, answer: out.a };
}
