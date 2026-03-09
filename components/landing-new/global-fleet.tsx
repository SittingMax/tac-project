import { Plane, Truck, Package, Warehouse } from 'lucide-react';

export function GlobalFleet() {
  return (
    <section
      id="global-fleet"
      className="border-border/40 border-t py-24 lg:py-32 relative bg-background"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none bg-muted/50 border border-border/50 text-xs font-mono font-bold text-primary mb-6 uppercase tracking-widest">
            Enterprise Fleet
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-6 leading-[1.1]">
            Comprehensive <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
              Logistics Solutions
            </span>
          </h2>
          <p className="text-lg text-muted-foreground font-mono leading-relaxed">
            End-to-end multi-modal transport network. Scalable for businesses of all sizes
            connecting Imphal and New Delhi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Air Freight */}
          <div className="group relative rounded-none bg-card border border-border/50 overflow-hidden hover:border-primary/50 transition-colors duration-500 shadow-sm hover:shadow-md flex flex-col">
            {/* Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-none group-hover:bg-primary/20 transition-all duration-500 pointer-events-none"></div>

            <div className="p-8 relative z-10 flex flex-col flex-1">
              <div className="w-12 h-12 rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform duration-500">
                <Plane className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight group-hover:text-primary transition-colors">
                Air Freight
              </h3>
              <p className="text-sm font-mono text-muted-foreground leading-relaxed mb-8 flex-1">
                Express air cargo services for urgent deliveries across India. Door-to-door pickup
                and delivery.
              </p>

              {/* Visual Component */}
              <div className="relative h-40 rounded-none bg-muted/30 border border-border/50 overflow-hidden group-hover:border-primary/30 transition-colors flex items-center justify-center p-4">
                <div className="w-full flex items-center justify-between relative">
                  {/* Route Line */}
                  <div className="absolute left-6 right-6 h-[1px] bg-border top-1/2 -translate-y-1/2 overflow-hidden rounded-none">
                    <div className="h-full bg-primary/50 w-full -translate-x-full group-hover:translate-x-0 transition-transform duration-1000 ease-in-out"></div>
                  </div>
                  {/* Start Node */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="w-2 h-2 rounded-none bg-background border border-primary group-hover:shadow-[0_0_10px_hsl(var(--primary))] transition-shadow duration-500"></div>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">
                      Origin
                    </span>
                  </div>
                  {/* Plane Icon Moving */}
                  <div className="absolute left-6 z-20 text-primary group-hover:left-[calc(100%-24px)] transition-all duration-1000 ease-in-out">
                    <Plane className="w-5 h-5 fill-primary/20 rotate-45 -mt-2.5 -ml-2.5" />
                  </div>
                  {/* End Node */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="w-2 h-2 rounded-none bg-background border border-muted-foreground group-hover:border-primary transition-colors duration-1000 delay-300"></div>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">
                      Dest
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Surface Transport */}
          <div className="group relative rounded-none bg-card border border-border/50 overflow-hidden hover:border-primary/50 transition-colors duration-500 shadow-sm hover:shadow-md flex flex-col">
            {/* Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-none group-hover:bg-primary/20 transition-all duration-500 pointer-events-none"></div>

            <div className="p-8 relative z-10 flex flex-col flex-1">
              <div className="w-12 h-12 rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform duration-500">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight group-hover:text-primary transition-colors">
                Surface Transport
              </h3>
              <p className="text-sm font-mono text-muted-foreground leading-relaxed mb-8 flex-1">
                Cost-effective ground shipping with full truckload and part truckload options
                available.
              </p>

              {/* Visual Component */}
              <div className="relative h-40 rounded-none bg-muted/30 border border-border/50 overflow-hidden group-hover:border-primary/30 transition-colors flex items-center justify-center p-4">
                <div className="w-full h-full relative flex items-center">
                  {/* Road */}
                  <div className="w-full h-12 bg-background/50 border-y border-border/50 relative overflow-hidden flex items-center">
                    <div className="w-[200%] h-[1px] border-b border-dashed border-muted-foreground/30 animate-[slide_2s_linear_infinite] group-hover:border-primary/40 group-hover:animate-[slide_1s_linear_infinite]"></div>
                    <style>{`
                       @keyframes slide {
                         from { transform: translateX(0); }
                         to { transform: translateX(-50%); }
                       }
                     `}</style>
                  </div>
                  {/* Truck */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-8 bg-card border border-border rounded-none shadow-lg flex items-center justify-center group-hover:-translate-y-2 transition-transform duration-500 group-hover:shadow-primary/20">
                    <div className="absolute right-1 top-1 w-1.5 h-1.5 rounded-none bg-status-success animate-pulse"></div>
                    <span className="text-[10px] font-mono font-bold tracking-widest text-primary">
                      TAC
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Pick & Drop */}
          <div className="group relative rounded-none bg-card border border-border/50 overflow-hidden hover:border-primary/50 transition-colors duration-500 shadow-sm hover:shadow-md flex flex-col">
            {/* Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-none group-hover:bg-primary/20 transition-all duration-500 pointer-events-none"></div>

            <div className="p-8 relative z-10 flex flex-col flex-1">
              <div className="w-12 h-12 rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform duration-500">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight group-hover:text-primary transition-colors">
                Pick & Drop
              </h3>
              <p className="text-sm font-mono text-muted-foreground leading-relaxed mb-8 flex-1">
                Complete door-to-door convenience for your logistics needs across Imphal and New
                Delhi.
              </p>

              {/* Visual Component */}
              <div className="relative h-40 rounded-none bg-muted/30 border border-border/50 overflow-hidden group-hover:border-primary/30 transition-colors flex items-center justify-center p-4">
                <div className="relative w-full h-full">
                  {/* Map Grid */}
                  <div
                    className="absolute inset-0 opacity-[0.1] pointer-events-none"
                    style={{
                      backgroundImage:
                        'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
                      backgroundSize: '20px 20px',
                    }}
                  ></div>

                  {/* Delivery Node Center */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-none bg-primary/20 border border-primary/50 flex items-center justify-center z-10">
                    <div className="w-2 h-2 rounded-none bg-primary group-hover:scale-150 transition-transform duration-300"></div>
                  </div>

                  {/* Surrounding Nodes */}
                  <div className="absolute top-4 left-4 w-2 h-2 rounded-none bg-muted-foreground/30 group-hover:bg-status-success group-hover:shadow-[0_0_10px_var(--status-success)] transition-all duration-300 delay-100"></div>
                  <div className="absolute bottom-6 left-8 w-2 h-2 rounded-none bg-muted-foreground/30 group-hover:bg-status-success group-hover:shadow-[0_0_10px_var(--status-success)] transition-all duration-300 delay-200"></div>
                  <div className="absolute top-8 right-6 w-2 h-2 rounded-none bg-muted-foreground/30 group-hover:bg-status-success group-hover:shadow-[0_0_10px_var(--status-success)] transition-all duration-300 delay-300"></div>
                  <div className="absolute bottom-4 right-4 w-2 h-2 rounded-none bg-muted-foreground/30 group-hover:bg-status-success group-hover:shadow-[0_0_10px_var(--status-success)] transition-all duration-300 delay-400"></div>

                  {/* Connecting Lines (svg) */}
                  <svg className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-300 z-0">
                    <line
                      x1="50%"
                      y1="50%"
                      x2="20px"
                      y2="20px"
                      stroke="hsl(var(--primary))"
                      strokeWidth="1"
                      strokeDasharray="4"
                    />
                    <line
                      x1="50%"
                      y1="50%"
                      x2="36px"
                      y2="calc(100% - 28px)"
                      stroke="hsl(var(--primary))"
                      strokeWidth="1"
                      strokeDasharray="4"
                    />
                    <line
                      x1="50%"
                      y1="50%"
                      x2="calc(100% - 28px)"
                      y2="36px"
                      stroke="hsl(var(--primary))"
                      strokeWidth="1"
                      strokeDasharray="4"
                    />
                    <line
                      x1="50%"
                      y1="50%"
                      x2="calc(100% - 20px)"
                      y2="calc(100% - 20px)"
                      stroke="hsl(var(--primary))"
                      strokeWidth="1"
                      strokeDasharray="4"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Packing */}
          <div className="group relative rounded-none bg-card border border-border/50 overflow-hidden hover:border-primary/50 transition-colors duration-500 shadow-sm hover:shadow-md flex flex-col">
            {/* Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-none group-hover:bg-primary/20 transition-all duration-500 pointer-events-none"></div>

            <div className="p-8 relative z-10 flex flex-col flex-1">
              <div className="w-12 h-12 rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform duration-500">
                <Warehouse className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight group-hover:text-primary transition-colors">
                Expert Packing
              </h3>
              <p className="text-sm font-mono text-muted-foreground leading-relaxed mb-8 flex-1">
                Professional packing services designed to keep your valuable cargo secure during
                transit.
              </p>

              {/* Visual Component */}
              <div className="relative h-40 rounded-none bg-muted/30 border border-border/50 overflow-hidden group-hover:border-primary/30 transition-colors flex items-center justify-center p-4">
                <div className="w-full flex flex-col gap-2">
                  {/* Shelf 1 */}
                  <div className="h-6 w-full border-b border-border relative flex items-end px-2 gap-2">
                    <div className="w-6 h-4 bg-muted border border-border rounded-none group-hover:bg-primary/20 group-hover:border-primary/50 transition-colors"></div>
                    <div className="w-8 h-5 bg-muted border border-border rounded-none group-hover:bg-primary/20 group-hover:border-primary/50 transition-colors delay-75"></div>
                    <div className="w-4 h-3 bg-muted border border-border rounded-none group-hover:bg-primary/20 group-hover:border-primary/50 transition-colors delay-100"></div>
                  </div>
                  {/* Shelf 2 */}
                  <div className="h-6 w-full border-b border-border relative flex items-end px-2 gap-2">
                    <div className="w-5 h-5 bg-muted border border-border rounded-none group-hover:bg-primary/20 group-hover:border-primary/50 transition-colors delay-150"></div>
                    <div className="w-10 h-4 bg-muted border border-border rounded-none group-hover:bg-primary/20 group-hover:border-primary/50 transition-colors delay-200"></div>
                  </div>
                  {/* Shelf 3 */}
                  <div className="h-6 w-full border-b border-border relative flex items-end px-2 gap-2 justify-end">
                    <div className="w-6 h-6 bg-muted border border-border rounded-none group-hover:bg-primary border-primary group-hover:shadow-[0_0_15px_hsl(var(--primary))] transition-all duration-300 delay-300 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/20"></div>
                    </div>
                    <div className="w-8 h-4 bg-muted border border-border rounded-none group-hover:bg-primary/20 group-hover:border-primary/50 transition-colors delay-300"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
