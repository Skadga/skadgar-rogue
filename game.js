// ========== GAME.JS ==========
// ОБНОВЛЁННЫЙ - ДВИЖЕНИЕ ТОЛЬКО ПРИ ЗАЖАТОЙ ЛКМ И ДВИЖЕНИИ МЫШИ

window.gameActive = true;
let isPaused = false;
let lastPortalInteractionTime = 0;
const PORTAL_COOLDOWN = 500;
let mouseMoveTimeout = null;
let lastTimestamp = 0;

// Инициализация глобальных систем
window.projectiles = [];

// Флаги для управления движением
let isDragging = false;      // Зажата ли ЛКМ
let lastMouseX = 0, lastMouseY = 0;  // Последняя позиция мыши для определения движения
let moveTargetTile = null;   // Целевая клетка для движения

function onMouseMove(e) {
    if (!window.gameActive || isPaused) return;
    if (!window.canvas) return;
    
    if (mouseMoveTimeout) return;
    mouseMoveTimeout = setTimeout(() => { mouseMoveTimeout = null; }, 16);
    
    const rect = window.canvas.getBoundingClientRect();
    const scaleX = (window.WIDTH || 900) / rect.width;
    const scaleY = (window.HEIGHT || 550) / rect.height;
    
    mouseScreenX = (e.clientX - rect.left) * scaleX;
    mouseScreenY = (e.clientY - rect.top) * scaleY;
    
    mouseTile = screenToTileWithCamera(mouseScreenX, mouseScreenY);
    
    const playerScreen = tileToScreenWithCamera(window.player.x, window.player.y);
    const lookAngle = Math.atan2(mouseScreenY - playerScreen.y, mouseScreenX - playerScreen.x);
    window.player.direction = lookAngle;
    
    // Поворот верхней части тела в сторону мыши
    window.player.upperBodyAngle = lookAngle;
    window.player.lowerBodyAngle = lookAngle;
    
    const newHoveredEnemy = getEnemyAtTile(mouseTile.x, mouseTile.y);
    if (newHoveredEnemy !== hoveredEnemy) {
        hoveredEnemy = newHoveredEnemy;
        if (hoveredEnemy) {
            window.canvas.style.cursor = 'pointer';
            hoveredPortal = null;
        } else {
            checkPortalHover(mouseTile.x, mouseTile.y);
        }
    }
    
    if (!hoveredEnemy) checkPortalHover(mouseTile.x, mouseTile.y);
    
    // ========== НОВАЯ ЛОГИКА ДВИЖЕНИЯ ==========
    // Если ЛКМ зажата И мышь двигается
    if (isDragging && window.gameActive && !isPaused) {
        // Проверяем, двигается ли мышь
        const dx = Math.abs(e.clientX - lastMouseX);
        const dy = Math.abs(e.clientY - lastMouseY);
        
        if (dx > 3 || dy > 3) {  // Если мышь реально двигается
            let targetTile = { x: mouseTile.x, y: mouseTile.y };
            if (isWalkable(targetTile.x, targetTile.y)) {
                moveTargetTile = targetTile;
            } else {
                // Ищем ближайшую проходимую клетку
                let found = false;
                for (let radius = 1; radius <= 3 && !found; radius++) {
                    for (let dy = -radius; dy <= radius && !found; dy++) {
                        for (let dx = -radius; dx <= radius && !found; dx++) {
                            let nx = targetTile.x + dx;
                            let ny = targetTile.y + dy;
                            if (isWalkable(nx, ny)) {
                                moveTargetTile = { x: nx, y: ny };
                                found = true;
                            }
                        }
                    }
                }
            }
            if (moveTargetTile) {
                currentTarget = moveTargetTile;
                currentPath = [];
            }
        }
    }
    
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
}

function checkPortalHover(tileX, tileY) {
    if (!MAP) return;
    if (tileY < 0 || tileY >= MAP_H || tileX < 0 || tileX >= MAP_W) return;
    if (!MAP[tileY]) return;
    
    const tileType = MAP[tileY][tileX];
    const isPortal = (tileType === 10 || tileType === 12);
    
    if (isPortal && !hoveredPortal) {
        hoveredPortal = { x: tileX, y: tileY, type: tileType };
        if (window.canvas) window.canvas.style.cursor = 'pointer';
    } else if (!isPortal && hoveredPortal) {
        hoveredPortal = null;
        if (window.canvas) window.canvas.style.cursor = 'crosshair';
    }
}

function isPlayerNearPortal() {
    if (!window.player) return false;
    
    const px = Math.floor(window.player.x);
    const py = Math.floor(window.player.y);
    
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const x = px + dx;
            const y = py + dy;
            
            if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) continue;
            if (!MAP[y]) continue;
            
            const tileType = MAP[y][x];
            if (tileType === 10 || tileType === 12) {
                return { x, y, type: tileType };
            }
        }
    }
    return false;
}

function checkPortalProximity() {
    if (!window.player) return null;
    
    const px = Math.floor(window.player.x);
    const py = Math.floor(window.player.y);
    
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const x = px + dx;
            const y = py + dy;
            
            if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) continue;
            if (!MAP[y]) continue;
            
            const tileType = MAP[y][x];
            if (tileType === 10 || tileType === 12) {
                return { x, y, type: tileType };
            }
        }
    }
    return null;
}

function showPortalHint() {
    const nearbyPortal = checkPortalProximity();
    const isNear = nearbyPortal !== null;
    
    let portalHint = document.getElementById('portalHint');
    if (!portalHint) {
        portalHint = document.createElement('div');
        portalHint.id = 'portalHint';
        portalHint.className = 'portal-hint';
        document.body.appendChild(portalHint);
    }
    
    if (isNear && window.gameActive && !isPaused) {
        const isDungeonActive = typeof dungeonActive !== 'undefined' && dungeonActive;
        const portalType = nearbyPortal.type;
        
        if (portalType === 10 && !isDungeonActive) {
            portalHint.innerHTML = '🌀 ВОЙТИ В ДАНЖ 🌀<br><span>Нажми E или ПКМ</span>';
            portalHint.style.display = 'block';
        } else if (portalType === 12 && isDungeonActive) {
            portalHint.innerHTML = '⭐ ВЕРНУТЬСЯ ДОМОЙ ⭐<br><span>Нажми E или ПКМ</span>';
            portalHint.style.display = 'block';
        } else {
            portalHint.style.display = 'none';
        }
    } else {
        portalHint.style.display = 'none';
    }
}

function tryActivatePortal() {
    if (!window.gameActive || isPaused) return false;
    if (!window.player) return false;
    
    const now = Date.now();
    if (now - lastPortalInteractionTime < PORTAL_COOLDOWN) return false;
    
    const nearbyPortal = isPlayerNearPortal();
    if (!nearbyPortal) return false;
    
    lastPortalInteractionTime = now;
    
    if (nearbyPortal.type === 10) {
        addPickupEffect(window.player.x, window.player.y, "Активация портала в данж...");
        if (typeof enterDungeon === 'function') enterDungeon();
        return true;
    }
    
    if (nearbyPortal.type === 12) {
        addPickupEffect(window.player.x, window.player.y, "Активация портала домой...");
        if (typeof exitDungeon === 'function') exitDungeon();
        return true;
    }
    
    return false;
}

function onMouseDown(e) {
    if (!window.gameActive || isPaused) return;
    if (!window.canvas) return;
    e.preventDefault();
    
    if (e.button === 0) { // ЛКМ
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    } else if (e.button === 2) { // ПКМ
        e.preventDefault();
        if (!tryActivatePortal()) {
            if (typeof playerAttack === 'function') playerAttack();
        }
    }
}

function onMouseUp(e) {
    if (isPaused) return;
    if (e.button === 0) {
        isDragging = false;
        moveTargetTile = null;
        currentTarget = null;
        currentPath = [];
        window.moving = false;
    }
}

function openPauseMenu() {
    if (!window.gameActive) return;
    isPaused = true;
    const menu = document.getElementById('pauseMenu');
    if (menu) menu.style.display = 'flex';
    if (typeof updateAllSlotsInfo === 'function') updateAllSlotsInfo();
}

function closePauseMenu() {
    isPaused = false;
    const menu = document.getElementById('pauseMenu');
    if (menu) menu.style.display = 'none';
}

function togglePauseMenu() {
    if (isPaused) closePauseMenu();
    else openPauseMenu();
}

function resetGame() {
    if (typeof resetPlayer === 'function') resetPlayer();
    window.gameActive = true;
    if (typeof loadMap === 'function') loadMap();
    
    if (typeof dungeonActive !== 'undefined') {
        dungeonActive = false;
        dungeonEnemiesKilled = 0;
        bossSpawned = false;
        bossDefeated = false;
    }
    if (typeof updateGlobalVariables === 'function') updateGlobalVariables();
    
    if (typeof findSpawnPointNearPortal === 'function') {
        const spawnPos = findSpawnPointNearPortal();
        window.player.x = spawnPos.x;
        window.player.y = spawnPos.y;
    }
    
    isDragging = false;
    moveTargetTile = null;
    isMouseDown = false;
    moveToMouse = false;
    currentPath = [];
    currentTarget = null;
    hoveredEnemy = null;
    hoveredPortal = null;
    floatingDamage = [];
    pickupEffects = [];
    window.moving = false;
    lastPortalInteractionTime = 0;
    
    if (typeof particleSystem !== 'undefined' && particleSystem) particleSystem.clear();
    window.projectiles = [];
    
    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) exploredTiles[y][x] = false;
    }
    
    window.enemies = [];
    if (typeof updateUI === 'function') updateUI();
    if (typeof updateLocationDisplay === 'function') updateLocationDisplay();
    addPickupEffect(window.player.x, window.player.y, "Игра сброшена!");
    
    if (typeof placeShopKeeper === 'function') placeShopKeeper();
    
    if (typeof shopInventory !== 'undefined') {
        shopInventory.armorUpgrade.currentUpgrade = 0;
        shopInventory.damageUpgrade.currentUpgrade = 0;
    }
    if (typeof playerPotions !== 'undefined') {
        playerPotions.health = 3;
    }
}

// Подключаем обработчики событий
if (window.canvas) {
    window.canvas.addEventListener('mousemove', onMouseMove);
    window.canvas.addEventListener('mousedown', onMouseDown);
    window.canvas.addEventListener('mouseup', onMouseUp);
    window.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

window.addEventListener('mouseup', onMouseUp);

window.addEventListener('keydown', (e) => { 
    if (e.code === 'KeyR' && !isPaused) {
        resetGame();
    }
    if (e.code === 'Escape') { 
        e.preventDefault(); 
        const shopMenu = document.getElementById('shopMenu');
        if (shopMenu && shopMenu.style.display === 'flex') {
            if (typeof closeShop === 'function') closeShop();
            return;
        }
        togglePauseMenu(); 
    }
    if (e.code === 'KeyE' && !isPaused) { 
        e.preventDefault(); 
        const activated = tryActivatePortal();
        if (activated && typeof playPortalSound === 'function') {
            playPortalSound();
        }
    }
});

const resetBtn = document.getElementById('resetBtn');
if (resetBtn) resetBtn.addEventListener('click', resetGame);

function gameLoop(timestamp) {
    // Обновление анимаций
    const deltaTime = typeof updateGlobalAnimation === 'function' ? updateGlobalAnimation(timestamp) : 0.016;
    
    if (timestamp - lastTimestamp < 16) {
        requestAnimationFrame(gameLoop);
        return;
    }
    lastTimestamp = timestamp;
    if (typeof frameCount !== 'undefined') frameCount++;
    
    if (typeof updateCamera === 'function') updateCamera();
    
    if (window.gameActive && !isPaused) {
        if (typeof moveAlongPath === 'function') moveAlongPath();
        if (typeof updateWalkAnim === 'function') updateWalkAnim();
        if (typeof updateAttackAnim === 'function') updateAttackAnim();
        if (typeof updateHitFlash === 'function') updateHitFlash();
        if (typeof updateEffects === 'function') updateEffects();
        if (typeof updateRegen === 'function') updateRegen();
        if (typeof updateCooldowns === 'function') updateCooldowns();
        if (typeof updateEnemies === 'function') updateEnemies();
        if (typeof preventEnemyOnPlayer === 'function') preventEnemyOnPlayer();
        if (typeof updateProjectiles === 'function') updateProjectiles();
        if (typeof updateParticles === 'function') updateParticles(deltaTime);
        if (typeof checkShopKeeperProximity === 'function') checkShopKeeperProximity();
        checkPortalProximity();
        showPortalHint();
    }
    
    if (typeof drawMap === 'function') drawMap();
    if (typeof drawDungeonAtmosphere === 'function') drawDungeonAtmosphere();
    if (typeof drawEnemies === 'function') drawEnemies();
    if (typeof drawPlayerBody === 'function') drawPlayerBody();
    if (typeof drawProjectiles === 'function') drawProjectiles();
    if (typeof drawParticles === 'function') drawParticles();
    if (typeof drawMoveTarget === 'function') drawMoveTarget();
    if (typeof drawEffects === 'function') drawEffects();
    if (typeof drawMinimap === 'function') drawMinimap();
    
    if (!window.gameActive && ctx) {
        ctx.font = "bold 32px monospace";
        ctx.fillStyle = "#ffcc66";
        ctx.shadowBlur = 5;
        ctx.textAlign = "center";
        ctx.fillText("YOU DIED", (window.WIDTH || 900)/2, (window.HEIGHT || 550)/2);
        ctx.font = "16px monospace";
        ctx.fillStyle = "#ffaaaa";
        ctx.fillText("Press R to restart", (window.WIDTH || 900)/2, (window.HEIGHT || 550)/2 + 50);
        ctx.textAlign = "left";
        ctx.shadowBlur = 0;
    }
    
    if (isPaused && ctx) {
        ctx.font = "bold 32px monospace";
        ctx.fillStyle = "#ffcc88";
        ctx.shadowBlur = 5;
        ctx.textAlign = "center";
        ctx.fillText("PAUSE", (window.WIDTH || 900)/2, (window.HEIGHT || 550)/2);
        ctx.font = "14px monospace";
        ctx.fillStyle = "#ffaaaa";
        ctx.fillText("Press ESC to continue", (window.WIDTH || 900)/2, (window.HEIGHT || 550)/2 + 40);
        ctx.textAlign = "left";
        ctx.shadowBlur = 0;
    }
    
    requestAnimationFrame(gameLoop);
}

// Запуск игры
setTimeout(() => {
    if (typeof loadMap === 'function') loadMap();
    if (typeof resetPlayer === 'function') resetPlayer();
    if (typeof findSpawnPointNearPortal === 'function') {
        const spawnPos = findSpawnPointNearPortal();
        window.player.x = spawnPos.x;
        window.player.y = spawnPos.y;
    }
    window.enemies = [];
    if (typeof updateLocationDisplay === 'function') updateLocationDisplay();
    
    if (typeof placeShopKeeper === 'function') placeShopKeeper();
    if (typeof initShopControls === 'function') initShopControls();
    
    gameLoop();
}, 100);