import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import SolarSystem from './SolarSystem';
import DigitalHourglassScene from './DigitalHourglassScene';

// Scene component handling 3D transitions
function SceneContent({ isVisualizing, isSettingsOpen, isOverviewMode, targetCountry, remainingPercentage, onParticleDrop, onEarthClick, onSunClick, onPersonClick, people, userAge, userCountry, remainingYears, selectedPersonId, visualizingPersonId, isEarthVisualized }) {
    const solarSystemRef = useRef();
    const earthRef = useRef();
    const { camera } = useThree();
    
    // Constants - Earth is at center now
    const EARTH_POS = new THREE.Vector3(0, 0, -10); // Earth position for settings mode
    const PARTICLE_CENTER = new THREE.Vector3(0, 0, 0);
    
    // Current lookAt tracker
    const currentLookAt = useRef(new THREE.Vector3());

    // Earth position animation
    const currentEarthPos = useRef(EARTH_POS.clone());
    const isInitialized = useRef(false);
    
    useFrame((state, delta) => {
        // Slower when entering overview mode, faster when returning to zoom
        const lerpSpeed = isOverviewMode ? delta * 2 : delta * 4;
        
        // Initialize Earth position on first frame
        if (!isInitialized.current && solarSystemRef.current) {
            solarSystemRef.current.position.copy(EARTH_POS);
            currentEarthPos.current.copy(EARTH_POS);
            isInitialized.current = true;
        }
        
        // Animate Earth position: move away when visualizing
        let targetEarthPos;
        if (isVisualizing) {
            // Earth moves far away (back/behind, up)
            // Move in Z direction (backward) and slightly up, keep X centered
            targetEarthPos = new THREE.Vector3(0, 20, -50);
        } else {
            // Earth at center for country selection
            targetEarthPos = EARTH_POS.clone();
        }
        
        // Lerp Earth position
        currentEarthPos.current.lerp(targetEarthPos, lerpSpeed);
        
        // Update solar system group position
        if (solarSystemRef.current) {
            solarSystemRef.current.position.copy(currentEarthPos.current);
        }
        
        let targetCameraPos, targetLookAt;
        
        // Use current Earth position (animated)
        const currentEarthCenter = currentEarthPos.current;
        
        // Earth dimensions
        const earthRadius = 2; // Earth radius from Earth.jsx
        const zoomDistance = earthRadius + 3.5; // Distance when fully zoomed in
        
        if (isVisualizing) {
            // Visual Mode: Camera looks at particle center, Earth is far away
            targetCameraPos = new THREE.Vector3(0, 0, 40);
            targetLookAt = PARTICLE_CENTER;
        } else if (selectedPersonId && people && people.length > 0) {
            // Zoom to selected person's star - same zoom level as You (Earth)
            const selectedPerson = people.find(p => p.id === selectedPersonId);
            if (selectedPerson) {
                // Calculate the star's position (same logic as SolarSystem.jsx)
                // Calculate angle from person.id hash
                const hash = selectedPerson.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const angle = (hash % 360) * (Math.PI / 180);
                
                // Calculate distance based on orbit zone (same as SolarSystem.jsx)
                // Zone distances: critical=6, warning=12, stable=20
                const getPersonDistance = () => {
                    const personAge = selectedPerson.age || 30;
                    const effectiveUserAge = userAge || 44;
                    const effectiveRemainingYears = remainingYears || 40;
                    
                    const userLifeExpectancy = 84.6; // Default
                    let limitLifeExpectancy = personAge < effectiveUserAge ? userLifeExpectancy : userLifeExpectancy;
                    const yearsWithPerson = Math.max(0, limitLifeExpectancy - personAge);
                    const effectiveYears = Math.min(yearsWithPerson, effectiveRemainingYears);
                    
                    const meetings = effectiveYears * (selectedPerson.meetingFrequency || 12);
                    const hours = meetings * (selectedPerson.hoursPerMeeting || 2);
                    
                    if (hours < 24 || meetings < 10) return 6;       // critical
                    if (hours < 100 || meetings < 50) return 12;     // warning
                    return 20;                                        // stable
                };
                
                const distance = getPersonDistance();
                
                // Star position relative to Earth (Y-axis rotation then X translation)
                const starX = distance * Math.cos(angle);
                const starZ = -distance * Math.sin(angle);
                
                // Star world position (relative to Earth center)
                const starWorldPos = new THREE.Vector3(
                    currentEarthCenter.x + starX,
                    currentEarthCenter.y,
                    currentEarthCenter.z + starZ
                );
                
                // Camera position: always in front of the star (+Z direction)
                // This creates a smooth, consistent movement from any position
                targetCameraPos = new THREE.Vector3(
                    starWorldPos.x,
                    starWorldPos.y,
                    starWorldPos.z + zoomDistance
                );
                
                targetLookAt = starWorldPos;
            } else {
                // Fallback to Earth zoom
                targetCameraPos = currentEarthCenter.clone().add(new THREE.Vector3(0, 0, zoomDistance));
                targetLookAt = currentEarthCenter;
            }
        } else if (isOverviewMode) {
            // Overview Mode: Top-down view to see the entire relationship map
            // PersonStars can be at distance 6-20, adjusted to fit 2/3 of screen
            const overviewHeight = 45; // Height above Earth to see all stars within screen
            
            // Camera positioned directly above Earth, looking straight down
            targetCameraPos = new THREE.Vector3(
                currentEarthCenter.x,
                currentEarthCenter.y + overviewHeight,
                currentEarthCenter.z + 5 // Slight Z offset for better angle
            );
            
            // Look at Earth center from above
            targetLookAt = currentEarthCenter;
        } else {
            // TOP Country Selection: Camera moves straight to Earth (zoomed in)
            // Earth rotates to show the selected country (handled in Earth.jsx)
            
            // Camera position: directly in front of Earth, along Z axis
            targetCameraPos = currentEarthCenter.clone().add(
                new THREE.Vector3(0, 0, zoomDistance)
            );
            
            // Look at Earth center
            targetLookAt = currentEarthCenter;
        }
        
        // Initialize if first frame
        if (currentLookAt.current.lengthSq() === 0) {
            currentLookAt.current.copy(targetLookAt);
            camera.position.copy(targetCameraPos);
            camera.lookAt(targetLookAt);
        }

        // Lerp Position
        camera.position.lerp(targetCameraPos, lerpSpeed);
        
        // Lerp LookAt
        currentLookAt.current.lerp(targetLookAt, lerpSpeed);
        camera.lookAt(currentLookAt.current);
    });

    return (
        <>
            <ambientLight intensity={isVisualizing ? 0.7 : (isOverviewMode ? 0.8 : 0.3)} />
            {/* Point light for overview mode to illuminate person stars */}
            {isOverviewMode && !isVisualizing && (
                <pointLight position={[0, 35, -10]} intensity={1.5} distance={100} />
            )}
            
            {/* Solar System - Earth-centered with person stars */}
            {/* Position is animated in useFrame */}
            <group ref={solarSystemRef}>
                <SolarSystem 
                    onSunClick={onSunClick} 
                    targetCountry={targetCountry} 
                    earthRef={earthRef} 
                    onEarthClick={onEarthClick}
                    onPersonClick={onPersonClick}
                    people={people}
                    userAge={userAge}
                    userCountry={userCountry}
                    remainingYears={remainingYears}
                    visualizingPersonId={visualizingPersonId}
                    isEarthVisualized={isEarthVisualized}
                />
            </group>
            
            {/* Particles - Only visible when visualizing */}
            {isVisualizing && (
                <DigitalHourglassScene 
                    remainingPercentage={remainingPercentage} 
                    onParticleDrop={onParticleDrop} 
                    country={targetCountry}
                />
            )}
            
            <Stars radius={100} depth={50} count={isVisualizing ? 5000 : 2000} factor={isVisualizing ? 4 : 3} saturation={0} fade speed={isVisualizing ? 1 : 0.5} />
        </>
    );
}

export default function Scene({ isVisualizing, isSettingsOpen, isOverviewMode, targetCountry, remainingPercentage, onParticleDrop, onEarthClick, onSunClick, onPersonClick, people, userAge, userCountry, remainingYears, remainingSeconds, livedSeconds, selectedPersonId, visualizingPersonId, isEarthVisualized }) {
    const [topPulse, setTopPulse] = useState(1);
    const [currentRemainingSeconds, setCurrentRemainingSeconds] = useState(remainingSeconds || 0);
    const [currentLivedSeconds, setCurrentLivedSeconds] = useState(livedSeconds || 0);
    
    // Update initial values when props change
    useEffect(() => {
        setCurrentRemainingSeconds(remainingSeconds || 0);
        setCurrentLivedSeconds(livedSeconds || 0);
    }, [remainingSeconds, livedSeconds]);
    
    // Handle particle drop - update seconds
    const handleParticleDrop = () => {
        setCurrentRemainingSeconds(prev => Math.max(0, prev - 1));
        setCurrentLivedSeconds(prev => prev + 1);
        
        if (onParticleDrop) {
            onParticleDrop();
        }
        
        // Top right: pulse synchronized with particle drop
        setTopPulse(1.05);
        setTimeout(() => {
            setTopPulse(1);
            setTimeout(() => {
                setTopPulse(1.03);
                setTimeout(() => {
                    setTopPulse(1);
                }, 100);
            }, 150);
        }, 120);
    };
    
    const formatSeconds = (seconds) => {
        return new Intl.NumberFormat().format(Math.max(0, Math.floor(seconds)));
    };
    
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            background: isVisualizing 
                ? 'radial-gradient(ellipse at top, #232160 0%, #373396 25%, #232160 50%, #141e35 100%)'
                : 'radial-gradient(circle at center, #1a1f3a 0%, #0a0e1a 100%)',
            backgroundImage: isVisualizing 
                ? `
                    radial-gradient(ellipse at 20% 30%, rgba(99, 102, 241, 0.25) 0%, transparent 50%),
                    radial-gradient(ellipse at 80% 70%, rgba(139, 92, 246, 0.25) 0%, transparent 50%),
                    radial-gradient(ellipse at 50% 50%, rgba(59, 130, 246, 0.2) 0%, transparent 70%)
                  `
                : 'none',
            transition: 'background 1s ease',
            pointerEvents: 'auto',
            touchAction: 'manipulation' // Allow touch while preventing double-tap zoom
        }}>
            <Canvas 
                camera={isVisualizing ? { position: [0, 0, 40], fov: 45 } : { position: [0, 50, 30], fov: 45 }}
                gl={{ 
                    antialias: true,
                    alpha: false,
                    powerPreference: "high-performance"
                }}
                dpr={[1, 2]}
                performance={{ min: 0.5 }}
                style={{ touchAction: 'manipulation' }}
            >
                <fog attach="fog" args={isVisualizing ? ['#141e35', 35, 65] : ['#0a0e1a', 10, 150]} />
                <Suspense fallback={null}>
                    <SceneContent 
                        isVisualizing={isVisualizing}
                        isSettingsOpen={isSettingsOpen}
                        isOverviewMode={isOverviewMode}
                        targetCountry={targetCountry}
                        remainingPercentage={remainingPercentage}
                        onParticleDrop={handleParticleDrop}
                        onEarthClick={onEarthClick}
                        onSunClick={onSunClick}
                        onPersonClick={onPersonClick}
                        people={people}
                        userAge={userAge}
                        userCountry={userCountry}
                        remainingYears={remainingYears}
                        selectedPersonId={selectedPersonId}
                        visualizingPersonId={visualizingPersonId}
                        isEarthVisualized={isEarthVisualized}
                    />
                </Suspense>
            </Canvas>
            
            {/* Top Right - Remaining Seconds (only visible when visualizing) */}
            {isVisualizing && (
                <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontFamily: 'monospace',
                    transform: `scale(${topPulse})`,
                    transition: 'transform 0.12s ease-in-out',
                    textShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
                    pointerEvents: 'none',
                    zIndex: 1000
                }}>
                    {formatSeconds(currentRemainingSeconds)}
                </div>
            )}
            
            {/* Bottom Right - Used Seconds (only visible when visualizing) */}
            {isVisualizing && (
                <div style={{
                    position: 'absolute',
                    bottom: '1rem',
                    right: '1rem',
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontFamily: 'monospace',
                    textShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
                    pointerEvents: 'none',
                    zIndex: 1000
                }}>
                    {formatSeconds(currentLivedSeconds)}
                </div>
            )}
        </div>
    );
}
