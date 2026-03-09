import { ArrowRight } from 'lucide-react';

export function SystemCapabilities() {
  return (
    <section id="system-capabilities" className="py-24 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Section */}
        <div className="flex flex-col gap-10 w-full mb-16">
          {/* Top label row */}
          <div className="flex items-center gap-6">
            <span className="text-xs font-mono text-primary tracking-widest font-semibold uppercase">
              01
            </span>
            <div className="h-[2px] flex-1 bg-border/60"></div>
            <span className="uppercase text-xs font-mono tracking-widest text-muted-foreground">
              System Capabilities
            </span>
          </div>

          {/* Main content */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-10">
            <div className="max-w-3xl flex flex-col gap-6">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                Powering Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
                  Supply Chain.
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed font-mono text-sm">
                A reliable logistics foundation designed for secure, efficient, and long-term
                operational excellence between Imphal and New Delhi.
              </p>
            </div>

            {/* Secondary CTA */}
            <button className="group flex items-center gap-2 px-6 py-4 border border-border bg-card/50 text-foreground text-xs uppercase tracking-widest font-mono font-bold rounded-none hover:bg-muted transition-colors whitespace-nowrap shadow-sm">
              <span>Explore Capabilities</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 w-full gap-6">
          {/* Card 1: Express Air Cargo */}
          <div className="group flex flex-col overflow-hidden hover:border-primary/50 transition-all duration-500 md:col-span-1 bg-card border-border border rounded-none p-8 relative justify-between min-h-[400px] shadow-sm">
            <style>{`
              @keyframes orbit-slow {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              @keyframes breathe-glow {
                0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(59, 130, 246, 0.1); }
                50% { transform: scale(1.05); box-shadow: 0 0 35px rgba(59, 130, 246, 0.3); }
              }
              @keyframes ripple-expand {
                0% { transform: scale(0.8); opacity: 0.6; border-width: 1px; }
                100% { transform: scale(2.5); opacity: 0; border-width: 0px; }
              }
              @keyframes dot-handoff {
                0%, 100% { opacity: 0.3; r: 2px; fill: hsl(var(--primary) / 0.6); }
                50% { opacity: 1; r: 3.5px; fill: hsl(var(--primary)); }
              }
            `}</style>

            {/* Visual */}
            <div className="relative h-48 w-full flex items-center justify-center mb-6 overflow-visible">
              <div className="absolute inset-0 bg-primary/5 rounded-none blur-3xl transform scale-75"></div>
              <div
                className="absolute w-16 h-16 rounded-none border border-primary/30 z-0"
                style={{ animation: 'ripple-expand 4s cubic-bezier(0, 0, 0.2, 1) infinite' }}
              ></div>

              <svg
                className="w-full h-full text-primary/20 z-10"
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g
                  style={{
                    transformOrigin: '100px 100px',
                    animation: 'orbit-slow 12s linear infinite',
                  }}
                >
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="6 6"
                    className="opacity-30"
                  ></circle>
                  <circle
                    cx="100"
                    cy="20"
                    r="3"
                    fill="hsl(var(--primary))"
                    className="drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]"
                  ></circle>
                  <circle
                    cx="180"
                    cy="100"
                    r="2.5"
                    fill="hsl(var(--primary))"
                    className="opacity-60"
                  ></circle>
                  <circle
                    cx="20"
                    cy="100"
                    r="2.5"
                    fill="hsl(var(--primary))"
                    className="opacity-60"
                  ></circle>
                </g>
                <circle
                  cx="100"
                  cy="100"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="opacity-40"
                ></circle>
                <circle
                  cx="100"
                  cy="50"
                  r="2"
                  fill="hsl(var(--primary))"
                  style={{ animation: 'dot-handoff 3s ease-in-out infinite', animationDelay: '0s' }}
                ></circle>
                <circle
                  cx="150"
                  cy="100"
                  r="2"
                  fill="hsl(var(--primary))"
                  style={{ animation: 'dot-handoff 3s ease-in-out infinite', animationDelay: '1s' }}
                ></circle>
                <circle
                  cx="100"
                  cy="150"
                  r="2"
                  fill="hsl(var(--primary))"
                  style={{ animation: 'dot-handoff 3s ease-in-out infinite', animationDelay: '2s' }}
                ></circle>
                <circle
                  cx="50"
                  cy="100"
                  r="2"
                  fill="hsl(var(--primary))"
                  style={{ animation: 'dot-handoff 3s ease-in-out infinite', animationDelay: '3s' }}
                ></circle>
              </svg>

              <div
                className="absolute flex items-center justify-center w-16 h-16 bg-background rounded-none border border-border z-20"
                style={{ animation: 'breathe-glow 4s ease-in-out infinite' }}
              >
                <div className="absolute inset-0 bg-primary/10 rounded-none blur-sm"></div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="none"
                  className="text-foreground relative z-10"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            </div>

            {/* Content */}
            <div className="relative z-10 mt-auto">
              <h3 className="text-2xl font-bold text-foreground tracking-tight">
                Express Air Cargo
              </h3>
              <p className="leading-relaxed text-muted-foreground mt-2 font-mono text-sm">
                Ensure your most urgent shipments are prioritized with our dedicated air freight
                solutions.
              </p>
            </div>
          </div>

          {/* Card 2: Surface Transport */}
          <div className="md:col-span-2 group flex flex-col overflow-hidden hover:border-primary/50 transition-all duration-500 bg-card border-border border rounded-none p-8 relative justify-between min-h-[400px] shadow-sm">
            <style>{`
              @keyframes flowData {
                0% { stroke-dashoffset: 120; opacity: 0; }
                15% { opacity: 1; }
                85% { opacity: 1; }
                100% { stroke-dashoffset: 0; opacity: 0; }
              }
              @keyframes breatheDiamond {
                0%, 100% { transform: rotate(45deg) scale(1); box-shadow: 0 0 30px rgba(59,130,246,0.1); border-color: rgba(59,130,246,0.2); }
                50% { transform: rotate(45deg) scale(1.05); box-shadow: 0 0 50px rgba(59,130,246,0.3); border-color: rgba(59,130,246,0.4); }
              }
              @keyframes orbitSpin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>

            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/10 blur-[100px] rounded-none -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors duration-700"></div>

            {/* Visual */}
            <div className="relative h-48 w-full flex items-center justify-center mb-6 overflow-visible">
              <svg
                className="absolute top-0 right-0 bottom-0 left-0 w-full h-full"
                viewBox="0 0 400 200"
                fill="none"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <linearGradient id="flowGradientLeft" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0"></stop>
                    <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="1"></stop>
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0"></stop>
                  </linearGradient>
                  <linearGradient id="flowGradientRight" x1="100%" y1="0%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0"></stop>
                    <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="1"></stop>
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>

                <path
                  d="M50 100 L120 100 L150 70"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-border"
                ></path>
                <path
                  d="M350 100 L280 100 L250 130"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-border"
                ></path>

                <path
                  d="M50 100 L120 100 L150 70"
                  stroke="url(#flowGradientLeft)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="120"
                  strokeDashoffset="120"
                  style={{ animation: 'flowData 3s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
                ></path>
                <path
                  d="M350 100 L280 100 L250 130"
                  stroke="url(#flowGradientRight)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="120"
                  strokeDashoffset="120"
                  style={{
                    animation: 'flowData 3s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                    animationDelay: '1.5s',
                  }}
                ></path>

                <g transform="translate(50 100) rotate(45)">
                  <rect
                    x="-10"
                    y="-10"
                    width="20"
                    height="20"
                    fill="currentColor"
                    className="text-background stroke-border group-hover:stroke-primary/50 transition-colors duration-300"
                  ></rect>
                  <circle
                    cx="0"
                    cy="0"
                    r="2"
                    fill="hsl(var(--primary))"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  ></circle>
                </g>
                <g transform="translate(350 100) rotate(45)">
                  <rect
                    x="-10"
                    y="-10"
                    width="20"
                    height="20"
                    fill="currentColor"
                    className="text-background stroke-border group-hover:stroke-primary/50 transition-colors duration-300"
                  ></rect>
                  <circle
                    cx="0"
                    cy="0"
                    r="2"
                    fill="hsl(var(--primary))"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  ></circle>
                </g>
              </svg>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-primary blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <div
                  className="w-24 h-24 border border-primary/30 bg-background/80 backdrop-blur-md rounded-none flex items-center justify-center z-10 relative overflow-hidden"
                  style={{ animation: 'breatheDiamond 4s ease-in-out infinite' }}
                >
                  <div className="w-12 h-12 border border-primary/50 rounded-none flex items-center justify-center bg-primary/5 relative z-20">
                    <div className="w-1.5 h-1.5 bg-primary rounded-none shadow-[0_0_10px_hsl(var(--primary))]"></div>
                  </div>
                  <div
                    className="absolute inset-0 z-10 opacity-30"
                    style={{ animation: 'orbitSpin 8s linear infinite' }}
                  >
                    <div className="w-full h-full rounded-none border-t border-r border-primary/40"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-auto">
              <h3 className="text-2xl font-bold text-foreground tracking-tight">
                Surface Transport
              </h3>
              <p className="leading-relaxed text-muted-foreground mt-2 max-w-xl">
                Cost-effective and secure ground shipping options. We handle both full truckload
                (FTL) and part truckload (PTL) across our established routes.
              </p>
            </div>
          </div>

          {/* Card 3: Pick & Drop Services */}
          <div className="md:col-span-2 group flex flex-col overflow-hidden hover:border-primary/50 transition-all duration-500 bg-card border-border border rounded-none p-8 relative justify-between min-h-[400px] shadow-sm">
            <style>{`
              @keyframes shimmer-lock {
                0%, 100% { opacity: 0.4; transform: scale(1); }
                50% { opacity: 0.8; transform: scale(1.05); }
              }
              @keyframes active-pulse-2 {
                0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.2); transform: scale(1); }
                50% { box-shadow: 0 0 35px rgba(59, 130, 246, 0.4); transform: scale(1.02); }
              }
              @keyframes scan-sweep {
                0% { transform: translateY(-150%) rotate(15deg); opacity: 0; }
                20% { opacity: 1; }
                80% { opacity: 1; }
                100% { transform: translateY(250%) rotate(15deg); opacity: 0; }
              }
              @keyframes progress-spin {
                0% { stroke-dashoffset: 100; }
                100% { stroke-dashoffset: 25; }
              }
            `}</style>

            <div className="flex w-full h-48 mb-6 relative items-center justify-center">
              <div className="flex items-center gap-4 relative">
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/10 blur-[60px] rounded-none pointer-events-none"
                  style={{ animation: 'breathe-glow 4s ease-in-out infinite' }}
                ></div>

                <div
                  className="w-12 h-12 rounded-none border border-border bg-muted/50 flex items-center justify-center text-muted-foreground"
                  style={{
                    animation: 'shimmer-lock 4s ease-in-out infinite',
                    animationDelay: '0s',
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="0" ry="0"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <div
                  className="w-12 h-12 rounded-none border border-border bg-muted/50 flex items-center justify-center text-muted-foreground"
                  style={{
                    animation: 'shimmer-lock 4s ease-in-out infinite',
                    animationDelay: '1s',
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="0" ry="0"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>

                <div
                  className="relative w-20 h-20 rounded-none bg-primary flex items-center justify-center text-primary-foreground shadow-lg z-10 border border-primary/20 ring-4 ring-background"
                  style={{ animation: 'active-pulse-2 3s ease-in-out infinite' }}
                >
                  <div className="absolute inset-0 overflow-hidden rounded-none">
                    <div
                      className="w-full h-1/3 bg-gradient-to-b from-white/0 via-white/20 to-white/0 absolute top-0 left-0"
                      style={{ animation: 'scan-sweep 3s ease-in-out infinite' }}
                    ></div>
                  </div>

                  <svg
                    className="absolute inset-0 w-full h-full -rotate-90 p-1"
                    viewBox="0 0 36 36"
                  >
                    <path
                      className="text-primary-foreground/20"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    ></path>
                    <path
                      className="text-primary-foreground drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]"
                      strokeDasharray="100 100"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ animation: 'progress-spin 1.5s ease-out forwards' }}
                    ></path>
                  </svg>

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    className="relative z-10"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>

                  <div className="absolute -bottom-3 bg-background text-foreground border border-border px-2 py-0.5 rounded-none flex items-center gap-1.5 shadow-md">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-status-success opacity-75"></span>
                      <span className="relative inline-flex rounded-none h-2 w-2 bg-status-success"></span>
                    </span>
                    <span className="text-[10px] font-mono tracking-wider font-semibold">LIVE</span>
                  </div>
                </div>

                <div
                  className="w-12 h-12 rounded-none border border-border bg-muted/50 flex items-center justify-center text-muted-foreground"
                  style={{
                    animation: 'shimmer-lock 4s ease-in-out infinite',
                    animationDelay: '2s',
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="0" ry="0"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <div
                  className="w-12 h-12 rounded-none border border-border bg-muted/50 flex items-center justify-center text-muted-foreground"
                  style={{
                    animation: 'shimmer-lock 4s ease-in-out infinite',
                    animationDelay: '3s',
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="0" ry="0"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-auto">
              <h3 className="text-2xl font-bold text-foreground tracking-tight">
                Pick & Drop Services
              </h3>
              <p className="leading-relaxed text-muted-foreground mt-2 max-w-xl">
                Enjoy the convenience of complete door-to-door services. We handle the heavy lifting
                from your doorstep to the final destination.
              </p>
            </div>
          </div>

          {/* Card 4: Packing */}
          <div className="md:col-span-1 group flex flex-col overflow-hidden hover:border-primary/50 transition-all duration-500 bg-card border-border border rounded-none p-8 relative justify-between min-h-[400px] shadow-sm">
            <style>{`
              @keyframes drift-vertical-slow {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-8px); }
              }
              @keyframes drift-vertical-reverse {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(8px); }
              }
              @keyframes signal-flow {
                0% { stroke-dashoffset: 20; opacity: 0.3; }
                100% { stroke-dashoffset: 0; opacity: 0.8; }
              }
              @keyframes node-activate {
                0%, 90%, 100% { fill: currentColor; r: 3px; filter: none; }
                92% { fill: hsl(var(--primary)); r: 4.5px; filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.8)); }
                95% { fill: hsl(var(--primary) / 0.8); r: 4px; }
              }
            `}</style>

            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                transform: 'scale(1.5) rotate(15deg)',
              }}
            ></div>

            <div className="relative h-48 w-full flex items-center justify-center mb-6 z-10">
              <svg className="w-full h-full text-foreground/20" viewBox="0 0 200 200" fill="none">
                <line
                  x1="100"
                  y1="20"
                  x2="100"
                  y2="180"
                  stroke="currentColor"
                  strokeWidth="1"
                ></line>
                <line
                  x1="60"
                  y1="20"
                  x2="60"
                  y2="180"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  style={{ animation: 'signal-flow 3s linear infinite' }}
                ></line>
                <line
                  x1="140"
                  y1="20"
                  x2="140"
                  y2="180"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  style={{ animation: 'signal-flow 4s linear infinite reverse' }}
                ></line>

                <g style={{ animation: 'drift-vertical-slow 7s ease-in-out infinite' }}>
                  <path
                    d="M60 80 C 80 80, 80 100, 100 100"
                    stroke="currentColor"
                    strokeWidth="1"
                  ></path>
                  <circle
                    cx="60"
                    cy="80"
                    r="3"
                    className="text-foreground"
                    style={{ animation: 'node-activate 8s ease-in-out infinite 0.5s' }}
                  ></circle>
                </g>

                <g style={{ animation: 'drift-vertical-reverse 8s ease-in-out infinite 1s' }}>
                  <path
                    d="M100 60 C 120 60, 120 80, 140 80"
                    stroke="currentColor"
                    strokeWidth="1"
                  ></path>
                  <circle
                    cx="140"
                    cy="80"
                    r="3"
                    className="text-foreground"
                    style={{ animation: 'node-activate 8s ease-in-out infinite 3s' }}
                  ></circle>
                </g>

                <g style={{ animation: 'drift-vertical-slow 6s ease-in-out infinite 2s' }}>
                  <path
                    d="M100 120 C 80 120, 80 140, 60 140"
                    stroke="currentColor"
                    strokeWidth="1"
                  ></path>
                  <circle
                    cx="60"
                    cy="140"
                    r="3"
                    className="text-foreground"
                    style={{ animation: 'node-activate 8s ease-in-out infinite 5.5s' }}
                  ></circle>
                </g>

                <circle
                  cx="100"
                  cy="60"
                  r="3"
                  className="text-foreground"
                  style={{ animation: 'node-activate 8s ease-in-out infinite 0s' }}
                ></circle>
                <circle
                  cx="100"
                  cy="100"
                  r="3"
                  className="text-foreground"
                  style={{ animation: 'node-activate 8s ease-in-out infinite 2s' }}
                ></circle>
                <circle
                  cx="100"
                  cy="150"
                  r="3"
                  className="text-foreground"
                  style={{ animation: 'node-activate 8s ease-in-out infinite 4s' }}
                ></circle>

                <circle
                  cx="120"
                  cy="40"
                  r="1"
                  fill="hsl(var(--primary))"
                  className="opacity-50"
                  style={{ animation: 'drift-vertical-reverse 10s ease-in-out infinite' }}
                ></circle>
                <circle
                  cx="80"
                  cy="160"
                  r="1"
                  fill="hsl(var(--primary))"
                  className="opacity-50"
                  style={{ animation: 'drift-vertical-slow 9s ease-in-out infinite' }}
                ></circle>
              </svg>
            </div>

            <div className="relative z-10 mt-auto">
              <h3 className="text-2xl font-bold text-foreground tracking-tight">
                Enterprise Scalability
              </h3>
              <p className="leading-relaxed text-muted-foreground mt-2">
                TAC grows with you, effortlessly handling thousands of daily shipments and complex
                logistics networks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
