// ========== SAVEGAME.JS ==========
// Система сохранения и загрузки игры - 3 слота

const SAVE_KEY_PREFIX = 'diablo_save_slot_';

function getSaveKey(slot) {
    return SAVE_KEY_PREFIX + slot;
}

function updateAllSlotsInfo() {
    for (let i = 1; i <= 3; i++) {
        const saveInfoSpan = document.getElementById('saveSlot' + i + 'Info');
        if (saveInfoSpan) updateSlotInfoElement(saveInfoSpan, i);
        
        const loadInfoSpan = document.getElementById('loadSlot' + i + 'Info');
        if (loadInfoSpan) updateSlotInfoElement(loadInfoSpan, i);
    }
}

function updateSlotInfoElement(element, slot) {
    const saved = localStorage.getItem(getSaveKey(slot));
    if (!saved) {
        element.textContent = 'Пусто';
        element.style.color = '#888888';
        return;
    }
    
    try {
        const data = JSON.parse(saved);
        const date = new Date(data.timestamp);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        const level = data.player?.level || 1;
        const kills = data.player?.kills || 0;
        const location = data.dungeonActive ? 'В данже' : 'Дома';
        
        element.innerHTML = `Lv.${level} | ${kills} убийств | ${location} | ${dateStr}`;
        element.style.color = '#88ff88';
    } catch (e) {
        element.textContent = 'Ошибка';
        element.style.color = '#ff8888';
    }
}

function saveGameToSlot(slot) {
    try {
        const saveData = {
            version: '1.0',
            timestamp: Date.now(),
            slot: slot,
            player: {
                x: window.player.x,
                y: window.player.y,
                health: window.player.health,
                maxHealth: window.player.maxHealth,
                level: window.player.level,
                xp: window.player.xp,
                kills: window.player.kills,
                damage: window.player.damage,
                armor: window.player.armor,
                damageReduction: window.player.damageReduction,
                attackCooldown: window.player.attackCooldown,
                direction: window.player.direction,
                critChance: window.player.critChance,
                critDamage: window.player.critDamage,
                gold: window.player.gold
            },
            dungeonActive: dungeonActive,
            dungeonEnemiesKilled: dungeonEnemiesKilled,
            dungeonEnemiesToKill: dungeonEnemiesToKill,
            bossSpawned: bossSpawned,
            bossDefeated: bossDefeated,
            homePortalPosition: homePortalPosition,
            returnPortalPosition: returnPortalPosition,
            exploredTiles: compressExploredTiles(),
            enemies: dungeonActive ? serializeEnemies() : [],
            mapData: dungeonActive ? serializeMap() : null,
            regenTimer: regenTimer,
            regenDelayTimer: regenDelayTimer,
            walkAnim: walkAnim,
            walkDir: walkDir,
            attackAnim: attackAnim,
            hitFlash: hitFlash,
            gameActive: window.gameActive,
            // Сохраняем прогресс магазина
            shopInventory: {
                armorUpgrade: shopInventory.armorUpgrade.currentUpgrade,
                damageUpgrade: shopInventory.damageUpgrade.currentUpgrade
            },
            playerPotions: playerPotions
        };
        
        localStorage.setItem(getSaveKey(slot), JSON.stringify(saveData));
        updateAllSlotsInfo();
        addPickupEffect(window.player.x, window.player.y, `[SAVE] Slot ${slot} saved!`);
        return true;
    } catch (e) {
        console.error(`Save error slot ${slot}:`, e);
        addPickupEffect(window.player.x, window.player.y, `[ERROR] Slot ${slot} save failed!`);
        return false;
    }
}

function compressExploredTiles() {
    let compressed = '';
    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            compressed += exploredTiles[y][x] ? '1' : '0';
        }
    }
    return compressed;
}

function decompressExploredTiles(compressed) {
    if (!compressed) return;
    let idx = 0;
    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            exploredTiles[y][x] = compressed[idx] === '1';
            idx++;
        }
    }
}

function serializeEnemies() {
    return window.enemies.map(e => ({
        x: e.x, y: e.y,
        health: e.health, maxHealth: e.maxHealth,
        damage: e.damage, xpReward: e.xpReward,
        goldMin: e.goldMin, goldMax: e.goldMax,
        color: e.color, size: e.size, speed: e.speed,
        type: e.type, name: e.name,
        attackCooldown: e.attackCooldown, attackAnim: e.attackAnim,
        isBoss: e.isBoss, moveTimer: e.moveTimer
    }));
}

function deserializeEnemies(enemiesData) {
    if (!enemiesData || enemiesData.length === 0) return [];
    return enemiesData.map(e => ({
        x: e.x, y: e.y,
        health: e.health, maxHealth: e.maxHealth,
        damage: e.damage, xpReward: e.xpReward,
        goldMin: e.goldMin, goldMax: e.goldMax,
        color: e.color, size: e.size, speed: e.speed,
        type: e.type, name: e.name,
        attackCooldown: e.attackCooldown, attackAnim: e.attackAnim,
        isBoss: e.isBoss, moveTimer: e.moveTimer
    }));
}

function serializeMap() {
    let mapStr = '';
    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            mapStr += MAP[y][x] + ',';
        }
    }
    return mapStr;
}

function deserializeMap(mapStr) {
    if (!mapStr) return;
    const values = mapStr.split(',').map(Number);
    let idx = 0;
    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            if (idx < values.length) MAP[y][x] = values[idx];
            idx++;
        }
    }
}

function loadGameFromSlot(slot) {
    try {
        const saved = localStorage.getItem(getSaveKey(slot));
        if (!saved) {
            addPickupEffect(window.player.x, window.player.y, `[LOAD] Slot ${slot} is empty!`);
            return false;
        }
        
        const data = JSON.parse(saved);
        
        if (data.player) {
            window.player.x = data.player.x;
            window.player.y = data.player.y;
            window.player.health = data.player.health;
            window.player.maxHealth = data.player.maxHealth;
            window.player.level = data.player.level;
            window.player.xp = data.player.xp;
            window.player.kills = data.player.kills;
            window.player.damage = data.player.damage;
            window.player.armor = data.player.armor;
            window.player.damageReduction = data.player.damageReduction;
            window.player.attackCooldown = data.player.attackCooldown;
            window.player.direction = data.player.direction;
            window.player.critChance = data.player.critChance;
            window.player.critDamage = data.player.critDamage;
            window.player.gold = data.player.gold || 100;
        }
        
        dungeonActive = data.dungeonActive || false;
        dungeonEnemiesKilled = data.dungeonEnemiesKilled || 0;
        dungeonEnemiesToKill = data.dungeonEnemiesToKill || 8;
        bossSpawned = data.bossSpawned || false;
        bossDefeated = data.bossDefeated || false;
        homePortalPosition = data.homePortalPosition || { x: 10, y: 10 };
        returnPortalPosition = data.returnPortalPosition || null;
        
        // Восстанавливаем прогресс магазина
        if (data.shopInventory) {
            if (shopInventory) {
                shopInventory.armorUpgrade.currentUpgrade = data.shopInventory.armorUpgrade || 0;
                shopInventory.damageUpgrade.currentUpgrade = data.shopInventory.damageUpgrade || 0;
            }
        }
        if (data.playerPotions && typeof playerPotions !== 'undefined') {
            playerPotions.health = data.playerPotions.health || 3;
        }
        
        if (data.mapData && data.dungeonActive) {
            deserializeMap(data.mapData);
        } else {
            if (originalHomeMap) {
                MAP = JSON.parse(JSON.stringify(originalHomeMap));
            } else {
                MAP = generateHomeMap();
                createHomePortalAtGoodPosition();
                originalHomeMap = JSON.parse(JSON.stringify(MAP));
            }
            if (homePortalPosition && MAP[homePortalPosition.y] && MAP[homePortalPosition.y][homePortalPosition.x] !== 10) {
                MAP[homePortalPosition.y][homePortalPosition.x] = 10;
            }
        }
        
        if (data.exploredTiles) decompressExploredTiles(data.exploredTiles);
        
        window.enemies = deserializeEnemies(data.enemies);
        
        if (data.walkAnim !== undefined) walkAnim = data.walkAnim;
        if (data.walkDir !== undefined) walkDir = data.walkDir;
        if (data.attackAnim !== undefined) attackAnim = data.attackAnim;
        if (data.hitFlash !== undefined) hitFlash = data.hitFlash;
        if (data.regenTimer !== undefined) regenTimer = data.regenTimer;
        if (data.regenDelayTimer !== undefined) regenDelayTimer = data.regenDelayTimer;
        if (data.gameActive !== undefined) window.gameActive = data.gameActive;
        
        isMouseDown = false;
        moveToMouse = false;
        currentPath = [];
        currentTarget = null;
        hoveredEnemy = null;
        hoveredPortal = null;
        window.moving = false;
        
        updateUI();
        updateLocationDisplay();
        
        // Размещаем торговца после загрузки
        if (typeof placeShopKeeper === 'function' && !dungeonActive) placeShopKeeper();
        
        addPickupEffect(window.player.x, window.player.y, `[LOAD] Slot ${slot} loaded!`);
        return true;
    } catch (e) {
        console.error(`Load error slot ${slot}:`, e);
        addPickupEffect(window.player.x, window.player.y, `[ERROR] Slot ${slot} load failed!`);
        return false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const mainMenu = document.getElementById('pauseMainMenu');
    const saveSubmenu = document.getElementById('pauseSaveSubmenu');
    const loadSubmenu = document.getElementById('pauseLoadSubmenu');
    
    const saveBtn = document.getElementById('pauseSaveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            mainMenu.style.display = 'none';
            saveSubmenu.style.display = 'block';
            updateAllSlotsInfo();
        });
    }
    
    const loadBtn = document.getElementById('pauseLoadBtn');
    if (loadBtn) {
        loadBtn.addEventListener('click', () => {
            mainMenu.style.display = 'none';
            loadSubmenu.style.display = 'block';
            updateAllSlotsInfo();
        });
    }
    
    const backBtns = document.querySelectorAll('.pause-back-btn');
    backBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            saveSubmenu.style.display = 'none';
            loadSubmenu.style.display = 'none';
            mainMenu.style.display = 'flex';
        });
    });
    
    const saveSlots = document.querySelectorAll('#pauseSaveSubmenu .pause-slot');
    saveSlots.forEach(slot => {
        const selectBtn = slot.querySelector('.pause-slot-select');
        const slotNum = parseInt(slot.getAttribute('data-slot'));
        if (selectBtn) {
            selectBtn.addEventListener('click', () => {
                saveGameToSlot(slotNum);
                saveSubmenu.style.display = 'none';
                mainMenu.style.display = 'flex';
            });
        }
    });
    
    const loadSlots = document.querySelectorAll('#pauseLoadSubmenu .pause-slot');
    loadSlots.forEach(slot => {
        const selectBtn = slot.querySelector('.pause-slot-select');
        const slotNum = parseInt(slot.getAttribute('data-slot'));
        if (selectBtn) {
            selectBtn.addEventListener('click', () => {
                loadGameFromSlot(slotNum);
                if (typeof closePauseMenu === 'function') closePauseMenu();
            });
        }
    });
    
    const resetBtn = document.getElementById('pauseResetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (typeof resetGame === 'function') resetGame();
            if (typeof closePauseMenu === 'function') closePauseMenu();
        });
    }
    
    const resumeBtn = document.getElementById('pauseResumeBtn');
    if (resumeBtn) {
        resumeBtn.addEventListener('click', () => {
            if (typeof closePauseMenu === 'function') closePauseMenu();
        });
    }
    
    updateAllSlotsInfo();
});

setInterval(updateAllSlotsInfo, 1000);