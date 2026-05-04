import React from "react";
import { motion } from "motion/react";
import { FlaskConical, Beaker, Zap, Boxes } from "lucide-react";
import { ScrollReveal } from "../components/ui/ScrollReveal";

const experiments = [
  {
    id: "01",
    name: "Neural-Pixel-Sort",
    tech: "GLSL / Three.js",
    desc: "Experimento de distorção de imagem baseado em algoritmos de sorting procedural.",
    status: "STABLE"
  },
  {
    id: "02",
    name: "Energy-Grid-Monitor",
    tech: "Python / Realtime",
    desc: "Protótipo de dashboard para monitoramento de consumo AC residual.",
    status: "BETA"
  },
  {
    id: "03",
    name: "L-System-Botany",
    tech: "React / Canvas",
    desc: "Gerador de fractais baseados em Gramáticas de Lindenmayer.",
    status: "TESTING"
  }
];

export const Experiments: React.FC = () => {
  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="mb-12 border-l-2 border-accent-green pl-6">
            <span className="text-[10px] font-mono text-accent-green tracking-[0.3em]">LAB_ENVIRONMENT_v2</span>
            <h2 className="text-4xl font-bold tracking-tighter uppercase mt-2">TECHNICAL_LABS</h2>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {experiments.map((exp, index) => (
            <ScrollReveal key={exp.id} delay={index * 0.1}>
              <div className="p-6 h-full glass-panel flex flex-col gap-4 group hover:border-accent-green/40 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-accent-green/10 group-hover:border-accent-green/30 transition-all">
                    <FlaskConical className="w-5 h-5 text-white/40 group-hover:text-accent-green" />
                  </div>
                  <span className="text-[10px] font-mono text-white/20">EXP_{exp.id}</span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold font-mono tracking-wider">{exp.name}</h3>
                  <p className="text-[10px] font-mono text-white/40 tracking-widest">{exp.tech}</p>
                </div>

                <p className="text-xs text-white/60 leading-relaxed min-h-[40px]">
                  {exp.desc}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse shadow-glow" />
                    <span className="text-[8px] font-mono text-accent-green tracking-widest">{exp.status}</span>
                  </div>
                  <button className="text-[9px] font-mono hover:text-accent-green transition-colors flex items-center gap-1 group/btn">
                    OPEN_LAB
                    <Zap className="w-2.5 h-2.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </ScrollReveal>
          ))}

          <ScrollReveal delay={0.4}>
            <div className="p-6 h-full border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-4 group hover:border-accent-green/30 transition-all cursor-pointer">
               <Boxes className="w-8 h-8 text-white/10 group-hover:text-accent-green/40 transition-colors" />
               <div className="flex flex-col gap-1">
                 <span className="text-[10px] font-mono text-white/20">AWAITING_INPUT</span>
                 <span className="text-[9px] font-mono text-accent-green opacity-0 group-hover:opacity-100 transition-opacity">REQUEST_NEW_EXP()</span>
               </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
};
