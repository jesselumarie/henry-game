const SPRITE_STORE_KEY = 'henry-ski-combat-sprites';

export const SPRITE_ROLES = {
  player: { name: 'Player Character', defaultKey: 'player-default', size: 32 },
  enemy_basic: { name: 'Basic Enemy', defaultKey: 'enemy-basic', size: 32 },
  enemy_strong: { name: 'Strong Enemy', defaultKey: 'enemy-strong', size: 32 },
  enemy_boss: { name: 'Boss Enemy', defaultKey: 'enemy-boss', size: 48 },
  obstacle_tree: { name: 'Tree', defaultKey: 'obstacle-tree', size: 32 },
  obstacle_rock: { name: 'Rock', defaultKey: 'obstacle-rock', size: 32 },
  collectible_coin: { name: 'Coin', defaultKey: 'collectible-coin', size: 16 },
  collectible_star: { name: 'Star', defaultKey: 'collectible-star', size: 16 },
  collectible_potion: { name: 'Health Potion', defaultKey: 'collectible-potion', size: 16 },
  ramp: { name: 'Ramp', defaultKey: 'ramp', size: 32 },
};

export class SpriteManager {
  static loadLibrary() {
    try {
      const data = localStorage.getItem(SPRITE_STORE_KEY);
      return data ? JSON.parse(data) : { sprites: [], assignments: {} };
    } catch (e) {
      console.warn('Failed to load sprite library:', e);
      return { sprites: [], assignments: {} };
    }
  }

  static saveLibrary(library) {
    try {
      localStorage.setItem(SPRITE_STORE_KEY, JSON.stringify(library));
      return true;
    } catch (e) {
      console.warn('Failed to save sprite library:', e);
      return false;
    }
  }

  static addSprite(name, dataUrl, width, height) {
    const library = SpriteManager.loadLibrary();
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    library.sprites.push({
      id,
      name,
      dataUrl,
      width,
      height,
      createdAt: Date.now(),
    });
    SpriteManager.saveLibrary(library);
    return id;
  }

  static removeSprite(id) {
    const library = SpriteManager.loadLibrary();
    library.sprites = library.sprites.filter((s) => s.id !== id);
    // Remove any assignments using this sprite
    for (const [role, assignedId] of Object.entries(library.assignments)) {
      if (assignedId === id) {
        delete library.assignments[role];
      }
    }
    SpriteManager.saveLibrary(library);
  }

  static assignToRole(spriteId, role) {
    const library = SpriteManager.loadLibrary();
    library.assignments[role] = spriteId;
    SpriteManager.saveLibrary(library);
  }

  static unassignRole(role) {
    const library = SpriteManager.loadLibrary();
    delete library.assignments[role];
    SpriteManager.saveLibrary(library);
  }

  static getSpriteForRole(role) {
    const library = SpriteManager.loadLibrary();
    const assignedId = library.assignments[role];
    if (assignedId) {
      return library.sprites.find((s) => s.id === assignedId) || null;
    }
    return null;
  }

  static getAllSprites() {
    const library = SpriteManager.loadLibrary();
    return library.sprites;
  }

  static getRoles() {
    return SPRITE_ROLES;
  }

  // Load a custom sprite into a Phaser scene as a texture
  static loadCustomTexture(scene, spriteId) {
    const library = SpriteManager.loadLibrary();
    const sprite = library.sprites.find((s) => s.id === spriteId);
    if (!sprite) return false;

    if (scene.textures.exists(spriteId)) {
      return true;
    }

    const img = new Image();
    img.onload = () => {
      scene.textures.addImage(spriteId, img);
    };
    img.src = sprite.dataUrl;
    return true;
  }

  // Get the texture key to use for a given role (custom or default)
  static getTextureKey(role) {
    const customSprite = SpriteManager.getSpriteForRole(role);
    if (customSprite) {
      return customSprite.id;
    }
    return SPRITE_ROLES[role]?.defaultKey || 'placeholder';
  }
}
