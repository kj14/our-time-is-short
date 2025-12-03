import React from 'react';

const EnergyTank = ({ activity, hours, maxHours, color, label, t, isMainBattery = false, isSubBattery = false, isSelected = false, subtitle, conditionText, onClick, displayMode = 'percentage' }) => {
    // Calculate percentage: remaining time / total time
    // This represents "how much % is remaining until the end date"
    const percentage = Math.min(100, Math.max(0, (hours / maxHours) * 100));
    
    // Format hours for display
    const formattedHours = new Intl.NumberFormat().format(Math.round(hours));
    const formattedMaxHours = new Intl.NumberFormat().format(Math.round(maxHours));

    if (displayMode === 'hours') {
        // Bar chart mode (horizontal bar)
        return (
            <div 
                className={`energy-tank-container horizontal-bar ${isSelected ? 'selected-battery' : ''} ${onClick ? 'clickable-battery' : ''}`}
                onClick={onClick}
                style={{ cursor: onClick ? 'pointer' : 'default' }}
            >
                <div className="bar-label-row">
                    <span className="activity-name">{label}</span>
                    {subtitle && <span className="activity-subtitle">{subtitle}</span>}
                </div>
                <div className="bar-chart-container">
                    <div className="bar-background">
                        <div 
                            className="bar-fill"
                            style={{
                                width: `${percentage}%`,
                                background: `linear-gradient(to right, ${color} 0%, ${color}dd 50%, ${color}aa 100%)`,
                                boxShadow: `0 0 10px ${color}40`
                            }}
                        >
                            <span className="bar-percentage">{percentage.toFixed(0)}%</span>
                        </div>
                    </div>
                </div>
                <div className="bar-value-row">
                    <span className="remaining-value">{formattedHours} <span className="unit">{t.hours}</span></span>
                    <span className="max-value">{formattedMaxHours} <span className="unit">{t.hours}</span></span>
                </div>
            </div>
        );
    }

    // Percentage mode (horizontal battery)
    return (
        <div 
            className={`energy-tank-container horizontal-battery ${isSelected ? 'selected-battery' : ''} ${onClick ? 'clickable-battery' : ''}`}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <div className="battery-label-row">
                <span className="activity-name">{label}</span>
                {subtitle && <span className="activity-subtitle">{subtitle}</span>}
            </div>
            
            <div className="horizontal-battery-body">
                {/* Battery left terminal */}
                <div className="battery-terminal-left"></div>
                
                {/* Battery container */}
                <div className="battery-container-horizontal">
                    {/* Battery fill with animation */}
                    <div 
                        className="battery-fill-horizontal" 
                        style={{ 
                            width: `${percentage}%`,
                            background: `linear-gradient(to right, ${color} 0%, ${color}dd 50%, ${color}aa 100%)`,
                            boxShadow: `inset 0 0 10px ${color}40, 0 0 20px ${color}60`
                        }}
                    >
                        {/* Animated shimmer effect */}
                        <div className="battery-shimmer-horizontal"></div>
                        
                        {/* Percentage text inside battery */}
                        <div className="battery-percentage-horizontal">
                            {percentage.toFixed(0)}%
                        </div>
                    </div>
                    
                    {/* Battery frame overlay */}
                    <div className="battery-frame-horizontal"></div>
                </div>
                
                {/* Battery right terminal */}
                <div className="battery-terminal-right"></div>
            </div>
            
            <div className="battery-value-row">
                <span className="remaining-value">{formattedHours} <span className="unit">{t.hours}</span></span>
            </div>
        </div>
    );
};

export default EnergyTank;
