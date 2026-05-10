// Truth Message templates per CONCEPT.md §8 (Q+A trio) and §9 (11 examples)
// plus a birthday template. Each template declares which relationships it
// needs in the universe ('child' | 'parent' | 'spouse' | 'partner' | 'friend'
// | 'mentor' | 'sibling' | 'anyPerson' | 'self'). The selector filters by
// requirements before picking pseudo-randomly.
//
// compute(ctx) receives:
//   { userAge, userCountry, basis, people, peopleByRelationship,
//     userLifeExpectancy, userRemainingYears, userLifePercentLived,
//     totalSharedHoursAllPeople }
// and returns { q: {ja, en}, a: {ja, en} }.

import { calculateTimeWithPerson } from '../../utils/calculations';

const round = (n) => Math.max(0, Math.round(n));

const sharedYearsWith = (person, ctx) => {
    const r = calculateTimeWithPerson({
        person: { ...person, meetingFrequency: 1, hoursPerMeeting: 1 },
        userAge: ctx.userAge,
        country: ctx.userCountry,
        basis: ctx.basis,
        remainingYears: ctx.userRemainingYears
    });
    return r.years;
};

const annualEventsLeft = (person, ctx) => round(sharedYearsWith(person, ctx));

const meetingsLeft = (person, ctx) => {
    const r = calculateTimeWithPerson({
        person,
        userAge: ctx.userAge,
        country: ctx.userCountry,
        basis: ctx.basis,
        remainingYears: ctx.userRemainingYears
    });
    return round(r.meetings);
};

export const TEMPLATES = [
    // §8 Q+A trio
    {
        id: 'drinking_party',
        requires: ['child'],
        compute: (ctx) => {
            const child = ctx.peopleByRelationship.child[0];
            const weekends = round(sharedYearsWith(child, ctx) * 52);
            return {
                q: {
                    ja: 'その飲み会、本当に行く価値ある？',
                    en: 'Is that drinking party really worth going to?'
                },
                a: {
                    ja: `${child.name}と過ごせる週末：あと${weekends}回`,
                    en: `Weekends with ${child.name}: ${weekends} remaining`
                }
            };
        }
    },
    {
        id: 'work_today',
        requires: ['parent'],
        compute: (ctx) => {
            const parent = ctx.peopleByRelationship.parent[0];
            const newYears = annualEventsLeft(parent, ctx);
            return {
                q: {
                    ja: 'その仕事、今日じゃなきゃダメ？',
                    en: 'Does that work really have to be today?'
                },
                a: {
                    ja: `${parent.name}と過ごせるお正月：あと${newYears}回`,
                    en: `New Year's with ${parent.name}: ${newYears} remaining`
                }
            };
        }
    },
    {
        id: 'anger',
        requires: ['anyPerson'],
        compute: (ctx) => {
            const target = ctx.people[0];
            const m = meetingsLeft(target, ctx);
            return {
                q: {
                    ja: 'その怒り、持ち続ける意味ある？',
                    en: 'Is it worth holding onto that anger?'
                },
                a: {
                    ja: `${target.name}と話せる機会：あと${m}回かもしれない`,
                    en: `Chances to talk with ${target.name}: maybe ${m} left`
                }
            };
        }
    },

    // §9 examples
    {
        id: 'christmas_child',
        requires: ['child'],
        compute: (ctx) => {
            const child = ctx.peopleByRelationship.child[0];
            const xmas = annualEventsLeft(child, ctx);
            return {
                q: { ja: '今年のクリスマス、誰と過ごす？', en: 'Who will you spend this Christmas with?' },
                a: {
                    ja: `${child.name}と過ごせるクリスマス：残り${xmas}回`,
                    en: `Christmases with ${child.name}: only ${xmas} left`
                }
            };
        }
    },
    {
        id: 'shrine_mother',
        requires: ['parent'],
        compute: (ctx) => {
            const parent = ctx.peopleByRelationship.parent[0];
            const visits = annualEventsLeft(parent, ctx);
            return {
                q: { ja: 'いつまで一緒に出かけられる？', en: 'How many trips together do you have left?' },
                a: {
                    ja: `${parent.name}と一緒に初詣に行けるのは、あと${visits}回かもしれません`,
                    en: `New Year shrine visits with ${parent.name}: maybe ${visits} more`
                }
            };
        }
    },
    {
        id: 'age_summer',
        requires: [],
        compute: (ctx) => {
            const ageInt = Math.floor(ctx.userAge);
            return {
                q: { ja: 'この夏、何をしますか？', en: 'What will you do this summer?' },
                a: {
                    ja: `${ageInt}歳の夏は、今年が最後です`,
                    en: `Your ${ageInt}${ordinal(ageInt)} summer is this year's only one`
                }
            };
        }
    },
    {
        id: 'dislike_person',
        requires: ['anyPerson'],
        compute: (ctx) => {
            const someone = ctx.people[0];
            return {
                q: {
                    ja: '嫌いな人に時間を使う価値、本当にある？',
                    en: 'Is it really worth spending time on people you dislike?'
                },
                a: {
                    ja: `嫌いな人に1時間使うと、${someone.name}との時間が1時間減ります`,
                    en: `Every hour spent on someone you dislike is an hour less with ${someone.name}`
                }
            };
        }
    },
    {
        id: 'universe_others',
        requires: [],
        compute: (ctx) => ({
            q: { ja: '誰の宇宙に、あなたはいますか？', en: "Whose universe are you in?" },
            a: {
                ja: `あなたが${ctx.people.length}人を選んだように、誰かの宇宙にあなたは存在します`,
                en: `Just as you chose ${ctx.people.length} people, you exist in someone's universe`
            }
        })
    },
    {
        id: 'life_percent',
        requires: [],
        compute: (ctx) => {
            const lived = Math.round(ctx.userLifePercentLived);
            const remaining = 100 - lived;
            return {
                q: { ja: `あなたは人生の${lived}%を過ごしました。`, en: `You've lived ${lived}% of your life.` },
                a: {
                    ja: `残り${remaining}%で何をしますか？`,
                    en: `What will you do with the remaining ${remaining}%?`
                }
            };
        }
    },
    {
        id: 'universe_contact',
        requires: ['anyPerson'],
        compute: (ctx) => ({
            q: { ja: '今日、誰かに連絡しましたか？', en: 'Did you reach out to anyone today?' },
            a: {
                ja: `あなたの宇宙には${ctx.people.length}人の星がいます`,
                en: `Your universe has ${ctx.people.length} stars`
            }
        })
    },
    {
        id: 'mother_thanks',
        requires: ['parent'],
        compute: (ctx) => {
            const parent = ctx.peopleByRelationship.parent[0];
            const m = meetingsLeft(parent, ctx);
            return {
                q: {
                    ja: `${parent.name}に「ありがとう」を伝えましたか？`,
                    en: `Have you said "thank you" to ${parent.name}?`
                },
                a: {
                    ja: `${parent.name}に直接「ありがとう」を言える回数は、あと${m}回`,
                    en: `Chances to say "thank you" to ${parent.name} in person: ${m} left`
                }
            };
        }
    },
    {
        id: 'say_sorry',
        requires: [],
        compute: () => ({
            q: { ja: '言えていない「ごめんね」はありませんか？', en: "Is there a 'sorry' you haven't said?" },
            a: {
                ja: '「ごめんね」を言えるチャンスは、今日が最後かもしれない',
                en: 'The chance to say "I\'m sorry" might end today'
            }
        })
    },
    {
        id: 'that_way',
        requires: [],
        compute: () => ({
            q: { ja: 'その言い方で、本当に伝わりますか？', en: 'Is that really how you want to say it?' },
            a: {
                ja: '言葉は時間と同じく、戻せない',
                en: 'Words, like time, cannot be taken back'
            }
        })
    },
    {
        id: 'next_time',
        requires: [],
        compute: () => ({
            q: { ja: '「また今度」は、本当に来ますか？', en: 'Will "next time" really come?' },
            a: {
                ja: '同じ人と2回会うことは、思ったより少ない',
                en: 'You meet most people fewer times than you expect'
            }
        })
    },

    // mentor templates (CONCEPT.md §5)
    {
        id: 'mentor_advice',
        requires: ['mentor'],
        compute: (ctx) => {
            const mentor = ctx.peopleByRelationship.mentor[0];
            const m = meetingsLeft(mentor, ctx);
            return {
                q: { ja: '今日、教えを請う相手はいますか？', en: 'Whose advice will you ask for today?' },
                a: {
                    ja: `${mentor.name}に話を聞ける機会：あと${m}回`,
                    en: `Chances to learn from ${mentor.name}: ${m} left`
                }
            };
        }
    },
    {
        id: 'mentor_inspiration',
        requires: ['mentor'],
        compute: (ctx) => {
            const mentor = ctx.peopleByRelationship.mentor[0];
            return {
                q: { ja: '中心にいる人を、本当に大切にしていますか？', en: 'Are you treasuring the person at the center?' },
                a: {
                    ja: `あなたの宇宙の中心は ${mentor.name} です`,
                    en: `${mentor.name} is at the center of your universe`
                }
            };
        }
    },

    // birthday template
    {
        id: 'birthday',
        requires: [],
        compute: (ctx) => {
            const ageInt = Math.floor(ctx.userAge);
            const remaining = round(ctx.userLifeExpectancy - ctx.userAge);
            return {
                q: { ja: '次の誕生日、どう過ごしますか？', en: 'How will you spend your next birthday?' },
                a: {
                    ja: `${ageInt}歳の誕生日は人生で最後の${ageInt}歳の誕生日です。残り${remaining}回ほど誕生日があります。`,
                    en: `Your ${ageInt}${ordinal(ageInt)} birthday is your only one. About ${remaining} birthdays left.`
                }
            };
        }
    }
];

function ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}
