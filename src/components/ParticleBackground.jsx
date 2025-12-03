import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Sparkles, Float, Cloud, Text } from '@react-three/drei';
import * as THREE from 'three';

function RotatingStars({ speed = 1 }) {
    const ref = useRef();
    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.x -= (delta / 15) * speed;
            ref.current.rotation.y -= (delta / 20) * speed;
        }
    });
    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Stars
                ref={ref}
                radius={100}
                depth={50}
                count={7000}
                factor={4}
                saturation={0}
                fade
                speed={speed}
            />
        </group>
    );
}

function GalaxyStream({ count = 2000, color = "#ffffff", radius = 10, speed = 0.1 }) {
    const points = useRef();

    // Generate particles in a spiral/stream
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const t = Math.random() * 100;
            const factor = (Math.random() - 0.5) * 2;
            const x = Math.cos(t) * radius + factor;
            const y = Math.sin(t) * radius + factor;
            const z = (Math.random() - 0.5) * 50;
            temp.push(x, y, z);
        }
        return new Float32Array(temp);
    }, [count, radius]);

    useFrame((state, delta) => {
        if (points.current) {
            points.current.rotation.z += delta * speed * 0.1;
            points.current.rotation.y += delta * speed * 0.05;
        }
    });

    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particles.length / 3}
                    array={particles}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.05}
                color={color}
                transparent
                opacity={0.6}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
}

function ShootingStar() {
    const ref = useRef();
    const [active, setActive] = useState(false);
    const [startPos] = useState(() => new THREE.Vector3(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40,
        -20
    ));

    useFrame((state, delta) => {
        if (!active) {
            if (Math.random() < 0.005) { // 0.5% chance per frame to start
                setActive(true);
                ref.current.position.copy(startPos);
                ref.current.visible = true;
            }
        } else {
            ref.current.position.z += delta * 40; // Move fast towards camera
            ref.current.position.x += delta * 5;

            if (ref.current.position.z > 10) {
                setActive(false);
                ref.current.visible = false;
            }
        }
    });

    return (
        <mesh ref={ref} visible={false}>
            <boxGeometry args={[0.1, 0.1, 2]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
    );
}

function Nebula({ color, position }) {
    return (
        <Float speed={1} rotationIntensity={0.2} floatIntensity={0.2} position={position}>
            <Cloud
                opacity={0.1}
                speed={0.2} // Rotation speed
                width={10} // Width of the full cloud
                depth={1.5} // Z-dir depth
                segments={10} // Number of particles
                color={color}
            />
        </Float>
    );
}

export default function ParticleBackground({ speed = 1 }) {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1,
            background: 'radial-gradient(circle at center, #050505 0%, #000000 100%)'
        }}>
            <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={0.5} color="#4c1d95" />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#0ea5e9" />

                <RotatingStars speed={speed} />

                {/* Galaxy Streams */}
                <GalaxyStream count={3000} radius={15} color="#8b5cf6" speed={speed} />
                <GalaxyStream count={2000} radius={20} color="#3b82f6" speed={speed * 0.8} />

                {/* Nebulas for atmosphere */}
                <Nebula color="#4c1d95" position={[10, 5, -10]} />
                <Nebula color="#0ea5e9" position={[-10, -5, -15]} />

                {/* Floating Sparkles */}
                <Float speed={2 * speed} rotationIntensity={1} floatIntensity={1}>
                    <Sparkles
                        count={300}
                        scale={25}
                        size={3}
                        speed={0.4 * speed}
                        opacity={0.5}
                        color="#ffffff"
                    />
                </Float>

                {/* Shooting Stars */}
                <ShootingStar />
                <ShootingStar />
                <ShootingStar />
            </Canvas>
        </div>
    );
}





