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
    },

    // Parent-related (additional)
    {
        id: 'parent_call_today',
        requires: ['parent'],
        compute: (ctx) => {
            const parent = ctx.peopleByRelationship.parent[0];
            const m = meetingsLeft(parent, ctx);
            return {
                q: { ja: '今日、親に電話しましたか？', en: 'Did you call your parent today?' },
                a: {
                    ja: `${parent.name}と直接話せる機会：あと${m}回`,
                    en: `Phone calls with ${parent.name} you can still have: ${m} left`
                }
            };
        }
    },
    {
        id: 'parent_meal',
        requires: ['parent'],
        compute: (ctx) => {
            const parent = ctx.peopleByRelationship.parent[0];
            const meals = round(sharedYearsWith(parent, ctx) * 6); // ~6 shared meals/year, conservative
            return {
                q: { ja: '親と食事した最後はいつ？', en: 'When was your last meal with your parent?' },
                a: {
                    ja: `${parent.name}と一緒に食べられる食事：あと${meals}回ほど`,
                    en: `Meals with ${parent.name} still ahead: about ${meals}`
                }
            };
        }
    },
    {
        id: 'parent_words',
        requires: ['parent'],
        compute: (ctx) => {
            const parent = ctx.peopleByRelationship.parent[0];
            const yearsLeft = Math.max(1, round(sharedYearsWith(parent, ctx)));
            return {
                q: { ja: '親に伝えたい言葉、いつ言いますか？', en: 'When will you say what you want to tell your parent?' },
                a: {
                    ja: `${parent.name}に直接伝えられる時間：残り約${yearsLeft}年`,
                    en: `Time left to speak directly with ${parent.name}: about ${yearsLeft} years`
                }
            };
        }
    },

    // Child-related (additional)
    {
        id: 'child_bedtime',
        requires: ['child'],
        compute: (ctx) => {
            const child = ctx.peopleByRelationship.child[0];
            // Bedtime stories ~ until age 12; if child is older, return zero gracefully.
            const childAge = child.age ?? 8;
            const yearsLeft = Math.max(0, 12 - childAge);
            const nights = round(yearsLeft * 365);
            return {
                q: { ja: '今夜、絵本を読んであげましたか？', en: 'Did you read a bedtime story tonight?' },
                a: {
                    ja: `${child.name}を寝かしつけられる夜：あと約${nights}回`,
                    en: `Bedtime stories for ${child.name}: about ${nights} left`
                }
            };
        }
    },
    {
        id: 'child_sports_day',
        requires: ['child'],
        compute: (ctx) => {
            const child = ctx.peopleByRelationship.child[0];
            const childAge = child.age ?? 8;
            // Sports day applies until ~age 18 (school years).
            const yearsLeft = Math.max(0, 18 - childAge);
            return {
                q: { ja: 'あと何回、運動会を見に行けますか？', en: 'How many more sports days will you attend?' },
                a: {
                    ja: `${child.name}の運動会：残り約${yearsLeft}回`,
                    en: `${child.name}'s sports days remaining: about ${yearsLeft}`
                }
            };
        }
    },
    {
        id: 'child_birthday_count',
        requires: ['child'],
        compute: (ctx) => {
            const child = ctx.peopleByRelationship.child[0];
            const childAge = child.age ?? 8;
            const yearsLeft = Math.max(0, round(sharedYearsWith(child, ctx)));
            return {
                q: { ja: '次の誕生日、何歳のお祝いをしますか？', en: 'Whose next birthday is coming up?' },
                a: {
                    ja: `${child.name}と一緒に祝える誕生日：あと${yearsLeft}回`,
                    en: `Birthdays you can celebrate with ${child.name}: ${yearsLeft} left`
                }
            };
        }
    },

    // Partner / spouse
    {
        id: 'partner_dinner',
        requires: ['spouse'],
        compute: (ctx) => {
            const partner = ctx.peopleByRelationship.spouse[0];
            const dinners = round(sharedYearsWith(partner, ctx) * 365);
            return {
                q: { ja: '今夜、パートナーと向き合って話せていますか？', en: 'Did you really talk with your partner tonight?' },
                a: {
                    ja: `${partner.name}と一緒に食べる夕飯：残り約${dinners}回`,
                    en: `Dinners with ${partner.name}: about ${dinners} left`
                }
            };
        }
    },
    {
        id: 'partner_anniversary',
        requires: ['partner'],
        compute: (ctx) => {
            const partner = ctx.peopleByRelationship.partner[0];
            const anniv = annualEventsLeft(partner, ctx);
            return {
                q: { ja: '次の記念日、覚えていますか？', en: 'Do you remember your next anniversary?' },
                a: {
                    ja: `${partner.name}と迎えられる記念日：あと${anniv}回`,
                    en: `Anniversaries with ${partner.name}: ${anniv} left`
                }
            };
        }
    },
    {
        id: 'partner_morning',
        requires: ['spouse'],
        compute: (ctx) => {
            const partner = ctx.peopleByRelationship.spouse[0];
            const mornings = round(sharedYearsWith(partner, ctx) * 365);
            return {
                q: { ja: '「おはよう」を言えていますか？', en: 'Have you said "good morning" today?' },
                a: {
                    ja: `${partner.name}と一緒に迎える朝：残り約${mornings}回`,
                    en: `Mornings with ${partner.name}: about ${mornings} left`
                }
            };
        }
    },

    // Friend
    {
        id: 'friend_laugh',
        requires: ['friend'],
        compute: (ctx) => {
            const friend = ctx.peopleByRelationship.friend[0];
            const m = meetingsLeft(friend, ctx);
            return {
                q: { ja: '最後に親友と笑ったのはいつ？', en: 'When did you last laugh with a close friend?' },
                a: {
                    ja: `${friend.name}と過ごせる回数：あと${m}回`,
                    en: `Times you can hang out with ${friend.name}: ${m} left`
                }
            };
        }
    },
    {
        id: 'friend_milestone',
        requires: ['friend'],
        compute: (ctx) => {
            const friend = ctx.peopleByRelationship.friend[0];
            const yearsLeft = round(sharedYearsWith(friend, ctx));
            return {
                q: { ja: '次の節目、誰と共有したいですか？', en: 'Who do you want by your side at the next milestone?' },
                a: {
                    ja: `${friend.name}と過ごせる年：あと${yearsLeft}年`,
                    en: `Years still ahead with ${friend.name}: ${yearsLeft}`
                }
            };
        }
    },

    // Sibling
    {
        id: 'sibling_call',
        requires: ['sibling'],
        compute: (ctx) => {
            const sib = ctx.peopleByRelationship.sibling[0];
            const m = meetingsLeft(sib, ctx);
            return {
                q: { ja: 'きょうだいと、最近どんな話をしましたか？', en: 'When did you last talk to your sibling?' },
                a: {
                    ja: `${sib.name}と話せる回数：あと${m}回`,
                    en: `Times you can talk with ${sib.name}: ${m} left`
                }
            };
        }
    },

    // Self / no-requires
    {
        id: 'self_dream',
        requires: [],
        compute: (ctx) => {
            const yearsLeft = round(ctx.userRemainingYears);
            return {
                q: { ja: '10年前の夢、覚えていますか？', en: 'Do you still remember the dream you had 10 years ago?' },
                a: {
                    ja: `あなたの残り人生：約${yearsLeft}年`,
                    en: `Your remaining life: about ${yearsLeft} years`
                }
            };
        }
    },
    {
        id: 'self_morning_count',
        requires: [],
        compute: (ctx) => {
            const mornings = round(ctx.userRemainingYears * 365);
            return {
                q: { ja: '次の朝が来るとは限らない', en: 'Tomorrow morning is not guaranteed' },
                a: {
                    ja: `残りの朝：約${mornings.toLocaleString()}回`,
                    en: `Mornings remaining: about ${mornings.toLocaleString()}`
                }
            };
        }
    },
    {
        id: 'self_courage',
        requires: [],
        compute: () => ({
            q: { ja: '今、半歩踏み出せることは何ですか？', en: 'What half-step can you take today?' },
            a: {
                ja: '大きな一歩より、半歩。今日できる',
                en: 'Half a step beats no step. You can today.'
            }
        })
    },
    {
        id: 'self_hour',
        requires: [],
        compute: (ctx) => {
            const hours = round(ctx.userRemainingYears * 365.25 * 24);
            return {
                q: { ja: 'この1時間、どこに使いますか？', en: 'Where will you spend this hour?' },
                a: {
                    ja: `あなたの残り時間：約${hours.toLocaleString()}時間`,
                    en: `Your remaining time: about ${hours.toLocaleString()} hours`
                }
            };
        }
    },
    {
        id: 'self_travel',
        requires: [],
        compute: (ctx) => {
            const yearsLeft = round(ctx.userRemainingYears);
            return {
                q: { ja: '行きたい場所、いくつ残っていますか？', en: 'How many places are still on your list?' },
                a: {
                    ja: `旅に出られる年：あと約${yearsLeft}年`,
                    en: `Years you can still travel: about ${yearsLeft}`
                }
            };
        }
    },

    // Universal — about gentleness, noise, choice
    {
        id: 'noise_irritation',
        requires: [],
        compute: () => ({
            q: { ja: 'そのイライラ、明日も覚えていますか？', en: 'Will you remember this frustration tomorrow?' },
            a: {
                ja: '心の中の雑音は、有限の時間を奪う',
                en: "Mental noise quietly steals from your limited time"
            }
        })
    },
    {
        id: 'gentle_today',
        requires: [],
        compute: () => ({
            q: { ja: '今日、誰かに優しくできましたか？', en: 'Were you gentle with someone today?' },
            a: {
                ja: '残り時間が見えると、人は自然と優しくなる',
                en: 'When time becomes visible, gentleness becomes natural'
            }
        })
    },
    {
        id: 'unspoken_words',
        requires: [],
        compute: () => ({
            q: { ja: '言わずに後悔した言葉はありますか？', en: 'Are there words you regret not saying?' },
            a: {
                ja: '「ごめんね」「ありがとう」は、今日言える',
                en: '"Sorry" and "thank you" can both be said today'
            }
        })
    },
    {
        id: 'future_self_choice',
        requires: [],
        compute: (ctx) => {
            const yearsLeft = round(ctx.userRemainingYears);
            return {
                q: { ja: '10年後の自分は、今の選択を喜びますか？', en: 'Will your future self be glad of today\'s choice?' },
                a: {
                    ja: `残り${yearsLeft}年の選択を、未来のあなたが見ています`,
                    en: `Your future self is watching the next ${yearsLeft} years of choices`
                }
            };
        }
    },
    {
        id: 'phone_doomscroll',
        requires: ['anyPerson'],
        compute: (ctx) => {
            const someone = ctx.people[0];
            const minutes = round(sharedYearsWith(someone, ctx) * 60); // 1 hr per year baseline
            return {
                q: { ja: 'スマホを見ていた1時間、誰の時間でしたか？', en: 'That hour scrolling — whose hour was it?' },
                a: {
                    ja: `1時間スクロールすると、${someone.name}との時間が1時間減る`,
                    en: `An hour of scrolling is an hour less with ${someone.name}`
                }
            };
        }
    },
    {
        id: 'half_step',
        requires: [],
        compute: () => ({
            q: { ja: '勇気とは、大きな一歩ではなく半歩のこと', en: 'Courage is half a step, not a leap' },
            a: {
                ja: '半歩なら、今日踏み出せる',
                en: 'Half a step is something you can take today'
            }
        })
    },
    {
        id: 'star_count',
        requires: ['anyPerson'],
        compute: (ctx) => {
            const n = ctx.people.length;
            return {
                q: { ja: `${n}人を選んだあなたは、本当に${n}人を大切にできていますか？`, en: `You chose ${n} people. Are you treating them as ${n}?` },
                a: {
                    ja: `あなたの宇宙に存在する星：${n}個`,
                    en: `Stars in your universe: ${n}`
                }
            };
        }
    },
    {
        id: 'meaningless_meeting',
        requires: ['anyPerson'],
        compute: (ctx) => {
            const target = ctx.people[0];
            return {
                q: { ja: 'その予定、本当に必要？', en: 'Is that meeting really necessary?' },
                a: {
                    ja: `空いた1時間で、${target.name}に連絡できる`,
                    en: `Free that hour and reach out to ${target.name}`
                }
            };
        }
    },
    {
        id: 'ten_years_summer',
        requires: [],
        compute: (ctx) => {
            const yearsLeft = round(ctx.userRemainingYears);
            const summersLeft = yearsLeft;
            return {
                q: { ja: '10回の夏、どう過ごしますか？', en: 'How will you spend your next 10 summers?' },
                a: {
                    ja: `残りの夏：約${summersLeft}回`,
                    en: `Summers remaining: about ${summersLeft}`
                }
            };
        }
    },
    {
        id: 'compliment_today',
        requires: ['anyPerson'],
        compute: (ctx) => {
            const someone = ctx.people[0];
            return {
                q: { ja: '今日、誰かを褒めましたか？', en: 'Did you give someone a compliment today?' },
                a: {
                    ja: `${someone.name}に伝えていない言葉、ありませんか`,
                    en: `Are there words you haven't said to ${someone.name}?`
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
