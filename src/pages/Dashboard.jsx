import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { Link } from "react-router-dom";

function Dashboard() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        if (user && user.user_metadata?.loginHistory) {
          setHistory(user.user_metadata.loginHistory);
        }
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const calculateTimeDiff = (current, previous) => {
    if (!previous) return "Initial Login";
    const diffMs = new Date(current.timestamp) - new Date(previous.timestamp);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) return `${diffMins} mins later`;
    const diffHours = (diffMins / 60).toFixed(1);
    
    if (diffHours < 24) return `${diffHours} hours later`;
    return `${(diffHours / 24).toFixed(1)} days later`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Security Dashboard</h1>
        <p className="text-gray-400">Review your recent login activity, device changes, and location history.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/" className="bg-dark-surface border border-dark-border hover:border-brand-500/50 rounded-xl p-6 shadow-xl transition-all group">
          <div className="w-12 h-12 bg-brand-500/10 rounded-lg flex items-center justify-center text-brand-400 mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">My Vault</h2>
          <p className="text-sm text-gray-400">View and manage uploaded documents</p>
        </Link>

        <Link to="/share" className="bg-dark-surface border border-dark-border hover:border-brand-500/50 rounded-xl p-6 shadow-xl transition-all group">
          <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Create Share</h2>
          <p className="text-sm text-gray-400">Distribute documents entirely securely</p>
        </Link>
        
        <Link to="/trust-scores" className="bg-dark-surface border border-dark-border hover:border-brand-500/50 rounded-xl p-6 shadow-xl transition-all group">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Trust Scores</h2>
          <p className="text-sm text-gray-400">Audit recipient behaviors</p>
        </Link>
      </div>

      <div className="bg-dark-surface border border-dark-border rounded-xl shadow-xl overflow-hidden mt-8">
        <div className="px-6 py-5 border-b border-dark-border bg-dark-bg flex items-center gap-3">
          <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
          </svg>
          <h2 className="text-lg font-bold text-white">Login & Device History</h2>
        </div>
        
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No history recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dark-bg text-gray-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold border-b border-dark-border">Time</th>
                  <th className="p-4 font-semibold border-b border-dark-border">Location</th>
                  <th className="p-4 font-semibold border-b border-dark-border">IP Address</th>
                  <th className="p-4 font-semibold border-b border-dark-border">Device</th>
                  <th className="p-4 font-semibold border-b border-dark-border">Interval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {history.map((entry, idx) => {
                  const previous = history[idx + 1];
                  const isCurrent = idx === 0;
                  
                  return (
                    <tr key={idx} className={`hover:bg-brand-500/5 transition-colors ${isCurrent ? 'bg-brand-500/5' : ''}`}>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isCurrent && <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>}
                          <span className={`${isCurrent ? 'text-brand-300 font-bold' : 'text-gray-300'}`}>
                            {new Date(entry.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-300">{entry.city ? `${entry.city}, ${entry.country}` : 'Unknown'}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm text-gray-400 bg-dark-bg px-2 py-1 rounded border border-dark-border">
                          {entry.ip}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-gray-400 truncate max-w-xs" title={entry.device}>
                        {entry.device}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-dark-bg border border-dark-border text-gray-400">
                          {calculateTimeDiff(entry, previous)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;