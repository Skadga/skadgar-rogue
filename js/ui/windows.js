// ========== WINDOWS.JS ==========
// ОКНА С АВТОСОХРАНЕНИЕМ И ДВУМЯ КНОПКАМИ АВТО-АТАКИ

class DraggableWindow {
    constructor(id, title, x, y, width, height, content) {
        this.id = id;
        this.title = title;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.content = content;
        this.isDragging = false;
        this.isResizing = false;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.resizeStartX = 0;
        this.resizeStartY = 0;
        this.resizeStartWidth = 0;
        this.resizeStartHeight = 0;
        this.zIndex = 100;
        this.minWidth = 200;
        this.minHeight = 150;
        this.visible = true;
        this.isMinimized = false;
        
        this.createWindow();
        this.loadPosition();
    }
    
    createWindow() {
        const existingWindow = document.getElementById(this.id);
        if (existingWindow) existingWindow.remove();
        
        const windowDiv = document.createElement('div');
        windowDiv.id = this.id;
        windowDiv.className = 'floating-window';
        windowDiv.style.left = this.x + 'px';
        windowDiv.style.top = this.y + 'px';
        windowDiv.style.width = this.width + 'px';
        windowDiv.style.height = this.height + 'px';
        windowDiv.style.zIndex = this.zIndex;
        
        windowDiv.innerHTML = `
            <div class="window-header">
                <div class="window-title">${this.title}</div>
                <div class="window-controls">
                    <button class="window-minimize" data-id="${this.id}">─</button>
                    <button class="window-close" data-id="${this.id}">✕</button>
                </div>
            </div>
            <div class="window-content">
                ${this.content}
            </div>
            <div class="window-resize-handle"></div>
        `;
        
        document.body.appendChild(windowDiv);
        
        const header = windowDiv.querySelector('.window-header');
        const resizeHandle = windowDiv.querySelector('.window-resize-handle');
        const minimizeBtn = windowDiv.querySelector('.window-minimize');
        const closeBtn = windowDiv.querySelector('.window-close');
        
        header.addEventListener('mousedown', (e) => this.startDrag(e));
        resizeHandle.addEventListener('mousedown', (e) => this.startResize(e));
        
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => this.toggleMinimize());
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.toggleVisibility());
        }
        
        windowDiv.addEventListener('click', () => this.bringToFront());
        
        if (!this.visible) {
            windowDiv.style.display = 'none';
        }
        if (this.isMinimized) {
            windowDiv.classList.add('minimized');
            windowDiv.style.height = '32px';
        }
        
        this.updateDynamicElements();
    }
    
    updateDynamicElements() {
    setTimeout(() => {
        if (this.id === 'window-stats') {
            this.updateStatsElements();
        }
        if (this.id === 'window-inventory' && window.updateInventoryUI) {
            window.updateInventoryUI();
        }
    }, 50);
	}

    
    updateStatsElements() {}
    
    startDrag(e) {
        if (e.target.classList.contains('window-minimize') || 
            e.target.classList.contains('window-close')) return;
        
        this.isDragging = true;
        this.dragOffsetX = e.clientX - this.x;
        this.dragOffsetY = e.clientY - this.y;
        
        const onDrag = (e) => this.onDrag(e);
        const stopDrag = () => this.stopDrag(onDrag, stopDrag);
        
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDrag);
    }
    
    onDrag(e) {
        if (!this.isDragging) return;
        
        let newX = e.clientX - this.dragOffsetX;
        let newY = e.clientY - this.dragOffsetY;
        
        newX = Math.max(0, Math.min(window.innerWidth - this.width, newX));
        newY = Math.max(0, Math.min(window.innerHeight - 50, newY));
        
        this.x = newX;
        this.y = newY;
        
        const windowDiv = document.getElementById(this.id);
        if (windowDiv) {
            windowDiv.style.left = this.x + 'px';
            windowDiv.style.top = this.y + 'px';
        }
        
        this.savePosition();
    }
    
    stopDrag(onDrag, stopDrag) {
        this.isDragging = false;
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
    }
    
    startResize(e) {
        e.preventDefault();
        e.stopPropagation();
        this.isResizing = true;
        this.resizeStartX = e.clientX;
        this.resizeStartY = e.clientY;
        this.resizeStartWidth = this.width;
        this.resizeStartHeight = this.height;
        
        const onResize = (e) => this.onResize(e);
        const stopResize = () => this.stopResize(onResize, stopResize);
        
        document.addEventListener('mousemove', onResize);
        document.addEventListener('mouseup', stopResize);
    }
    
    onResize(e) {
        if (!this.isResizing) return;
        
        let newWidth = this.resizeStartWidth + (e.clientX - this.resizeStartX);
        let newHeight = this.resizeStartHeight + (e.clientY - this.resizeStartY);
        
        newWidth = Math.max(this.minWidth, Math.min(window.innerWidth - this.x, newWidth));
        newHeight = Math.max(this.minHeight, Math.min(window.innerHeight - this.y, newHeight));
        
        this.width = newWidth;
        this.height = newHeight;
        
        const windowDiv = document.getElementById(this.id);
        if (windowDiv) {
            windowDiv.style.width = this.width + 'px';
            windowDiv.style.height = this.height + 'px';
        }
        
        this.savePosition();
    }
    
    stopResize(onResize, stopResize) {
        this.isResizing = false;
        document.removeEventListener('mousemove', onResize);
        document.removeEventListener('mouseup', stopResize);
    }
    
    bringToFront() {
        this.zIndex = Date.now() % 1000 + 100;
        const windowDiv = document.getElementById(this.id);
        if (windowDiv) windowDiv.style.zIndex = this.zIndex;
    }
    
    savePosition() {
        const positions = JSON.parse(localStorage.getItem('windowPositions') || '{}');
        positions[this.id] = { 
            x: this.x, 
            y: this.y, 
            width: this.width, 
            height: this.height, 
            visible: this.visible,
            minimized: this.isMinimized
        };
        localStorage.setItem('windowPositions', JSON.stringify(positions));
    }
    
    loadPosition() {
        const positions = JSON.parse(localStorage.getItem('windowPositions') || '{}');
        const pos = positions[this.id];
        if (pos) {
            this.x = pos.x;
            this.y = pos.y;
            this.width = pos.width;
            this.height = pos.height;
            this.visible = pos.visible !== false;
            this.isMinimized = pos.minimized || false;
        } else {
            this.setDefaultPosition();
        }
        this.applyPosition();
    }
    
    applyPosition() {
        const windowDiv = document.getElementById(this.id);
        if (windowDiv) {
            windowDiv.style.left = this.x + 'px';
            windowDiv.style.top = this.y + 'px';
            windowDiv.style.width = this.width + 'px';
            windowDiv.style.height = this.height + 'px';
            
            if (this.isMinimized) {
                windowDiv.classList.add('minimized');
                windowDiv.style.height = '32px';
            } else {
                windowDiv.classList.remove('minimized');
            }
            
            windowDiv.style.display = this.visible ? 'block' : 'none';
        }
    }
    
    setDefaultPosition() {
        if (this.id === 'window-stats') {
            this.x = 20;
            this.y = 20;
        } else if (this.id === 'window-controls') {
            this.x = 20;
            this.y = 460;
        } else if (this.id === 'window-inventory') {
            this.x = window.innerWidth - 500;
            this.y = 20;
        } else if (this.id === 'window-shop') {
            this.x = window.innerWidth - 500;
            this.y = 540;
        } else if (this.id === 'window-chat') {
            this.x = 20;
            this.y = window.innerHeight - 250;
        }
    }
    
    toggleMinimize() {
        const windowDiv = document.getElementById(this.id);
        if (!windowDiv) return;
        
        this.isMinimized = !this.isMinimized;
        
        if (this.isMinimized) {
            windowDiv.classList.add('minimized');
            windowDiv.style.height = '32px';
        } else {
            windowDiv.classList.remove('minimized');
            windowDiv.style.height = this.height + 'px';
        }
        this.savePosition();
    }
    
    toggleVisibility() {
        this.visible = !this.visible;
        const windowDiv = document.getElementById(this.id);
        if (windowDiv) windowDiv.style.display = this.visible ? 'block' : 'none';
        this.savePosition();
    }
    
    updateContent(newContent) {
        this.content = newContent;
        const windowDiv = document.getElementById(this.id);
        if (windowDiv) {
            const contentDiv = windowDiv.querySelector('.window-content');
            if (contentDiv) contentDiv.innerHTML = newContent;
            this.initAutoAttackButtons();
        }
    }
}

let windows = {};

function toggleWindow(windowId) {
    if (windows[windowId]) {
        windows[windowId].toggleVisibility();
    }
}

function resetWindowsPosition() {
    if (confirm('Сбросить все окна в стандартные позиции?')) {
        localStorage.removeItem('windowPositions');
        location.reload();
    }
}

window.addEventListener('resize', () => {
    for (let id in windows) {
        if (windows[id]) {
            const win = windows[id];
            win.x = Math.min(win.x, window.innerWidth - 50);
            win.y = Math.min(win.y, window.innerHeight - 50);
            win.x = Math.max(0, win.x);
            win.y = Math.max(0, win.y);
            
            const windowDiv = document.getElementById(id);
            if (windowDiv && !win.isMinimized) {
                windowDiv.style.left = win.x + 'px';
                windowDiv.style.top = win.y + 'px';
            }
        }
    }
});

function initFloatingWindows() {
    windows['window-stats'] = new DraggableWindow(
        'window-stats',
        '⚔️ ХАРАКТЕРИСТИКИ',
        20, 20, 260, 420,
        `
            <div class="stat-row"><span>❤️ Здоровье:</span> <span id="health">100</span>/<span id="maxHealth">100</span></div>
            <div class="health-bar"><div class="health-fill" id="healthFill" style="width:100%"></div></div>
            <div class="stat-row"><span>⭐ Уровень:</span> <span id="level">1</span></div>
            <div class="stat-row"><span>💀 Убийств:</span> <span id="kills">0</span></div>
            <div class="stat-row"><span>⚔️ Опыт:</span> <span id="xp">0</span>/<span id="nextXp">50</span></div>
            <div class="stat-row"><span>🗡️ Урон:</span> <span id="damage">15</span></div>
            <div class="stat-row"><span>⚔️ Атака:</span> <span id="attackStatus">Готов</span></div>
            <div class="stat-row"><span>🛡️ Броня:</span> <span id="armor">0</span></div>
            <div class="stat-row"><span>💰 Золото:</span> <span id="playerGold">100</span></div>
            <div class="stat-row" id="locationIndicator">🏝️ ПАРЯЩИЙ ОСТРОВ</div>
            <div class="stat-row" id="dungeonStat" style="display:none;">🌀 Прогресс данжа</div>
        `
    );
    
    windows['window-controls'] = new DraggableWindow(
    'window-controls',
    '🎮 УПРАВЛЕНИЕ',
    20, 460, 260, 470,
    `
        <div class="control-row">🖱️ ЛКМ (зажать) - движение</div>
        <div class="control-row">🖱️ ПКМ - атака / портал</div>
        <div class="control-row">⚡ Криты → искры! 💥</div>
        <div class="control-row">⌨️ I - инвентарь</div>
        <div class="control-row">⌨️ G - магазин</div>
        <div class="control-row">⌨️ E - портал</div>
        <div class="control-row">⌨️ R - рестарт</div>
        <div class="control-row">⌨️ ESC - меню</div>
        <div class="control-row" style="margin-top: 8px; text-align: center;">
            <button id="autoAttackBtn" class="auto-attack-btn" style="
                background: linear-gradient(135deg, #6a2a4a, #4a1a3a);
                border: 1px solid #aa3355;
                color: #ffcc88;
                padding: 8px 16px;
                border-radius: 25px;
                cursor: pointer;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                font-weight: bold;
                width: 100%;
                transition: all 0.2s;
            ">⚔️ АВТО-АТАКА</button>
        </div>
        <div class="control-row" id="autoAttackStatus" style="text-align: center; background: rgba(0,0,0,0.3); border-radius: 8px; margin-top: 8px; padding: 4px; color: #ffaa66;">
            ⚔️ СТАТУС: <span id="autoAttackStatusSpan" style="color:#ff8888">ВЫКЛ</span>
        </div>
        <div class="control-row" id="musicIndicator">🎵 Музыка...</div>
        <div class="control-row">🖱️ Тяни за угол окна - меняй размер</div>
        <div class="control-row">💾 Позиции окон сохраняются автоматически</div>
    `
);
    
    windows['window-inventory'] = new DraggableWindow(
        'window-inventory',
        '🎒 ИНВЕНТАРЬ',
        window.innerWidth - 500, 20, 450, 500,
        `
            <div class="inventory-equipment">
                <div class="equipment-slot" id="equip-slot-weapon" onclick="window.unequipItem('weapon')">
                    <div class="inventory-item empty">⚔️<span>Оружие</span></div>
                </div>
                <div class="equipment-slot" id="equip-slot-armor" onclick="window.unequipItem('armor')">
                    <div class="inventory-item empty">🛡️<span>Броня</span></div>
                </div>
                <div class="equipment-slot" id="equip-slot-helmet" onclick="window.unequipItem('helmet')">
                    <div class="inventory-item empty">⛑️<span>Шлем</span></div>
                </div>
                <div class="equipment-slot" id="equip-slot-ring" onclick="window.unequipItem('ring')">
                    <div class="inventory-item empty">💍<span>Кольцо</span></div>
                </div>
                <div class="equipment-slot" id="equip-slot-amulet" onclick="window.unequipItem('amulet')">
                    <div class="inventory-item empty">📿<span>Амулет</span></div>
                </div>
                <div class="equipment-slot" id="equip-slot-boots" onclick="window.unequipItem('boots')">
                    <div class="inventory-item empty">👢<span>Ботинки</span></div>
                </div>
            </div>
            <div class="inventory-stats">
                <span>💰 <span id="inventoryGold">0</span></span>
                <span>📦 <span id="inventoryFreeSlots">20</span>/20</span>
            </div>
            <div class="inventory-items-grid" id="inventory-items-list"></div>
            <div class="inventory-footer">
                <button onclick="window.closeInventory()">ЗАКРЫТЬ (I)</button>
            </div>
        `
    );
    
    windows['window-shop'] = new DraggableWindow(
        'window-shop',
        '🏪 МАГАЗИН',
        window.innerWidth - 500, 540, 450, 450,
        `
            <div class="shop-dialog">"Путник, нужны припасы? Золото решает всё!"</div>
            <div class="shop-inventory" id="shop-items-list"></div>
            <div class="shop-footer">
                <span>💰 <span id="playerGoldShop">0</span></span>
                <button onclick="window.closeShop()">Закрыть</button>
            </div>
        `
    );
    
    windows['window-chat'] = new DraggableWindow(
        'window-chat',
        '💬 СИСТЕМА',
        20, window.innerHeight - 250, 320, 220,
        `
            <div class="chat-messages" id="chatMessages">
                <div class="chat-message info">✨ Добро пожаловать на Skadgar, парящий остров!</div>
            </div>
            <input type="text" id="chatInput" class="chat-input" placeholder="Сообщение... (Enter)">
        `
    );
}

function addChatMessage(text, type = 'info') {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        const msg = document.createElement('div');
        msg.className = `chat-message ${type}`;
        msg.textContent = text;
        chatMessages.appendChild(msg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        while (chatMessages.children.length > 50) {
            chatMessages.removeChild(chatMessages.firstChild);
        }
    }
}

function updateAllWindowsUI() {
    if (!window.player) return;
    
    const healthEl = document.getElementById('health');
    const maxHealthEl = document.getElementById('maxHealth');
    const levelEl = document.getElementById('level');
    const killsEl = document.getElementById('kills');
    const xpEl = document.getElementById('xp');
    const nextXpEl = document.getElementById('nextXp');
    const damageEl = document.getElementById('damage');
    const armorEl = document.getElementById('armor');
    const goldEl = document.getElementById('playerGold');
    
    if (healthEl) healthEl.innerText = Math.floor(window.player.health);
    if (maxHealthEl) maxHealthEl.innerText = window.player.maxHealth;
    if (levelEl) levelEl.innerText = window.player.level;
    if (killsEl) killsEl.innerText = window.player.kills;
    if (xpEl) xpEl.innerText = window.player.xp;
    if (nextXpEl) nextXpEl.innerText = 50 * window.player.level;
    if (damageEl) damageEl.innerText = Math.floor(window.player.damage || window.player.baseDamage);
    if (armorEl) armorEl.innerText = Math.floor(window.player.armor);
    if (goldEl) goldEl.innerText = window.player.gold || 0;
    
    const healthFill = document.getElementById('healthFill');
    if (healthFill) {
        const percent = (window.player.health / window.player.maxHealth) * 100;
        healthFill.style.width = percent + '%';
    }
    
    const locationIndicator = document.getElementById('locationIndicator');
    if (locationIndicator) {
        const isDungeonActive = typeof dungeonActive !== 'undefined' && dungeonActive;
        if (isDungeonActive) {
            locationIndicator.innerHTML = '🏚️ ПОДЗЕМЕЛЬЕ (ОПАСНО)';
            locationIndicator.style.color = '#ff6666';
        } else {
            locationIndicator.innerHTML = '🏝️ ПАРЯЩИЙ ОСТРОВ (МИРНО)';
            locationIndicator.style.color = '#88ff88';
        }
    }
    
    const attackStatusEl = document.getElementById('attackStatus');
    if (attackStatusEl) {
        if (window.player.attackCooldown > 0) {
            attackStatusEl.innerHTML = `⚔️ Атака: <span style="color:#ff8888">${Math.ceil(window.player.attackCooldown / 6)}с</span>`;
        } else {
            attackStatusEl.innerHTML = '⚔️ Атака: <span style="color:#88ff88">ГОТОВ</span>';
        }
    }
    
    const inventoryGold = document.getElementById('inventoryGold');
    if (inventoryGold) inventoryGold.innerText = window.player.gold || 0;
    
    const playerGoldShop = document.getElementById('playerGoldShop');
    if (playerGoldShop) playerGoldShop.innerText = window.player.gold || 0;
    
    const inventoryFreeSlots = document.getElementById('inventoryFreeSlots');
    if (inventoryFreeSlots && window.inventory) {
        inventoryFreeSlots.innerText = window.inventory.maxSlots - window.inventory.items.length;
    }
}

window.windows = windows;
window.toggleWindow = toggleWindow;
window.resetWindowsPosition = resetWindowsPosition;
window.initFloatingWindows = initFloatingWindows;
window.addChatMessage = addChatMessage;
window.updateAllWindowsUI = updateAllWindowsUI;