// Single source of truth for country-level life data.
// Sources:
//   - Life expectancy: WHO Global Health Observatory (2021-2023 estimates)
//     https://www.who.int/data/gho/data/themes/topics/indicator-groups/indicator-group-details/GHO/life-expectancy-and-healthy-life-expectancy
//   - Working age limit: typical statutory retirement age, OECD reports
//   - Coordinates: capital / country centroid
//
// Each row drives the four legacy dictionaries below so the country sets
// stay in sync. Previously countryCoordinates and lifeExpectancyData had
// 13 mismatched entries, leading to silent UI breakage when users picked
// countries that one dict knew about but the other did not.

export const COUNTRIES = [
    { key: 'Japan',          nameJa: '日本',           nameEn: 'Japan',          lifeExpectancy: 84.6, healthyLifeExpectancy: 75.0, workingAgeLimit: 65, lat: 36.2048,  lng: 138.2529 },
    { key: 'Switzerland',    nameJa: 'スイス',         nameEn: 'Switzerland',    lifeExpectancy: 83.8, healthyLifeExpectancy: 73.0, workingAgeLimit: 65, lat: 46.8182,  lng:    8.2275 },
    { key: 'Singapore',      nameJa: 'シンガポール',   nameEn: 'Singapore',      lifeExpectancy: 83.6, healthyLifeExpectancy: 73.0, workingAgeLimit: 65, lat:  1.3521,  lng:  103.8198 },
    { key: 'Spain',          nameJa: 'スペイン',       nameEn: 'Spain',          lifeExpectancy: 83.6, healthyLifeExpectancy: 72.0, workingAgeLimit: 65, lat: 40.4637,  lng:   -3.7492 },
    { key: 'Italy',          nameJa: 'イタリア',       nameEn: 'Italy',          lifeExpectancy: 83.5, healthyLifeExpectancy: 72.0, workingAgeLimit: 67, lat: 41.8719,  lng:   12.5674 },
    { key: 'Australia',      nameJa: 'オーストラリア', nameEn: 'Australia',      lifeExpectancy: 83.4, healthyLifeExpectancy: 72.0, workingAgeLimit: 67, lat: -25.2744, lng:  133.7751 },
    { key: 'Iceland',        nameJa: 'アイスランド',   nameEn: 'Iceland',        lifeExpectancy: 83.0, healthyLifeExpectancy: 72.0, workingAgeLimit: 67, lat: 64.9631,  lng:  -19.0208 },
    { key: 'Israel',         nameJa: 'イスラエル',     nameEn: 'Israel',         lifeExpectancy: 83.0, healthyLifeExpectancy: 71.0, workingAgeLimit: 67, lat: 31.0461,  lng:   34.8516 },
    { key: 'South Korea',    nameJa: '韓国',           nameEn: 'South Korea',    lifeExpectancy: 83.0, healthyLifeExpectancy: 72.0, workingAgeLimit: 60, lat: 35.9078,  lng:  127.7669 },
    { key: 'Sweden',         nameJa: 'スウェーデン',   nameEn: 'Sweden',         lifeExpectancy: 82.8, healthyLifeExpectancy: 72.0, workingAgeLimit: 65, lat: 60.1282,  lng:   18.6435 },
    { key: 'France',         nameJa: 'フランス',       nameEn: 'France',         lifeExpectancy: 82.7, healthyLifeExpectancy: 71.0, workingAgeLimit: 62, lat: 46.2276,  lng:    2.2137 },
    { key: 'Canada',         nameJa: 'カナダ',         nameEn: 'Canada',         lifeExpectancy: 82.4, healthyLifeExpectancy: 71.0, workingAgeLimit: 65, lat: 56.1304,  lng: -106.3468 },
    { key: 'Norway',         nameJa: 'ノルウェー',     nameEn: 'Norway',         lifeExpectancy: 82.4, healthyLifeExpectancy: 71.0, workingAgeLimit: 67, lat: 60.4720,  lng:    8.4689 },
    { key: 'New Zealand',    nameJa: 'ニュージーランド', nameEn: 'New Zealand',  lifeExpectancy: 82.2, healthyLifeExpectancy: 71.0, workingAgeLimit: 65, lat: -40.9006, lng:  174.8860 },
    { key: 'Netherlands',    nameJa: 'オランダ',       nameEn: 'Netherlands',    lifeExpectancy: 82.0, healthyLifeExpectancy: 71.0, workingAgeLimit: 67, lat: 52.1326,  lng:    5.2913 },
    { key: 'Ireland',        nameJa: 'アイルランド',   nameEn: 'Ireland',        lifeExpectancy: 82.0, healthyLifeExpectancy: 70.0, workingAgeLimit: 66, lat: 53.1424,  lng:   -7.6921 },
    { key: 'Germany',        nameJa: 'ドイツ',         nameEn: 'Germany',        lifeExpectancy: 81.3, healthyLifeExpectancy: 70.0, workingAgeLimit: 67, lat: 51.1657,  lng:   10.4515 },
    { key: 'United Kingdom', nameJa: 'イギリス',       nameEn: 'United Kingdom', lifeExpectancy: 81.2, healthyLifeExpectancy: 70.0, workingAgeLimit: 66, lat: 55.3781,  lng:   -3.4360 },
    { key: 'Turkey',         nameJa: 'トルコ',         nameEn: 'Turkey',         lifeExpectancy: 78.6, healthyLifeExpectancy: 67.0, workingAgeLimit: 65, lat: 38.9637,  lng:   35.2433 },
    { key: 'United States',  nameJa: 'アメリカ',       nameEn: 'United States',  lifeExpectancy: 77.3, healthyLifeExpectancy: 68.0, workingAgeLimit: 65, lat: 37.0902,  lng:  -95.7129 },
    { key: 'China',          nameJa: '中国',           nameEn: 'China',          lifeExpectancy: 77.4, healthyLifeExpectancy: 68.0, workingAgeLimit: 60, lat: 35.8617,  lng:  104.1954 },
    { key: 'Saudi Arabia',   nameJa: 'サウジアラビア', nameEn: 'Saudi Arabia',   lifeExpectancy: 76.9, healthyLifeExpectancy: 67.0, workingAgeLimit: 60, lat: 23.8859,  lng:   45.0792 },
    { key: 'Brazil',         nameJa: 'ブラジル',       nameEn: 'Brazil',         lifeExpectancy: 75.9, healthyLifeExpectancy: 66.0, workingAgeLimit: 65, lat: -14.2350, lng:  -51.9253 },
    { key: 'Mexico',         nameJa: 'メキシコ',       nameEn: 'Mexico',         lifeExpectancy: 75.0, healthyLifeExpectancy: 67.0, workingAgeLimit: 65, lat: 23.6345,  lng: -102.5528 },
    { key: 'Russia',         nameJa: 'ロシア',         nameEn: 'Russia',         lifeExpectancy: 73.4, healthyLifeExpectancy: 64.0, workingAgeLimit: 60, lat: 61.5240,  lng:  105.3188 },
    { key: 'Indonesia',      nameJa: 'インドネシア',   nameEn: 'Indonesia',      lifeExpectancy: 71.7, healthyLifeExpectancy: 62.0, workingAgeLimit: 58, lat: -0.7893,  lng:  113.9213 },
    { key: 'India',          nameJa: 'インド',         nameEn: 'India',          lifeExpectancy: 69.7, healthyLifeExpectancy: 60.0, workingAgeLimit: 60, lat: 20.5937,  lng:   78.9629 },
    { key: 'South Africa',   nameJa: '南アフリカ',     nameEn: 'South Africa',   lifeExpectancy: 64.1, healthyLifeExpectancy: 58.0, workingAgeLimit: 60, lat: -30.5595, lng:   22.9375 },
    { key: 'Nigeria',        nameJa: 'ナイジェリア',   nameEn: 'Nigeria',        lifeExpectancy: 54.7, healthyLifeExpectancy: 50.0, workingAgeLimit: 60, lat:  9.0820,  lng:    8.6753 },
    { key: 'Global',         nameJa: 'グローバル',     nameEn: 'Global',         lifeExpectancy: 73.2, healthyLifeExpectancy: 64.0, workingAgeLimit: 65, lat:  0,       lng:    0       }
];

const indexBy = (field) => Object.fromEntries(COUNTRIES.map((c) => [c.key, c[field]]));

// Legacy dicts derived from COUNTRIES so they cannot drift apart again.
export const lifeExpectancyData = indexBy('lifeExpectancy');
export const healthyLifeExpectancyData = indexBy('healthyLifeExpectancy');
export const workingAgeLimitData = indexBy('workingAgeLimit');
export const countryCoordinates = Object.fromEntries(
    COUNTRIES.map((c) => [c.key, { lat: c.lat, lng: c.lng }])
);

// Average daily time usage in hours (approximate global averages)
export const dailyTimeUsage = {
    Sleep: 8,
    Work: 8,
    Chores: 2,
    Eating: 1.5,
    Commute: 1,
    "Personal Care": 1,
    "Screen Time": 3
};

export const lifeMoments = {
    "Time with Parents": {
        visitsPerYear: 12,
        hoursPerVisit: 6,
        description: "Remaining visits with parents"
    },
    "Time with Children": {
        yearsActive: 18,
        hoursPerDay: 3,
        description: "Quality time with your children"
    },
    "Time with Partner": {
        hoursPerDay: 2,
        description: "Quality time with your partner"
    },
    "Time with Close Friends": {
        meetingsPerYear: 24,
        hoursPerMeeting: 4,
        description: "Meaningful time with close friends"
    },
    "Vacations & Travel": {
        tripsPerYear: 2,
        daysPerTrip: 7,
        description: "Travel and vacation experiences"
    },
    "Personal Growth": {
        hoursPerDay: 3,
        targetHours: 10000,
        targetAge: 40,
        description: "Learning, hobbies, self-improvement - Path to mastery"
    }
};

export const calculateLifeStats = (country, age, customExpectancy = null) => {
    const expectancy = customExpectancy || lifeExpectancyData[country] || lifeExpectancyData["Global"];
    const remainingYears = Math.max(0, expectancy - age);
    const totalWeeks = expectancy * 52.1429;
    const livedWeeks = age * 52.1429;
    const remainingWeeks = remainingYears * 52.1429;
    const remainingSeconds = remainingYears * 365.25 * 24 * 60 * 60;

    const breakdown = {};

    const parentLifeExpectancy = 80;
    const parentAge = age + 30;
    const yearsWithParents = Math.max(0, parentLifeExpectancy - parentAge);
    breakdown["Time with Parents"] = Math.min(
        yearsWithParents * lifeMoments["Time with Parents"].visitsPerYear * lifeMoments["Time with Parents"].hoursPerVisit,
        remainingYears * lifeMoments["Time with Parents"].visitsPerYear * lifeMoments["Time with Parents"].hoursPerVisit
    );

    if (age < 60) {
        const childYears = Math.min(lifeMoments["Time with Children"].yearsActive, remainingYears);
        breakdown["Time with Children"] = childYears * 365.25 * lifeMoments["Time with Children"].hoursPerDay;
    }

    breakdown["Time with Partner"] = remainingYears * 365.25 * lifeMoments["Time with Partner"].hoursPerDay;
    breakdown["Time with Close Friends"] = remainingYears * lifeMoments["Time with Close Friends"].meetingsPerYear * lifeMoments["Time with Close Friends"].hoursPerMeeting;
    breakdown["Vacations & Travel"] = remainingYears * lifeMoments["Vacations & Travel"].tripsPerYear * lifeMoments["Vacations & Travel"].daysPerTrip * 12;
    breakdown["Personal Growth"] = remainingYears * 365.25 * lifeMoments["Personal Growth"].hoursPerDay;

    return {
        expectancy,
        remainingYears,
        remainingWeeks,
        remainingSeconds,
        breakdown
    };
};

export const translations = {
    "Japan": {
        tagline: "あなたの人生、残り時間を可視化します。",
        whereLive: "どこに住んでいますか？",
        howOld: "何歳ですか？",
        birthdate: "生年月日",
        visualize: "可視化する",
        lifeExpectancy: "平均寿命",
        timeLived: "過ごした時間",
        remaining: "残りの時間",
        lifeInWeeks: "人生（週間）",
        remainingSeconds: "残り",
        lifeTitle: (years) => `人生 ${years} 年だとしたら`,
        timeMessage: "かけがえのない、今この瞬間",
        breakdownTitle: "残りの人生の内訳",
        startOver: "最初に戻る",
        years: "歳",
        durationYears: "年",
        days: "日",
        hours: "時間",
        minutes: "分",
        seconds: "秒",
        approxYears: "約",
        storyPart1: "あなたは",
        storyPart2: "を過ごしました。",
        storyPart3: "残りは",
        storyPart4: "です。",
        activities: {
            "Time with Parents": "親と過ごせる時間",
            "Time with Children": "子どもと過ごせる時間",
            "Time with Partner": "パートナーと過ごせる時間",
            "Time with Close Friends": "親友と過ごせる時間",
            "Vacations & Travel": "旅行・バケーション",
            "Personal Growth": "自己成長の時間"
        }
    },
    "United States": {
        whereLive: "WHERE DO YOU LIVE?",
        howOld: "HOW OLD ARE YOU?",
        visualize: "VISUALIZE MY LIFE",
        tagline: "Time is limited. Are you truly spending yours?",
        lifeExpectancy: "Life Expectancy",
        timeLived: "Time Lived",
        remaining: "Remaining",
        lifeInWeeks: "Your Life in Weeks",
        remainingSeconds: "Remaining",
        lifeTitle: (years) => `If life were ${years} years`,
        timeMessage: "Every moment is precious",
        breakdownTitle: "Where will your remaining time go?",
        startOver: "Start Over",
        years: "Years",
        durationYears: "Years",
        days: "Days",
        hours: "Hours",
        minutes: "Mins",
        seconds: "Secs",
        approxYears: "approx.",
        storyPart1: "You've lived",
        storyPart2: ".",
        storyPart3: "You have",
        storyPart4: "remaining.",
        activities: {
            "Time with Parents": "Time with Parents",
            "Time with Children": "Time with Children",
            "Time with Partner": "Time with Partner",
            "Time with Close Friends": "Time with Close Friends",
            "Vacations & Travel": "Vacations & Travel",
            "Personal Growth": "Personal Growth"
        }
    },
    "default": {
        whereLive: "WHERE DO YOU LIVE?",
        howOld: "HOW OLD ARE YOU?",
        visualize: "VISUALIZE MY LIFE",
        tagline: "Time is limited. Are you truly spending yours?",
        lifeExpectancy: "Life Expectancy",
        timeLived: "Time Lived",
        remaining: "Remaining",
        lifeInWeeks: "Your Life in Weeks",
        remainingSeconds: "Remaining",
        lifeTitle: (years) => `If life were ${years} years`,
        timeMessage: "Every moment is precious",
        breakdownTitle: "Where will your remaining time go?",
        startOver: "Start Over",
        years: "Years",
        durationYears: "Years",
        days: "Days",
        hours: "Hours",
        minutes: "Mins",
        seconds: "Secs",
        approxYears: "approx.",
        storyPart1: "You've lived",
        storyPart2: ".",
        storyPart3: "You have",
        storyPart4: "remaining.",
        activities: {
            "Time with Parents": "Time with Parents",
            "Time with Children": "Time with Children",
            "Time with Partner": "Time with Partner",
            "Time with Close Friends": "Time with Close Friends",
            "Vacations & Travel": "Vacations & Travel",
            "Personal Growth": "Personal Growth"
        }
    }
};
