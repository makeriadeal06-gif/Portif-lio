import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ProjectCard } from "../components/ui/ProjectCard";
import { ProjectData } from "../types";
import { ScrollReveal } from "../components/ui/ScrollReveal";
import { db, OperationType, handleFirestoreError } from "../lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

const ProjectSkeleton = () => (
  <div className="glass-panel overflow-hidden h-full flex flex-col opacity-60">
    <div className="h-48 bg-white/5 animate-pulse relative" />
    <div className="p-6 space-y-6">
      <div className="space-y-3">
        <div className="h-6 w-2/3 bg-white/5 animate-pulse rounded-sm" />
        <div className="h-3 w-full bg-white/5 animate-pulse rounded-sm" />
        <div className="h-3 w-4/5 bg-white/5 animate-pulse rounded-sm" />
      </div>
      <div className="flex gap-2 pt-4 border-t border-white/5">
        <div className="h-3 w-16 bg-white/5 animate-pulse rounded-sm" />
        <div className="h-3 w-16 bg-white/5 animate-pulse rounded-sm" />
      </div>
    </div>
  </div>
);

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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <ProjectSkeleton key={i} />
            ))
          ) : (
            projects.map((project, index) => (
              <ScrollReveal key={project.id || index} delay={index * 0.1}>
                <ProjectCard {...project} />
              </ScrollReveal>
            ))
          )}
        </div>
        
        {!isLoading && projects.length === 0 && (
          <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded">
            <span className="text-xs font-mono text-white/20 uppercase tracking-widest">Database_is_empty</span>
          </div>
        )}
      </div>
    </div>
  );
};
