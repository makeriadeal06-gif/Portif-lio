import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ExternalLink, Github, Layers, Zap, X, Maximize2, Box, Globe } from "lucide-react";
import { cn } from "../../lib/utils";
import { ModelViewer } from "../3d/ModelViewer";
import { SitePreview } from "./SitePreview";

export interface ProjectData {
  id?: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  image: string;
  type: "3D" | "WEB";
  model3d?: string;
  modelFormat?: "glb" | "stl";
  projectUrl?: string;
  previewType?: "image" | "iframe";
  github?: string;
  visible: boolean;
  createdAt: any;
}

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
  const [showSitePreview, setShowSitePreview] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const previewTimer = useRef<any>(null);

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

  const renderPreview = () => {
    if (type === "3D" && model3d) {
      return (
        <div className="w-full h-full min-h-[400px]">
          <ModelViewer models={[{ url: model3d, format: modelFormat }]} />
        </div>
      );
    }

    if (type === "WEB" && projectUrl) {
      if (previewType === "iframe") {
        return (
          <div className="w-full h-full min-h-[500px] bg-white rounded overflow-hidden">
            <iframe 
              src={projectUrl} 
              className="w-full h-full border-none"
              title={title}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        );
      }
    }

    return (
      <div className="w-full h-full flex items-center justify-center bg-black/20">
        {image ? (
          <img src={image} alt={title} className="max-w-full max-h-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-white/20">
            <Box className="w-8 h-8 opacity-20" />
            <span className="text-[10px] font-mono tracking-widest uppercase">No_Asset_Loaded</span>
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
        whileHover={!isMobile ? { scale: 1.02 } : {}}
        className={cn("group flex flex-col glass-panel hover:border-accent-green/50 transition-all duration-500 overflow-hidden", className)}
      >
        <div className="relative h-48 overflow-hidden group/img">
          <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors z-10" />
          {image ? (
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-700 grayscale group-hover:grayscale-0"
            />
          ) : (
            <div className="w-full h-full bg-white/5 flex items-center justify-center">
              <Box className="w-12 h-12 text-white/10" />
            </div>
          )}
          
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity z-20">
            <button 
              onClick={() => setIsPreviewOpen(true)}
              className="bg-accent-green text-background p-3 rounded-full shadow-glow hover:scale-110 transition-transform"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <div className="bg-black/80 px-2 py-0.5 border border-accent-green/30 rounded flex items-center gap-1.5 shadow-glow">
              {type === "3D" ? <Box className="w-3 h-3 text-accent-green" /> : <Globe className="w-3 h-3 text-accent-green" />}
              <span className="text-[9px] font-mono text-accent-green tracking-widest">{category}</span>
            </div>
          </div>
        </div>

        <div className="p-6 flex flex-col flex-grow">
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

          <div className="flex items-center gap-4 pt-4 border-t border-white/5">
            {projectUrl && (
              <a
                href={projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[10px] font-mono hover:text-accent-green transition-colors group/link"
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
              className="relative w-full max-w-6xl glass-panel overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                  <h3 className="font-mono text-sm tracking-widest font-bold text-accent-green">{title.toUpperCase()}</h3>
                </div>
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-grow overflow-auto p-1">
                {renderPreview()}
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
