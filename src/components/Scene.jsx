import React, { Suspense, useRef } from 'react';
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
            <ambientLight intensity={0.2} />
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
            <group visible={isVisualizing}>
                <DigitalHourglassScene 
                    remainingPercentage={remainingPercentage} 
                    onParticleDrop={onParticleDrop} 
                    country={targetCountry}
                />
            </group>
            
            <Stars radius={300} depth={50} count={2000} factor={3} saturation={0} fade speed={0.5} />
        </>
    );
}

export default function Scene({ isVisualizing, isSettingsOpen, isEarthZoomed, targetCountry, remainingPercentage, onParticleDrop, onEarthClick, onSunClick, onPersonClick, people, userAge, userCountry, remainingYears }) {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            background: 'radial-gradient(circle at center, #1a1f3a 0%, #0a0e1a 100%)',
            transition: 'background 1s ease',
            pointerEvents: 'auto', // Allow clicks on canvas
            touchAction: 'auto' // Allow touch events for mobile
        }}>
            <Canvas 
                camera={{ position: [0, 50, 30], fov: 45 }}
                gl={{ 
                    antialias: true,
                    alpha: false,
                    powerPreference: "high-performance"
                }}
                dpr={[1, 2]}
                performance={{ min: 0.5 }}
            >
                <fog attach="fog" args={['#0a0e1a', 10, 150]} />
                <Suspense fallback={null}>
                    <SceneContent 
                        isVisualizing={isVisualizing}
                        isSettingsOpen={isSettingsOpen}
                        isEarthZoomed={isEarthZoomed}
                        targetCountry={targetCountry}
                        remainingPercentage={remainingPercentage}
                        onParticleDrop={onParticleDrop}
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
        </div>
    );
}
