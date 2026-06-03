 // ========== PARTICLE.JS ==========
// Система частиц для эффектов ударов

class Particle {
    constructor(x, y, vx, vy, color, size, life, type = 'blood') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
        this.type = type;
        this.gravity = type === 'blood' ? 0.2 : 0.05;
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime * 60;
        this.y += this.vy * deltaTime * 60;
        this.vy += this.gravity * deltaTime * 60;
        this.life -= deltaTime;
        return this.life > 0;
    }
    
    draw(ctx, cameraX, cameraY) {
        const alpha = Math.min(1, this.life / this.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        
        if (this.type === 'spark') {
            // Искры - маленькие квадратики
            ctx.fillRect(this.x - cameraX - this.size/2, this.y - cameraY - this.size/2, this.size, this.size);
        } else {
            // Кровь - круглые частицы
            ctx.arc(this.x - cameraX, this.y - cameraY, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    addBloodBurst(x, y, amount = 10) {
        for (let i = 0; i < amount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 2;
            const color = `rgba(180, 30, 30, ${0.6 + Math.random() * 0.4})`;
            const size = 2 + Math.random() * 3;
            const life = 0.3 + Math.random() * 0.4;
            this.particles.push(new Particle(x, y, vx, vy, color, size, life, 'blood'));
        }
    }
    
    addSparkBurst(x, y, amount = 15) {
        for (let i = 0; i < amount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 6;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 1;
            const color = `hsl(${40 + Math.random() * 30}, 100%, 60%)`;
            const size = 1 + Math.random() * 2;
            const life = 0.2 + Math.random() * 0.3;
            this.particles.push(new Particle(x, y, vx, vy, color, size, life, 'spark'));
        }
    }
    
    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].update(deltaTime)) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    draw(ctx, cameraX, cameraY) {
        for (let p of this.particles) {
            p.draw(ctx, cameraX, cameraY);
        }
    }
    
    clear() {
        this.particles = [];
    }
}

window.ParticleSystem = ParticleSystem;
window.Particle = Particle;
