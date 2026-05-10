// Shared helpers extracted from the original 1202-line Visualization.jsx.
// These format meeting frequencies and per-meeting durations into the
// label maps used by both the main visualization card and the
// PeopleSettings list.

export const FREQUENCY_LABELS_JP = {
    365: '毎日',
    104: '週に2回',
    52: '週に1回',
    24: '月に2回',
    12: '月に1回',
    1: '年に1回'
};

export const FREQUENCY_LABELS_EN = {
    365: 'Daily',
    104: 'Twice a week',
    52: 'Weekly',
    24: 'Twice a month',
    12: 'Monthly',
    1: 'Once a year'
};

export const HOURS_LABELS_JP = {
    0.5: '30分',
    1: '1時間',
    2: '2時間',
    3: '3時間',
    6: '半日',
    24: '1日'
};

export const HOURS_LABELS_EN = {
    0.5: '30 min',
    1: '1 hour',
    2: '2 hours',
    3: '3 hours',
    6: 'Half day',
    24: '1 day'
};

export function getFrequencyLabel(frequency, isJapan) {
    const map = isJapan ? FREQUENCY_LABELS_JP : FREQUENCY_LABELS_EN;
    if (map[frequency]) return map[frequency];
    if (isJapan) return `年に${frequency}回`;
    return `${frequency} times/year`;
}

export function getHoursLabel(hours, isJapan) {
    const map = isJapan ? HOURS_LABELS_JP : HOURS_LABELS_EN;
    if (map[hours]) return map[hours];
    const formatted = Number(hours).toString().replace(/\.0$/, '');
    if (isJapan) return `${formatted}時間`;
    const isPlural = Number(formatted) !== 1;
    return `${formatted} hour${isPlural ? 's' : ''}`;
}

export function getConditionText(person, isJapan) {
    const freqLabel = getFrequencyLabel(person.meetingFrequency || 0, isJapan);
    const hoursLabel = getHoursLabel(person.hoursPerMeeting || 0, isJapan);
    return `${freqLabel} × ${hoursLabel}`;
}

export const generateId = () =>
    Date.now().toString(36) + Math.random().toString(36).substr(2);
