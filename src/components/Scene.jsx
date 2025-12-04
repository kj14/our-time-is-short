import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import SolarSystem from './SolarSystem';
import DigitalHourglassScene from './DigitalHourglassScene';

// Scene component handling 3D transitions
function SceneContent({ isVisualizing, isSettingsOpen, targetCountry, remainingPercentage, onParticleDrop, onEarthClick, onSunClick }) {
    const solarSystemRef = useRef();
    const earthRef = useRef();
    const { camera } = useThree();
    
    // Constants
    const SOLAR_POS = new THREE.Vector3(0, 30, -50);
    const PARTICLE_CENTER = new THREE.Vector3(0, 0, 0);
    
    // Current lookAt tracker
    const currentLookAt = useRef(new THREE.Vector3());

    useFrame((state, delta) => {
        const lerpSpeed = delta * 1.5;
        
        let targetCameraPos, targetLookAt;
        
        if (isVisualizing) {
            // Visual Mode: Camera looks at particle center
            targetCameraPos = new THREE.Vector3(0, 0, 40);
            targetLookAt = PARTICLE_CENTER;
        } else if (isSettingsOpen) {
            // Settings Modal Mode: Camera looks at Sun (settings entry point)
            targetLookAt = SOLAR_POS;
            // Camera position: Close to Sun, slightly above and offset
            targetCameraPos = SOLAR_POS.clone().add(new THREE.Vector3(0, 3, 8));
        } else {
            // Country Selection Mode: Camera looks at Earth
            if (earthRef.current && earthRef.current.position) {
                const earthLocalPos = earthRef.current.position;
                const earthWorldPos = SOLAR_POS.clone().add(earthLocalPos);
                
                targetLookAt = earthWorldPos;
                // Camera position: Close to Earth, slightly above and offset
                targetCameraPos = earthWorldPos.clone().add(new THREE.Vector3(0, 3, 8));
            } else {
                // Fallback if Earth not yet ready - look at Earth's orbit position
                const earthData = { distance: 18 };
                const earthAngle = 0; // Default angle
                const earthLocalPos = new THREE.Vector3(
                    earthData.distance * Math.cos(earthAngle),
                    0,
                    -earthData.distance * Math.sin(earthAngle)
                );
                const earthWorldPos = SOLAR_POS.clone().add(earthLocalPos);
                targetLookAt = earthWorldPos;
                targetCameraPos = earthWorldPos.clone().add(new THREE.Vector3(0, 3, 8));
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
            
            {/* Solar System - Always visible, but in background during visualization */}
            <group position={SOLAR_POS} ref={solarSystemRef}>
                <SolarSystem onSunClick={onSunClick} targetCountry={targetCountry} earthRef={earthRef} onEarthClick={onEarthClick} />
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

export default function Scene({ isVisualizing, isSettingsOpen, targetCountry, remainingPercentage, onParticleDrop, onEarthClick, onSunClick }) {
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
            touchAction: 'none'
        }}>
            <Canvas camera={{ position: [0, 40, -30], fov: 45 }}>
                <fog attach="fog" args={['#0a0e1a', 10, 150]} />
                <Suspense fallback={null}>
                    <SceneContent 
                        isVisualizing={isVisualizing}
                        isSettingsOpen={isSettingsOpen}
                        targetCountry={targetCountry}
                        remainingPercentage={remainingPercentage}
                        onParticleDrop={onParticleDrop}
                        onEarthClick={onEarthClick}
                        onSunClick={onSunClick}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
}
