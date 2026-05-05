import React, { Suspense, useState, useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Grid, Html, Bounds, ContactShadows, Environment, Detailed, Float, Center } from "@react-three/drei";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Box, AlertCircle, Cpu, Activity, Loader2, Maximize2, RotateCw } from "lucide-react";
import * as THREE from "three";
import { GLTFLoader, STLLoader, ThreeMFLoader, Timer } from "three-stdlib";

export interface ModelData {
  url: string;
  format?: 'glb' | 'stl' | '3mf';
}

interface ModelViewerProps {
  models: (string | ModelData)[];
  autoRotate?: boolean;
}

// Component to handle individual model loading with centering and scaling
const ModelObject: React.FC<{ url: string; format: string }> = ({ url, format }) => {
  if (format === "stl") {
    const geometry = useLoader(STLLoader, url);
    
    useMemo(() => {
      if (geometry) {
        geometry.computeVertexNormals();
        geometry.center();
        
        // Auto-scale to fit comfortably in view
        geometry.computeBoundingBox();
        const size = new THREE.Vector3();
        geometry.boundingBox!.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        geometry.scale(scale, scale, scale);
      }
    }, [geometry]);

    return (
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial 
          color="#888888" 
          metalness={0.7}
          roughness={0.2}
          envMapIntensity={1.5}
          precision="mediump"
        />
      </mesh>
    );
  } else if (format === "3mf") {
    const object = useLoader(ThreeMFLoader, url);
    
    useMemo(() => {
      if (object) {
        // Fix shadows and materials for all meshes
        object.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            const mesh = child as THREE.Mesh;
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.envMapIntensity = 1.5;
              mat.precision = "mediump";
            }
          }
        });

        // Center the object
        const box = new THREE.Box3().setFromObject(object);
        const center = new THREE.Vector3();
        box.getCenter(center);
        object.position.sub(center);

        // Auto-scale based on bounding box
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        object.scale.set(scale, scale, scale);
      }
    }, [object]);

    return <primitive object={object} />;
  } else {
    const gltf = useLoader(GLTFLoader, url);
    
    useMemo(() => {
      if (gltf.scene) {
        // Fix shadows and materials for all meshes
        gltf.scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            const mesh = child as THREE.Mesh;
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.envMapIntensity = 1.5;
              mat.precision = "mediump";
            }
          }
        });

        // Center the scene
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = new THREE.Vector3();
        box.getCenter(center);
        gltf.scene.position.sub(center);

        // Auto-scale based on bounding box
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        gltf.scene.scale.set(scale, scale, scale);
      }
    }, [gltf]);

    return <primitive object={gltf.scene} />;
  }
};

class ModelErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <Html center>
          <div className="flex flex-col items-center gap-4 text-red-500 bg-black/80 p-6 border border-red-500/20 backdrop-blur-md rounded-sm border-dashed">
            <AlertCircle className="w-10 h-10" />
            <div className="text-center font-mono">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Buffer_Sequence_Fault</p>
              <p className="text-[8px] text-white/40 mt-2 uppercase">Geometry extraction failed or URL timeout</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-1 text-[8px] border border-red-500/30 hover:bg-red-500/10 transition-colors uppercase tracking-widest"
              >
                Retry_Sync
              </button>
            </div>
          </div>
        </Html>
      );
    }
    return this.props.children;
  }
}

const ModelLoader = () => {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPercent(p => (p < 99 ? p + 1 : 99));
    }, 20);
    return () => clearInterval(interval);
  }, []);

  return (
    <Html center>
      <div className="flex flex-col items-center gap-6 w-64 bg-black/40 p-8 backdrop-blur-xl border border-white/5 rounded-sm">
        <div className="relative w-16 h-16">
          <Loader2 className="w-full h-full text-accent-green animate-spin opacity-20" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-t-2 border-accent-green rounded-full shadow-[0_0_15px_rgba(0,255,65,0.4)]"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Cpu className="w-6 h-6 text-accent-green animate-pulse" />
          </div>
        </div>

        <div className="w-full space-y-3">
          <div className="flex justify-between items-end font-mono text-[8px] tracking-widest text-accent-green">
            <span className="flex items-center gap-2">
              <Activity className="w-3 h-3" />
              LOAD_SEQUENCE
            </span>
            <span className="font-bold">{percent}%</span>
          </div>
          <div className="h-[2px] w-full bg-white/5 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              className="h-full bg-accent-green shadow-[0_0_8px_rgba(0,255,65,0.8)]"
            />
          </div>
          <p className="text-[6px] font-mono text-white/20 uppercase tracking-[0.4em] text-center">architecture stream syncing...</p>
        </div>
      </div>
    </Html>
  );
};

const ModelContent: React.FC<{ model: string | ModelData }> = ({ model }) => {
  const url = typeof model === "string" ? model : model.url;
  
  const format = useMemo(() => {
    if (typeof model !== "string" && model.format) return model.format;
    const cleanUrl = url.split('?')[0].toLowerCase();
    if (cleanUrl.endsWith('.stl') || url.toLowerCase().includes('.stl')) return 'stl';
    if (cleanUrl.endsWith('.3mf') || url.toLowerCase().includes('.3mf')) return '3mf';
    return 'glb';
  }, [model, url]);

  // Handle local placeholders
  if (url.includes("octahedron.glb")) {
    return (
      <mesh castShadow receiveShadow>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#00ff41" wireframe precision="mediump" envMapIntensity={0.5} />
      </mesh>
    );
  }
  if (url.includes("dodecahedron.glb")) {
    return (
      <mesh castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#00ff41" wireframe precision="mediump" envMapIntensity={0.5} />
      </mesh>
    );
  }
  if (url.includes("icosahedron.glb")) {
    return (
      <mesh castShadow receiveShadow>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#00ff41" wireframe precision="mediump" envMapIntensity={0.5} />
      </mesh>
    );
  }
  if (url.includes("tetrahedron.glb")) {
    return (
      <mesh castShadow receiveShadow>
        <tetrahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#00ff41" wireframe precision="mediump" envMapIntensity={0.5} />
      </mesh>
    );
  }
  if (url.includes("torus.glb")) {
    return (
      <mesh castShadow receiveShadow>
        <torusGeometry args={[0.8, 0.3, 12, 48]} />
        <meshStandardMaterial color="#00ff41" wireframe precision="mediump" envMapIntensity={0.5} />
      </mesh>
    );
  }
  if (url.includes("sphere.glb")) {
    return (
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color="#00ff41" wireframe precision="mediump" envMapIntensity={0.5} />
      </mesh>
    );
  }
  if (url.includes("knot.glb")) {
    return (
      <mesh castShadow receiveShadow>
        <torusKnotGeometry args={[0.6, 0.2, 120, 24]} />
        <meshStandardMaterial color="#00ff41" wireframe precision="mediump" envMapIntensity={0.5} />
      </mesh>
    );
  }

  return (
    <Suspense fallback={null}>
      <ModelObject url={url} format={format} />
    </Suspense>
  );
};

const ScanningLaser = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const timer = useRef<Timer | null>(null);

  useEffect(() => {
    timer.current = new Timer();
  }, []);
  
  useFrame(() => {
    if (meshRef.current && timer.current) {
      timer.current.update();
      const time = timer.current.getElapsedTime();
      meshRef.current.position.y = Math.sin(time * 1.5) * 1.2;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0, 1.6, 64]} />
      <meshBasicMaterial 
        color="#00ff41" 
        transparent 
        opacity={0.1} 
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export const ModelViewer: React.FC<ModelViewerProps> = ({ models, autoRotate: initialAutoRotate = true }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(initialAutoRotate);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileDevice(window.matchMedia("(max-width: 768px)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const nextModel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % models.length);
  };
  const prevModel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + models.length) % models.length);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full bg-[#0a0a0a] overflow-hidden group border border-white/5 ${isFullscreen ? 'fixed inset-0 z-[200]' : ''}`}
    >
      {/* HUD Elements */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-accent-green/40 z-10 m-4 rounded-tl-sm pointer-events-none" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-accent-green/40 z-10 m-4 rounded-tr-sm pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-accent-green/40 z-10 m-4 rounded-bl-sm pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-accent-green/40 z-10 m-4 rounded-br-sm pointer-events-none" />

      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 w-full p-6 flex items-start justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-accent-green/10 border border-accent-green/20">
            <Cpu className="w-4 h-4 text-accent-green animate-pulse" />
          </div>
          <div className="flex flex-col leading-none gap-1">
             <h3 className="text-[10px] font-mono text-accent-green font-bold tracking-[0.3em] uppercase">Architecture_Viewer_Pro</h3>
             <span className="text-[7px] font-mono text-white/30 uppercase tracking-widest">Model: {String(currentIndex + 1).padStart(2, '0')} // Buffering: Dynamic</span>
          </div>
        </div>

        <div className="flex items-center gap-4 pointer-events-auto">
          <button 
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 border transition-all ${autoRotate ? 'bg-accent-green text-background border-accent-green shadow-glow' : 'bg-black/40 border-white/10 text-white/40 hover:border-white/30'}`}
            title="Auto-Rotate"
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin-slow' : ''}`} />
          </button>
          <button 
            onClick={toggleFullscreen}
            className="p-2 bg-black/40 border border-white/10 text-white/40 hover:border-white/30 transition-all"
            title="Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Navigation Buttons */}
      {models && models.length > 1 && (
        <>
          <button 
            onClick={prevModel}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-black/40 border border-white/10 text-white/20 hover:text-accent-green hover:border-accent-green/40 transition-all backdrop-blur-md rounded-sm group/btn"
          >
            <ChevronLeft className="w-6 h-6 group-hover/btn:-translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={nextModel}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-black/40 border border-white/10 text-white/20 hover:text-accent-green hover:border-accent-green/40 transition-all backdrop-blur-md rounded-sm group/btn"
          >
            <ChevronRight className="w-6 h-6 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </>
      )}

      {/* Scene */}
      <Suspense fallback={<ModelLoader />}>
        <Canvas 
          shadows={{ type: isMobileDevice ? THREE.BasicShadowMap : THREE.PCFShadowMap }}
          dpr={isMobileDevice ? [1, 1] : [1, 2]}
          gl={{ 
            antialias: !isMobileDevice,
            alpha: true,
            powerPreference: "high-performance",
            precision: isMobileDevice ? "lowp" : "mediump",
          }}
          performance={{ min: 0.5 }}
          camera={{ position: [5, 5, 5], fov: 35 }}
        >
          <color attach="background" args={["#0a0a0a"]} />
          <fog attach="fog" args={["#0a0a0a", 5, 15]} />
          
          <ambientLight intensity={0.4} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={150} castShadow />
          <directionalLight position={[-10, 10, -10]} intensity={1.5} color="#00ff41" />
          
          <Suspense fallback={null}>
            <Bounds fit clip observe margin={1.2}>
              <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
                <AnimatePresence mode="wait">
                  <group key={currentIndex}>
                    <ModelErrorBoundary>
                      <Detailed distances={[0, 15, 30]}>
                        <ModelContent model={models[currentIndex]} />
                        <mesh>
                          <boxGeometry args={[0.4, 0.4, 0.4]} />
                          <meshStandardMaterial color="#00ff41" wireframe precision="mediump" />
                        </mesh>
                        <mesh>
                          <boxGeometry args={[0.1, 0.1, 0.1]} />
                          <meshStandardMaterial color="#00ff41" precision="mediump" />
                        </mesh>
                      </Detailed>
                    </ModelErrorBoundary>
                    <ScanningLaser />
                  </group>
                </AnimatePresence>
              </Float>
            </Bounds>
            
            <ContactShadows 
              opacity={0.5} 
              scale={10} 
              blur={2.5} 
              far={10} 
              resolution={512} 
              color="#00ff41" 
              position={[0, -1.2, 0]}
            />
            
            <Environment preset="studio" />
          </Suspense>

          <Grid
            infiniteGrid
            fadeDistance={20}
            fadeStrength={3}
            cellSize={0.5}
            sectionSize={1}
            sectionColor="#00ff41"
            cellColor="#003b00"
            position={[0, -1.2, 0]}
          />

          <OrbitControls 
            makeDefault
            enableDamping={true}
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={12}
            autoRotate={autoRotate}
            autoRotateSpeed={0.8}
            rotateSpeed={0.6}
            zoomSpeed={0.8}
          />
        </Canvas>
      </Suspense>

      {/* HUD Info */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-none font-mono text-[7px] text-white/20 uppercase tracking-[0.4em] flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-3 h-3 text-accent-green" />
          <span>ENVIRONMENT_STUDIO: CALIBRATED</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-green" />
          <span>TONE_MAPPING: ACES_FILMIC</span>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-20 text-right pointer-events-none">
        <div className="text-[12px] font-mono text-accent-green font-bold tracking-[0.2em] mb-1">GHOST_CORE_V2.0</div>
        <div className="text-[7px] font-mono text-white/30 uppercase tracking-widest">Buffer_Zone: Active // Neural_Link: Stable</div>
      </div>
    </div>
  );
};
