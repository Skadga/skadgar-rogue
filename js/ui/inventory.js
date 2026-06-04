// ========== INVENTORY.JS ==========
// ИСПРАВЛЕННАЯ ВЕРСИЯ - РАБОТАЕТ ОТКРЫТИЕ/ЗАКРЫТИЕ

let inventory = {
    slots: [
        { type: 'weapon', item: null, name: 'Оружие', icon: '⚔️' },
        { type: 'armor', item: null, name: 'Броня', icon: '🛡️' },
        { type: 'helmet', item: null, name: 'Шлем', icon: '⛑️' },
        { type: 'ring', item: null, name: 'Кольцо', icon: '💍' },
        { type: 'amulet', item: null, name: 'Амулет', icon: '📿' },
        { type: 'boots', item: null, name: 'Ботинки', icon: '👢' }
    ],
    items: [],
    maxSlots: 20
};

const AVAILABLE_ITEMS = {
    'sword_fire': { name: 'Огненный меч', type: 'weapon', damage: 25, icon: '⚔️🔥', price: 200, rarity: 'rare' },
    'sword_ice': { name: 'Ледяной меч', type: 'weapon', damage: 22, icon: '⚔️❄️', price: 180, rarity: 'rare' },
    'axe': { name: 'Боевой топор', type: 'weapon', damage: 28, icon: '🪓', price: 220, rarity: 'rare' },
    'dagger': { name: 'Кинжал', type: 'weapon', damage: 18, icon: '🗡️', price: 120, rarity: 'common' },
    'plate_armor': { name: 'Латы', type: 'armor', armor: 15, icon: '🛡️', price: 300, rarity: 'rare' },
    'leather_armor': { name: 'Кожаная броня', type: 'armor', armor: 8, icon: '🥋', price: 150, rarity: 'common' },
    'chainmail': { name: 'Кольчуга', type: 'armor', armor: 12, icon: '🔗', price: 220, rarity: 'uncommon' },
    'iron_helmet': { name: 'Железный шлем', type: 'helmet', armor: 5, icon: '⛑️', price: 100, rarity: 'common' },
    'crown': { name: 'Корона', type: 'helmet', armor: 8, icon: '👑', price: 250, rarity: 'rare' },
    'ring_power': { name: 'Кольцо силы', type: 'ring', damage: 5, icon: '💍⚡', price: 180, rarity: 'uncommon' },
    'ring_protection': { name: 'Кольцо защиты', type: 'ring', armor: 4, icon: '💍🛡️', price: 160, rarity: 'uncommon' },
    'amulet_health': { name: 'Амулет здоровья', type: 'amulet', health: 30, icon: '📿❤️', price: 200, rarity: 'rare' },
    'amulet_crit': { name: 'Амулет удачи', type: 'amulet', critChance: 0.05, icon: '📿🍀', price: 220, rarity: 'rare' },
    'speed_boots': { name: 'Ботинки скорости', type: 'boots', speed: 0.3, icon: '👢💨', price: 150, rarity: 'uncommon' },
    'iron_boots': { name: 'Железные ботинки', type: 'boots', armor: 3, icon: '👢🛡️', price: 120, rarity: 'common' }
};

window.AVAILABLE_ITEMS = AVAILABLE_ITEMS;

function updateInventoryUI() {
    var canSell = (typeof shopKeeper !== 'undefined' && shopKeeper.isNearby === true);
    
    for (var i = 0; i < inventory.slots.length; i++) {
        var slot = inventory.slots[i];
        var slotEl = document.getElementById('equip-slot-' + slot.type);
        if (slotEl) {
            if (slot.item && AVAILABLE_ITEMS[slot.item]) {
                var item = AVAILABLE_ITEMS[slot.item];
                var sellPrice = Math.floor(item.price * 0.5);
                if (canSell) {
                    slotEl.innerHTML = '<div class="inventory-item equipped" data-item="' + slot.item + '">' + item.icon + '<span class="item-name">' + item.name + '</span><button class="sell-equipped-btn" onclick="window.sellEquippedItem(\'' + slot.type + '\')">💰 ' + sellPrice + '</button></div>';
                } else {
                    slotEl.innerHTML = '<div class="inventory-item equipped" data-item="' + slot.item + '">' + item.icon + '<span class="item-name">' + item.name + '</span></div>';
                }
                slotEl.style.borderColor = getRarityColor(item.rarity);
            } else {
                slotEl.innerHTML = '<div class="inventory-item empty">' + slot.icon + '<span class="item-name">Пусто</span></div>';
                slotEl.style.borderColor = '#6a3a6a';
            }
        }
    }
    
    var itemsList = document.getElementById('inventory-items-list');
    if (itemsList) {
        itemsList.innerHTML = '';
        for (var j = 0; j < inventory.items.length; j++) {
            var itemId = inventory.items[j];
            var item = AVAILABLE_ITEMS[itemId];
            if (item) {
                var sellPrice = Math.floor(item.price * 0.5);
                var itemEl = document.createElement('div');
                itemEl.className = 'inventory-slot-item rarity-' + item.rarity;
                
                if (canSell) {
                    itemEl.innerHTML = '<div class="item-icon">' + item.icon + '</div><div class="item-info"><div class="item-name">' + item.name + '</div><div class="item-stats">' + getItemStatsText(item) + '</div><div class="item-price">💰 ' + sellPrice + ' (продажа)</div></div><div class="item-buttons"><button class="item-equip-btn" onclick="window.equipItem(\'' + itemId + '\')">Экипировать</button><button class="item-sell-btn" onclick="window.sellItem(\'' + itemId + '\')">Продать</button></div>';
                } else {
                    itemEl.innerHTML = '<div class="item-icon">' + item.icon + '</div><div class="item-info"><div class="item-name">' + item.name + '</div><div class="item-stats">' + getItemStatsText(item) + '</div></div><div class="item-buttons"><button class="item-equip-btn" onclick="window.equipItem(\'' + itemId + '\')">Экипировать</button><button class="item-sell-btn disabled" disabled>🔒 Продажа у торговца</button></div>';
                }
                itemsList.appendChild(itemEl);
            }
        }
    }
    
    var goldSpan = document.getElementById('inventoryGold');
    if (goldSpan) goldSpan.textContent = window.player?.gold || 0;
    
    var freeSlotsSpan = document.getElementById('inventoryFreeSlots');
    if (freeSlotsSpan) freeSlotsSpan.textContent = inventory.maxSlots - inventory.items.length;
}

function getItemStatsText(item) {
    var stats = [];
    if (item.damage) stats.push('🗡️ +' + item.damage + ' урон');
    if (item.armor) stats.push('🛡️ +' + item.armor + ' броня');
    if (item.health) stats.push('❤️ +' + item.health + ' HP');
    if (item.critChance) stats.push('⭐ +' + Math.floor(item.critChance * 100) + '% крит');
    if (item.speed) stats.push('💨 +' + Math.floor(item.speed * 100) + '% скорость');
    if (item.price) stats.push('💰 ' + item.price + ' золота');
    return stats.join(' | ') || 'Нет бонусов';
}

function getRarityColor(rarity) {
    switch(rarity) {
        case 'common': return '#888888';
        case 'uncommon': return '#44aa44';
        case 'rare': return '#4488ff';
        case 'epic': return '#aa44ff';
        case 'legendary': return '#ffaa44';
        default: return '#6a3a6a';
    }
}

function equipItem(itemId) {
    var item = AVAILABLE_ITEMS[itemId];
    if (!item) return;
    
    var slotIndex = -1;
    for (var i = 0; i < inventory.slots.length; i++) {
        if (inventory.slots[i].type === item.type) {
            slotIndex = i;
            break;
        }
    }
    if (slotIndex === -1) return;
    
    if (inventory.slots[slotIndex].item) {
        inventory.items.push(inventory.slots[slotIndex].item);
    }
    
    inventory.slots[slotIndex].item = itemId;
    
    var itemIndex = inventory.items.indexOf(itemId);
    if (itemIndex !== -1) inventory.items.splice(itemIndex, 1);
    
    updateInventoryUI();
    updateStatsFromEquipment();
    if (typeof updateUI === 'function') updateUI();
    if (typeof addPickupEffect === 'function') addPickupEffect(window.player.x, window.player.y, 'Экипировано: ' + item.name);
}

function unequipItem(slotType) {
    var slot = null;
    for (var i = 0; i < inventory.slots.length; i++) {
        if (inventory.slots[i].type === slotType) {
            slot = inventory.slots[i];
            break;
        }
    }
    if (slot && slot.item) {
        inventory.items.push(slot.item);
        slot.item = null;
        updateInventoryUI();
        updateStatsFromEquipment();
        if (typeof updateUI === 'function') updateUI();
        if (typeof addPickupEffect === 'function') addPickupEffect(window.player.x, window.player.y, 'Снято: ' + slot.name);
    }
}

function updateStatsFromEquipment() {
    if (!window.player) return;
    
    var bonusDamage = 0;
    var bonusArmor = 0;
    var bonusHealth = 0;
    var bonusCritChance = 0;
    var bonusSpeed = 0;
    
    for (var i = 0; i < inventory.slots.length; i++) {
        var slot = inventory.slots[i];
        if (slot.item && AVAILABLE_ITEMS[slot.item]) {
            var item = AVAILABLE_ITEMS[slot.item];
            bonusDamage += item.damage || 0;
            bonusArmor += item.armor || 0;
            bonusHealth += item.health || 0;
            bonusCritChance += item.critChance || 0;
            bonusSpeed += item.speed || 0;
        }
    }
    
    window.player.damage = (window.player.baseDamage || 15) + bonusDamage;
    window.player.armor = Math.floor(window.player.level * 1.5) + bonusArmor;
    window.player.damageReduction = Math.min(0.6, window.player.armor * 0.02);
    window.player.critChance = Math.min(0.45, 0.1 + window.player.level * 0.012 + bonusCritChance);
    
    if (bonusHealth > 0) {
        window.player.maxHealth += bonusHealth;
        window.player.health = Math.min(window.player.health + bonusHealth, window.player.maxHealth);
    }
}

function addItemToInventory(itemId) {
    if (inventory.items.length >= inventory.maxSlots) {
        if (typeof addPickupEffect === 'function') addPickupEffect(window.player.x, window.player.y, 'Инвентарь полон!');
        return false;
    }
    inventory.items.push(itemId);
    if (typeof addPickupEffect === 'function') addPickupEffect(window.player.x, window.player.y, 'Найден: ' + AVAILABLE_ITEMS[itemId].name);
    return true;
}

function dropRandomItem() {
    var dropChance = 0.15;
    if (Math.random() > dropChance) return;
    
    var itemIds = Object.keys(AVAILABLE_ITEMS);
    var randomItem = itemIds[Math.floor(Math.random() * itemIds.length)];
    addItemToInventory(randomItem);
}

function sellItem(itemId) {
    if (typeof shopKeeper !== 'undefined' && shopKeeper.isNearby !== true) {
        if (typeof addPickupEffect === 'function') addPickupEffect(window.player.x, window.player.y, 'Подойди к торговцу, чтобы продать предметы!');
        return;
    }
    
    var item = AVAILABLE_ITEMS[itemId];
    if (!item) return;
    
    var sellPrice = Math.floor(item.price * 0.5);
    
    var itemIndex = inventory.items.indexOf(itemId);
    if (itemIndex !== -1) {
        inventory.items.splice(itemIndex, 1);
        
        window.player.gold = (window.player.gold || 0) + sellPrice;
        
        updateInventoryUI();
        if (typeof updateUI === 'function') updateUI();
        if (typeof addPickupEffect === 'function') addPickupEffect(window.player.x, window.player.y, 'Продано: ' + item.name + ' за ' + sellPrice + '💰');
        
        if (typeof updateShopUI === 'function') updateShopUI();
    }
}

function sellEquippedItem(slotType) {
    if (typeof shopKeeper !== 'undefined' && shopKeeper.isNearby !== true) {
        if (typeof addPickupEffect === 'function') addPickupEffect(window.player.x, window.player.y, 'Подойди к торговцу, чтобы продать предметы!');
        return;
    }
    
    var slot = null;
    for (var i = 0; i < inventory.slots.length; i++) {
        if (inventory.slots[i].type === slotType) {
            slot = inventory.slots[i];
            break;
        }
    }
    if (!slot || !slot.item) {
        if (typeof addPickupEffect === 'function') addPickupEffect(window.player.x, window.player.y, 'Нет предмета в этом слоте!');
        return;
    }
    
    var itemId = slot.item;
    var item = AVAILABLE_ITEMS[itemId];
    if (!item) return;
    
    var sellPrice = Math.floor(item.price * 0.5);
    
    slot.item = null;
    
    window.player.gold = (window.player.gold || 0) + sellPrice;
    
    updateInventoryUI();
    updateStatsFromEquipment();
    if (typeof updateUI === 'function') updateUI();
    if (typeof addPickupEffect === 'function') addPickupEffect(window.player.x, window.player.y, 'Продано: ' + item.name + ' за ' + sellPrice + '💰');
    
    if (typeof updateShopUI === 'function') updateShopUI();
}

function initInventoryUI() {
    var inventoryBtn = document.getElementById('inventoryBtn');
    if (inventoryBtn) {
        inventoryBtn.addEventListener('click', function() {
            if (typeof window.openInventory === 'function') window.openInventory();
        });
    }
    console.log('initInventoryUI completed');
}

// ========== ГЛАВНЫЕ ФУНКЦИИ ОТКРЫТИЯ/ЗАКРЫТИЯ ==========
window.openInventory = function() {
    if (window.windows && window.windows['window-inventory']) {
        window.windows['window-inventory'].toggleVisibility();
        if (typeof updateInventoryUI === 'function') updateInventoryUI();
    }
};

window.closeInventory = function() {
    if (window.windows && window.windows['window-inventory']) {
        const win = window.windows['window-inventory'];
        if (win.visible) {
            win.toggleVisibility();
        }
    }
    updateStatsFromEquipment();
    if (typeof updateUI === 'function') updateUI();
};

// Экспорт
window.inventory = inventory;
window.equipItem = equipItem;
window.unequipItem = unequipItem;
window.addItemToInventory = addItemToInventory;
window.dropRandomItem = dropRandomItem;
window.initInventoryUI = initInventoryUI;
window.sellItem = sellItem;
window.sellEquippedItem = sellEquippedItem;
window.updateInventoryUI = updateInventoryUI;
window.AVAILABLE_ITEMS = AVAILABLE_ITEMS;

console.log('inventory.js loaded, openInventory defined:', typeof window.openInventory);