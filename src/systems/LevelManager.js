const LEVELS_KEY = 'henry-ski-combat-levels';

export const DEFAULT_SKI_LEVEL = {
  id: 'default-ski',
  name: 'Beginner Hill',
  type: 'ski',
  width: 3200,
  height: 600,
  // y values are lane offsets: 0 = slope center, negative = uphill, positive = downhill
  // Player can steer between -120 and +120
  objects: [
    // Early section — gentle introduction
    { type: 'collectible_coin', x: 300, y: 0 },
    { type: 'obstacle_tree', x: 500, y: -50 },
    { type: 'collectible_coin', x: 600, y: 40 },
    { type: 'obstacle_tree', x: 750, y: 60 },
    // Mid section — more spread
    { type: 'collectible_star', x: 850, y: -30 },
    { type: 'obstacle_rock', x: 950, y: 10 },
    { type: 'collectible_coin', x: 1050, y: -70 },
    { type: 'ramp', x: 1200, y: 0 },
    // Post-ramp
    { type: 'collectible_potion', x: 1400, y: -20 },
    { type: 'obstacle_tree', x: 1550, y: 80 },
    { type: 'collectible_coin', x: 1650, y: -50 },
    { type: 'obstacle_rock', x: 1800, y: -80 },
    // Late section — harder
    { type: 'collectible_coin', x: 2000, y: 30 },
    { type: 'ramp', x: 2200, y: 0 },
    { type: 'collectible_potion', x: 2400, y: 40 },
    { type: 'obstacle_tree', x: 2550, y: -60 },
    { type: 'collectible_star', x: 2700, y: 50 },
    { type: 'obstacle_rock', x: 2900, y: -90 },
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
