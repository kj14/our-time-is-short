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

// Calculate shared hours with a person
const calculateHoursWithPerson = (person, userAge, userCountry, remainingYears) => {
    const personAge = calculateAge(person);
    if (personAge === null) return 0;
    
    const userLifeExpectancy = lifeExpectancyData[userCountry] || lifeExpectancyData['Global'];
    const personLifeExpectancy = userLifeExpectancy;
    
    let limitLifeExpectancy;
    if (personAge < userAge) {
        limitLifeExpectancy = userLifeExpectancy;
    } else {
        limitLifeExpectancy = personLifeExpectancy;
    }
    
    const yearsWithPerson = Math.max(0, limitLifeExpectancy - personAge);
    const effectiveYears = Math.min(yearsWithPerson, remainingYears);
    
    const totalMeetings = effectiveYears * person.meetingFrequency;
    const totalHours = totalMeetings * person.hoursPerMeeting;
    
    return Math.max(0, totalHours);
};

// Person Star Component
const PersonStar = ({ person, distance, radius, textureUrl, onClick }) => {
    const meshRef = useRef();
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
    });
    
    // Random angle for orbit position
    const angle = useMemo(() => {
        // Use person.id to generate consistent angle
        const hash = person.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return (hash % 360) * (Math.PI / 180);
    }, [person.id]);
    
    return (
        <group rotation={[0, angle, 0]}>
            {/* Orbit Line */}
            <mesh rotation={[-Math.PI/2, 0, 0]}>
                <ringGeometry args={[distance - 0.05, distance + 0.05, 128]} />
                <meshBasicMaterial color="#ffffff" opacity={0.08} transparent side={THREE.DoubleSide} />
            </mesh>
            
            {/* Person Star positioned at distance */}
            <group position={[distance, 0, 0]}
                   onClick={(e) => {
                       e.stopPropagation();
                       if (onClick) {
                           onClick(person.id);
                       }
                   }}
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
                <group ref={meshRef}>
                    <mesh rotation={[0, 0, 0]}>
                        <sphereGeometry args={[radius, 64, 64]} />
                        {texture ? (
                            <meshStandardMaterial map={texture} />
                        ) : (
                            <meshStandardMaterial color={person.color || '#818cf8'} />
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

const EarthWrapper = forwardRef(({ targetCountry, onClick }, ref) => {
    const groupRef = useRef();
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

    useFrame(() => {
        // Earth is at center
        earthPositionRef.current.set(0, 0, 0);
    });
    
    return (
        <group ref={groupRef}>
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
                    Earth (You)
                </div>
            </Html>
        </group>
    )
});

export default function SolarSystem({ onSunClick, targetCountry, earthRef, onEarthClick, onPersonClick, people, userAge, userCountry, remainingYears }) {
    // Calculate person stars data
    const personStars = useMemo(() => {
        if (!people || people.length === 0) return [];
        
        // Calculate shared hours for each person
        const personData = people.map(person => {
            const sharedHours = calculateHoursWithPerson(person, userAge, userCountry, remainingYears);
            const personAge = calculateAge(person);
            return {
                ...person,
                sharedHours,
                personAge: personAge || 0
            };
        });
        
        // Sort by shared hours (descending) - more hours = closer
        personData.sort((a, b) => b.sharedHours - a.sharedHours);
        
        // Calculate max shared hours for distance normalization
        const maxHours = Math.max(...personData.map(p => p.sharedHours), 1);
        const minHours = Math.min(...personData.map(p => p.sharedHours), 0);
        const hoursRange = maxHours - minHours || 1;
        
        // Calculate distances: more hours = closer (distance 8-65)
        // Invert: max hours = distance 8, min hours = distance 65
        const minDistance = 8;
        const maxDistance = 65;
        
        // Calculate sizes: age closer to life expectancy = larger (sun size = 4)
        // Max age (life expectancy) = radius 4, younger = smaller
        const lifeExpectancy = lifeExpectancyData[userCountry] || lifeExpectancyData['Global'];
        const maxRadius = 4; // Sun size
        const minRadius = 0.4; // Mercury size
        
        return personData.map((person, index) => {
            // Distance based on shared hours (inverted: more hours = closer)
            const hoursRatio = (person.sharedHours - minHours) / hoursRange;
            const distance = maxDistance - (hoursRatio * (maxDistance - minDistance));
            
            // Size based on age (closer to life expectancy = larger)
            const ageRatio = person.personAge / lifeExpectancy;
            const radius = minRadius + (ageRatio * (maxRadius - minRadius));
            
            // Random texture
            const textureIndex = Math.abs(person.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % PLANET_TEXTURES.length;
            const textureUrl = PLANET_TEXTURES[textureIndex];
            
            return {
                person,
                distance,
                radius,
                textureUrl
            };
        });
    }, [people, userAge, userCountry, remainingYears]);
    
    return (
        <group>
            {/* Earth at center (replacing Sun position) */}
            <EarthWrapper ref={earthRef} targetCountry={targetCountry} onClick={onEarthClick} />
            
            {/* Person Stars */}
            {personStars.map(({ person, distance, radius, textureUrl }) => (
                <PersonStar
                    key={person.id}
                    person={person}
                    distance={distance}
                    radius={radius}
                    textureUrl={textureUrl}
                    onClick={onPersonClick}
                />
            ))}
        </group>
    );
}
