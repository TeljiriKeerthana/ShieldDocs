import { useState, useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"
import { createShare } from "../services/shareService"
import { getDocuments } from "../services/documentService"
import { QRCodeSVG } from 'qrcode.react'
import MaskEditor from "../components/MaskEditor";
import { scanDocument } from "../services/aiScanner"
export default function CreateShare(){
  const location = useLocation()
  const [docId, setDocId] = useState("")
  const [receiver, setReceiver] = useState("")
  const [link, setLink] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  
  const [format, setFormat] = useState("link") // "link" or "qr"
  const [receiverScore, setReceiverScore] = useState(null)
  
  // Data Masking State
  const [isMasking, setIsMasking] = useState(false)
  const [maskAreas, setMaskAreas] = useState([])
  const previewRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })

  const [settings, setSettings] = useState({
    antiScreenshot: true,
    preventDownload: true,
    oneTimeView: false,
    expiryType: "unlimited", // "unlimited" | "specific"
    expiryHours: 24,
    format: "auto"
  });

  const [docs, setDocs] = useState([]);

  useEffect(() => {
    const fetchDocs = async () => {
      const data = await getDocuments();
      if(data) setDocs(data);
    }
    fetchDocs();
    
    const params = new URLSearchParams(location.search)
    const docParam = params.get('doc')
    if (docParam) {
      setDocId(docParam)
    }
  }, [location])

  // Mock checking Trust Score when receiver name is entered
  useEffect(() => {
    if (receiver.length > 2) {
      setReceiverScore(100);
    } else {
      setReceiverScore(null);
    }
  }, [receiver])

  const toggleSetting = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  const handleSettingChange = (key, value) => setSettings(prev => ({...prev, [key]: value}));

  const generate = async () => {
    if (!docId || !receiver) return alert("Please fill all fields")
    setIsGenerating(true)
    try {
      // In a real app we would save maskAreas array into settings
      const finalSettings = { ...settings, maskedAreas: maskAreas }
      const shareId = await createShare(docId, receiver, finalSettings)
      const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin
      const url = baseUrl + "/view/" + shareId
      setLink(url)
    } catch (err) {
      console.error(err)
      alert(err.message || "Error generating share object")
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(link)
    alert("Copied to clipboard!")
  }

  // Handle Drag to Mask Document Preview
  const handleMouseDown = (e) => {
    if (!previewRef.current || !isMasking) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setStartPos({ x, y });
    setIsDrawing(true);
  }

  const handleMouseUp = (e) => {
    if (!isDrawing || !isMasking) return;
    setIsDrawing(false);
    const rect = previewRef.current.getBoundingClientRect();
    const endX = ((e.clientX - rect.left) / rect.width) * 100;
    const endY = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newMask = {
      x: Math.min(startPos.x, endX),
      y: Math.min(startPos.y, endY),
      w: Math.abs(endX - startPos.x),
      h: Math.abs(endY - startPos.y)
    }
    
    if (newMask.w > 2 && newMask.h > 2) { // Only add if it's a measurable box
      setMaskAreas([...maskAreas, newMask]);
    }
  }
  const runAIScan = async () => {

  const selectedDoc = docs.find(d => d.id === docId)
  if(!selectedDoc){
    alert("Select a document first")
    return
  }

  const result = await scanDocument(selectedDoc.file_url)

  console.log("AI detection:", result)

  const aiMasks = []

  if(result.aadhaar){
    aiMasks.push({ x:30, y:30, w:20, h:8 })
  }

  if(result.phones){
    aiMasks.push({ x:40, y:50, w:25, h:8 })
  }

  if(result.dob){
    aiMasks.push({ x:50, y:60, w:20, h:8 })
  }

  setMaskAreas([...maskAreas, ...aiMasks])

}

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Create Secure Share</h1>
        <p className="text-gray-400">Configure robust access controls, apply data masking, and generate links.</p>
      </div>

      <div className="bg-dark-surface border border-dark-border rounded-2xl shadow-xl overflow-hidden text-left">
        <div className="p-6 md:p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Basic Details */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Select Document</label>
                <select
                  value={docId}
                  onChange={(e) => setDocId(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors shadow-inner"
                >
                  <option value="" disabled>Choose a document from Vault</option>
                  {docs.map(d => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                  {/* Fallback mock if docs array is empty from DB fetch delay */}
                  {docs.length === 0 && docId && <option value={docId}>Document ID: {docId}</option>}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Receiver Name / Identifier</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Acme Corp Compliance"
                    value={receiver}
                    onChange={(e) => setReceiver(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 pr-24 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors shadow-inner"
                  />
                  {receiverScore !== null && (
                    <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-2.5 py-1 rounded-md ${
                      receiverScore >= 70 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-red-500/15 text-red-500 border border-red-500/20'
                    }`}>
                      Score: {receiverScore}/100
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500 font-medium">Recipient name will be visibly watermarked over document contents.</p>
              </div>

              {/* Security Controls */}
              <div className="pt-4 border-t border-dark-border">
                <h3 className="text-base font-bold text-gray-200 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Access Constraints
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center p-3.5 border border-dark-border rounded-xl bg-dark-bg cursor-pointer hover:border-brand-500/50 transition-colors">
                    <input type="checkbox" checked={settings.antiScreenshot} onChange={() => toggleSetting('antiScreenshot')} className="w-4 h-4 text-brand-600 rounded border-gray-600 focus:ring-brand-500 bg-dark-surface" />
                    <div className="ml-3 flex-1">
                      <span className="block text-sm font-medium text-white">Strict Anti-Screenshot</span>
                      <span className="block text-xs text-gray-400">Blocks screen capture combinations.</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-3.5 border border-dark-border rounded-xl bg-dark-bg cursor-pointer hover:border-brand-500/50 transition-colors">
                    <input type="checkbox" checked={settings.preventDownload} onChange={() => toggleSetting('preventDownload')} className="w-4 h-4 text-brand-600 rounded border-gray-600 focus:ring-brand-500 bg-dark-surface" />
                    <div className="ml-3 flex-1">
                      <span className="block text-sm font-medium text-white">Prevent Downloads / Copy Data</span>
                      <span className="block text-xs text-gray-400">Restricts right-click, highlighting, and saving.</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-3.5 border border-dark-border rounded-xl bg-dark-bg cursor-pointer hover:border-brand-500/50 transition-colors">
                    <input type="checkbox" checked={settings.oneTimeView} onChange={() => toggleSetting('oneTimeView')} className="w-4 h-4 text-brand-600 rounded border-gray-600 focus:ring-brand-500 bg-dark-surface" />
                    <div className="ml-3 flex-1">
                      <span className="block text-sm font-medium text-white">One-Time View Sequence</span>
                      <span className="block text-xs text-gray-400">Link self-destructs instantly after first open.</span>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="pt-2">
                <label className="block text-sm font-semibold text-gray-300 mb-2">Link Expiry Configuration</label>
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center">
                    <input type="radio" checked={settings.expiryType === 'unlimited'} onChange={() => handleSettingChange('expiryType', 'unlimited')} className="text-brand-500 focus:ring-brand-500 bg-dark-bg border-gray-600" />
                    <span className="ml-2 text-sm text-gray-300">Unlimited Time</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" checked={settings.expiryType === 'specific'} onChange={() => handleSettingChange('expiryType', 'specific')} className="text-brand-500 focus:ring-brand-500 bg-dark-bg border-gray-600" />
                    <span className="ml-2 text-sm text-gray-300">Specific Duration</span>
                  </label>
                </div>
                {settings.expiryType === 'specific' && (
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      min="1" max="720"
                      value={settings.expiryHours} 
                      onChange={(e) => handleSettingChange('expiryHours', e.target.value)} 
                      className="w-24 bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-500" 
                    />
                    <span className="text-sm text-gray-400">Hours until expiration</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Data Masking & Sharing */}
            <div className="space-y-6 flex flex-col">
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-300">Intelligent Data Masking</label>
                  <button 
                    onClick={() => setIsMasking(!isMasking)}
                    className={`text-xs px-3 py-1.5 rounded-md font-bold transition-colors border ${isMasking ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-dark-border text-gray-300 border-dark-border hover:bg-gray-700'}`}
                  >
                    {isMasking ? "Disable Masking Tool" : "Enable Masking Tool"}
                  </button>
                </div>
                
                <div className="flex-1 min-h-[250px] bg-white rounded-xl overflow-hidden relative border-2 border-dashed border-dark-border flex justify-center items-center shadow-inner">
                  {!docId ? (
                     <p className="text-gray-400 text-sm font-medium">Select a document to preview & mask.</p>
                  ) : (
                    <>
                      {/* Document Actual Preview */}
                      <div 
                        ref={previewRef}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        className={`absolute inset-0 m-4 border-2 ${isMasking ? 'cursor-crosshair border-orange-500/50' : 'border-transparent'} bg-transparent flex justify-center items-center overflow-hidden shadow-md`}
                      >
                         {docs.find(d => d.id === docId)?.file_type?.includes('pdf') ? (
                           <iframe src={`${docs.find(d => d.id === docId)?.file_url}#toolbar=0`} className="w-full h-full pointer-events-none" />
                         ) : (
                           <img src={docs.find(d => d.id === docId)?.file_url} className="max-w-full max-h-full object-contain pointer-events-none select-none" alt="Document Preview" />
                         )}
                         
                         {/* Render Drawn Masks */}
                         {maskAreas.map((mask, idx) => (
                           <div 
                             key={idx}
                             className="absolute bg-black backdrop-blur-sm border border-gray-700 shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-20 flex justify-center items-center overflow-hidden"
                             style={{
                               left: `${mask.x}%`, top: `${mask.y}%`, 
                               width: `${mask.w}%`, height: `${mask.h}%`
                             }}
                           >
                             <span className="text-red-500 opacity-60 font-mono text-[8px] font-bold tracking-widest uppercase">REDACTED</span>
                           </div>
                         ))}
                      </div>
                      
                      {isMasking && maskAreas.length === 0 && (
                        <div className="absolute top-2 right-2 px-3 py-1 bg-gray-900/80 text-orange-400 text-xs font-bold rounded shadow-lg z-30 flex items-center gap-1.5 backdrop-blur-md border border-orange-500/30">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                          </svg>
                          Drag to highlight & redact sensitive areas.
                        </div>
                      )}

                      {maskAreas.length > 0 && (
                         <div className="absolute top-2 right-2 flex gap-2 z-30">
                           <button 
                             onClick={() => setMaskAreas([])}
                             className="px-3 py-1.5 bg-gray-900/80 text-gray-300 text-xs font-bold rounded border border-gray-600 shadow-md hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 transition-colors backdrop-blur-md"
                           >
                             Clear All Masks
                           </button>
                         </div>
                      )}
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>

          <div className="pt-8 border-t border-dark-border">
            <h3 className="text-base font-bold text-gray-200 mb-4 text-center">Output Generation Format</h3>
            <div className="flex justify-center gap-4 mb-6">
               <button
                  onClick={() => setFormat("link")}
                  className={`px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-md ${format === 'link' ? 'bg-brand-600 text-white shadow-brand-500/30 scale-105' : 'bg-dark-bg border border-dark-border text-gray-400 hover:border-brand-500/50 hover:text-white'}`}
                >Secure Web Link</button>
                <button
                  onClick={() => setFormat("qr")}
                  className={`px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-md ${format === 'qr' ? 'bg-brand-600 text-white shadow-brand-500/30 scale-105' : 'bg-dark-bg border border-dark-border text-gray-400 hover:border-brand-500/50 hover:text-white'}`}
                >Scannable QR Code</button>
            </div>

            <button 
              onClick={generate}
              disabled={isGenerating || !docId || !receiver}
              className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-brand-500/20 text-base font-bold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg focus:ring-emerald-500 transition-all ${isGenerating || !docId || !receiver ? 'opacity-50 cursor-not-allowed shadow-none' : ''}`}
            >
              {isGenerating ? 'Generating Secure Artifacts...' : 'Generate & Lockdown Share'}
            </button>
          </div>

          {link && (
            <div className="mt-8 p-6 rounded-xl bg-brand-900/10 border border-brand-500/30 flex flex-col items-center">
              <h3 className="text-lg font-bold text-brand-300 mb-4 animate-pulse">Secure Link Generated & Ready!</h3>
              
              {format === 'link' && (
                <div className="flex rounded-lg shadow-md w-full max-w-xl">
                  <input
                    type="text"
                    readOnly
                    value={link}
                    className="flex-1 min-w-0 block w-full px-4 py-3 rounded-none rounded-l-lg text-sm border-dark-border bg-dark-bg text-gray-300 focus:ring-brand-500 focus:border-brand-500 shadow-inner"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="inline-flex items-center px-6 py-3 border border-l-0 border-dark-border rounded-r-lg bg-brand-600 text-sm font-bold text-white hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                  >
                    Copy Path
                  </button>
                </div>
              )}

              {format === 'qr' && (
                <div className="bg-white p-4 rounded-xl shadow-lg mb-4 pointer-events-none select-none">
                   <QRCodeSVG value={link} size={200} level={"H"} />
                </div>
              )}

              {/* Social Share Ribbon */}
              <div className="mt-8 text-center w-full">
                 <p className="text-sm font-semibold text-gray-400 mb-4">Quick Share via Trusted Networks:</p>
                 <div className="flex justify-center flex-wrap gap-4">
                    <a href={`https://wa.me/?text=Here%20is%20your%20secure%20ShieldDocs%20document%3A%20${encodeURIComponent(link)}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg shadow-lg font-semibold text-sm transition-transform hover:scale-105">
                       WhatsApp
                    </a>
                    <a href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=Secure%20Document`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-lg shadow-lg font-semibold text-sm transition-transform hover:scale-105">
                       Telegram
                    </a>
                    <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-[#0077b5] hover:bg-[#006097] text-white rounded-lg shadow-lg font-semibold text-sm transition-transform hover:scale-105">
                       LinkedIn
                    </a>
                    <button onClick={() => { copyToClipboard(); alert("Link copied. Open Instagram to paste in DMs."); }} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white hover:opacity-90 rounded-lg shadow-lg font-semibold text-sm transition-transform hover:scale-105">
                       Instagram DM
                    </button>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}