import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";
import { Terminal, Cpu, Box, User, Mail, Activity, Menu, X } from "lucide-react";
import { auth } from "../../lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

const navItems = [
  { name: "HOME", path: "/", icon: Activity },
  { name: "PROJECTS", path: "/projects", icon: Box },
  { name: "EXPERIMENTS", path: "/experiments", icon: Cpu },
  { name: "ABOUT", path: "/about", icon: User },
  { name: "CONTACT", path: "/contact", icon: Mail },
];

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const ADMIN_EMAIL = "makeriadeal06@gmail.com";
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <nav className="fixed top-0 left-0 w-full z-[100] border-b border-white/5 backdrop-blur-md bg-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-sm bg-accent-green flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform flex-shrink-0">
            <Terminal className="w-5 h-5 text-black" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-mono text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.4em] font-bold text-accent-green drop-shadow-[0_0_8px_rgba(0,255,65,0.4)] leading-tight truncate">
              PEDRO LUCAS - GHOST SYSTEM
            </span>
            <span className="font-mono text-[6px] sm:text-[7px] tracking-[0.1em] sm:tracking-[0.2em] text-white/60 uppercase truncate">
              Building intelligent systems - Ghost System
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex items-center gap-2 text-[10px] tracking-[0.2em] font-mono transition-colors hover:text-accent-green",
                  isActive ? "text-accent-green" : "text-white/40"
                )}
              >
                <item.icon className="w-3 h-3" />
                {item.name}
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute -bottom-1 left-0 w-full h-[1px] bg-accent-green shadow-glow"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden lg:flex flex-col items-end text-[8px] font-mono text-white/30 tracking-tight leading-none">
            <span>Uptime: 99.9%</span>
            <span>System: Active</span>
          </div>
          
          <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse-soft shadow-[0_0_8px_#00ff41]" />

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-white/60 hover:text-accent-green transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/5 bg-black/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4">
              {navItems.map((item, index) => {
                const isActive = location.pathname === item.path;
                return (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    key={item.path}
                  >
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center gap-4 p-3 font-mono text-xs tracking-[0.2em] transition-all rounded-sm",
                        isActive 
                          ? "bg-accent-green/10 text-accent-green border-l-2 border-accent-green" 
                          : "text-white/40 hover:text-white"
                      )}
                    >
                      <item.icon className={cn("w-4 h-4", isActive ? "text-accent-green" : "text-white/20")} />
                      {item.name}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
            
            <div className="p-6 pt-0 border-t border-white/5 mt-2">
              <div className="flex items-center justify-between text-[7px] font-mono text-white/20 uppercase tracking-[0.3em]">
                <span>Log_Session: 01H3A</span>
                <span>Signal: High</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
