import React from 'react';

const EnergyTank = ({ activity, hours, maxHours, color, label, t, isMainBattery = false, subtitle, conditionText, onClick }) => {
    // Calculate percentage: remaining time / total time
    // This represents "how much % is remaining until the end date"
    const percentage = Math.min(100, Math.max(0, (hours / maxHours) * 100));
    
    // Format hours for display
    const formattedHours = new Intl.NumberFormat().format(Math.round(hours));

    return (
        <div 
            className={`energy-tank-container ${isMainBattery ? 'main-battery' : ''} ${onClick ? 'clickable-battery' : ''}`}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <div className="tank-label">
                <span className="activity-name">{label}</span>
                {conditionText && <span className="activity-subtitle">{conditionText}</span>}
                {subtitle && <span className="activity-subtitle">{subtitle}</span>}
                <span className="remaining-value">{formattedHours} <span className="unit">{t.hours}</span></span>
            </div>
            
            <div className="battery-body">
                {/* Battery top (positive terminal) */}
                <div className="battery-top"></div>
                
                {/* Battery container */}
                <div className="battery-container">
                    {/* Battery fill with animation */}
                    <div 
                        className="battery-fill" 
                        style={{ 
                            height: `${percentage}%`,
                            background: `linear-gradient(to top, ${color} 0%, ${color}dd 50%, ${color}aa 100%)`,
                            boxShadow: `inset 0 0 10px ${color}40, 0 0 20px ${color}60`
                        }}
                    >
                        {/* Animated shimmer effect */}
                        <div className="battery-shimmer"></div>
                        
                        {/* Percentage text inside battery */}
                        <div className="battery-percentage">
                            {percentage.toFixed(0)}%
                        </div>
                    </div>
                    
                    {/* Battery frame overlay */}
                    <div className="battery-frame"></div>
                </div>
            </div>
        </div>
    );
};

export default EnergyTank;
