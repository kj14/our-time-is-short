import { describe, it, expect } from 'vitest';
import { buildContext, isSatisfied, pickTruthMessage } from './selector';
import { TEMPLATES } from './templates';

const userJa = { age: 40, country: 'Japan' };
const childPerson = (overrides = {}) => ({
    id: 'p1',
    name: 'Sora',
    age: 8,
    relationship: 'child',
    meetingFrequency: 365,
    hoursPerMeeting: 4,
    ...overrides
});
const mentor = (overrides = {}) => ({
    id: 'm1',
    name: 'Sensei',
    age: 60,
    relationship: 'friend',
    isMentor: true,
    meetingFrequency: 12,
    hoursPerMeeting: 2,
    ...overrides
});

describe('buildContext', () => {
    it('groups people by relationship', () => {
        const ctx = buildContext({
            user: userJa,
            people: [childPerson()],
            userLifeExpectancy: 84.6
        });
        expect(ctx.peopleByRelationship.child).toHaveLength(1);
    });

    it('counts isMentor people under mentor regardless of stored relationship', () => {
        const ctx = buildContext({
            user: userJa,
            people: [mentor()],
            userLifeExpectancy: 84.6
        });
        expect(ctx.peopleByRelationship.mentor).toHaveLength(1);
        expect(ctx.peopleByRelationship.friend).toHaveLength(1);
    });

    it('computes life-percent', () => {
        const ctx = buildContext({
            user: { age: 50, country: 'Japan' },
            people: [],
            userLifeExpectancy: 100
        });
        expect(ctx.userLifePercentLived).toBe(50);
    });
});

describe('isSatisfied', () => {
    const empty = buildContext({ user: userJa, people: [], userLifeExpectancy: 84.6 });
    const withChild = buildContext({ user: userJa, people: [childPerson()], userLifeExpectancy: 84.6 });
    const withMentor = buildContext({ user: userJa, people: [mentor()], userLifeExpectancy: 84.6 });

    it('templates with no requirements always qualify', () => {
        const t = TEMPLATES.find((t) => t.id === 'next_time');
        expect(isSatisfied(t, empty)).toBe(true);
        expect(isSatisfied(t, withChild)).toBe(true);
    });

    it('child-required templates only qualify with child', () => {
        const t = TEMPLATES.find((t) => t.id === 'christmas_child');
        expect(isSatisfied(t, empty)).toBe(false);
        expect(isSatisfied(t, withChild)).toBe(true);
    });

    it('mentor templates only qualify with mentor', () => {
        const t = TEMPLATES.find((t) => t.id === 'mentor_advice');
        expect(isSatisfied(t, empty)).toBe(false);
        expect(isSatisfied(t, withChild)).toBe(false);
        expect(isSatisfied(t, withMentor)).toBe(true);
    });
});

describe('pickTruthMessage', () => {
    it('returns a result for empty universe (templates with no requires)', () => {
        const ctx = buildContext({ user: userJa, people: [], userLifeExpectancy: 84.6 });
        const result = pickTruthMessage(ctx);
        expect(result).not.toBeNull();
        expect(result.id).toBeTruthy();
        expect(result.question.ja).toBeTruthy();
        expect(result.answer.en).toBeTruthy();
    });

    it('avoids most recently shown ids when possible', () => {
        const ctx = buildContext({ user: userJa, people: [], userLifeExpectancy: 84.6 });
        // Get all the template ids that don't require anything.
        const noReqIds = TEMPLATES.filter((t) => t.requires.length === 0).map((t) => t.id);
        // Asking with 4 of them in seenIds should return one of the others.
        const seen = noReqIds.slice(0, 4);
        const result = pickTruthMessage(ctx, seen);
        // It should be a no-req template, not in the seen list (assuming there are fresh ones)
        if (noReqIds.length > 4) {
            expect(seen).not.toContain(result.id);
        }
    });
});
