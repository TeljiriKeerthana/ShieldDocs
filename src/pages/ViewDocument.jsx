import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

export default function ViewDocument() {
  const { id } = useParams();
  const [share, setShare] = useState(null);
  const [errorType, setErrorType] = useState(""); // "revoked", "expired", "invalid"
  const [errorMessage, setErrorMessage] = useState("");
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

        if (error || !data) {
          setErrorType("invalid");
          throw new Error("This secure link is invalid or does not exist.");
        }
        
        if (data.status === 'Revoked') {
          setErrorType("revoked");
          throw new Error("Access Revoked by Owner");
        }
        
        if (data.status !== 'Active') {
           setErrorType("invalid");
           throw new Error("This share link is no longer active.");
        }

        // Check explicit time expiry
        if (data.settings?.expiryType === "specific" && data.settings?.expiryHours) {
          const createdTime = new Date(data.created_at).getTime();
          const expireTime = createdTime + (data.settings.expiryHours * 60 * 60 * 1000);
          if (Date.now() > expireTime) {
             setErrorType("expired");
             // Log expiry attempt
             logActivity("access_expired_attempt");
             throw new Error("This secure link has expired based on the owner's time constraints.");
          }
        }

        // One time view logic
        if (data.settings?.oneTimeView) {
           // We would typically check if it was viewed before, but for this MVP 
           // we just log it, and maybe auto-revoke after first view.
           // Setting status to 'Revoked' immediately after fetching so it can't be used again
           await supabase.from("shares").update({ status: 'Revoked' }).eq("id", id);
        }

        setShare(data);
        logActivity("view");
      } catch (err) {
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchShare();
    
    // Security Listeners
    const handleScreenshotAttempt = (method) => {
      alert(`⚠ Action tracking: Security policy violation detected! (${method})`);
      logActivity("screenshot_attempt");
      // Optional: Auto-revoke on severe violation
      // supabase.from("shares").update({ status: 'Revoked' }).eq("id", id);
    };

    const handleKeydown = (e) => {
      // PrintScreen (often only fires on keyup, but check keydown just in case)
      if (e.key === "PrintScreen") {
        e.preventDefault();
        handleScreenshotAttempt("PrintScreen Key");
      }
      // Windows Snipping Tool (Win + Shift + S)
      if (e.shiftKey && e.metaKey && e.key.toLowerCase() === "s") {
         e.preventDefault();
         handleScreenshotAttempt("Windows Snipping Tool");
      }
      // Mac Screenshot (Cmd + Shift + 3, Cmd + Shift + 4, Cmd + Shift + 5)
      if (e.shiftKey && e.metaKey && (e.key === "3" || e.key === "4" || e.key === "5")) {
         e.preventDefault();
         handleScreenshotAttempt("Mac Screenshot Shortcut");
      }
      // Copy/Print
      if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "p" || e.key === "s")) {
        e.preventDefault();
        alert("⚠ Action tracking: Copy/Print/Save is disabled.");
        logActivity("copy_or_print_attempt");
      }
    };

    const handleKeyup = (e) => {
      if (e.key === "PrintScreen") {
        e.preventDefault();
        handleScreenshotAttempt("PrintScreen KeyUp");
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      logActivity("right_click_attempt");
    };

    const handleBlur = () => {
       // When window loses focus, blur the entire document to prevent background snipping tools
       const docArea = document.getElementById('secure-document-area');
       if (docArea) docArea.style.filter = "blur(15px) grayscale(100%) opacity(0.1)";
    };

    const handleFocus = () => {
       const docArea = document.getElementById('secure-document-area');
       if (docArea) docArea.style.filter = "none";
    };

    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("keyup", handleKeyup);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("keyup", handleKeyup);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center text-primary-400">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-400 mb-4"></div>
      <p className="tracking-widest text-sm font-semibold uppercase">Securing Connection...</p>
    </div>
  );

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4">
        <div className="bg-dark-surface border border-dark-border shadow-2xl p-8 flex flex-col items-center rounded-2xl max-w-md text-center relative overflow-hidden">
          {errorType === "revoked" && (
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
          )}
          {errorType === "expired" && (
            <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
          )}
          
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-lg ${
            errorType === "revoked" ? "bg-red-500/10 text-red-500 shadow-red-500/20" : 
            errorType === "expired" ? "bg-orange-500/10 text-orange-400 shadow-orange-500/20" : 
            "bg-gray-800 text-gray-400"
          }`}>
            {errorType === "revoked" ? (
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            ) : errorType === "expired" ? (
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            {errorType === "revoked" ? "Access Revoked" : 
             errorType === "expired" ? "Link Expired" : "Access Denied"}
          </h2>
          <p className="text-gray-400 mb-6">
            {errorMessage}
          </p>
          
          {errorType === "revoked" && (
             <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-xs tracking-wide text-red-400 font-medium">
               The document owner manually revoked the permissions for this specific share explicitly. You can no longer view the contents.
             </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4 selection:bg-transparent relative select-none font-sans">
      {/* Alert Banner */}
      <div className="fixed top-0 left-0 w-full bg-red-900/90 text-red-100 px-4 py-2 text-center text-sm font-medium z-50 flex items-center justify-center gap-2 backdrop-blur-sm border-b border-red-800">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Confidential Document. Screenshots are tracked and prohibited. Activity logged.
      </div>

      <div className="max-w-4xl w-full bg-dark-surface border border-dark-border rounded-xl shadow-[0_10px_40px_rgba(79,41,144,0.15)] overflow-hidden mt-10">
        {/* Header */}
        <div className="bg-dark-bg px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-dark-border gap-2">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">ShieldDocs Protected View</h2>
            <p className="text-xs text-primary-400 mt-1 uppercase tracking-wider font-semibold">Shared exclusively with: {share?.receiver_name}</p>
          </div>
          {share?.settings?.oneTimeView && (
             <div className="bg-orange-500/20 border border-orange-500/50 text-orange-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest animate-pulse">
                One-Time View Active
             </div>
          )}
        </div>

        {/* Document Area */}
        <div id="secure-document-area" className="p-4 sm:p-8 bg-brand-950 flex justify-center items-center min-h-[60vh] relative overflow-hidden transition-all duration-200">
          {/* Dynamic Watermark Overlay */}
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden flex flex-col justify-center gap-16 rotate-[-25deg] opacity-[0.04]">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="whitespace-nowrap text-3xl sm:text-4xl font-black text-primary-300 tracking-widest leading-loose">
                [CONFIDENTIAL] EXCLUSIVE TO {share?.receiver_name?.toUpperCase()} • {new Date(share?.created_at || Date.now()).toLocaleDateString()} • SHIELDDOCS •
              </div>
            ))}
          </div>
          
          {/* Document Content */}
          <div className="relative z-0 shadow-2xl border border-gray-800 bg-white rounded-md overflow-hidden p-2 flex justify-center max-w-full">
            {share?.settings?.file_type?.includes('pdf') ? (
              <div className="relative w-full h-[600px] min-w-[300px] sm:min-w-[500px]">
                {/* Overlay to prevent interaction/right click on iframe */}
                <div className="absolute inset-0 z-20" onContextMenu={(e) => e.preventDefault()}></div>
                <iframe src={`${share?.settings?.file_url}#toolbar=0`} className="w-full h-full border-0 pointer-events-none" title="Secure PDF View"/>
              </div>
            ) : (
               <div className="relative w-full">
                 <img
                   src={share?.settings?.file_url}
                   alt="Secured Document"
                   crossOrigin="anonymous"
                   className="max-w-full h-auto object-contain max-h-[75vh] select-none pointer-events-none"
                   style={{ WebkitUserDrag: 'none' }}
                   onError={(e) => { e.target.src = "https://placehold.co/600x400/1e293b/ffffff?text=Document+Not+Found" }}
                   onContextMenu={(e) => e.preventDefault()}
                 />
                 
                 {/* Render Masked Areas */}
                 {share?.settings?.maskedAreas && share.settings.maskedAreas.map((mask, idx) => (
                    <div 
                      key={idx}
                      className="absolute bg-gray-900 border-2 border-dashed border-gray-600 z-10 flex justify-center items-center overflow-hidden"
                      style={{
                        left: `${mask.x}%`, top: `${mask.y}%`, 
                        width: `${mask.w}%`, height: `${mask.h}%`
                      }}
                    >
                      <span className="text-gray-500 font-mono text-[10px] sm:text-xs font-black tracking-[0.3em] uppercase opacity-50">REDACTED</span>
                    </div>
                 ))}
               </div>
            )}
          </div>
        </div>
      </div>
      
      <p className="text-gray-500 text-xs mt-8">Secured by ShieldDocs Architecture</p>
    </div>
  );
}