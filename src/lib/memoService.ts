import { supabase } from './supabase';

export interface DailyMemo {
  id: string;
  user_id: string;
  target_date: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const getMemoByDate = async (userId: string, dateStr: string) => {
  try {
    const { data, error } = await supabase
      .from('daily_memos')
      .select('*')
      .eq('user_id', userId)
      .eq('target_date', dateStr)
      .single();

    // 데이터가 없으면 error.code가 'PGRST116'으로 떨어집니다. (단일 행 조회 실패)
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching memo:', error);
      return { data: null, error };
    }

    return { data: data as DailyMemo | null, error: null };
  } catch (error) {
    console.error('Error in getMemoByDate:', error);
    return { data: null, error };
  }
};

export const upsertMemo = async (userId: string, dateStr: string, content: string) => {
  try {
    // Check if exists
    const { data: existing } = await getMemoByDate(userId, dateStr);

    if (existing) {
      // Update
      const { data, error } = await supabase
        .from('daily_memos')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } else {
      // Insert
      const { data, error } = await supabase
        .from('daily_memos')
        .insert({
          user_id: userId,
          target_date: dateStr,
          content
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    }
  } catch (error) {
    console.error('Error in upsertMemo:', error);
    return { data: null, error };
  }
};
