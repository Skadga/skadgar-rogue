// ========== Projectile.js (ИСПРАВЛЕННЫЙ) ==========
// Добавь поддержку критических ударов

class Projectile {
    constructor(x, y, angle, speed, damage, type, size) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.damage = damage;
        this.type = type;
        this.size = size;
        this.life = 100;
        this.active = true;
        this.isCritical = false;
    }
    
    update() {
        this.x += this.vx * 0.1;
        this.y += this.vy * 0.1;
        this.life--;
        
        // Проверка границ карты
        if (this.x < 0 || this.x > MAP_W || this.y < 0 || this.y > MAP_H) {
            this.active = false;
        }
        
        // Проверка столкновения с врагами
        for (let i = 0; i < window.enemies.length; i++) {
            const e = window.enemies[i];
            const dx = Math.abs(this.x - e.x);
            const dy = Math.abs(this.y - e.y);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 0.8 && this.active) {
                e.health -= this.damage;
                this.active = false;
                
                // Эффект попадания
                const screenPos = tileToScreen(this.x, this.y);
                if (window.particleSystem) {
                    if (this.type === 'magic') {
                        if (this.isCritical) {
                            window.particleSystem.addSparkBurst(screenPos.x, screenPos.y - 10, 30);
                        } else {
                            window.particleSystem.addSparkBurst(screenPos.x, screenPos.y - 10, 20);
                        }
                    } else {
                        if (this.isCritical) {
                            window.particleSystem.addSparkBurst(screenPos.x, screenPos.y - 10, 15);
                        } else {
                            window.particleSystem.addBloodBurst(screenPos.x, screenPos.y - 10, 8);
                        }
                    }
                }
                
                addFloatingDamage(e.x, e.y, this.damage, this.isCritical);
                
                if (this.isCritical && typeof playHitSound === 'function') {
                    playHitSound(true, false);
                } else if (typeof playHitSound === 'function') {
                    playHitSound(false, false);
                }
                
                if (e.health <= 0) {
                    if (typeof playDeathSound === 'function') playDeathSound();
                }
                break;
            }
        }
        
        return this.active;
    }
    
    draw(ctx, cameraX, cameraY) {
        const screenX = tileToScreen(this.x, this.y).x - cameraX;
        const screenY = tileToScreen(this.x, this.y).y - cameraY;
        
        ctx.save();
        ctx.shadowBlur = 3;
        
        if (this.type === 'arrow') {
            // Стрела
            ctx.fillStyle = "#8B6914";
            ctx.fillRect(screenX - 3, screenY - 1, 6, 2);
            ctx.fillStyle = "#c0c0c0";
            ctx.beginPath();
            ctx.moveTo(screenX + 3, screenY);
            ctx.lineTo(screenX + 8, screenY - 2);
            ctx.lineTo(screenX + 8, screenY + 2);
            ctx.fill();
            
            if (this.isCritical) {
                ctx.fillStyle = "#ffaa44";
                ctx.globalAlpha = 0.7;
                ctx.beginPath();
                ctx.arc(screenX, screenY, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        } else if (this.type === 'magic') {
            // Магический снаряд
            let grad;
            if (this.isCritical) {
                grad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, this.size + 2);
                grad.addColorStop(0, "#ffaa66");
                grad.addColorStop(1, "#ff6600");
            } else {
                grad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, this.size);
                grad.addColorStop(0, "#ff8844");
                grad.addColorStop(1, "#ff4400");
            }
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Свечение
            ctx.fillStyle = "#ffaa66";
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.size + (this.isCritical ? 4 : 2), 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        
        ctx.restore();
    }
}

window.Projectile = Projectile;