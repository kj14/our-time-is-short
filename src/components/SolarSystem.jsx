import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import Earth from './Earth';

// High quality textures for planets from local storage
// Using downloaded textures to avoid CORS issues and ensure reliability
const PLANET_TEXTURES = {
    Mercury: '/textures/2k_mercury.jpg',
    Venus: '/textures/2k_venus_surface.jpg',
    Mars: '/textures/2k_mars.jpg',
    Jupiter: '/textures/2k_jupiter.jpg',
    Saturn: '/textures/2k_saturn.jpg',
    // SaturnRing is generated procedurally
    Uranus: '/textures/2k_uranus.jpg',
    Neptune: '/textures/2k_neptune.jpg',
    Sun: '/textures/2k_sun.jpg'
};

const RealisticPlanet = ({ radius, distance, speed, angleOffset = 0, name, textureUrl, hasRing }) => {
  const ref = useRef();
  const texture = useLoader(THREE.TextureLoader, textureUrl);
  
  return (
      <PlanetMesh 
        radius={radius} 
        distance={distance} 
        speed={speed} 
        angleOffset={angleOffset} 
        name={name} 
        texture={texture}
        hasRing={hasRing}
      />
  );
};

// Inner component to handle the mesh and logic
const PlanetMesh = ({ radius, distance, speed, angleOffset, name, texture, hasRing }) => {
    const ref = useRef();

    // Procedural Saturn Ring Texture
    const ringTexture = useMemo(() => {
        if (!hasRing) return null;
        
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        const gradient = context.createLinearGradient(0, 0, 1024, 0);
        
        // Simple ring pattern with transparency
        gradient.addColorStop(0.0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.1, 'rgba(30,30,30,0)');
        gradient.addColorStop(0.2, 'rgba(200,200,180,0.2)'); // C Ring
        gradient.addColorStop(0.4, 'rgba(255,255,230,0.8)'); // B Ring
        gradient.addColorStop(0.6, 'rgba(255,255,230,0.9)'); 
        gradient.addColorStop(0.65, 'rgba(0,0,0,0.1)');     // Cassini Division
        gradient.addColorStop(0.7, 'rgba(230,230,210,0.6)'); // A Ring
        gradient.addColorStop(0.9, 'rgba(230,230,210,0.5)');
        gradient.addColorStop(1.0, 'rgba(0,0,0,0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 1024, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.rotation = -Math.PI / 2; // Rotate to align with ring geometry UVs
        return texture;
    }, [hasRing]);

    useFrame((state) => {
        const t = state.clock.getElapsedTime() * speed + angleOffset;
        ref.current.position.x = Math.cos(t) * distance;
        ref.current.position.z = Math.sin(t) * distance;
        // Self rotation
        ref.current.rotation.y += 0.005 / radius; // Smaller planets rotate faster visually
    });

    return (
        <group>
            {/* Orbit Line */}
            <mesh rotation={[-Math.PI/2, 0, 0]}>
                <ringGeometry args={[distance - 0.05, distance + 0.05, 128]} />
                <meshBasicMaterial color="#ffffff" opacity={0.08} transparent side={THREE.DoubleSide} />
            </mesh>
            
            {/* Planet Body */}
            <group ref={ref}>
                <mesh>
                    <sphereGeometry args={[radius, 64, 64]} />
                    <meshStandardMaterial map={texture} />
                </mesh>
                
                {/* Atmosphere Glow (Simple) for Venus */}
                {name === 'Venus' && (
                     <mesh scale={[1.02, 1.02, 1.02]}>
                        <sphereGeometry args={[radius, 64, 64]} />
                        <meshBasicMaterial color="#ffbf00" transparent opacity={0.15} side={THREE.BackSide} />
                    </mesh>
                )}

                {/* Ring for Saturn */}
                {hasRing && ringTexture && (
                    <mesh rotation={[-Math.PI/2, 0, 0]}>
                        <ringGeometry args={[radius * 1.4, radius * 2.4, 64]} />
                        <meshStandardMaterial 
                            map={ringTexture} 
                            side={THREE.DoubleSide} 
                            transparent 
                            opacity={0.8} 
                        />
                    </mesh>
                )}
            </group>
        </group>
    );
}

function EarthWrapper({ distance, speed, angleOffset, targetCountry }) {
    const groupRef = useRef();
     useFrame((state) => {
        const t = state.clock.getElapsedTime() * speed + angleOffset;
        groupRef.current.position.x = Math.cos(t) * distance;
        groupRef.current.position.z = Math.sin(t) * distance;
    });
    
    return (
        <group>
             <mesh rotation={[-Math.PI/2, 0, 0]}>
                <ringGeometry args={[distance - 0.05, distance + 0.05, 128]} />
                <meshBasicMaterial color="#ffffff" opacity={0.08} transparent side={THREE.DoubleSide} />
            </mesh>
            <group ref={groupRef}>
                <Earth targetCountry={targetCountry} />
            </group>
        </group>
    )
}

const Sun = ({ onClick }) => {
    const sunRef = useRef();
    const texture = useLoader(THREE.TextureLoader, PLANET_TEXTURES.Sun);

    useFrame((state, delta) => {
        if (sunRef.current) {
            sunRef.current.rotation.y += delta * 0.02;
        }
    });

    return (
        <group onClick={(e) => {
                e.stopPropagation();
                onClick && onClick();
            }}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'auto'}
        >
            <mesh ref={sunRef}>
                <sphereGeometry args={[4, 64, 64]} />
                <meshStandardMaterial map={texture} emissiveMap={texture} emissive="#FDB813" emissiveIntensity={0.5} />
            </mesh>
            {/* Sun Glow/Light */}
            <pointLight intensity={2} distance={100} decay={2} color="#FDB813" />
            <mesh scale={[1.2, 1.2, 1.2]}>
                <sphereGeometry args={[4, 64, 64]} />
                <meshBasicMaterial color="#FDB813" transparent opacity={0.15} />
            </mesh>
             <mesh scale={[1.4, 1.4, 1.4]}>
                <sphereGeometry args={[4, 64, 64]} />
                <meshBasicMaterial color="#FDB813" transparent opacity={0.05} />
            </mesh>
        </group>
    );
}

export default function SolarSystem({ onSunClick, targetCountry }) {
    return (
        <group>
            <Sun onClick={onSunClick} />

            <RealisticPlanet 
                name="Mercury" 
                distance={8} 
                radius={0.4} 
                speed={0.8} 
                textureUrl={PLANET_TEXTURES.Mercury} 
            />
            <RealisticPlanet 
                name="Venus" 
                distance={12} 
                radius={0.9} 
                speed={0.6} 
                angleOffset={1} 
                textureUrl={PLANET_TEXTURES.Venus} 
            />
            
            <EarthWrapper distance={18} speed={0.4} angleOffset={2} targetCountry={targetCountry} />
            
            <RealisticPlanet 
                name="Mars" 
                distance={24} 
                radius={0.5} 
                speed={0.3} 
                angleOffset={3} 
                textureUrl={PLANET_TEXTURES.Mars} 
            />
            <RealisticPlanet 
                name="Jupiter" 
                distance={35} 
                radius={2.5} 
                speed={0.15} 
                angleOffset={4} 
                textureUrl={PLANET_TEXTURES.Jupiter} 
            />
            <RealisticPlanet 
                name="Saturn" 
                distance={45} 
                radius={2.0} 
                speed={0.1} 
                angleOffset={5} 
                textureUrl={PLANET_TEXTURES.Saturn} 
                hasRing={true}
            />
            <RealisticPlanet 
                name="Uranus" 
                distance={55} 
                radius={1.5} 
                speed={0.08} 
                angleOffset={0} 
                textureUrl={PLANET_TEXTURES.Uranus} 
            />
            <RealisticPlanet 
                name="Neptune" 
                distance={65} 
                radius={1.5} 
                speed={0.06} 
                angleOffset={1} 
                textureUrl={PLANET_TEXTURES.Neptune} 
            />
        </group>
    );
}
