import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

export default function TrustScores() {
  const [activities, setActivities] = useState([]);
  const [receivers, setReceivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const sessionData = localStorage.getItem("shielddocs_session");
      if (!sessionData) return;
      
      const userData = JSON.parse(sessionData);

      // Fetch all shares owned by current user
      const { data: myShares } = await supabase
        .from("shares")
        .select("id, receiver_name, document_id")
        .eq("owner_id", userData.user.id);

      if (!myShares || myShares.length === 0) {
        setLoading(false);
        return;
      }

      const shareIds = myShares.map(s => s.id);
      const shareMap = myShares.reduce((acc, curr) => {
        acc[curr.id] = curr;
        return acc;
      }, {});

      // Fetch activities for these shares
      const { data: actData } = await supabase
        .from("share_activities")
        .select("*")
        .in("share_id", shareIds)
        .order("created_at", { ascending: false });

      const safeActData = actData || [];
      const enhancedActivities = safeActData.map(act => ({
        ...act,
        receiver_name: shareMap[act.share_id]?.receiver_name || "Unknown"
      }));
      setActivities(enhancedActivities);
      
      // Calculate trust scores
      const rcvrMap = {};

      // Initialize with all receivers from myShares
      myShares.forEach(share => {
        if (share.receiver_name) {
          if (!rcvrMap[share.receiver_name]) {
            rcvrMap[share.receiver_name] = { name: share.receiver_name, score: 100, viewCount: 0, violations: 0 };
          }
        }
      });

      enhancedActivities.forEach(act => {
        const r = act.receiver_name;
        if (!rcvrMap[r]) rcvrMap[r] = { name: r, score: 100, viewCount: 0, violations: 0 };
        
        if (act.action_type === 'view') {
          rcvrMap[r].viewCount += 1;
          if (rcvrMap[r].viewCount > 1) rcvrMap[r].score -= 5;
        } else if (act.action_type === 'screenshot_attempt') {
          rcvrMap[r].score -= 20;
          rcvrMap[r].violations += 1;
        } else if (act.action_type === 'copy_or_print_attempt') {
          rcvrMap[r].score -= 30;
          rcvrMap[r].violations += 1;
        } else if (act.action_type === 'right_click_attempt') {
          rcvrMap[r].score -= 10;
          rcvrMap[r].violations += 1;
        } else if (act.action_type === 'access_expired_attempt') {
          rcvrMap[r].score -= 10;
          rcvrMap[r].violations += 1;
        }
      });
      
      setReceivers(Object.values(rcvrMap).sort((a,b) => a.score - b.score));

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return "text-emerald-400 bg-emerald-500/15 border-emerald-500/20";
    return "text-red-500 bg-red-500/15 border-red-500/20";
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1 flex items-center gap-3">
          <svg className="w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Trust Scores Directory
        </h1>
        <p className="text-gray-400">Monitor access activity and receiver reputation metrics.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
        </div>
      ) : (
        <>
          {/* Receiver Trust Scores */}
          <div className="bg-dark-surface border border-dark-border rounded-2xl shadow-xl overflow-hidden p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Aggregate Receiver Reputation</h2>
            {receivers.length === 0 ? (
              <div className="bg-dark-bg border border-dark-border/50 border-dashed rounded-xl p-8 text-center">
                <p className="text-gray-400">No receiver activity recorded yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {receivers.map((r, i) => (
                  <div key={i} className="bg-dark-bg border border-dark-border rounded-xl p-6 shadow-md hover:border-brand-500/30 transition-colors flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">{r.name}</h3>
                        <p className="text-xs text-gray-400 mt-1.5 font-medium">{r.viewCount} Views • {r.violations} Policy Violations</p>
                      </div>
                      <div className={`px-3 py-1.5 rounded-lg border font-black text-xl shadow-lg border-b-2 ${getScoreColor(r.score)}`}>
                        {Math.max(0, r.score)}
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-[#1e293b] rounded-full h-2.5 mt-2 shadow-inner overflow-hidden border border-gray-800">
                       <div 
                         className={`h-full rounded-none transition-all duration-1000 ${r.score >= 70 ? 'bg-emerald-500' : 'bg-red-500'}`} 
                         style={{ width: `${Math.max(0, Math.min(100, r.score))}%` }}
                       ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div className="bg-dark-surface border border-dark-border rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-dark-border">
               <h2 className="text-xl font-semibold text-white">Recent Activity Ledger</h2>
            </div>
            
            {activities.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No activity logs recorded.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="text-xs text-gray-400 uppercase bg-dark-bg border-b border-dark-border">
                    <tr>
                      <th className="px-6 py-4 font-bold tracking-wider">Receiver Identity</th>
                      <th className="px-6 py-4 font-bold tracking-wider">Logged Action</th>
                      <th className="px-6 py-4 font-bold tracking-wider text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border">
                    {activities.map((act) => (
                      <tr key={act.id} className="hover:bg-brand-500/5 transition-colors cursor-default">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-white">{act.receiver_name}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                            act.action_type === 'view' ? 'bg-primary-500/10 text-primary-400 border-primary-500/20' : 
                            act.action_type.includes('expired') ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                            'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {act.action_type.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-400 font-mono text-xs text-right">
                          {new Date(act.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
