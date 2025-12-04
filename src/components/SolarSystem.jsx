import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Earth from './Earth';

const Planet = ({ radius, distance, color, speed, angleOffset = 0, name }) => {
  const ref = useRef();
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed + angleOffset;
    ref.current.position.x = Math.cos(t) * distance;
    ref.current.position.z = Math.sin(t) * distance;
  });

  return (
    <group>
        {/* Orbit Line */}
        <mesh rotation={[-Math.PI/2, 0, 0]}>
            <ringGeometry args={[distance - 0.05, distance + 0.05, 64]} />
            <meshBasicMaterial color="#ffffff" opacity={0.1} transparent side={THREE.DoubleSide} />
        </mesh>
        {/* Planet Body */}
        <mesh ref={ref}>
            <sphereGeometry args={[radius, 32, 32]} />
            <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
    </group>
  );
};

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
                <ringGeometry args={[distance - 0.05, distance + 0.05, 64]} />
                <meshBasicMaterial color="#ffffff" opacity={0.1} transparent side={THREE.DoubleSide} />
            </mesh>
            <group ref={groupRef}>
                <Earth targetCountry={targetCountry} />
            </group>
        </group>
    )
}

export default function SolarSystem({ onSunClick, targetCountry }) {
    const sunRef = useRef();

    // Sun rotation
    useFrame((state, delta) => {
        if (sunRef.current) {
            sunRef.current.rotation.y += delta * 0.05;
        }
    });

    return (
        <group>
            {/* Sun */}
            <group onClick={(e) => {
                    e.stopPropagation();
                    onSunClick && onSunClick();
                }}
                onPointerOver={() => document.body.style.cursor = 'pointer'}
                onPointerOut={() => document.body.style.cursor = 'auto'}
            >
                <mesh ref={sunRef}>
                    <sphereGeometry args={[4, 32, 32]} />
                    <meshBasicMaterial color="#FDB813" />
                </mesh>
                {/* Sun Glow/Light */}
                <pointLight intensity={2} distance={100} decay={2} color="#FDB813" />
                <mesh scale={[1.2, 1.2, 1.2]}>
                    <sphereGeometry args={[4, 32, 32]} />
                    <meshBasicMaterial color="#FDB813" transparent opacity={0.2} />
                </mesh>
            </group>

            {/* Planets */}
            <Planet name="Mercury" distance={8} radius={0.4} color="#A5A5A5" speed={0.8} />
            <Planet name="Venus" distance={12} radius={0.9} color="#E3BB76" speed={0.6} angleOffset={1} />
            
            {/* Earth */}
            <EarthWrapper distance={18} speed={0.4} angleOffset={2} targetCountry={targetCountry} />
            
            <Planet name="Mars" distance={24} radius={0.5} color="#DD4C22" speed={0.3} angleOffset={3} />
            <Planet name="Jupiter" distance={35} radius={2.5} color="#D8CA9D" speed={0.15} angleOffset={4} />
            <Planet name="Saturn" distance={45} radius={2.0} color="#C5AB6E" speed={0.1} angleOffset={5} />
            <Planet name="Uranus" distance={55} radius={1.5} color="#93B8BE" speed={0.08} angleOffset={0} />
            <Planet name="Neptune" distance={65} radius={1.5} color="#5B5DDF" speed={0.06} angleOffset={1} />
        </group>
    );
}

