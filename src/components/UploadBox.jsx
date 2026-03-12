import { useState, useRef } from "react"
import { uploadDocument } from "../services/documentService"

export default function UploadBox({ onUploadSuccess }) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const handleUpload = async (file) => {
    if (!file) return
    setIsUploading(true)
    try {
      await uploadDocument(file)
      if (onUploadSuccess) onUploadSuccess()
    } catch (err) {
      console.error(err)
      alert(err.message || "Failed to upload document")
    } finally {
      setIsUploading(false)
    }
  }

  const onChange = (e) => {
    handleUpload(e.target.files[0])
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }
  
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0])
    }
  }

  return (
    <div 
      className={`relative w-full border-2 border-dashed rounded-xl transition-all duration-200 ${
        dragActive 
          ? 'border-brand-500 bg-brand-500/10' 
          : 'border-dark-border bg-dark-bg hover:border-gray-500 hover:bg-dark-surface'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        ref={fileInputRef}
        type="file" 
        className="hidden" 
        onChange={onChange}
        disabled={isUploading}
      />
      
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center cursor-pointer">
        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500 mb-4"></div>
            <p className="text-brand-400 font-medium">Encrypting and Safely Storing...</p>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 bg-dark-border rounded-full flex items-center justify-center mb-3 text-brand-400 group-hover:text-brand-300">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-white font-medium mb-1">Click to upload or drag and drop</p>
            <p className="text-sm text-gray-500">PDF, JPG, PNG or DOCX</p>
          </>
        )}
      </div>
    </div>
  )
}