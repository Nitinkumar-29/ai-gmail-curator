import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mail, Briefcase, Tag, AlertCircle, RefreshCw, ChevronDown, ChevronRight, Filter, ExternalLink, Check } from 'lucide-react';
import './Dashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function Dashboard() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  // New UI states
  const [expandedEmailId, setExpandedEmailId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [toastMsg, setToastMsg] = useState('');

  const [searchParams] = useSearchParams();
  const queryUserId = searchParams.get('userId');
  const userId = queryUserId || localStorage.getItem('emailAuthUserId');

  useEffect(() => {
    if (queryUserId) localStorage.setItem('emailAuthUserId', queryUserId);
  }, [queryUserId]);

  const fetchEmails = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/dashboard/${userId}`);
      const data = await res.json();
      setEmails(data || []);
    } catch (err) {
      console.error("Failed to fetch emails", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [userId]);

  const handleSync = async () => {
    if (!userId) return;
    try {
      setSyncing(true);
      await fetch(`${API_BASE_URL}/dashboard/sync/${userId}`, { method: 'POST' });
      
      setToastMsg("Sync triggered! AI is processing your inbox in the background.");
      setTimeout(() => setToastMsg(''), 4000);
      
      fetchEmails();
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const handleDismiss = async (dbId) => {
    try {
      await fetch(`${API_BASE_URL}/dashboard/${dbId}`, { method: 'DELETE' });
      setEmails(emails.filter(e => e._id !== dbId));
    } catch(err) { console.error(err) }
  };

  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'high': return <span className="badge badge-high"><AlertCircle size={14}/> Action Required</span>;
      case 'medium': return <span className="badge badge-medium">Medium</span>;
      default: return null;
    }
  }

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'job': return <Briefcase size={16} />;
      case 'promotion': return <Tag size={16} />;
      default: return <Mail size={16} />;
    }
  }

  const toggleExpand = (id) => {
    setExpandedEmailId(expandedEmailId === id ? null : id);
  }

  // Derive unique categories dynamically from the loaded emails
  const categories = ["All", ...new Set(emails.map(e => e.category))];
  
  // Filter logic
  const filteredEmails = emails.filter(e => activeCategory === "All" || e.category === activeCategory);
  
  // Split logic based on priority
  const highPriorityEmails = filteredEmails.filter(e => e.priority === 'high');
  const normalEmails = filteredEmails.filter(e => e.priority !== 'high');

  const renderEmailRow = (email) => {
    const isExpanded = expandedEmailId === email._id;
    return (
      <div key={email._id} className={`email-row-wrapper glass-panel ${isExpanded ? 'expanded' : ''}`}>
        <div className="email-row-header" onClick={() => toggleExpand(email._id)}>
          <div className="row-left">
            <span className="expand-icon">{isExpanded ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}</span>
            <div className={`category-icon-pill ${email.category}`}>{getCategoryIcon(email.category)}</div>
            <div className="sender-info">
              <span className="sender-name">{email.sender.split('<')[0].trim() || email.sender}</span>
              <span className="email-subject-line">{email.subject}</span>
            </div>
          </div>
          <div className="row-right">
            {getPriorityBadge(email.priority)}
            <span className="action-pill">{email.actionableAdvice}</span>
          </div>
        </div>
        
        {isExpanded && (
          <div className="email-row-body animate-fade-in">
            <div className="ai-insight-box">
              <div className="insight-header"><Mail size={14}/> <span>AI Analysis</span></div>
              <p>{email.summary}</p>
            </div>
            <div className="original-snippet">
              <strong>Snippet:</strong> {email.snippet}...
            </div>
            
            <div className="btn-group">
              <a 
                href={`https://mail.google.com/mail/u/0/#all/${email.emailId}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-gmail"
              >
                <ExternalLink size={14} /> Open in Gmail
              </a>
              <button 
                className="btn-dismiss" 
                onClick={(e) => { e.stopPropagation(); handleDismiss(email._id); }}
              >
                <Check size={14} /> Mark as Done
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="dashboard-wrapper animate-fade-in">
      <div className="sticky-top-bar">
        <header className="dash-header">
          <div>
            <h1 className="dash-title">Curated Inbox</h1>
            <p className="dash-subtitle">Your AI has prioritized these items for you.</p>
          </div>
          <button onClick={handleSync} disabled={syncing} className="btn btn-primary sync-btn">
            <RefreshCw size={16} className={syncing ? "animate-spin" : ""} /> 
            {syncing ? 'Analyzing Inbox...' : 'Sync Inbox'}
          </button>
        </header>

        {/* Category Filter Bar */}
        {!loading && emails.length > 0 && (
           <div className="filter-bar">
             <Filter size={16} color="var(--text-muted)"/>
             <div className="filter-chips">
               {categories.map(cat => (
                  <button 
                    key={cat} 
                    className={`filter-chip ${activeCategory === cat ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
               ))}
             </div>
           </div>
        )}
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div><p>Fetching curated intelligence...</p>
        </div>
      ) : emails.length === 0 ? (
        <div className="loading-state">
          <p>Inbox zero! Hit Sync Inbox to fetch new data.</p>
        </div>
      ) : (
        <div className="inbox-container">
          {highPriorityEmails.length > 0 && (
            <div className="inbox-section">
              <h3 className="section-label">Requires Attention</h3>
              <div className="email-list">
                {highPriorityEmails.map(renderEmailRow)}
              </div>
            </div>
          )}

          {normalEmails.length > 0 && (
            <div className="inbox-section">
              <h3 className="section-label">Filtered Inbox</h3>
              <div className="email-list">
                {normalEmails.map(renderEmailRow)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="toast-notification">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
