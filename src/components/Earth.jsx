import React, { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

export default function Earth({ targetCountry, onClick, onPointerOver, onPointerOut, ...props }) {
    const earthRef = useRef();
    const cloudsRef = useRef();

    // Load textures
    const [colorMap, specularMap, cloudsMap] = useLoader(THREE.TextureLoader, [
        '/textures/2k_earth_daymap.jpg',
        '/textures/2k_earth_specular_map.jpg',
        '/textures/2k_earth_clouds.png'
    ]);

    // Earth rotation is now disabled - camera will move instead
    // Keep Earth at fixed rotation
    useFrame((state, delta) => {
        if (earthRef.current) {
            // Keep Earth at fixed rotation (no country-specific rotation)
            // Earth stays in default position
            
            // Rotate clouds slightly for visual effect
            if (cloudsRef.current) {
                cloudsRef.current.rotation.y += 0.0005;
            }
        }
    });

    const handlePointerDown = (e) => {
        e.stopPropagation();
        if (onClick) {
            onClick(e);
        }
    };

    return (
        <group 
            {...props}
            onClick={onClick}
            onPointerDown={handlePointerDown}
            onPointerOver={() => {
                document.body.style.cursor = 'pointer';
                if (onPointerOver) onPointerOver();
            }} 
            onPointerOut={() => {
                document.body.style.cursor = 'auto';
                if (onPointerOut) onPointerOut();
            }}
        >
            <mesh ref={earthRef}>
                <sphereGeometry args={[2, 64, 64]} />
                <meshPhongMaterial 
                    map={colorMap}
                    specularMap={specularMap}
                    specular={new THREE.Color('grey')}
                    shininess={10}
                />
            </mesh>
            <mesh ref={cloudsRef}>
                <sphereGeometry args={[2.02, 64, 64]} />
                <meshPhongMaterial 
                    map={cloudsMap}
                    transparent={true}
                    opacity={0.8}
                    side={THREE.DoubleSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
            {/* Atmosphere Glow */}
            <mesh scale={[2.1, 2.1, 2.1]}>
                <sphereGeometry args={[1, 64, 64]} />
                <meshPhongMaterial
                    color="#3b82f6"
                    transparent={true}
                    opacity={0.1}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
        </group>
    );
}