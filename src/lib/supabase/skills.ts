import { supabase } from './client';
import { getProfile, updateProfile } from './profile';

/**
 * Get all skills for a user
 */
export async function getUserSkills(userId: string): Promise<string[]> {
  const profile = await getProfile(userId);
  
  if (!profile || !profile.skills) {
    return [];
  }

  // Return sorted skills
  return [...profile.skills].sort((a, b) => a.localeCompare(b));
}

/**
 * Get unique skill names for autocomplete from all users
 */
export async function getUniqueSkills(searchTerm: string = ''): Promise<Array<{ skill_name: string; usage_count: number }>> {
  // Fetch all profiles with skills
  const { data, error } = await supabase
    .from('profiles')
    .select('skills')
    .not('skills', 'is', null);

  if (error) {
    console.error('Error fetching unique skills:', error);
    return [];
  }

  // Aggregate skills and count usage
  const skillCounts = new Map<string, number>();
  
  data?.forEach((profile) => {
    if (profile.skills && Array.isArray(profile.skills)) {
      profile.skills.forEach((skill: string) => {
        const lowerSkill = skill.toLowerCase();
        if (!searchTerm || lowerSkill.includes(searchTerm.toLowerCase())) {
          skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
        }
      });
    }
  });

  // Convert to array and sort by usage count
  return Array.from(skillCounts.entries())
    .map(([skill_name, usage_count]) => ({ skill_name, usage_count }))
    .sort((a, b) => b.usage_count - a.usage_count || a.skill_name.localeCompare(b.skill_name))
    .slice(0, 20);
}

/**
 * Add a skill to a user's profile
 */
export async function addSkill(
  userId: string,
  skillName: string
): Promise<{ data: string[] | null; error: any }> {
  // Verify the authenticated user matches the userId
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  // Authorization check: user can only add their own skills
  if (user.id !== userId) {
    const unauthorizedError = new Error('Unauthorized: You can only add your own skills');
    console.error('Authorization failed:', { authenticatedUserId: user.id, requestedUserId: userId });
    return { data: null, error: unauthorizedError };
  }

  // Get current skills
  const currentSkills = await getUserSkills(userId);
  
  // Check for duplicates (case-insensitive)
  if (currentSkills.some(s => s.toLowerCase() === skillName.toLowerCase())) {
    return { data: null, error: new Error('Skill already exists') };
  }

  // Add new skill
  const updatedSkills = [...currentSkills, skillName].sort((a, b) => a.localeCompare(b));

  // Update profile
  const { data: profile, error } = await updateProfile(userId, {
    skills: updatedSkills,
  });

  if (error) {
    console.error('Error adding skill:', error);
    return { data: null, error };
  }

  return { data: updatedSkills, error: null };
}

/**
 * Remove a skill from a user's profile
 */
export async function removeSkill(
  userId: string,
  skillName: string
): Promise<{ success: boolean; error: any }> {
  // Verify the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { success: false, error: authError || new Error('Not authenticated') };
  }

  // Authorization check: user can only remove their own skills
  if (user.id !== userId) {
    const unauthorizedError = new Error('Unauthorized: You can only remove your own skills');
    console.error('Authorization failed:', { authenticatedUserId: user.id, requestedUserId: userId });
    return { success: false, error: unauthorizedError };
  }

  // Get current skills
  const currentSkills = await getUserSkills(userId);
  
  // Remove the skill (case-sensitive match)
  const updatedSkills = currentSkills.filter(s => s !== skillName);

  // Update profile
  const { error } = await updateProfile(userId, {
    skills: updatedSkills,
  });

  if (error) {
    console.error('Error removing skill:', error);
    return { success: false, error };
  }

  return { success: true, error: null };
}
