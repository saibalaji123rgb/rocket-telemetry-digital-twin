import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { TelemetryFrame } from '../types/telemetry';
import { RotateCw, ArrowUpRight, Globe } from 'lucide-react';

interface DigitalTwin3DProps {
  telemetry: TelemetryFrame;
}

export default function DigitalTwin3D({ telemetry }: DigitalTwin3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rocketGroupRef = useRef<THREE.Group | null>(null);
  const earthGroupRef = useRef<THREE.Group | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const flameParticlesRef = useRef<{ flameGeo: THREE.BufferGeometry; flamePos: Float32Array; flameCount: number } | null>(null);
  const engineLightRef = useRef<THREE.PointLight | null>(null);

  // Target attitude quaternion & position refs for continuous real-time smooth rotation
  const targetQuaternionRef = useRef<THREE.Quaternion>(new THREE.Quaternion());
  const targetAltitudeRef = useRef<number>(0);

  // Update targets whenever new telemetry frame arrives from ESP32
  useEffect(() => {
    if (!telemetry) return;

    // Roll: positive tilts left, negative tilts right (rotation about Z axis: +rollRad)
    const rollRad = THREE.MathUtils.degToRad(telemetry.roll || 0);

    // Pitch: positive tilts nose forward, negative tilts nose backward (rotation about X axis: +pitchRad)
    // When Roll = 0° and Pitch = 0°, rocket stays in default upright vertical position
    const pitchRad = THREE.MathUtils.degToRad(telemetry.pitch || 0);

    const altitude = telemetry.altitude || 0;

    // Combine Roll (Z) and Pitch (X) simultaneously without Yaw (Y = 0) using 'ZXY' Euler order
    const euler = new THREE.Euler(pitchRad, 0, rollRad, 'ZXY');
    targetQuaternionRef.current.setFromEuler(euler);
    targetAltitudeRef.current = altitude;

    if (engineLightRef.current) {
      if (telemetry.flightStatus === 'PRE-LAUNCH' || telemetry.flightStatus?.includes('TOUCHDOWN')) {
        engineLightRef.current.intensity = 0.6;
      } else {
        engineLightRef.current.intensity = 3.5 + Math.random() * 1.0;
      }
    }
  }, [telemetry]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup with dark navy fog matching #0B1120
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x0B1120, 0.01);

    // Camera setup - professional isometric engineering angle centered on rocket
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0.8, 14.5);
    camera.lookAt(0, 0.8, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Professional Realistic Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(20, 30, 18);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x3B82F6, 1.2);
    fillLight.position.set(-20, -10, -15);
    scene.add(fillLight);

    const engineLight = new THREE.PointLight(0xf59e0b, 3.5, 16);
    engineLight.position.set(0, -3.0, 0);
    scene.add(engineLight);
    engineLightRef.current = engineLight;

    // Deep Space Starfield
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 1500;
    const starPositions = new Float32Array(starsCount * 3);
    const starColors = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 160;
      starPositions[i + 1] = (Math.random() - 0.5) * 160;
      starPositions[i + 2] = (Math.random() - 0.5) * 160;

      starColors[i] = 0.7 + Math.random() * 0.3;
      starColors[i + 1] = 0.8 + Math.random() * 0.2;
      starColors[i + 2] = 1.0;
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starField = new THREE.Points(
      starsGeometry,
      new THREE.PointsMaterial({ size: 0.25, vertexColors: true, transparent: true, opacity: 0.7 })
    );
    scene.add(starField);

    // Earth Horizon & Grid
    const earthGroup = new THREE.Group();
    earthGroup.position.set(0, -18.5, 0);
    earthGroupRef.current = earthGroup;

    const earthGeo = new THREE.SphereGeometry(15, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({
      color: 0x111827,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.2,
      shininess: 30
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);

    const earthGridHelper = new THREE.GridHelper(32, 24, 0x3b82f6, 0x1e293b);
    earthGridHelper.position.y = 15;
    earthGroup.add(earthGridHelper);

    const cloudsGeo = new THREE.SphereGeometry(15.3, 64, 64);
    const cloudsMat = new THREE.MeshStandardMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    earthGroup.add(cloudsMesh);
    cloudsMeshRef.current = cloudsMesh;

    scene.add(earthGroup);

    // Launch Pad Base
    const launchPadGeo = new THREE.CylinderGeometry(4, 5, 0.4, 32);
    const launchPadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.4 });
    const launchPadMesh = new THREE.Mesh(launchPadGeo, launchPadMat);
    launchPadMesh.position.set(0, -3.2, 0);
    scene.add(launchPadMesh);

    // 3D High-Fidelity Rocket Model - Positioned high & centered
    const rocketGroup = new THREE.Group();
    rocketGroup.position.set(0, 0.5, 0);
    rocketGroupRef.current = rocketGroup;

    // Main Body Cylinder
    const bodyGeo = new THREE.CylinderGeometry(0.75, 0.75, 5.2, 32);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.6, roughness: 0.2 });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0;
    bodyMesh.castShadow = true;
    rocketGroup.add(bodyMesh);

    // Interstage Ring
    const interstageGeo = new THREE.CylinderGeometry(0.76, 0.76, 0.5, 32);
    const interstageMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8, roughness: 0.2 });
    const interstageMesh = new THREE.Mesh(interstageGeo, interstageMat);
    interstageMesh.position.y = 1.1;
    rocketGroup.add(interstageMesh);

    // Blue Decal Stripe
    const stripeGeo = new THREE.CylinderGeometry(0.765, 0.765, 0.35, 32);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, emissive: 0x1d4ed8, emissiveIntensity: 0.4 });
    const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
    stripeMesh.position.y = -0.8;
    rocketGroup.add(stripeMesh);

    // Nose Cone
    const noseGeo = new THREE.ConeGeometry(0.75, 2.2, 32);
    const noseMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.9, roughness: 0.1 });
    const noseMesh = new THREE.Mesh(noseGeo, noseMat);
    noseMesh.position.y = 3.7;
    noseMesh.castShadow = true;
    rocketGroup.add(noseMesh);

    // Sensor Needle Probe
    const probeGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.8, 16);
    const probeMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.7 });
    const probeMesh = new THREE.Mesh(probeGeo, probeMat);
    probeMesh.position.y = 5.1;
    rocketGroup.add(probeMesh);

    // Nozzle
    const nozzleGeo = new THREE.CylinderGeometry(0.38, 0.65, 0.9, 32);
    const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.1 });
    const nozzleMesh = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzleMesh.position.y = -3.0;
    rocketGroup.add(nozzleMesh);

    // Aerodynamic Fins
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(1.3, -1.3);
    finShape.lineTo(1.3, -2.4);
    finShape.lineTo(0, -1.9);
    finShape.closePath();
    const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.08, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 });
    const finMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.8, roughness: 0.2 });

    for (let i = 0; i < 4; i++) {
      const finMesh = new THREE.Mesh(finGeo, finMat);
      finMesh.rotation.y = (Math.PI / 2) * i;
      finMesh.position.y = -0.5;
      finMesh.castShadow = true;
      rocketGroup.add(finMesh);
    }

    // Engine Flame Particles
    const flameCount = 140;
    const flameGeo = new THREE.BufferGeometry();
    const flamePos = new Float32Array(flameCount * 3);
    const flameCols = new Float32Array(flameCount * 3);

    for (let i = 0; i < flameCount; i++) {
      flamePos[i * 3] = (Math.random() - 0.5) * 0.45;
      flamePos[i * 3 + 1] = -3.5 - Math.random() * 3.2;
      flamePos[i * 3 + 2] = (Math.random() - 0.5) * 0.45;

      flameCols[i * 3] = 1.0;
      flameCols[i * 3 + 1] = 0.5 + Math.random() * 0.5;
      flameCols[i * 3 + 2] = 0.1;
    }
    flameGeo.setAttribute('position', new THREE.BufferAttribute(flamePos, 3));
    flameGeo.setAttribute('color', new THREE.BufferAttribute(flameCols, 3));
    const flameParticles = new THREE.Points(
      flameGeo,
      new THREE.PointsMaterial({ size: 0.4, vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending })
    );
    rocketGroup.add(flameParticles);
    flameParticlesRef.current = { flameGeo, flamePos, flameCount };

    scene.add(rocketGroup);

    // 60 FPS Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (rocketGroupRef.current) {
        // Smoothly slerp quaternion in real time to match ESP32 live telemetry orientation
        rocketGroupRef.current.quaternion.slerp(targetQuaternionRef.current, 0.18);
      }

      if (earthGroupRef.current) {
        const targetEarthY = -18.5 - Math.min(32, targetAltitudeRef.current / 700);
        earthGroupRef.current.position.y = THREE.MathUtils.lerp(earthGroupRef.current.position.y, targetEarthY, 0.04);
      }

      starField.rotation.y += 0.00015;
      if (cloudsMeshRef.current) cloudsMeshRef.current.rotation.y += 0.0006;

      if (flameParticlesRef.current?.flamePos) {
        const pos = flameParticlesRef.current.flamePos;
        for (let i = 0; i < flameCount; i++) {
          pos[i * 3 + 1] -= 0.18 + Math.random() * 0.12;
          if (pos[i * 3 + 1] < -7) {
            pos[i * 3 + 1] = -3.5;
            pos[i * 3] = (Math.random() - 0.5) * 0.5;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
          }
        }
        flameParticlesRef.current.flameGeo.attributes.position.needsUpdate = true;
      }

      camera.lookAt(0, 0.8, 0);
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Professional Slate Gauge Component
  const RadialGauge = ({ title, value, min, max, unit, color }: any) => {
    const clampedVal = Math.min(max, Math.max(min, value || 0));
    const percentage = (clampedVal - min) / (max - min);

    return (
      <div className="flex flex-col items-center bg-[#0b1429]/90 backdrop-blur-md rounded-xl px-3.5 py-2.5 border border-[#1e2d4a] w-32 shadow-lg shadow-cyan-950/20 hover:border-[#00F0FF]/40 transition-all">
        <span className="text-xs font-rajdhani font-extrabold text-slate-200 uppercase tracking-wider mb-1">
          {title}
        </span>
        <div className="relative w-18 h-11 flex items-end justify-center">
          <svg className="w-18 h-18 -rotate-90 absolute top-0" viewBox="0 0 36 36">
            <path
              className="text-[#050814]"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
            />
            <path
              className={color}
              strokeWidth="3.8"
              strokeDasharray={`${percentage * 50}, 100`}
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
            />
          </svg>
          <div className="relative z-10 text-center pb-0.5">
            <span className={`text-sm font-orbitron font-extrabold font-mono-num ${color}`}>
              {value > 0 ? `+${value.toFixed(1)}` : (value ? value.toFixed(1) : '0.0')}{unit}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-xl bg-gradient-to-b from-[#080d1e] to-[#040711] border border-[#1e2d4a] overflow-hidden flex flex-col font-sans shadow-xl">
      {/* Top Header Overlay */}
      <div className="absolute top-3 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-2 bg-[#0b1429]/90 px-3.5 py-2 rounded-xl border border-[#00F0FF]/40 backdrop-blur-md shadow-md">
          <RotateCw className="w-4 h-4 text-[#00F0FF] animate-spin" />
          <span className="text-xs md:text-sm font-orbitron font-extrabold text-white uppercase tracking-widest glow-text-cyan">
            DIGITAL TWIN • 3D VISUALIZATION
          </span>
        </div>
        <div className="text-xs md:text-sm bg-[#0b1429]/90 text-slate-100 px-4 py-2 rounded-xl border border-[#1e2d4a] flex items-center gap-2 backdrop-blur-md font-mono shadow-md">
          <span className="h-2.5 w-2.5 rounded-full bg-[#00E676] animate-pulse"></span>
          <span className="font-rajdhani font-bold text-slate-300">ALTITUDE:</span>
          <strong className="text-[#00F0FF] font-orbitron font-extrabold font-mono-num glow-text-cyan">{telemetry.altitude?.toFixed(1) || '0.0'} m</strong>
        </div>
      </div>

      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-full absolute inset-0 z-0"></div>

      {/* Left Overlay: 2 Radial Gauges */}
      <div className="absolute top-16 left-4 z-10 flex flex-col gap-2.5 pointer-events-auto">
        <RadialGauge title="ROLL" value={telemetry.roll} min={-180} max={180} unit="°" color="text-[#00F0FF]" />
        <RadialGauge title="PITCH" value={telemetry.pitch} min={-90} max={90} unit="°" color="text-[#00E676]" />
      </div>

      {/* Right Overlay: Flight Summary Panel */}
      <div className="absolute top-16 right-4 z-10 w-60 bg-[#0b1429]/90 rounded-xl p-4 border border-[#1e2d4a] backdrop-blur-md space-y-3 pointer-events-auto text-xs shadow-xl">
        <div className="text-xs font-orbitron text-white font-extrabold border-b border-[#1e2d4a] pb-2 uppercase tracking-wider flex items-center justify-between glow-text-cyan">
          <span className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#00F0FF]" />
            FLIGHT SUMMARY
          </span>
          <ArrowUpRight className="w-4 h-4 text-slate-400" />
        </div>

        <div className="space-y-2.5 text-xs font-mono">
          <div className="flex justify-between items-center">
            <span className="text-slate-300 font-rajdhani font-bold text-xs">APOGEE (EST.):</span>
            <span className="text-white font-orbitron font-extrabold font-mono-num text-xs">{telemetry.apogeeEst?.toFixed(1) || '0.0'} m</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-300 font-rajdhani font-bold text-xs">MAX SPEED:</span>
            <span className="text-[#00F0FF] font-orbitron font-extrabold font-mono-num text-xs">{telemetry.maxSpeedEst?.toFixed(1) || '0.0'} m/s</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-300 font-rajdhani font-bold text-xs">FLIGHT TIME:</span>
            <span className="text-[#FFB703] font-orbitron font-extrabold font-mono-num text-xs">{telemetry.flightTimeSec || 0}s</span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-[#1e2d4a]">
            <span className="text-slate-300 font-rajdhani font-bold text-xs">STATUS:</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-orbitron font-extrabold ${
              telemetry.flightStatus === 'POWERED ASCENT'
                ? 'bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/40 glow-text-emerald'
                : telemetry.flightStatus === 'DESCENT' || telemetry.flightStatus?.includes('CHUTE')
                ? 'bg-[#FFB703]/15 text-[#FFB703] border border-[#FFB703]/40 glow-text-amber'
                : 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 glow-text-cyan'
            }`}>
              {telemetry.flightStatus || 'PRE-LAUNCH'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-300 font-rajdhani font-bold text-xs">STAGE:</span>
            <span className="text-white font-orbitron font-extrabold text-xs">{telemetry.stage || 1}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
