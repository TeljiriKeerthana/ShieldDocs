import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

export default function Activity() {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const sessionData = localStorage.getItem("shielddocs_session");
      if (!sessionData) return;
      const userData = JSON.parse(sessionData);

      // Fetch all shares for this user, join with documents to get title
      const { data: myShares } = await supabase
        .from("shares")
        .select(`
          id, receiver_name, status, created_at, settings,
          document_id
        `)
        .eq("owner_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (!myShares || myShares.length === 0) {
        setShares([]);
        return;
      }

      // We need document titles so let's fetch docs
      const { data: docs } = await supabase
        .from("documents")
        .select("id, title")
        .in("id", myShares.map(s => s.document_id));
        
      const docMap = (docs || []).reduce((acc, d) => ({...acc, [d.id]: d.title}), {});

      // Fetch activities for these shares
      const { data: acts } = await supabase
        .from("share_activities")
        .select("share_id, action_type")
        .in("share_id", myShares.map(s => s.id));

      const enrichedShares = myShares.map(share => {
        const shareActs = (acts || []).filter(a => a.share_id === share.id);
        
        let views = 0;
        let screenshots = 0;
        let modifications = 0;
        
        shareActs.forEach(a => {
          if (a.action_type === 'view') views++;
          else if (a.action_type === 'screenshot_attempt') screenshots++;
          else if (a.action_type === 'copy_or_print_attempt' || a.action_type === 'right_click_attempt') modifications++;
        });

        const formatLabel = share.settings?.format === 'pdf' ? 'PDF' : share.settings?.format === 'image' ? 'Image/QR' : 'Web Link';

        return {
          ...share,
          document_title: docMap[share.document_id] || "Unknown Document",
          formatLabel,
          views,
          screenshots,
          modifications,
          total_events: shareActs.length
        };
      });

      setShares(enrichedShares);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (shareId) => {
    if (!confirm("Are you sure you want to revoke this link?")) return;
    try {
      const { error } = await supabase
        .from("shares")
        .update({ status: 'Revoked' })
        .eq("id", shareId);
        
      if (error) throw error;
      alert("Access revoked successfully!");
      fetchActivity();
    } catch (err) {
      console.error(err);
      alert("Failed to revoke access.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Activity Hub</h1>
        <p className="text-gray-400">Track all generated links, QR codes, PDFs and view detailed metrics.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
        </div>
      ) : shares.length === 0 ? (
        <div className="text-center py-16 bg-[#112240]/50 border border-[#233554] border-dashed rounded-xl">
          <svg className="mx-auto h-12 w-12 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-semibold text-white">No activity yet</h3>
          <p className="mt-1 text-sm text-gray-400">Share a document to start tracking activities.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {shares.map(share => (
            <div key={share.id} className="bg-[#112240] border border-[#233554] rounded-xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-white truncate max-w-xs">{share.document_title}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    share.status === 'Active' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {share.status.toUpperCase()}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#233554] text-gray-300 border border-[#334155]">
                    {share.formatLabel}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  Shared with <span className="text-brand-400 font-medium">{share.receiver_name}</span> on {new Date(share.created_at).toLocaleDateString()}
                </p>
                
                <div className="flex flex-wrap gap-4">
                  {/* Views */}
                  <div className="flex items-center gap-2 text-sm min-w[100px] bg-[#0a192f] border border-[#233554] px-3 py-2 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-bold">{share.views}</p>
                      <p className="text-gray-400 text-xs uppercase">Views</p>
                    </div>
                  </div>
                  
                  {/* Screenshots */}
                  <div className="flex items-center gap-2 text-sm min-w[100px] bg-[#0a192f] border border-[#233554] px-3 py-2 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-bold">{share.screenshots}</p>
                      <p className="text-orange-400 text-xs uppercase">Screenshots</p>
                    </div>
                  </div>

                  {/* Modification Tries */}
                  <div className="flex items-center gap-2 text-sm min-w[100px] bg-[#0a192f] border border-[#233554] px-3 py-2 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-bold">{share.modifications}</p>
                      <p className="text-red-500/80 text-xs uppercase">Modify Data Tries</p>
                    </div>
                  </div>

                </div>
              </div>

              <div className="flex flex-row md:flex-col gap-3 min-w-[140px]">
                <button 
                  onClick={() => {
                    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
                    navigator.clipboard.writeText(`${baseUrl}/view/${share.id}`);
                    alert("Link copied!");
                  }}
                  className="flex-1 py-2 px-4 rounded-lg text-sm font-medium border border-[#233554] bg-[#0a192f] hover:bg-[#233554] text-white transition-colors flex justify-center items-center gap-2 shadow-sm"
                >
                   Copy Link
                </button>
                {share.status === 'Active' ? (
                  <button 
                    onClick={() => handleRevoke(share.id)}
                    className="flex-1 py-2 px-4 rounded-lg text-sm font-medium border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors flex justify-center items-center gap-2 shadow-sm"
                  >
                     Revoke Access
                  </button>
                ) : (
                  <button 
                    disabled
                    className="flex-1 py-2 px-4 rounded-lg text-sm font-medium border border-[#233554] bg-[#0a192f] text-gray-500 cursor-not-allowed opacity-50 flex justify-center items-center gap-2"
                  >
                     Revoked
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
