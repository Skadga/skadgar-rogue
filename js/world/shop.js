// ========== SHOP.JS ==========
// Торговец в домашней зоне + оружие

let shopInventory = {
    healthPotions: { price: 50, count: 99, healAmount: 30 },
    armorUpgrade: { price: 100, stat: "armor", value: 3, maxUpgrades: 10, currentUpgrade: 0 },
    damageUpgrade: { price: 120, stat: "damage", value: 4, maxUpgrades: 10, currentUpgrade: 0 },
    weapons: {
        sword: { name: 'Меч', type: 'weapon', damage: 10, icon: '⚔️', price: 80, rarity: 'common' },
        axe: { name: 'Топор', type: 'weapon', damage: 12, icon: '🪓', price: 100, rarity: 'common' },
        dagger: { name: 'Кинжал', type: 'weapon', damage: 8, icon: '🗡️', price: 60, rarity: 'common', speed: 0.1 },
        mace: { name: 'Булава', type: 'weapon', damage: 14, icon: '🔨', price: 120, rarity: 'common' }
    }
};

let playerPotions = { health: 3 };

// NPC Торговец
let shopKeeper = {
    x: null, y: null,
    name: "ЛОРД АЛЬДРИК",
    dialog: "Путник, нужны припасы? Золото решает всё!",
    isNearby: false
};

// Функция размещения торговца рядом с порталом
function placeShopKeeper() {
    if (!homePortalPosition) return;
    if (typeof dungeonActive !== 'undefined' && dungeonActive) return;
    
    // Убираем старый тайл торговца если был
    if (shopKeeper.x && shopKeeper.y && MAP[shopKeeper.y] && MAP[shopKeeper.y][shopKeeper.x] === 25) {
        MAP[shopKeeper.y][shopKeeper.x] = 0;
    }
    
    // Ищем свободную клетку рядом с порталом
    const directions = [
        { dx: 2, dy: 0 }, { dx: -2, dy: 0 }, 
        { dx: 0, dy: 2 }, { dx: 0, dy: -2 },
        { dx: 2, dy: 1 }, { dx: -2, dy: 1 },
        { dx: 1, dy: 2 }, { dx: -1, dy: 2 }
    ];
    
    for (let dir of directions) {
        const x = homePortalPosition.x + dir.dx;
        const y = homePortalPosition.y + dir.dy;
        
        if (x > 0 && x < MAP_W - 1 && y > 0 && y < MAP_H - 1) {
            if (MAP[y][x] === 0 || MAP[y][x] === 20 || MAP[y][x] === 21 || MAP[y][x] === 22 || MAP[y][x] === 23) {
                shopKeeper.x = x;
                shopKeeper.y = y;
                MAP[y][x] = 25;
                return;
            }
        }
    }
    
    // fallback позиция
    shopKeeper.x = homePortalPosition.x + 2;
    shopKeeper.y = homePortalPosition.y;
    if (MAP[shopKeeper.y] && MAP[shopKeeper.y][shopKeeper.x] === 0) {
        MAP[shopKeeper.y][shopKeeper.x] = 25;
    }
}

function openShop() {
    if (typeof dungeonActive !== 'undefined' && dungeonActive) {
        addPickupEffect(window.player.x, window.player.y, "Торговец только дома!");
        return;
    }
    
    const shopMenu = document.getElementById('shopMenu');
    if (shopMenu) {
        updateShopUI();
        shopMenu.style.display = 'flex';
        if (typeof isPaused !== 'undefined') isPaused = true;
    }
}

function closeShop() {
    const shopMenu = document.getElementById('shopMenu');
    if (shopMenu) shopMenu.style.display = 'none';
    if (typeof isPaused !== 'undefined') isPaused = false;
    updateUI();
}

function updateShopUI() {
    // Обновляем отображение золота
    const goldEl = document.getElementById('playerGoldShop');
    if (goldEl) goldEl.textContent = window.player.gold || 0;
    
    // Зелья здоровья
    const healthPriceSpan = document.getElementById('healthPotionPrice');
    const healthCountSpan = document.getElementById('healthPotionCount');
    if (healthPriceSpan) healthPriceSpan.textContent = shopInventory.healthPotions.price;
    if (healthCountSpan) healthCountSpan.textContent = playerPotions.health;
    
    // Улучшение брони
    const armorPriceSpan = document.getElementById('armorUpgradePrice');
    const armorValueSpan = document.getElementById('armorUpgradeValue');
    if (armorPriceSpan) {
        const currentUpgrade = shopInventory.armorUpgrade.currentUpgrade;
        const price = shopInventory.armorUpgrade.price + currentUpgrade * 20;
        armorPriceSpan.textContent = price;
    }
    if (armorValueSpan) armorValueSpan.textContent = shopInventory.armorUpgrade.currentUpgrade;
    
    // Улучшение урона
    const damagePriceSpan = document.getElementById('damageUpgradePrice');
    const damageValueSpan = document.getElementById('damageUpgradeValue');
    if (damagePriceSpan) {
        const currentUpgrade = shopInventory.damageUpgrade.currentUpgrade;
        const price = shopInventory.damageUpgrade.price + currentUpgrade * 25;
        damagePriceSpan.textContent = price;
    }
    if (damageValueSpan) damageValueSpan.textContent = shopInventory.damageUpgrade.currentUpgrade;
    
    // Обновляем цены на оружие
    updateWeaponPrices();
}

function updateWeaponPrices() {
    const weaponIds = ['sword', 'axe', 'dagger', 'mace'];
    for (let id of weaponIds) {
        const priceSpan = document.getElementById(`${id}Price`);
        if (priceSpan && shopInventory.weapons[id]) {
            priceSpan.textContent = shopInventory.weapons[id].price;
        }
    }
}

function buyHealthPotion() {
    const gold = window.player.gold || 0;
    const price = shopInventory.healthPotions.price;
    
    if (gold >= price) {
        window.player.gold = gold - price;
        playerPotions.health++;
        updateShopUI();
        updateUI();
        addPickupEffect(window.player.x, window.player.y, `Куплено зелье здоровья!`);
    } else {
        addPickupEffect(window.player.x, window.player.y, `Не хватает золота! Нужно ${price}`);
    }
}

function useHealthPotion() {
    if (playerPotions.health <= 0) {
        addPickupEffect(window.player.x, window.player.y, `Нет зелий! Купи у торговца`);
        return;
    }
    
    if (window.player.health >= window.player.maxHealth) {
        addPickupEffect(window.player.x, window.player.y, `Здоровье уже полное`);
        return;
    }
    
    playerPotions.health--;
    const healAmount = shopInventory.healthPotions.healAmount;
    window.player.health = Math.min(window.player.maxHealth, window.player.health + healAmount);
    updateUI();
    updateShopUI();
    addPickupEffect(window.player.x, window.player.y, `+${healAmount} HP`);
}

function buyArmorUpgrade() {
    const gold = window.player.gold || 0;
    const currentUpgrade = shopInventory.armorUpgrade.currentUpgrade;
    
    if (currentUpgrade >= shopInventory.armorUpgrade.maxUpgrades) {
        addPickupEffect(window.player.x, window.player.y, `Максимальное улучшение брони!`);
        return;
    }
    
    const price = shopInventory.armorUpgrade.price + currentUpgrade * 20;
    
    if (gold >= price) {
        window.player.gold = gold - price;
        shopInventory.armorUpgrade.currentUpgrade++;
        window.player.armor += shopInventory.armorUpgrade.value;
        window.player.damageReduction = Math.min(0.6, window.player.armor * 0.02);
        updateShopUI();
        updateUI();
        addPickupEffect(window.player.x, window.player.y, `Броня улучшена! +${shopInventory.armorUpgrade.value} брони`);
    } else {
        addPickupEffect(window.player.x, window.player.y, `Не хватает золота! Нужно ${price}`);
    }
}

function buyDamageUpgrade() {
    const gold = window.player.gold || 0;
    const currentUpgrade = shopInventory.damageUpgrade.currentUpgrade;
    
    if (currentUpgrade >= shopInventory.damageUpgrade.maxUpgrades) {
        addPickupEffect(window.player.x, window.player.y, `Максимальное улучшение урона!`);
        return;
    }
    
    const price = shopInventory.damageUpgrade.price + currentUpgrade * 25;
    
    if (gold >= price) {
        window.player.gold = gold - price;
        shopInventory.damageUpgrade.currentUpgrade++;
        window.player.damage += shopInventory.damageUpgrade.value;
        updateShopUI();
        updateUI();
        addPickupEffect(window.player.x, window.player.y, `Урон улучшен! +${shopInventory.damageUpgrade.value} урона`);
    } else {
        addPickupEffect(window.player.x, window.player.y, `Не хватает золота! Нужно ${price}`);
    }
}

// Купить оружие
function buyWeapon(weaponId) {
    const gold = window.player.gold || 0;
    const weapon = shopInventory.weapons[weaponId];
    if (!weapon) return;
    
    const price = weapon.price;
    
    if (gold >= price) {
        window.player.gold = gold - price;
        
        // Создаём предмет для инвентаря
        const itemId = `weapon_${weaponId}_${Date.now()}`;
        
        // Добавляем предмет в AVAILABLE_ITEMS если его там нет
        if (typeof window.AVAILABLE_ITEMS !== 'undefined') {
            window.AVAILABLE_ITEMS[itemId] = {
                name: weapon.name,
                type: weapon.type,
                damage: weapon.damage,
                icon: weapon.icon,
                price: weapon.price,
                rarity: weapon.rarity
            };
            // Добавляем в инвентарь
            if (typeof addItemToInventory === 'function') {
                addItemToInventory(itemId);
            }
        }
        
        updateUI();
        updateShopUI();
        addPickupEffect(window.player.x, window.player.y, `Куплено: ${weapon.name}!`);
    } else {
        addPickupEffect(window.player.x, window.player.y, `Не хватает золота! Нужно ${price}`);
    }
}

// Добавляем золото с убитых врагов
function addGold(amount) {
    if (!window.player.gold) window.player.gold = 0;
    window.player.gold += amount;
    updateUI();
    addPickupEffect(window.player.x, window.player.y, `+${amount} 🪙`);
    
    // Обновляем отображение в магазине если открыт
    const goldShopEl = document.getElementById('playerGoldShop');
    if (goldShopEl) goldShopEl.textContent = window.player.gold;
}

// Проверка близости к торговцу для отображения кнопки
function checkShopKeeperProximity() {
    if (!window.player || !shopKeeper.x) return false;
    if (typeof dungeonActive !== 'undefined' && dungeonActive) return false;
    
    const dx = Math.abs(window.player.x - shopKeeper.x);
    const dy = Math.abs(window.player.y - shopKeeper.y);
    const distance = Math.max(dx, dy);
    const isNear = distance <= 1.5;
    
    shopKeeper.isNearby = isNear;
    
    const shopHint = document.getElementById('shopHint');
    if (shopHint) {
        shopHint.style.display = isNear ? 'block' : 'none';
    }
    
    return isNear;
}

// Рисуем торговца на карте
function drawShopKeeper() {
    if (!ctx || !shopKeeper.x) return;
    if (typeof dungeonActive !== 'undefined' && dungeonActive) return;
    if (!exploredTiles[shopKeeper.y]?.[shopKeeper.x]) return;
    if (!isInVision(shopKeeper.x, shopKeeper.y, window.player.x, window.player.y, window.player.direction)) return;
    
    const pos = tileToScreenWithCamera(shopKeeper.x, shopKeeper.y);
    
    ctx.shadowBlur = 5;
    
    // Тело торговца
    ctx.fillStyle = "#8B6914";
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y - 8, 10, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Мантия
    ctx.fillStyle = "#5a3a2a";
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y - 2, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Борода
    ctx.fillStyle = "#ddccaa";
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y - 4, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Капюшон
    ctx.fillStyle = "#3a2a1a";
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y - 14, 9, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Мешочек с золотом
    ctx.fillStyle = "#ccaa44";
    ctx.beginPath();
    ctx.ellipse(pos.x + 8, pos.y - 4, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Знак "$" над головой
    ctx.font = "bold 16px monospace";
    ctx.fillStyle = "#ffdd88";
    ctx.shadowBlur = 3;
    ctx.fillText("💰", pos.x - 6, pos.y - 20);
    
    // Имя при наведении
    if (shopKeeper.isNearby) {
        ctx.font = "bold 10px monospace";
        ctx.fillStyle = "#ffcc88";
        ctx.fillText(shopKeeper.name, pos.x - 28, pos.y - 28);
        ctx.fillStyle = "#88ff88";
        ctx.font = "9px monospace";
        ctx.fillText("Нажми G для магазина", pos.x - 48, pos.y - 36);
    }
    
    ctx.shadowBlur = 0;
}

// Добавляем обработчик клавиши G для открытия магазина
function initShopControls() {
    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyG' && !isPaused && window.gameActive) {
            if (shopKeeper.isNearby) {
                openShop();
            } else if (typeof dungeonActive === 'undefined' || !dungeonActive) {
                addPickupEffect(window.player.x, window.player.y, "Подойди к торговцу ближе");
            }
        }
    });
}

// Экспорт
window.openShop = openShop;
window.closeShop = closeShop;
window.buyHealthPotion = buyHealthPotion;
window.useHealthPotion = useHealthPotion;
window.buyArmorUpgrade = buyArmorUpgrade;
window.buyDamageUpgrade = buyDamageUpgrade;
window.buyWeapon = buyWeapon;
window.addGold = addGold;
window.shopKeeper = shopKeeper;
window.checkShopKeeperProximity = checkShopKeeperProximity;
window.drawShopKeeper = drawShopKeeper;
window.placeShopKeeper = placeShopKeeper;
window.initShopControls = initShopControls;
window.playerPotions = playerPotions;
window.shopInventory = shopInventory;