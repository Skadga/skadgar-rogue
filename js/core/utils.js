// ========== UTILS.JS ==========
// С ПОДДЕРЖКОЙ ИЗМЕНЯЕМОГО РАЗМЕРА ОКНА

const canvas = document.getElementById('gameCanvas');
let ctx = canvas ? canvas.getContext('2d') : null;

let WIDTH = 900;
let HEIGHT = 550;
if (canvas) {
    WIDTH = canvas.width;
    HEIGHT = canvas.height;
}

// Функция для обновления размеров при изменении окна
function updateWindowSize() {
    const canvasEl = document.getElementById('gameCanvas');
    if (canvasEl) {
        WIDTH = canvasEl.width;
        HEIGHT = canvasEl.height;
        
        window.WIDTH = WIDTH;
        window.HEIGHT = HEIGHT;
        
        window.OFFSET_X = WIDTH / 2;
        window.OFFSET_Y = 120;
        
        if (typeof clearCache === 'function') clearCache();
        if (typeof updateCamera === 'function') updateCamera();
    }
}

window.WIDTH = WIDTH;
window.HEIGHT = HEIGHT;
window.canvas = canvas;
window.ctx = ctx;
window.MAP_W = 21;
window.MAP_H = 21;
window.TILE_W = 64;
window.TILE_H = 32;
window.OFFSET_X = WIDTH / 2;
window.OFFSET_Y = 120;
window.updateWindowSize = updateWindowSize;

const TILE_W = 64;
const TILE_H = 32;
const OFFSET_X = WIDTH / 2;
const OFFSET_Y = 120;

let MAP = [];
const MAP_W = 21;
const MAP_H = 21;

let floatingDamage = [];
let pickupEffects = [];
const MAX_EFFECTS = 50;

let mouseTile = { x: 0, y: 0 };
let mouseScreenX = 0, mouseScreenY = 0;
let hoveredEnemy = null;
let hoveredPortal = null;
let isMouseDown = false;
let moveToMouse = false;

// ========== ИЗМЕНЕНИЕ: ВСЯ КАРТА ВСЕГДА ОТКРЫТА ==========
let exploredTiles = Array(MAP_H).fill().map(() => Array(MAP_W).fill(true));

let tilePositionCache = new Map();
let losCache = new Map();
let lastPlayerPos = { x: -1, y: -1 };
let frameCount = 0;

// Звёзды
let starPositions = [];

function initStars() {
    for (let i = 0; i < 100; i++) {
        starPositions.push({
            x: Math.random() * WIDTH,
            y: Math.random() * HEIGHT * 0.5,
            size: 1 + Math.random() * 2,
            alpha: 0.3 + Math.random() * 0.5
        });
    }
}
initStars();

// ========== ФУНКЦИИ ФОНА ==========

function drawStars() {
    for (let star of starPositions) {
        ctx.fillStyle = `rgba(255, 255, 220, ${star.alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    }
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
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
        
        ctx.beginPath();
        ctx.ellipse(cloudX, cloud.y, cloud.size, cloud.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.ellipse(cloudX - cloud.size * 0.4, cloud.y - 3, cloud.size * 0.6, cloud.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cloudX + cloud.size * 0.4, cloud.y - 3, cloud.size * 0.6, cloud.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.shadowBlur = 0;
}

function drawSun() {
    ctx.fillStyle = '#ffdd88';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ffaa44';
    ctx.beginPath();
    ctx.arc(WIDTH - 80, 60, 40, 0, Math.PI * 2);
    ctx.fill();
    
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

function drawBackgroundEffects() {
    if (!ctx) return;
    
    const isDungeonActive = (typeof dungeonActive !== 'undefined') ? dungeonActive : false;
    if (isDungeonActive) return; // В данже нет звёзд и облаков
    
    drawStars();
    drawClouds();
    drawSun();
}

function drawSkyBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, '#0a2a5a');
    gradient.addColorStop(0.4, '#1a3a6a');
    gradient.addColorStop(0.7, '#2a4a7a');
    gradient.addColorStop(1, '#4a6a9a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

// ========== КОНЕЦ ФУНКЦИЙ ФОНА ==========

function getCachedTilePosition(x, y, z = 0) {
    const key = `${x},${y},${z}`;
    if (!tilePositionCache.has(key)) {
        tilePositionCache.set(key, {
            x: (x - y) * TILE_W / 2 + OFFSET_X,
            y: (x + y) * TILE_H / 2 + OFFSET_Y - z
        });
    }
    return tilePositionCache.get(key);
}

function tileToScreen(x, y, z = 0) {
    return getCachedTilePosition(x, y, z);
}

function screenToTile(screenX, screenY) {
    const isoX = (screenX - OFFSET_X) / (TILE_W / 2);
    const isoY = (screenY - OFFSET_Y) / (TILE_H / 2);
    return {
        x: Math.round((isoX + isoY) / 2),
        y: Math.round((isoY - isoX) / 2)
    };
}

function isWalkable(x, y) {
    if (!MAP || MAP.length === 0) return true;
    if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) return false;
    const tile = MAP[y][x];
    if (tile === 1 || tile === 24) return false;
    if (tile === 10 || tile === 12) return false;
    if (tile === 25) return false;
    return true;
}

function canMoveDiagonally(fromX, fromY, toX, toY) {
    if (toX === fromX || toY === fromY) return true;
    return isWalkable(toX, fromY) && isWalkable(fromX, toY);
}

const VISION_RADIUS = 8;

function isInVision(tileX, tileY, playerX, playerY, playerDir) {
    const dx = Math.abs(tileX - playerX);
    const dy = Math.abs(tileY - playerY);
    
    if (dx > VISION_RADIUS || dy > VISION_RADIUS) return false;
    if (dx <= 2 && dy <= 2) return true;
    
    const dist = Math.max(dx, dy);
    
    if (dist > 0) {
        const stepX = Math.sign(tileX - playerX);
        const stepY = Math.sign(tileY - playerY);
        
        let currentX = Math.floor(playerX);
        let currentY = Math.floor(playerY);
        let steps = 0;
        const maxSteps = dist * 2;
        
        while ((currentX !== Math.floor(tileX) || currentY !== Math.floor(tileY)) && steps < maxSteps) {
            if (currentX !== Math.floor(tileX)) currentX += stepX;
            if (currentY !== Math.floor(tileY)) currentY += stepY;
            
            if (currentX !== Math.floor(tileX) || currentY !== Math.floor(tileY)) {
                if (!isWalkable(currentX, currentY)) return false;
            }
            steps++;
        }
    }
    
    return true;
}

// ========== ИЗМЕНЕНИЕ: ФУНКЦИЯ БОЛЬШЕ НЕ НУЖНА ==========
function updateExploredTiles() {
    // Ничего не делаем — вся карта всегда открыта
    return;
}

function hasLineOfSight(x1, y1, x2, y2) {
    const cacheKey = `${Math.floor(x1)},${Math.floor(y1)}-${Math.floor(x2)},${Math.floor(y2)}`;
    
    if (lastPlayerPos.x === x1 && lastPlayerPos.y === y1 && losCache.has(cacheKey)) {
        return losCache.get(cacheKey);
    }
    
    let dx = Math.abs(x2 - x1);
    let dy = Math.abs(y2 - y1);
    let sx = x1 < x2 ? 1 : -1;
    let sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    
    let cx = Math.floor(x1), cy = Math.floor(y1);
    let targetX = Math.floor(x2), targetY = Math.floor(y2);
    
    while (!(cx === targetX && cy === targetY)) {
        let e2 = err * 2;
        if (e2 > -dy) { err -= dy; cx += sx; }
        if (e2 < dx) { err += dx; cy += sy; }
        
        if (cx !== targetX || cy !== targetY) {
            if (!isWalkable(cx, cy)) {
                losCache.set(cacheKey, false);
                return false;
            }
        }
    }
    
    losCache.set(cacheKey, true);
    lastPlayerPos = { x: x1, y: y1 };
    return true;
}

function getEnemyAtTile(tileX, tileY) {
    if (!window.enemies) return null;
    for (let e of window.enemies) {
        if (Math.abs(e.x - tileX) <= 0.8 && Math.abs(e.y - tileY) <= 0.8) {
            if (isInVision(e.x, e.y, window.player.x, window.player.y, window.player.direction)) return e;
        }
    }
    return null;
}

class PriorityQueue {
    constructor() { this.heap = []; }
    push(node) { this.heap.push(node); this.bubbleUp(this.heap.length - 1); }
    bubbleUp(index) {
        while (index > 0) {
            const parent = Math.floor((index - 1) / 2);
            if (this.heap[parent].cost <= this.heap[index].cost) break;
            [this.heap[parent], this.heap[index]] = [this.heap[index], this.heap[parent]];
            index = parent;
        }
    }
    pop() {
        const min = this.heap[0];
        const last = this.heap.pop();
        if (this.heap.length > 0) { this.heap[0] = last; this.sinkDown(0); }
        return min;
    }
    sinkDown(index) {
        const length = this.heap.length;
        while (true) {
            let leftChild = 2 * index + 1;
            let rightChild = 2 * index + 2;
            let swap = null;
            let element = this.heap[index];
            
            if (leftChild < length && this.heap[leftChild].cost < element.cost) swap = leftChild;
            if (rightChild < length && ((swap === null && this.heap[rightChild].cost < element.cost) ||
                (swap !== null && this.heap[rightChild].cost < this.heap[leftChild].cost))) swap = rightChild;
            
            if (swap === null) break;
            [this.heap[index], this.heap[swap]] = [this.heap[swap], this.heap[index]];
            index = swap;
        }
    }
    isEmpty() { return this.heap.length === 0; }
}

function heuristic(x1, y1, x2, y2) {
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);
    return Math.max(dx, dy);
}

function findPath(startX, startY, targetX, targetY) {
    if (!isWalkable(targetX, targetY)) return null;
    if (startX === targetX && startY === targetY) return [];
    
    const openSet = new PriorityQueue();
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    
    const startKey = `${startX},${startY}`;
    gScore.set(startKey, 0);
    fScore.set(startKey, heuristic(startX, startY, targetX, targetY));
    openSet.push({ x: startX, y: startY, cost: fScore.get(startKey) });
    
    const directions = [
        { dx: 0, dy: -1, cost: 1 },
        { dx: 0, dy: 1, cost: 1 },
        { dx: -1, dy: 0, cost: 1 },
        { dx: 1, dy: 0, cost: 1 },
        { dx: -1, dy: -1, cost: 1.4 },
        { dx: 1, dy: -1, cost: 1.4 },
        { dx: -1, dy: 1, cost: 1.4 },
        { dx: 1, dy: 1, cost: 1.4 }
    ];
    
    while (!openSet.isEmpty()) {
        const current = openSet.pop();
        const currentKey = `${current.x},${current.y}`;
        
        if (current.x === targetX && current.y === targetY) {
            const path = [];
            let curr = { x: current.x, y: current.y };
            while (cameFrom.has(`${curr.x},${curr.y}`)) {
                path.unshift(curr);
                curr = cameFrom.get(`${curr.x},${curr.y}`);
            }
            return path;
        }
        
        closedSet.add(currentKey);
        
        for (let dir of directions) {
            const nx = current.x + dir.dx;
            const ny = current.y + dir.dy;
            const neighborKey = `${nx},${ny}`;
            
            if (!isWalkable(nx, ny) || closedSet.has(neighborKey)) continue;
            
            if (dir.dx !== 0 && dir.dy !== 0) {
                if (!isWalkable(current.x + dir.dx, current.y) || 
                    !isWalkable(current.x, current.y + dir.dy)) {
                    continue;
                }
            }
            
            const tentativeG = gScore.get(currentKey) + dir.cost;
            
            if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)) {
                cameFrom.set(neighborKey, { x: current.x, y: current.y });
                gScore.set(neighborKey, tentativeG);
                const f = tentativeG + heuristic(nx, ny, targetX, targetY);
                fScore.set(neighborKey, f);
                openSet.push({ x: nx, y: ny, cost: f });
            }
        }
    }
    return null;
}

let currentPath = [];
let currentTarget = null;
let pathUpdateCounter = 0;

function moveAlongPath() {
    if (!window.player) return;
    if (window.player.moveTimer > 0) { 
        window.player.moveTimer--; 
        return; 
    }
    
    if (!currentTarget) { 
        window.moving = false; 
        return; 
    }
    
    if (window.player.x === currentTarget.x && window.player.y === currentTarget.y) { 
        window.moving = false; 
        currentPath = []; 
        currentTarget = null;
        return; 
    }
    
    pathUpdateCounter++;
    if (currentPath.length === 0 || pathUpdateCounter > 15) {
        pathUpdateCounter = 0;
        currentPath = findPath(window.player.x, window.player.y, currentTarget.x, currentTarget.y);
        if (!currentPath || currentPath.length === 0) { 
            window.moving = false; 
            currentTarget = null; 
            return; 
        }
    }
    
    if (currentPath.length > 0) {
        let nextStep = currentPath[0];
        if (isWalkable(nextStep.x, nextStep.y)) {
            const dx = Math.abs(nextStep.x - window.player.x);
            const dy = Math.abs(nextStep.y - window.player.y);
            const isDiagonal = dx > 0 && dy > 0;
            
            if (isDiagonal && !canMoveDiagonally(window.player.x, window.player.y, nextStep.x, nextStep.y)) {
                currentPath = findPath(window.player.x, window.player.y, currentTarget.x, currentTarget.y);
                return;
            }
            
            window.player.x = nextStep.x;
            window.player.y = nextStep.y;
            window.moving = true;
            window.player.moveTimer = isDiagonal ? 20 : 16;
            currentPath.shift();
        } else {
            currentPath = findPath(window.player.x, window.player.y, currentTarget.x, currentTarget.y);
        }
    }
}

let walkAnim = 0, walkDir = 1, attackAnim = 0, hitFlash = 0;

function updateWalkAnim() {
    if (window.moving) {
        walkAnim += 0.12 * walkDir;
        if (walkAnim > 1) { walkAnim = 1; walkDir = -1; }
        if (walkAnim < -1) { walkAnim = -1; walkDir = 1; }
    } else { walkAnim = 0; walkDir = 1; }
}

function startAttack() { attackAnim = 1; }
function updateAttackAnim() { if (attackAnim > 0) { attackAnim -= 0.12; if (attackAnim < 0) attackAnim = 0; } }
function startHitFlash() { hitFlash = 10; }
function updateHitFlash() { if (hitFlash > 0) hitFlash--; }

function addFloatingDamage(x, y, damage, isCritical = false) {
    if (floatingDamage.length > MAX_EFFECTS) floatingDamage.shift();
    const screenPos = tileToScreen(x, y);
    floatingDamage.push({ x: screenPos.x, y: screenPos.y - 20, damage: Math.floor(damage), life: 1, isCritical: isCritical });
}

function addPickupEffect(x, y, text) {
    if (pickupEffects.length > MAX_EFFECTS) pickupEffects.shift();
    const screenPos = tileToScreen(x, y);
    pickupEffects.push({ x: screenPos.x, y: screenPos.y, text: text, life: 1 });
}

function updateEffects() {
    for (let i = floatingDamage.length - 1; i >= 0; i--) {
        floatingDamage[i].life -= 0.02;
        floatingDamage[i].y -= 1;
        if (floatingDamage[i].life <= 0) floatingDamage.splice(i, 1);
    }
    for (let i = pickupEffects.length - 1; i >= 0; i--) {
        pickupEffects[i].life -= 0.02;
        pickupEffects[i].y -= 0.5;
        if (pickupEffects[i].life <= 0) pickupEffects.splice(i, 1);
    }
}

function tileToScreenWithCamera(x, y, z = 0) {
    const worldPos = tileToScreen(x, y, z);
    return { 
        x: worldPos.x - (window.camera ? window.camera.x : 0), 
        y: worldPos.y - (window.camera ? window.camera.y : 0) 
    };
}

function screenToTileWithCamera(screenX, screenY) {
    if (!window.camera) return { x: 10, y: 10 };
    const worldX = screenX + window.camera.x;
    const worldY = screenY + window.camera.y;
    return screenToTile(worldX, worldY);
}

function clearCache() { tilePositionCache.clear(); losCache.clear(); }

window.clearCache = clearCache;

function drawPortalHover() {
    if (!ctx || !hoveredPortal) return;
    if (!isInVision(hoveredPortal.x, hoveredPortal.y, window.player.x, window.player.y, window.player.direction)) return;
    
    const pos = tileToScreenWithCamera(hoveredPortal.x, hoveredPortal.y);
    ctx.globalAlpha = 0.5;
    const pulse = Math.sin(Date.now() * 0.008) * 0.3 + 0.7;
    
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y + TILE_H/2 - 5, 18, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = hoveredPortal.type === 10 ? `rgba(170, 68, 255, ${0.4 * pulse})` : `rgba(255, 170, 51, ${0.4 * pulse})`;
    ctx.fill();
    
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y + TILE_H/2 - 5, 24, 16, 0, 0, Math.PI * 2);
    ctx.fillStyle = hoveredPortal.type === 10 ? `rgba(170, 68, 255, ${0.2 * pulse})` : `rgba(255, 170, 51, ${0.2 * pulse})`;
    ctx.fill();
    
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 5;
    ctx.shadowColor = hoveredPortal.type === 10 ? "#aa44ff" : "#ffaa33";
    
    ctx.strokeStyle = hoveredPortal.type === 10 ? "#cc88ff" : "#ffdd88";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y + TILE_H/2 - 5, 14, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
}

function drawDungeonAtmosphere() {
    if (!ctx) return;
    const isDungeonActive = (typeof dungeonActive !== 'undefined') ? dungeonActive : false;
    if (isDungeonActive) {
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = "#2a0a2a";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.globalAlpha = 1;
    }
}

function drawMap() {
    if (!ctx || !MAP || MAP.length === 0 || !window.camera) return;
    // ========== ИЗМЕНЕНИЕ: УБРАЛИ updateExploredTiles() ==========
    
    const isDungeonActive = (typeof dungeonActive !== 'undefined') ? dungeonActive : false;
    
    if (!isDungeonActive) {
        // Сначала рисуем фон (градиент неба)
        drawSkyBackground();
        // Затем звёзды, облака и солнце
        drawBackgroundEffects();
    } else {
        ctx.fillStyle = "#0a0a1a";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
    
    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            if (!MAP[y] || MAP[y][x] === undefined) continue;
            // ========== ИЗМЕНЕНИЕ: УБРАЛИ ПРОВЕРКУ exploredTiles ==========
            
            const isVisible = isInVision(x, y, window.player.x, window.player.y, window.player.direction);
            const alpha = isVisible ? 1 : 0.35;
            ctx.globalAlpha = alpha;
            
            const pos = tileToScreenWithCamera(x, y);
            const tileType = MAP[y][x];
            
            if (!isDungeonActive) {
                if (tileType === 0) {
                    ctx.fillStyle = "#4a8c3f";
                    ctx.beginPath();
                    ctx.moveTo(pos.x, pos.y);
                    ctx.lineTo(pos.x + TILE_W/2, pos.y + TILE_H/2);
                    ctx.lineTo(pos.x, pos.y + TILE_H);
                    ctx.lineTo(pos.x - TILE_W/2, pos.y + TILE_H/2);
                    ctx.fill();
                }
                else if (tileType === 1) {
                    // Земля под дерево — цвет травы
                    ctx.fillStyle = "#4a8c3f";
                    ctx.beginPath();
                    ctx.moveTo(pos.x, pos.y);
                    ctx.lineTo(pos.x + TILE_W/2, pos.y + TILE_H/2);
                    ctx.lineTo(pos.x, pos.y + TILE_H);
                    ctx.lineTo(pos.x - TILE_W/2, pos.y + TILE_H/2);
                    ctx.fill();
                    
                    // Ствол дерева
                    ctx.fillStyle = "#5a3a2a";
                    ctx.fillRect(pos.x - 8, pos.y - 15, 16, 25);
                    
                    // Листва — тёмно-зелёная
                    ctx.fillStyle = "#2a6a2a";
                    ctx.beginPath();
                    ctx.ellipse(pos.x, pos.y - 18, 12, 14, 0, 0, Math.PI*2);
                    ctx.fill();
                }
                else if (tileType === 20) {
                    ctx.fillStyle = "#4a8c3f";
                    ctx.beginPath();
                    ctx.moveTo(pos.x, pos.y);
                    ctx.lineTo(pos.x + TILE_W/2, pos.y + TILE_H/2);
                    ctx.lineTo(pos.x, pos.y + TILE_H);
                    ctx.lineTo(pos.x - TILE_W/2, pos.y + TILE_H/2);
                    ctx.fill();
                    ctx.fillStyle = "#ff4444";
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y + 8, 4, 0, Math.PI*2);
                    ctx.fill();
                }
                else if (tileType === 21 || tileType === 22 || tileType === 23 || tileType === 25) {
                    ctx.fillStyle = "#4a8c3f";
                    ctx.beginPath();
                    ctx.moveTo(pos.x, pos.y);
                    ctx.lineTo(pos.x + TILE_W/2, pos.y + TILE_H/2);
                    ctx.lineTo(pos.x, pos.y + TILE_H);
                    ctx.lineTo(pos.x - TILE_W/2, pos.y + TILE_H/2);
                    ctx.fill();
                }
                else if (tileType === 24) {
                    // Земля под дерево — цвет травы
                    ctx.fillStyle = "#4a8c3f";
                    ctx.beginPath();
                    ctx.moveTo(pos.x, pos.y);
                    ctx.lineTo(pos.x + TILE_W/2, pos.y + TILE_H/2);
                    ctx.lineTo(pos.x, pos.y + TILE_H);
                    ctx.lineTo(pos.x - TILE_W/2, pos.y + TILE_H/2);
                    ctx.fill();
                    
                    // Ствол
                    ctx.fillStyle = "#4a3a2a";
                    ctx.fillRect(pos.x - 6, pos.y - 20, 12, 30);
                    
                    // Листва — тёмно-зелёная
                    ctx.fillStyle = "#2a6a2a";
                    ctx.beginPath();
                    ctx.ellipse(pos.x, pos.y - 25, 18, 16, 0, 0, Math.PI*2);
                    ctx.fill();
                }
            }
            else {
                if (tileType === 0) {
                    ctx.fillStyle = "#2a2522";
                    ctx.beginPath();
                    ctx.moveTo(pos.x, pos.y);
                    ctx.lineTo(pos.x + TILE_W/2, pos.y + TILE_H/2);
                    ctx.lineTo(pos.x, pos.y + TILE_H);
                    ctx.lineTo(pos.x - TILE_W/2, pos.y + TILE_H/2);
                    ctx.fill();
                }
                else if (tileType === 1) {
                    ctx.fillStyle = "#2a2520";
                    ctx.beginPath();
                    ctx.moveTo(pos.x, pos.y);
                    ctx.lineTo(pos.x + TILE_W/2, pos.y + TILE_H/2);
                    ctx.lineTo(pos.x, pos.y + TILE_H);
                    ctx.lineTo(pos.x - TILE_W/2, pos.y + TILE_H/2);
                    ctx.fill();
                    ctx.fillStyle = "#3a3530";
                    for (let i = -1; i <= 1; i++) ctx.fillRect(pos.x - 8 + i*8, pos.y - 3, 6, 3);
                    ctx.fillStyle = "#4a4540";
                    ctx.fillRect(pos.x - 4, pos.y - 12, 8, 18);
                }
                else if (tileType === 20 || tileType === 21 || tileType === 22 || tileType === 23 || tileType === 30 || tileType === 31) {
                    ctx.fillStyle = "#3a2a2a";
                    ctx.beginPath();
                    ctx.moveTo(pos.x, pos.y);
                    ctx.lineTo(pos.x + TILE_W/2, pos.y + TILE_H/2);
                    ctx.lineTo(pos.x, pos.y + TILE_H);
                    ctx.lineTo(pos.x - TILE_W/2, pos.y + TILE_H/2);
                    ctx.fill();
                    if (tileType === 20) {
                        ctx.fillStyle = "#aa2222";
                        ctx.globalAlpha = 0.6;
                        ctx.beginPath();
                        ctx.ellipse(pos.x, pos.y + 10, 7, 3, 0, 0, Math.PI*2);
                        ctx.fill();
                        ctx.globalAlpha = alpha;
                    }
                }
            }
            
            // ========== ПОРТАЛЫ (С ЗЕМЛЁЙ ПОД НИМИ) ==========
            if (tileType === 10 || tileType === 12) {
                // Сначала рисуем землю под порталом
                ctx.fillStyle = isDungeonActive ? "#2a2522" : "#4a8c3f";
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(pos.x + TILE_W/2, pos.y + TILE_H/2);
                ctx.lineTo(pos.x, pos.y + TILE_H);
                ctx.lineTo(pos.x - TILE_W/2, pos.y + TILE_H/2);
                ctx.fill();
                
                // Затем сам портал
                if (tileType === 10) {
                    ctx.fillStyle = "#aa44ff";
                    ctx.globalAlpha = 0.8;
                    ctx.beginPath();
                    ctx.ellipse(pos.x, pos.y + TILE_H/2 - 5, 14, 9, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = "#cc88ff";
                    ctx.font = "bold 22px monospace";
                    ctx.fillText("🌀", pos.x - 9, pos.y - 2);
                    if (!isDungeonActive) {
                        ctx.fillStyle = "#ffffff";
                        ctx.font = "8px monospace";
                        ctx.fillText("В ДАНЖ", pos.x - 14, pos.y + 6);
                    }
                    ctx.globalAlpha = alpha;
                }
                else if (tileType === 12) {
                    ctx.fillStyle = "#ffaa33";
                    ctx.globalAlpha = 0.8;
                    ctx.beginPath();
                    ctx.ellipse(pos.x, pos.y + TILE_H/2 - 5, 14, 9, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = "#ffdd88";
                    ctx.font = "bold 22px monospace";
                    ctx.fillText("⭐", pos.x - 9, pos.y - 2);
                    if (isDungeonActive) {
                        ctx.fillStyle = "#ffffff";
                        ctx.font = "8px monospace";
                        ctx.fillText("ДОМОЙ", pos.x - 13, pos.y + 6);
                    }
                    ctx.globalAlpha = alpha;
                }
            }
        }
    }
    
    // ========== ИЗМЕНЕНИЕ: УБРАЛИ БЛОК С ТЕМНОТОЙ НА НЕВИДИМЫХ КЛЕТКАХ ==========
    
    ctx.globalAlpha = 1;
    
    if (typeof drawShopKeeper === 'function') drawShopKeeper();
}

function drawVisionCone() {
    if (!ctx || !window.player) return;
    const pos = tileToScreenWithCamera(window.player.x, window.player.y);
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = "#88aaff";
    ctx.beginPath();
    ctx.arc(pos.x, pos.y - 8, VISION_RADIUS * 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
}

function drawMoveTarget() {
    if (!ctx) return;
    if (currentTarget) {
        const pos = tileToScreenWithCamera(currentTarget.x, currentTarget.y);
        ctx.fillStyle = "rgba(255, 200, 100, 0.3)";
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x + TILE_W/2, pos.y + TILE_H/2);
        ctx.lineTo(pos.x, pos.y + TILE_H);
        ctx.lineTo(pos.x - TILE_W/2, pos.y + TILE_H/2);
        ctx.fill();
        ctx.fillStyle = "#ffcc66";
        ctx.font = "bold 20px monospace";
        ctx.shadowBlur = 3;
        ctx.fillText("↓", pos.x - 6, pos.y - 3);
        ctx.shadowBlur = 0;
    }
}

function drawEffects() {
    if (!ctx) return;
    const cameraX = window.camera ? window.camera.x : 0;
    const cameraY = window.camera ? window.camera.y : 0;
    
    for (let d of floatingDamage) {
        ctx.font = `bold ${d.isCritical ? 24 : 18}px monospace`;
        ctx.fillStyle = d.isCritical ? "#ffaa44" : "#ff6666";
        ctx.shadowBlur = 5;
        ctx.shadowColor = "black";
        ctx.fillText(`-${d.damage}${d.isCritical ? '!' : ''}`, d.x - cameraX - 20, d.y - cameraY);
    }
    for (let p of pickupEffects) {
        ctx.font = "bold 20px monospace";
        ctx.fillStyle = "#ffcc88";
        ctx.shadowBlur = 5;
        ctx.shadowColor = "black";
        ctx.fillText(p.text, p.x - cameraX - 25, p.y - cameraY);
    }
    ctx.shadowBlur = 0;
}

function drawMinimap() {
    if (!ctx || !MAP || !window.player) return;
    const size = 130;
    const minimapX = WIDTH - size - 10;
    const minimapY = 10;
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(minimapX - 2, minimapY - 2, size + 4, size + 4);
    ctx.fillStyle = "rgba(20, 20, 30, 0.9)";
    ctx.fillRect(minimapX, minimapY, size, size);
    
    const cellSize = size / MAP_W;
    const isDungeonActive = (typeof dungeonActive !== 'undefined') ? dungeonActive : false;
    
    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            if (!MAP[y]) continue;
            // ========== ИЗМЕНЕНИЕ: УБРАЛИ ПРОВЕРКУ exploredTiles ==========
            
            let color;
            const tile = MAP[y][x];
            
            if (!isDungeonActive) {
                if (tile === 0) color = "#5a9e4a";
                else if (tile === 1) color = "#5a3a2a";
                else if (tile === 20) color = "#ff69b4";
                else if (tile === 21) color = "#3a7c2f";
                else if (tile === 22) color = "#999999";
                else if (tile === 23) color = "#dd6633";
                else if (tile === 24) color = "#2a8c2f";
                else if (tile === 25) color = "#ff8844";
                else if (tile === 10) color = "#aa44ff";
                else if (tile === 12) color = "#ffaa33";
                else color = "#4a8c3f";
            } else {
                if (tile === 0) color = "#3a3330";
                else if (tile === 1) color = "#2a2520";
                else if (tile === 20) color = "#aa2222";
                else if (tile === 21) color = "#ddccaa";
                else if (tile === 22) color = "#ffaa44";
                else if (tile === 23) color = "#aa44ff";
                else if (tile === 24) color = "#3a3a2a";
                else if (tile === 25) color = "#aa4444";
                else if (tile === 30) color = "#cc3333";
                else if (tile === 31) color = "#aa3333";
                else if (tile === 10) color = "#aa44ff";
                else if (tile === 12) color = "#ffaa33";
                else color = "#2a2522";
            }
            
            const isVisible = isInVision(x, y, window.player.x, window.player.y, window.player.direction);
            if (!isVisible) {
                ctx.fillStyle = "#1a1a2a";
            } else {
                ctx.fillStyle = color;
            }
            ctx.fillRect(minimapX + x * cellSize, minimapY + y * cellSize, cellSize - 0.5, cellSize - 0.5);
        }
    }
    
    if (window.enemies) {
        for (let e of window.enemies) {
            const isVisible = isInVision(e.x, e.y, window.player.x, window.player.y, window.player.direction);
            if (isVisible) {
                ctx.fillStyle = e.isBoss ? "#ff8800" : "#ff3333";
                ctx.fillRect(minimapX + e.x * cellSize, minimapY + e.y * cellSize, cellSize - 0.5, cellSize - 0.5);
            }
        }
    }
    
    ctx.fillStyle = "#88ccff";
    ctx.fillRect(minimapX + window.player.x * cellSize, minimapY + window.player.y * cellSize, cellSize - 0.5, cellSize - 0.5);
    
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const centerX = minimapX + window.player.x * cellSize + cellSize/2;
    const centerY = minimapY + window.player.y * cellSize + cellSize/2;
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(window.player.direction) * cellSize * 1.2, 
               centerY + Math.sin(window.player.direction) * cellSize * 1.2);
    ctx.stroke();
    
    ctx.strokeStyle = "#aa3355";
    ctx.lineWidth = 1;
    ctx.strokeRect(minimapX - 1, minimapY - 1, size + 2, size + 2);
}

// ========== НОВАЯ ФУНКЦИЯ СОРТИРОВКИ ДЛЯ ПРАВИЛЬНОГО Z-ORDER ==========
function sortDrawableObjects(enemies, playerX, playerY, items = []) {
    const objects = [];
    
    // Добавляем врагов
    for (let e of enemies) {
        if (e.health <= 0) continue;
        objects.push({
            type: 'enemy',
            x: e.x,
            y: e.y,
            sortY: e.y + e.x / 1000,
            enemy: e
        });
    }
    
    // Добавляем игрока
    if (window.player) {
        objects.push({
            type: 'player',
            x: window.player.x,
            y: window.player.y,
            sortY: window.player.y + window.player.x / 1000
        });
    }
    
    // Сортируем по Y координате (чем выше Y, тем позже рисуем)
    objects.sort((a, b) => a.sortY - b.sortY);
    
    return objects;
}

// Функция отрисовки всего с правильным порядком
function drawAllWithDepth() {
    if (!ctx || !window.camera) return;
    
    const objects = sortDrawableObjects(window.enemies || [], window.player.x, window.player.y, []);
    
    // Рисуем всех в правильном порядке
    for (let obj of objects) {
        if (obj.type === 'enemy') {
            const pos = tileToScreenWithCamera(obj.enemy.x, obj.enemy.y);
            if (typeof drawEnemyBody === 'function') {
                drawEnemyBody(obj.enemy, pos);
            }
            // Рисуем ховер эффект если нужно
            if (hoveredEnemy === obj.enemy) {
                ctx.strokeStyle = "#ff6666";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.ellipse(pos.x, pos.y - 2, obj.enemy.size + 1, obj.enemy.size + 3, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else if (obj.type === 'player') {
            if (typeof drawPlayerBody === 'function') {
                drawPlayerBody();
            }
        }
    }
}

window.isWalkable = isWalkable;
window.hasLineOfSight = hasLineOfSight;
window.isInVision = isInVision;
window.tileToScreen = tileToScreen;
window.tileToScreenWithCamera = tileToScreenWithCamera;
window.screenToTileWithCamera = screenToTileWithCamera;
window.addPickupEffect = addPickupEffect;
window.addFloatingDamage = addFloatingDamage;
window.getEnemyAtTile = getEnemyAtTile;
window.updateEffects = updateEffects;
window.drawEffects = drawEffects;
window.drawMinimap = drawMinimap;
window.drawVisionCone = drawVisionCone;
window.drawMoveTarget = drawMoveTarget;
window.drawMap = drawMap;
window.drawDungeonAtmosphere = drawDungeonAtmosphere;
window.drawPortalHover = drawPortalHover;
window.moveAlongPath = moveAlongPath;
window.updateWalkAnim = updateWalkAnim;
window.updateAttackAnim = updateAttackAnim;
window.updateHitFlash = updateHitFlash;
window.startAttack = startAttack;
window.startHitFlash = startHitFlash;
window.sortDrawableObjects = sortDrawableObjects;
window.drawAllWithDepth = drawAllWithDepth;
window.MAP = MAP;
window.MAP_W = MAP_W;
window.MAP_H = MAP_H;
window.exploredTiles = exploredTiles;
window.currentPath = currentPath;
window.currentTarget = currentTarget;
window.walkAnim = walkAnim;
window.attackAnim = attackAnim;
window.hitFlash = hitFlash;
window.isMouseDown = isMouseDown;
window.moveToMouse = moveToMouse;
window.mouseTile = mouseTile;