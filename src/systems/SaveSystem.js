const SAVE_KEY = 'henry-ski-combat-save';

const DEFAULT_SAVE = {
  unlockedWeapons: ['fists'],
  highScore: 0,
  totalRuns: 0,
  levelsCompleted: [],
  customSprites: {},
  customLevels: [],
};

export class SaveSystem {
  static load() {
    try {
      const data = localStorage.getItem(SAVE_KEY);
      if (data) {
        return { ...DEFAULT_SAVE, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Failed to load save data:', e);
    }
    return { ...DEFAULT_SAVE };
  }

  static save(data) {
    try {
      const current = SaveSystem.load();
      const merged = { ...current, ...data };
      localStorage.setItem(SAVE_KEY, JSON.stringify(merged));
      return true;
    } catch (e) {
      console.warn('Failed to save data:', e);
      return false;
    }
  }

  static unlockWeapon(weaponId) {
    const data = SaveSystem.load();
    if (!data.unlockedWeapons.includes(weaponId)) {
      data.unlockedWeapons.push(weaponId);
      SaveSystem.save(data);
    }
  }

  static isWeaponUnlocked(weaponId) {
    const data = SaveSystem.load();
    return data.unlockedWeapons.includes(weaponId);
  }

  static updateHighScore(score) {
    const data = SaveSystem.load();
    if (score > data.highScore) {
      data.highScore = score;
      SaveSystem.save(data);
      return true;
    }
    return false;
  }

  static incrementRuns() {
    const data = SaveSystem.load();
    data.totalRuns += 1;
    SaveSystem.save(data);
    return data.totalRuns;
  }

  static reset() {
    localStorage.removeItem(SAVE_KEY);
  }
}
