import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Bot, Target, Trash2 } from 'lucide-react';
import './Login.css'; // Reusing glass-panel styles

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function Onboarding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = searchParams.get('userId');

  const [step, setStep] = useState(1);
  const [prioritize, setPrioritize] = useState("job opportunities, urgent questions, manager emails");
  const [ignore, setIgnore] = useState("newsletters, promotional offers, cold pitches");
  const [saving, setSaving] = useState(false);

  // If they somehow land here without OAuth, boot them to login
  if (!userId) {
    navigate('/login');
    return null;
  }

  const handleFinish = async () => {
    try {
      setSaving(true);
      await fetch(`${API_BASE_URL}/users/${userId}/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prioritizeTypes: prioritize, ignoreTypes: ignore })
      });
      navigate(`/dashboard?userId=${userId}`);
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  return (
    <div className="login-wrapper animate-fade-in">
      <div className="glass-panel login-card" style={{ maxWidth: '550px' }}>
        
        <div className="icon-container" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
          <Bot size={48} color="var(--success)" />
        </div>
        
        {step === 1 && (
          <div className="animate-fade-in">
            <h1 className="title">What should I look for?</h1>
            <p className="subtitle">Tell me what's important. I will flag these instantly and make sure you never miss them in the noise.</p>
            
            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                 <Target size={16}/> Comma separated priorities
              </label>
              <textarea 
                value={prioritize}
                onChange={(e) => setPrioritize(e.target.value)}
                style={{ width: '100%', minHeight: '100px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', padding: '12px', borderRadius: '8px', fontSize: '1rem', outline: 'none' }}
              />
            </div>

            <button onClick={() => setStep(2)} className="btn btn-primary login-btn">
              <span>Next Step</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h1 className="title">What should I ignore?</h1>
            <p className="subtitle">Keep your inbox clean. I will aggressively filter and silently archive standard noise matching these traits.</p>
            
            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                 <Trash2 size={16}/> Comma separated filters
              </label>
              <textarea 
                value={ignore}
                onChange={(e) => setIgnore(e.target.value)}
                style={{ width: '100%', minHeight: '100px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', padding: '12px', borderRadius: '8px', fontSize: '1rem', outline: 'none' }}
              />
            </div>

            <button onClick={handleFinish} disabled={saving} className="btn btn-primary login-btn" style={{ background: 'linear-gradient(135deg, var(--success), #22c55e)' }}>
              <span>{saving ? 'Configuring Setup...' : 'Launch AI Assistant!'}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
