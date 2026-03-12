import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { createShare } from "../services/shareService"

export default function CreateShare(){
  const location = useLocation()
  const [docId, setDocId] = useState("")
  const [receiver, setReceiver] = useState("")
  const [link, setLink] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const [format, setFormat] = useState("auto")
  const [receiverScore, setReceiverScore] = useState(null)

  const [settings, setSettings] = useState({
    antiScreenshot: true,
    preventDownload: true,
    expire1Hour: false,
    oneTimeView: false,
    format: "auto"
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const docParam = params.get('doc')
    if (docParam) {
      setDocId(docParam)
    }
  }, [location])

  }, [location])

  // Mock checking Trust Score when receiver name is entered
  useEffect(() => {
    if (receiver.length > 2) {
      // In a real app we'd fetch this from the trust_scores table
      const mockScore = Math.floor(Math.random() * 40) + 60; // Random score 60-100
      setReceiverScore(mockScore);
    } else {
      setReceiverScore(null);
    }
  }, [receiver])

  const toggleSetting = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  const handleFormatChange = (f) => {
    setFormat(f);
    setSettings(prev => ({ ...prev, format: f }));
  }

  const generate = async () => {
    if (!docId || !receiver) return alert("Please fill all fields")
    setIsGenerating(true)
    try {
      const shareId = await createShare(docId, receiver, settings)
      const url = window.location.origin + "/view/" + shareId
      setLink(url)
    } catch (err) {
      console.error(err)
      alert(err.message || "Error generating share link")
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(link)
    alert("Copied to clipboard!")
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Create Secure Share</h1>
        <p className="text-gray-400">Configure access controls and generate a secure link or QR code.</p>
      </div>

      <div className="bg-dark-surface border border-dark-border rounded-xl shadow-xl overflow-hidden text-left">
        <div className="p-6 md:p-8 space-y-6">
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Document ID</label>
              <input
                type="text"
                placeholder="Enter Document ID or select from Vault"
                value={docId}
                onChange={(e) => setDocId(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Receiver Name / Identifier</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow"
                />
                {receiverScore !== null && (
                  <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-2 py-1 rounded-md ${
                    receiverScore >= 90 ? 'bg-emerald-500/10 text-emerald-400' 
                    : receiverScore >= 60 ? 'bg-yellow-500/10 text-yellow-400' 
                    : 'bg-red-500/10 text-red-500'
                  }`}>
                    Trust Score: {receiverScore}/100
                  </div>
                )}
              </div>
              <p className="mt-1.5 text-xs text-gray-500">The recipient's name will be visibly watermarked on the document.</p>
            </div>

            <div className="pt-4">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Share Format</h3>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleFormatChange("auto")}
                  className={`p-2.5 rounded-lg border text-sm font-medium transition-all ${format === 'auto' ? 'bg-brand-500/20 border-brand-500 text-brand-400' : 'bg-dark-bg border-dark-border text-gray-400 hover:border-gray-500'}`}
                >Auto</button>
                <button
                  onClick={() => handleFormatChange("pdf")}
                  className={`p-2.5 rounded-lg border text-sm font-medium transition-all ${format === 'pdf' ? 'bg-brand-500/20 border-brand-500 text-brand-400' : 'bg-dark-bg border-dark-border text-gray-400 hover:border-gray-500'}`}
                >Force PDF</button>
                <button
                  onClick={() => handleFormatChange("image")}
                  className={`p-2.5 rounded-lg border text-sm font-medium transition-all ${format === 'image' ? 'bg-brand-500/20 border-brand-500 text-brand-400' : 'bg-dark-bg border-dark-border text-gray-400 hover:border-gray-500'}`}
                >Force Image</button>
              </div>
            </div>
            
            <div className="pt-2">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Security Controls</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center p-3 border border-dark-border rounded-lg bg-dark-bg cursor-pointer hover:border-gray-500 transition-colors">
                  <input type="checkbox" checked={settings.antiScreenshot} onChange={() => toggleSetting('antiScreenshot')} className="w-4 h-4 text-brand-500 rounded border-gray-600 bg-dark-surface focus:ring-brand-500 focus:ring-offset-dark-bg" />
                  <span className="ml-3 text-sm text-gray-200">Anti-Screenshot Tracking</span>
                </label>
                <label className="flex items-center p-3 border border-dark-border rounded-lg bg-dark-bg cursor-pointer hover:border-gray-500 transition-colors">
                  <input type="checkbox" checked={settings.preventDownload} onChange={() => toggleSetting('preventDownload')} className="w-4 h-4 text-brand-500 rounded border-gray-600 bg-dark-surface focus:ring-brand-500 focus:ring-offset-dark-bg" />
                  <span className="ml-3 text-sm text-gray-200">Prevent Downloads</span>
                </label>
                <label className="flex items-center p-3 border border-dark-border rounded-lg bg-dark-bg cursor-pointer hover:border-gray-500 transition-colors">
                  <input type="checkbox" checked={settings.expire1Hour} onChange={() => toggleSetting('expire1Hour')} className="w-4 h-4 text-brand-500 rounded border-gray-600 bg-dark-surface focus:ring-brand-500 focus:ring-offset-dark-bg" />
                  <span className="ml-3 text-sm text-gray-200">1-Hour Expiry</span>
                </label>
                <label className="flex items-center p-3 border border-dark-border rounded-lg bg-dark-bg cursor-pointer hover:border-gray-500 transition-colors">
                  <input type="checkbox" checked={settings.oneTimeView} onChange={() => toggleSetting('oneTimeView')} className="w-4 h-4 text-brand-500 rounded border-gray-600 bg-dark-surface focus:ring-brand-500 focus:ring-offset-dark-bg" />
                  <span className="ml-3 text-sm text-gray-200">One-Time View</span>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-dark-border">
            <button 
              onClick={generate}
              disabled={isGenerating || !docId || !receiver}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg focus:ring-brand-500 transition-colors ${isGenerating || !docId || !receiver ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isGenerating ? 'Generating...' : 'Generate Secure Share'}
            </button>
          </div>

          {link && (
            <div className="mt-6 p-4 rounded-lg bg-primary-900/20 border border-primary-500/30">
              <h3 className="text-sm font-medium text-primary-300 mb-2">Secure Link Ready</h3>
              <div className="flex rounded-md shadow-sm">
                <input
                  type="text"
                  readOnly
                  value={link}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md text-sm border-dark-border bg-dark-bg text-gray-300 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  onClick={copyToClipboard}
                  className="inline-flex items-center px-4 py-2 border border-l-0 border-dark-border rounded-r-md bg-dark-surface text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}