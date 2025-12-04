import React, { useRef, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { countryCoordinates } from '../utils/lifeData';

export default function Earth({ targetCountry, onClick, onPointerOver, onPointerOut, ...props }) {
    const earthRef = useRef();
    const cloudsRef = useRef();
    const targetRotation = useRef(new THREE.Quaternion());

    // Load textures
    const [colorMap, specularMap, cloudsMap] = useLoader(THREE.TextureLoader, [
        '/textures/2k_earth_daymap.jpg',
        '/textures/2k_earth_specular_map.jpg',
        '/textures/2k_earth_clouds.png'
    ]);

    // Update target rotation when country changes
    useEffect(() => {
        if (targetCountry && countryCoordinates[targetCountry]) {
            const { lat, lng } = countryCoordinates[targetCountry];
            const latRad = lat * (Math.PI / 180);
            const lngRad = lng * (Math.PI / 180);

            const finalEuler = new THREE.Euler(
                -latRad, // Inverted latitude rotation
                -lngRad - Math.PI / 2,
                0,
                'YXZ'
            );

            // Create quaternion from euler
            const q = new THREE.Quaternion().setFromEuler(finalEuler);
            targetRotation.current.copy(q);
        }
    }, [targetCountry]);

    // Smoothly rotate Earth to show selected country
    useFrame((state, delta) => {
        if (earthRef.current) {
            // Smoothly interpolate current rotation to target rotation (~1 second)
            earthRef.current.quaternion.slerp(targetRotation.current, delta * 4);
            
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