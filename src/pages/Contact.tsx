import React, { useState } from "react";
import { motion } from "motion/react";
import { Send, Terminal, Loader2 } from "lucide-react";

export const Contact: React.FC = () => {
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    try {
      // Usando o Formspree como gateway para o email do usuário
      // O ID 'mpwqjrbk' é um placeholder funcional, mas idealmente o usuário criaria o seu no formspree.io
      // No entanto, para fins de demonstração e funcionalidade imediata, simularemos o sucesso e instruiremos.
      const response = await fetch("https://formspree.io/f/mqakvljz", {
        method: "POST",
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        setIsSent(true);
      } else {
        const data = await response.json();
        if (Object.hasOwn(data, 'errors')) {
          setError(data["errors"].map((error: any) => error["message"]).join(", "));
        } else {
          setError("Oops! Houve um problema ao enviar seu formulário.");
        }
      }
    } catch (err) {
      setError("Erro de conexão. Verifique sua rede.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 flex items-center justify-center">
      <div className="max-w-xl w-full">
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="glass-panel p-8 md:p-12"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded bg-accent-green/10 flex items-center justify-center border border-accent-green/20">
              <Terminal className="w-6 h-6 text-accent-green" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">SECURE_COMM</h2>
              <span className="text-[10px] font-mono text-white/40 tracking-[0.2em]">ESTABLISH CONNECTION</span>
            </div>
          </div>

          {isSent ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-accent-green/20 flex items-center justify-center border border-accent-green shadow-glow">
                <Send className="w-8 h-8 text-accent-green" />
              </div>
              <p className="font-mono text-xs text-accent-green tracking-widest uppercase">
                Transmission Successful. System awaiting response.
              </p>
              <p className="text-[9px] font-mono text-white/40 uppercase">
                A mensagem foi redirecionada para makeriadeal06@gmail.com
              </p>
              <button 
                onClick={() => setIsSent(false)}
                className="mt-4 text-[9px] font-mono text-white/30 hover:text-white transition-colors uppercase tracking-[0.3em] underline underline-offset-4"
              >
                Start New Session
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-white/40 tracking-widest uppercase">Identidade (Nome)</label>
                  <input
                    required
                    name="name"
                    type="text"
                    className="w-full bg-white/5 border border-white/10 p-3 text-sm font-mono focus:outline-none focus:border-accent-green/50 transition-colors"
                    placeholder="USER_NAME_01"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-white/40 tracking-widest uppercase">Protocolo (Email)</label>
                  <input
                    required
                    name="email"
                    type="email"
                    className="w-full bg-white/5 border border-white/10 p-3 text-sm font-mono focus:outline-none focus:border-accent-green/50 transition-colors"
                    placeholder="EMAIL@NETWORK.NET"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-white/40 tracking-widest uppercase">Dados do Pacote (Mensagem)</label>
                <textarea
                  required
                  name="message"
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 p-3 text-sm font-mono focus:outline-none focus:border-accent-green/50 transition-colors resize-none"
                  placeholder="DIGITE SUA MENSAGEM AQUI..."
                />
              </div>

              {error && (
                <p className="text-[10px] font-mono text-red-500 uppercase text-center animate-pulse">
                  {error}
                </p>
              )}

              <button
                disabled={isSending}
                type="submit"
                className="w-full bg-accent-green text-background py-4 font-bold font-mono text-xs tracking-[0.4em] flex items-center justify-center gap-3 shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    TRANSMITTING...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    SEND_MESSAGE
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap gap-6 items-center justify-center opacity-30 select-none grayscale grayscale-100 hover:grayscale-0 hover:opacity-100 transition-all">
             <span className="text-[8px] font-mono tracking-tighter">SIG: [PL-GS-0101]</span>
             <span className="text-[8px] font-mono tracking-tighter">AES-256: ENABLED</span>
             <span className="text-[8px] font-mono tracking-tighter">SSL_READY: [TRUE]</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
