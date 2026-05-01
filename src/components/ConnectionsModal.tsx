import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, Facebook, Twitter, Instagram, MessageCircle, Send, CreditCard, Mail } from 'lucide-react';

const TOP_25_SERVICES = [
  { name: 'Google', domain: 'google.com', icon: <Globe size={14} /> },
  { name: 'Meta', domain: 'meta.com', icon: <Facebook size={14} /> },
  { name: 'X.com', domain: 'x.com', icon: <Twitter size={14} /> },
  { name: 'Instagram', domain: 'instagram.com', icon: <Instagram size={14} /> },
  { name: 'LinkedIn', domain: 'linkedin.com', icon: <Globe size={14} /> },
  { name: 'YouTube', domain: 'youtube.com', icon: <Globe size={14} /> },
  { name: 'TikTok', domain: 'tiktok.com', icon: <Globe size={14} /> },
  { name: 'WhatsApp', domain: 'whatsapp.com', icon: <MessageCircle size={14} /> },
  { name: 'Telegram', domain: 'telegram.org', icon: <Send size={14} /> },
  { name: 'Reddit', domain: 'reddit.com', icon: <Globe size={14} /> },
  { name: 'Pinterest', domain: 'pinterest.com', icon: <Globe size={14} /> },
  { name: 'Snapchat', domain: 'snapchat.com', icon: <Globe size={14} /> },
  { name: 'Discord', domain: 'discord.com', icon: <MessageCircle size={14} /> },
  { name: 'Slack', domain: 'slack.com', icon: <MessageCircle size={14} /> },
  { name: 'GitHub', domain: 'github.com', icon: <Globe size={14} /> },
  { name: 'Amazon', domain: 'amazon.com', icon: <Globe size={14} /> },
  { name: 'eBay', domain: 'ebay.com', icon: <Globe size={14} /> },
  { name: 'Shopify', domain: 'shopify.com', icon: <Globe size={14} /> },
  { name: 'WordPress', domain: 'wordpress.com', icon: <Globe size={14} /> },
  { name: 'Medium', domain: 'medium.com', icon: <Globe size={14} /> },
  { name: 'Substack', domain: 'substack.com', icon: <Globe size={14} /> },
  { name: 'Mailchimp', domain: 'mailchimp.com', icon: <Mail size={14} /> },
  { name: 'Salesforce', domain: 'salesforce.com', icon: <Globe size={14} /> },
  { name: 'HubSpot', domain: 'hubspot.com', icon: <Globe size={14} /> },
  { name: 'Stripe', domain: 'stripe.com', icon: <CreditCard size={14} /> },
];

interface ConnectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (platform: string, icon: any) => void;
  onboardingStep?: number;
  cookiesAccepted?: boolean;
  connectedPlatforms?: string[];
  onDisconnect?: (platform: string) => void;
}

export default function ConnectionsModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  onboardingStep = 0, 
  cookiesAccepted = false,
  connectedPlatforms = [],
  onDisconnect
}: ConnectionsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-20 left-0 right-0 bottom-0 z-[1000] flex items-start justify-center p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="w-full max-w-2xl bg-paper border border-border p-10 space-y-8 shadow-2xl relative my-8"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-ink/20 hover:text-ink transition-colors"
            >
              <X size={24} />
            </button>

            <div className="space-y-2 text-center">
              <h2 className="text-4xl font-bold tracking-tighter text-ink">Earn 2.33 FCUK Credits</h2>
              <p className="text-xs text-ink/40 font-bold uppercase tracking-widest">for every platform you connect me to</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...TOP_25_SERVICES].sort((a, b) => {
                const aConnected = connectedPlatforms.includes(a.name);
                const bConnected = connectedPlatforms.includes(b.name);
                if (aConnected && !bConnected) return 1;
                if (!aConnected && bConnected) return -1;
                return 0;
              }).map((item) => {
                const isConnected = connectedPlatforms.includes(item.name);
                return (
                  <motion.button
                    key={item.name}
                    layout
                    onClick={() => isConnected ? onDisconnect?.(item.name) : onSelect(item.name, item.icon)}
                    className={`flex flex-col items-center justify-center gap-3 p-4 bg-card border border-border hover:border-accent hover:bg-accent/5 transition-all group relative overflow-hidden h-full ${isConnected ? 'opacity-30 grayscale hover:opacity-100 hover:grayscale-0' : 'opacity-100'}`}
                  >
                    {onboardingStep === 3 && item.name === 'Gmail' && cookiesAccepted && !isConnected && (
                      <div className="absolute -left-2 -top-2 w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-[10px] font-bold animate-bounce shadow-lg z-50">3</div>
                    )}
                    
                    <div className="flex flex-col items-center gap-3 w-full">
                      <div className="w-10 h-10 flex items-center justify-center bg-paper border border-border group-hover:border-accent transition-colors">
                        <img 
                          src={`https://logo.clearbit.com/${item.domain}`} 
                          alt={item.name}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${item.name}&background=random`;
                          }}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-ink truncate w-full">{item.name}</div>
                        {isConnected ? (
                          <div className="text-[8px] font-bold text-red-500 mt-1">Disconnect</div>
                        ) : (
                          <div className="text-[8px] font-bold text-accent mt-1">2.33 FCUK</div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
