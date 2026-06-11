import React, { useRef, useMemo, forwardRef } from 'react';
import { useFrame, useLoader, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import Earth from './Earth';
import { lifeExpectancyData } from '../utils/lifeData';
import { calculateAge, calculateTimeWithPerson } from '../utils/calculations';
import { ORBIT_DISTANCES, HOUR_THRESHOLDS, MEETING_THRESHOLDS } from '../constants';
import type { Person } from '../types';

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

type OrbitZone = 'critical' | 'warning' | 'stable';

// Distance + colour per orbit zone. Distances are sourced from constants
// so Scene.tsx and SolarSystem.tsx cannot drift apart.
const ORBIT_ZONES: Record<OrbitZone, { distance: number; color: string }> = {
    critical: { distance: ORBIT_DISTANCES.INNER, color: '#ef4444' },
    warning: { distance: ORBIT_DISTANCES.MIDDLE, color: '#f59e0b' },
    stable: { distance: ORBIT_DISTANCES.OUTER, color: '#10b981' }
};

// Wrapper around shared calculateTimeWithPerson that supplies defaults and
// returns the legacy { hours, meetings } shape used by getOrbitZone below.
const orbitTimeForPerson = (
    person: Person,
    userAge?: number,
    userCountry?: string,
    remainingYears?: number
): { hours: number; meetings: number } => {
    if (calculateAge(person) === null) return { hours: 100, meetings: 50 };
    const result = calculateTimeWithPerson({
        person: { ...person, meetingFrequency: person.meetingFrequency || 12, hoursPerMeeting: person.hoursPerMeeting || 2 },
        userAge: userAge || 44,
        country: userCountry || 'Global',
        remainingYears: remainingYears || 40
    });
    return { hours: result.hours, meetings: result.meetings };
};

// Determine which orbit zone a person belongs to
const getOrbitZone = (hours: number, meetings: number): OrbitZone => {
    if (hours < HOUR_THRESHOLDS.SOON || meetings < MEETING_THRESHOLDS.SOON) return 'critical';
    if (hours < HOUR_THRESHOLDS.SOME || meetings < MEETING_THRESHOLDS.SOME) return 'warning';
    return 'stable';
};

export interface UniverseLayout {
    mentor: Person | null;
    earthDistance: number;
    earthAngle: number;
    earthOffset: { x: number; z: number };
}

// Mentor-center layout (CONCEPT §5: "place someone you admire at the center").
// When centerMode === 'mentor' and a mentor exists, the mentor sits at the
// origin and Earth (You) takes an orbital slot whose distance reflects your
// remaining time with the mentor. Shared by SolarSystem (render) and
// Scene (camera targeting) so they can't drift apart.
export function getUniverseLayout({
    people,
    userAge,
    userCountry,
    remainingYears,
    centerMode
}: {
    people?: Person[];
    userAge?: number;
    userCountry?: string;
    remainingYears?: number;
    centerMode?: string;
}): UniverseLayout {
    const mentor = centerMode === 'mentor' && people
        ? people.find((p) => p.isMentor) ?? null
        : null;
    if (!mentor) {
        return { mentor: null, earthDistance: 0, earthAngle: 0, earthOffset: { x: 0, z: 0 } };
    }
    const timeData = orbitTimeForPerson(mentor, userAge, userCountry, remainingYears);
    const zone = getOrbitZone(timeData.hours, timeData.meetings);
    const distance = ORBIT_ZONES[zone].distance;
    // Stable angle derived from the mentor's id, shifted so Earth doesn't
    // land on the slot the mentor's star used to occupy.
    const hash = mentor.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const angle = ((hash + 180) % 360) * (Math.PI / 180);
    return {
        mentor,
        earthDistance: distance,
        earthAngle: angle,
        // Same rotation→translation math as PersonStar / Scene camera.
        earthOffset: { x: distance * Math.cos(angle), z: -distance * Math.sin(angle) }
    };
}

interface PersonStarProps {
    person: Person;
    distance: number;
    radius: number;
    textureUrl: string;
    onClick?: (personId: string) => void;
    zoneColor: string;
    isGlowing: boolean;
    isMentor: boolean;
}

// Person Star Component. When `isMentor` is true, the star is rendered with
// a golden corona to symbolise "the sun-like person" per CONCEPT.md §5.
const PersonStar = ({ person, distance, radius, textureUrl, onClick, zoneColor, isGlowing, isMentor }: PersonStarProps) => {
    const meshRef = useRef<THREE.Group>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    const texture = useLoader(THREE.TextureLoader, textureUrl);

    if (texture) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
    }

    useFrame((state) => {
        // Slow self-rotation
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.005 / radius;
        }

        // Pulsing red outline effect when visualizing this star
        if (isGlowing && glowRef.current) {
            // Scale animation: 1.05 to 1.15
            const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.5 + 0.5;
            const scale = 1.05 + pulse * 0.1;
            glowRef.current.scale.setScalar(scale);
        }
    });

    // Random angle for orbit position
    const angle = useMemo(() => {
        // Use person.id to generate consistent angle
        const hash = person.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return (hash % 360) * (Math.PI / 180);
    }, [person.id]);

    const handleSelect = (e: ThreeEvent<MouseEvent> | ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        if (onClick) onClick(person.id);
    };

    return (
        <group rotation={[0, angle, 0]}>
            {/* Person Star positioned at distance */}
            <group position={[distance, 0, 0]}
                   onPointerDown={handleSelect}
                   onPointerOver={(e) => {
                       e.stopPropagation();
                       document.body.style.cursor = 'pointer';
                   }}
                   onPointerOut={(e) => {
                       e.stopPropagation();
                       document.body.style.cursor = 'auto';
                   }}
            >
                {/* Invisible Hit Sphere for easier tapping on mobile */}
                <mesh visible={false} onClick={handleSelect} onPointerDown={handleSelect}>
                    <sphereGeometry args={[Math.max(radius * 2.5, 2), 16, 16]} />
                    <meshBasicMaterial />
                </mesh>

                {/* Red outline - visible when this star is being visualized */}
                {isGlowing && (
                    <mesh ref={glowRef} frustumCulled={false}>
                        <sphereGeometry args={[radius, 32, 32]} />
                        <meshBasicMaterial
                            color="#ef4444"
                            side={THREE.BackSide}
                        />
                    </mesh>
                )}

                {/* Mentor corona - golden glow + ring */}
                {isMentor && (
                    <group>
                        <mesh frustumCulled={false} raycast={() => null}>
                            <sphereGeometry args={[radius * 1.6, 32, 32]} />
                            <meshBasicMaterial
                                color="#fcd34d"
                                opacity={0.18}
                                transparent
                                side={THREE.BackSide}
                            />
                        </mesh>
                        <mesh rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false} raycast={() => null}>
                            <ringGeometry args={[radius * 1.8, radius * 2.0, 64]} />
                            <meshBasicMaterial color="#fbbf24" opacity={0.6} transparent side={THREE.DoubleSide} />
                        </mesh>
                    </group>
                )}

                <group ref={meshRef}>
                    <mesh rotation={[0, 0, 0]} frustumCulled={false}>
                        <sphereGeometry args={[radius, 64, 64]} />
                        {texture ? (
                            <meshStandardMaterial
                                ref={materialRef}
                                map={texture}
                                roughness={0.5}
                                metalness={0.1}
                            />
                        ) : (
                            <meshStandardMaterial
                                color={person.color || '#818cf8'}
                            />
                        )}
                    </mesh>
                </group>

                {/* Person Label */}
                <Html
                    position={[0, radius + 0.8, 0]}
                    center
                    style={{
                        pointerEvents: 'auto',
                        userSelect: 'none',
                        cursor: 'pointer'
                    }}
                >
                    <div
                        onClick={(e) => { e.stopPropagation(); if (onClick) onClick(person.id); }}
                        style={{
                            color: isMentor ? '#fcd34d' : 'white',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            textShadow: '0 0 10px rgba(0,0,0,0.8), 0 0 5px rgba(0,0,0,0.8)',
                            whiteSpace: 'nowrap',
                            padding: '10px',
                            textAlign: 'center'
                        }}
                    >
                        {isMentor ? '★ ' : ''}{person.name}
                    </div>
                </Html>
            </group>
        </group>
    );
};

// Orbit Zone Circle Component
const OrbitZoneCircle = ({ distance, color }: { distance: number; color: string }) => {
    return (
        <group>
            {/* Orbit Ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false} raycast={() => null}>
                <ringGeometry args={[distance - 0.1, distance + 0.1, 128]} />
                <meshBasicMaterial color={color} opacity={0.1} transparent side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
};

// Imperative handle exposed to Scene: a stable object whose `position`
// getter always returns Earth's local position vector.
export interface EarthHandle {
    position: THREE.Vector3;
}

interface EarthWrapperProps {
    targetCountry?: string;
    onClick?: (e: unknown) => void;
    isGlowing?: boolean;
}

const EarthWrapper = forwardRef<EarthHandle, EarthWrapperProps>(({ targetCountry, onClick, isGlowing }, ref) => {
    const groupRef = useRef<THREE.Group>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    const earthPositionRef = useRef(new THREE.Vector3());

    // Expose a stable handle (object refs only — Scene passes a ref object).
    if (ref && typeof ref !== 'function' && !ref.current) {
        ref.current = {
            get position() {
                return earthPositionRef.current;
            }
        };
    }

    useFrame((state) => {
        // Earth sits at its group origin; mentor-center offset is applied by
        // the parent groups in SolarSystem.
        earthPositionRef.current.set(0, 0, 0);

        // Pulsing red outline effect when visualizing Earth (You)
        if (isGlowing && glowRef.current) {
            // Scale animation: 1.05 to 1.15
            const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.5 + 0.5;
            const scale = 1.05 + pulse * 0.1;
            glowRef.current.scale.setScalar(scale);
        }
    });

    return (
        <group ref={groupRef}>
            {/* Invisible Hit Sphere for easier tapping on mobile */}
            <mesh visible={false} onClick={onClick} onPointerDown={(e) => { e.stopPropagation(); if (onClick) onClick(e); }}>
                <sphereGeometry args={[3.0, 16, 16]} />
                <meshBasicMaterial />
            </mesh>

            {/* Red outline - visible when You (Earth) is being visualized */}
            {isGlowing && (
                <mesh ref={glowRef} frustumCulled={false}>
                    <sphereGeometry args={[2.1, 32, 32]} />
                    <meshBasicMaterial
                        color="#ef4444"
                        side={THREE.BackSide}
                    />
                </mesh>
            )}

            <Earth targetCountry={targetCountry} onClick={onClick} />
            {/* Earth Label */}
            <Html
                position={[0, 3.0, 0]}
                center
                style={{
                    pointerEvents: 'auto',
                    userSelect: 'none',
                    cursor: 'pointer'
                }}
            >
                <div
                    onClick={(e) => { e.stopPropagation(); if (onClick) onClick(e); }}
                    style={{
                        color: 'white',
                        fontSize: '1rem',
                        fontWeight: '700',
                        textShadow: '0 0 15px rgba(59,130,246,0.8), 0 0 10px rgba(0,0,0,0.8)',
                        whiteSpace: 'nowrap',
                        padding: '10px',
                        textAlign: 'center'
                    }}
                >
                    You
                </div>
            </Html>
        </group>
    );
});

interface SolarSystemProps {
    onSunClick?: () => void;
    targetCountry?: string;
    earthRef?: React.MutableRefObject<EarthHandle | null>;
    onEarthClick?: (e: unknown) => void;
    onPersonClick?: (personId: string) => void;
    people?: Person[];
    userAge?: number;
    userCountry?: string;
    remainingYears?: number;
    visualizingPersonId?: string | null;
    isEarthVisualized?: boolean;
    centerMode?: string;
}

export default function SolarSystem({ onSunClick, targetCountry, earthRef, onEarthClick, onPersonClick, people, userAge, userCountry, remainingYears, visualizingPersonId, isEarthVisualized, centerMode = 'self' }: SolarSystemProps) {
    // Mentor-center layout (no-op object when centerMode is 'self' or no mentor)
    const layout = useMemo(
        () => getUniverseLayout({ people, userAge, userCountry, remainingYears, centerMode }),
        [people, userAge, userCountry, remainingYears, centerMode]
    );
    // Calculate person stars data
    const personStars = useMemo(() => {
        if (!people || people.length === 0) {
            return [];
        }

        const lifeExpectancy = lifeExpectancyData[userCountry ?? 'Global'] || lifeExpectancyData['Global'];
        const maxRadius = 3; // Maximum star radius for oldest people
        const minRadius = 0.5; // Minimum star radius for youngest

        return people.map(person => {
            const timeData = orbitTimeForPerson(person, userAge, userCountry, remainingYears);
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

    return (
        <group>
            {/* Earth: at the center in self mode, on an orbit in mentor mode */}
            {layout.mentor ? (
                <group rotation={[0, layout.earthAngle, 0]}>
                    <group position={[layout.earthDistance, 0, 0]}>
                        <EarthWrapper ref={earthRef} targetCountry={targetCountry} onClick={onEarthClick} isGlowing={isEarthVisualized} />
                    </group>
                </group>
            ) : (
                <EarthWrapper ref={earthRef} targetCountry={targetCountry} onClick={onEarthClick} isGlowing={isEarthVisualized} />
            )}

            {/* 3 Orbit Zone Circles - always visible */}
            <OrbitZoneCircle
                distance={ORBIT_ZONES.critical.distance}
                color={ORBIT_ZONES.critical.color}
            />
            <OrbitZoneCircle
                distance={ORBIT_ZONES.warning.distance}
                color={ORBIT_ZONES.warning.color}
            />
            <OrbitZoneCircle
                distance={ORBIT_ZONES.stable.distance}
                color={ORBIT_ZONES.stable.color}
            />

            {/* Person Stars. In mentor-center mode the mentor's star moves
                to the origin (distance 0) — the center of the universe. */}
            {personStars.map(({ person, distance, radius, textureUrl, zoneColor }) => (
                <PersonStar
                    key={person.id}
                    person={person}
                    distance={layout.mentor && person.id === layout.mentor.id ? 0 : distance}
                    radius={radius}
                    textureUrl={textureUrl}
                    onClick={onPersonClick}
                    zoneColor={zoneColor}
                    isGlowing={visualizingPersonId === person.id}
                    isMentor={!!person.isMentor}
                />
            ))}
        </group>
    );
}
