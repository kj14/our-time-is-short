import React, { useRef, useMemo, forwardRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import Earth from './Earth';
import { lifeExpectancyData } from '../utils/lifeData';

// High quality textures for planets from local storage
const PLANET_TEXTURES = [
    '/textures/2k_mercury.jpg',
    '/textures/2k_venus_surface.jpg',
    '/textures/2k_mars.jpg',
    '/textures/2k_jupiter.jpg',
    '/textures/2k_saturn.jpg',
    '/textures/2k_uranus.jpg',
    '/textures/2k_neptune.jpg'
];

// Calculate age from birthdate or use direct age
const calculateAge = (person) => {
    if (person.age !== undefined && person.age !== null) {
        return Number(person.age);
    }
    
    if (!person.birthYear || !person.birthMonth || !person.birthDay) return null;
    
    const today = new Date();
    const birthDate = new Date(person.birthYear, person.birthMonth - 1, person.birthDay);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
    }
    
    return age;
};

// 3 orbit zones based on remaining time
// Zone 1 (Closest - Critical): < 24 hours OR < 10 meetings
// Zone 2 (Middle - Warning): < 100 hours OR < 50 meetings  
// Zone 3 (Outer - Stable): >= 100 hours AND >= 50 meetings
// Distances adjusted to fit within 2/3 of screen in overview mode
const ORBIT_ZONES = {
    critical: { distance: 6, color: '#ef4444' },    // Red - urgent
    warning: { distance: 12, color: '#f59e0b' },    // Amber - attention needed
    stable: { distance: 20, color: '#10b981' }      // Green - healthy relationship
};

// Calculate shared hours and meetings with a person
const calculateTimeWithPerson = (person, userAge, userCountry, remainingYears) => {
    const personAge = calculateAge(person);
    if (personAge === null) return { hours: 100, meetings: 50 }; // Default values
    
    // Use defaults if values are null/undefined
    const effectiveUserAge = userAge || 44;
    const effectiveRemainingYears = remainingYears || 40;
    
    const userLifeExpectancy = lifeExpectancyData[userCountry] || lifeExpectancyData['Global'];
    const personLifeExpectancy = userLifeExpectancy;
    
    let limitLifeExpectancy;
    if (personAge < effectiveUserAge) {
        limitLifeExpectancy = userLifeExpectancy;
    } else {
        limitLifeExpectancy = personLifeExpectancy;
    }
    
    const yearsWithPerson = Math.max(0, limitLifeExpectancy - personAge);
    const effectiveYears = Math.min(yearsWithPerson, effectiveRemainingYears);
    
    const totalMeetings = effectiveYears * (person.meetingFrequency || 12);
    const totalHours = totalMeetings * (person.hoursPerMeeting || 2);
    
    return {
        hours: Math.max(0, totalHours),
        meetings: Math.max(0, totalMeetings)
    };
};

// Determine which orbit zone a person belongs to
const getOrbitZone = (hours, meetings) => {
    if (hours < 24 || meetings < 10) {
        return 'critical';
    } else if (hours < 100 || meetings < 50) {
        return 'warning';
    } else {
        return 'stable';
    }
};

// Person Star Component
const PersonStar = ({ person, distance, radius, textureUrl, onClick, zoneColor, isGlowing }) => {
    const meshRef = useRef();
    const materialRef = useRef();
    const glowRef = useRef();
    const texture = useLoader(THREE.TextureLoader, textureUrl);
    
    if (texture) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
    }
    
    useFrame((state, delta) => {
        // Slow self-rotation
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.005 / radius;
        }
        
        // Pulsing glow effect when visualizing this star
        if (isGlowing && glowRef.current) {
            // Slow pulse: 3 second cycle
            const pulse = Math.sin(state.clock.elapsedTime * 0.7) * 0.5 + 0.5;
            glowRef.current.material.opacity = 0.1 + pulse * 0.2;
            glowRef.current.scale.setScalar(1 + pulse * 0.15);
        }
    });
    
    // Random angle for orbit position
    const angle = useMemo(() => {
        // Use person.id to generate consistent angle
        const hash = person.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return (hash % 360) * (Math.PI / 180);
    }, [person.id]);
    
    return (
        <group rotation={[0, angle, 0]}>
            {/* Person Star positioned at distance */}
            <group position={[distance, 0, 0]}
                   onPointerDown={(e) => {
                       e.stopPropagation();
                       if (onClick) {
                           onClick(person.id);
                       }
                   }}
                   onPointerOver={(e) => {
                       e.stopPropagation();
                       document.body.style.cursor = 'pointer';
                   }}
                   onPointerOut={(e) => {
                       e.stopPropagation();
                       document.body.style.cursor = 'auto';
                   }}
            >
                {/* Glow sphere - visible when this star is being visualized */}
                {isGlowing && (
                    <mesh ref={glowRef} frustumCulled={false}>
                        <sphereGeometry args={[radius * 1.5, 32, 32]} />
                        <meshBasicMaterial 
                            color="#60a5fa" 
                            transparent 
                            opacity={0.2}
                            side={THREE.BackSide}
                        />
                    </mesh>
                )}
                
                <group ref={meshRef}>
                    <mesh rotation={[0, 0, 0]} frustumCulled={false}>
                        <sphereGeometry args={[radius, 64, 64]} />
                        {texture ? (
                            <meshStandardMaterial 
                                ref={materialRef}
                                map={texture} 
                                emissive={isGlowing ? '#3b82f6' : '#ffffff'} 
                                emissiveIntensity={isGlowing ? 0.3 : 0.05}
                                roughness={0.5}
                                metalness={0.1}
                            />
                        ) : (
                            <meshStandardMaterial 
                                color={person.color || '#818cf8'} 
                                emissive={isGlowing ? '#3b82f6' : (person.color || '#818cf8')} 
                                emissiveIntensity={isGlowing ? 0.3 : 0.2} 
                            />
                        )}
                    </mesh>
                </group>
                
                {/* Person Label */}
                <Html
                    position={[0, radius + 0.5, 0]}
                    center
                    style={{
                        pointerEvents: 'none',
                        userSelect: 'none'
                    }}
                >
                    <div style={{
                        color: 'white',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        textShadow: '0 0 10px rgba(0,0,0,0.8), 0 0 5px rgba(0,0,0,0.8)',
                        whiteSpace: 'nowrap',
                        transform: 'translateY(-50%)'
                    }}>
                        {person.name}
                    </div>
                </Html>
            </group>
        </group>
    );
};

// Orbit Zone Circle Component
const OrbitZoneCircle = ({ distance, color, label }) => {
    return (
        <group>
            {/* Orbit Ring */}
            <mesh rotation={[-Math.PI/2, 0, 0]} frustumCulled={false}>
                <ringGeometry args={[distance - 0.1, distance + 0.1, 128]} />
                <meshBasicMaterial color={color} opacity={0.3} transparent side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
};

const EarthWrapper = forwardRef(({ targetCountry, onClick, isGlowing }, ref) => {
    const groupRef = useRef();
    const glowRef = useRef();
    const earthPositionRef = useRef(new THREE.Vector3());
    
    // Earth is at center (position 0,0,0)
    if (ref) {
        if (!ref.current) {
            ref.current = {
                get position() {
                    return earthPositionRef.current;
                }
            };
        }
    }

    useFrame((state) => {
        // Earth is at center
        earthPositionRef.current.set(0, 0, 0);
        
        // Pulsing glow effect when visualizing Earth (You)
        if (isGlowing && glowRef.current) {
            // Slow pulse: 3 second cycle
            const pulse = Math.sin(state.clock.elapsedTime * 0.7) * 0.5 + 0.5;
            glowRef.current.material.opacity = 0.1 + pulse * 0.15;
            glowRef.current.scale.setScalar(1 + pulse * 0.1);
        }
    });
    
    return (
        <group ref={groupRef}>
            {/* Glow sphere - visible when You (Earth) is being visualized */}
            {isGlowing && (
                <mesh ref={glowRef} frustumCulled={false}>
                    <sphereGeometry args={[3, 32, 32]} />
                    <meshBasicMaterial 
                        color="#3b82f6" 
                        transparent 
                        opacity={0.15}
                        side={THREE.BackSide}
                    />
                </mesh>
            )}
            
            <Earth targetCountry={targetCountry} onClick={onClick} />
            {/* Earth Label */}
            <Html
                position={[0, 2.5, 0]}
                center
                style={{
                    pointerEvents: 'none',
                    userSelect: 'none'
                }}
            >
                <div style={{
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: '700',
                    textShadow: '0 0 15px rgba(59,130,246,0.8), 0 0 10px rgba(0,0,0,0.8)',
                    whiteSpace: 'nowrap',
                    transform: 'translateY(-50%)'
                }}>
                    You
                </div>
            </Html>
        </group>
    )
});

export default function SolarSystem({ onSunClick, targetCountry, earthRef, onEarthClick, onPersonClick, people, userAge, userCountry, remainingYears, visualizingPersonId, isEarthVisualized }) {
    // Calculate person stars data
    const personStars = useMemo(() => {
        if (!people || people.length === 0) {
            return [];
        }
        
        const lifeExpectancy = lifeExpectancyData[userCountry] || lifeExpectancyData['Global'];
        const maxRadius = 3; // Maximum star radius for oldest people
        const minRadius = 0.5; // Minimum star radius for youngest
        
        return people.map(person => {
            const timeData = calculateTimeWithPerson(person, userAge, userCountry, remainingYears);
            const personAge = calculateAge(person) || 30;
            
            // Determine orbit zone based on remaining time/meetings
            const zone = getOrbitZone(timeData.hours, timeData.meetings);
            const distance = ORBIT_ZONES[zone].distance;
            const zoneColor = ORBIT_ZONES[zone].color;
            
            // Size based on age (older = larger)
            const ageRatio = Math.min(personAge / lifeExpectancy, 1);
            const radius = minRadius + (ageRatio * (maxRadius - minRadius));
            
            // Use person's selected texture or fallback to random
            let textureUrl = person.textureUrl;
            if (!textureUrl) {
                const textureIndex = Math.abs(person.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % PLANET_TEXTURES.length;
                textureUrl = PLANET_TEXTURES[textureIndex];
            }
            
            return {
                person,
                distance,
                radius,
                textureUrl,
                zone,
                zoneColor,
                hours: timeData.hours,
                meetings: timeData.meetings
            };
        });
    }, [people, userAge, userCountry, remainingYears]);
    
    // Check which zones have people
    const hasPersonInZone = useMemo(() => {
        const zones = { critical: false, warning: false, stable: false };
        personStars.forEach(star => {
            zones[star.zone] = true;
        });
        return zones;
    }, [personStars]);
    
    return (
        <group>
            {/* Earth at center (You) */}
            <EarthWrapper ref={earthRef} targetCountry={targetCountry} onClick={onEarthClick} isGlowing={isEarthVisualized} />
            
            {/* 3 Orbit Zone Circles - always visible */}
            <OrbitZoneCircle 
                distance={ORBIT_ZONES.critical.distance} 
                color={ORBIT_ZONES.critical.color}
                label="Critical"
            />
            <OrbitZoneCircle 
                distance={ORBIT_ZONES.warning.distance} 
                color={ORBIT_ZONES.warning.color}
                label="Warning"
            />
            <OrbitZoneCircle 
                distance={ORBIT_ZONES.stable.distance} 
                color={ORBIT_ZONES.stable.color}
                label="Stable"
            />
            
            {/* Person Stars */}
            {personStars.map(({ person, distance, radius, textureUrl, zoneColor }) => (
                <PersonStar
                    key={person.id}
                    person={person}
                    distance={distance}
                    radius={radius}
                    textureUrl={textureUrl}
                    onClick={onPersonClick}
                    zoneColor={zoneColor}
                    isGlowing={visualizingPersonId === person.id}
                />
            ))}
        </group>
    );
}
