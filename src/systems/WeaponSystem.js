export const WEAPONS = {
  sword: {
    id: 'sword',
    name: 'Sword',
    description: 'A trusty blade. Balanced damage and range.',
    damage: 20,
    speed: 1.0,
    range: 80,
    level: 1,
    spriteKey: 'weapon-sword',
    qteType: 'timing',
  },
  staff: {
    id: 'staff',
    name: 'Battle Staff',
    description: 'Long reach, sweeping attacks. Type numbers to fight!',
    damage: 20,
    speed: 0.8,
    range: 120,
    level: 2,
    spriteKey: 'weapon-staff',
    qteType: 'sequence',
  },
  snowball: {
    id: 'snowball',
    name: 'Snowball Cannon',
    description: 'Ranged snowball attacks! Slow but safe.',
    damage: 20,
    speed: 0.6,
    range: 300,
    level: 3,
    spriteKey: 'weapon-snowball',
    qteType: 'aim',
  },
  axe: {
    id: 'axe',
    name: 'Ice Axe',
    description: 'Heavy hitting ice axe. Devastating power!',
    damage: 20,
    speed: 0.5,
    range: 70,
    level: 4,
    spriteKey: 'weapon-axe',
    qteType: 'mash',
  },
  legendary: {
    id: 'legendary',
    name: 'Frost Blade',
    description: 'The legendary Frost Blade. Ultimate power!',
    damage: 20,
    speed: 1.2,
    range: 150,
    level: 5,
    spriteKey: 'weapon-legendary',
    qteType: 'timing',
  },
};

// Level thresholds - what level you reach based on total runs
export const LEVEL_THRESHOLDS = [
  { level: 1, runsRequired: 0 },
  { level: 2, runsRequired: 3 },
  { level: 3, runsRequired: 6 },
  { level: 4, runsRequired: 10 },
  { level: 5, runsRequired: 15 },
];

export class WeaponSystem {
  static getWeapon(id) {
    return WEAPONS[id] || null;
  }

  static getAllWeapons() {
    return Object.values(WEAPONS);
  }

  static getPlayerLevel(totalRuns) {
    let playerLevel = 1;
    for (const threshold of LEVEL_THRESHOLDS) {
      if (totalRuns >= threshold.runsRequired) {
        playerLevel = threshold.level;
      }
    }
    return playerLevel;
  }

  static getWeaponsForLevel(playerLevel) {
    return Object.values(WEAPONS).filter((w) => w.level <= playerLevel);
  }

  static getNextLevelInfo(playerLevel) {
    const next = LEVEL_THRESHOLDS.find((t) => t.level === playerLevel + 1);
    if (!next) return null;
    const weapon = Object.values(WEAPONS).find((w) => w.level === playerLevel + 1);
    return { ...next, weapon };
  }

  static checkUnlocks(saveData) {
    const playerLevel = WeaponSystem.getPlayerLevel(saveData.totalRuns);
    const newUnlocks = [];
    for (const weapon of Object.values(WEAPONS)) {
      if (weapon.level <= playerLevel && !saveData.unlockedWeapons.includes(weapon.id)) {
        newUnlocks.push(weapon);
      }
    }
    return newUnlocks;
  }

  static calculateDamage(weapon, qteScore) {
    const baseDamage = weapon.damage;
    const multiplier = 0.5 + qteScore * 1.0;
    return Math.round(baseDamage * multiplier);
  }
}
