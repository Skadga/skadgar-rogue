// ========== COMBAT.JS ==========
// АВТО-АТАКА РАБОТАЕТ СТАБИЛЬНО

let autoAttackEnabled = false;
let autoAttackInterval = null;
let particleSystem = new ParticleSystem();
window.particleSystem = particleSystem;

function getCurrentDamage() {
    let damage = window.player.baseDamage || 15;
    
    if (typeof inventory !== 'undefined' && inventory.slots) {
        for (let slot of inventory.slots) {
            if (slot.item && window.AVAILABLE_ITEMS && window.AVAILABLE_ITEMS[slot.item]) {
                const item = window.AVAILABLE_ITEMS[slot.item];
                if (item.damage) damage += item.damage;
            }
        }
    }
    
    if (typeof currentWeapon !== 'undefined' && window.WeaponTypes && window.WeaponTypes[currentWeapon]) {
        damage += window.WeaponTypes[currentWeapon].damage;
    }
    
    return damage;
}

function getAttackRange() {
    if (typeof currentWeapon !== 'undefined' && window.WeaponTypes && window.WeaponTypes[currentWeapon]) {
        return window.WeaponTypes[currentWeapon].range;
    }
    return 1.5;
}

function isRangedWeapon() {
    if (typeof currentWeapon === 'undefined') return false;
    if (!window.WeaponTypes || !window.WeaponTypes[currentWeapon]) return false;
    const weapon = window.WeaponTypes[currentWeapon];
    return weapon.projectile !== null;
}

function playerAttack() {
    if (!window.gameActive) return;
    if (window.player.attackCooldown > 0) return;
    
    let targetEnemy = hoveredEnemy;
    
    if (autoAttackEnabled && !targetEnemy) {
        targetEnemy = getNearestEnemyInRange();
        if (targetEnemy) {
            hoveredEnemy = targetEnemy;
        }
    }
    
    if (!targetEnemy) return;
    
    const dx = Math.abs(targetEnemy.x - window.player.x);
    const dy = Math.abs(targetEnemy.y - window.player.y);
    const distance = Math.max(dx, dy);
    const range = getAttackRange();
    
    let canAttack = distance <= range;
    if (canAttack && typeof hasLineOfSight === 'function') {
        canAttack = hasLineOfSight(window.player.x, window.player.y, targetEnemy.x, targetEnemy.y);
    }
    if (canAttack && typeof isInVision === 'function') {
        canAttack = isInVision(targetEnemy.x, targetEnemy.y, window.player.x, window.player.y, window.player.direction);
    }
    
    if (canAttack) {
        window.player.attackCooldown = 14;
        if (typeof startAttack === 'function') startAttack();
        
        let damage = getCurrentDamage();
        let isCritical = false;
        
        if (Math.random() < window.player.critChance) {
            damage *= window.player.critDamage;
            isCritical = true;
        }
        
        damage *= 0.85 + Math.random() * 0.3;
        const finalDamage = Math.floor(damage);
        
        targetEnemy.health -= finalDamage;
        
        if (typeof addFloatingDamage === 'function') {
            addFloatingDamage(targetEnemy.x, targetEnemy.y, finalDamage, isCritical);
        }
        
        if (typeof tileToScreen === 'function') {
            const hitPos = tileToScreen(targetEnemy.x, targetEnemy.y);
            if (isCritical) {
                if (particleSystem) particleSystem.addSparkBurst(hitPos.x, hitPos.y - 15, 20);
                if (typeof playHitSound === 'function') playHitSound(true, false);
            } else {
                if (particleSystem) particleSystem.addBloodBurst(hitPos.x, hitPos.y - 15, 12);
                if (typeof playHitSound === 'function') playHitSound(false, false);
            }
        }
        
        if (targetEnemy.health <= 0) {
            if (typeof playDeathSound === 'function') playDeathSound();
            hoveredEnemy = null;
        }
    } else if (!autoAttackEnabled && typeof addPickupEffect === 'function') {
        addPickupEffect(window.player.x, window.player.y, "НЕ В ЗОНЕ ДОСТУПА!");
    }
}

function getNearestEnemyInRange() {
    if (!window.enemies || window.enemies.length === 0) return null;
    
    const range = getAttackRange();
    let nearest = null;
    let minDistance = Infinity;
    
    for (let i = 0; i < window.enemies.length; i++) {
        const e = window.enemies[i];
        if (e.health <= 0) continue;
        
        const dx = Math.abs(e.x - window.player.x);
        const dy = Math.abs(e.y - window.player.y);
        const distance = Math.max(dx, dy);
        
        if (distance <= range && distance < minDistance) {
            minDistance = distance;
            nearest = e;
        }
    }
    
    return nearest;
}

function updateAutoAttackTarget() {
    if (!autoAttackEnabled) return;
    const nearestEnemy = getNearestEnemyInRange();
    if (nearestEnemy) {
        hoveredEnemy = nearestEnemy;
    }
}

function toggleAutoAttack() {
    autoAttackEnabled = !autoAttackEnabled;
    
    if (autoAttackEnabled) {
        if (autoAttackInterval) clearInterval(autoAttackInterval);
        autoAttackInterval = setInterval(() => {
            if (autoAttackEnabled && window.gameActive && !isPaused) {
                updateAutoAttackTarget();
                playerAttack();
            }
        }, 200);
        console.log('⚔️ AUTO ATTACK ENABLED');
    } else {
        if (autoAttackInterval) {
            clearInterval(autoAttackInterval);
            autoAttackInterval = null;
        }
        hoveredEnemy = null;
        console.log('⚔️ AUTO ATTACK DISABLED');
    }
    
    // Синхронизируем глобальную переменную
    window.autoAttackEnabled = autoAttackEnabled;
    
    // Обновляем UI кнопки
    if (typeof updateAutoAttackButtonUI === 'function') {
        updateAutoAttackButtonUI();
    }
}

function updateCooldowns() {
    if (window.player && window.player.attackCooldown > 0) {
        window.player.attackCooldown--;
        if (typeof updateUI === 'function') updateUI();
    }
}

function updateParticles(deltaTime) {
    if (particleSystem) particleSystem.update(deltaTime);
}

function drawParticles() {
    if (particleSystem && window.camera && ctx) {
        particleSystem.draw(ctx, window.camera.x, window.camera.y);
    }
}

// Функция для обновления UI кнопки извне
function updateAutoAttackButtonUI() {
    const autoBtn = document.getElementById('autoAttackBtn');
    const statusSpan = document.getElementById('autoAttackStatusSpan');
    
    if (autoBtn) {
        if (autoAttackEnabled) {
            autoBtn.textContent = '⚔️ АВТО-АТАКА: ВКЛ';
            autoBtn.style.background = 'linear-gradient(135deg, #aa3355, #8a2a4a)';
            autoBtn.style.borderColor = '#ff8866';
            if (statusSpan) statusSpan.innerHTML = '<span style="color:#88ff88">ВКЛЮЧЕНА</span>';
        } else {
            autoBtn.textContent = '⚔️ АВТО-АТАКА: ВЫКЛ';
            autoBtn.style.background = 'linear-gradient(135deg, #6a2a4a, #4a1a3a)';
            autoBtn.style.borderColor = '#aa3355';
            if (statusSpan) statusSpan.innerHTML = '<span style="color:#ff8888">ВЫКЛЮЧЕНА</span>';
        }
    }
}

// Экспорт
window.toggleAutoAttack = toggleAutoAttack;
window.autoAttackEnabled = autoAttackEnabled;
window.updateAutoAttackButtonUI = updateAutoAttackButtonUI;
window.getNearestEnemyInRange = getNearestEnemyInRange;
window.updateAutoAttackTarget = updateAutoAttackTarget;
window.particleSystem = particleSystem;
window.updateParticles = updateParticles;
window.drawParticles = drawParticles;
window.getCurrentDamage = getCurrentDamage;
window.playerAttack = playerAttack;