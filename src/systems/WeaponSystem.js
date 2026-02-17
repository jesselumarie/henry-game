export const WEAPONS = {
  fists: {
    id: 'fists',
    name: 'Fists',
    description: 'Good old boxing! Fast but short range.',
    damage: 8,
    speed: 1.2,
    range: 40,
    unlockCondition: null, // always available
    spriteKey: 'weapon-fists',
    qteType: 'mash', // quick-time event type
  },
  sword: {
    id: 'sword',
    name: 'Sword',
    description: 'A trusty blade. Balanced damage and range.',
    damage: 15,
    speed: 1.0,
    range: 80,
    unlockCondition: { type: 'runs', count: 3 },
    spriteKey: 'weapon-sword',
    qteType: 'timing', // hit at the right moment
  },
  staff: {
    id: 'staff',
    name: 'Battle Staff',
    description: 'Long reach, sweeping attacks.',
    damage: 12,
    speed: 0.8,
    range: 120,
    unlockCondition: { type: 'score', amount: 500 },
    spriteKey: 'weapon-staff',
    qteType: 'sequence', // press buttons in order
  },
  snowball: {
    id: 'snowball',
    name: 'Snowball Cannon',
    description: 'Ranged snowball attacks! Slow but safe.',
    damage: 10,
    speed: 0.6,
    range: 300,
    unlockCondition: { type: 'runs', count: 5 },
    spriteKey: 'weapon-snowball',
    qteType: 'aim', // aim at target
  },
};

export class WeaponSystem {
  static getWeapon(id) {
    return WEAPONS[id] || null;
  }

  static getAllWeapons() {
    return Object.values(WEAPONS);
  }

  static getUnlockableWeapons(saveData) {
    return Object.values(WEAPONS).filter((w) => {
      if (!w.unlockCondition) return false;
      if (saveData.unlockedWeapons.includes(w.id)) return false;
      return true;
    });
  }

  static checkUnlocks(saveData) {
    const newUnlocks = [];
    for (const weapon of Object.values(WEAPONS)) {
      if (!weapon.unlockCondition) continue;
      if (saveData.unlockedWeapons.includes(weapon.id)) continue;

      const cond = weapon.unlockCondition;
      let unlocked = false;
      if (cond.type === 'runs' && saveData.totalRuns >= cond.count) {
        unlocked = true;
      } else if (cond.type === 'score' && saveData.highScore >= cond.amount) {
        unlocked = true;
      }

      if (unlocked) {
        newUnlocks.push(weapon);
      }
    }
    return newUnlocks;
  }

  static calculateDamage(weapon, qteScore) {
    // qteScore is 0.0 to 1.0 based on quick-time event performance
    const baseDamage = weapon.damage;
    const multiplier = 0.5 + qteScore * 1.0; // 50% to 150% damage
    return Math.round(baseDamage * multiplier);
  }
}
