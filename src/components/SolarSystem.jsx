import React, { useRef, useMemo, forwardRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import Earth from './Earth';

// High quality textures for planets from local storage
const PLANET_TEXTURES = {
    Mercury: '/textures/2k_mercury.jpg',
    Venus: '/textures/2k_venus_surface.jpg',
    Mars: '/textures/2k_mars.jpg',
    Jupiter: '/textures/2k_jupiter.jpg',
    Saturn: '/textures/2k_saturn.jpg',
    Uranus: '/textures/2k_uranus.jpg',
    Neptune: '/textures/2k_neptune.jpg',
    Sun: '/textures/2k_sun.jpg'
};

// Approximate orbital elements (Mean Longitude at J2000 and Period in days)
// Using simplified circular orbits for visualization
const PLANET_DATA = {
    Mercury: { distance: 8, radius: 0.4, period: 87.97, L0: 252.25, texture: PLANET_TEXTURES.Mercury },
    Venus: { distance: 12, radius: 0.9, period: 224.7, L0: 181.98, texture: PLANET_TEXTURES.Venus },
    Earth: { distance: 18, radius: 1.0, period: 365.26, L0: 100.46 }, // Earth handled separately
    Mars: { distance: 24, radius: 0.5, period: 687.0, L0: 355.43, texture: PLANET_TEXTURES.Mars },
    Jupiter: { distance: 35, radius: 2.5, period: 4332.6, L0: 34.35, texture: PLANET_TEXTURES.Jupiter },
    Saturn: { distance: 45, radius: 2.0, period: 10759.2, L0: 50.08, texture: PLANET_TEXTURES.Saturn, hasRing: true },
    Uranus: { distance: 55, radius: 1.5, period: 30688.5, L0: 314.06, texture: PLANET_TEXTURES.Uranus },
    Neptune: { distance: 65, radius: 1.5, period: 60182.0, L0: 304.35, texture: PLANET_TEXTURES.Neptune }
};

// Calculate current planet angle based on date
const calculatePlanetAngle = (period, L0) => {
    const now = new Date();
    const j2000 = new Date('2000-01-01T12:00:00Z');
    const daysSinceJ2000 = (now - j2000) / (1000 * 60 * 60 * 24);
    
    // Mean longitude in degrees
    let L = L0 + (daysSinceJ2000 / period) * 360;
    L = L % 360;
    
    // Convert to radians (and adjust for THREE.js coordinate system if needed)
    // Assuming standard counter-clockwise orbit
    return L * (Math.PI / 180);
};

const RealisticPlanet = ({ radius, distance, angle, name, textureUrl, hasRing, onClick }) => {
  const ref = useRef();
  const texture = useLoader(THREE.TextureLoader, textureUrl);
  
  if (texture) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
  }
  
  return (
      <PlanetMesh 
        radius={radius} 
        distance={distance} 
        angle={angle}
        name={name} 
        texture={texture}
        hasRing={hasRing}
        onClick={onClick}
      />
  );
};

// Inner component to handle the mesh and logic
const PlanetMesh = ({ radius, distance, angle, name, texture, hasRing, onClick }) => {
    const groupRef = useRef();
    const meshRef = useRef();

    // Procedural Saturn Ring Texture
    const ringTexture = useMemo(() => {
        if (!hasRing) return null;
        
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        const gradient = context.createLinearGradient(0, 0, 1024, 0);
        
        gradient.addColorStop(0.0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.1, 'rgba(30,30,30,0)');
        gradient.addColorStop(0.2, 'rgba(200,200,180,0.2)');
        gradient.addColorStop(0.4, 'rgba(255,255,230,0.8)');
        gradient.addColorStop(0.6, 'rgba(255,255,230,0.9)'); 
        gradient.addColorStop(0.65, 'rgba(0,0,0,0.1)');
        gradient.addColorStop(0.7, 'rgba(230,230,210,0.6)');
        gradient.addColorStop(0.9, 'rgba(230,230,210,0.5)');
        gradient.addColorStop(1.0, 'rgba(0,0,0,0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 1024, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.rotation = -Math.PI / 2;
        return texture;
    }, [hasRing]);

    // Set initial static position
    useMemo(() => {
        // Position calculations should happen in render or ref effect usually, 
        // but since angle is static prop now (calculated once in parent), we can't set ref.current here easily.
        // We'll use useFrame for one-time setup or just render group with rotation/position.
        // Easier: Rotate the group to 'angle' and put planet at 'distance' on x-axis.
    }, [angle, distance]);

    useFrame((state, delta) => {
        // Slow self-rotation only
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.005 / radius;
        }
    });

    return (
        <group rotation={[0, angle, 0]}>
            {/* Orbit Line */}
            <mesh rotation={[-Math.PI/2, 0, 0]}>
                <ringGeometry args={[distance - 0.05, distance + 0.05, 128]} />
                <meshBasicMaterial color="#ffffff" opacity={0.08} transparent side={THREE.DoubleSide} />
            </mesh>
            
            {/* Planet Group positioned at distance */}
            <group position={[distance, 0, 0]} 
                   onClick={(e) => {
                       e.stopPropagation();
                       onClick && onClick(name);
                   }}
                   onPointerOver={() => document.body.style.cursor = 'pointer'}
                   onPointerOut={() => document.body.style.cursor = 'auto'}
            >
                <group ref={meshRef}>
                    <mesh rotation={[0, 0, 0]}>
                        <sphereGeometry args={[radius, 64, 64]} />
                        <meshStandardMaterial map={texture} />
                    </mesh>
                    
                    {name === 'Venus' && (
                         <mesh scale={[1.02, 1.02, 1.02]}>
                            <sphereGeometry args={[radius, 64, 64]} />
                            <meshBasicMaterial color="#ffbf00" transparent opacity={0.15} side={THREE.BackSide} />
                        </mesh>
                    )}

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
        </group>
    );
}

const EarthWrapper = forwardRef(({ targetCountry, onClick }, ref) => {
    const groupRef = useRef();
    const earthPositionRef = useRef(new THREE.Vector3());
    
    const earthData = PLANET_DATA.Earth;
    const angle = useMemo(() => calculatePlanetAngle(earthData.period, earthData.L0), []);
    
    if (ref) {
        ref.current = {
            get position() {
                return earthPositionRef.current;
            }
        };
    }

    // Calculate static position once
    useMemo(() => {
        const x = Math.cos(angle) * earthData.distance;
        const z = -Math.sin(angle) * earthData.distance; // -sin to match counter-clockwise in 3D space usually?
        // Actually in "group rotation" approach above:
        // x = distance * cos(angle), z = -distance * sin(angle) is implicit by rotation [0, angle, 0] * [distance,0,0]
        // Rotation Y angle: x' = x*cos(a) + z*sin(a) -> distance * cos(a)
        // z' = -x*sin(a) + z*cos(a) -> -distance * sin(a)
        
        earthPositionRef.current.set(
            earthData.distance * Math.cos(angle), 
            0, 
            -earthData.distance * Math.sin(angle)
        );
    }, [angle, earthData.distance]);

    return (
        <group rotation={[0, angle, 0]}>
             <mesh rotation={[-Math.PI/2, 0, 0]}>
                <ringGeometry args={[earthData.distance - 0.05, earthData.distance + 0.05, 128]} />
                <meshBasicMaterial color="#ffffff" opacity={0.08} transparent side={THREE.DoubleSide} />
            </mesh>
            <group position={[earthData.distance, 0, 0]} ref={groupRef}>
                <Earth targetCountry={targetCountry} onClick={onClick} />
            </group>
        </group>
    )
});

const Sun = ({ onClick }) => {
    const sunRef = useRef();
    const texture = useLoader(THREE.TextureLoader, PLANET_TEXTURES.Sun);

    useFrame((state, delta) => {
        if (sunRef.current) {
            sunRef.current.rotation.y += delta * 0.002; // Very slow rotation
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

export default function SolarSystem({ onSunClick, targetCountry, earthRef, onEarthClick }) {
    const handlePlanetClick = (name) => {
        console.log(`Clicked on ${name}`);
        // Future: Show modal or info
    };

    // Calculate angles for all planets
    const planetAngles = useMemo(() => {
        const angles = {};
        Object.keys(PLANET_DATA).forEach(key => {
            if (key !== 'Earth') {
                angles[key] = calculatePlanetAngle(PLANET_DATA[key].period, PLANET_DATA[key].L0);
            }
        });
        return angles;
    }, []);

    return (
        <group>
            <Sun onClick={onSunClick} />

            {Object.keys(PLANET_DATA).map((key) => {
                if (key === 'Earth') return null;
                const data = PLANET_DATA[key];
                return (
                    <RealisticPlanet 
                        key={key}
                        name={key}
                        radius={data.radius}
                        distance={data.distance}
                        angle={planetAngles[key]}
                        textureUrl={data.texture}
                        hasRing={data.hasRing}
                        onClick={handlePlanetClick}
                    />
                );
            })}
            
            <EarthWrapper 
                ref={earthRef} 
                targetCountry={targetCountry} 
                onClick={onEarthClick}
            />
        </group>
    );
}
