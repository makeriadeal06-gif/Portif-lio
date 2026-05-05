import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { Home } from "./pages/Home";
import { Projects } from "./pages/Projects";
import { Experiments } from "./pages/Experiments";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import Admin from "./pages/Admin";
import { motion, AnimatePresence } from "motion/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

function App() {
  return (
    <Router>
      <div className="relative min-h-screen bg-background selection:bg-accent-green selection:text-background overflow-x-hidden">
        {/* Background Grid Accent */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0">
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        {/* HUD Elements */}
        <div className="fixed inset-0 pointer-events-none z-50 border-[20px] border-white/2 hidden lg:block" />
        <div className="fixed top-8 left-8 pointer-events-none z-50 flex flex-col gap-1 hidden lg:flex">
          <div className="h-0.5 w-12 bg-accent-green/20" />
          <div className="h-0.5 w-8 bg-accent-green/10" />
        </div>

        <Navbar />
        
        <main className="relative z-10">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
              <Route path="/projects" element={<PageWrapper><Projects /></PageWrapper>} />
              <Route path="/admin" element={<PageWrapper><Admin /></PageWrapper>} />
              <Route path="/experiments" element={<PageWrapper><Experiments /></PageWrapper>} />
              <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
              <Route path="/contact" element={<PageWrapper><Contact /></PageWrapper>} />
            </Routes>
          </AnimatePresence>
        </main>

        <SpeedInsights />

        <footer className="relative z-10 p-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 bg-black/40">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-accent-green tracking-widest">© 2026 PEDRO LUCAS - GHOST SYSTEM</span>
            <span className="text-[8px] font-mono text-white/20">ALL_RIGHTS_RESERVED // NO_UNAUTHORIZED_ACCESS</span>
          </div>
          <div className="flex gap-8 items-center text-[9px] font-mono text-white/40 tracking-[0.2em]">
            <a href="https://www.linkedin.com/in/pedro-lucas-7ab3722bb?utm_source=share_via&utm_content=profile&utm_medium=member_android" target="_blank" rel="noopener noreferrer" className="hover:text-accent-green transition-colors">LINKEDIN</a>
            <a href="#" className="hover:text-accent-green transition-colors">GITHUB</a>
            <a href="https://www.instagram.com/pedrolucas1617?igsh=MXdqbzQyZ2VxbHd1Zg==" target="_blank" rel="noopener noreferrer" className="hover:text-accent-green transition-colors">INSTAGRAM</a>
          </div>
        </footer>
      </div>
    </Router>
  );
}

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

export default App;
