import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Delicate snowflake-like particle shader
const particleVertexShader = `
  uniform float time;
  uniform float pixelRatio;
  attribute float size;
  attribute vec3 color;
  attribute float alpha;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = color;
    vAlpha = alpha;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    // Size attenuation based on depth - Smaller on mobile to prevent glare
    gl_PointSize = size * pixelRatio * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const particleFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    // Soft circular glow like snow
    vec2 uv = gl_PointCoord.xy - 0.5;
    float r = length(uv);
    if (r > 0.5) discard;
    
    // Soft radial gradient - Softer on mobile to reduce glare
    float glow = 1.0 - (r * 2.0);
    glow = pow(glow, 2.5); // Softer falloff to reduce brightness
    
    gl_FragColor = vec4(vColor, vAlpha * glow);
  }
`;

function DelicateSnowParticles({ remainingPercentage = 50, onDrop }) {
  const pointsRef = useRef();
  const lastDropTime = useRef(0);
  
  // Detect mobile device for particle optimization
  const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const count = isMobile ? 6000 : 12000; // Reduce particle count on mobile
  
  // Dimensions
  const width = 60; 
  const height = 40;
  
  // Calculate volume based on remaining percentage
  // Max volume is the full top container
  
  const { positions, colors, sizes, alphas, velocities, states, originalPositions } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);
    const velocities = new Float32Array(count); 
    const states = new Float32Array(count); // 0: top, 1: falling, 2: bottom
    const originalPositions = new Float32Array(count * 3);
    
    // Colors: Soft, beautiful colors for remaining time
    // Changed from dark amber to soft peach/lavender tones
    const baseColor = new THREE.Color('#ffb3ba'); // Soft pink/peach
    const accentColor = new THREE.Color('#bae1ff'); // Soft blue/lavender
    const snowColor = new THREE.Color('#e8e8e8'); // Soft white (less harsh)
    
    // Split count based on percentage
    // Calculation: remainingCount = count * (remainingPercentage / 100)
    // Example: If remainingPercentage = 50%, then remainingCount = 6000, usedCount = 6000
    // This ensures the particle count matches the time ratio exactly
    const remainingCount = Math.floor(count * (remainingPercentage / 100));
    const usedCount = count - remainingCount; // Explicitly calculate for clarity
    
    for (let i = 0; i < count; i++) {
      let x, y, z;
      
      if (i < remainingCount) {
        // Remaining Time (Top)
        // Form a cloud/cluster at the top
        // Size of cloud depends on remainingPercentage? 
        // Actually, the NUMBER of particles represents the percentage.
        // But user wants "size" adjustment. 
        // Let's fill a fixed volume with density, or fill a variable volume.
        // Fixed density, variable volume visualizes quantity better.
        
        const volumeHeight = 10 * (remainingPercentage / 100) + 2; // Min height 2
        
        x = (Math.random() - 0.5) * width;
        y = 10 + Math.random() * volumeHeight; // Start from y=10 upwards
        z = (Math.random() - 0.5) * 30; // Deep depth
        
        states[i] = 0;
        
        // Color: Soft, beautiful gradient between pink and lavender
        const colorMix = Math.random();
        const pColor = baseColor.clone().lerp(accentColor, colorMix);
        colors[i * 3] = pColor.r;
        colors[i * 3 + 1] = pColor.g;
        colors[i * 3 + 2] = pColor.b;
        // Reduce opacity on mobile to prevent glare
        alphas[i] = isMobile ? 0.3 + Math.random() * 0.2 : 0.7 + Math.random() * 0.3;
        
      } else {
        // Used Time (Bottom) - Already fallen snow
        // Beautiful distribution: Gaussian pile at bottom
        const r = (Math.random() + Math.random() + Math.random()) / 3; // Bell curve approx
        x = (r - 0.5) * width * 1.5;
        z = (Math.random() - 0.5) * 30;
        
        // Height depends on x/z to form a hill?
        // Simple flat snow field for now, slightly uneven
        y = -15 + Math.random() * 2; 
        
        states[i] = 2;
        
        colors[i * 3] = snowColor.r;
        colors[i * 3 + 1] = snowColor.g;
        colors[i * 3 + 2] = snowColor.b;
        // Reduce opacity on mobile to prevent glare
        alphas[i] = isMobile ? 0.15 + Math.random() * 0.15 : 0.3 + Math.random() * 0.3;
      }
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;
      
      // Smaller particles on mobile to prevent glare
      sizes[i] = isMobile ? Math.random() * 1.0 + 0.5 : Math.random() * 2.0 + 1.0;
      velocities[i] = 0;
    }
    
    return { positions, colors, sizes, alphas, velocities, states, originalPositions };
  }, [remainingPercentage, isMobile]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const positionAttribute = pointsRef.current.geometry.attributes.position;
    const colorAttribute = pointsRef.current.geometry.attributes.color;
    const alphaAttribute = pointsRef.current.geometry.attributes.alpha;
    
    // Drop logic: 1 per second
    // Check if 1 second has passed since last drop
    if (time - lastDropTime.current > 1.0) {
        // Find a random top particle to drop
        // In a real simulation we'd pick one from the bottom of the top pile.
        // Here we just pick a random one with state 0.
        // Optimization: don't scan all array, just try N random indices
        let dropped = false;
        for (let k = 0; k < 50; k++) {
            const idx = Math.floor(Math.random() * count);
            if (states[idx] === 0) {
                states[idx] = 1; // Start falling
                velocities[idx] = 0.02; // Very slow start
                lastDropTime.current = time;
                dropped = true;
                
                // Change to white immediately or gradually?
                // Let's keep amber until it falls a bit
                break; 
            }
        }
        
        // Notify parent component when a particle drops
        if (dropped && onDrop) {
            onDrop();
        }
    }
    
    const snowColor = new THREE.Color('#e8e8e8'); // Soft white
    
    for (let i = 0; i < count; i++) {
      const stateVal = states[i];
      let x = positions[i * 3];
      let y = positions[i * 3 + 1];
      let z = positions[i * 3 + 2];
      
      if (stateVal === 0) {
        // Top Static - Gently floating
        // Very subtle movement
        y = originalPositions[i * 3 + 1] + Math.sin(time * 0.5 + x) * 0.2;
        
      } else if (stateVal === 1) {
        // Falling
        velocities[i] += 0.0005; // Low gravity for "snow" feel
        y -= velocities[i];
        
        // Gentle sway
        x += Math.sin(time * 2.0 + i) * 0.01;
        z += Math.cos(time * 1.5 + i) * 0.01;
        
        // Transition color to soft white gradually
        const transitionFactor = Math.max(0, Math.min(1, (0 - y) / 5)); // Transition over 5 units
        const currentColor = new THREE.Color(
            colors[i * 3],
            colors[i * 3 + 1],
            colors[i * 3 + 2]
        );
        const finalColor = currentColor.clone().lerp(snowColor, transitionFactor);
        colors[i * 3] = finalColor.r;
        colors[i * 3 + 1] = finalColor.g;
        colors[i * 3 + 2] = finalColor.b;
        
        // Check landing
        // Random uneven floor
        const floorY = -15 + Math.sin(x * 0.1) * 2 + Math.cos(z * 0.1) * 2;
        
        if (y < floorY) {
            states[i] = 2; // Landed
            y = floorY;
        }
        
      } else {
        // Bottom Static (Snow)
        // Subtle glisten effect - Less prominent
        if (Math.random() < 0.005) {
            alphas[i] = 0.5 + Math.random() * 0.2; // Subtle flash
        } else {
            alphas[i] += (0.35 - alphas[i]) * 0.05; // Return to softer base
        }
      }
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    
    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
    alphaAttribute.needsUpdate = true;
    
    // Slow camera movement
    pointsRef.current.rotation.y = Math.sin(time * 0.05) * 0.02;
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={sizes.length}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-alpha"
          count={alphas.length}
          array={alphas}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        uniforms={{
          time: { value: 0 },
          pixelRatio: { value: typeof window !== 'undefined' ? window.devicePixelRatio : 2.0 }
        }}
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        transparent
        depthWrite={false}
        blending={isMobile ? THREE.NormalBlending : THREE.AdditiveBlending}
      />
    </points>
  );
}

// Max capacity guide (optional, subtle lines to show the "container" of life)
function MaxCapacityGuide() {
    return (
        <group position={[0, 15, 0]}>
            {/* Subtle top boundary */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[15, 15.1, 64]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.05} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

export default function DigitalHourglassScene({ remainingPercentage = 50, onParticleDrop, country = 'Japan' }) {
  const handleParticleDrop = () => {
    if (onParticleDrop) {
      onParticleDrop();
    }
  };
  
  return (
    <group>
       <DelicateSnowParticles remainingPercentage={remainingPercentage} onDrop={handleParticleDrop} />
       <MaxCapacityGuide />
    </group>
  );
}