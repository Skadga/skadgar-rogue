// ========== MAP.JS ==========
// ОПТИМИЗИРОВАННАЯ ВЕРСИЯ

let originalHomeMap = null;

function generateHomeMap() {
    const size = MAP_W;
    let map = Array(size).fill().map(() => Array(size).fill(1));
    
    for (let y = 2; y < MAP_H - 2; y++) {
        for (let x = 2; x < MAP_W - 2; x++) {
            if (Math.random() < 0.9) map[y][x] = 0;
        }
    }
    
    for (let y = 1; y < MAP_H - 1; y++) {
        for (let x = 1; x < MAP_W - 1; x++) {
            if (map[y][x] === 1) {
                let walls = 0;
                if (map[y-1][x] === 0) walls++;
                if (map[y+1][x] === 0) walls++;
                if (map[y][x-1] === 0) walls++;
                if (map[y][x+1] === 0) walls++;
                if (walls >= 2 && Math.random() < 0.4) map[y][x] = 0;
            }
        }
    }
    
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (map[y][x] === 0) {
                const r = Math.random();
                if (r < 0.08) map[y][x] = 20;
                else if (r < 0.12) map[y][x] = 21;
                else if (r < 0.14) map[y][x] = 22;
                else if (r < 0.16) map[y][x] = 23;
            }
        }
    }
    
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if ((y < 3 || y > size - 4 || x < 3 || x > size - 4) && map[y][x] === 0 && Math.random() < 0.6) {
                map[y][x] = 24;
            }
        }
    }
    
    const centerX = Math.floor(size / 2);
    const centerY = Math.floor(size / 2);
    if (map[centerY][centerX] === 0) map[centerY][centerX] = 25;
    
    return map;
}

function createHomePortalAtGoodPosition() {
    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            if (MAP[y][x] === 10) {
                homePortalPosition = { x, y };
                return true;
            }
        }
    }
    
    for (let y = 5; y < MAP_H - 5; y++) {
        for (let x = 5; x < MAP_W - 5; x++) {
            if (MAP[y][x] === 0 || MAP[y][x] === 20 || MAP[y][x] === 21 || MAP[y][x] === 22 || MAP[y][x] === 23) {
                let hasFreeSpace = false;
                const checkDirs = [[0,1],[0,-1],[1,0],[-1,0]];
                for (let dir of checkDirs) {
                    const nx = x + dir[0];
                    const ny = y + dir[1];
                    if (MAP[ny] && MAP[ny][nx] === 0) { hasFreeSpace = true; break; }
                }
                if (hasFreeSpace) {
                    homePortalPosition = { x, y };
                    MAP[y][x] = 10;
                    return true;
                }
            }
        }
    }
    
    for (let y = 3; y < MAP_H - 3; y++) {
        for (let x = 3; x < MAP_W - 3; x++) {
            if (MAP[y][x] === 0) {
                homePortalPosition = { x, y };
                MAP[y][x] = 10;
                return true;
            }
        }
    }
    
    homePortalPosition = { x: 10, y: 10 };
    MAP[10][10] = 10;
    return true;
}

function loadMap() {
    MAP = generateHomeMap();
    createHomePortalAtGoodPosition();
    originalHomeMap = JSON.parse(JSON.stringify(MAP));
}
// Отрисовка фона летающего острова
function drawSkyBackground() {
    if (!ctx) return;
    
    // Градиент неба
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, '#0a2a4a');
    gradient.addColorStop(0.4, '#1a3a6a');
    gradient.addColorStop(0.7, '#2a4a7a');
    gradient.addColorStop(1, '#3a5a8a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    // Облака
    drawClouds();
    
    // Звёзды (дальний план)
    drawStars();
    
    // Солнце
    drawSun();
}

function drawStars() {
    for (let i = 0; i < 100; i++) {
        if (!window.starPositions) {
            window.starPositions = [];
            for (let j = 0; j < 100; j++) {
                window.starPositions.push({
                    x: Math.random() * WIDTH,
                    y: Math.random() * HEIGHT * 0.6,
                    size: 1 + Math.random() * 2,
                    alpha: 0.3 + Math.random() * 0.5
                });
            }
        }
    }
    
    if (window.starPositions) {
        for (let star of window.starPositions) {
            ctx.fillStyle = `rgba(255, 255, 200, ${star.alpha})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawSun() {
    // Солнце
    ctx.fillStyle = '#ffdd88';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ffaa44';
    ctx.beginPath();
    ctx.arc(WIDTH - 80, 60, 40, 0, Math.PI * 2);
    ctx.fill();
    
    // Лучи солнца
    ctx.fillStyle = '#ffcc66';
    for (let i = 0; i < 12; i++) {
        const angle = (Date.now() / 10000 + i * Math.PI / 6);
        const x = (WIDTH - 80) + Math.cos(angle) * 55;
        const y = 60 + Math.sin(angle) * 55;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.shadowBlur = 0;
}

function drawClouds() {
    const time = Date.now() / 20000;
    
    const clouds = [
        { x: 100, y: 80, size: 60, speed: 0.2 },
        { x: 350, y: 50, size: 80, speed: 0.15 },
        { x: 600, y: 100, size: 50, speed: 0.25 },
        { x: 750, y: 40, size: 70, speed: 0.1 },
        { x: -50, y: 120, size: 55, speed: 0.18 }
    ];
    
    for (let cloud of clouds) {
        let cloudX = cloud.x + (time * cloud.speed * 50) % (WIDTH + 200) - 100;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
        
        ctx.beginPath();
        ctx.ellipse(cloudX, cloud.y, cloud.size, cloud.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cloudX - cloud.size * 0.4, cloud.y - 5, cloud.size * 0.7, cloud.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cloudX + cloud.size * 0.4, cloud.y - 5, cloud.size * 0.7, cloud.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.shadowBlur = 0;
}

function drawFloatingIslandGround() {
    if (!ctx || !window.camera) return;
    
    // Отрисовка земли под островом
    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            if (!exploredTiles[y][x]) continue;
            
            const isVisible = isInVision(x, y, window.player.x, window.player.y, window.player.direction);
            if (!isVisible) continue;
            
            const pos = tileToScreenWithCamera(x, y);
            const tileType = MAP[y][x];
            const isDungeonActive = (typeof dungeonActive !== 'undefined') ? dungeonActive : false;
            
            if (!isDungeonActive && (tileType === 0 || tileType === 20 || tileType === 21 || tileType === 22 || tileType === 23 || tileType === 25)) {
                // Рисуем свечение под островом
                ctx.fillStyle = 'rgba(100, 150, 255, 0.15)';
                ctx.beginPath();
                ctx.ellipse(pos.x, pos.y + TILE_H, 25, 12, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Тень от острова вниз
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.ellipse(pos.x, pos.y + TILE_H + 8, 30, 8, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}