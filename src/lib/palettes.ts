import { supabase } from './supabase';
import { Color } from '../types';

export const savePalette = async (name: string, colors: Color[], userId: string) => {
  try {
    const { data, error } = await supabase
      .from('palettes').insert([
        {
          name,
          colors,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving palette:', error.message);
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error saving palette:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

export const getUserPalettes = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('palettes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching palettes:', error.message);
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching palettes:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

export const updatePalette = async (id: string, updates: { name?: string; colors?: Color[] }) => {
  try {
    const { error } = await supabase
      .from('palettes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating palette:', error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error updating palette:', error);
    throw error;
  }
};

export const deletePalette = async (id: string) => {
  try {
    const { error } = await supabase
      .from('palettes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting palette:', error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error deleting palette:', error);
    throw error;
  }
};