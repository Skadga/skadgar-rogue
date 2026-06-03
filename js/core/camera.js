// ========== CAMERA.JS ==========
// ПРОСТАЯ ВЕРСИЯ БЕЗ ZOOM

window.camera = { x: 0, y: 0 };

function updateCamera() {
    if (!window.player) return;
    
    const playerScreen = tileToScreen(window.player.x, window.player.y);
    
    let targetX = playerScreen.x - WIDTH / 2;
    let targetY = playerScreen.y - HEIGHT / 2;
    
    window.camera.x += (targetX - window.camera.x) * 0.2;
    window.camera.y += (targetY - window.camera.y) * 0.2;
    
    const maxMapX = (MAP_W * TILE_W) / 2 + OFFSET_X;
    const maxMapY = (MAP_H * TILE_H) / 2 + OFFSET_Y;
    
    const minCamX = -WIDTH / 2;
    const maxCamX = maxMapX - WIDTH / 2;
    const minCamY = -HEIGHT / 2;
    const maxCamY = maxMapY - HEIGHT / 2;
    
    window.camera.x = Math.max(minCamX, Math.min(maxCamX, window.camera.x));
    window.camera.y = Math.max(minCamY, Math.min(maxCamY, window.camera.y));
}

window.updateCamera = updateCamera;