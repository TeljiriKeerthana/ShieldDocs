import { supabase } from "./supabaseClient"

export const createShare = async (documentId, receiverName, settings) => {
  const sessionData = localStorage.getItem("shielddocs_session");
  if (!sessionData) throw new Error("User not authenticated");
  
  const userData = JSON.parse(sessionData);

  // Fetch document URL so the public share can read it from settings
  const { data: docData, error: docError } = await supabase
    .from("documents")
    .select("file_url")
    .eq("id", documentId)
    .single()
    
  if (docError) throw new Error("Document not found: " + docError.message)
  
  const finalSettings = {
    ...settings,
    file_url: docData.file_url
  }

  const { data, error } = await supabase
    .from("shares")
    .insert([
      {
        document_id: documentId,
        owner_id: userData.user.id,
        receiver_name: receiverName,
        settings: finalSettings
      }
    ])
    .select()

  if (error) {
    console.error("Create Share Error:", error)
    throw new Error("Supabase RLS is blocking the insert! Please run the SQL command to disable RLS for the hackathon: ALTER TABLE shares DISABLE ROW LEVEL SECURITY;")
  }

  return data[0].id
}