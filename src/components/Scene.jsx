import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import Earth from './Earth';
import DigitalHourglassScene from './DigitalHourglassScene';

// Scene component handling 3D transitions
function SceneContent({ isVisualizing, targetCountry, remainingPercentage, onParticleDrop, onEarthClick }) {
    const earthRef = useRef();
    const hourglassRef = useRef();
    const { camera } = useThree();
    
    // Animation state
    // Earth moves away and up
    const earthTargetZ = isVisualizing ? -60 : 0;
    const earthTargetY = isVisualizing ? 25 : 0; 
    
    // Camera moves back to see the whole particle scene
    const cameraTargetZ = isVisualizing ? 40 : 6;
    
    useFrame((state, delta) => {
        const lerpSpeed = delta * 2;
        
        if (earthRef.current) {
            // Smoothly interpolate Earth position
            earthRef.current.position.z = THREE.MathUtils.lerp(earthRef.current.position.z, earthTargetZ, lerpSpeed);
            earthRef.current.position.y = THREE.MathUtils.lerp(earthRef.current.position.y, earthTargetY, lerpSpeed);
        }
        
        // Smoothly interpolate Camera position
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, cameraTargetZ, lerpSpeed);
    });

    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1.5} />
            
            <group ref={earthRef}>
                <Earth targetCountry={targetCountry} onClick={onEarthClick} />
            </group>
            
            <group ref={hourglassRef} visible={isVisualizing}>
                <DigitalHourglassScene 
                    remainingPercentage={remainingPercentage} 
                    onParticleDrop={onParticleDrop} 
                    country={targetCountry}
                />
            </group>
            
            <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
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
            transition: 'background 1s ease'
        }}>
            <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
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