import { supabase } from "./supabaseClient"

export const uploadDocument = async (file) => {
  const sessionData = localStorage.getItem("shielddocs_session");
  if (!sessionData) throw new Error("User not authenticated");
  
  const userData = JSON.parse(sessionData);
  const userId = userData.user.id;
  const fileName = `${userId}-${Date.now()}-${file.name}`

  const { data, error } = await supabase.storage
    .from("documents")
    .upload(fileName, file)

  if (error) {
    console.error("Storage Upload Error:", error)
    throw new Error("Supabase Storage is blocking the upload. Ensure your 'documents' bucket is PUBLIC and has 'Insert' policy allowed for everyone without condition.")
  }

  const { data: urlData } = supabase.storage
    .from("documents")
    .getPublicUrl(fileName)

  const { error: dbError } = await supabase
    .from("documents")
    .insert([
      {
        user_id: userId,
        title: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type
      }
    ])

  if (dbError) {
    console.error("Database Insert Error:", dbError)
    throw new Error("Supabase RLS is blocking the insert! Please run the SQL command to disable RLS for the hackathon: ALTER TABLE documents DISABLE ROW LEVEL SECURITY;")
  }

  return urlData.publicUrl
}

export const getDocuments = async () => {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Fetch Documents Error:", error)
    return []
  }

  return data
}