import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, Check } from 'lucide-react';

const SOUND_PROFILES = {
  classic: { name: '经典木鱼', startFreq: 600, endFreq: 200, duration: 0.1 },
  ethereal: { name: '空灵木鱼', startFreq: 800, endFreq: 300, duration: 0.15 },
  deep: { name: '沉闷木鱼', startFreq: 400, endFreq: 100, duration: 0.12 },
  crisp: { name: '清脆木鱼', startFreq: 1000, endFreq: 400, duration: 0.08 },
};

type SoundType = keyof typeof SOUND_PROFILES;

const MuyuSVG = ({ className = "", fill = "#ffffff", stroke = "#141414" }) => (
  <svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M128 24C198 24 240 80 230 160L250 180L230 210L200 190C160 220 80 230 40 180C10 140 20 70 60 40C80 28 104 24 128 24Z" fill={fill}/>
    <path d="M30 100C90 115 140 135 175 165" stroke={stroke} strokeWidth="24" strokeLinecap="round"/>
  </svg>
);

export default function App() {
  const [count, setCount] = useState(0);
  const [plusOnes, setPlusOnes] = useState<{ id: number; x: number; y: number }[]>([]);
  const [ripples, setRipples] = useState<{ id: number }[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [soundType, setSoundType] = useState<SoundType>('classic');
  const clickIdRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTock = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          audioCtxRef.current = new AudioContext();
        }
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const profile = SOUND_PROFILES[soundType];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(profile.startFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(profile.endFreq, ctx.currentTime + profile.duration);
      
      gain.gain.setValueAtTime(1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + profile.duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + profile.duration);
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  }, [soundType]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const id = clickIdRef.current++;
    
    setCount((c) => c + 1);
    playTock();
    
    setPlusOnes((prev) => [...prev, { id, x, y }]);
    setRipples((prev) => [...prev, { id }]);

    setTimeout(() => {
      setPlusOnes((prev) => prev.filter((item) => item.id !== id));
      setRipples((prev) => prev.filter((item) => item.id !== id));
    }, 1000);
  };

  const handleReset = () => {
    setCount(0);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center overflow-hidden select-none touch-manipulation">
      {/* Settings Button */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="absolute top-8 left-8 p-3 rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
      >
        <Settings size={24} />
      </button>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: '-50%', y: '-50%' }}
              animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
              exit={{ opacity: 0, scale: 0.95, x: '-50%', y: '-50%' }}
              className="absolute top-1/2 left-1/2 w-[320px] bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 shadow-2xl z-50"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-lg font-medium tracking-wider">音效设置</h2>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-white/50 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex flex-col gap-3">
                {(Object.entries(SOUND_PROFILES) as [SoundType, typeof SOUND_PROFILES[SoundType]][]).map(([key, profile]) => (
                  <button
                    key={key}
                    onClick={() => setSoundType(key)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                      soundType === key 
                        ? 'bg-white/10 border-white/30 text-white' 
                        : 'bg-transparent border-white/5 text-white/60 hover:bg-white/5 hover:text-white/80'
                    }`}
                  >
                    <span className="tracking-widest">{profile.name}</span>
                    {soundType === key && <Check size={18} />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-12 bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-full shadow-2xl z-50"
          >
            恭喜你，今天的怨气都清零啦！
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-20 flex flex-col items-center gap-3">
        <span className="text-white/50 text-sm tracking-[0.3em] font-medium">累计功德</span>
        <span className="text-white text-6xl font-mono font-bold tracking-wider">{count}</span>
        
        <button 
          onClick={handleReset}
          className="mt-6 px-6 py-2 rounded-full border border-white/20 text-white/70 hover:bg-white/10 hover:text-white transition-colors text-sm tracking-widest"
        >
          清零功德
        </button>
      </div>

      <div className="relative">
        {/* Ripples */}
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.div
              key={ripple.id}
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <MuyuSVG className="opacity-40 blur-sm" />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Floating +1s */}
        <AnimatePresence>
          {plusOnes.map((plusOne) => (
            <motion.div
              key={plusOne.id}
              initial={{ opacity: 1, y: plusOne.y - 20, x: plusOne.x - 40, scale: 0.8 }}
              animate={{ opacity: 0, y: plusOne.y - 150, scale: 1.2 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="absolute text-white font-bold text-2xl pointer-events-none z-10 whitespace-nowrap drop-shadow-lg"
              style={{ left: 0, top: 0 }}
            >
              功德 +1
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Muyu */}
        <motion.div
          whileTap={{ scale: 0.92 }}
          onPointerDown={handlePointerDown}
          className="relative z-0 cursor-pointer"
        >
          <MuyuSVG className="drop-shadow-2xl" />
        </motion.div>
      </div>
    </div>
  );
}
