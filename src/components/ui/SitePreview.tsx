import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Globe, AlertTriangle, ExternalLink, Loader2, Monitor } from "lucide-react";
import { cn } from "../../lib/utils";

interface SitePreviewProps {
  url: string;
  isVisible: boolean;
  mousePos: { x: number; y: number };
}

export const SitePreview: React.FC<SitePreviewProps> = ({ url, isVisible, mousePos }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorType, setErrorType] = useState<"blocked" | "failed" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isVisible && containerRef.current) {
      const width = 320;
      const height = 220;
      const padding = 20;

      let x = mousePos.x + 15;
      let y = mousePos.y + 15;

      // Viewport safety
      if (x + width + padding > window.innerWidth) {
        x = mousePos.x - width - 15;
      }
      if (y + height + padding > window.innerHeight) {
        y = mousePos.y - height - 15;
      }

      setPosition({ x, y });
    }
  }, [isVisible, mousePos]);

  useEffect(() => {
    if (!isVisible) {
      setIsLoading(true);
      setHasError(false);
      setErrorType(null);
    }
  }, [isVisible]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setHasError(true);
    setErrorType("failed");
    setIsLoading(false);
  };

  // Heuristic for X-Frame-Options detection: if it takes too long, it might be blocked
  useEffect(() => {
    let timer: any;
    if (isVisible && isLoading) {
      // Set a heuristic timeout for X-Frame-Options or network failures
      timer = setTimeout(() => {
        if (isLoading) {
          setHasError(true);
          setErrorType("blocked");
          setIsLoading(false);
        }
      }, 7500); 
    }
    return () => clearTimeout(timer);
  }, [isVisible, isLoading]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{ 
            position: "fixed",
            left: position.x,
            top: position.y,
            zIndex: 100
          }}
          className="w-[320px] h-[220px] bg-black/95 backdrop-blur-xl rounded-xl overflow-hidden shadow-2xl flex flex-col border border-white/10"
        >
          {/* Browser Header */}
          <div className="h-7 bg-black/60 border-b border-white/5 flex items-center px-3 gap-2 flex-shrink-0">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
            </div>
            <div className="flex-grow flex justify-center">
              <div className="text-[8px] font-mono text-white/30 truncate max-w-[180px] bg-white/5 px-2 py-0.5 rounded-full border border-white/5 flex items-center gap-1">
                <Globe className="w-2 h-2" />
                {url.replace(/(^\w+:|^)\/\//, "")}
              </div>
            </div>
          </div>

          {/* Iframe Viewport */}
          <div className="flex-grow bg-white relative">
            {isVisible && (
              <>
                <AnimatePresence mode="wait">
                  {isLoading && (
                    <motion.div 
                      key="loader"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0a0a0a] text-accent-green gap-3"
                    >
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[8px] font-mono tracking-widest uppercase">Syncing_Real_Time...</span>
                        <div className="w-16 h-[1px] bg-accent-green/20 overflow-hidden">
                          <motion.div 
                            initial={{ x: "-100%" }}
                            animate={{ x: "100%" }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="w-full h-full bg-accent-green shadow-glow"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {hasError ? (
                  <div key="error" className="w-full h-full bg-[#0a0a0a] flex flex-col items-center justify-center p-4 text-center gap-3">
                    <AlertTriangle className={cn("w-8 h-8", errorType === "blocked" ? "text-yellow-500/50" : "text-red-500/50")} />
                    <div className="space-y-1">
                      <p className="text-[10px] font-mono text-white/60 font-bold uppercase tracking-widest">
                        {errorType === "blocked" ? "EMBEDDING_RESTRICTED" : "PREVIEW_RESOURCE_FAULT"}
                      </p>
                      <p className="text-[8px] font-mono text-white/20 uppercase line-clamp-2 px-4">
                        {errorType === "blocked" 
                          ? "Site policies (X-Frame-Options) prevent remote preview embedding." 
                          : "General buffer fault. Unable to establish stream with remote host."}
                      </p>
                    </div>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 px-6 py-2 bg-accent-green hover:bg-accent-green/80 text-background rounded-sm text-[10px] font-mono font-bold transition-all flex items-center gap-2 pointer-events-auto border-none shadow-[0_0_20px_rgba(0,255,65,0.3)] hover:scale-105 active:scale-95"
                    >
                      <ExternalLink className="w-3 h-3" />
                      OPEN_PROJECT
                    </a>
                  </div>
                ) : (
                  <iframe
                    src={url}
                    className="w-full h-full border-none bg-white"
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                    sandbox="allow-scripts allow-forms allow-same-origin"
                    title="Site Preview"
                  />
                )}
              </>
            )}
          </div>
          
          {/* Status Bar */}
          <div className="h-5 bg-black/80 border-t border-white/5 flex items-center justify-between px-3 flex-shrink-0">
             <div className="flex items-center gap-2">
               <Monitor className="w-2 h-2 text-accent-green" />
               <span className="text-[6px] font-mono text-white/20 uppercase tracking-widest leading-none">Status: Connected</span>
             </div>
             <span className="text-[6px] font-mono text-accent-green/40 leading-none">v1.2.0_LIVE</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
