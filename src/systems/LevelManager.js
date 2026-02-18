const LEVELS_KEY = 'henry-ski-combat-levels';

export const DEFAULT_SKI_LEVEL = {
  id: 'default-ski',
  name: 'Beginner Hill',
  type: 'ski',
  width: 3200,
  height: 600,
  objects: [
    { type: 'obstacle_tree', x: 400, y: 300 },
    { type: 'obstacle_tree', x: 600, y: 150 },
    { type: 'obstacle_rock', x: 900, y: 400 },
    { type: 'collectible_coin', x: 500, y: 250 },
    { type: 'collectible_coin', x: 700, y: 350 },
    { type: 'collectible_star', x: 850, y: 200 },
    { type: 'ramp', x: 1200, y: 450 },
    { type: 'collectible_potion', x: 1400, y: 180 },
    { type: 'obstacle_tree', x: 1500, y: 200 },
    { type: 'obstacle_rock', x: 1800, y: 350 },
    { type: 'collectible_coin', x: 1600, y: 300 },
    { type: 'collectible_coin', x: 2000, y: 150 },
    { type: 'ramp', x: 2200, y: 400 },
    { type: 'collectible_potion', x: 2400, y: 350 },
    { type: 'obstacle_tree', x: 2500, y: 250 },
    { type: 'collectible_star', x: 2700, y: 300 },
    { type: 'obstacle_rock', x: 2900, y: 450 },
  ],
};

export const DEFAULT_COMBAT_LEVEL = {
  id: 'default-combat',
  name: 'Snow Arena',
  type: 'combat',
  width: 800,
  height: 400,
  enemies: [
    { type: 'enemy_basic', x: 500, y: 300, hp: 30 },
    { type: 'enemy_basic', x: 600, y: 200, hp: 30 },
    { type: 'enemy_strong', x: 650, y: 350, hp: 60 },
  ],
};

export class LevelManager {
  static loadCustomLevels() {
    try {
      const data = localStorage.getItem(LEVELS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Failed to load custom levels:', e);
      return [];
    }
  }

  static saveCustomLevels(levels) {
    try {
      localStorage.setItem(LEVELS_KEY, JSON.stringify(levels));
      return true;
    } catch (e) {
      console.warn('Failed to save custom levels:', e);
      return false;
    }
  }

  static addLevel(level) {
    const levels = LevelManager.loadCustomLevels();
    level.id = `custom-${Date.now()}`;
    level.createdAt = Date.now();
    levels.push(level);
    LevelManager.saveCustomLevels(levels);
    return level.id;
  }

  static updateLevel(levelId, updates) {
    const levels = LevelManager.loadCustomLevels();
    const idx = levels.findIndex((l) => l.id === levelId);
    if (idx !== -1) {
      levels[idx] = { ...levels[idx], ...updates };
      LevelManager.saveCustomLevels(levels);
      return true;
    }
    return false;
  }

  static removeLevel(levelId) {
    const levels = LevelManager.loadCustomLevels();
    LevelManager.saveCustomLevels(levels.filter((l) => l.id !== levelId));
  }

  static getLevel(levelId) {
    if (levelId === 'default-ski') return DEFAULT_SKI_LEVEL;
    if (levelId === 'default-combat') return DEFAULT_COMBAT_LEVEL;
    const levels = LevelManager.loadCustomLevels();
    return levels.find((l) => l.id === levelId) || null;
  }

  static getAllSkiLevels() {
    const custom = LevelManager.loadCustomLevels().filter(
      (l) => l.type === 'ski'
    );
    return [DEFAULT_SKI_LEVEL, ...custom];
  }

  static getAllCombatLevels() {
    const custom = LevelManager.loadCustomLevels().filter(
      (l) => l.type === 'combat'
    );
    return [DEFAULT_COMBAT_LEVEL, ...custom];
  }

  static exportLevel(levelId) {
    const level = LevelManager.getLevel(levelId);
    return level ? JSON.stringify(level, null, 2) : null;
  }

  static importLevel(jsonString) {
    try {
      const level = JSON.parse(jsonString);
      if (!level.type || !level.name) {
        throw new Error('Invalid level format');
      }
      return LevelManager.addLevel(level);
    } catch (e) {
      console.warn('Failed to import level:', e);
      return null;
    }
  }
}
