import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Cookie } from 'lucide-react';

interface ComplianceProps {
  onAccept?: () => void;
}

export default function Compliance({ onAccept }: ComplianceProps) {
  const [showCookies, setShowCookies] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('fcuk-cookie-consent');
    if (!consent) {
      setShowCookies(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('fcuk-cookie-consent', 'true');
    setShowCookies(false);
    onAccept?.();
  };

  return (
    <>
      <AnimatePresence>
        {showCookies && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-6 right-6 md:left-auto md:w-96 bg-paper border border-border p-6 z-[100] shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-accent/10 text-accent rounded-full">
                <Cookie size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1 text-ink">Cookie Notice</h3>
                <p className="text-xs text-ink/60 mb-4 leading-relaxed">
                  We use cookies to ensure your AI agent performs at peak efficiency. By continuing to browse Finance Cheque UK (FCUK), you agree to our use of cookies and data processing in accordance with UK GDPR.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={acceptCookies}
                    className="flex-1 bg-ink text-paper font-bold py-2 rounded-lg text-sm hover:bg-accent transition-colors"
                  >
                    Accept All
                  </button>
                  <button
                    onClick={() => setShowCookies(false)}
                    className="px-4 border border-border text-ink font-bold py-2 rounded-lg text-sm hover:bg-card transition-colors"
                  >
                    Settings
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
