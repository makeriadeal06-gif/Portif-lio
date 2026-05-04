import React from "react";
import { User, Code, Zap, Globe, Cpu } from "lucide-react";
import { ScrollReveal } from "../components/ui/ScrollReveal";

export const About: React.FC = () => {
  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        <div className="flex flex-col gap-8">
          <ScrollReveal direction="left">
            <div className="border-l-2 border-accent-green pl-4 sm:pl-6">
              <span className="text-[10px] font-mono text-accent-green tracking-[0.3em]">BIOGRAPHY_DATA</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter uppercase mt-2">PERSONNEL_PROFILE</h2>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <p className="text-white/60 font-mono text-xs sm:text-sm leading-relaxed">
              Pedro Lucas é um desenvolvedor focado na interseção entre a engenharia física e a lógica computacional.
              Com formação técnica em Eletrotécnica, minha visão de desenvolvimento de software é pautada por precisão,
              eficiência energética e estabilidade de sistemas.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: Zap, title: "ELECTRICAL_ENG", desc: "Expertise em redes elétricas, automação predial e telemetria." },
              { icon: Code, title: "SYSTEMS_DEV", desc: "Desenvolvimento Full-Stack com foco em performance e escalabilidade." },
              { icon: Cpu, title: "AI_INTEGRATION", desc: "Implementação de modelos de linguagem e visão computacional." },
              { icon: Globe, title: "3D_MODELING", desc: "Modelagem técnica no Fusion 360 e visualização procedural." }
            ].map((skill, index) => (
              <ScrollReveal key={index} delay={0.2 + (index * 0.1)}>
                <div className="p-4 sm:p-6 h-full glass-panel flex flex-col gap-3 group hover:border-accent-green/30 transition-all">
                  <skill.icon className="w-5 h-5 text-accent-green" />
                  <h4 className="text-sm font-bold tracking-widest font-mono uppercase">{skill.title}</h4>
                  <p className="text-[10px] text-white/40 font-mono">{skill.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        <ScrollReveal direction="right" delay={0.3} className="lg:sticky lg:top-24">
          <div className="glass-panel p-6 sm:p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between mb-4">
              <User className="w-8 h-8 text-accent-green" />
              <div className="text-right">
                <span className="block text-[8px] font-mono text-white/20">STATUS</span>
                <span className="block text-[10px] font-mono text-accent-green">ONLINE</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Identidade</span>
                <span className="text-sm font-mono tracking-wider">Pedro Lucas</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Localização</span>
                <span className="text-sm font-mono tracking-wider">BR_SYSTEM_NODE</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Linguagens</span>
                <div className="flex flex-wrap gap-2 pt-1">
                   {['TypeScript', 'Python', 'C++', 'SQL'].map(l => (
                     <span key={l} className="text-[9px] font-mono border border-accent-green/30 px-1.5 py-0.5 text-accent-green">{l}</span>
                   ))}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};
