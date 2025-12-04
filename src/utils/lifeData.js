// Life expectancy data (simplified for demo)
// Source: World Bank / WHO estimates (approximate)
export const lifeExpectancyData = {
    Japan: 84.6,
    Switzerland: 83.8,
    Singapore: 83.6,
    Spain: 83.6,
    Italy: 83.5,
    Australia: 83.4,
    Iceland: 83.0,
    Israel: 83.0,
    "South Korea": 83.0,
    Sweden: 82.8,
    France: 82.7,
    Canada: 82.4,
    Norway: 82.4,
    "New Zealand": 82.2,
    Netherlands: 82.0,
    Ireland: 82.0,
    Germany: 81.3,
    "United Kingdom": 81.2,
    "United States": 77.3,
    China: 77.4,
    India: 69.7,
    Brazil: 75.9,
    Nigeria: 54.7,
    "South Africa": 64.1,
    Global: 73.2
};

// Healthy life expectancy (健康寿命) - years of healthy, independent living
// Source: WHO Global Health Observatory
export const healthyLifeExpectancyData = {
    Japan: 75.0,
    Switzerland: 73.0,
    Singapore: 73.0,
    Spain: 72.0,
    Italy: 72.0,
    Australia: 72.0,
    Iceland: 72.0,
    Israel: 71.0,
    "South Korea": 72.0,
    Sweden: 72.0,
    France: 71.0,
    Canada: 71.0,
    Norway: 71.0,
    "New Zealand": 71.0,
    Netherlands: 71.0,
    Ireland: 70.0,
    Germany: 70.0,
    "United Kingdom": 70.0,
    "United States": 68.0,
    China: 68.0,
    India: 60.0,
    Brazil: 66.0,
    Nigeria: 50.0,
    "South Africa": 58.0,
    Global: 64.0
};

// Working age limit (定年退職年齢) - typical retirement age
export const workingAgeLimitData = {
    Japan: 65,
    Switzerland: 65,
    Singapore: 65,
    Spain: 65,
    Italy: 67,
    Australia: 67,
    Iceland: 67,
    Israel: 67,
    "South Korea": 60,
    Sweden: 65,
    France: 62,
    Canada: 65,
    Norway: 67,
    "New Zealand": 65,
    Netherlands: 67,
    Ireland: 66,
    Germany: 67,
    "United Kingdom": 66,
    "United States": 65,
    China: 60,
    India: 60,
    Brazil: 65,
    Nigeria: 60,
    "South Africa": 60,
    Global: 65
};

export const countryCoordinates = {
    "Japan": { lat: 36.2048, lng: 138.2529 },
    "United States": { lat: 37.0902, lng: -95.7129 },
    "United Kingdom": { lat: 55.3781, lng: -3.4360 },
    "Germany": { lat: 51.1657, lng: 10.4515 },
    "France": { lat: 46.2276, lng: 2.2137 },
    "Italy": { lat: 41.8719, lng: 12.5674 },
    "Canada": { lat: 56.1304, lng: -106.3468 },
    "Australia": { lat: -25.2744, lng: 133.7751 },
    "Brazil": { lat: -14.2350, lng: -51.9253 },
    "China": { lat: 35.8617, lng: 104.1954 },
    "India": { lat: 20.5937, lng: 78.9629 },
    "Russia": { lat: 61.5240, lng: 105.3188 },
    "South Korea": { lat: 35.9078, lng: 127.7669 },
    "Mexico": { lat: 23.6345, lng: -102.5528 },
    "Spain": { lat: 40.4637, lng: -3.7492 },
    "Turkey": { lat: 38.9637, lng: 35.2433 },
    "Indonesia": { lat: -0.7893, lng: 113.9213 },
    "Netherlands": { lat: 52.1326, lng: 5.2913 },
    "Saudi Arabia": { lat: 23.8859, lng: 45.0792 },
    "Switzerland": { lat: 46.8182, lng: 8.2275 },
    "Global": { lat: 0, lng: 0 }
};

// Average daily time usage in hours (approximate global averages)
export const dailyTimeUsage = {
    Sleep: 8,
    Work: 8, // Assuming working age, 5 days a week -> averaged over 7 days approx 5.7h, but let's stick to a standard "work day" concept for impact or adjust logic.
    // Better approach: 8 hours work for 5 days = 40 hours. 40/7 = 5.7 hours/day average over a lifetime? 
    // Let's use a more "typical day" breakdown for the visualization impact.
    Chores: 2, // Cooking, cleaning, shopping
    Eating: 1.5,
    Commute: 1,
    "Personal Care": 1, // Shower, grooming
    "Screen Time": 3, // Social media, TV (discretionary but often wasted)
};

// Meaningful life moments - average frequencies
export const lifeMoments = {
    "Time with Parents": {
        visitsPerYear: 12, // Once a month average
        hoursPerVisit: 6,
        description: "Remaining visits with parents"
    },
    "Time with Children": {
        yearsActive: 18, // Active parenting years
        hoursPerDay: 3,
        description: "Quality time with your children"
    },
    "Time with Partner": {
        hoursPerDay: 2,
        description: "Quality time with your partner"
    },
    "Time with Close Friends": {
        meetingsPerYear: 24, // Twice a month
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
        targetHours: 10000, // Based on "10,000-Hour Rule" (Malcolm Gladwell, Outliers)
        targetAge: 40, // Default target age for mastery
        description: "Learning, hobbies, self-improvement - Path to mastery"
    }
};

export const calculateLifeStats = (country, age, customExpectancy = null) => {
    const expectancy = customExpectancy || lifeExpectancyData[country] || lifeExpectancyData["Global"];
    const remainingYears = Math.max(0, expectancy - age);
    const totalWeeks = expectancy * 52.1429;
    const livedWeeks = age * 52.1429;
    const remainingWeeks = remainingYears * 52.1429;

    // Calculate remaining seconds (for countdown)
    const remainingSeconds = remainingYears * 365.25 * 24 * 60 * 60;

    // Calculate meaningful moments breakdown
    const breakdown = {};

    // Time with Parents (assuming parents live to ~80)
    const parentLifeExpectancy = 80;
    const parentAge = age + 30; // Rough estimate
    const yearsWithParents = Math.max(0, parentLifeExpectancy - parentAge);
    breakdown["Time with Parents"] = Math.min(
        yearsWithParents * lifeMoments["Time with Parents"].visitsPerYear * lifeMoments["Time with Parents"].hoursPerVisit,
        remainingYears * lifeMoments["Time with Parents"].visitsPerYear * lifeMoments["Time with Parents"].hoursPerVisit
    );

    // Time with Children (if applicable, assuming children are young)
    if (age < 60) {
        const childYears = Math.min(lifeMoments["Time with Children"].yearsActive, remainingYears);
        breakdown["Time with Children"] = childYears * 365.25 * lifeMoments["Time with Children"].hoursPerDay;
    }

    // Time with Partner
    breakdown["Time with Partner"] = remainingYears * 365.25 * lifeMoments["Time with Partner"].hoursPerDay;

    // Time with Close Friends
    breakdown["Time with Close Friends"] = remainingYears * lifeMoments["Time with Close Friends"].meetingsPerYear * lifeMoments["Time with Close Friends"].hoursPerMeeting;

    // Vacations & Travel
    breakdown["Vacations & Travel"] = remainingYears * lifeMoments["Vacations & Travel"].tripsPerYear * lifeMoments["Vacations & Travel"].daysPerTrip * 12; // 12 waking hours per day

    // Personal Growth
    breakdown["Personal Growth"] = remainingYears * 52.1429 * lifeMoments["Personal Growth"].hoursPerWeek;

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
        timeMessage: "かけがえのない、今この瞬間",
        breakdownTitle: "残りの人生の内訳",
        startOver: "最初に戻る",
        years: "歳", // For age
        durationYears: "年", // For duration
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
        remainingSeconds: "Time Remaining",
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
    // Default fallback (English)
    "default": {
        whereLive: "WHERE DO YOU LIVE?",
        howOld: "HOW OLD ARE YOU?",
        visualize: "VISUALIZE MY LIFE",
        tagline: "Time is limited. Are you truly spending yours?",
        lifeExpectancy: "Life Expectancy",
        timeLived: "Time Lived",
        remaining: "Remaining",
        lifeInWeeks: "Your Life in Weeks",
        remainingSeconds: "Time Remaining",
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
