// ========== ENEMY.JS ==========
// ВРАГИ С МЕДЛЕННОЙ СКОРОСТЬЮ

window.enemies = [];

const ENEMY_TYPES = {
    goblin: { color: '#44aa44', health: 25, damage: 6, xp: 20, size: 8, speed: 0.4, name: 'Гоблин', goldMin: 8, goldMax: 15 },
    skeleton: { color: '#aaaaaa', health: 40, damage: 10, xp: 35, size: 8, speed: 0.35, name: 'Скелет', goldMin: 12, goldMax: 22 },
    demon: { color: '#cc4444', health: 60, damage: 15, xp: 60, size: 9, speed: 0.3, name: 'Демон', goldMin: 20, goldMax: 35 },
    ghost: { color: '#88aaff', health: 30, damage: 8, xp: 30, size: 7, speed: 0.35, name: 'Призрак', goldMin: 10, goldMax: 18 },
    orc: { color: '#aa6644', health: 50, damage: 12, xp: 45, size: 8, speed: 0.5, name: 'Орк', goldMin: 15, goldMax: 28 }
};

const ENEMY_BODY_PROPS = {
    legLength: 7,
    legWidth: 2.5,
    torsoWidth: 6,
    torsoHeight: 7,
    armLength: 5.5,
    armWidth: 2,
    headSize: 4.5
};

function spawnEnemy() {
    if (!window.gameActive) return;
    if (window.enemies.length > 15) return;
    
    let x, y;
    let attempts = 0;
    
    do {
        x = 3 + Math.floor(Math.random() * (MAP_W - 6));
        y = 3 + Math.floor(Math.random() * (MAP_H - 6));
        attempts++;
        if (attempts > 100) return;
    } while (!isWalkable(x, y) || window.enemies.some(e => Math.abs(e.x - x) < 0.8) || 
             (Math.abs(x - window.player.x) < 4 && Math.abs(y - window.player.y) < 4));
    
    const types = ['goblin', 'skeleton', 'ghost', 'orc'];
    const type = types[Math.floor(Math.random() * types.length)];
    const t = ENEMY_TYPES[type];
    const levelBonus = Math.floor((window.player.level - 1) * 0.5);
    
    window.enemies.push({
        x, y,
        health: t.health + levelBonus * 8,
        maxHealth: t.health + levelBonus * 8,
        damage: t.damage + levelBonus * 2,
        xpReward: t.xp + levelBonus * 6,
        goldMin: t.goldMin,
        goldMax: t.goldMax,
        color: t.color,
        size: t.size,
        speed: t.speed,
        moveTimer: 0,
        type: type,
        name: t.name,
        attackCooldown: 0,
        attackAnim: 0,
        isBoss: false,
        legPhase: Math.random() * Math.PI * 2,
        upperBodyAngle: 0
    });
}

function drawEnemyBody(e, pos) {
    const walkVals = getWalkAnimationValues(e.moveTimer > 0);
    const attackAngle = Math.atan2(window.player.y - e.y, window.player.x - e.x);
    
    ctx.shadowBlur = 2;
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y + 4, e.size - 1, (e.size - 1) / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.save();
    ctx.translate(pos.x, pos.y + 3);
    
    ctx.save();
    ctx.translate(-2.5, 0);
    ctx.rotate(walkVals.legLeft * 0.5);
    ctx.fillStyle = e.color;
    ctx.fillRect(-1, 0, ENEMY_BODY_PROPS.legWidth, ENEMY_BODY_PROPS.legLength);
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(-1.5, ENEMY_BODY_PROPS.legLength - 1.5, 3, 1.5);
    ctx.restore();
    
    ctx.save();
    ctx.translate(2.5, 0);
    ctx.rotate(walkVals.legRight * 0.5);
    ctx.fillStyle = e.color;
    ctx.fillRect(-1, 0, ENEMY_BODY_PROPS.legWidth, ENEMY_BODY_PROPS.legLength);
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(-1.5, ENEMY_BODY_PROPS.legLength - 1.5, 3, 1.5);
    ctx.restore();
    
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.ellipse(0, -1, 4.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    ctx.save();
    ctx.translate(pos.x, pos.y - 0.5);
    ctx.rotate(e.upperBodyAngle * 0.3);
    
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, ENEMY_BODY_PROPS.torsoWidth, ENEMY_BODY_PROPS.torsoHeight, 0, 0, Math.PI * 2);
    ctx.fill();
    
    if (e.type === 'demon') {
        ctx.fillStyle = "#882222";
        ctx.beginPath();
        ctx.moveTo(-7, -1);
        ctx.quadraticCurveTo(-10, -4, -8, 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(7, -1);
        ctx.quadraticCurveTo(10, -4, 8, 2);
        ctx.fill();
    }
    
    if (e.type === 'skeleton') {
        ctx.strokeStyle = "#bbaa99";
        ctx.lineWidth = 0.8;
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(-3, i * 1);
            ctx.lineTo(3, i * 1);
            ctx.stroke();
        }
    }
    
    let armAngle = attackAngle;
    if (e.attackAnim > 0) armAngle += e.attackAnim * 0.5;
    let armSwing = -walkVals.legLeft * 0.4;
    
    ctx.save();
    ctx.translate(-4.5, -1);
    ctx.rotate(armAngle - 0.5 + armSwing);
    ctx.fillStyle = e.color;
    ctx.fillRect(-1, 0, ENEMY_BODY_PROPS.armWidth, ENEMY_BODY_PROPS.armLength);
    ctx.restore();
    
    ctx.save();
    ctx.translate(4.5, -1);
    ctx.rotate(armAngle + 0.5 - armSwing);
    ctx.fillStyle = e.color;
    ctx.fillRect(-1, 0, ENEMY_BODY_PROPS.armWidth, ENEMY_BODY_PROPS.armLength);
    
    if (e.type === 'skeleton') {
        ctx.fillStyle = "#eeddcc";
        ctx.fillRect(-0.8, -7, 1.6, 9);
    } else if (e.type === 'demon') {
        ctx.fillStyle = "#ff6633";
        ctx.fillRect(-0.8, -8, 1.6, 10);
    } else {
        ctx.fillStyle = "#886644";
        ctx.fillRect(-0.8, -6, 1.6, 8);
    }
    ctx.restore();
    ctx.restore();
    
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y - 8, ENEMY_BODY_PROPS.headSize, ENEMY_BODY_PROPS.headSize, 0, 0, Math.PI * 2);
    ctx.fill();
    
    if (e.type === 'ghost') {
        ctx.fillStyle = "#5566aa";
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y - 10, 3.5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    if (e.type === 'demon') {
        ctx.fillStyle = "#442222";
        ctx.beginPath();
        ctx.moveTo(pos.x - 2.5, pos.y - 11);
        ctx.lineTo(pos.x - 5, pos.y - 15);
        ctx.lineTo(pos.x - 2, pos.y - 12);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(pos.x + 2.5, pos.y - 11);
        ctx.lineTo(pos.x + 5, pos.y - 15);
        ctx.lineTo(pos.x + 2, pos.y - 12);
        ctx.fill();
    }
    
    if (e.type === 'goblin') {
        ctx.fillStyle = "#88aa88";
        ctx.beginPath();
        ctx.moveTo(pos.x - 4, pos.y - 9);
        ctx.lineTo(pos.x - 7, pos.y - 11);
        ctx.lineTo(pos.x - 4, pos.y - 8);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(pos.x + 4, pos.y - 9);
        ctx.lineTo(pos.x + 7, pos.y - 11);
        ctx.lineTo(pos.x + 4, pos.y - 8);
        ctx.fill();
    }
    
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(pos.x - 1.8, pos.y - 9, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pos.x + 1.8, pos.y - 9, 1.2, 0, Math.PI * 2);
    ctx.fill();
    
    let eyeColor = e.isBoss ? "#ff4444" : "#ff0000";
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(pos.x - 2, pos.y - 9.2, 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pos.x + 1.6, pos.y - 9.2, 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    if (e.attackAnim > 0) {
        ctx.fillStyle = "#ff6600";
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y - 2, e.size + 3, e.size + 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    
    const hpPercent = e.health / e.maxHealth;
    ctx.fillStyle = "#330000";
    ctx.fillRect(pos.x - (e.isBoss ? 12 : 8), pos.y - 13, e.isBoss ? 24 : 16, 2);
    
    if (hpPercent > 0.6) ctx.fillStyle = "#33cc33";
    else if (hpPercent > 0.3) ctx.fillStyle = "#ffcc33";
    else ctx.fillStyle = "#cc3333";
    ctx.fillRect(pos.x - (e.isBoss ? 12 : 8), pos.y - 13, (e.isBoss ? 24 : 16) * hpPercent, 2);
    
    ctx.font = `bold ${e.isBoss ? '7px' : '6px'} "Courier New"`;
    ctx.fillStyle = e.isBoss ? "#ffaa44" : "#ffccaa";
    ctx.fillText(e.name, pos.x - (e.isBoss ? 15 : 10), pos.y - 16);
    
    ctx.shadowBlur = 0;
}

function updateEnemies() {
    if (!window.player) return;
    
    const playerX = window.player.x;
    const playerY = window.player.y;
    
    for (let e of window.enemies) {
        if (e.attackCooldown > 0) e.attackCooldown--;
        if (e.attackAnim > 0) e.attackAnim--;
        
        e.upperBodyAngle = Math.atan2(playerY - e.y, playerX - e.x);
        
        const dx = playerX - e.x;
        const dy = playerY - e.y;
        const dist = Math.abs(dx) + Math.abs(dy);
        
        if (dist < 0.6) {
            let moved = false;
            const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
            for (let dir of dirs) {
                const nx = e.x + dir[0];
                const ny = e.y + dir[1];
                if (isWalkable(nx, ny) && !window.enemies.some(en => Math.abs(en.x - nx) < 0.5)) {
                    e.x = nx;
                    e.y = ny;
                    moved = true;
                    break;
                }
            }
            if (!moved && isWalkable(e.x + 1, e.y + 1)) { e.x += 1; e.y += 1; }
        }
        
        if (e.moveTimer > 0) { e.moveTimer--; continue; }
        
        const hasLOS = hasLineOfSight(e.x, e.y, playerX, playerY);
        
        if (dist === 1 && hasLOS && e.attackCooldown <= 0) {
            takeDamage(e.damage);
            e.attackCooldown = 35;
            e.attackAnim = 10;
            continue;
        }
        
        if (dist === 1 && !hasLOS) continue;
        
        let moved = false;
        const dxToTarget = Math.sign(playerX - e.x);
        const dyToTarget = Math.sign(playerY - e.y);
        
        if (dxToTarget !== 0 && Math.random() < 0.7) {
            const newX = e.x + dxToTarget;
            const isPlayerCell = (Math.abs(newX - playerX) < 0.5 && Math.abs(e.y - playerY) < 0.5);
            if (isWalkable(newX, e.y) && !isPlayerCell &&
                !window.enemies.some(en => Math.abs(en.x - newX) < 0.5 && Math.abs(en.y - e.y) < 0.5)) {
                e.x = newX;
                moved = true;
            }
        }
        
        if (!moved && dyToTarget !== 0 && Math.random() < 0.7) {
            const newY = e.y + dyToTarget;
            const isPlayerCell = (Math.abs(e.x - playerX) < 0.5 && Math.abs(newY - playerY) < 0.5);
            if (isWalkable(e.x, newY) && !isPlayerCell &&
                !window.enemies.some(en => Math.abs(en.x - e.x) < 0.5 && Math.abs(en.y - newY) < 0.5)) {
                e.y = newY;
                moved = true;
            }
        }
        
        if (moved) e.moveTimer = Math.floor(12 / e.speed);
    }
    
    for (let i = window.enemies.length - 1; i >= 0; i--) {
        if (window.enemies[i].health <= 0) {
            const killedEnemy = window.enemies[i];
            addXp(killedEnemy.xpReward);
            
            const goldAmount = killedEnemy.goldMin + Math.floor(Math.random() * (killedEnemy.goldMax - killedEnemy.goldMin + 1));
            if (typeof addGold === 'function') addGold(goldAmount);
            
            window.player.kills++;
            updateUI();
			if (typeof dropRandomItem === 'function') dropRandomItem();
			
            window.enemies.splice(i, 1);
            if (typeof checkDungeonProgress === 'function') checkDungeonProgress();
        }
    }
}

function drawEnemies() {
    if (!ctx || !window.enemies) return;
    
    for (let e of window.enemies) {
        if (!isInVision(e.x, e.y, window.player.x, window.player.y, window.player.direction)) continue;
        
        const pos = tileToScreenWithCamera(e.x, e.y);
        if (pos.x + 30 < 0 || pos.x - 30 > WIDTH || pos.y + 30 < 0 || pos.y - 30 > HEIGHT) continue;
        
        drawEnemyBody(e, pos);
        
        if (hoveredEnemy === e) {
            ctx.strokeStyle = "#ff6666";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(pos.x, pos.y - 2, e.size + 1, e.size + 3, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

window.ENEMY_BODY_PROPS = ENEMY_BODY_PROPS;
window.drawEnemyBody = drawEnemyBody;
window.drawEnemies = drawEnemies;
window.updateEnemies = updateEnemies;
window.spawnEnemy = spawnEnemy;
window.resetEnemies = function() { window.enemies = []; for (let i = 0; i < 3; i++) spawnEnemy(); };