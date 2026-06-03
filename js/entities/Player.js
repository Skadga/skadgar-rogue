// ========== PLAYER.JS ==========
// С РЕАЛИСТИЧНОЙ АНИМАЦИЕЙ ХОДЬБЫ

window.player = {
    x: 10, y: 10,
    health: 100,
    maxHealth: 100,
    level: 1,
    xp: 0,
    kills: 0,
    baseDamage: 15,
    armor: 0,
    damageReduction: 0,
    attackCooldown: 0,
    direction: 0,
    moveTimer: 0,
    critChance: 0.1,
    critDamage: 1.5,
    gold: 100,
    upperBodyAngle: 0,
    lowerBodyAngle: 0,
    attackAnimProgress: 0
};

window.moving = false;
let regenTimer = 0;
let regenDelayTimer = 0;

const BODY_PROPS = {
    legLength: 8,
    legWidth: 3,
    torsoWidth: 7,
    torsoHeight: 8,
    armLength: 7,
    armWidth: 2.5,
    headSize: 5,
    neckLength: 2
};

function takeDamage(amount) {
    let reduction = Math.min(0.6, window.player.armor * 0.02);
    let reducedDamage = Math.floor(amount * (1 - reduction));
    reducedDamage = Math.max(1, reducedDamage);
    
    window.player.health -= reducedDamage;
    startHitFlash();
    addPickupEffect(window.player.x, window.player.y, `${reducedDamage}!`);
    regenDelayTimer = 60;
    
    if (typeof playHitSound === 'function') {
        playHitSound(false, true);
    }
    
    if (window.player.health <= 0) {
        window.player.health = 0;
        window.gameActive = false;
    }
    updateUI();
}

function addXp(amount) {
    window.player.xp += amount;
    let nextXp = 50 * window.player.level;
    while (window.player.xp >= nextXp) {
        window.player.xp -= nextXp;
        window.player.level++;
        window.player.maxHealth = 80 + window.player.level * 12;
        window.player.health = window.player.maxHealth;
        window.player.baseDamage = 15 + window.player.level * 3;
        window.player.armor = Math.floor(window.player.level * 1.5);
        window.player.damageReduction = Math.min(0.6, window.player.armor * 0.02);
        window.player.critChance = Math.min(0.35, 0.1 + window.player.level * 0.012);
        nextXp = 50 * window.player.level;
        addPickupEffect(window.player.x, window.player.y, `LEVEL UP! ${window.player.level}`);
        window.player.health = window.player.maxHealth;
    }
    updateUI();
}

function updateUI() {
    const healthEl = document.getElementById('health');
    const maxHealthEl = document.getElementById('maxHealth');
    const levelEl = document.getElementById('level');
    const killsEl = document.getElementById('kills');
    const xpEl = document.getElementById('xp');
    const nextXpEl = document.getElementById('nextXp');
    const damageEl = document.getElementById('damage');
    const armorEl = document.getElementById('armor');
    const attackStatusEl = document.getElementById('attackStatus');
    const dungeonProgressEl = document.getElementById('dungeonProgress');
    const dungeonTotalEl = document.getElementById('dungeonTotal');
    const dungeonStatEl = document.getElementById('dungeonStat');
    const goldEl = document.getElementById('playerGold');
    const goldShopEl = document.getElementById('playerGoldShop');
    
    if (healthEl) healthEl.innerText = Math.floor(window.player.health);
    if (maxHealthEl) maxHealthEl.innerText = window.player.maxHealth;
    if (levelEl) levelEl.innerText = window.player.level;
    if (killsEl) killsEl.innerText = window.player.kills;
    if (xpEl) xpEl.innerText = window.player.xp;
    if (nextXpEl) nextXpEl.innerText = 50 * window.player.level;
    
    if (damageEl && typeof WeaponTypes !== 'undefined') {
        const totalDamage = window.player.baseDamage + (WeaponTypes[currentWeapon]?.damage || 0);
        damageEl.innerText = Math.floor(totalDamage);
    } else if (damageEl) {
        damageEl.innerText = Math.floor(window.player.baseDamage);
    }
    
    if (armorEl) armorEl.innerText = Math.floor(window.player.armor);
    if (goldEl) goldEl.innerText = window.player.gold || 0;
    if (goldShopEl) goldShopEl.innerText = window.player.gold || 0;
    
    if (dungeonStatEl) {
        if (typeof dungeonActive !== 'undefined' && dungeonActive) {
            dungeonStatEl.style.display = "block";
            if (dungeonProgressEl) dungeonProgressEl.innerText = dungeonEnemiesKilled || 0;
            if (dungeonTotalEl) dungeonTotalEl.innerText = dungeonEnemiesToKill || 8;
        } else {
            dungeonStatEl.style.display = "none";
        }
    }
    
    if (attackStatusEl) {
        if (window.player.attackCooldown > 0) {
            attackStatusEl.innerText = `${(window.player.attackCooldown/6).toFixed(1)}с`;
            attackStatusEl.style.color = "#ff8888";
        } else {
            attackStatusEl.innerText = "Готов";
            attackStatusEl.style.color = "#88ff88";
        }
    }
}

function resetPlayer() {
    window.player = {
        x: 10, y: 10,
        health: 100, maxHealth: 100,
        level: 1, xp: 0, kills: 0,
        baseDamage: 15, armor: 0, damageReduction: 0,
        attackCooldown: 0,
        direction: 0, moveTimer: 0,
        critChance: 0.1, critDamage: 1.5,
        gold: 100,
        upperBodyAngle: 0,
        lowerBodyAngle: 0,
        attackAnimProgress: 0
    };
    window.moving = false;
    window.currentTarget = null;
    window.currentPath = [];
    isMouseDown = false;
    moveToMouse = false;
    regenTimer = 0;
    regenDelayTimer = 0;
    
    if (typeof walkAnim !== 'undefined') walkAnim = 0;
    if (typeof attackAnim !== 'undefined') attackAnim = 0;
    if (typeof hitFlash !== 'undefined') hitFlash = 0;
    
    updateUI();
}

function updateRegen() {
    if (!window.gameActive) return;
    if (typeof dungeonActive !== 'undefined' && dungeonActive) return;
    
    if (regenDelayTimer > 0) { regenDelayTimer--; return; }
    
    let enemiesNearby = false;
    if (window.enemies) {
        for (let e of window.enemies) {
            const dx = Math.abs(e.x - window.player.x);
            const dy = Math.abs(e.y - window.player.y);
            if (dx + dy < 10 && hasLineOfSight(e.x, e.y, window.player.x, window.player.y)) {
                enemiesNearby = true;
                break;
            }
        }
    }
    
    if (window.player.health < window.player.maxHealth && 
        window.player.attackCooldown === 0 && 
        regenTimer <= 0 && !enemiesNearby) {
        
        window.player.health = Math.min(window.player.maxHealth, window.player.health + 1);
        updateUI();
        regenTimer = 30;
    }
    
    if (regenTimer > 0) regenTimer--;
}

function preventEnemyOnPlayer() {
    if (!window.enemies) return;
    for (let e of window.enemies) {
        if (Math.abs(e.x - window.player.x) < 0.5 && Math.abs(e.y - window.player.y) < 0.5) {
            let pushed = false;
            const dirs = [[1,0], [-1,0], [0,1], [0,-1], [1,1], [-1,-1], [1,-1], [-1,1]];
            for (let dir of dirs) {
                const nx = e.x + dir[0];
                const ny = e.y + dir[1];
                if (isWalkable(nx, ny) && 
                    !window.enemies.some(en => Math.abs(en.x - nx) < 0.5 && Math.abs(en.y - ny) < 0.5)) {
                    e.x = nx;
                    e.y = ny;
                    pushed = true;
                    break;
                }
            }
            if (!pushed && e.attackCooldown <= 0) {
                takeDamage(e.damage);
                e.attackCooldown = 25;
                e.attackAnim = 10;
            }
        }
    }
}

function drawPlayerBody() {
    if (!ctx || !window.player) return;
    const pos = tileToScreenWithCamera(window.player.x, window.player.y);
    
    const walkVals = getWalkAnimationValues(window.moving);
    
    let upperAngle = window.player.upperBodyAngle;
    let lowerAngle = window.player.lowerBodyAngle;
    
    if (typeof attackAnim !== 'undefined' && attackAnim > 0) {
        upperAngle += attackAnim * Math.PI * 0.8;
    }
    
    ctx.shadowBlur = 2;
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y + 4, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.save();
    ctx.translate(pos.x, pos.y + 3);
    ctx.rotate(lowerAngle * 0.3);
    
    ctx.save();
    ctx.translate(-3.5, 0);
    ctx.rotate(walkVals.legLeft * 0.6);
    ctx.fillStyle = "#2a4a7a";
    ctx.fillRect(-1.5, 0, BODY_PROPS.legWidth, BODY_PROPS.legLength);
    ctx.fillStyle = "#1a2a4a";
    ctx.fillRect(-2, BODY_PROPS.legLength - 1, 4, 2);
    ctx.restore();
    
    ctx.save();
    ctx.translate(3.5, 0);
    ctx.rotate(walkVals.legRight * 0.6);
    ctx.fillStyle = "#2a4a7a";
    ctx.fillRect(-1, 0, BODY_PROPS.legWidth, BODY_PROPS.legLength);
    ctx.fillStyle = "#1a2a4a";
    ctx.fillRect(-2, BODY_PROPS.legLength - 1, 4, 2);
    ctx.restore();
    
    ctx.fillStyle = "#3a5a8a";
    ctx.beginPath();
    ctx.ellipse(0, -1, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    ctx.save();
    ctx.translate(pos.x, pos.y - 2);
    ctx.rotate(upperAngle * 0.3);
    
    const torsoGrad = ctx.createLinearGradient(-3, -3, 3, 5);
    torsoGrad.addColorStop(0, "#4a7abf");
    torsoGrad.addColorStop(1, "#2a5a9f");
    ctx.fillStyle = torsoGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, BODY_PROPS.torsoWidth, BODY_PROPS.torsoHeight, 0, 0, Math.PI * 2);
    ctx.fill();
    
    let lookAngle = window.player.direction;
    let armSwing = -walkVals.legLeft * 0.4;
    
    ctx.save();
    ctx.translate(-4, -1);
    ctx.rotate(lookAngle - 0.6 + armSwing);
    ctx.fillStyle = "#3a6aaa";
    ctx.fillRect(-1.5, -1, BODY_PROPS.armWidth, BODY_PROPS.armLength);
    ctx.fillStyle = "#ccaa88";
    ctx.fillRect(-1.5, BODY_PROPS.armLength - 1, 2, 2);
    ctx.restore();
    
    ctx.save();
    ctx.translate(4, -1);
    ctx.rotate(lookAngle + 0.6 - armSwing);
    ctx.fillStyle = "#3a6aaa";
    ctx.fillRect(-1, -1, BODY_PROPS.armWidth, BODY_PROPS.armLength);
    
    if (typeof currentWeapon !== 'undefined') {
        if (currentWeapon === 'SWORD') {
            ctx.fillStyle = "#ccccaa";
            ctx.fillRect(-1, -10, 2, 12);
        } else if (currentWeapon === 'BOW') {
            ctx.fillStyle = "#8B6914";
            ctx.fillRect(-0.5, -8, 1, 12);
        } else if (currentWeapon === 'STAFF') {
            ctx.fillStyle = "#8844cc";
            ctx.fillRect(-0.5, -10, 1, 14);
            ctx.fillStyle = "#ff8844";
            ctx.beginPath();
            ctx.arc(0, -12, 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = "#ccccaa";
            ctx.fillRect(-1, -9, 2, 11);
        }
    }
    
    ctx.fillStyle = "#ccaa88";
    ctx.fillRect(-1, BODY_PROPS.armLength - 1, 2, 2);
    ctx.restore();
    ctx.restore();
    
    ctx.fillStyle = "#ccaa88";
    ctx.fillRect(pos.x - 1.5, pos.y - 7, 3, BODY_PROPS.neckLength);
    
    ctx.save();
    ctx.translate(pos.x, pos.y - 9);
    ctx.rotate(window.player.direction * 0.2);
    ctx.fillStyle = "#ddbb99";
    ctx.beginPath();
    ctx.ellipse(0, 0, BODY_PROPS.headSize, BODY_PROPS.headSize, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    ctx.save();
    ctx.translate(pos.x, pos.y - 11);
    ctx.rotate(window.player.direction * 0.2);
    ctx.fillStyle = "#4a7abf";
    ctx.beginPath();
    ctx.ellipse(0, 0, BODY_PROPS.headSize - 1, BODY_PROPS.headSize - 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    ctx.save();
    ctx.translate(pos.x, pos.y - 10);
    ctx.rotate(window.player.direction * 0.2);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-2, -1, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2, -1, 1.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = "#2a4a6a";
    ctx.beginPath();
    ctx.arc(-2.3, -1.3, 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(1.7, -1.3, 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    if (typeof hitFlash !== 'undefined' && hitFlash > 0) {
        ctx.fillStyle = "#ff8888";
        ctx.globalAlpha = 0.4 + hitFlash / 20;
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y - 4, 10, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    
    const hpPercent = window.player.health / window.player.maxHealth;
    ctx.fillStyle = "#330000";
    ctx.fillRect(pos.x - 9, pos.y - 16, 18, 2.5);
    let hpColor = hpPercent > 0.6 ? "#33cc33" : (hpPercent > 0.3 ? "#ffcc33" : "#cc3333");
    ctx.fillStyle = hpColor;
    ctx.fillRect(pos.x - 9, pos.y - 16, 18 * hpPercent, 2.5);
    
    ctx.font = "bold 7px 'Courier New'";
    ctx.fillStyle = "#ffcc88";
    ctx.shadowBlur = 1;
    ctx.fillText(`Lv.${window.player.level}`, pos.x - 6, pos.y - 19);
    ctx.shadowBlur = 0;
}

window.takeDamage = takeDamage;
window.addXp = addXp;
window.updateUI = updateUI;
window.resetPlayer = resetPlayer;
window.updateRegen = updateRegen;
window.preventEnemyOnPlayer = preventEnemyOnPlayer;
window.drawPlayerBody = drawPlayerBody;
window.BODY_PROPS = BODY_PROPS;