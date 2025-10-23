#!/usr/bin/env node
/**
 * Script to update old cosmic theme colors to new neumorphic design
 * Run with: node scripts/update-colors.js
 */

const fs = require('fs');
const path = require('path');

// Color mappings from old to new
const colorReplacements = {
  // Text colors
  'text-\\[#c5ddff\\]': 'text-neu-text-primary',
  'text-\\[#b5ccff\\]': 'text-neu-text-primary',
  'text-\\[#c5ddff\\]\\/70': 'text-neu-text-secondary',
  'text-\\[#c5ddff\\]\\/60': 'text-neu-text-muted',
  'text-\\[#c5ddff\\]\\/50': 'text-neu-text-muted',
  'text-\\[#c5ddff\\]\\/40': 'text-neu-text-muted',
  'text-\\[#b5ccff\\]\\/60': 'text-neu-text-muted',
  'text-\\[#5a8ff5\\]': 'text-neu-accent-primary',
  'text-\\[#94b0f6\\]': 'text-neu-accent-secondary',
  
  // Background colors
  'bg-\\[#2e3e5e\\]': 'bg-neu-surface',
  'bg-\\[#26364e\\]': 'bg-neu-surface-dark',
  'bg-gradient-to-br from-\\[#2e3e5e\\] to-\\[#26364e\\]': 'bg-neu-surface',
  'from-\\[#2e3e5e\\]': 'from-neu-surface',
  'to-\\[#26364e\\]': 'to-neu-surface-dark',
  'bg-\\[#2e3e5e\\]\\/50': 'bg-neu-surface/50',
  'bg-\\[#2e3e5e\\]\\/80': 'bg-neu-surface/80',
  'bg-\\[#2e3e5e\\]\\/95': 'bg-neu-surface/95',
  
  // Border colors
  'border-\\[#4a7bd9\\]\\/20': 'border-neu-border',
  'border-\\[#4a7bd9\\]\\/30': 'border-neu-border',
  'border-\\[#5a8ff5\\]\\/30': 'border-neu-border-focus',
  'border-\\[#5a8ff5\\]\\/40': 'border-neu-border-focus',
  'border-\\[#5a8ff5\\]\\/50': 'border-neu-border-focus',
  
  // Placeholder colors
  'placeholder-\\[#c5ddff\\]\\/40': 'placeholder-neu-text-muted',
  
  // Hover states
  'hover:text-\\[#5a8ff5\\]': 'hover:text-neu-accent-primary',
  'hover:text-\\[#94b0f6\\]': 'hover:text-neu-accent-secondary',
  'hover:border-\\[#5a8ff5\\]\\/40': 'hover:border-neu-border-focus',
  'hover:border-\\[#5a8ff5\\]\\/50': 'hover:border-neu-border-focus',
  
  // Focus states
  'focus:border-\\[#5a8ff5\\]\\/50': 'focus:border-neu-border-focus',
  'focus:ring-\\[#5a8ff5\\]\\/20': 'focus:ring-neu-accent-primary/20',
  
  // Group hover states
  'group-hover:text-\\[#5a8ff5\\]': 'group-hover:text-neu-accent-primary',
  
  // CSS variable references
  'var\\(--cosmic-shadow-dark\\)': 'var(--neu-shadow-dark)',
  'var\\(--cosmic-shadow-light\\)': 'var(--neu-shadow-light)',
};

// Directories to search
const searchDirs = [
  'src/app',
  'src/components',
];

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  for (const [oldPattern, newValue] of Object.entries(colorReplacements)) {
    const regex = new RegExp(oldPattern, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, newValue);
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated: ${filePath}`);
    return true;
  }
  
  return false;
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  let updatedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        updatedCount += walkDirectory(filePath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
      if (updateFile(filePath)) {
        updatedCount++;
      }
    }
  }
  
  return updatedCount;
}

console.log('🎨 Updating colors to neumorphic design...\n');

let totalUpdated = 0;
for (const dir of searchDirs) {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    console.log(`\nSearching ${dir}...`);
    totalUpdated += walkDirectory(fullPath);
  }
}

console.log(`\n✨ Complete! Updated ${totalUpdated} files.`);
