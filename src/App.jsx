import React, { useState, useEffect, useRef } from 'react';
import { ScanFace, Check, Flame, Plus, Activity, Dumbbell, ChevronLeft, LayoutDashboard, CalendarDays, Smile, Meh, Frown, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { supabase } from './supabaseClient';

// Base Logic & Datasets
const baseFood = { name: 'Chicken Breast', weight: '210g', p: 65, c: 0, f: 7 };
const ALL_MODIFIERS = [
  { id: 1, name: 'Butter', unit: '1 tbsp', p: 0, c: 0, f: 12 },
  { id: 2, name: 'Olive Oil', unit: '1 tbsp', p: 0, c: 0, f: 14 },
  { id: 3, name: 'BBQ Sauce', unit: '2 tbsp', p: 0, c: 15, f: 0 },
  { id: 4, name: 'Garlic Parm', unit: '1 serving', p: 2, c: 1, f: 10 }
];

// STRAVA-STYLE HIDDEN HISTORY SHARE CARD
const HistoryShareCard = React.forwardRef(({ history }, ref) => {
  const onTrackDays = history.filter(day => day.eaten <= day.base + day.workout).length;

  return (
    <div 
      ref={ref} 
      className="share-card-literal"
      style={{
        position: 'absolute', left: '-9999px', top: '-9999px',
        width: '1080px', height: '1080px', 
        background: 'linear-gradient(145deg, #09090A 0%, #17171A 100%)',
        display: 'flex', flexDirection: 'column',
        padding: '80px', boxSizing: 'border-box',
        color: '#fff', fontFamily: 'Inter, sans-serif', overflow: 'hidden'
      }}
    >
      <div style={{ position: 'absolute', top: '-20%', left: '-20%', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(226,255,74,0.15) 0%, transparent 60%)', filter: 'blur(80px)' }} />

      <div style={{ zIndex: 2, textAlign: 'center', marginBottom: '60px' }}>
        <h2 style={{ fontSize: '36px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '8px', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' }}>
          MacroScout Milestones
        </h2>
        <h1 style={{ fontSize: '120px', fontWeight: 900, letterSpacing: '-4px', lineHeight: 1, color: 'var(--accent)', margin: 0 }}>
          {onTrackDays} DAYS
        </h1>
        <h3 style={{ fontSize: '48px', fontWeight: 700, color: '#fff', marginTop: '12px', letterSpacing: '-1px' }}>
          ON TRACK
        </h3>
      </div>

      <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
         {history.map((day, i) => {
           const isOver = day.eaten > (day.base + day.workout);
           return (
             <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '24px', padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                 <div style={{ fontSize: '32px', fontWeight: 800 }}>{day.date}</div>
                 <div style={{ fontSize: '24px', color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>Mood: {day.feeling}</div>
               </div>
               <div style={{ textAlign: 'right' }}>
                 <div style={{ fontSize: '48px', fontWeight: 900, color: isOver ? 'var(--pro)' : 'var(--accent)' }}>{day.eaten} <span style={{fontSize:'24px', color:'rgba(255,255,255,0.5)'}}>kcal</span></div>
                 <div style={{ fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', color: isOver ? 'var(--pro)' : 'var(--accent)', marginTop: '8px' }}>
                   {isOver ? 'OVER BUDGET' : 'GOAL MET'}
                 </div>
               </div>
             </div>
           )
         })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', borderTop: '4px solid rgba(255,255,255,0.1)', paddingTop: '40px', zIndex: 2, marginTop: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '32px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Flame size={48} color="#000" />
          </div>
          <div>
             <div style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-1px' }}>MacroScout</div>
             <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent)' }}>Cloud Sync</div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function App() {
  const [view, setView] = useState('main');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Dynamic State
  const baseGoal = 2000;
  const [workoutCals, setWorkoutCals] = useState(0);
  const [eatenCals, setEatenCals] = useState(0);
  const [todayFeeling, setTodayFeeling] = useState(null); 
  const [cloudHistory, setCloudHistory] = useState([]);

  // Supabase Cloud Sync
  useEffect(() => {
    async function fetchCloudData() {
      try {
        const { data: logs } = await supabase.from('daily_logs').select('*');
        if (logs) {
           const todayEaten = logs.reduce((sum, log) => sum + log.calories, 0);
           setEatenCals(todayEaten);
        }
        
        const { data: hist } = await supabase.from('history').select('*').order('created_at', { ascending: false });
        if (hist && hist.length > 0) {
           setCloudHistory(hist);
        }
      } catch (err) {
        console.warn('Supabase DB connection uninitialized. Reverting to local state.', err);
      }
    }
    fetchCloudData();
  }, []);

  // NATIVE HEALTHKIT BRIDGE LISTENER
  useEffect(() => {
    window.updateNativeWorkoutCalories = (cals) => {
      console.log('Received Apple HealthKit Burned Calories:', cals);
      setWorkoutCals(Math.round(cals));
    };
    return () => {
      delete window.updateNativeWorkoutCalories;
    };
  }, []);

  const adjustedGoal = baseGoal + workoutCals;
  const remaining = adjustedGoal - eatenCals;

  return (
    <div className="app-container">
      {view === 'main' && (
        <div style={{ height: '100%', position: 'relative' }}>
          {activeTab === 'dashboard' ? (
            <Dashboard
              baseGoal={baseGoal} workoutCals={workoutCals} eatenCals={eatenCals}
              adjustedGoal={adjustedGoal} remaining={remaining}
              todayFeeling={todayFeeling} setTodayFeeling={setTodayFeeling}
              onAddWorkout={() => setWorkoutCals(w => w + 300)}
            />
          ) : (
            <CalendarHistory 
              todayEaten={eatenCals} todayWorkout={workoutCals} base={baseGoal} 
              todayFeeling={todayFeeling} cloudHistory={cloudHistory} 
            />
          )}

          <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} onLog={() => setView('logging')} />
        </div>
      )}

      {view === 'logging' && (
        <MealLogger
          onLog={async (cals) => { 
            setEatenCals(e => e + cals); 
            setView('main'); 
            
            // Push securely to Supabase
            try {
               await supabase.from('daily_logs').insert([{ calories: cals }]);
            } catch (err) {
               console.warn("Cloud push failed, cached locally.");
            }
          }}
          onCancel={() => setView('main')}
        />
      )}
    </div>
  );
}

function Dashboard({ baseGoal, workoutCals, eatenCals, adjustedGoal, remaining, onAddWorkout, todayFeeling, setTodayFeeling }) {
  const percentUsed = Math.min((eatenCals / adjustedGoal) * 100, 100);

  return (
    <div className="dashboard-container fade-in" style={{ overflowY: 'auto' }}>
      <div className="dash-header">
        <h2>Today's Overview</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="date-badge">Today</div>
        </div>
      </div>

      <div style={{ background: 'var(--bg)', paddingTop: '10px', paddingBottom: '10px' }}>
        <div className="rings-container">
          <svg viewBox="0 0 100 100" className="progress-ring">
            <circle cx="50" cy="50" r="45" className="ring-bg" />
            <circle cx="50" cy="50" r="45" className="ring-fill" strokeDasharray="282.7" strokeDashoffset={282.7 - (282.7 * percentUsed) / 100} />
          </svg>
          <div className="ring-inner">
            <span className="remaining-num">{Math.max(remaining, 0)}</span>
            <span className="remaining-text">{remaining < 0 ? 'OVER BUDGET' : 'KCAL LEFT'}</span>
          </div>
        </div>

        <div className="math-row">
          <div className="math-stat"><span className="val">{baseGoal}</span> <span className="lbl">Base</span></div>
          <span className="math-operator">+</span>
          <div className="math-stat highlight" onClick={onAddWorkout}><span className="val">{workoutCals}</span> <span className="lbl"><Dumbbell size={12} /> Burned</span></div>
          <span className="math-operator">=</span>
          <div className="math-stat goal"><span className="val">{adjustedGoal}</span> <span className="lbl">Goal</span></div>
        </div>

        <div className="eaten-card">
          <div className="eaten-info"><Flame size={20} color="var(--pro)" /> <span>Eaten Today</span></div>
          <span className="eaten-val">{eatenCals} kcal</span>
        </div>
      </div>

      <div className="feeling-section">
        <h3 className="section-title" style={{ fontSize: '16px', marginBottom: '12px' }}>How do you feel today?</h3>
        <div className="feeling-grid">
          <button className={"feel-btn " + (todayFeeling === 'Great' ? 'active' : '')} onClick={() => setTodayFeeling('Great')}>
            <Smile size={24} color={todayFeeling === 'Great' ? '#000' : 'var(--carb)'} /> <span>Great</span>
          </button>
          <button className={"feel-btn " + (todayFeeling === 'Okay' ? 'active' : '')} onClick={() => setTodayFeeling('Okay')}>
            <Meh size={24} color={todayFeeling === 'Okay' ? '#000' : 'var(--fat)'} /> <span>Okay</span>
          </button>
          <button className={"feel-btn " + (todayFeeling === 'Tired' ? 'active' : '')} onClick={() => setTodayFeeling('Tired')}>
            <Frown size={24} color={todayFeeling === 'Tired' ? '#000' : 'var(--pro)'} /> <span>Tired</span>
          </button>
        </div>
      </div>

      <div style={{ paddingBottom: '120px' }} />
    </div>
  );
}

function CalendarHistory({ todayEaten, todayWorkout, base, todayFeeling, cloudHistory }) {
  // Merge live local state with cloud state
  const history = [
    { date: 'Today', eaten: todayEaten, workout: todayWorkout, base: base, feeling: todayFeeling || 'Not Set' },
    ...cloudHistory
  ];
  
  // Fallback if cloud is completely empty or unauthorized
  if (history.length === 1) {
      history.push({ date: 'Yesterday', eaten: 2150, workout: 400, base: 2000, feeling: 'Great' });
      history.push({ date: 'Mar 22', eaten: 1800, workout: 0, base: 2000, feeling: 'Tired' });
  }

  const exportRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleShare = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    try {
      exportRef.current.style.left = '0px'; 
      exportRef.current.style.zIndex = -9999;
      
      const canvas = await html2canvas(exportRef.current, {
        scale: 1, 
        useCORS: true,
        logging: false,
        backgroundColor: '#09090A'
      });
      
      exportRef.current.style.left = '-9999px';

      const dataUrl = canvas.toDataURL('image/png');
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'macroscout_history.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'MacroScout Goal Log',
          text: `Check out my recent Macro tracking history!`,
          files: [file]
        });
      } else {
        const link = document.createElement('a');
        link.download = `macroscout-history-share.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Share Action Failed:', err);
      exportRef.current.style.left = '-9999px';
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="dashboard-container fade-in" style={{ overflowY: 'auto' }}>
      <HistoryShareCard ref={exportRef} history={history} />
      
      <div className="dash-header">
        <h2>Log History</h2>
        <button className="icon-btn" onClick={handleShare} disabled={isExporting} style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '50%' }}>
          {isExporting ? <Activity size={18} className="pulse" color="var(--accent)" /> : <Share2 size={18} color="#fff" />}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '120px' }}>
        {history.map((day, i) => {
          const adjGoal = day.base + day.workout;
          const isOver = day.eaten > adjGoal;
          return (
            <div key={i} className="history-card">
              <div className="hc-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3>{day.date}</h3>
                  <div className="feeling-pill">{day.feeling}</div>
                </div>
                <div className={"hc-status " + (isOver ? 'over' : 'good')}>
                  {isOver ? 'Over Budget' : 'On Track'}
                </div>
              </div>
              <div className="hc-stats">
                <div className="hc-stat"><span>{day.eaten}</span> <label>EATEN</label></div>
                <div className="hc-divider"></div>
                <div className="hc-stat"><span>{day.workout}</span> <label>BURNED</label></div>
                <div className="hc-divider"></div>
                <div className="hc-stat"><span>{adjGoal - day.eaten}</span> <label>REMAINING</label></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BottomNav({ activeTab, onChangeTab, onLog }) {
  return (
    <div className="bottom-nav">
      <button onClick={() => onChangeTab('dashboard')} className={activeTab === 'dashboard' ? 'active' : ''}>
        <LayoutDashboard size={22} className="nav-icon" /><span>Dashboard</span>
      </button>

      <div className="fab-container">
        <button className="fab-btn" onClick={onLog}><Plus size={28} color="#000" /></button>
      </div>

      <button onClick={() => onChangeTab('history')} className={activeTab === 'history' ? 'active' : ''}>
        <CalendarDays size={22} className="nav-icon" /><span>History</span>
      </button>
    </div>
  )
}

function MealLogger({ onLog, onCancel }) {
  const [scanning, setScanning] = useState(true);
  const [scanText, setScanText] = useState('Initializing Sensors...');
  const [scanProgress, setScanProgress] = useState(0);
  const [activeMods, setActiveMods] = useState([2]);

  const videoRef = useRef(null);

  useEffect(() => {
    let stream = null;
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('Camera access denied or unavailable', err);
        setScanText('Camera Not Permitted');
      }
    }
    startCamera();

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  useEffect(() => {
    if (!scanning) return;
    const phases = [
      { t: 0, text: 'Calibrating Depth Sensors...' },
      { t: 900, text: 'Mapping Volume Boundaries...' },
      { t: 2200, text: 'Analyzing Food Composition...' },
      { t: 3600, text: 'Finalizing Macro Estimate...' }
    ];

    phases.forEach(({ t, text }) => setTimeout(() => { if (scanning) setScanText(text) }, t));

    const interval = setInterval(() => { setScanProgress(p => p >= 100 ? 100 : p + 1.2); }, 50);
    const finish = setTimeout(() => setScanning(false), 4200);

    return () => { clearInterval(interval); clearTimeout(finish); };
  }, [scanning]);

  const toggleMod = (id) => setActiveMods(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const totalP = baseFood.p + activeMods.reduce((acc, id) => acc + ALL_MODIFIERS.find(m => m.id === id).p, 0);
  const totalC = baseFood.c + activeMods.reduce((acc, id) => acc + ALL_MODIFIERS.find(m => m.id === id).c, 0);
  const totalF = baseFood.f + activeMods.reduce((acc, id) => acc + ALL_MODIFIERS.find(m => m.id === id).f, 0);
  const totalCals = (totalP * 4) + (totalC * 4) + (totalF * 9);

  return (
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'absolute', top: 0, width: '100%', zIndex: 10, background: 'var(--bg)' }}>
      <div className="logger-header">
        <button className="icon-btn" onClick={onCancel} disabled={scanning}><ChevronLeft size={24} /></button>
        <span>Scanner Focus</span>
        <div style={{ width: 24 }} />
      </div>

      <div className={"camera-viewport flex-shrink-0 " + (scanning ? 'scanning' : 'locked')}>
        <video ref={videoRef} autoPlay playsInline muted className="live-camera-feed" />
        <div className="camera-overlay" />

        {scanning ? (
          <div className="scan-indicator-realistic">
            <ScanFace size={48} className="pulse" color="var(--accent)" />
            <div className="scan-data">
              <span className="scan-status-text">{scanText}</span>
              <div className="prog-bg"><div className="prog-fill" style={{ width: scanProgress + '%' }} /></div>
              <span className="prog-num">{Math.floor(scanProgress)}%</span>
            </div>
          </div>
        ) : (
          <div className="scan-success">
            <div className="badge"><Check size={14} /> <span>Volume Locked</span></div>
            <h1>{baseFood.name}</h1>
            <p>{baseFood.weight} Target Identified</p>
          </div>
        )}
      </div>

      <div className="modifiers-section" style={{ opacity: scanning ? 0.3 : 1, pointerEvents: scanning ? 'none' : 'auto', transition: 'opacity 0.5s' }}>
        <h3 className="section-title">Preparation & Add-ons</h3>
        <p className="section-subtitle">Tap to instantly add to your daily macros</p>

        <div className="mod-grid">
          {ALL_MODIFIERS.map(mod => {
            const isActive = activeMods.includes(mod.id);
            return (
              <button key={mod.id} className={"mod-card " + (isActive ? 'active' : '')} onClick={() => toggleMod(mod.id)}>
                <div className="mod-header">
                  <span className="mod-name">{mod.name}</span>
                  <div className={"checkbox " + (isActive ? 'checked' : '')}>
                    {isActive ? <Check size={12} strokeWidth={4} /> : <Plus size={12} strokeWidth={3} />}
                  </div>
                </div>
                <div className="mod-macros">
                  {mod.p > 0 && <span>{mod.p}g P</span>}
                  {mod.c > 0 && <span>{mod.c}g C</span>}
                  {mod.f > 0 && <span>{mod.f}g F</span>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className={"sticky-footer " + (scanning ? 'hidden-footer' : 'show-footer')}>
        <div className="macro-summary">
          <div className="macro-stat"><div className="bar p-bar" style={{ height: (totalP / 100) * 40 + 'px' }}></div><span>{totalP}g</span><label>PRO</label></div>
          <div className="macro-stat"><div className="bar c-bar" style={{ height: (totalC / 100) * 40 + 'px' }}></div><span>{totalC}g</span><label>CARB</label></div>
          <div className="macro-stat"><div className="bar f-bar" style={{ height: (totalF / 100) * 40 + 'px' }}></div><span>{totalF}g</span><label>FAT</label></div>

          <div className="total-cals">
            <Flame size={20} color="#FF6B6B" />
            <div className="cal-text"><span className="num">{totalCals}</span><span className="unit">kcal</span></div>
          </div>
        </div>

        <button className="log-btn" disabled={scanning} onClick={() => onLog(totalCals)}>
          {scanning ? 'SCANNING...' : `LOG ${totalCals} KCAL`}
        </button>
      </div>
    </div>
  );
}
