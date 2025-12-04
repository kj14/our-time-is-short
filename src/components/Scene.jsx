import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import SolarSystem from './SolarSystem';
import DigitalHourglassScene from './DigitalHourglassScene';

// Scene component handling 3D transitions
function SceneContent({ isVisualizing, targetCountry, remainingPercentage, onParticleDrop, onEarthClick }) {
    const solarSystemRef = useRef();
    const { camera } = useThree();
    
    // Constants
    const SOLAR_POS = new THREE.Vector3(0, 30, -50);
    const PARTICLE_CENTER = new THREE.Vector3(0, 0, 0);
    
    // Target Definitions
    // Settings Mode: Camera looks down at Sun from above/front
    // Visual Mode: Camera looks at particle center
    const targetCameraPos = isVisualizing 
        ? new THREE.Vector3(0, 0, 40) 
        : new THREE.Vector3(0, 40, -30); // Closer to Sun
        
    const targetLookAt = isVisualizing 
        ? PARTICLE_CENTER 
        : SOLAR_POS;

    // Current lookAt tracker
    const currentLookAt = useRef(targetLookAt.clone());

    useFrame((state, delta) => {
        const lerpSpeed = delta * 1.5;
        
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
                <SolarSystem onSunClick={onEarthClick} targetCountry={targetCountry} />
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

export default function Scene({ isVisualizing, targetCountry, remainingPercentage, onParticleDrop, onEarthClick }) {
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
                        targetCountry={targetCountry}
                        remainingPercentage={remainingPercentage}
                        onParticleDrop={onParticleDrop}
                        onEarthClick={onEarthClick}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
}
