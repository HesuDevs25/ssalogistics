import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
// In a real application, you would use environment variables for these values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase

/**
 * Authentication functions
 */

export async function signUp({ email, password, metadata }) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  })
}

export async function signIn({ email, password }) {
  return supabase.auth.signInWithPassword({
    email,
    password
  })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function resetPassword(email) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
}

/**
 * Document management functions
 */

export async function uploadDocument(file, userId, metadata) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}.${fileExt}`
  
  // Upload file to Supabase Storage
  const { data: fileData, error: fileError } = await supabase.storage
    .from('documents')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })
  
  if (fileError) {
    throw fileError
  }
  
  // Save the document metadata to the documents table
  const { data, error } = await supabase
    .from('documents')
    .insert([
      {
        user_id: userId,
        file_path: fileName,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        status: 'pending',
        ...metadata
      }
    ])
    .select()
    
  if (error) {
    throw error
  }
  
  return data
}

export async function getUserDocuments(userId) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    throw error
  }
  
  return data
}

export async function getDocumentById(documentId, userId) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .eq('user_id', userId)
    .single()
  
  if (error) {
    throw error
  }
  
  return data
}

export async function updateDocumentStatus(documentId, status, notes) {
  const { data, error } = await supabase
    .from('documents')
    .update({ 
      status,
      notes,
      updated_at: new Date()
    })
    .eq('id', documentId)
    .select()
  
  if (error) {
    throw error
  }
  
  return data
}

/**
 * Vehicle tracking functions
 */

export async function getVehiclesByUserId(userId) {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    throw error
  }
  
  return data
}

export async function getVehicleById(vehicleId, userId) {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', vehicleId)
    .eq('user_id', userId)
    .single()
  
  if (error) {
    throw error
  }
  
  return data
}

export async function updateVehicleStatus(vehicleId, status, location, notes) {
  const { data, error } = await supabase
    .from('vehicles')
    .update({ 
      status,
      current_location: location,
      notes,
      updated_at: new Date()
    })
    .eq('id', vehicleId)
    .select()
  
  if (error) {
    throw error
  }
  
  return data
} 