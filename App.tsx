import React, { useState, useCallback, useRef } from 'react';
import SimulationScene from './components/SimulationScene';
import Dashboard from './components/Dashboard';
import { SimulationState, SimulationPhase } from './types';

const App: React.FC = () => {
  const [params, setParams] = useState<SimulationState>({
    energyDensity: 20, 
    volume: 36,
    lambdaM: 1.0, 
    isPlaying: true,
    phase: 'stable',
    timeScale: 1.0,
    year: 2025
  });

  // Store history for the graph
  const [graphData, setGraphData] = useState<{ year: number; stability: number }[]>([]);
  const lastUpdateRef = useRef(0);

  // Callback for Scene to report progress back to App (and Dashboard)
  const handleUpdate = useCallback((phase: SimulationPhase, year: number) => {
    setParams(prev => {
      // Calculate fictional stability score based on phase
      let stability = 100;
      if (phase === 'approach') stability = 95 - ((year - 2025) / 20); // Slow drop
      if (phase === 'interaction') stability = 80 - ((year - 3025) * 2); // Fast drop
      if (phase === 'consumption') stability = 20 - ((year - 3075) * 2); // Critical
      if (phase === 'void') stability = 0;
      if (phase === 'rebirth') stability = 100; // Big Bang implies high energy/stability creation
      
      stability = Math.max(0, Math.min(100, stability));

      // Throttle graph updates to ~every 0.5s or significant changes
      const now = Date.now();
      if (now - lastUpdateRef.current > 500 && phase !== 'stable') {
        setGraphData(curr => {
            const newData = [...curr, { year: Math.floor(year), stability }];
            // Keep last 20 points to prevent memory bloat
            if (newData.length > 50) return newData.slice(newData.length - 50);
            return newData;
        });
        lastUpdateRef.current = now;
      }
      
      // Reset graph on rebirth/Big Bang
      if (phase === 'rebirth' && prev.phase === 'void') {
          setGraphData([{ year: 0, stability: 100 }]);
      }

      // Only update if changed to avoid render thrashing, mostly for phase
      if (prev.phase !== phase || Math.abs(prev.year - year) > 0.1) {
        return { ...prev, phase, year };
      }
      return prev;
    });
  }, []);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <SimulationScene params={params} onUpdate={handleUpdate} />
      <Dashboard params={params} setParams={setParams} graphData={graphData} />
      
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: white;
          margin-top: -6px;
          box-shadow: 0 0 10px rgba(255,255,255,0.5);
        }
        input[type=range]::-webkit-slider-runnable-track {
          width: 100%;
          height: 4px;
          cursor: pointer;
          background: rgba(255,255,255,0.2);
          border-radius: 2px;
        }
        .thumb-purple::-webkit-slider-thumb { background: #a78bfa; }
      `}</style>
    </div>
  );
};

export default App;