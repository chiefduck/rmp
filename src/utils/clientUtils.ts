import { supabase } from '../lib/supabase'

/**
 * Delete a client and all associated notes
 * @param clientId - The UUID of the client to delete
 * @returns Promise<boolean> - true if successful, false if failed
 */
export const deleteClient = async (clientId: string): Promise<boolean> => {
  try {
    // Delete the client (CASCADE will automatically delete related notes)
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)

    if (error) {
      console.error('Error deleting client:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Unexpected error deleting client:', error)
    return false
  }
}

/**
 * Soft delete alternative - mark client as deleted instead of removing
 * @param clientId - The UUID of the client to soft delete
 * @returns Promise<boolean> - true if successful, false if failed
 */
export const softDeleteClient = async (clientId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('clients')
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)

    if (error) {
      console.error('Error soft deleting client:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Unexpected error soft deleting client:', error)
    return false
  }
}