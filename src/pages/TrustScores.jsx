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

      if (actData) {
        const enhancedActivities = actData.map(act => ({
          ...act,
          receiver_name: shareMap[act.share_id]?.receiver_name || "Unknown"
        }));
        setActivities(enhancedActivities);
        
        // Calculate trust scores
        const rcvrMap = {};
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
          }
        });
        
        setReceivers(Object.values(rcvrMap).sort((a,b) => a.score - b.score));
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 60) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    return "text-red-500 bg-red-500/10 border-red-500/20";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Trust Scores Dashboard</h1>
        <p className="text-gray-400">Monitor access activity and receiver reputation</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
        </div>
      ) : (
        <>
          {/* Receiver Trust Scores */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Receiver Reputation</h2>
            {receivers.length === 0 ? (
              <div className="bg-dark-surface border border-dark-border rounded-xl p-8 text-center">
                <p className="text-gray-400">No receiver activity yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {receivers.map((r, i) => (
                  <div key={i} className="bg-dark-surface border border-dark-border rounded-xl p-6 shadow-lg flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">{r.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">{r.viewCount} Views • {r.violations} Violations</p>
                      </div>
                      <div className={`px-4 py-2 rounded-lg border font-bold text-xl ${getScoreColor(r.score)}`}>
                        {Math.max(0, r.score)}
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                       <div 
                         className={`h-2 rounded-full ${r.score >= 90 ? 'bg-emerald-500' : r.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                         style={{ width: `${Math.max(0, Math.min(100, r.score))}%` }}
                       ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Recent Activity Log</h2>
            <div className="bg-dark-surface border border-dark-border rounded-xl shadow-lg overflow-hidden">
              {activities.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No activity logs recorded.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-dark-bg/50 border-b border-dark-border">
                      <tr>
                        <th className="px-6 py-4 font-medium">Receiver</th>
                        <th className="px-6 py-4 font-medium">Action</th>
                        <th className="px-6 py-4 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border">
                      {activities.map((act) => (
                        <tr key={act.id} className="hover:bg-dark-bg/30 transition-colors cursor-default">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-white">{act.receiver_name}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              act.action_type === 'view' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                              'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {act.action_type.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                            {new Date(act.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
