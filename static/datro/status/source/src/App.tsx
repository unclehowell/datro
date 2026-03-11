import { SpaceJourney } from './components/SpaceJourney';

export default function App() {
  return (
    <div className="relative w-full h-screen bg-black flex items-center justify-center overflow-hidden">
      {/* Outer frame container */}
      <div className="relative w-full max-w-[450px] h-full shadow-2xl overflow-hidden z-10 border-x-[12px] border-zinc-900">
        <SpaceJourney />
      </div>
    </div>
  );
}
