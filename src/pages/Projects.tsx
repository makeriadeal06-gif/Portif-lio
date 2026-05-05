import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ProjectCard } from "../components/ui/ProjectCard";
import { ProjectData } from "../types";
import { ScrollReveal } from "../components/ui/ScrollReveal";
import { db, OperationType, handleFirestoreError } from "../lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "projects"), 
      where("visible", "==", true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProjectData[];

      // Ordenação manual para evitar erro de índice composto
      const sortedProjs = projs.sort((a, b) => {
        const orderA = a.order ?? 999;
        const orderB = b.order ?? 999;
        if (orderA !== orderB) return orderA - orderB;
        
        const dateA = a.createdAt?.seconds ?? 0;
        const dateB = b.createdAt?.seconds ?? 0;
        return dateB - dateA;
      });

      setProjects(sortedProjs);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "projects");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="mb-12 border-l-2 border-accent-green pl-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono text-accent-green tracking-[0.3em]">REPOSITORIES_ARCHIVE</span>
              <h2 className="text-4xl font-bold tracking-tighter uppercase mt-2">DEPLOYED_SYSTEMS</h2>
            </div>
            <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest leading-relaxed flex flex-col gap-1">
              <span className="flex items-center gap-2"><div className="w-1 h-1 bg-accent-green rounded-full underline" /> CLIQUE NO CARD PARA ABRIR JANELA FLUTUANTE</span>
              <span className="flex items-center gap-2"><div className="w-1 h-1 bg-accent-green rounded-full" /> PREVIEW RÁPIDO AO PASSAR O CURSOR</span>
            </div>
          </div>
        </ScrollReveal>

        {isLoading ? (
          <div className="h-[400px] flex items-center justify-center font-mono text-accent-green animate-pulse">
            DOWNLOAD_IN_PROGRESS...
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <ScrollReveal key={project.id || index} delay={index * 0.1}>
                <ProjectCard {...project} />
              </ScrollReveal>
            ))}
          </div>
        )}
        
        {!isLoading && projects.length === 0 && (
          <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded">
            <span className="text-xs font-mono text-white/20 uppercase tracking-widest">Database_is_empty</span>
          </div>
        )}
      </div>
    </div>
  );
};
