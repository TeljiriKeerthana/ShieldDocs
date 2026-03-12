import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

export default function ViewDocument() {
  const { id } = useParams();
  const [share, setShare] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const logActivity = async (actionType) => {
    try {
      await supabase.from("share_activities").insert([
        { share_id: id, action_type: actionType }
      ]);
    } catch (err) {
      console.error("Failed to log activity", err);
    }
  };

  useEffect(() => {
    const fetchShare = async () => {
      try {
        const { data, error } = await supabase
          .from("shares")
          .select("*")
          .eq("id", id)
          .single();

        if (error || !data) throw new Error("Share link invalid or expired");
        if (data.status !== 'Active') throw new Error("This share link has been revoked");

        setShare(data);
        // Log view
        logActivity("view");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchShare();
    
    // Security Listeners
    const handleKeydown = (e) => {
      if (e.key === "PrintScreen" || (e.ctrlKey && e.key === "c") || (e.metaKey && e.key === "c") || (e.ctrlKey && e.key === "p") || (e.metaKey && e.key === "p")) {
        e.preventDefault();
        alert("⚠ Action tracking: Security policy violation detected!");
        logActivity(e.key === "PrintScreen" ? "screenshot_attempt" : "copy_or_print_attempt");
      }
    };
    window.addEventListener("keydown", handleKeydown);
    
    // Prevent context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
      logActivity("right_click_attempt");
    };
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [id]);

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading secure document...</div>;

  if (error) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="bg-red-900/20 border border-red-500/50 text-red-400 p-6 flex flex-col items-center rounded-xl max-w-md text-center">
        <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p>{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 selection:bg-transparent relative select-none">
      {/* Alert Banner */}
      <div className="fixed top-0 left-0 w-full bg-red-900/90 text-red-100 px-4 py-2 text-center text-sm font-medium z-50 flex items-center justify-center gap-2 backdrop-blur-sm border-b border-red-800">
        Confidential Document. Screenshots are tracked and prohibited.
      </div>

      <div className="max-w-4xl w-full bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden mt-10">
        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 flex justify-between items-center border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">Secure Document Viewer</h2>
            <p className="text-xs text-emerald-400 mt-1 uppercase tracking-wider font-semibold">Protected View • Shared with: {share?.receiver_name}</p>
          </div>
        </div>

        {/* Document Area */}
        <div className="p-8 bg-gray-900 relative flex justify-center items-center min-h-[60vh] overflow-hidden">
          {/* Dynamic Watermark Overlay */}
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden flex flex-col justify-center gap-12 rotate-[-25deg] opacity-[0.05]">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="whitespace-nowrap text-3xl font-bold text-white tracking-widest leading-loose">
                CONFIDENTIAL • SHARED WITH: {share?.receiver_name?.toUpperCase()} • {new Date().toLocaleDateString()} • SHIELDDOCS • DO NOT COPY •
              </div>
            ))}
          </div>
          
          {/* Document Content */}
          <div className="relative z-0 shadow-lg border border-slate-700 bg-white rounded-sm overflow-hidden p-2 w-full flex justify-center">
            {share?.settings?.file_type?.includes('pdf') ? (
              <div className="relative w-full">
                {/* Overlay to prevent interaction/right click on iframe */}
                <div className="absolute inset-0 z-20"></div>
                <iframe src={`${share?.settings?.file_url}#toolbar=0`} className="w-full h-[600px] border-0" />
              </div>
            ) : (
               <img
                 src={share?.settings?.file_url}
                 alt="Secured Document"
                 className="max-w-full h-auto object-contain max-h-[70vh] select-none"
                 style={{ WebkitUserDrag: 'none' }}
                 onError={(e) => { e.target.src = "https://placehold.co/600x400/1e293b/ffffff?text=Document+Not+Found" }}
               />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}