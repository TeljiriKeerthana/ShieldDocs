import { useEffect, useState, useRef } from "react"
import UploadBox from "../components/Uploadbox"
import { getDocuments } from "../services/documentService"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../services/supabaseClient"

export default function Vault(){
  const [docs,setDocs] = useState([])
  const [recentAlerts, setRecentAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const docsRef = useRef(null)
  const navigate = useNavigate()

  useEffect(()=>{
    loadDocs()
  },[])

  const loadDocs = async ()=>{
    setLoading(true)
    try {
      const data = await getDocuments() || []
      setDocs(data)
      
      const sessionData = localStorage.getItem("shielddocs_session");
      if (sessionData) {
        const userData = JSON.parse(sessionData);
        const { data: myShares } = await supabase.from('shares').select('id, document_id').eq('owner_id', userData.user.id);
        if (myShares && myShares.length > 0) {
          const { data: alerts } = await supabase.from('share_activities')
            .select('*')
            .in('share_id', myShares.map(s => s.id))
            .neq('action_type', 'view')
            .order('created_at', { ascending: false })
            .limit(3);
          setRecentAlerts(alerts || []);
        }
      }

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const scrollToDocs = () => {
    docsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return(
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Welcome back. Manage your secure documents and monitor sharing activity.</p>
      </div>



      <div className="bg-[#112240] border border-[#233554] rounded-xl p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-4">Upload New Document</h2>
        <UploadBox onUploadSuccess={loadDocs} />
      </div>

      {recentAlerts.length > 0 && (
        <div className="mt-8 bg-red-500/5 border border-red-500/20 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-bold text-red-500">Recent Suspicious Activity</h2>
          </div>
          <div className="space-y-3">
            {recentAlerts.map(alert => (
              <div key={alert.id} className="flex items-center justify-between bg-[#0a192f]/50 border border-red-500/10 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  <div>
                    <p className="text-white text-sm font-medium">Attempted <span className="text-red-400 uppercase">{alert.action_type}</span></p>
                    <p className="text-gray-400 text-xs">{new Date(alert.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <Link to="/activity" className="text-xs bg-[#112240] hover:bg-[#233554] border border-[#233554] px-3 py-1.5 rounded-md text-white transition-colors">
                  Investigate
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 relative" ref={docsRef}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Your Documents Vault</h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-16 bg-[#112240]/50 border border-[#233554] border-dashed rounded-xl">
            <svg className="mx-auto h-12 w-12 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-semibold text-white">No documents</h3>
            <p className="mt-1 text-sm text-gray-400">Get started by uploading a document.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {docs.map(doc=>(
              <div key={doc.id} className="group flex flex-col justify-between bg-[#112240] hover:bg-[#112240]/80 border border-[#233554] hover:border-brand-500/50 rounded-xl p-5 shadow-sm transition-all">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-brand-500/10 rounded-lg text-brand-400 group-hover:bg-brand-500/20 transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-white font-medium truncate" title={doc.title}>{doc.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">Uploaded securely</p>
                  </div>
                </div>
                <div className="mt-6 flex gap-3 w-full">
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="flex-1 text-center px-3 py-2 bg-[#233554] hover:bg-gray-700 text-sm font-medium text-white rounded-lg transition-colors flex items-center justify-center">
                    View
                  </a>
                  <Link to={`/share?doc=${doc.id}`} className="flex-1 text-center px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium rounded-lg shadow shadow-brand-500/20 transition-all">
                    Share
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}