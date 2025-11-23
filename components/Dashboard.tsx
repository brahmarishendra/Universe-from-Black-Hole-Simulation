import React, { useState } from 'react';
import { SimulationState, SimulationPhase } from '../types';
import { Play, Pause, Info, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  params: SimulationState;
  setParams: React.Dispatch<React.SetStateAction<SimulationState>>;
  graphData?: { year: number; stability: number }[];
}

const PhaseIndicator = ({ phase }: { phase: SimulationPhase }) => {
  const getLabel = () => {
    switch(phase) {
      case 'stable': return "Solar System Stable";
      case 'approach': return "WARNING: Gravity Anomaly";
      case 'interaction': return "Mass Transfer Initiated";
      case 'consumption': return "Singularity Collapse";
      case 'void': return "Spacetime Rupture";
      case 'rebirth': return "New System Formation";
    }
  };

  const getColor = () => {
    switch(phase) {
      case 'stable': return "text-green-400";
      case 'approach': return "text-orange-400 animate-pulse";
      case 'interaction': return "text-red-500 animate-bounce";
      case 'consumption': return "text-purple-600";
      case 'void': return "text-blue-400";
      case 'rebirth': return "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]";
    }
  };

  return (
    <div className="mb-2 text-center font-outfit">
      <span className={`text-xs uppercase tracking-widest font-bold ${getColor()} transition-all duration-500`}>
        Status: {getLabel()}
      </span>
    </div>
  );
};

const TimelineDisplay = ({ year, phase }: { year: number, phase: SimulationPhase }) => {
    let formattedYear = `Year: ${Math.floor(year)}`;
    let subtext = "Cosmic Timeline";

    if (phase === 'rebirth') {
        if (year < 1000) {
            formattedYear = "T + 0s";
            subtext = "Expansion";
        } else if (year < 1000000) {
             formattedYear = `T + ${Math.floor(year).toLocaleString()} yrs`;
             subtext = "Cooling";
        } else {
             formattedYear = `T + ${(year/1000000).toFixed(1)} Million yrs`;
             subtext = "Accretion";
        }
    } else if (phase === 'void') {
        formattedYear = "T - ???";
        subtext = "Singularity";
    }

    return (
        <div className="text-center mb-4 border-b border-white/10 pb-4 font-outfit">
            <div className="text-4xl font-bold tracking-tighter tabular-nums text-white">
                {formattedYear}
            </div>
            <div className="text-[10px] text-white/40 uppercase tracking-[0.3em] mt-1">
                {subtext}
            </div>
        </div>
    );
}

const InfoPanel = ({ onClose }: { onClose: () => void }) => (
  <div className="absolute top-16 right-4 md:right-8 w-96 max-h-[80vh] overflow-y-auto bg-black/95 backdrop-blur-xl border border-white/20 p-6 rounded-lg text-white shadow-2xl z-50 scrollbar-thin scrollbar-thumb-white/20 font-outfit">
    <div className="flex justify-between items-start mb-4 sticky top-0 bg-black/95 pb-2 border-b border-white/10 z-10">
      <h3 className="text-xl text-orange-200 font-bold">Scientific Context</h3>
      <button onClick={onClose} className="text-white/50 hover:text-white"><X size={16}/></button>
    </div>
    
    <div className="space-y-6 text-xs text-gray-300 leading-relaxed">
      
      {/* Big Bang */}
      <section>
        <h4 className="font-bold text-white text-sm mb-2 text-blue-300">The Big Bang & Cycles</h4>
        <p className="mb-2">
          This simulation visualizes a hypothetical "Cyclic Universe" model. A massive black hole consumes a solar system, compressing matter into a singularity.
        </p>
      </section>

      {/* Singularity Math */}
      <section>
        <h4 className="font-bold text-white text-sm mb-2 text-purple-300">Singularity Mathematics</h4>
        <p className="mb-2">
          As the Black Hole approaches, it creates a "Gravity Well" visualized by the grid below.
        </p>
        
        <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-white/5 p-2 rounded text-center">
                <div className="font-math text-lg text-purple-200">{"f(x) = \\frac{1}{x}"}</div>
                <div className="text-[9px] mt-1 text-gray-500">Gravitational Pole</div>
            </div>
            <div className="bg-white/5 p-2 rounded text-center">
                <div className="font-math text-lg text-purple-200">{"y^2 - x^3 = 0"}</div>
                <div className="text-[9px] mt-1 text-gray-500">Cusp Geometry</div>
            </div>
        </div>
      </section>

      {/* Multiverse */}
      <section>
        <h4 className="font-bold text-white text-sm mb-2 text-green-300">From Destruction to Creation</h4>
        <div className="bg-white/5 p-3 rounded text-center mb-2">
           <div className="font-math text-base text-green-200 mb-1">{"N_{univ} \\propto S_{BH}"}</div>
           <p className="text-[9px] text-gray-500">
             New systems emerging from the entropy of the old.
           </p>
        </div>
        <p>
            As the simulation resets ("Rebirth"), the consumed matter is ejected to form a new solar system, completing the cosmic cycle.
        </p>
      </section>
    </div>
  </div>
);

const PlanetLegend = () => (
    <div className="flex flex-wrap gap-2 justify-center mt-2 px-2 font-outfit">
        {[
            {n: 'Mercury', c: '#A5A5A5'},
            {n: 'Venus', c: '#E3BB76'},
            {n: 'Earth', c: '#0077BE'},
            {n: 'Mars', c: '#C0392B'},
            {n: 'Jupiter', c: '#D4AC0D'},
            {n: 'Saturn', c: '#F4D03F'},
            {n: 'Comet', c: '#00FFFF'},
        ].map(p => (
            <div key={p.n} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{background: p.c}}></div>
                <span className="text-[9px] text-white/60 uppercase">{p.n}</span>
            </div>
        ))}
    </div>
);

const Controls = ({ params, setParams, graphData }: DashboardProps) => {
  return (
    <div className="bg-black/40 backdrop-blur-md p-4 md:p-6 border border-white/10 rounded-lg space-y-4 font-outfit">
       <div className="flex items-center justify-between">
        <h3 className="text-white/60 text-xs tracking-[0.2em] uppercase font-semibold">System Entropy</h3>
        <button 
          onClick={() => setParams(p => ({ ...p, isPlaying: !p.isPlaying }))}
          className="text-white hover:text-purple-400 transition-colors"
        >
          {params.isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
      </div>

      {/* Stability Graph */}
      {graphData && graphData.length > 1 && (
          <div className="h-20 w-full mt-2 opacity-80 hover:opacity-100 transition-opacity">
              <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graphData}>
                      <XAxis dataKey="year" hide />
                      <YAxis domain={[0, 100]} hide />
                      <RechartsTooltip 
                        contentStyle={{backgroundColor: '#000', border: '1px solid #333', fontSize: '10px'}}
                        itemStyle={{color: '#a78bfa'}}
                        labelStyle={{color: '#666'}}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="stability" 
                        stroke="#a78bfa" 
                        strokeWidth={2} 
                        dot={false}
                        isAnimationActive={false}
                      />
                  </LineChart>
              </ResponsiveContainer>
              <div className="text-[9px] text-center text-white/30 font-mono mt-1">Spacetime Stability Metric</div>
          </div>
      )}

      <div className="space-y-2 mt-4">
        <div>
          <div className="flex justify-between text-xs mb-1">
             <span className="text-white">Time Dilation</span>
             <span className="text-white/50">{params.timeScale}x</span>
          </div>
           <input
            type="range"
            min="0.1"
            max="5.0"
            step="0.1"
            value={params.timeScale}
            onChange={(e) => setParams({ ...params, timeScale: parseFloat(e.target.value) })}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer thumb-purple"
          />
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = (props) => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-4 md:p-6 z-10 overflow-hidden font-outfit">
      
      <header className="pointer-events-auto flex justify-between items-start">
        <div>
          <h1 className="text-white font-mono font-bold text-xl md:text-xl tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 drop-shadow-lg">
            Universe from Black Hole
          </h1>
          <p className="text-white/40 text-[10px] md:text-xs mt-1 tracking-widest font-mono uppercase">
            Gaia BH1 Simulator
          </p>
        </div>
        
        <div className="relative">
            <button 
                className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors backdrop-blur-md border border-white/10 flex items-center gap-2 pr-4"
                onClick={() => setShowInfo(!showInfo)}
                onMouseEnter={() => setShowInfo(true)}
            >
                <Info size={20} />
                <span className="text-xs font-bold uppercase tracking-widest hidden md:block">Info</span>
            </button>
            {showInfo && <InfoPanel onClose={() => setShowInfo(false)} />}
        </div>
      </header>

      <main className="flex-1"></main>

      <footer className="pointer-events-auto grid grid-cols-1 md:grid-cols-2 gap-4 items-end max-w-4xl mx-auto w-full">
        <div className="w-full bg-black/60 p-4 rounded border border-white/10 backdrop-blur-md">
           <TimelineDisplay year={props.params.year} phase={props.params.phase} />
           <PhaseIndicator phase={props.params.phase} />
           <PlanetLegend />
        </div>
        <div className="w-full"><Controls {...props} /></div>
      </footer>
    </div>
  );
};

export default Dashboard;