import React, { useEffect, useState, useRef, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { calculateLifeStats, translations, lifeExpectancyData, healthyLifeExpectancyData, workingAgeLimitData } from '../utils/lifeData';
import EnergyTank from './EnergyTank';

const FREQUENCY_LABELS_JP = {
    365: '毎日',
    104: '週に2回',
    52: '週に1回',
    24: '月に2回',
    12: '月に1回',
    1: '年に1回'
};

const FREQUENCY_LABELS_EN = {
    365: 'Daily',
    104: 'Twice a week',
    52: 'Weekly',
    24: 'Twice a month',
    12: 'Monthly',
    1: 'Once a year'
};

const HOURS_LABELS_JP = {
    0.5: '30分',
    1: '1時間',
    2: '2時間',
    3: '3時間',
    6: '半日',
    24: '1日'
};

const HOURS_LABELS_EN = {
    0.5: '30 min',
    1: '1 hour',
    2: '2 hours',
    3: '3 hours',
    6: 'Half day',
    24: '1 day'
};

const getFrequencyLabel = (frequency, isJapan) => {
    const map = isJapan ? FREQUENCY_LABELS_JP : FREQUENCY_LABELS_EN;
    if (map[frequency]) return map[frequency];
    if (isJapan) {
        return `年に${frequency}回`;
    }
    return `${frequency} times/year`;
};

const getHoursLabel = (hours, isJapan) => {
    const map = isJapan ? HOURS_LABELS_JP : HOURS_LABELS_EN;
    if (map[hours]) return map[hours];
    const formatted = Number(hours).toString().replace(/\.0$/, '');
    if (isJapan) {
        return `${formatted}時間`;
    }
    const isPlural = Number(formatted) !== 1;
    return `${formatted} hour${isPlural ? 's' : ''}`;
};

const getConditionText = (person, isJapan) => {
    const freqLabel = getFrequencyLabel(person.meetingFrequency || 0, isJapan);
    const hoursLabel = getHoursLabel(person.hoursPerMeeting || 0, isJapan);
    return `${freqLabel} × ${hoursLabel}`;
};

// Generate unique ID
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Calculate age from birthdate or use direct age
const calculateAge = (person) => {
    // If age is directly specified, use it
    if (person.age !== undefined && person.age !== null) {
        return Number(person.age);
    }
    
    // Otherwise calculate from birthdate
    if (!person.birthYear || !person.birthMonth || !person.birthDay) return null;
    
    const today = new Date();
    const birthDate = new Date(person.birthYear, person.birthMonth - 1, person.birthDay);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
    }
    
    const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    const lastBirthday = new Date(nextBirthday);
    lastBirthday.setFullYear(nextBirthday.getFullYear() - 1);
    
    const yearProgress = (today - lastBirthday) / (nextBirthday - lastBirthday);
    return age + yearProgress;
};

    // Calculate hours with a person
    // Thought: Relationships are defined by shared time, not just shared blood or titles.
    // 思考：関係性とは、血縁や肩書きではなく、共有された「時間」によって定義される。
const calculateHoursWithPerson = (person, userAge, userCountry, remainingYears) => {
    const personAge = calculateAge(person);
    if (personAge === null) return 0;
    
    // 対象が自分より若い場合 → 自分の平均寿命をリミットとして使用
    // 対象が自分より年上の場合 → 対象の平均寿命をリミットとして使用
    const userLifeExpectancy = lifeExpectancyData[userCountry] || lifeExpectancyData['Global'];
    const personLifeExpectancy = userLifeExpectancy; // 同じ国の平均寿命を使用（男女の平均）
    
    let limitLifeExpectancy;
    if (personAge < userAge) {
        // 対象が自分より若い場合（例：息子）→ 自分の平均寿命をリミット
        limitLifeExpectancy = userLifeExpectancy;
    } else {
        // 対象が自分より年上の場合（例：親）→ 対象の平均寿命をリミット
        limitLifeExpectancy = personLifeExpectancy;
    }
    
    const yearsWithPerson = Math.max(0, limitLifeExpectancy - personAge);
    const effectiveYears = Math.min(yearsWithPerson, remainingYears);
    
    // 会える回数 = 残りの年数 × 年間の会う回数
    const totalMeetings = effectiveYears * person.meetingFrequency;
    
    // 共有できる時間 = 会える回数 × 1回あたりの時間
    const totalHours = totalMeetings * person.hoursPerMeeting;
    
    return Math.max(0, totalHours);
};

const Visualization = ({ country, age, lifeExpectancy: customLifeExpectancy, healthyLifeExpectancy: customHealthyLifeExpectancy, workingAgeLimit: customWorkingAgeLimit, calculationBasis, onCalculationBasisChange, onReset, isSettingsOpen, onCloseSettings, editingPersonId, onOpenSettingsWithPerson, onUpdateUserSettings, people, setPeople, stats, userSettingsRef }) => {
    const [visible, setVisible] = useState(false);
    const [calculatedStats, setCalculatedStats] = useState(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [shareMessage, setShareMessage] = useState(null);
    const [displayMode, setDisplayMode] = useState(() => {
        const saved = localStorage.getItem('lifevis_displayMode');
        return saved || 'percentage';
    });

    const visualizationRef = useRef(null);
    const shareCardRef = useRef(null); // Ref for the share card
    
    // Save display mode to localStorage
    useEffect(() => {
        localStorage.setItem('lifevis_displayMode', displayMode);
    }, [displayMode]);

    const t = translations[country] || translations['default'];
    
    // Calculate maxLifeHours for hours comparison mode
    const maxLifeHours = useMemo(() => {
        const lifeExpectancy = customLifeExpectancy || lifeExpectancyData[country] || lifeExpectancyData['Global'];
        return lifeExpectancy * 365.25 * 24;
    }, [customLifeExpectancy, country]);

    // Philosophy: Time is invisible, so we tend to postpone living.
    // Visualization turns vague "someday" into concrete "remaining time".
    // 人は「見えない時間」を後回しにする。可視化することで、行動が生まれる。
    
    // Handle opening settings and scrolling to user settings
    const handleOpenUserSettings = () => {
        if (!isSettingsOpen && onOpenSettingsWithPerson) {
            // Open settings modal - pass a special marker to indicate we want user settings
            onOpenSettingsWithPerson('user-settings');
        }
    };

    useEffect(() => {
        if (country && (age !== null && age !== undefined)) {
            const lifeExpectancy = customLifeExpectancy || lifeExpectancyData[country] || lifeExpectancyData['Global'];
            const calculated = calculateLifeStats(country, age, lifeExpectancy);
            setCalculatedStats(calculated);
            setTimeout(() => setVisible(true), 50);
        }
    }, [country, age, customLifeExpectancy]);

    const displayStats = stats || calculatedStats;

    const baseLifeExpectancy = customLifeExpectancy || lifeExpectancyData[country] || lifeExpectancyData['Global'];
    const baseHealthyLifeExpectancy = customHealthyLifeExpectancy || healthyLifeExpectancyData[country] || healthyLifeExpectancyData['Global'];
    const baseWorkingAgeLimit = customWorkingAgeLimit || workingAgeLimitData[country] || workingAgeLimitData['Global'];

    const basisRemainingYears = {
        life: Math.max(0, baseLifeExpectancy - age),
        healthy: Math.max(0, baseHealthyLifeExpectancy - age),
        working: Math.max(0, baseWorkingAgeLimit - age)
    };
    const selectedRemainingYears = basisRemainingYears[calculationBasis] ?? basisRemainingYears.life;

    const getThemeColor = () => {
        if (!displayStats) return '#06b6d4';
        if (displayStats.remainingYears < 10) return '#ef4444';
        if (displayStats.remainingYears < 30) return '#eab308';
        return '#06b6d4';
    };
    const themeColor = getThemeColor();

    const [timeLeft, setTimeLeft] = useState(null);

    const defaultShareUrl = 'https://kj14.github.io/our-time-is-short/';
    const shareUrl = typeof window !== 'undefined' ? window.location.href : defaultShareUrl;

    const captureVisualization = async () => {
        // Capture the specific share card layout instead of the whole visualization
        const targetRef = shareCardRef.current || visualizationRef.current;
        if (!targetRef) return null;
        
        // If capturing the hidden share card, we need to make it temporarily visible for html2canvas
        // but off-screen. Since it's already positioned absolute off-screen, we just need to ensure
        // it's rendered fully.
        
        const canvas = await html2canvas(targetRef, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#050505',
            logging: false,
            width: 1200, // Force width for consistency
            height: 675  // Force height (16:9)
        });
        return await new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), 'image/png');
        });
    };

    const handleShareToX = async () => {
        if (isCapturing) return;
        setIsCapturing(true);
        try {
            const blob = await captureVisualization();
            if (blob) {
                const fileName = `our-life-is-short-${Date.now()}.png`;
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(url), 2000);
                setShareMessage(country === 'Japan'
                    ? 'スクリーンショットを保存しました。Xに投稿するときに画像を添付してください。'
                    : 'Screenshot saved. Attach it when you post on X.');
            } else {
                setShareMessage(country === 'Japan'
                    ? 'スクリーンショットの取得に失敗しました。'
                    : 'Failed to capture screenshot.');
            }

            const expectancy = customLifeExpectancy || lifeExpectancyData[country] || lifeExpectancyData['Global'];
            const remainingYears = displayStats?.remainingYears ?? 0;
            const livedYears = age ?? 0;
            const localeShareText = country === 'Japan'
                ? `「もし人生が${expectancy.toFixed(1)}年だとしたら」 あなたはすでに${livedYears.toFixed(1)}年を過ごし、残りは約${remainingYears.toFixed(1)}年。あなたの時間を可視化しよう。 #OurTimeIsShort ${shareUrl}`
                : `If life were ${expectancy.toFixed(1)} years long, I've lived ${livedYears.toFixed(1)} years and have roughly ${remainingYears.toFixed(1)} years left. Visualize your energy. #OurTimeIsShort ${shareUrl}`;
            
            // Detect mobile device
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            
            if (isMobile) {
                // Try to open X app first
                const twitterAppUrl = `twitter://post?message=${encodeURIComponent(localeShareText)}`;
                
                // Track if the app opened (page loses focus)
                let appOpened = false;
                let fallbackTimeout;
                
                // Listen for page visibility change (app opened)
                const handleVisibilityChange = () => {
                    if (document.hidden) {
                        appOpened = true;
                        clearTimeout(fallbackTimeout);
                        document.removeEventListener('visibilitychange', handleVisibilityChange);
                        window.removeEventListener('blur', handleBlur);
                        window.removeEventListener('pagehide', handlePageHide);
                    }
                };
                
                // Listen for blur event (app opened)
                const handleBlur = () => {
                    appOpened = true;
                    clearTimeout(fallbackTimeout);
                    document.removeEventListener('visibilitychange', handleVisibilityChange);
                    window.removeEventListener('blur', handleBlur);
                    window.removeEventListener('pagehide', handlePageHide);
                };
                
                // Listen for pagehide event (app opened)
                const handlePageHide = () => {
                    appOpened = true;
                    clearTimeout(fallbackTimeout);
                    document.removeEventListener('visibilitychange', handleVisibilityChange);
                    window.removeEventListener('blur', handleBlur);
                    window.removeEventListener('pagehide', handlePageHide);
                };
                
                // Add event listeners
                document.addEventListener('visibilitychange', handleVisibilityChange);
                window.addEventListener('blur', handleBlur);
                window.addEventListener('pagehide', handlePageHide);
                
                // Create a temporary link element to open the app
                const link = document.createElement('a');
                link.href = twitterAppUrl;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Fallback to web if app doesn't open (after a longer delay)
                // Only open web if the app didn't open (page didn't lose focus)
                fallbackTimeout = setTimeout(() => {
                    if (!appOpened) {
                        const twitterWebUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(localeShareText)}`;
                        window.open(twitterWebUrl, '_blank', 'noopener,noreferrer');
                    }
                    // Clean up event listeners
                    document.removeEventListener('visibilitychange', handleVisibilityChange);
                    window.removeEventListener('blur', handleBlur);
                    window.removeEventListener('pagehide', handlePageHide);
                }, 2000); // Increased delay to 2 seconds
            } else {
                // Desktop: use web URL
                const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(localeShareText)}`;
                window.open(twitterUrl, '_blank', 'noopener,noreferrer');
            }
        } catch (error) {
            console.error(error);
            setShareMessage(country === 'Japan'
                ? 'シェアの準備に失敗しました。'
                : 'Unable to prepare the share content.');
        } finally {
            setIsCapturing(false);
        }
    };

    useEffect(() => {
        if (!shareMessage) return;
        const timer = setTimeout(() => setShareMessage(null), 6000);
        return () => clearTimeout(timer);
    }, [shareMessage]);

    useEffect(() => {
        if (!displayStats) return;
        const now = new Date();
        const endDate = new Date(now.getTime() + displayStats.remainingSeconds * 1000);
        const timer = setInterval(() => {
            const current = new Date();
            const diff = endDate - current;
            if (diff <= 0) {
                setTimeLeft(0);
                clearInterval(timer);
            } else {
                setTimeLeft(diff);
            }
        }, 10);
        return () => clearInterval(timer);
    }, [displayStats]);

    if (!displayStats) return (
        <div style={{ color: 'white', textAlign: 'center', paddingTop: '20vh', position: 'relative', zIndex: 10 }}>
            <p>Loading stats...</p>
            <button onClick={onReset} style={{
                marginTop: '1rem',
                padding: '0.8rem 2rem',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                borderRadius: '30px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontSize: '0.9rem'
            }}>
                Reset Data
            </button>
        </div>
    );

    const getTimeComponents = (ms) => {
        if (ms === null) return null;
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        const milliseconds = Math.floor((ms % 1000) / 10);
        return { days, hours, minutes, seconds, milliseconds };
    };

    const timeComponents = getTimeComponents(timeLeft);
    const pad = (n) => n.toString().padStart(2, '0');

    const totalWeeks = Math.floor(displayStats.expectancy * 52);
    const livedWeeks = Math.floor(age * 52);
    const batteryPercentage = Math.max(0, Math.min(100, (displayStats.remainingYears / displayStats.expectancy) * 100));

    // Calculate max hours for visualization (approximate)
    const getMaxHours = () => {
        if (!displayStats) return 10000;
        return displayStats.remainingYears * 52 * 5; // Max 5 hours per week
    };

    const shareButtonLabel = isCapturing
        ? (country === 'Japan' ? '画像を生成中...' : 'Preparing...')
        : (country === 'Japan' ? 'Xでシェア' : 'Share on X');

    return (
        <div ref={visualizationRef} className={`visualization-wrapper ${visible ? 'visible' : ''}`} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)'
        }}>
            {/* Hidden Share Card Layout */}
            <div ref={shareCardRef} style={{
                position: 'absolute',
                top: 0,
                left: '-9999px', // Hide off-screen
                width: '1200px',
                height: '675px',
                background: '#050505',
                color: 'white',
                padding: '40px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                fontFamily: 'var(--font-main)',
                zIndex: -1
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ fontSize: '3rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                            {country === 'Japan' 
                                ? `人生${(customLifeExpectancy || lifeExpectancyData[country] || 80).toFixed(1)}年だとしたら`
                                : `If life were ${(customLifeExpectancy || lifeExpectancyData[country] || 80).toFixed(1)} years`}
                        </h1>
                        <p style={{ fontSize: '1.2rem', opacity: 0.7, marginTop: '0.5rem' }}>
                            {country === 'Japan' ? 'あなたの時間を可視化しよう。' : 'Visualize your time. Make it count.'}
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1rem', opacity: 0.5, letterSpacing: '1px' }}>REMAINING TIME</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: themeColor }}>
                            {displayStats?.remainingYears.toFixed(2)} <span style={{ fontSize: '1.2rem' }}>years</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', flex: 1, margin: '40px 0' }}>
                    {/* Left: Life Battery */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                         <div style={{ marginBottom: '1rem', fontSize: '1.2rem', opacity: 0.8 }}>YOUR LIFE</div>
                         <div style={{ position: 'relative', height: '60px', background: 'rgba(255,255,255,0.1)', borderRadius: '30px', overflow: 'hidden' }}>
                            <div style={{ 
                                width: `${Math.max(0, Math.min(100, (displayStats?.remainingYears / displayStats?.expectancy) * 100))}%`, 
                                height: '100%', 
                                background: themeColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                paddingRight: '20px'
                            }}>
                                <span style={{ color: '#000', fontWeight: 800, fontSize: '1.2rem' }}>
                                    {Math.max(0, Math.min(100, (displayStats?.remainingYears / displayStats?.expectancy) * 100)).toFixed(1)}%
                                </span>
                            </div>
                         </div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', opacity: 0.6, fontSize: '0.9rem' }}>
                            <span>Lived: {age?.toFixed(1)}y</span>
                            <span>Total: {displayStats?.expectancy.toFixed(1)}y</span>
                         </div>
                    </div>

                    {/* Right: People Batteries (Top 3) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ fontSize: '1.2rem', opacity: 0.8 }}>PRECIOUS TIME</div>
                        {people.slice(0, 3).map(person => {
                            const pAge = calculateAge(person);
                            if (pAge === null) return null;
                            // Simplified calculation for share card
                            const pExp = lifeExpectancyData[country] || 80;
                            const limit = pAge < age ? pExp : pExp; 
                            const yearsWith = Math.max(0, limit - pAge);
                            const effYears = Math.min(yearsWith, displayStats?.remainingYears || 0);
                            const meetings = effYears * person.meetingFrequency;
                            const hours = meetings * person.hoursPerMeeting;
                            
                            // Determine percentage for visual bar
                            // If younger: overlap starts at birth (0) ends at life expectancy. Current point is age.
                            // But for "battery remaining", we want (remaining / total_possible)
                            const totalOverlap = pAge < age ? pAge + effYears : age + effYears; // simplified approximation
                            const livedOverlap = pAge < age ? pAge : age;
                            const pct = Math.max(5, Math.min(100, (hours / (hours + (livedOverlap * person.meetingFrequency * person.hoursPerMeeting))) * 100));

                            return (
                                <div key={person.id} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '100px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {person.name}
                                    </div>
                                    <div style={{ flex: 1, height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: person.color || '#818cf8' }}></div>
                                    </div>
                                    <div style={{ width: '80px', textAlign: 'right', fontSize: '0.9rem', opacity: 0.8 }}>
                                        {meetings.toFixed(0)} {country === 'Japan' ? '回' : 'times'}
                                    </div>
                                </div>
                            );
                        })}
                        {people.length === 0 && (
                            <div style={{ opacity: 0.4, fontStyle: 'italic' }}>
                                {country === 'Japan' ? '大切な人を追加して時間を可視化しましょう' : 'Add people to visualize shared time'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ 
                    borderTop: '1px solid rgba(255,255,255,0.1)', 
                    paddingTop: '20px', 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ fontSize: '0.9rem', opacity: 0.5 }}>
                        #OurTimeIsShort
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, letterSpacing: '1px' }}>
                        letmeknow.life
                    </div>
                </div>
            </div>

            {/* Story Section */}
            <div className="story-section" style={{
                textAlign: 'center',
                marginBottom: '2.5rem',
                padding: '2rem 1.5rem',
                maxWidth: '700px',
                marginLeft: 'auto',
                marginRight: 'auto'
            }}>
                <p style={{
                    fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
                    lineHeight: 1.8,
                    color: 'var(--color-text-primary)',
                    fontWeight: 400,
                    opacity: 0.85,
                    letterSpacing: '0.02em'
                }}>
                    {(() => {
                        const livedHours = Number(age) * 365.25 * 24;
                        const remainingHours = displayStats.remainingYears * 365.25 * 24;
                        const formatHours = (hours) => {
                            return new Intl.NumberFormat().format(Math.round(hours));
                        };
                        
                        return country === 'Japan' ? (
                            <>
                                {t.storyPart1} <strong style={{ fontWeight: 600, color: themeColor }}>{formatHours(livedHours)}時間</strong>{t.storyPart2} {t.storyPart3} <strong style={{ fontWeight: 600, color: themeColor }}>{formatHours(remainingHours)}時間</strong>{t.storyPart4}
                            </>
                        ) : (
                            <>
                                {t.storyPart1} <strong style={{ fontWeight: 600, color: themeColor }}>{formatHours(livedHours)} hours</strong> {t.storyPart2} {t.storyPart3} <strong style={{ fontWeight: 600, color: themeColor }}>{formatHours(remainingHours)} hours</strong> {t.storyPart4}
                            </>
                        );
                    })()}
                </p>
            </div>

            {/* Countdown Timer */}
            <div className="countdown-card">
                <h2 style={{
                    fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)',
                    marginBottom: '1rem',
                    fontWeight: 300,
                    color: 'var(--color-text-primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3em',
                    opacity: 0.9
                }}>
                    {t.remainingSeconds}
                </h2>
                {timeComponents ? (
                    <div className="countdown-grid">
                        <TimeUnit value={timeComponents.days} label={t.days} isWide />
                        <TimeUnit value={pad(timeComponents.hours)} label={t.hours} />
                        <TimeUnit value={pad(timeComponents.minutes)} label={t.minutes} />
                        <div style={{ display: 'flex', alignItems: 'baseline' }}>
                            <TimeUnit value={pad(timeComponents.seconds)} label={t.seconds} />
                            <span style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                opacity: 0.8,
                                marginLeft: '8px',
                                width: '3ch',
                                display: 'inline-block',
                                fontFamily: 'var(--font-mono)',
                                color: themeColor
                            }}>.{pad(timeComponents.milliseconds)}</span>
                        </div>
                    </div>
                ) : (
                    <div style={{ fontSize: '3rem', fontWeight: 900 }}>...</div>
                )}
            </div>

            {/* Energy Dashboard */}
            <div style={{ marginBottom: '3rem' }}>
                {/* Display Mode Toggle - Segment Control */}
                <div className="segment-control-wrapper">
                    <div className="segment-control">
                        <div 
                            className="segment-slider"
                            style={{
                                transform: displayMode === 'hours' ? 'translateX(100%)' : 'translateX(0)'
                            }}
                        />
                        <button
                            className={`segment-btn ${displayMode === 'percentage' ? 'active' : ''}`}
                            onClick={() => setDisplayMode('percentage')}
                        >
                            {country === 'Japan' ? '残量' : 'Remaining'}
                        </button>
                        <button
                            className={`segment-btn ${displayMode === 'hours' ? 'active' : ''}`}
                            onClick={() => setDisplayMode('hours')}
                        >
                            {country === 'Japan' ? '時間比較' : 'Hours'}
                        </button>
                    </div>
                </div>
                
                {(() => {
                    const lifeExpectancy = customLifeExpectancy || lifeExpectancyData[country] || lifeExpectancyData['Global'];
                    const healthyLifeExpectancy = customHealthyLifeExpectancy || healthyLifeExpectancyData[country] || healthyLifeExpectancyData['Global'];
                    const workingAgeLimit = customWorkingAgeLimit || workingAgeLimitData[country] || workingAgeLimitData['Global'];
                    
                    // Calculate all three values
                    const remainingLifeYears = Math.max(0, lifeExpectancy - age);
                    const remainingLifeHours = remainingLifeYears * 365.25 * 24;
                    const maxLifeHours = lifeExpectancy * 365.25 * 24;
                    
                    const remainingHealthyYears = Math.max(0, healthyLifeExpectancy - age);
                    const remainingHealthyHours = remainingHealthyYears * 365.25 * 24;
                    const maxHealthyHours = healthyLifeExpectancy * 365.25 * 24;
                    
                    const remainingWorkingYears = Math.max(0, workingAgeLimit - age);
                    const remainingWorkingHours = remainingWorkingYears * 365.25 * 24;
                    const maxWorkingHours = workingAgeLimit * 365.25 * 24;
                    
                    // Create array of all three batteries
                    const allBatteries = [
                        {
                            label: "人生",
                            hours: remainingLifeHours,
                            maxHours: maxLifeHours,
                            color: "#06b6d4",
                            years: remainingLifeYears,
                            basis: 'life'
                        },
                        {
                            label: "健康",
                            hours: remainingHealthyHours,
                            maxHours: maxHealthyHours,
                            color: "#34d399",
                            years: remainingHealthyYears,
                            basis: 'healthy'
                        },
                        {
                            label: "仕事",
                            hours: remainingWorkingHours,
                            maxHours: maxWorkingHours,
                            color: "#fbbf24",
                            years: remainingWorkingYears,
                            basis: 'working'
                        }
                    ];
                    
                    // For hours comparison mode, use maxLifeHours as the common max for all batteries
                    const commonMaxHours = displayMode === 'hours' ? maxLifeHours : null;
                    
                    return (
                        <div className="main-batteries-row">
                            {allBatteries.map((battery, index) => {
                                const isSelected = battery.basis === calculationBasis;
                                return (
                                    <EnergyTank
                                        key={index}
                                        label={battery.label}
                                        hours={battery.hours}
                                        maxHours={commonMaxHours || battery.maxHours}
                                        color={battery.color}
                                        t={t}
                                        country={country}
                                        isSelected={isSelected}
                                        subtitle={`${battery.years.toFixed(1)}年`}
                                        onClick={handleOpenUserSettings}
                                        displayMode={displayMode}
                                    />
                                );
                            })}
                        </div>
                    );
                })()}
                
                {/* People Batteries */}
                <div className="energy-tanks-container">
                    {people.map(person => {
                        const personAge = calculateAge(person);
                        if (personAge === null) return null;

                        const personLifeExpectancy = lifeExpectancyData[country] || lifeExpectancyData['Global'];
                        const personRemainingYears = Math.max(0, personLifeExpectancy - personAge);

                        const remainingYearsBasedOnBasis = selectedRemainingYears;

                        let pastOverlapYears;
                        let futureOverlapYears;

                        if (personAge < age) {
                            // 年下: 過去は相手の生きてきた年数、未来は自分の残り時間（基準）と相手の残り時間の小さい方
                            pastOverlapYears = personAge;
                            futureOverlapYears = Math.min(remainingYearsBasedOnBasis, personRemainingYears);
                        } else {
                            // 年上: 過去は自分の生きてきた年数、未来は自分と相手の残り時間の小さい方
                            pastOverlapYears = age;
                            futureOverlapYears = Math.min(personRemainingYears, remainingYearsBasedOnBasis);
                        }

                        pastOverlapYears = Math.max(0, pastOverlapYears);
                        futureOverlapYears = Math.max(0, futureOverlapYears);

                        const totalOverlapYears = pastOverlapYears + futureOverlapYears;
                        const totalMeetings = futureOverlapYears * person.meetingFrequency;
                        const hours = futureOverlapYears * person.meetingFrequency * person.hoursPerMeeting;
                        const totalLifeHours = totalOverlapYears * person.meetingFrequency * person.hoursPerMeeting || 1;
                        const isJapan = country === 'Japan';
                        const conditionText = getConditionText(person, isJapan);
                        const meetingsLabel = isJapan
                            ? `残り${Math.max(0, totalMeetings).toFixed(0)}回`
                            : `${Math.max(0, totalMeetings).toFixed(0)} times left`;

                        // For hours comparison mode, use maxLifeHours as the common max
                        const personMaxHours = displayMode === 'hours' ? maxLifeHours : totalLifeHours;

                        return (
                            <EnergyTank
                                key={person.id}
                                label={person.name}
                                hours={hours}
                                maxHours={personMaxHours}
                                conditionText={conditionText}
                                color={person.color || '#818cf8'}
                                t={t}
                                country={country}
                                subtitle={meetingsLabel}
                                onClick={() => onOpenSettingsWithPerson(person.id)}
                                displayMode={displayMode}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Life Events */}
            {people.length > 0 && (
                <div style={{ marginBottom: '6rem' }}>
                    <h3 style={{
                        marginBottom: '2rem',
                        textAlign: 'center',
                        fontSize: '1.5rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        opacity: 0.8
                    }}>人生のイベント</h3>
                    <LifeEvents 
                        remainingYears={displayStats.remainingYears} 
                        people={people}
                        userAge={age}
                        userCountry={country}
                    />
                </div>
            )}

            <div className="primary-actions">
                <button className="share-button share-x" onClick={handleShareToX} disabled={isCapturing}>
                    <span className="share-icon">𝕏</span>
                    <span>{shareButtonLabel}</span>
                </button>
                <button className="outline-button" onClick={onReset}>
                    {t.startOver}
                </button>
            </div>
            {shareMessage && (
                <p className="share-message">{shareMessage}</p>
            )}


        </div>
    );
};

// User Settings Component
const UserSettings = ({ lifeExpectancy, healthyLifeExpectancy, workingAgeLimit, calculationBasis, onCalculationBasisChange, onUpdate }) => {
    const [formData, setFormData] = useState({
        lifeExpectancy: lifeExpectancy.toString(),
        healthyLifeExpectancy: healthyLifeExpectancy.toString(),
        workingAgeLimit: workingAgeLimit.toString()
    });

    useEffect(() => {
        setFormData({
            lifeExpectancy: lifeExpectancy.toString(),
            healthyLifeExpectancy: healthyLifeExpectancy.toString(),
            workingAgeLimit: workingAgeLimit.toString()
        });
    }, [lifeExpectancy, healthyLifeExpectancy, workingAgeLimit]);

    const handleSave = () => {
        onUpdate({
            lifeExpectancy: Number(formData.lifeExpectancy),
            healthyLifeExpectancy: Number(formData.healthyLifeExpectancy),
            workingAgeLimit: Number(formData.workingAgeLimit)
        });
    };

    return (
        <div className="user-settings-section" style={{ marginBottom: '3rem' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', fontWeight: 600 }}>自分の設定</h3>
            
            {/* Calculation Basis Selection */}
            {onCalculationBasisChange && (
                <div className="person-form-card" style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 500 }}>計算基準の選択</label>
                    <div className="input-toggle-group" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                            className={`toggle-btn ${calculationBasis === 'life' ? 'active' : ''}`}
                            onClick={() => onCalculationBasisChange('life')}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: calculationBasis === 'life' ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
                                color: 'var(--color-text-primary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            残りの人生
                        </button>
                        <button
                            className={`toggle-btn ${calculationBasis === 'healthy' ? 'active' : ''}`}
                            onClick={() => onCalculationBasisChange('healthy')}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: calculationBasis === 'healthy' ? 'rgba(52, 211, 153, 0.2)' : 'transparent',
                                color: 'var(--color-text-primary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            健康でいられる時間
                        </button>
                        <button
                            className={`toggle-btn ${calculationBasis === 'working' ? 'active' : ''}`}
                            onClick={() => onCalculationBasisChange('working')}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: calculationBasis === 'working' ? 'rgba(251, 191, 36, 0.2)' : 'transparent',
                                color: 'var(--color-text-primary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            社会で活躍できる時間
                        </button>
                    </div>
                </div>
            )}
            
            <div className="person-form-card">
                <div className="form-grid">
                    <div className="form-group">
                        <label>Life {Number(formData.lifeExpectancy).toFixed(1)} years</label>
                        <div className="slider-container">
                            <input
                                type="range"
                                min="50"
                                max="100"
                                step="0.1"
                                value={formData.lifeExpectancy}
                                onChange={(e) => setFormData({...formData, lifeExpectancy: e.target.value})}
                                className="slider"
                            />
                            <div className="slider-labels">
                                <span>50 years</span>
                                <span className="slider-value">{Number(formData.lifeExpectancy).toFixed(1)} years</span>
                                <span>100 years</span>
                            </div>
                        </div>
                        <input
                            type="number"
                            value={formData.lifeExpectancy}
                            onChange={(e) => setFormData({...formData, lifeExpectancy: e.target.value})}
                            min="50"
                            max="100"
                            step="0.1"
                            className="form-input"
                            style={{ marginTop: '0.5rem' }}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>健康寿命</label>
                        <div className="slider-container">
                            <input
                                type="range"
                                min="40"
                                max="90"
                                step="0.1"
                                value={formData.healthyLifeExpectancy}
                                onChange={(e) => setFormData({...formData, healthyLifeExpectancy: e.target.value})}
                                className="slider"
                            />
                            <div className="slider-labels">
                                <span>40歳</span>
                                <span className="slider-value">{Number(formData.healthyLifeExpectancy).toFixed(1)}歳</span>
                                <span>90歳</span>
                            </div>
                        </div>
                        <input
                            type="number"
                            value={formData.healthyLifeExpectancy}
                            onChange={(e) => setFormData({...formData, healthyLifeExpectancy: e.target.value})}
                            min="40"
                            max="90"
                            step="0.1"
                            className="form-input"
                            style={{ marginTop: '0.5rem' }}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>定年退職年齢</label>
                        <div className="slider-container">
                            <input
                                type="range"
                                min="50"
                                max="75"
                                step="1"
                                value={formData.workingAgeLimit}
                                onChange={(e) => setFormData({...formData, workingAgeLimit: e.target.value})}
                                className="slider"
                            />
                            <div className="slider-labels">
                                <span>50歳</span>
                                <span className="slider-value">{Number(formData.workingAgeLimit).toFixed(0)}歳</span>
                                <span>75歳</span>
                            </div>
                        </div>
                        <input
                            type="number"
                            value={formData.workingAgeLimit}
                            onChange={(e) => setFormData({...formData, workingAgeLimit: e.target.value})}
                            min="50"
                            max="75"
                            step="1"
                            className="form-input"
                            style={{ marginTop: '0.5rem' }}
                        />
                    </div>
                </div>
                
                <div className="form-actions">
                    <button className="btn-primary" onClick={handleSave}>
                        保存
                    </button>
                </div>
            </div>
        </div>
    );
};

// People Settings Component
const PeopleSettings = ({ people, setPeople, userAge, userCountry, remainingYears, editingPersonId, onEditComplete }) => {
    const [editingId, setEditingId] = useState(editingPersonId || null);
    const [useAgeInput, setUseAgeInput] = useState(false);
    
    // When editingPersonId prop changes, update editingId and form
    useEffect(() => {
        if (editingPersonId) {
            const person = people.find(p => p.id === editingPersonId);
            if (person) {
                setEditingId(person.id);
                const hasAge = person.age !== undefined && person.age !== null;
                setUseAgeInput(hasAge || (!person.birthYear && !person.birthMonth && !person.birthDay));
                setFormData({
                    name: person.name,
                    birthYear: person.birthYear ? person.birthYear.toString() : '',
                    birthMonth: person.birthMonth ? person.birthMonth.toString() : '',
                    birthDay: person.birthDay ? person.birthDay.toString() : '',
                    age: person.age !== undefined && person.age !== null ? person.age.toString() : '',
                    meetingFrequency: person.meetingFrequency,
                    hoursPerMeeting: person.hoursPerMeeting,
                    color: person.color
                });
            }
        } else {
            setEditingId(null);
        }
    }, [editingPersonId, people]);
    const [formData, setFormData] = useState({
        name: '',
        birthYear: '',
        birthMonth: '',
        birthDay: '',
        age: '',
        meetingFrequency: 12,
        hoursPerMeeting: 3,
        color: '#818cf8'
    });

    const colors = ['#818cf8', '#f472b6', '#fb7185', '#38bdf8', '#34d399', '#fbbf24', '#a78bfa', '#60a5fa'];

    const handleAdd = () => {
        if (!formData.name) {
            alert('名前を入力してください');
            return;
        }
        
        const hasBirthdate = formData.birthYear && formData.birthMonth && formData.birthDay;
        const hasAge = formData.age && formData.age !== '';
        
        if (!hasBirthdate && !hasAge) {
            alert('生年月日または年齢を入力してください');
            return;
        }
        
        const newPerson = {
            id: generateId(),
            name: formData.name,
            ...(hasBirthdate ? {
                birthYear: Number(formData.birthYear),
                birthMonth: Number(formData.birthMonth),
                birthDay: Number(formData.birthDay)
            } : {}),
            ...(hasAge ? { age: Number(formData.age) } : {}),
            meetingFrequency: Number(formData.meetingFrequency),
            hoursPerMeeting: Number(formData.hoursPerMeeting),
            color: formData.color
        };
        
        setPeople([...people, newPerson]);
        setFormData({
            name: '',
            birthYear: '',
            birthMonth: '',
            birthDay: '',
            age: '',
            meetingFrequency: 12,
            hoursPerMeeting: 3,
            color: colors[people.length % colors.length]
        });
        setUseAgeInput(false);
    };

    const handleEdit = (person) => {
        setEditingId(person.id);
        const hasAge = person.age !== undefined && person.age !== null;
        setUseAgeInput(hasAge || (!person.birthYear && !person.birthMonth && !person.birthDay));
        setFormData({
            name: person.name,
            birthYear: person.birthYear ? person.birthYear.toString() : '',
            birthMonth: person.birthMonth ? person.birthMonth.toString() : '',
            birthDay: person.birthDay ? person.birthDay.toString() : '',
            age: person.age !== undefined && person.age !== null ? person.age.toString() : '',
            meetingFrequency: person.meetingFrequency,
            hoursPerMeeting: person.hoursPerMeeting,
            color: person.color
        });
    };

    const handleUpdate = () => {
        if (!formData.name) {
            alert('名前を入力してください');
            return;
        }
        
        const hasBirthdate = formData.birthYear && formData.birthMonth && formData.birthDay;
        const hasAge = formData.age && formData.age !== '';
        
        if (!hasBirthdate && !hasAge) {
            alert('生年月日または年齢を入力してください');
            return;
        }
        
        setPeople(people.map(p => 
            p.id === editingId 
                ? {
                    ...p,
                    name: formData.name,
                    ...(hasBirthdate ? {
                        birthYear: Number(formData.birthYear),
                        birthMonth: Number(formData.birthMonth),
                        birthDay: Number(formData.birthDay),
                        age: undefined
                    } : {}),
                    ...(hasAge ? { 
                        age: Number(formData.age),
                        birthYear: undefined,
                        birthMonth: undefined,
                        birthDay: undefined
                    } : {}),
                    meetingFrequency: Number(formData.meetingFrequency),
                    hoursPerMeeting: Number(formData.hoursPerMeeting),
                    color: formData.color
                }
                : p
        ));
        setEditingId(null);
        setFormData({
            name: '',
            birthYear: '',
            birthMonth: '',
            birthDay: '',
            age: '',
            meetingFrequency: 12,
            hoursPerMeeting: 3,
            color: colors[people.length % colors.length]
        });
        setUseAgeInput(false);
        if (onEditComplete) onEditComplete();
    };

    const handleDelete = (id) => {
        if (window.confirm('この対象を削除しますか？')) {
            setPeople(people.filter(p => p.id !== id));
        }
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 121 }, (_, i) => currentYear - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    const getDaysInMonth = (year, month) => {
        if (!year || !month) return 31;
        return new Date(year, month, 0).getDate();
    };

    const days = Array.from({ length: getDaysInMonth(formData.birthYear, formData.birthMonth) }, (_, i) => i + 1);

    return (
        <div className="people-settings">
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', fontWeight: 600 }}>大切な人との時間</h3>
            
            {/* Add New Person Form */}
            <div className="person-form-card">
                <h4 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 600 }}>
                    {editingId ? '編集' : '新しい対象を追加'}
                </h4>
                
                <div className="form-grid">
                    <div className="form-group">
                        <label>名前</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="例: お母さん"
                            className="form-input"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>年齢の入力方法</label>
                        <div className="age-input-toggle">
                            <button
                                type="button"
                                className={`toggle-btn ${!useAgeInput ? 'active' : ''}`}
                                onClick={() => setUseAgeInput(false)}
                            >
                                生年月日
                            </button>
                            <button
                                type="button"
                                className={`toggle-btn ${useAgeInput ? 'active' : ''}`}
                                onClick={() => setUseAgeInput(true)}
                            >
                                年齢
                            </button>
                        </div>
                    </div>
                    
                    {!useAgeInput ? (
                        <div className="form-group">
                            <label>生年月日</label>
                            <div className="date-inputs">
                                <select
                                    value={formData.birthYear}
                                    onChange={(e) => setFormData({...formData, birthYear: e.target.value, age: ''})}
                                    className="form-select"
                                >
                                    <option value="">年</option>
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                                <select
                                    value={formData.birthMonth}
                                    onChange={(e) => setFormData({...formData, birthMonth: e.target.value})}
                                    className="form-select"
                                >
                                    <option value="">月</option>
                                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <select
                                    value={formData.birthDay}
                                    onChange={(e) => setFormData({...formData, birthDay: e.target.value})}
                                    className="form-select"
                                >
                                    <option value="">日</option>
                                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="form-group">
                            <label>年齢</label>
                            <input
                                type="number"
                                value={formData.age}
                                onChange={(e) => setFormData({...formData, age: e.target.value, birthYear: '', birthMonth: '', birthDay: ''})}
                                min="0"
                                max="150"
                                step="0.1"
                                placeholder="例: 30"
                                className="form-input"
                            />
                            <span className="form-hint">歳</span>
                        </div>
                    )}
                    
                    <div className="form-group">
                        <label>会う頻度</label>
                        <div className="frequency-presets">
                            {[
                                { label: '毎日', value: 365 },
                                { label: '週1回', value: 52 },
                                { label: '週2回', value: 104 },
                                { label: '月1回', value: 12 },
                                { label: '月2回', value: 24 },
                                { label: '年1回', value: 1 }
                            ].map(preset => (
                                <button
                                    key={preset.value}
                                    type="button"
                                    className={`preset-btn ${formData.meetingFrequency == preset.value ? 'active' : ''}`}
                                    onClick={() => setFormData({...formData, meetingFrequency: preset.value})}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                        <div className="slider-container">
                            <input
                                type="range"
                                min="1"
                                max="365"
                                value={formData.meetingFrequency}
                                onChange={(e) => setFormData({...formData, meetingFrequency: Number(e.target.value)})}
                                className="slider"
                            />
                            <div className="slider-labels">
                                <span>1回/年</span>
                                <span className="slider-value">{formData.meetingFrequency}回/年</span>
                                <span>365回/年</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label>1回あたりの時間</label>
                        <div className="hours-presets">
                            {[
                                { label: '30分', value: 0.5 },
                                { label: '1時間', value: 1 },
                                { label: '2時間', value: 2 },
                                { label: '3時間', value: 3 },
                                { label: '半日', value: 6 },
                                { label: '1日', value: 24 }
                            ].map(preset => (
                                <button
                                    key={preset.value}
                                    type="button"
                                    className={`preset-btn ${formData.hoursPerMeeting == preset.value ? 'active' : ''}`}
                                    onClick={() => setFormData({...formData, hoursPerMeeting: preset.value})}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                        <div className="slider-container">
                            <input
                                type="range"
                                min="0.5"
                                max="24"
                                step="0.5"
                                value={formData.hoursPerMeeting}
                                onChange={(e) => setFormData({...formData, hoursPerMeeting: Number(e.target.value)})}
                                className="slider"
                            />
                            <div className="slider-labels">
                                <span>0.5時間</span>
                                <span className="slider-value">{formData.hoursPerMeeting}時間</span>
                                <span>24時間</span>
                            </div>
                        </div>
                        {/* Real-time calculation preview */}
                        {(() => {
                            // Calculate age from form data
                            let personAge = null;
                            if (formData.age && formData.age !== '') {
                                personAge = Number(formData.age);
                            } else if (formData.birthYear && formData.birthMonth && formData.birthDay) {
                                const birthDate = new Date(Number(formData.birthYear), Number(formData.birthMonth) - 1, Number(formData.birthDay));
                                const today = new Date();
                                let age = today.getFullYear() - birthDate.getFullYear();
                                const monthDiff = today.getMonth() - birthDate.getMonth();
                                const dayDiff = today.getDate() - birthDate.getDate();
                                if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
                                    age--;
                                }
                                personAge = age;
                            }
                            
                            if (personAge === null) return null;
                            
                            const userLifeExpectancy = lifeExpectancyData[userCountry] || lifeExpectancyData['Global'];
                            const personLifeExpectancy = userLifeExpectancy;
                            let limitLifeExpectancy;
                            if (personAge < userAge) {
                                limitLifeExpectancy = userLifeExpectancy;
                            } else {
                                limitLifeExpectancy = personLifeExpectancy;
                            }
                            const yearsWithPerson = Math.max(0, limitLifeExpectancy - personAge);
                            const effectiveYears = Math.min(yearsWithPerson, remainingYears);
                            const totalMeetings = effectiveYears * formData.meetingFrequency;
                            const totalHours = totalMeetings * formData.hoursPerMeeting;
                            
                            return (
                                <div className="calculation-preview">
                                    <div className="preview-item">
                                        <span>会える回数:</span>
                                        <strong>{totalMeetings.toFixed(0)}回</strong>
                                    </div>
                                    <div className="preview-item">
                                        <span>共有できる時間:</span>
                                        <strong>{totalHours.toFixed(0)}時間</strong>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                    
                    <div className="form-group">
                        <label>色</label>
                        <div className="color-picker">
                            {colors.map(color => (
                                <button
                                    key={color}
                                    className={`color-option ${formData.color === color ? 'active' : ''}`}
                                    style={{ background: color }}
                                    onClick={() => setFormData({...formData, color})}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="form-actions">
                    {editingId ? (
                        <>
                            <button className="btn-secondary" onClick={() => {
                                setEditingId(null);
                                setFormData({
                                    name: '',
                                    birthYear: '',
                                    birthMonth: '',
                                    birthDay: '',
                                    age: '',
                                    meetingFrequency: 12,
                                    hoursPerMeeting: 3,
                                    color: colors[people.length % colors.length]
                                });
                                setUseAgeInput(false);
                            }}>
                                キャンセル
                            </button>
                            <button className="btn-primary" onClick={handleUpdate}>
                                更新
                            </button>
                        </>
                    ) : (
                        <button className="btn-primary" onClick={handleAdd}>
                            ＋ 追加
                        </button>
                    )}
                </div>
            </div>

            {/* People List */}
            <div className="people-list">
                {people.length === 0 ? (
                    <div className="empty-state">
                        <p>まだ対象が登録されていません</p>
                        <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '0.5rem' }}>
                            上記のフォームから追加してください
                        </p>
                    </div>
                ) : (
                    people.map(person => {
                        const personAge = calculateAge(person);
                        if (personAge === null) return null;
                        
                        // 対象が自分より若い場合 → 自分の平均寿命をリミットとして使用
                        // 対象が自分より年上の場合 → 対象の平均寿命をリミットとして使用
                        const userLifeExpectancy = lifeExpectancyData[userCountry] || lifeExpectancyData['Global'];
                        const personLifeExpectancy = userLifeExpectancy; // 同じ国の平均寿命を使用（男女の平均）
                        
                        let limitLifeExpectancy;
                        if (personAge < userAge) {
                            // 対象が自分より若い場合（例：息子）→ 自分の平均寿命をリミット
                            limitLifeExpectancy = userLifeExpectancy;
                        } else {
                            // 対象が自分より年上の場合（例：親）→ 対象の平均寿命をリミット
                            limitLifeExpectancy = personLifeExpectancy;
                        }
                        
                        const yearsWithPerson = Math.max(0, limitLifeExpectancy - personAge);
                        const effectiveYears = Math.min(yearsWithPerson, remainingYears);
                        const totalMeetings = effectiveYears * person.meetingFrequency;
                        const totalHours = totalMeetings * person.hoursPerMeeting;
                        
                        return (
                            <div 
                                key={person.id} 
                                className="person-card clickable"
                                onClick={() => handleEdit(person)}
                            >
                                <div className="person-card-header">
                                    <div className="person-info">
                                        <div className="person-color" style={{ background: person.color }}></div>
                                        <div>
                                            <div className="person-name">{person.name}</div>
                                            <div className="person-age">
                                                {personAge ? `${personAge.toFixed(1)}歳` : '年齢不明'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="person-actions" onClick={(e) => e.stopPropagation()}>
                                        <button 
                                            className="btn-icon"
                                            onClick={() => handleEdit(person)}
                                            aria-label="編集"
                                        >
                                            ✏️
                                        </button>
                                        <button 
                                            className="btn-icon btn-danger"
                                            onClick={() => handleDelete(person.id)}
                                            aria-label="削除"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="person-stats">
                                    <div className="stat-item">
                                        <span className="stat-label">会える回数</span>
                                        <span className="stat-value">{totalMeetings.toFixed(0)}回</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">共有できる時間</span>
                                        <span className="stat-value">{totalHours.toFixed(0)}時間</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">設定</span>
                                        <span className="stat-value">
                                            {person.meetingFrequency}回/年 × {person.hoursPerMeeting}時間
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

const StatCard = ({ label, value, highlight, delay, themeColor }) => (
    <div style={{
        background: highlight ? `linear-gradient(135deg, ${themeColor}22 0%, ${themeColor}11 100%)` : 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '2.5rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: highlight ? `0 10px 30px -10px ${themeColor}40` : '0 4px 20px rgba(0,0,0,0.1)',
        border: highlight ? `1px solid ${themeColor}40` : '1px solid rgba(255, 255, 255, 0.05)',
        color: 'var(--color-text-primary)',
        animation: `fadeIn 0.5s ease-out forwards ${delay}`,
        opacity: 0,
        transform: 'translateY(10px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
    }}>
        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem', opacity: 0.6 }}>
            {label}
        </div>
        <div style={{ fontSize: '2.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '-1px' }}>
            {value}
        </div>
    </div>
);

const TimeUnit = ({ value, label, isWide = false }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 0.5rem' }}>
        <span style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 200,
            fontFamily: 'var(--font-mono)',
            lineHeight: 1,
            minWidth: isWide ? '3ch' : '2ch',
            textAlign: 'center',
            display: 'inline-block',
            textShadow: '0 0 30px rgba(255, 255, 255, 0.1)'
        }}>{value}</span>
        <span style={{
            fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
            textTransform: 'uppercase',
            opacity: 0.4,
            marginTop: '0.8rem',
            fontWeight: 500,
            letterSpacing: '0.2em'
        }}>{label}</span>
    </div>
);

// Life Events Component
const LifeEvents = ({ remainingYears, people, userAge, userCountry }) => {
    const events = [
        {
            name: 'クリスマス',
            month: 11, // December (0-indexed)
            day: 25,
            emoji: '🎄',
            color: '#ef4444'
        },
        {
            name: 'お正月',
            month: 0, // January
            day: 1,
            emoji: '🎍',
            color: '#fbbf24'
        },
        {
            name: 'バレンタインデー',
            month: 1, // February
            day: 14,
            emoji: '💝',
            color: '#f472b6'
        },
        {
            name: 'ハロウィン',
            month: 9, // October
            day: 31,
            emoji: '🎃',
            color: '#f97316'
        },
        {
            name: '夏休み',
            month: 7, // August
            day: 1,
            emoji: '🏖️',
            color: '#38bdf8'
        },
        {
            name: '年末',
            month: 11, // December
            day: 31,
            emoji: '🎊',
            color: '#a78bfa'
        }
    ];
    
    // Generate all combinations of people × events
    const generateCombinations = () => {
        const combinations = [];
        people.forEach(person => {
            const personAge = calculateAge(person);
            if (personAge !== null) {
                events.forEach(event => {
                    combinations.push({ person, event });
                });
            }
        });
        return combinations;
    };
    
    const [selectedCombination, setSelectedCombination] = useState(null);
    
    const selectRandomCombination = () => {
        const combinations = generateCombinations();
        if (combinations.length > 0) {
            const randomIndex = Math.floor(Math.random() * combinations.length);
            setSelectedCombination(combinations[randomIndex]);
        }
    };
    
    // Select random combination on mount or when people/events change
    useEffect(() => {
        selectRandomCombination();
    }, [people.length]); // Only depend on length to avoid re-randomizing on every change
    
    const handleRandomize = () => {
        selectRandomCombination();
    };
    
    if (!selectedCombination) {
        return (
            <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '2rem' }}>
                対象を登録すると、イベントの回数が表示されます
            </div>
        );
    }
    
    const { person, event } = selectedCombination;
    const personAge = calculateAge(person);
    
    if (personAge === null) {
        return (
            <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '2rem' }}>
                {person.name}さんの年齢情報が不足しています
            </div>
        );
    }
    
    // Calculate how many years we can spend with this person
    const userLifeExpectancy = lifeExpectancyData[userCountry] || lifeExpectancyData['Global'];
    const personLifeExpectancy = userLifeExpectancy;
    let limitLifeExpectancy;
    if (personAge < userAge) {
        limitLifeExpectancy = userLifeExpectancy;
    } else {
        limitLifeExpectancy = personLifeExpectancy;
    }
    const yearsWithPerson = Math.max(0, limitLifeExpectancy - personAge);
    const effectiveYears = Math.min(yearsWithPerson, remainingYears);
    
    const today = new Date();
    const currentYear = today.getFullYear();
    
    const calculateEventCount = (month, day) => {
        let count = 0;
        const endYear = currentYear + Math.floor(effectiveYears);
        
        for (let year = currentYear; year <= endYear; year++) {
            const eventDate = new Date(year, month, day);
            
            // Check if this event date is in the future and within effective years
            if (eventDate >= today) {
                // Calculate years from now
                const yearsFromNow = (eventDate - today) / (1000 * 60 * 60 * 24 * 365.25);
                if (yearsFromNow <= effectiveYears) {
                    count++;
                }
            }
        }
        
        return count;
    };
    
    const eventCount = calculateEventCount(event.month, event.day);
    
    return (
        <div>
            <div style={{ 
                textAlign: 'center', 
                marginBottom: '2rem'
            }}>
                <button
                    onClick={handleRandomize}
                    className="randomize-btn"
                    style={{
                        padding: '1rem 2rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: 'var(--radius-lg)',
                        color: 'var(--color-text-primary)',
                        fontSize: '1rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '2rem'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <span style={{ fontSize: '1.2rem' }}>🎲</span>
                    <span>別の組み合わせを選ぶ</span>
                </button>
            </div>
            
            <div style={{ 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '300px'
            }}>
                <div 
                    className="event-card"
                    style={{
                        animation: 'fadeIn 0.5s ease-out forwards',
                        opacity: 0,
                        transform: 'translateY(10px)',
                        borderColor: person.color || '#818cf8',
                        maxWidth: '400px',
                        width: '100%',
                        padding: '3rem 2rem'
                    }}
                >
                    <div className="event-emoji" style={{ color: event.color, fontSize: '4rem', marginBottom: '1rem' }}>
                        {event.emoji}
                    </div>
                    <div style={{
                        fontSize: '1.1rem',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '1rem',
                        fontWeight: 500
                    }}>
                        {person.name}さんと過ごす
                    </div>
                    <div className="event-name" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
                        {event.name}
                    </div>
                    <div className="event-count" style={{ color: event.color, fontSize: '3rem' }}>
                        {eventCount}回
                    </div>
                    <div style={{
                        marginTop: '1.5rem',
                        paddingTop: '1.5rem',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        fontSize: '0.85rem',
                        color: 'var(--color-text-secondary)',
                        opacity: 0.7
                    }}>
                        残りの人生で
                    </div>
                </div>
            </div>
        </div>
    );
};

export { UserSettings, PeopleSettings };
export default Visualization;
