import { motion } from 'motion/react';
import { Phone, Mic, MicOff, Video, VideoOff, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

export default function AvatarSection() {
  const [isCalling, setIsCalling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  return (
    <div className="relative w-full max-w-4xl mx-auto aspect-video bg-card border border-border rounded-[40px] overflow-hidden shadow-2xl shadow-accent/5">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #3B82F6 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />

      {/* Avatar Simulation */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-72 h-72">
          {/* Pulsing rings */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.05, 0.2] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 border border-accent/20 rounded-full"
          />
          <motion.div 
            animate={{ scale: [1.2, 1.4, 1.2], opacity: [0.1, 0.02, 0.1] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            className="absolute inset-0 border border-accent/10 rounded-full"
          />
          
          {/* The "Avatar" - A stylized AI face */}
          <div className="absolute inset-6 bg-accent/5 rounded-full border border-accent/20 flex items-center justify-center overflow-hidden shadow-inner">
            <motion.div 
              animate={{ 
                y: [0, -4, 0],
                rotate: [0, 1, -1, 0]
              }}
              transition={{ duration: 6, repeat: Infinity }}
              className="w-full h-full flex flex-col items-center justify-center gap-6"
            >
              {/* Eyes */}
              <div className="flex gap-10">
                <motion.div 
                  animate={{ scaleY: [1, 0.1, 1] }}
                  transition={{ duration: 4, repeat: Infinity, repeatDelay: 4 }}
                  className="w-10 h-1.5 bg-accent rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                />
                <motion.div 
                  animate={{ scaleY: [1, 0.1, 1] }}
                  transition={{ duration: 4, repeat: Infinity, repeatDelay: 4 }}
                  className="w-10 h-1.5 bg-accent rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                />
              </div>
              {/* Mouth/Voice Wave */}
              <div className="flex items-center gap-1.5 h-10">
                {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: isCalling ? [10, 30, 10] : 6 }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                    className="w-1.5 bg-accent/40 rounded-full"
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Overlay UI */}
      <div className="absolute inset-0 p-10 flex flex-col justify-between pointer-events-none">
        <div className="flex justify-between items-start">
          <div className="bg-card/80 backdrop-blur-md border border-border p-5 rounded-2xl pointer-events-auto shadow-lg shadow-accent/5">
            <div className="flex items-center gap-4">
              <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
              <div>
                <h3 className="font-bold text-lg text-ink leading-none">Agent EVE-01</h3>
                <p className="text-[11px] font-bold text-accent/60 uppercase tracking-widest mt-1">Status: Online</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pointer-events-auto">
            <button className="p-3.5 bg-card/80 backdrop-blur-md border border-border rounded-full hover:bg-paper transition-all shadow-lg shadow-accent/5">
              <MoreHorizontal size={20} className="text-ink" />
            </button>
          </div>
        </div>

        <div className="flex justify-center items-center gap-8 pointer-events-auto">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`p-5 rounded-full border transition-all shadow-xl ${isMuted ? 'bg-red-500 border-red-500 text-white' : 'bg-card border-border text-ink hover:bg-paper'}`}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          
          <button 
            onClick={() => setIsCalling(!isCalling)}
            className={`p-8 rounded-full transition-all shadow-2xl ${isCalling ? 'bg-red-500 text-white rotate-[135deg]' : 'bg-accent text-white hover:scale-105 shadow-accent/20'}`}
          >
            <Phone size={36} fill="currentColor" />
          </button>

          <button className="p-5 bg-card border border-border text-ink rounded-full hover:bg-paper transition-all shadow-xl">
            <Video size={24} />
          </button>
        </div>
      </div>

      {/* Incoming Call Notification */}
      {!isCalling && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-36 left-1/2 -translate-x-1/2 bg-card border border-border px-8 py-4 rounded-full font-bold uppercase text-xs text-accent flex items-center gap-4 shadow-2xl shadow-accent/10"
        >
          <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
          Agent is ready to talk
        </motion.div>
      )}
    </div>
  );
}
