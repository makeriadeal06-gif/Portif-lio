import React from "react";
import { motion } from "motion/react";
import { Terminal, Shield, Cpu, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ModelViewer } from "../components/3d/ModelViewer";

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen pt-16 flex flex-col">
      {/* Hero Section */}
      <section className="relative flex-grow flex items-center justify-center p-4 sm:p-12 overflow-hidden">
        <div className="max-w-7xl w-full grid lg:grid-cols-2 gap-8 lg:gap-12 items-center py-10 lg:py-0">
          
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col gap-6 sm:gap-8 z-10"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-accent-green font-mono text-xs sm:text-sm tracking-[0.3em] mb-2">
                <span className="w-8 h-[1px] bg-accent-green" />
                SYSTEM_INITIALIZING
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tighter leading-none perspective-text uppercase">
                Pedro Lucas - <span className="text-accent-green font-outline italic shadow-glow">Ghost System</span>
              </h1>
              <p className="text-white/60 font-mono text-[10px] sm:text-[11px] max-w-lg leading-relaxed mt-4 sm:mt-6 border-l border-accent-green/30 pl-4">
                <span className="text-accent-green">_CMD:</span> Construindo sistemas onde softwares, hardware e inteligência convergem.
                <br /><br />
                <span className="text-white/20 italic">// Eletrotécnica . Full-Stack . AI_Arch . 3D_Design</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 glass-panel flex flex-col gap-2 group hover:border-accent-green/30 transition-all">
                <Shield className="w-4 sm:w-5 h-4 sm:h-5 text-accent-green mb-1 sm:mb-2" />
                <span className="text-[8px] sm:text-[10px] font-mono text-white/40">SECURITY_MODULE</span>
                <span className="text-[10px] sm:text-xs font-bold font-mono tracking-widest text-accent-green">ENCRYPTED</span>
              </div>
              <div className="p-3 sm:p-4 glass-panel flex flex-col gap-2 group hover:border-accent-green/30 transition-all">
                <Cpu className="w-4 sm:w-5 h-4 sm:h-5 text-accent-green mb-1 sm:mb-2" />
                <span className="text-[8px] sm:text-[10px] font-mono text-white/40">NEURAL_SYNC</span>
                <span className="text-[10px] sm:text-xs font-bold font-mono tracking-widest text-accent-green">STABLE</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mt-4">
              <Link to="/projects" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-accent-green text-background text-xs font-bold tracking-widest flex items-center justify-center gap-3 shadow-glow group"
                >
                  ACCESS_SYSTEM_DATA
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
              <Link to="/contact" className="text-[9px] sm:text-[10px] font-mono text-white/40 hover:text-accent-green transition-colors tracking-[0.2em] px-1">
                OPEN_COMM_CHANNEL
              </Link>
            </div>
          </motion.div>

          {/* 3D Visualizer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="h-[350px] sm:h-[450px] lg:h-[500px] xl:h-[600px] w-full relative"
          >
            <ModelViewer models={["/models/cube.glb", "/models/sphere.glb", "/models/knot.glb"]} />
            <div className="mt-4 flex animate-pulse-soft items-center justify-between text-[7px] sm:text-[8px] font-mono text-white/20 whitespace-nowrap overflow-hidden">
              <span>RENDER_ENGINE: WEB_GL_2.0</span>
              <span className="hidden sm:inline">GEOMETRY: OPTIMIZED</span>
              <span>SHADERS: COMPILED</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Ticker bar */}
      <div className="h-10 border-t border-white/5 bg-black/40 flex items-center overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap gap-12 items-center">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 text-[10px] font-mono text-white/20 tracking-widest">
              <Terminal className="w-3 h-3 text-accent-green" />
              <span>CORE_INIT_SEQUENCE_{i}000... [OK]</span>
              <span className="w-2 h-2 rounded-full bg-accent-green/20" />
              <span>PHYSICS_ENGINE_STATE: ACTIVE</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
