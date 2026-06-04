// ========== LOOT.JS ==========
// Улучшенная система лута с редкостью

const LOOT_TIERS = {
    common: { chance: 0.6, minGold: 5, maxGold: 15, items: ['dagger', 'leather_armor', 'iron_boots'] },
    uncommon: { chance: 0.25, minGold: 20, maxGold: 40, items: ['sword_ice', 'chainmail', 'ring_protection', 'speed_boots'] },
    rare: { chance: 0.12, minGold: 50, maxGold: 100, items: ['sword_fire', 'plate_armor', 'ring_power', 'crown'] },
    epic: { chance: 0.03, minGold: 150, maxGold: 250, items: ['axe', 'amulet_health', 'amulet_crit'] }
};

function getLootTierByLevel(level) {
    const roll = Math.random();
    if (level >= 5 && roll < 0.03) return 'epic';
    if (level >= 3 && roll < 0.12) return 'rare';
    if (level >= 1 && roll < 0.35) return 'uncommon';
    return 'common';
}

// ========== ИСПРАВЛЕННАЯ ФУНКЦИЯ generateEnemyLoot ==========
function generateEnemyLoot(enemy) {
    const tier = getLootTierByLevel(window.player.level);
    const loot = LOOT_TIERS[tier];
    
    // Золото
    const goldAmount = Math.floor(Math.random() * (loot.maxGold - loot.minGold) + loot.minGold);
    if (typeof addGold === 'function') addGold(goldAmount);
    
    // Предмет (шанс 40%)
    if (Math.random() < 0.4) {
        const randomItem = loot.items[Math.floor(Math.random() * loot.items.length)];
        if (typeof addItemToInventory === 'function') {
            addItemToInventory(randomItem);
        }
        addPickupEffect(enemy.x, enemy.y, `✨ ${AVAILABLE_ITEMS[randomItem]?.name || randomItem} найден!`);
        // ========== ОБНОВЛЯЕМ ИНВЕНТАРЬ ==========
        if (typeof updateInventoryUI === 'function') {
            updateInventoryUI();
        }
    }
    
    // Дополнительный эффект для эпических предметов
    if (tier === 'epic') {
        addPickupEffect(enemy.x, enemy.y, "🌟 РЕДКИЙ ПРЕДМЕТ! 🌟");
        if (typeof addChatMessage === 'function') {
            addChatMessage(`✨ ${enemy.name} выронил РЕДКИЙ предмет!`, 'warning');
        }
    }
    
    return { gold: goldAmount, tier: tier };
}

// Переопределяем стандартную функцию addGold из shop.js
const originalAddGold = window.addGold;
window.addGold = function(amount) {
    if (originalAddGold) originalAddGold(amount);
    if (typeof updateQuestProgress === 'function') {
        updateQuestProgress('gold', amount);
    }
};

// Функция для модификации dropRandomItem
const originalDropRandomItem = window.dropRandomItem;
window.dropRandomItem = function() {
    const dropChance = 0.25;
    if (Math.random() > dropChance) return;
    
    const tier = getLootTierByLevel(window.player.level);
    const items = LOOT_TIERS[tier].items;
    const randomItem = items[Math.floor(Math.random() * items.length)];
    
    if (typeof addItemToInventory === 'function') {
        addItemToInventory(randomItem);
        addPickupEffect(window.player.x, window.player.y, `📦 ${AVAILABLE_ITEMS[randomItem]?.name || randomItem} найден!`);
    }
};

window.LOOT_TIERS = LOOT_TIERS;
window.getLootTierByLevel = getLootTierByLevel;
window.generateEnemyLoot = generateEnemyLoot;