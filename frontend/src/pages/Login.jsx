import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';
import './Login.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const existingUserId = localStorage.getItem('emailAuthUserId');
    if (existingUserId) {
      navigate(`/dashboard?userId=${existingUserId}`);
    }
  }, [navigate]);

  const handleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <div className="login-wrapper animate-fade-in">
      <div className="glass-panel login-card">
        <div className="icon-container">
          <Mail size={48} color="var(--accent)" />
        </div>
        <h1 className="title">AI Email Curator</h1>
        <p className="subtitle">Automate your inbox. Let AI extract what matters, filter the noise, and provide actionable intelligence every morning.</p>
        
        <button onClick={handleLogin} className="btn btn-primary login-btn">
          <span>Continue with Google</span>
          <ArrowRight size={18} />
        </button>
        
        <p className="footer-text">Secure, fast, and completely automated.</p>
      </div>
    </div>
  );
}
