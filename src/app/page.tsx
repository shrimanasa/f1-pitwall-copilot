import Link from "next/link";
import { BrainCircuit, Eye, Radio, Terminal, ArrowRight, ShieldAlert } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#02040a] text-slate-300 font-sans selection:bg-f1-cyan selection:text-black overflow-x-hidden">
      
      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 max-w-7xl mx-auto px-6 text-center">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-f1-cyan/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-f1-cyan/10 text-f1-cyan text-sm font-semibold border border-f1-cyan/20 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <BrainCircuit className="w-4 h-4" />
          <span>Powered by IBM Granite & Docling</span>
        </div>
        
        <h1 className="text-5xl lg:text-7xl font-bold text-white tracking-tight leading-tight mb-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          The most dangerous thing on the track <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-f1-cyan to-blue-500">isn't the car. It's the human.</span>
        </h1>
        
        <p className="text-lg lg:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
          PitWall Core is a cinematic AI race engineering system that shifts focus from vehicle telemetry to <strong>Human Threat Intelligence</strong>. Analyze radio deception, predict strategist behavior, and exploit human unpredictability using IBM AI.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
          <Link href="/dashboard" className="px-8 py-4 rounded-full bg-white text-black font-bold text-lg hover:bg-slate-200 transition-all flex items-center shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)]">
            Launch Dashboard <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="px-8 py-4 rounded-full bg-white/5 text-white font-bold text-lg hover:bg-white/10 transition-all border border-white/10">
            View Source Code
          </a>
        </div>
      </div>

      {/* The Issue vs Our Solution */}
      <div className="py-24 bg-slate-950/50 border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          
          <div className="space-y-6">
            <div className="flex items-center space-x-3 text-f1-red font-semibold tracking-wide text-sm uppercase">
              <ShieldAlert className="w-5 h-5" />
              <span>The Issue</span>
            </div>
            <h2 className="text-3xl font-bold text-white leading-snug">
              F1 strategy isn't lost to bad data. <br/> It's lost to bad signals.
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Drivers misreport tire conditions under pressure. Rival teams deliberately feed false information over open radio channels to manipulate your pit calls. Opposing strategists have decision patterns that repeat across every race—predictable, exploitable, but entirely unmodeled.
            </p>
            <p className="text-slate-400 leading-relaxed">
              Today's strategy tools analyze the car. <strong>Nobody is analyzing the people.</strong>
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-[#02040a] border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <BrainCircuit className="w-48 h-48 text-f1-cyan" />
            </div>
            <div className="flex items-center space-x-3 text-f1-cyan font-semibold tracking-wide text-sm uppercase mb-6">
              <Eye className="w-5 h-5" />
              <span>Our Magic Solution</span>
            </div>
            <h2 className="text-3xl font-bold text-white leading-snug mb-6 relative z-10">
              Human Threat Intelligence
            </h2>
            <ul className="space-y-4 text-slate-400 relative z-10">
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-f1-cyan mt-2 mr-3 shrink-0" />
                <p><strong>IBM Granite</strong> detects "Signal Mismatches" between radio intercepts and true telemetry to flag deliberate disinformation.</p>
              </li>
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-f1-yellow mt-2 mr-3 shrink-0" />
                <p><strong>IBM Docling</strong> ingests historical race transcripts to build a psychological "Strategist Fingerprint" using a robust RAG pipeline.</p>
              </li>
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-f1-red mt-2 mr-3 shrink-0" />
                <p><strong>Watson TTS</strong> synthesizes the generated strategic coaching back to the driver with immersive walkie-talkie acoustics.</p>
              </li>
            </ul>
          </div>

        </div>
      </div>

    </div>
  );
}
