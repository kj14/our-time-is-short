import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import SolarSystem from './SolarSystem';
import DigitalHourglassScene from './DigitalHourglassScene';
import { countryCoordinates } from '../utils/lifeData';

// Scene component handling 3D transitions
function SceneContent({ isVisualizing, isSettingsOpen, isEarthZoomed, targetCountry, remainingPercentage, onParticleDrop, onEarthClick, onSunClick, onPersonClick, people, userAge, userCountry, remainingYears }) {
    const solarSystemRef = useRef();
    const earthRef = useRef();
    const { camera } = useThree();
    
    // Constants - Earth is at center now
    const EARTH_POS = new THREE.Vector3(0, 30, -50); // Same position as old SOLAR_POS
    const PARTICLE_CENTER = new THREE.Vector3(0, 0, 0);
    
    // Current lookAt tracker
    const currentLookAt = useRef(new THREE.Vector3());

    // Earth position animation
    const currentEarthPos = useRef(EARTH_POS.clone());
    const isInitialized = useRef(false);
    
    useFrame((state, delta) => {
        const lerpSpeed = delta * 1.5;
        
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
            targetEarthPos = new THREE.Vector3(0, 25, -60);
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
        
        if (isVisualizing) {
            // Visual Mode: Camera looks at particle center, Earth is far away
            targetCameraPos = new THREE.Vector3(0, 0, 40);
            targetLookAt = PARTICLE_CENTER;
        } else {
            // TOP Country Selection: Earth is up close, camera shows selected country centered
            // Calculate country position on Earth surface
            const earthRadius = 2; // Earth radius from Earth.jsx
            const cameraDistanceFromSurface = 3.5; // Distance from Earth surface for zoom (increased to avoid too close)
            const totalDistance = earthRadius + cameraDistanceFromSurface;
            
            // Use current Earth position (animated)
            const currentEarthCenter = currentEarthPos.current;
            
            if (targetCountry && countryCoordinates[targetCountry]) {
                const { lat, lng } = countryCoordinates[targetCountry];
                const latRad = lat * (Math.PI / 180);
                const lngRad = lng * (Math.PI / 180);
                
                // Convert lat/lng to 3D position on sphere surface
                // Earth texture mapping offset
                const adjustedLngRad = lngRad + Math.PI / 2;
                
                // Convert to cartesian coordinates
                const x = Math.cos(latRad) * Math.sin(adjustedLngRad);
                const y = Math.sin(latRad);
                const z = Math.cos(latRad) * Math.cos(adjustedLngRad);
                
                // Country position on Earth surface (normalized direction vector)
                const countryDirection = new THREE.Vector3(x, y, z).normalize();
                
                // Position camera at country position, moved away from Earth surface
                // Camera is positioned outside Earth, looking at Earth center
                // This makes the selected country appear at the center of the screen
                targetCameraPos = currentEarthCenter.clone().add(
                    countryDirection.clone().multiplyScalar(totalDistance)
                );
                
                // Look at Earth center - the selected country will be centered
                targetLookAt = currentEarthCenter;
            } else {
                // Fallback: side view without country-specific positioning
                targetCameraPos = currentEarthCenter.clone().add(
                    new THREE.Vector3(totalDistance, 0, 0)
                );
                targetLookAt = currentEarthCenter;
            }
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
            <ambientLight intensity={isVisualizing ? 0.7 : 0.2} />
            {/* Sun light is inside SolarSystem, but we need ambient */}
            
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

export default function Scene({ isVisualizing, isSettingsOpen, isEarthZoomed, targetCountry, remainingPercentage, onParticleDrop, onEarthClick, onSunClick, onPersonClick, people, userAge, userCountry, remainingYears, remainingSeconds, livedSeconds }) {
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
            pointerEvents: 'auto', // Allow clicks on canvas
            touchAction: 'auto' // Allow touch events for mobile
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
            >
                <fog attach="fog" args={isVisualizing ? ['#141e35', 35, 65] : ['#0a0e1a', 10, 150]} />
                <Suspense fallback={null}>
                    <SceneContent 
                        isVisualizing={isVisualizing}
                        isSettingsOpen={isSettingsOpen}
                        isEarthZoomed={isEarthZoomed}
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
