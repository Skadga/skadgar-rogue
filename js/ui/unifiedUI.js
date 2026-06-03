// ========== NEW - unifiedUI.js ==========
// СОЗДАЙ НОВЫЙ ФАЙЛ: js/ui/unifiedUI.js

// Единая функция обновления всего UI
function updateUnifiedUI() {
    if (!window.player) return;
    
    // Основные статы
    const healthEl = document.getElementById('health');
    const maxHealthEl = document.getElementById('maxHealth');
    const levelEl = document.getElementById('level');
    const killsEl = document.getElementById('kills');
    const xpEl = document.getElementById('xp');
    const nextXpEl = document.getElementById('nextXp');
    const damageEl = document.getElementById('damage');
    const armorEl = document.getElementById('armor');
    const goldEl = document.getElementById('playerGold');
    const attackStatusEl = document.getElementById('attackStatus');
    const healthFill = document.getElementById('healthFill');
    
    if (healthEl) healthEl.innerText = Math.floor(window.player.health);
    if (maxHealthEl) maxHealthEl.innerText = window.player.maxHealth;
    if (levelEl) levelEl.innerText = window.player.level;
    if (killsEl) killsEl.innerText = window.player.kills;
    if (xpEl) xpEl.innerText = window.player.xp;
    if (nextXpEl) nextXpEl.innerText = 50 * window.player.level;
    if (damageEl) damageEl.innerText = Math.floor(window.player.damage || window.player.baseDamage);
    if (armorEl) armorEl.innerText = Math.floor(window.player.armor);
    if (goldEl) goldEl.innerText = window.player.gold || 0;
    
    if (healthFill) {
        const percent = (window.player.health / window.player.maxHealth) * 100;
        healthFill.style.width = percent + '%';
    }
    
    if (attackStatusEl) {
        if (window.player.attackCooldown > 0) {
            attackStatusEl.innerHTML = `⚔️ Атака: <span style="color:#ff8888">${Math.ceil(window.player.attackCooldown / 6)}с</span>`;
        } else {
            attackStatusEl.innerHTML = '⚔️ Атака: <span style="color:#88ff88">ГОТОВ</span>';
        }
    }
    
    // Локация
    const locationIndicator = document.getElementById('locationIndicator');
    if (locationIndicator) {
        const isDungeonActive = typeof dungeonActive !== 'undefined' && dungeonActive;
        if (isDungeonActive) {
            locationIndicator.innerHTML = '🏚️ ПОДЗЕМЕЛЬЕ (ОПАСНО)';
            locationIndicator.style.color = '#ff6666';
        } else {
            locationIndicator.innerHTML = '🏝️ ПАРЯЩИЙ ОСТРОВ (МИРНО)';
            locationIndicator.style.color = '#88ff88';
        }
    }
    
    // Данж прогресс
    const dungeonStatEl = document.getElementById('dungeonStat');
    const dungeonProgressEl = document.getElementById('dungeonProgress');
    const dungeonTotalEl = document.getElementById('dungeonTotal');
    
    if (dungeonStatEl) {
        const isDungeonActive = typeof dungeonActive !== 'undefined' && dungeonActive;
        if (isDungeonActive) {
            dungeonStatEl.style.display = "block";
            if (dungeonProgressEl) dungeonProgressEl.innerText = dungeonEnemiesKilled || 0;
            if (dungeonTotalEl) dungeonTotalEl.innerText = dungeonEnemiesToKill || 8;
        } else {
            dungeonStatEl.style.display = "none";
        }
    }
    
    // Инвентарь
    const inventoryGold = document.getElementById('inventoryGold');
    if (inventoryGold) inventoryGold.innerText = window.player.gold || 0;
    
    const inventoryFreeSlots = document.getElementById('inventoryFreeSlots');
    if (inventoryFreeSlots && inventory) {
        inventoryFreeSlots.innerText = inventory.maxSlots - inventory.items.length;
    }
    
    // Магазин
    const playerGoldShop = document.getElementById('playerGoldShop');
    if (playerGoldShop) playerGoldShop.innerText = window.player.gold || 0;
}

// Удаляем старые функции updateUI и updateAllWindowsUI
// Теперь везде используем updateUnifiedUI

window.updateUnifiedUI = updateUnifiedUI;
window.updateUI = updateUnifiedUI; // Для обратной совместимости
window.updateAllWindowsUI = updateUnifiedUI;