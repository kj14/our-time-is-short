import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Slow flowing gradient particles representing the flow of time
function TimeFlowParticles({ remainingYears }) {
    const mesh = useRef();
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const count = 200; // Reduced for calmer effect

    // Generate particles
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 100 + 50;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const z = Math.random() * 200 - 100;
            const speed = 0.1 + Math.random() * 0.2;
            temp.push({ x, y, z, angle, radius, speed, phase: Math.random() * Math.PI * 2 });
        }
        return temp;
    }, [count]);

    useFrame((state) => {
        if (!mesh.current) return;
        const time = state.clock.getElapsedTime();

        particles.forEach((particle, i) => {
            // Slow spiral motion
            particle.angle += particle.speed * 0.001;
            particle.x = Math.cos(particle.angle) * particle.radius;
            particle.y = Math.sin(particle.angle) * particle.radius;

            // Gentle z oscillation
            particle.z = Math.sin(time * 0.2 + particle.phase) * 50;

            dummy.position.set(particle.x, particle.y, particle.z);
            dummy.scale.set(0.5, 0.5, 0.5);
            dummy.updateMatrix();
            mesh.current.setMatrixAt(i, dummy.matrix);
        });

        mesh.current.instanceMatrix.needsUpdate = true;
        mesh.current.rotation.z = time * 0.02; // Very slow rotation
    });

    return (
        <instancedMesh ref={mesh} args={[null, null, count]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.15} />
        </instancedMesh>
    );
}

// Animated gradient background based on remaining time
function AnimatedGradientPlane({ remainingYears }) {
    const meshRef = useRef();

    // Color scheme based on remaining years
    const getColorScheme = () => {
        if (remainingYears < 10) {
            // Red to orange (urgent)
            return {
                color1: new THREE.Color(0.8, 0.1, 0.1), // Deep red
                color2: new THREE.Color(0.9, 0.3, 0.1), // Orange
                color3: new THREE.Color(0.4, 0.05, 0.2) // Dark purple
            };
        } else if (remainingYears < 30) {
            // Purple to pink (caution)
            return {
                color1: new THREE.Color(0.4, 0.1, 0.6), // Purple
                color2: new THREE.Color(0.6, 0.2, 0.5), // Magenta
                color3: new THREE.Color(0.2, 0.05, 0.3) // Dark purple
            };
        } else {
            // Blue to cyan (calm)
            return {
                color1: new THREE.Color(0.05, 0.1, 0.3), // Deep blue
                color2: new THREE.Color(0.1, 0.3, 0.5), // Blue
                color3: new THREE.Color(0.05, 0.2, 0.4) // Cyan
            };
        }
    };

    const colorScheme = getColorScheme();

    useFrame((state) => {
        if (!meshRef.current) return;
        const time = state.clock.getElapsedTime();

        // Very slow color transition
        const t = (Math.sin(time * 0.1) + 1) / 2; // 0 to 1, slow oscillation
        const color = new THREE.Color();
        color.lerpColors(colorScheme.color1, colorScheme.color2, t);

        meshRef.current.material.color = color;
    });

    return (
        <mesh ref={meshRef} position={[0, 0, -150]}>
            <planeGeometry args={[500, 500]} />
            <meshBasicMaterial color={colorScheme.color1} />
        </mesh>
    );
}

// Slow moving concentric rings
function TimeRings({ remainingYears }) {
    const ringsRef = useRef([]);
    const ringCount = 5;

    const rings = useMemo(() => {
        return Array.from({ length: ringCount }, (_, i) => ({
            radius: 20 + i * 15,
            speed: 0.1 + i * 0.05,
            phase: (i / ringCount) * Math.PI * 2
        }));
    }, []);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();

        ringsRef.current.forEach((ring, i) => {
            if (ring) {
                const scale = 1 + Math.sin(time * rings[i].speed + rings[i].phase) * 0.2;
                ring.scale.set(scale, scale, 1);
                ring.material.opacity = 0.1 + Math.sin(time * rings[i].speed + rings[i].phase) * 0.05;
            }
        });
    });

    // Color based on remaining years
    const ringColor = remainingYears < 10 ? '#ff6b6b' : remainingYears < 30 ? '#a78bfa' : '#60a5fa';

    return (
        <group position={[0, 0, 0]}>
            {rings.map((ring, i) => (
                <mesh
                    key={i}
                    ref={el => ringsRef.current[i] = el}
                    rotation={[0, 0, 0]}
                >
                    <ringGeometry args={[ring.radius, ring.radius + 2, 64]} />
                    <meshBasicMaterial
                        color={ringColor}
                        transparent
                        opacity={0.1}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            ))}
        </group>
    );
}

export default function TimeMachineScene({ remainingYears = 50 }) {
    // Determine background gradient based on remaining years
    const getBackgroundGradient = () => {
        if (remainingYears < 10) {
            return 'radial-gradient(circle at center, #1a0a0a 0%, #0a0000 100%)'; // Dark red
        } else if (remainingYears < 30) {
            return 'radial-gradient(circle at center, #0f0a1a 0%, #050008 100%)'; // Dark purple
        } else {
            return 'radial-gradient(circle at center, #000a1a 0%, #000005 100%)'; // Dark blue
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            pointerEvents: 'none',
            background: getBackgroundGradient(),
            transition: 'background 2s ease-in-out'
        }}>
            <Canvas camera={{ position: [0, 0, 100], fov: 60, far: 1000 }}>
                <fog attach="fog" args={['#000000', 100, 1200]} />

                <Suspense fallback={null}>
                    <AnimatedGradientPlane remainingYears={remainingYears} />
                    <TimeFlowParticles remainingYears={remainingYears} />
                    <TimeRings remainingYears={remainingYears} />
                </Suspense>

                <ambientLight intensity={0.3} />
            </Canvas>
        </div>
    );
}
