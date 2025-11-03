import { useState, useEffect, useRef } from 'react';
import {
  getUserSkills,
  addSkill,
  removeSkill,
  getUniqueSkills,
} from '@/lib/supabase/skills';
import Button from './Button';

interface SkillsSectionProps {
  userId: string;
  isEditing: boolean;
}

export default function SkillsSection({ userId, isEditing }: SkillsSectionProps) {
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [pendingSkills, setPendingSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ skill_name: string; usage_count: number }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSkills();
  }, [userId]);

  useEffect(() => {
    // Close suggestions when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadSkills = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserSkills(userId);
      setSkills(data);
    } catch (err) {
      console.error('Error loading skills:', err);
      setError('Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async (searchTerm: string) => {
    try {
      const data = await getUniqueSkills(searchTerm);
      // Filter out skills the user already has
      const userSkillNames = new Set(skills.map(s => s.toLowerCase()));
      const filtered = data.filter(s => !userSkillNames.has(s.skill_name.toLowerCase()));
      setSuggestions(filtered);
    } catch (err) {
      console.error('Error loading suggestions:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Check if user typed a comma
    if (value.includes(',')) {
      const parts = value.split(',');
      const completedSkills = parts.slice(0, -1).map(s => s.trim()).filter(s => s.length > 0);
      const remaining = parts[parts.length - 1];
      
      // Add completed skills to pending
      if (completedSkills.length > 0) {
        const newPending = [...pendingSkills, ...completedSkills].filter((skill, index, self) => 
          self.findIndex(s => s.toLowerCase() === skill.toLowerCase()) === index
        );
        setPendingSkills(newPending);
      }
      
      setNewSkillName(remaining);
      setShowSuggestions(false);
      return;
    }
    
    setNewSkillName(value);

    // Clear previous debounce
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    // Show suggestions if there's input
    if (value.trim()) {
      setShowSuggestions(true);
      // Debounce the search
      const timeout = setTimeout(() => {
        loadSuggestions(value);
      }, 300);
      setSearchDebounce(timeout);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleAddSkill = async (skillName?: string) => {
    // Collect all skills to add
    const skillsToAdd: string[] = [];
    
    if (skillName) {
      skillsToAdd.push(skillName);
    } else {
      // Add pending skills and current input
      if (pendingSkills.length > 0) {
        skillsToAdd.push(...pendingSkills);
      }
      if (newSkillName.trim()) {
        skillsToAdd.push(newSkillName.trim());
      }
    }
    
    if (skillsToAdd.length === 0) {
      setError('Please enter a skill name');
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      let currentSkills = [...skills];
      
      // Add each skill one by one
      for (const skillToAdd of skillsToAdd) {
        // Check for duplicates
        if (currentSkills.some(s => s.toLowerCase() === skillToAdd.toLowerCase())) {
          continue;
        }

        const { data, error: createError } = await addSkill(userId, skillToAdd);

        if (createError || !data) {
          console.error('Create error details:', createError);
          throw createError || new Error(`Failed to add skill: ${skillToAdd}`);
        }

        currentSkills = data;
      }

      setSkills(currentSkills);
      setNewSkillName('');
      setPendingSkills([]);
      setIsAddingNew(false);
      setShowSuggestions(false);
    } catch (err) {
      console.error('Error creating skill:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create skill';
      setError(`Failed to create skill: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSkill = async (skillName: string) => {
    if (!confirm('Are you sure you want to delete this skill?')) {
      return;
    }

    setError(null);
    try {
      const { success, error: deleteError } = await removeSkill(userId, skillName);
      
      if (!success || deleteError) {
        setError('Failed to delete skill');
        throw deleteError;
      }

      setSkills((prev) => prev.filter((s) => s !== skillName));
    } catch (err) {
      console.error('Error deleting skill:', err);
    }
  };

  const handleCancelNew = () => {
    setNewSkillName('');
    setPendingSkills([]);
    setIsAddingNew(false);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (skillName: string) => {
    setPendingSkills([...pendingSkills, skillName]);
    setNewSkillName('');
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    } else if (e.key === 'Backspace' && !newSkillName && pendingSkills.length > 0) {
      // Remove last pending skill on backspace when input is empty
      setPendingSkills(pendingSkills.slice(0, -1));
    }
  };

  if (loading) {
    return (
      <div className="p-4 rounded-xl bg-gradient-to-br from-neu-surface/50 to-neu-surface-dark/50 neu-card-raised border-neu-border">
        <p className="text-neu-text-primary/70">Loading skills...</p> 
      </div>
    );
  }

  return (
    <div className="space-y-4 ">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#4a7bd9] via-[#5a8ff5] to-[#94b0f6]">
          Skills
        </h2>
        {isEditing && !isAddingNew && (
          <div className="nav-buttons">
            <Button
              onClick={() => setIsAddingNew(true)}
              text="Add Skill"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
          {error}
        </div>
      )}

      {isAddingNew && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-neu-surface/50 to-neu-surface-dark/50 neu-card-raised">
          <h3 className="text-lg font-semibold text-neu-text-primary mb-4">Add New Skill</h3>
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-neu-text-primary/70 mb-2">
                Skill Name (separate with commas)
              </label>
              
              {/* Pending skills badges */}
              {pendingSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2 p-2 rounded-lg bg-[#1a2332]/50 border border-neu-border">
                  {pendingSkills.map((skill, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#4a7bd9]/30 border border-[#4a7bd9]/40 text-neu-text-primary text-sm"
                    >
                      <span>{skill}</span>
                      <button
                        onClick={() => setPendingSkills(pendingSkills.filter((_, i) => i !== index))}
                        className="text-neu-text-primary/50 hover:text-red-400 transition-colors"
                        aria-label={`Remove ${skill}`}
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <input
                ref={inputRef}
                type="text"
                value={newSkillName}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (newSkillName.trim()) {
                    setShowSuggestions(true);
                  }
                }}
                className="w-full px-3 py-2 rounded-lg neu-input text-neu-text-primary focus:outline-none focus:border-[#5a8ff5] transition-colors"
                placeholder="e.g., Acting, Singing, Dancing"
                autoFocus
              />
              
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-10 w-full mt-1 bg-[#1a2332] border border-neu-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion.skill_name)}
                      className="w-full px-4 py-2 text-left hover:bg-neu-surface transition-colors flex items-center justify-between group"
                    >
                      <span className="text-neu-text-primary">{suggestion.skill_name}</span>
                      <span className="text-xs text-neu-text-primary/50 group-hover:text-neu-text-primary/70">
                        {suggestion.usage_count} {suggestion.usage_count === 1 ? 'user' : 'users'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 nav-buttons">
              <Button
                onClick={handleCancelNew}
                disabled={saving}
                text="Cancel"
              />
              <Button
                onClick={() => handleAddSkill()}
                disabled={saving || (pendingSkills.length === 0 && !newSkillName.trim())}
                text={saving ? 'Adding...' : `Add ${pendingSkills.length + (newSkillName.trim() ? 1 : 0)} Skill${pendingSkills.length + (newSkillName.trim() ? 1 : 0) !== 1 ? 's' : ''}`}
              />
            </div>
          </div>
        </div>
      )}

      {skills.length === 0 && !isAddingNew ? (
        <div className="neu-badge p-8 rounded-xl bg-gradient-to-br from-neu-surface/50 to-neu-surface-dark/50 border border-neu-border text-center">
          <p className="text-neu-text-primary/70">No skills added yet.</p>
          {isEditing && (
            <p className="text-neu-text-primary/50 text-sm mt-2">
              Click &quot;Add Skill&quot; to add your first skill.
            </p>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-gradient-to-br from-neu-surface/50 to-neu-surface-dark/50 neu-card-raised border-neu-border">
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <div
                key={`${skill}-${index}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full neu-badge"
              >
                <span>{skill}</span>
                {isEditing && (
                  <button
                    onClick={() => handleDeleteSkill(skill)}
                    className="text-neu-text-primary/50 hover:text-red-400 transition-colors"
                    aria-label={`Delete ${skill}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
