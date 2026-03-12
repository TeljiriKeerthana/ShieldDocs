import { supabase } from "./supabaseClient"

export const signup = async (email, password) => {

 return await supabase.auth.signUp({
  email,
  password
 })

}

export const login = async (email, password) => {

 return await supabase.auth.signInWithPassword({
  email,
  password
 })

}

export const logout = async () => {

 return await supabase.auth.signOut()

}