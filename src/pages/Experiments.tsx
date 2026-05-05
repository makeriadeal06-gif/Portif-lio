import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { FlaskConical, Beaker, Zap, Boxes, Loader2, Briefcase, Calendar, MapPin, ExternalLink } from "lucide-react";
import { ScrollReveal } from "../components/ui/ScrollReveal";
import { db, OperationType, handleFirestoreError } from "../lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { ExperimentData } from "../types";
import { cn } from "../lib/utils";
import { SitePreview } from "../components/ui/SitePreview";

export const Experiments: React.FC = () => {
  const [experiments, setExperiments] = useState<ExperimentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "LAB" | "EXPERIENCE">("ALL");
  
  // Preview state
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const previewTimer = useRef<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "experiments"), 
      where("visible", "==", true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ExperimentData[];

      // Manual sorting to avoid composite index error
      const sortedData = data.sort((a, b) => {
        const orderA = a.order ?? 999;
        const orderB = b.order ?? 999;
        if (orderA !== orderB) return orderA - orderB;
        
        const dateA = a.createdAt?.seconds ?? 0;
        const dateB = b.createdAt?.seconds ?? 0;
        return dateB - dateA;
      });

      setExperiments(sortedData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "experiments");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredExperiments = experiments.filter(exp => 
    filter === "ALL" ? true : exp.type === filter
  );

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="mb-12 border-l-2 border-accent-green pl-6 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div>
              <span className="text-[10px] font-mono text-accent-green tracking-[0.3em]">LAB_ENVIRONMENT_v2</span>
              <h2 className="text-4xl font-bold tracking-tighter uppercase mt-2">TECHNICAL_LABS</h2>
            </div>
            
            <div className="flex items-center gap-4 bg-white/5 p-1 rounded border border-white/10 w-fit self-start">
              {(["ALL", "LAB", "EXPERIENCE"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-4 py-1.5 font-mono text-[9px] uppercase tracking-widest transition-all rounded-sm",
                    filter === f 
                      ? "bg-accent-green text-background font-bold shadow-glow" 
                      : "text-white/40 hover:text-white"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {isLoading ? (
          <div className="h-[400px] flex items-center justify-center font-mono text-accent-green gap-4">
             <Loader2 className="w-5 h-5 animate-spin" />
             SYNCING_LAB_DATA...
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredExperiments.map((exp, index) => (
                <motion.div
                  key={exp.id || index}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onMouseEnter={() => {
                    if (!exp.projectUrl || isMobile) return;
                    if (previewTimer.current) clearTimeout(previewTimer.current);
                    previewTimer.current = setTimeout(() => {
                      setShowPreview(exp.projectUrl!);
                    }, 300);
                  }}
                  onMouseLeave={() => {
                    if (previewTimer.current) clearTimeout(previewTimer.current);
                    setShowPreview(null);
                  }}
                  onMouseMove={(e) => {
                    if (showPreview) setMousePos({ x: e.clientX, y: e.clientY });
                  }}
                >
                  <div className="p-6 h-full glass-panel flex flex-col gap-5 group hover:border-accent-green/40 transition-all duration-500 hover:shadow-[0_0_30px_rgba(0,255,65,0.05)]">
                    <div className="flex items-center justify-between">
                      <div className={cn(
                        "w-12 h-12 rounded-sm flex items-center justify-center border transition-all duration-500",
                        exp.type === "LAB" 
                          ? "bg-accent-green/10 border-accent-green/30 group-hover:bg-accent-green/20" 
                          : "bg-blue-500/10 border-blue-500/30 group-hover:bg-blue-500/20"
                      )}>
                        {exp.type === "LAB" ? (
                          <FlaskConical className="w-6 h-6 text-accent-green" />
                        ) : (
                          <Briefcase className="w-6 h-6 text-blue-400" />
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-mono text-white/20 block tracking-widest uppercase">
                          {exp.type === "LAB" ? "SYSTEM_PROTO" : "SYS_EXPERIENCE"}
                        </span>
                        <span className="text-[10px] font-mono text-white/60">ID_{exp.id?.substring(0, 6) || "LOCAL"}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-bold font-mono tracking-tight group-hover:text-accent-green transition-colors leading-tight">
                        {exp.title}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {exp.tech.map((t, i) => (
                          <span key={i} className="text-[8px] font-mono px-2 py-0.5 bg-white/5 border border-white/10 text-white/40 uppercase tracking-tighter">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs text-white/60 leading-relaxed font-mono italic">
                        {exp.description}
                      </p>
                      
                      {exp.type === "EXPERIENCE" && (
                        <div className="space-y-2 pt-2 border-t border-white/5">
                          <div className="flex items-center gap-2 text-[9px] font-mono text-white/40">
                            <Calendar className="w-3 h-3 text-accent-green/40" />
                            {exp.dateRange}
                          </div>
                          {exp.location && (
                            <div className="flex items-center gap-2 text-[9px] font-mono text-white/40">
                              <MapPin className="w-3 h-3 text-accent-green/40" />
                              {exp.location}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-auto">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full animate-pulse shadow-glow",
                          exp.type === "LAB" ? "bg-accent-green" : "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]"
                        )} />
                        <span className={cn(
                          "text-[8px] font-mono tracking-widest uppercase",
                          exp.type === "LAB" ? "text-accent-green" : "text-blue-400"
                        )}>
                          {exp.status || (exp.type === "LAB" ? "STABLE" : "ACTIVE")}
                        </span>
                      </div>
                      
                      {exp.projectUrl ? (
                        <button 
                          onClick={() => window.open(exp.projectUrl, "_blank")}
                          className="text-[9px] font-mono hover:text-accent-green transition-colors flex items-center gap-1.5 group/btn"
                        >
                          ACCESS_NODE
                          <Zap className="w-2.5 h-2.5 group-hover/btn:translate-x-0.5 transition-transform" />
                        </button>
                      ) : exp.type === "EXPERIENCE" ? (
                        <div className="text-[8px] font-mono text-white/20 tracking-widest">VALIDATED_ENTITY</div>
                      ) : (
                        <div className="text-[8px] font-mono text-white/10 tracking-widest italic">_OFFLINE_LOG</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              <motion.div layout>
                <Link to="/admin" className="p-6 h-full border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-4 group hover:border-accent-green/30 transition-all cursor-pointer min-h-[280px]">
                   <div className="w-12 h-12 rounded-full border border-dashed border-white/20 flex items-center justify-center group-hover:border-accent-green/40 group-hover:bg-accent-green/5 transition-all">
                     <Boxes className="w-6 h-6 text-white/10 group-hover:text-accent-green/40 transition-colors" />
                   </div>
                   <div className="flex flex-col gap-1">
                     <span className="text-[10px] font-mono text-white/20 tracking-[0.2em]">AWAITING_INPUT</span>
                     <span className="text-[9px] font-mono text-accent-green opacity-0 group-hover:opacity-100 transition-opacity tracking-widest uppercase">REQUEST_NEW_EXP()</span>
                   </div>
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
        
        {!isLoading && filteredExperiments.length === 0 && (
          <div className="text-center py-24 border border-dashed border-white/10 rounded-sm bg-white/2">
            <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.5em]">No_Entities_Recovered</span>
          </div>
        )}
      </div>

      {showPreview && !isMobile && (
        <SitePreview 
          url={showPreview} 
          isVisible={true} 
          mousePos={mousePos} 
        />
      )}
    </div>
  );
};
