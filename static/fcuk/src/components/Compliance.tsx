import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Cookie } from 'lucide-react';

export default function Compliance() {
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
  };

  return (
    <>
      <AnimatePresence>
        {showCookies && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-6 right-6 md:left-auto md:w-96 bg-white border border-border p-6 z-[100] shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-accent/10 text-accent rounded-full">
                <Cookie size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">Cookie Notice</h3>
                <p className="text-xs text-ink/60 mb-4 leading-relaxed">
                  We use cookies to ensure your AI agent performs at peak efficiency. By continuing to browse Finance Cheque UK, you agree to our use of cookies and data processing in accordance with UK GDPR.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={acceptCookies}
                    className="flex-1 bg-ink text-white font-bold py-2 rounded-lg text-sm hover:bg-accent transition-colors"
                  >
                    Accept All
                  </button>
                  <button
                    onClick={() => setShowCookies(false)}
                    className="px-4 border border-border text-ink font-bold py-2 rounded-lg text-sm hover:bg-paper transition-colors"
                  >
                    Settings
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="border-t border-border py-24 px-6 mt-24 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <h2 className="font-bold text-2xl text-ink">Finance Cheque UK</h2>
            <p className="text-sm text-ink/50 max-w-md leading-relaxed">
              Finance Cheque UK is a registered affiliate marketing platform in the United Kingdom. 
              Empowering individuals through autonomous AI agents and transparent revenue generation.
            </p>
            <div className="space-y-2 pt-4">
              <p className="text-[10px] font-bold text-ink/30 uppercase tracking-widest leading-relaxed">
                • We partner with verified affiliate networks including Amazon Associates, Awin, and CJ.
              </p>
              <p className="text-[10px] font-bold text-ink/30 uppercase tracking-widest leading-relaxed">
                • Earnings depend entirely on campaign performance and distribution footprint.
              </p>
              <p className="text-[10px] font-bold text-ink/30 uppercase tracking-widest leading-relaxed">
                • No guaranteed income. Past performance is not indicative of future results.
              </p>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-sm uppercase mb-6 text-ink">Legal</h4>
            <ul className="space-y-3 text-sm text-ink/60">
              <li><a href="#" className="hover:text-accent transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Cookie Policy</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">UK GDPR Compliance</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm uppercase mb-6 text-ink">Company</h4>
            <ul className="space-y-3 text-sm text-ink/60">
              <li><a href="#" className="hover:text-accent transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Press Kit</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-ink/30 font-medium uppercase tracking-widest">
          <p>© 2026 Finance Cheque UK Ltd. All rights reserved.</p>
          <div className="flex gap-8">
            <span>Company No: 12345678</span>
            <span>VAT: GB 987 6543 21</span>
          </div>
        </div>
      </footer>
    </>
  );
}
