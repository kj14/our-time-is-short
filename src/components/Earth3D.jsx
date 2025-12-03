import React, { useRef, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { countryCoordinates } from '../utils/lifeData';

function Earth({ targetCountry }) {
    const earthRef = useRef();
    const cloudsRef = useRef();
    const targetRotation = useRef(new THREE.Quaternion());

    // Load textures
    const [colorMap, specularMap, cloudsMap] = useLoader(THREE.TextureLoader, [
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png'
    ]);

    useEffect(() => {
        if (targetCountry && countryCoordinates[targetCountry]) {
            const { lat, lng } = countryCoordinates[targetCountry];

            // Three.js sphere UV mapping: 
            // Longitude (lng) maps to Y rotation. 0 is usually at prime meridian but texture might be offset.
            // Latitude (lat) maps to X rotation.

            // Adjustments for standard earth textures
            // Texture usually starts at -180 deg (International Date Line) or 0 deg (Prime Meridian)
            // For standard Three.js earth textures:
            // UV (0,0) is usually at (-180 longitude, -90 latitude)
            // We need to align the camera (positive Z) to the target lat/lng.

            const latRad = lat * (Math.PI / 180);
            const lngRad = lng * (Math.PI / 180);

            // Three.js rotation:
            // Y-axis rotation controls longitude.
            // X-axis rotation controls latitude.

            // Correct logic for standard texture:
            // 1. Rotate Y to bring longitude to front. 
            //    If texture center is 0 deg, we need to rotate by -lng.
            //    However, often an offset of -PI/2 is needed because 0 longitude might be at +X or -Z.
            //    Let's try adjusting the offset based on user feedback.
            //    "Japan (138E) shows continent" -> It might be showing America (-90 to -100) or Africa.
            //    If it shows America, we are off by ~180 degrees or rotating wrong way.

            const euler = new THREE.Euler(
                latRad,
                -lngRad - Math.PI / 2, // Try -PI/2 offset. If Japan shows America, try +PI/2 or different offset.
                0,
                'YXZ'
            );

            // Let's try a different offset if the previous one was wrong.
            // If Japan (138) showed America (-100), difference is ~240 degrees.
            // Let's try simply -lngRad.

            const eulerCorrected = new THREE.Euler(
                0,
                -lngRad + Math.PI / 2, // Adjusted offset
                latRad, // Tilt for latitude
                'YXZ' // Order matters
            );

            // Re-evaluating the rotation to face Z-axis (camera)
            // We need the point (lat, lng) to be at (0, 0, 1) in world space.
            // Initial point (0,0) on sphere is usually at (0, 0, 1) or (1, 0, 0).
            // Let's assume (0,0) is at (0, 0, 1).
            // To bring (lat, lng) to (0,0), we need to rotate by (-lat, -lng).

            // However, it's easier to rotate the OBJECT so that (lat, lng) moves to (0, 0, 1).
            // If texture 0,0 is at Z+, then we rotate Y by -lng and X by lat.

            // Trial and error fix based on "Japan shows Australia":
            // If Japan (North) shows Australia (South), the latitude rotation is inverted.
            // In Three.js with 'YXZ' order, or depending on texture mapping, 
            // positive X rotation might be tilting the wrong way.
            // Let's invert latRad.

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

    useFrame((state, delta) => {
        if (earthRef.current) {
            // Smoothly interpolate current rotation to target rotation
            earthRef.current.quaternion.slerp(targetRotation.current, 2 * delta);

            // Rotate clouds slightly faster/independent
            if (cloudsRef.current) {
                cloudsRef.current.rotation.y += delta * 0.05;
            }
        }
    });

    return (
        <group>
            {/* Earth Sphere */}
            <mesh ref={earthRef} rotation={[0, 0, 0]}>
                <sphereGeometry args={[2, 64, 64]} />
                <meshPhongMaterial
                    map={colorMap}
                    specularMap={specularMap}
                    specular={new THREE.Color('grey')}
                    shininess={10}
                />

                {/* Clouds Sphere (slightly larger) */}
                <mesh ref={cloudsRef} scale={[1.01, 1.01, 1.01]}>
                    <sphereGeometry args={[2, 64, 64]} />
                    <meshPhongMaterial
                        map={cloudsMap}
                        transparent={true}
                        opacity={0.8}
                        blending={THREE.AdditiveBlending}
                        side={THREE.DoubleSide}
                        depthWrite={false}
                    />
                </mesh>
            </mesh>

            {/* Atmosphere Glow */}
            <mesh scale={[2.1, 2.1, 2.1]}>
                <sphereGeometry args={[2, 64, 64]} />
                <meshBasicMaterial
                    color="#4db5ff"
                    transparent
                    opacity={0.1}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
        </group>
    );
}

export default function Earth3D({ targetCountry = "Japan" }) {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0, // Behind content
            background: 'radial-gradient(circle at center, #050505 0%, #000000 100%)'
        }}>
            <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1.5} />
                <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <Suspense fallback={
                    <mesh scale={[2, 2, 2]}>
                        <sphereGeometry args={[1, 32, 32]} />
                        <meshBasicMaterial color="#1a2b3c" wireframe />
                    </mesh>
                }>
                    <Earth targetCountry={targetCountry} />
                </Suspense>
                <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.5} />
            </Canvas>
        </div>
    );
}
