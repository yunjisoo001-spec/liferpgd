import { supabase } from '@/lib/supabase';
import { StatType } from '@/types/quest';

/**
 * 사용자 능력치 조회
 */
export async function getCharacterStats(userId: string) {
  try {
    const { data, error } = await supabase
      .from('character_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116' && error.details?.includes('0 rows')) {
        const defaultStats = { user_id: userId };
        const { data: newData } = await supabase.from('character_stats').insert([defaultStats]).select().single();
        return { data: newData || defaultStats, error: null };
      }
      
      // 만약 여러 행이 반환되어서 에러가 났다면 (0 rows가 아닌 경우) 첫 번째 행을 강제로 가져옵니다
      if (error.code === 'PGRST116' && !error.details?.includes('0 rows')) {
        const { data: firstRow } = await supabase.from('character_stats').select('*').eq('user_id', userId).limit(1).single();
        if (firstRow) return { data: firstRow, error: null };
      }
      
      throw error;
    }
    return { data, error: null };
  } catch (error: any) {
    console.error('Error in getCharacterStats:', error.message || error);
    return { data: null, error };
  }
}

/**
 * 사용자 프로필 (레벨, 경험치) 조회
 */
export async function getProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 프로필이 없는 경우 (트리거 미작동 등) 기본 프로필 강제 생성 시도
        const defaultProfile = { id: userId, level: 1, xp: 0, max_xp: 100 };
        await supabase.from('profiles').insert([defaultProfile]);
        
        // 능력치도 없으면 기본 생성
        const { data: statsData } = await supabase.from('character_stats').select('id').eq('user_id', userId).single();
        if (!statsData) {
          await supabase.from('character_stats').insert([{ user_id: userId }]);
        }

        return { data: defaultProfile, error: null };
      }
      throw error;
    }
    return { data, error: null };
  } catch (error: any) {
    console.error('Error in getProfile:', error.message || error);
    return { data: null, error };
  }
}

/**
 * 특정 능력치 증가
 */
export async function updateCharacterStat(userId: string, statType: StatType, bonus: number) {
  try {
    const statColumn = `${statType.toLowerCase()}_stat`;

    const { data: currentStats, error: statsError } = await supabase
      .from('character_stats')
      .select(statColumn)
      .eq('user_id', userId)
      .single();

    if (statsError) throw statsError;

    const newValue = ((currentStats as any)[statColumn] || 0) + bonus;

    const { data, error } = await supabase
      .from('character_stats')
      .update({ [statColumn]: newValue })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error in updateCharacterStat:', error);
    return { data: null, error };
  }
}

/**
 * 레벨업 계산 로직
 */
export function calculateLevelUp(currentXp: number, addedXp: number, currentLevel: number, currentMaxXp: number) {
  let newXp = currentXp + addedXp;
  let newLevel = currentLevel;
  let newMaxXp = currentMaxXp;

  while (newXp >= newMaxXp) {
    newXp -= newMaxXp;
    newLevel += 1;
    newMaxXp = newLevel * 100;
  }

  return { newXp, newLevel, newMaxXp };
}

/**
 * 경험치 추가 및 레벨업 처리
 */
export async function addXP(userId: string, xp: number) {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('level, xp, max_xp')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    const { newXp, newLevel, newMaxXp } = calculateLevelUp(
      profile.xp || 0,
      xp,
      profile.level || 1,
      profile.max_xp || 100
    );

    const { data, error } = await supabase
      .from('profiles')
      .update({
        xp: newXp,
        level: newLevel,
        max_xp: newMaxXp
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error in addXP:', error);
    return { data: null, error };
  }
}
