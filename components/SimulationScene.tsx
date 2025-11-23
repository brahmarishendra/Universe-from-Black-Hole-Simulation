import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, ThreeEvent, extend } from '@react-three/fiber';
import { OrbitControls, Stars, Trail, Sparkles, Html, Sphere, shaderMaterial, Instance, Instances, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { SimulationState, CosmicObject, SimulationPhase } from '../types';

// --- Shader Material for Light Stream (Siphon) ---
const LightStreamMaterial = shaderMaterial(
  { time: 0, color: new THREE.Color('#FDB813'), opacity: 1.0 },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    varying vec2 vUv;
    uniform float time;
    uniform vec3 color;
    uniform float opacity;

    // Simplex noise (simplified)
    float random (in vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233)))* 43758.5453123);
    }

    void main() {
        // Create flowing plasma effect
        float flow = vUv.y * 5.0 - time * 5.0;
        float noise = random(vec2(vUv.x * 10.0, floor(flow)));
        
        // Beam concentration in center
        float beam = 1.0 - abs(vUv.x - 0.5) * 2.0;
        beam = pow(beam, 3.0);
        
        float alpha = beam * noise * opacity;
        
        // Fade ends
        alpha *= smoothstep(0.0, 0.1, vUv.y) * (1.0 - smoothstep(0.9, 1.0, vUv.y));

        gl_FragColor = vec4(color, alpha);
    }
  `
);

// --- Shader Material for Sun Rays (God Rays) ---
const SunRaysMaterial = shaderMaterial(
  { time: 0, color: new THREE.Color('#FDB813'), intensity: 1.0 },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    varying vec2 vUv;
    uniform float time;
    uniform vec3 color;
    uniform float intensity;

    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
      vec2 center = vec2(0.5);
      vec2 pos = vUv - center;
      float r = length(pos) * 2.0; // 0 to 1
      float a = atan(pos.y, pos.x);

      // Generate Rays using sin waves and time
      float rays = sin(a * 20.0 + time * 0.2) * 0.2 + sin(a * 45.0 - time * 0.1) * 0.1 + 0.8;
      
      // Add some noise/flicker
      float noise = random(vUv + time * 0.01) * 0.1;
      rays += noise;

      // Radial gradient falloff
      float glow = 1.0 - smoothstep(0.0, 0.7, r);
      glow = pow(glow, 1.5); 

      // Combine
      float alpha = glow * rays * intensity;
      
      // Soft edge cutoff
      alpha *= 1.0 - smoothstep(0.8, 1.0, r);

      vec3 finalColor = color + (vec3(1.0) * alpha * 0.5); // Add white core

      gl_FragColor = vec4(finalColor, alpha);
    }
  `
);

extend({ LightStreamMaterial, SunRaysMaterial });

// Add type declarations for React Three Fiber elements
declare module '@react-three/fiber' {
  interface ThreeElements {
    lightStreamMaterial: any;
    sunRaysMaterial: any;
  }
}

// --- Constants & Data ---
// DISTANCES INCREASED for better separation
const SOLAR_SYSTEM: CosmicObject[] = [
  { 
    name: "Mercury", radius: 0.2, color: "#A5A5A5", distance: 10, angle: 0, speed: 1.5, type: 'planet',
    mass: "3.285 × 10²³ kg", description: "Smallest planet, closest to the Sun."
  },
  { 
    name: "Venus", radius: 0.5, color: "#E3BB76", distance: 16, angle: 2, speed: 1.2, type: 'planet',
    mass: "4.867 × 10²⁴ kg", description: "First victim of the tidal forces."
  },
  { 
    name: "Earth", radius: 0.55, color: "#0077BE", distance: 24, angle: 4, speed: 1.0, type: 'planet',
    mass: "5.972 × 10²⁴ kg", description: "Our home."
  },
  { 
    name: "Mars", radius: 0.3, color: "#C0392B", distance: 32, angle: 1, speed: 0.8, type: 'planet',
    mass: "6.39 × 10²³ kg", description: "The Red Planet."
  },
  { 
    name: "Jupiter", radius: 1.8, color: "#D4AC0D", distance: 55, angle: 5, speed: 0.4, type: 'gas_giant',
    mass: "1.898 × 10²⁷ kg", description: "Massive gas giant."
  },
  { 
    name: "Saturn", radius: 1.5, color: "#F4D03F", distance: 85, angle: 3, speed: 0.3, type: 'gas_giant', 
    ring: { inner: 2, outer: 3.5, color: "#F7DC6F" },
    mass: "5.683 × 10²⁶ kg", description: "Known for its stunning ring system."
  }
];

const SUN_DATA: CosmicObject = {
    name: "The Sun", radius: 2.5, color: "#FDB813", distance: 0, angle: 0, speed: 0, type: 'star',
    mass: "1.989 × 10³⁰ kg", description: "G-type main-sequence star."
};

const BLACK_HOLE_DATA: CosmicObject = {
    name: "Gaia BH1", radius: 1.5, color: "#000000", distance: 0, angle: 0, speed: 0, type: 'black_hole',
    mass: "~1.9 × 10³¹ kg", description: "Stellar-mass black hole. The Intruder."
};

// --- Helpers ---
const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

// --- Components ---

const Tooltip = ({ object }: { object: CosmicObject }) => {
  return (
    <Html position={[0, object.radius + 1, 0]} center zIndexRange={[100, 0]} distanceFactor={15}>
      <div className="bg-black/90 border border-white/20 p-3 rounded-lg text-white min-w-[200px] backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.1)] pointer-events-none select-none transition-opacity duration-200 font-outfit">
        <h3 className="font-bold text-base uppercase text-orange-400 tracking-widest border-b border-white/10 pb-1 mb-2">{object.name}</h3>
        <p className="text-xs text-blue-200 font-mono mb-1">Mass: {object.mass}</p>
        <p className="text-[11px] text-gray-400 leading-tight">{object.description}</p>
      </div>
    </Html>
  );
};

// Asteroid Belt (InstancedMesh) - Adjusted for new spacing and visibility logic
const AsteroidBelt = ({ phase }: { phase: SimulationPhase }) => {
    const count = 1500;
    const asteroids = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = randomRange(35, 45); // Between Mars (32) and Jupiter (55)
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = randomRange(-0.5, 0.5);
            const scale = randomRange(0.05, 0.15);
            temp.push({ position: [x, y, z], scale, rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0] });
        }
        return temp;
    }, []);

    if (phase === 'void' || phase === 'rebirth') return null;

    return (
        <Instances range={count}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#888" roughness={0.8} />
            {asteroids.map((data, i) => (
                <Instance key={i} position={data.position as any} scale={data.scale} rotation={data.rotation as any} />
            ))}
        </Instances>
    );
};

// Comets - Hides during Singularity/Rebirth
const CometSystem = ({ phase }: { phase: SimulationPhase }) => {
    const comets = useMemo(() => Array.from({ length: 3 }), []);

    if (phase === 'void' || phase === 'rebirth') return null;

    return (
        <group>
            {comets.map((_, i) => (
                <Comet key={i} index={i} />
            ))}
        </group>
    );
}

const Comet = ({ index }: { index: number }) => {
    const ref = useRef<THREE.Group>(null);
    const speed = 0.3 + index * 0.1;
    const offset = index * (Math.PI * 2 / 3);
    
    useFrame(({ clock }) => {
        if (!ref.current) return;
        const t = clock.getElapsedTime() * speed + offset;
        // Elliptical orbit wider for new scale
        ref.current.position.x = Math.cos(t) * 90;
        ref.current.position.z = Math.sin(t) * 30;
        ref.current.position.y = Math.sin(t * 2) * 10;
        ref.current.lookAt(0,0,0);
    });

    return (
        <group ref={ref}>
            <Trail width={1} length={15} color="#00FFFF" attenuation={(t) => t}>
                <mesh>
                    <sphereGeometry args={[0.2, 16, 16]} />
                    <meshBasicMaterial color="#00FFFF" />
                </mesh>
            </Trail>
            <Sparkles count={20} scale={2} color="#fff" />
        </group>
    );
}

// Milky Way Background
const MilkyWay: React.FC<{ phase: SimulationPhase }> = ({ phase }) => {
    const groupRef = useRef<THREE.Group>(null);
    const particles1Ref = useRef<any>(null);
    const particles2Ref = useRef<any>(null);
    const glowRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!groupRef.current) return;
        
        // Check zoom distance
        const cameraDist = state.camera.position.length();
        const isZoomedOut = cameraDist > 100;
        const isPostRebirth = phase === 'rebirth' || phase === 'stable';
        
        // Target opacity
        const targetOpacity = (isZoomedOut && isPostRebirth) ? 0.8 : 0;
        
        // Lerp opacity for smooth transition
        if (particles1Ref.current) particles1Ref.current.material.opacity = THREE.MathUtils.lerp(particles1Ref.current.material.opacity, targetOpacity * 0.3, 0.05);
        if (particles2Ref.current) particles2Ref.current.material.opacity = THREE.MathUtils.lerp(particles2Ref.current.material.opacity, targetOpacity * 0.5, 0.05);
        if (glowRef.current) {
            const glowMat = glowRef.current.material as THREE.MeshBasicMaterial;
            glowMat.opacity = THREE.MathUtils.lerp(glowMat.opacity, targetOpacity * 0.05, 0.05);
        }

        // Slowly rotate galaxy
        groupRef.current.rotation.y += 0.0002;
    });

    return (
        <group ref={groupRef} rotation={[Math.PI / 3, 0, 0]} position={[0, -100, -200]}>
            <Sparkles ref={particles1Ref} count={5000} scale={[400, 100, 400]} size={50} speed={0} opacity={0} color="#8844ff" />
            <Sparkles ref={particles2Ref} count={5000} scale={[300, 50, 300]} size={80} speed={0} opacity={0} color="#ffaa88" />
             {/* Center Glow */}
            <mesh ref={glowRef} position={[0,0,0]}>
                 <sphereGeometry args={[50, 64, 64]} />
                 <meshBasicMaterial color="#fff" transparent opacity={0} side={THREE.BackSide} />
            </mesh>
        </group>
    )
}

// Visuals for light/matter streaming from Sun to BH
const LightStream: React.FC<{ startPos: THREE.Vector3, endPos: THREE.Vector3, intensity: number }> = ({ startPos, endPos, intensity }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const matRef = useRef<any>(null);

    useFrame((state, delta) => {
        if (meshRef.current && matRef.current) {
            matRef.current.time = state.clock.getElapsedTime();
            matRef.current.opacity = intensity;
            
            // Orient cylinder
            const direction = new THREE.Vector3().subVectors(endPos, startPos);
            const distance = direction.length();
            
            meshRef.current.position.copy(startPos).add(direction.multiplyScalar(0.5));
            meshRef.current.lookAt(endPos);
            meshRef.current.rotateX(Math.PI / 2);
            meshRef.current.scale.set(1, distance, 1);
        }
    });

    return (
        <mesh ref={meshRef}>
            {/* Cylinder radius tapers towards BH? Simplified as cylinder for now */}
            <cylinderGeometry args={[0.1, 1.5, 1, 16, 1, true]} />
            <lightStreamMaterial ref={matRef} transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
    );
};

// The Intruder: Gaia BH1
const IntruderBlackHole: React.FC<{ 
  phase: SimulationPhase; 
  timer: number; 
  setBhPosition: (pos: THREE.Vector3) => void;
  onHover: (obj: CosmicObject | null) => void;
  sunConsumed: number; // 0 to 1
}> = ({ phase, timer, setBhPosition, onHover, sunConsumed }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  // Visual State Calculation
  const isTransparent = phase === 'approach';
  const isVoid = phase === 'void';
  const isConsumption = phase === 'consumption';
  
  // Materials Logic
  // Void: Bright white singularity
  // Consumption: Vantablack
  // Approach: Transparent Lens
  
  useFrame((state) => {
    if (!groupRef.current) return;
    
    // Movement Logic
    let targetPos = new THREE.Vector3(0, 0, 80); 
    
    if (phase === 'approach') {
      const t = Math.min(1, timer / 10);
      targetPos.z = THREE.MathUtils.lerp(80, 20, t);
      targetPos.x = Math.sin(timer * 0.5) * 5; 
    } else if (phase === 'interaction') {
      const t = timer * 0.5; 
      const radius = THREE.MathUtils.lerp(20, 8, Math.min(1, timer/20)); 
      targetPos.x = Math.cos(t) * radius;
      targetPos.z = Math.sin(t) * radius;
    } else if (phase === 'consumption') {
       const t = Math.min(1, timer / 5);
       targetPos.set(0, 0, 0).lerp(new THREE.Vector3(0,0,0), t);
    } else if (phase === 'void' || phase === 'rebirth') {
       targetPos.set(0,0,0);
    }

    groupRef.current.position.copy(targetPos);
    setBhPosition(targetPos); 
    groupRef.current.lookAt(state.camera.position); 
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    onHover(BLACK_HOLE_DATA);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    onHover(null);
    document.body.style.cursor = 'default';
  };

  if (phase === 'stable') return null;
  if (phase === 'rebirth') return null; 

  return (
    <group 
      ref={groupRef}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {isVoid ? (
          // Void Phase: Singularity
          <mesh>
              <sphereGeometry args={[0.2, 32, 32]} />
              <meshBasicMaterial color="#ffffff" toneMapped={false} />
              <pointLight intensity={50} distance={50} decay={2} color="#ffffff" />
          </mesh>
      ) : (
          // Standard Black Hole Body
          <group>
             <mesh>
                <sphereGeometry args={[1.5, 64, 64]} />
                {isTransparent ? (
                    <meshPhysicalMaterial 
                        color={new THREE.Color(0.1, 0.1, 0.2)}
                        roughness={0} 
                        transmission={0.9} 
                        thickness={2} 
                        ior={1.5}
                        transparent
                    />
                ) : (
                    // Pitch Black for Consumption
                    <meshBasicMaterial color="#000000" />
                )}
             </mesh>
             
             {/* Lensing Ring (Subtle Halo) */}
             {!isTransparent && (
                 <mesh scale={[1.1, 1.1, 1.1]}>
                    <sphereGeometry args={[1.5, 64, 64]} />
                    <meshPhysicalMaterial 
                        color="#000000"
                        roughness={0}
                        transmission={0.9}
                        thickness={0.5}
                        ior={2.0}
                        transparent
                        side={THREE.BackSide}
                    />
                 </mesh>
             )}
          </group>
      )}

      {/* Accretion Disk - Grows as Sun is consumed */}
      {(phase === 'interaction' || phase === 'consumption') && (
        <mesh rotation={[Math.PI/2 + 0.5, 0, 0]}>
          <ringGeometry args={[2, 2 + (sunConsumed * 4), 64]} />
          <meshBasicMaterial 
            color="#ff8800" 
            transparent 
            opacity={0.8} 
            side={THREE.DoubleSide} 
          />
        </mesh>
      )}
      {hovered && <Tooltip object={BLACK_HOLE_DATA} />}
    </group>
  );
};

// Sun Rays Component (God Rays)
const SunRays: React.FC<{ intensity: number }> = ({ intensity }) => {
    const matRef = useRef<any>(null);
    useFrame(({ clock }) => {
        if(matRef.current) {
            matRef.current.time = clock.getElapsedTime();
            matRef.current.intensity = intensity;
        }
    });

    return (
        <Billboard>
            <mesh>
                <planeGeometry args={[25, 25]} />
                <sunRaysMaterial ref={matRef} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>
        </Billboard>
    );
}

// The Sun
const Sun: React.FC<{ 
  phase: SimulationPhase; 
  timer: number; 
  bhPosition: THREE.Vector3;
  onHover: (obj: CosmicObject | null) => void;
  onConsume: (amount: number) => void;
}> = ({ phase, timer, bhPosition, onHover, onConsume }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const [hovered, setHovered] = useState(false);
  const [currentIntensity, setCurrentIntensity] = useState(1);
  const [wobbleOffset, setWobbleOffset] = useState(new THREE.Vector3());
  
  useFrame((state) => {
    if (!meshRef.current || !lightRef.current) return;

    if (phase === 'interaction') {
       const dist = bhPosition.length();
       // Dimming effect as BH approaches (eating light)
       const dimFactor = Math.min(1, dist / 20);
       lightRef.current.intensity = 2 * dimFactor;
       setCurrentIntensity(dimFactor);
       
       const wobbleDir = bhPosition.clone().negate().normalize().multiplyScalar(2); 
       meshRef.current.position.lerp(wobbleDir, 0.1);
       setWobbleOffset(meshRef.current.position.clone()); // Update for light stream start

       const stretch = Math.max(1, 15 / (dist + 0.1)); 
       meshRef.current.scale.set(1, 1, 1 + (stretch * 0.2)); 
    } else if (phase === 'consumption') {
       // Sun shrinks
       const scale = Math.max(0, 1 - (timer / 5));
       meshRef.current.scale.setScalar(scale);
       meshRef.current.position.lerp(new THREE.Vector3(0,0,0), 0.1);
       setWobbleOffset(meshRef.current.position.clone());
       
       lightRef.current.intensity = scale * 0.5;
       setCurrentIntensity(scale);
       
       // Inform parent about consumption level for Ring growth
       onConsume(1 - scale);
    } else if (phase === 'stable' || phase === 'approach') {
        meshRef.current.position.set(0,0,0);
        setWobbleOffset(new THREE.Vector3(0,0,0));
        meshRef.current.scale.setScalar(1);
        lightRef.current.intensity = 2;
        setCurrentIntensity(1);
        onConsume(0);
    }
  });

  if (phase === 'void' || phase === 'rebirth') return null;

  const showStream = (phase === 'interaction' || phase === 'consumption') && currentIntensity > 0.05;

  return (
    <group>
        <SunRays intensity={currentIntensity} />
        {showStream && <LightStream startPos={wobbleOffset} endPos={bhPosition} intensity={currentIntensity} />}
        <mesh 
            ref={meshRef}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(SUN_DATA); }}
            onPointerOut={() => { setHovered(false); onHover(null); }}
        >
        <sphereGeometry args={[2.5, 64, 64]} />
        <meshBasicMaterial color={hovered ? "#ffcc00" : "#FDB813"} />
        <pointLight ref={lightRef} distance={100} decay={2} color="#FDB813" />
        </mesh>
        {hovered && <Tooltip object={SUN_DATA} />}
    </group>
  );
};

const Planet: React.FC<{ 
  data: CosmicObject; 
  phase: SimulationPhase; 
  timer: number; 
  bhPosition: THREE.Vector3;
  onHover: (obj: CosmicObject | null) => void;
  onConsume: (amount: number) => void;
}> = ({ data, phase, timer, bhPosition, onHover }) => {
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  const [orbitState, setOrbitState] = useState({
    dist: data.distance,
    angle: data.angle,
    destroyed: false
  });

  useFrame((state, delta) => {
    if (!ref.current || orbitState.destroyed) return;

    // Reset logic for Rebirth
    // If stable, assume full reset. If Rebirth, we animate formation.
    if (phase === 'stable' && orbitState.destroyed) {
         setOrbitState({dist: data.distance, angle: data.angle, destroyed: false});
    }

    let speed = data.speed * delta * 0.5; 
    let newDist = orbitState.dist;
    let newAngle = orbitState.angle + speed;
    let wobbleX = 0; 
    let wobbleZ = 0;
    let scale = 1;

    if (phase === 'rebirth') {
        // Formation Animation: Spiral out from center
        const rebirthProgress = Math.min(1, timer / 10);
        newDist = THREE.MathUtils.lerp(0.1, data.distance, rebirthProgress);
        speed = 2.0 * (1.0 - rebirthProgress) + data.speed * 0.5; // Fast spin initially
        newAngle += speed;
        scale = rebirthProgress; // Grow from 0
    }
    else if (phase === 'interaction') {
        const bhDist = ref.current.position.distanceTo(bhPosition);
        const gravity = 50 / (bhDist * bhDist + 0.1);
        const dirToBh = new THREE.Vector3().subVectors(bhPosition, ref.current.position).normalize();
        wobbleX = dirToBh.x * gravity * delta;
        wobbleZ = dirToBh.z * gravity * delta;

        if (data.name === 'Venus' && timer > 5) {
             setOrbitState(prev => ({...prev, destroyed: true}));
        }
    } else if (phase === 'consumption') {
        newDist = THREE.MathUtils.lerp(newDist, 0, delta * 0.5);
        if (newDist < 2) setOrbitState(prev => ({...prev, destroyed: true}));
    }

    setOrbitState(prev => ({...prev, dist: newDist, angle: newAngle}));
    const x = Math.cos(newAngle) * newDist + wobbleX;
    const z = Math.sin(newAngle) * newDist + wobbleZ;
    ref.current.position.set(x, 0, z);
    ref.current.scale.setScalar(scale);
  });

  // Removed phase check for rebirth so it renders
  if (orbitState.destroyed || phase === 'void') return null;

  return (
    <group ref={ref}>
      <Trail width={data.radius * 2} length={8} color={data.color} attenuation={(t) => t * t}>
        <mesh 
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(data); }}
            onPointerOut={() => { setHovered(false); onHover(null); }}
        >
          <sphereGeometry args={[data.radius, 32, 32]} />
          <meshStandardMaterial 
            color={hovered ? "#ffffff" : data.color} 
            emissive={hovered ? data.color : "#000000"}
            emissiveIntensity={hovered ? 0.5 : 0}
          />
        </mesh>
      </Trail>
       {data.ring && (
        <mesh rotation={[-Math.PI / 3, 0, 0]}>
          <ringGeometry args={[data.ring.inner, data.ring.outer, 64]} />
          <meshBasicMaterial color={data.ring.color} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
      {hovered && <Tooltip object={data} />}
    </group>
  );
};

// Replaces White Hole with Big Bang Inflation & Protoplanetary Disk
const BigBangInflation: React.FC<{ active: boolean }> = ({ active }) => {
  const shockwaveRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (!active) return;
    
    // Shockwave expansion
    if (shockwaveRef.current) {
        shockwaveRef.current.scale.addScalar(delta * 40);
        const mat = shockwaveRef.current.material as THREE.MeshBasicMaterial;
        if (mat.opacity > 0) mat.opacity -= delta * 0.1;
    }
    
    // Cloud rotation
    if (cloudRef.current) {
        cloudRef.current.rotation.y += delta * 0.2;
        cloudRef.current.scale.lerp(new THREE.Vector3(1.5, 0.5, 1.5), delta * 0.1);
    }

    // Camera shake (diminishing)
    if (Math.random() > 0.5) {
        state.camera.position.x += (Math.random() - 0.5) * 0.1;
        state.camera.position.y += (Math.random() - 0.5) * 0.1;
    }
  });

  if (!active) return null;
  return (
    <group>
      {/* Central Brightness */}
      <Sparkles count={3000} scale={100} size={30} speed={8} opacity={1} color="#ffffff" />
      <pointLight intensity={50} color="#fff" distance={1000} decay={1} />
      <ambientLight intensity={5} />
      
      {/* Core Seed */}
      <mesh>
         <sphereGeometry args={[1.5, 64, 64]} />
         <meshBasicMaterial color="#fff" toneMapped={false} />
      </mesh>

      {/* Initial Shockwave */}
      <mesh ref={shockwaveRef} rotation={[Math.PI/2, 0, 0]}>
        <ringGeometry args={[0.5, 1, 64]} />
        <meshBasicMaterial color="#fff" transparent opacity={1} side={THREE.DoubleSide} />
      </mesh>

      {/* Protoplanetary Cloud (Visualizing Creation) */}
      <group ref={cloudRef}>
        <Sparkles count={2000} scale={[150, 20, 150]} size={100} speed={0.5} opacity={0.5} color="#FFD700" />
        <Sparkles count={2000} scale={[200, 30, 200]} size={80} speed={0.2} opacity={0.3} color="#00FFFF" />
      </group>
    </group>
  );
};

// --- Main Scene Controller ---

const SceneLogic: React.FC<{ 
    params: SimulationState;
    onUpdate: (phase: SimulationPhase, year: number) => void; 
}> = ({ params, onUpdate }) => {
  const [sceneState, setSceneState] = useState({
    phase: 'stable' as SimulationPhase,
    timer: 0
  });

  const [bhPosition, setBhPosition] = useState(new THREE.Vector3(0,0,100));
  const [sunConsumed, setSunConsumed] = useState(0);
  const [hoveredObj, setHoveredObj] = useState<CosmicObject | null>(null);

  // Sequence & Physics Logic
  useFrame((state, delta) => {
    if (!params.isPlaying) return;
    
    const dt = delta * (params.timeScale || 1);
    
    setSceneState(prev => {
      let nextTimer = prev.timer + dt;
      let nextPhase = prev.phase;

      if (prev.phase === 'stable' && nextTimer > 5) {
        nextPhase = 'approach'; nextTimer = 0;
      } else if (prev.phase === 'approach' && nextTimer > 10) {
        nextPhase = 'interaction'; nextTimer = 0;
      } else if (prev.phase === 'interaction' && nextTimer > 20) {
        nextPhase = 'consumption'; nextTimer = 0;
      } else if (prev.phase === 'consumption' && nextTimer > 10) {
        nextPhase = 'void'; nextTimer = 0;
      } else if (prev.phase === 'void' && nextTimer > 5) {
        nextPhase = 'rebirth'; nextTimer = 0;
      } else if (prev.phase === 'rebirth' && nextTimer > 15) { 
        nextPhase = 'stable'; nextTimer = 0;
      }

      return { phase: nextPhase, timer: nextTimer };
    });

    let currentYear = 2025;
    const t = sceneState.timer;
    
    switch(sceneState.phase) {
        case 'stable': currentYear = 2025; break;
        case 'approach': currentYear = 2025 + (t * 100); break;
        case 'interaction': currentYear = 3025 + (t * 2.5); break;
        case 'consumption': currentYear = 3075 + (t * 0.1); break;
        case 'void': currentYear = 0; break;
        case 'rebirth': currentYear = Math.pow(t, 6); break; 
    }

    onUpdate(sceneState.phase, currentYear);
  });

  const isVoid = sceneState.phase === 'void';
  const isRebirth = sceneState.phase === 'rebirth';

  return (
    <>
        {!isVoid && !isRebirth && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}
        
        <MilkyWay phase={sceneState.phase} />
        <AsteroidBelt phase={sceneState.phase} />
        <CometSystem phase={sceneState.phase} />
        
        <IntruderBlackHole 
            phase={sceneState.phase} 
            timer={sceneState.timer} 
            setBhPosition={setBhPosition} 
            onHover={setHoveredObj}
            sunConsumed={sunConsumed}
        />
        
        <Sun 
            phase={sceneState.phase} 
            timer={sceneState.timer} 
            bhPosition={bhPosition}
            onHover={setHoveredObj}
            onConsume={setSunConsumed}
        />
        
        {SOLAR_SYSTEM.map((obj, i) => (
          <Planet 
            key={i} 
            data={obj} 
            phase={sceneState.phase} 
            timer={sceneState.timer}
            bhPosition={bhPosition}
            onHover={setHoveredObj}
            onConsume={() => {}} 
          />
        ))}

        <BigBangInflation active={sceneState.phase === 'rebirth'} />

        <OrbitControls 
          enablePan={true} 
          maxDistance={350} 
          minDistance={5} 
        />
        
        <ambientLight intensity={isVoid ? 0 : 0.2} />
        {/* Fill light from galaxy */}
        <pointLight position={[0, -50, -100]} intensity={0.5} color="#8844ff" /> 
    </>
  );
};

const SimulationScene: React.FC<{ 
    params: SimulationState;
    onUpdate: (phase: SimulationPhase, year: number) => void;
}> = ({ params, onUpdate }) => {
  return (
    <div className="absolute inset-0 z-0 bg-black">
      <Canvas camera={{ position: [0, 60, 100], fov: 45 }} shadows>
        <color attach="background" args={['#000000']} />
        <SceneLogic params={params} onUpdate={onUpdate} />
      </Canvas>
    </div>
  );
};

export default SimulationScene;