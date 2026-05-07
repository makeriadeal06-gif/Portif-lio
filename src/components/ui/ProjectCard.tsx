import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ExternalLink, Github, Layers, Zap, X, Maximize2, Box, Globe, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { ModelViewer } from "../3d/ModelViewer";
import { SitePreview } from "./SitePreview";
import { ProjectData } from "../../types";
import { logAnalyticsEvent } from "../../lib/firebase";

interface ProjectCardProps extends ProjectData {
  className?: string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  category,
  description,
  tags,
  image,
  type,
  model3d,
  modelFormat,
  projectUrl,
  previewType,
  github,
  className,
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [modalActiveTab, setModalActiveTab] = useState<"preview" | "details">("preview");
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [showSitePreview, setShowSitePreview] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const previewTimer = useRef<any>(null);

  useEffect(() => {
    if (isPreviewOpen) {
      logAnalyticsEvent("view_project", {
        project_title: title,
        project_type: type,
        category: category
      });
      if (type === "3D") {
        logAnalyticsEvent("open_3d_model", { project_title: title });
      }
    }
  }, [isPreviewOpen, title, type, category]);

  useEffect(() => {
    if (isPreviewOpen && modalActiveTab === "details") {
      logAnalyticsEvent("view_project_details", { project_title: title });
    }
  }, [modalActiveTab, isPreviewOpen, title]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (type !== "WEB" || !projectUrl || isMobile) return;
    
    // Clear any existing timer
    if (previewTimer.current) clearTimeout(previewTimer.current);
    
    // Smooth delay before opening
    previewTimer.current = setTimeout(() => {
      setShowSitePreview(true);
    }, 250);
  };

  const handleMouseLeave = () => {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    setShowSitePreview(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!showSitePreview && !previewTimer.current) return;
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (isPreviewOpen) {
      setIsIframeLoading(true);
    }
  }, [isPreviewOpen]);

  const renderPreview = () => {
    if (type === "3D" && model3d) {
      return (
        <div className="w-full h-full min-h-[400px]">
          <ModelViewer models={[{ url: model3d, format: modelFormat }]} />
        </div>
      );
    }

    if (type === "WEB" && projectUrl) {
      return (
        <div className="w-full h-full relative group/modal-preview bg-white">
          <AnimatePresence>
            {isIframeLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] text-accent-green gap-3 z-20"
              >
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-[10px] font-mono tracking-widest uppercase animate-pulse">ESTABLISHING_LINK...</span>
              </motion.div>
            )}
          </AnimatePresence>
          <iframe 
            src={projectUrl} 
            className="w-full h-full border-none relative z-10"
            title={title}
            onLoad={() => setIsIframeLoading(false)}
            sandbox="allow-scripts allow-forms allow-same-origin"
          />
          <div className="absolute inset-0 pointer-events-none border-4 border-accent-green/20 opacity-0 group-hover/modal-preview:opacity-100 transition-opacity z-30" />
        </div>
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center bg-black/20 min-h-[300px]">
        {image ? (
          <img src={image} alt={title} className="max-w-full max-h-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-4 text-white/20">
            <Box className="w-12 h-12 opacity-20 animate-pulse" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-mono tracking-[0.4em] uppercase">No_Asset_Loaded</span>
              <span className="text-[8px] font-mono opacity-40 uppercase">System awaiting manual direct link access</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        layoutId={`card-${title}`}
        whileHover={!isMobile ? { 
          scale: 1.02, 
          boxShadow: "0 0 30px rgba(0, 255, 149, 0.15)",
          y: -5
        } : {}}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn("group flex flex-col glass-panel hover:border-accent-green/40 transition-all duration-500 overflow-hidden", className)}
      >
        <div 
          className="relative h-48 overflow-hidden group/img cursor-pointer"
          onClick={() => {
            setModalActiveTab("preview");
            setIsPreviewOpen(true);
          }}
        >
          <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors z-10" />
          {image ? (
            <img
              src={image}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-700 grayscale group-hover:grayscale-0"
            />
          ) : (
            <div className="w-full h-full bg-white/5 flex items-center justify-center">
              <Box className="w-12 h-12 text-white/10" />
            </div>
          )}
          
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity z-20">
            <div className="bg-accent-green/20 backdrop-blur-sm border border-accent-green/40 text-accent-green px-4 py-2 font-mono text-[10px] tracking-[0.3em] shadow-glow">
              VIEW_3D_MODEL()
            </div>
          </div>

          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <div className="bg-black/80 px-2 py-0.5 border border-accent-green/30 rounded flex items-center gap-1.5 shadow-glow">
              {type === "3D" ? <Box className="w-3 h-3 text-accent-green" /> : <Globe className="w-3 h-3 text-accent-green" />}
              <span className="text-[9px] font-mono text-accent-green tracking-widest">{category}</span>
            </div>
          </div>
        </div>

        <div 
          className="p-6 flex flex-col flex-grow cursor-pointer"
          onClick={() => {
            setModalActiveTab("details");
            setIsPreviewOpen(true);
          }}
        >
          <h3 className="text-lg font-bold tracking-tight mb-2 flex items-center justify-between">
            <span>{title}</span>
            <Layers className="w-4 h-4 text-white/20 group-hover:text-accent-green transition-colors" />
          </h3>
          
          <p className="text-white/60 text-xs leading-relaxed mb-6 font-mono line-clamp-3">
            {description}
          </p>

          <div className="flex flex-wrap gap-2 mt-auto mb-6">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-[9px] px-2 py-1 rounded border border-white/5 bg-white/5 text-white/40 font-mono group-hover:border-accent-green/20 group-hover:text-accent-green transition-all"
              >
                #{tag.toUpperCase()}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
            {projectUrl && (
              <a
                href={projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[10px] font-mono hover:text-accent-green transition-colors group/link"
                onClick={() => logAnalyticsEvent("click_external_link", { url: projectUrl, type: "live_demo", project: title })}
              >
                <ExternalLink className="w-3 h-3" />
                OPEN_LIVE
              </a>
            )}
            {github && (
              <a
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[10px] font-mono hover:text-accent-green transition-colors"
                onClick={() => logAnalyticsEvent("click_external_link", { url: github, type: "github", project: title })}
              >
                <Github className="w-3 h-3" />
                SOURCE
              </a>
            )}
          </div>
        </div>
      </motion.div>

      {type === "WEB" && projectUrl && !isMobile && (
        <SitePreview 
          url={projectUrl} 
          isVisible={showSitePreview} 
          mousePos={mousePos} 
        />
      )}

      <AnimatePresence>
        {isPreviewOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPreviewOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-6xl glass-panel overflow-hidden flex flex-col h-[80vh] max-h-[90vh]"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                    <h3 className="font-mono text-sm tracking-widest font-bold text-accent-green">{title.toUpperCase()}</h3>
                  </div>
                  
                  <div className="flex bg-white/5 p-1 rounded-sm border border-white/10">
                    <button 
                      onClick={() => setModalActiveTab("preview")}
                      className={cn(
                        "px-3 py-1 text-[9px] font-mono transition-all",
                        modalActiveTab === "preview" ? "bg-accent-green text-black" : "text-white/40 hover:text-white"
                      )}
                    >
                      {type === "3D" ? "MODEL_3D" : "LIVE_PREVIEW"}
                    </button>
                    <button 
                      onClick={() => setModalActiveTab("details")}
                      className={cn(
                        "px-3 py-1 text-[9px] font-mono transition-all",
                        modalActiveTab === "details" ? "bg-accent-green text-black" : "text-white/40 hover:text-white"
                      )}
                    >
                      DOCS_&_DETAILS
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className={cn("flex-grow p-1 overflow-auto bg-[#0a0a0a]")}>
                {modalActiveTab === "preview" ? (
                  <div className="w-full h-full min-h-[400px]">
                    {renderPreview()}
                  </div>
                ) : (
                  <div className="p-6 md:p-12 max-w-4xl mx-auto space-y-12">
                    <section className="space-y-4">
                      <div className="flex items-center gap-2 text-accent-green text-[10px] font-mono tracking-widest uppercase">
                        <Zap className="w-3 h-3" />
                        Project_Overview
                      </div>
                      <h4 className="text-3xl font-bold tracking-tight text-white">{title}</h4>
                      <p className="text-white/60 font-mono text-sm leading-relaxed border-l-2 border-accent-green/20 pl-6">
                        {description}
                      </p>
                    </section>

                    <section className="space-y-6">
                      <div className="flex items-center gap-2 text-accent-green text-[10px] font-mono tracking-widest uppercase">
                        <Layers className="w-3 h-3" />
                        System_Composition
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {tags.map((tag) => (
                          <div 
                            key={tag}
                            className="px-4 py-2 border border-white/10 bg-white/5 rounded-sm flex items-center gap-3 group/tag hover:border-accent-green/50 transition-colors"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-accent-green/20 group-hover/tag:bg-accent-green transition-colors" />
                            <span className="text-[10px] font-mono text-white/60 group-hover/tag:text-white">#{tag.toUpperCase()}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                    
                    <section className="pt-8 border-t border-white/5 grid md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                          <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Metadata</div>
                          <div className="space-y-2">
                             <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="text-white/30">TYPE_CLASS:</span>
                                <span className="text-white/70">{type}</span>
                             </div>
                             <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="text-white/30">CATEGORY:</span>
                                <span className="text-white/70">{category}</span>
                             </div>
                             {modelFormat && (
                               <div className="flex items-center justify-between text-[11px] font-mono">
                                  <span className="text-white/30">GEOMETRY_FORMAT:</span>
                                  <span className="text-white/70">{modelFormat.toUpperCase()}</span>
                               </div>
                             )}
                          </div>
                       </div>

                       <div className="space-y-4">
                          <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">External_Links</div>
                          <div className="flex flex-col gap-2">
                            {projectUrl && (
                               <a href={projectUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-white/5 border border-white/10 hover:border-accent-green/50 transition-all text-xs font-mono group/link">
                                  <span className="text-white/60 group-hover/link:text-white">LIVE_ENVIRONMENT</span>
                                  <ExternalLink className="w-3 h-3 text-accent-green" />
                               </a>
                            )}
                            {github && (
                               <a href={github} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-white/5 border border-white/10 hover:border-accent-green/50 transition-all text-xs font-mono group/link">
                                  <span className="text-white/60 group-hover/link:text-white">REPOSITORY_CODE</span>
                                  <Github className="w-3 h-3 text-accent-green" />
                               </a>
                            )}
                          </div>
                       </div>
                    </section>
                  </div>
                )}
              </div>

              <div className="p-4 bg-black/60 border-t border-white/10 flex items-center justify-between">
                <div className="flex gap-4">
                   {projectUrl && (
                     <a href={projectUrl} target="_blank" rel="noreferrer" className="text-[10px] font-mono text-accent-green hover:underline">
                       ACCESS_EXTERNAL_NODE
                     </a>
                   )}
                </div>
                <span className="text-[8px] font-mono text-white/20">SYSTEM_PREVIEW_READY</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
