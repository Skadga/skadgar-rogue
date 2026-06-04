// ========== PORTAL.JS ==========
// ОПТИМИЗИРОВАННАЯ ВЕРСИЯ

let dungeonActive = false;
const DUNGEON_MOBS_TO_SPAWN = 9;
const DUNGEON_MOBS_TO_KILL = 8;
let dungeonEnemiesKilled = 0;
let bossSpawned = false;
let bossDefeated = false;

window.dungeonActive = dungeonActive;
window.bossDefeated = bossDefeated;
window.bossSpawned = bossSpawned;
window.dungeonEnemiesKilled = dungeonEnemiesKilled;
window.dungeonEnemiesToKill = DUNGEON_MOBS_TO_KILL;

let homePortalPosition = { x: 12, y: 12 };
let returnPortalPosition = null;

function updateGlobalVariables() {
    window.dungeonActive = dungeonActive;
    window.bossDefeated = bossDefeated;
    window.bossSpawned = bossSpawned;
    window.dungeonEnemiesKilled = dungeonEnemiesKilled;
}

function generateDungeonMap() {
    let map = Array(MAP_H).fill().map(() => Array(MAP_W).fill(1));
    
    for (let y = 2; y < MAP_H - 2; y++) {
        for (let x = 2; x < MAP_W - 2; x++) {
            if (Math.random() < 0.7) map[y][x] = 0;
        }
    }
    
    for (let y = 1; y < MAP_H - 1; y++) {
        for (let x = 1; x < MAP_W - 1; x++) {
            if (map[y][x] === 1) {
                let walls = 0;
                if (map[y-1][x] === 0) walls++;
                if (map[y+1][x] === 0) walls++;
                if (map[y][x-1] === 0) walls++;
                if (map[y][x+1] === 0) walls++;
                if (walls >= 2 && Math.random() < 0.7) map[y][x] = 0;
            }
        }
    }
    
    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            if (map[y][x] === 0 && Math.random() < 0.1) map[y][x] = 30;
            else if (map[y][x] === 0 && Math.random() < 0.08) map[y][x] = 31;
        }
    }
    
    for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
            const x = 10 + dx;
            const y = 10 + dy;
            if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) map[y][x] = 0;
        }
    }
    
    return map;
}

function isPositionValidForEnemy(x, y, playerX, playerY, existingEnemies) {
    if (!isWalkable(x, y)) return false;
    if (Math.abs(x - playerX) < 3 && Math.abs(y - playerY) < 3) return false;
    if (existingEnemies.some(e => Math.abs(e.x - x) < 0.5 && Math.abs(e.y - y) < 0.5)) return false;
    return true;
}

function spawnDungeonEnemies() {
    window.enemies = [];
    const playerX = 10;
    const playerY = 10;
    
    let spawned = 0;
    let attempts = 0;
    const maxAttempts = 500;
    
    while (spawned < DUNGEON_MOBS_TO_SPAWN && attempts < maxAttempts) {
        const x = 2 + Math.floor(Math.random() * (MAP_W - 4));
        const y = 2 + Math.floor(Math.random() * (MAP_H - 4));
        
        if (isPositionValidForEnemy(x, y, playerX, playerY, window.enemies)) {
            const types = ['goblin', 'skeleton', 'ghost', 'orc'];
            const type = types[Math.floor(Math.random() * types.length)];
            const t = ENEMY_TYPES[type];
            const levelBonus = Math.floor((window.player.level - 1) * 0.5);
            
            window.enemies.push({
                x: x, y: y,
                health: t.health + levelBonus * 6,
                maxHealth: t.health + levelBonus * 6,
                damage: Math.max(5, t.damage + levelBonus * 1),
                xpReward: t.xp + levelBonus * 5,
                goldMin: t.goldMin,
                goldMax: t.goldMax,
                color: t.color,
                size: t.size,
                speed: t.speed * 0.9,
                moveTimer: 0,
                type: type,
                name: t.name,
                attackCooldown: 0,
                attackAnim: 0,
                isBoss: false
            });
            spawned++;
        }
        attempts++;
    }
    
    if (window.enemies.length < DUNGEON_MOBS_TO_SPAWN) {
        for (let y = 3; y < MAP_H - 3; y++) {
            for (let x = 3; x < MAP_W - 3; x++) {
                if (window.enemies.length >= DUNGEON_MOBS_TO_SPAWN) break;
                if (isPositionValidForEnemy(x, y, playerX, playerY, window.enemies)) {
                    const types = ['goblin', 'skeleton', 'ghost', 'orc'];
                    const type = types[Math.floor(Math.random() * types.length)];
                    const t = ENEMY_TYPES[type];
                    const levelBonus = Math.floor((window.player.level - 1) * 0.5);
                    
                    window.enemies.push({
                        x: x, y: y,
                        health: t.health + levelBonus * 6,
                        maxHealth: t.health + levelBonus * 6,
                        damage: Math.max(5, t.damage + levelBonus * 1),
                        xpReward: t.xp + levelBonus * 5,
                        goldMin: t.goldMin,
                        goldMax: t.goldMax,
                        color: t.color,
                        size: t.size,
                        speed: t.speed * 0.9,
                        moveTimer: 0,
                        type: type,
                        name: t.name,
                        attackCooldown: 0,
                        attackAnim: 0,
                        isBoss: false
                    });
                }
            }
        }
    }
}

function spawnBoss() {
    if (bossSpawned) return;
    bossSpawned = true;
    updateGlobalVariables();
    
    let x, y;
    let attempts = 0;
    const playerX = Math.floor(window.player.x);
    const playerY = Math.floor(window.player.y);
    
    for (attempts = 0; attempts < 100; attempts++) {
        x = 5 + Math.floor(Math.random() * (MAP_W - 10));
        y = 5 + Math.floor(Math.random() * (MAP_H - 10));
        if (isWalkable(x, y) && 
            !window.enemies.some(e => Math.abs(e.x - x) < 1.5) &&
            Math.abs(x - playerX) > 2 && Math.abs(y - playerY) > 2) break;
    }
    
    const bossHealth = 180 + window.player.level * 15;
    window.enemies.push({
        x, y,
        health: bossHealth,
        maxHealth: bossHealth,
        damage: 20 + window.player.level * 2,
        xpReward: 250 + window.player.level * 25,
        goldMin: 80,
        goldMax: 150,
        color: "#dd3333",
        size: 22,
        speed: 0.9,
        moveTimer: 0,
        type: "boss",
        name: "ПОВЕЛИТЕЛЬ ДАНЖА",
        attackCooldown: 0,
        attackAnim: 0,
        isBoss: true
    });
    
    addPickupEffect(x, y, "БОСС ПОЯВИЛСЯ! Будь осторожен!");
}

function createReturnPortal() {
    if (returnPortalPosition) {
        const oldX = returnPortalPosition.x;
        const oldY = returnPortalPosition.y;
        if (MAP[oldY] && MAP[oldY][oldX] === 12) MAP[oldY][oldX] = 0;
    }
    
    for (let radius = 1; radius <= 5; radius++) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const x = Math.floor(window.player.x) + dx;
                const y = Math.floor(window.player.y) + dy;
                if (x > 0 && x < MAP_W - 1 && y > 0 && y < MAP_H - 1) {
                    if (MAP[y][x] === 0 || MAP[y][x] === 20 || MAP[y][x] === 21 || MAP[y][x] === 22 || MAP[y][x] === 23) {
                        returnPortalPosition = { x, y };
                        MAP[y][x] = 12;
                        addPickupEffect(x, y, "ЗОЛОТОЙ ПОРТАЛ ОТКРЫТ!");
                        return;
                    }
                }
            }
        }
    }
    
    for (let y = 3; y < MAP_H - 3; y++) {
        for (let x = 3; x < MAP_W - 3; x++) {
            if (MAP[y][x] === 0) {
                returnPortalPosition = { x, y };
                MAP[y][x] = 12;
                addPickupEffect(x, y, "ЗОЛОТОЙ ПОРТАЛ ОТКРЫТ!");
                return;
            }
        }
    }
}

function findSpawnPointNearPortal() {
    const portalPos = homePortalPosition;
    const directions = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: 1, dy: 1 }];
    
    for (let dir of directions) {
        const x = portalPos.x + dir.dx;
        const y = portalPos.y + dir.dy;
        if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H && isWalkable(x, y)) return { x, y };
    }
    return { x: portalPos.x + 1, y: portalPos.y };
}

function enterDungeon() {
    dungeonActive = true;
    dungeonEnemiesKilled = 0;
    bossSpawned = false;
    bossDefeated = false;
    returnPortalPosition = null;
    updateGlobalVariables();
    
    MAP = generateDungeonMap();
    window.player.x = 10;
    window.player.y = 10;
    
    // ========== ИЗМЕНЕНИЕ: УБРАЛИ СБРОС exploredTiles ==========
    
    spawnDungeonEnemies();
    updateUI();
    updateLocationDisplay();
    addPickupEffect(window.player.x, window.player.y, `ВЫ ВОШЛИ В ДАНЖ! УБЕЙТЕ ${DUNGEON_MOBS_TO_KILL} МОБОВ`);
}

function checkDungeonProgress() {
    if (!dungeonActive) return;
    
    const aliveMobs = window.enemies.filter(e => !e.isBoss).length;
    const killedMobs = DUNGEON_MOBS_TO_SPAWN - aliveMobs;
    dungeonEnemiesKilled = killedMobs;
    updateGlobalVariables();
    updateUI();
    
    if (killedMobs >= DUNGEON_MOBS_TO_KILL && !bossSpawned && !bossDefeated) {
        spawnBoss();
        updateUI();
        return;
    }
    
    const bossExists = window.enemies.some(e => e.isBoss === true);
    
    if (bossSpawned && !bossExists && !bossDefeated) {
        bossDefeated = true;
        updateGlobalVariables();
        
        dungeonActive = false;
        createReturnPortal();
        addPickupEffect(window.player.x, window.player.y, "ДАНЖ ПРОЙДЕН! ИДИТЕ К ПОРТАЛУ");
        addPickupEffect(window.player.x, window.player.y - 1, "+50 ОПЫТА!");
        addXp(50);
        updateUI();
        updateLocationDisplay();
    }
}

function exitDungeon() {
    dungeonActive = false;
    bossSpawned = false;
    bossDefeated = false;
    dungeonEnemiesKilled = 0;
    returnPortalPosition = null;
    updateGlobalVariables();
    
    if (originalHomeMap) MAP = JSON.parse(JSON.stringify(originalHomeMap));
    
    let foundPortal = false;
    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            if (MAP[y][x] === 10) { homePortalPosition = { x, y }; foundPortal = true; break; }
        }
        if (foundPortal) break;
    }
    
    const spawnPos = findSpawnPointNearPortal();
    window.player.x = spawnPos.x;
    window.player.y = spawnPos.y;
    
    // ========== ИЗМЕНЕНИЕ: УБРАЛИ СБРОС exploredTiles ==========
    
    window.enemies = [];
    addPickupEffect(window.player.x, window.player.y, "ВЫ ВЕРНУЛИСЬ ДОМОЙ");
    updateUI();
    updateLocationDisplay();
    
    if (typeof placeShopKeeper === 'function') placeShopKeeper();
}

function updateLocationDisplay() {
    const locationEl = document.getElementById('locationIndicator');
    if (locationEl) {
        if (dungeonActive) {
            locationEl.innerHTML = "ПОДЗЕМЕЛЬЕ (ОПАСНО)";
            locationEl.style.color = "#ff6666";
        } else {
            locationEl.innerHTML = "ДОМ (БЕЗОПАСНО)";
            locationEl.style.color = "#88ff88";
        }
    }
}

window.updateLocationDisplay = updateLocationDisplay;
window.enterDungeon = enterDungeon;
window.exitDungeon = exitDungeon;
window.checkDungeonProgress = checkDungeonProgress;