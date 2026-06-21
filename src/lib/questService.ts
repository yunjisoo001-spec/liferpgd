import { supabase } from '@/lib/supabase';
import { Quest } from '@/types/quest';
import { getProfile, getCharacterStats } from '@/lib/characterService';

/**
 * 퀘스트 생성
 */
export async function createQuest(userId: string, questData: Partial<Quest>) {
  try {
    const { data, error } = await supabase
      .from('quests')
      .insert([
        {
          user_id: userId,
          title: questData.title,
          description: questData.description,
          xp_reward: questData.xp,
          stat_type: questData.stat,
          stat_bonus: questData.statBonus,
          quest_date: questData.date,
          status: questData.status || 'pending',
          completed_at: questData.completed ? new Date().toISOString() : null,
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error in createQuest:', error);
    return { data: null, error };
  }
}

/**
 * 특정 날짜의 퀘스트 조회
 */
export async function getQuestsByDate(userId: string, date: string) {
  try {
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('user_id', userId)
      .eq('quest_date', date)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    // DB 데이터를 프론트엔드 Quest 타입에 맞게 매핑
    const mappedQuests: Quest[] = data.map(q => ({
      id: q.id,
      title: q.title,
      description: q.description || '',
      xp: q.xp_reward || 0,
      stat: q.stat_type as any,
      statBonus: q.stat_bonus || 0,
      date: q.quest_date,
      completed: q.status === 'completed',
      status: q.status as any,
      createdAt: new Date(q.created_at)
    }));

    return { data: mappedQuests, error: null };
  } catch (error: any) {
    console.error('Error in getQuestsByDate:', error);
    return { data: null, error };
  }
}

/**
 * 특정 월의 퀘스트 전체 조회 (캘린더용)
 */
export async function getQuestsByMonth(userId: string, year: number, month: number) {
  try {
    // 월 포맷팅 (예: 2026-06)
    const formattedMonth = `${year}-${String(month).padStart(2, '0')}`;
    const startDate = `${formattedMonth}-01`;
    // 다음달 1일 계산하여 이전까지
    const endDate = month === 12 
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, '0')}-01`;

    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('user_id', userId)
      .gte('quest_date', startDate)
      .lt('quest_date', endDate);

    if (error) throw error;

    const mappedQuests: Quest[] = data.map(q => ({
      id: q.id,
      title: q.title,
      description: q.description || '',
      xp: q.xp_reward || 0,
      stat: q.stat_type as any,
      statBonus: q.stat_bonus || 0,
      date: q.quest_date,
      completed: q.status === 'completed',
      status: q.status as any,
      createdAt: new Date(q.created_at)
    }));

    return { data: mappedQuests, error: null };
  } catch (error: any) {
    console.error('Error in getQuestsByMonth:', error);
    return { data: null, error };
  }
}

/**
 * 퀘스트 상태 변경
 */
export async function updateQuestStatus(questId: string, status: string) {
  try {
    const isCompleted = status === 'completed';
    const updatePayload = {
      status,
      completed_at: isCompleted ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from('quests')
      .update(updatePayload)
      .eq('id', questId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error in updateQuestStatus:', error);
    return { data: null, error };
  }
}

/**
 * 퀘스트 완료 처리 및 경험치/스탯 증가
 */
export async function completeQuest(questId: string, userId: string) {
  try {
    // 1. 퀘스트 상태 먼저 가져오기 (보상 확인)
    const { data: quest, error: fetchError } = await supabase
      .from('quests')
      .select('*')
      .eq('id', questId)
      .single();

    if (fetchError) throw fetchError;
    if (quest.status === 'completed') {
      throw new Error('이미 완료된 퀘스트입니다.');
    }

    // 2. 퀘스트 상태 변경
    const { error: updateQuestError } = await supabase
      .from('quests')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString() 
      })
      .eq('id', questId);

    if (updateQuestError) throw updateQuestError;

    // 3. 현재 스탯 가져오기 (Auto-healing 적용된 함수 사용)
    const { data: currentStats, error: statsError } = await getCharacterStats(userId);
    if (statsError || !currentStats) throw new Error('Failed to load or heal character stats');

    // 4. 스탯 업데이트 (해당 스탯 타입에 맞춰)
    if (quest.stat_type && quest.stat_bonus > 0) {
      const statColumn = `${quest.stat_type.toLowerCase()}_stat`; // ex: int_stat
      await supabase
        .from('character_stats')
        .update({
          [statColumn]: (currentStats[statColumn] || 0) + quest.stat_bonus
        })
        .eq('user_id', userId);
    }

    // 5. 경험치 및 레벨 업데이트
    if (quest.xp_reward > 0) {
      // (Auto-healing 적용된 함수 사용)
      const { data: profile, error: profileError } = await getProfile(userId);
      if (profileError || !profile) throw new Error('Failed to load or heal profile');

      let newXp = (profile.xp || 0) + quest.xp_reward;
      let newLevel = profile.level || 1;
      let newMaxXp = profile.max_xp || 100;

      // 레벨업 처리 (경험치가 최대치를 초과할 경우)
      while (newXp >= newMaxXp) {
        newXp -= newMaxXp;
        newLevel += 1;
        newMaxXp = Math.floor(newMaxXp * 1.5); // 다음 레벨 요구 경험치 1.5배 증가
      }

      await supabase
        .from('profiles')
        .update({
          xp: newXp,
          level: newLevel,
          max_xp: newMaxXp
        })
        .eq('id', userId);
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error in completeQuest:', error);
    return { success: false, error };
  }
}

/**
 * 퀘스트 삭제
 */
export async function deleteQuest(questId: string) {
  try {
    const { error } = await supabase
      .from('quests')
      .delete()
      .eq('id', questId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error in deleteQuest:', error);
    return { success: false, error };
  }
}
