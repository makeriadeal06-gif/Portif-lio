import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { Send, Terminal, Loader2 } from "lucide-react";
import emailjs from "@emailjs/browser";

export const Contact: React.FC = () => {
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const message = formData.get("message") as string;

    // Validação
    if (!name || !email || !message) {
      setError("Todos os campos são obrigatórios.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Formato de e-mail inválido.");
      return;
    }

    setIsSending(true);
    setError(null);

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      console.warn("EmailJS configuration missing. Please check .env file.");
      const missing = [];
      if (!serviceId) missing.push("VITE_EMAILJS_SERVICE_ID");
      if (!templateId) missing.push("VITE_EMAILJS_TEMPLATE_ID");
      if (!publicKey) missing.push("VITE_EMAILJS_PUBLIC_KEY");
      
      setError(`Erro: Variáveis ausentes nas Configurações: ${missing.join(", ")}. Certifique-se de usar o prefixo VITE_.`);
      setIsSending(false);
      return;
    }
    
    try {
      const result = await emailjs.send(
        serviceId,
        templateId,
        {
          user_name: name,
          user_email: email,
          message: message,
          to_email: "makeriadeal06@gmail.com" // Info extra que pode ser usada no template
        },
        publicKey
      );

      if (result.status === 200) {
        setIsSent(true);
        formRef.current?.reset();
      } else {
        throw new Error("Failed to send");
      }
    } catch (err) {
      console.error("EmailJS Error:", err);
      setError("Erro ao enviar. Tente novamente.");
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
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
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
