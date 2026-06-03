// ========== MOBILE.JS ==========
// Полная адаптация под смартфоны и планшеты

let isMobile = false;
let touchStartPos = null;
let touchMovePos = null;
let joystickActive = false;
let joystickCenter = { x: 0, y: 0 };
let joystickKnob = { x: 0, y: 0 };
let joystickRadius = 50;
let joystickDirection = { x: 0, y: 0 };
let moveInterval = null;

// Проверка на мобильное устройство
function detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768);
}

// Создание виртуального джойстика
function createTouchJoystick() {
    const joystick = document.createElement('div');
    joystick.id = 'touchJoystick';
    joystick.innerHTML = `
        <div class="joystick-base">
            <div class="joystick-knob"></div>
        </div>
    `;
    document.body.appendChild(joystick);
    
    const base = joystick.querySelector('.joystick-base');
    const knob = joystick.querySelector('.joystick-knob');
    
    if (!base || !knob) return;
    
    // Обработчики для джойстика
    const startTouch = (e) => {
        e.preventDefault();
        const rect = base.getBoundingClientRect();
        joystickCenter = { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
        joystickActive = true;
        
        const touch = e.touches[0];
        updateJoystick(touch.clientX, touch.clientY, knob);
        startAutoMove();
    };
    
    const moveTouch = (e) => {
        if (!joystickActive) return;
        e.preventDefault();
        const touch = e.touches[0];
        updateJoystick(touch.clientX, touch.clientY, knob);
    };
    
    const endTouch = () => {
        joystickActive = false;
        joystickDirection = { x: 0, y: 0 };
        joystickKnob = { x: 0, y: 0 };
        if (knob) knob.style.transform = 'translate(0px, 0px)';
        stopAutoMove();
        // Останавливаем движение
        if (window.currentTarget) {
            window.currentTarget = null;
            window.currentPath = [];
            window.moving = false;
        }
    };
    
    function updateJoystick(clientX, clientY, knobEl) {
        if (!knobEl) return;
        
        let dx = clientX - joystickCenter.x;
        let dy = clientY - joystickCenter.y;
        const distance = Math.min(joystickRadius, Math.hypot(dx, dy));
        
        if (distance > 0) {
            dx = dx / Math.hypot(dx, dy) * distance;
            dy = dy / Math.hypot(dx, dy) * distance;
        }
        
        joystickDirection = { 
            x: dx / joystickRadius, 
            y: dy / joystickRadius 
        };
        joystickKnob = { x: dx, y: dy };
        knobEl.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    
    base.addEventListener('touchstart', startTouch, { passive: false });
    base.addEventListener('touchmove', moveTouch, { passive: false });
    base.addEventListener('touchend', endTouch);
    base.addEventListener('touchcancel', endTouch);
}

// Автоматическое движение при удержании джойстика
function startAutoMove() {
    if (moveInterval) clearInterval(moveInterval);
    
    moveInterval = setInterval(() => {
        if (!joystickActive || !window.gameActive || window.isPaused) return;
        if (Math.abs(joystickDirection.x) < 0.1 && Math.abs(joystickDirection.y) < 0.1) return;
        
        const speed = Math.min(1, Math.hypot(joystickDirection.x, joystickDirection.y));
        const angle = Math.atan2(joystickDirection.y, joystickDirection.x);
        
        // Движение игрока
        if (window.player) {
            let newX = window.player.x + Math.cos(angle) * 0.1 * speed;
            let newY = window.player.y + Math.sin(angle) * 0.1 * speed;
            
            const targetX = Math.floor(newX);
            const targetY = Math.floor(newY);
            
            if (isWalkable(targetX, targetY)) {
                window.player.x = newX;
                window.player.y = newY;
                window.moving = true;
            }
        }
    }, 50);
}

function stopAutoMove() {
    if (moveInterval) {
        clearInterval(moveInterval);
        moveInterval = null;
    }
}

// Создание кнопки атаки
function createAttackButton() {
    const attackBtn = document.createElement('div');
    attackBtn.id = 'mobileAttackBtn';
    attackBtn.innerHTML = '⚔️';
    document.body.appendChild(attackBtn);
    
    let attackCooldown = false;
    
    attackBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (attackCooldown) return;
        
        attackCooldown = true;
        attackBtn.classList.add('cooldown');
        
        if (typeof window.playerAttack === 'function') {
            window.playerAttack();
        } else if (typeof playerAttack === 'function') {
            playerAttack();
        }
        
        setTimeout(() => {
            attackCooldown = false;
            attackBtn.classList.remove('cooldown');
        }, 600);
    });
    
    return attackBtn;
}

// Создание кнопки зелья
function createPotionButton() {
    const potionBtn = document.createElement('div');
    potionBtn.id = 'mobilePotionBtn';
    potionBtn.innerHTML = '❤️';
    document.body.appendChild(potionBtn);
    
    potionBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (typeof window.useHealthPotion === 'function') {
            window.useHealthPotion();
        } else if (typeof useHealthPotion === 'function') {
            useHealthPotion();
        }
        updatePotionCount();
    });
    
    return potionBtn;
}

// Отображение количества зелий
function updatePotionCount() {
    let potionCount = 0;
    if (typeof window.playerPotions !== 'undefined') {
        potionCount = window.playerPotions.health;
    }
    
    let countEl = document.getElementById('mobilePotionCount');
    if (!countEl) {
        const btn = document.getElementById('mobilePotionBtn');
        if (btn) {
            countEl = document.createElement('span');
            countEl.id = 'mobilePotionCount';
            btn.appendChild(countEl);
        }
    }
    if (countEl) countEl.textContent = potionCount;
}

// Создание кнопки инвентаря
function createInventoryButton() {
    const invBtn = document.createElement('div');
    invBtn.id = 'mobileInventoryBtn';
    invBtn.innerHTML = '🎒';
    document.body.appendChild(invBtn);
    
    invBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (typeof window.openInventory === 'function') {
            window.openInventory();
        }
    });
    
    return invBtn;
}

// Создание кнопки паузы
function createPauseButton() {
    const pauseBtn = document.createElement('div');
    pauseBtn.id = 'mobilePauseBtn';
    pauseBtn.innerHTML = '⏸️';
    document.body.appendChild(pauseBtn);
    
    pauseBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (typeof window.togglePauseMenu === 'function') {
            window.togglePauseMenu();
        } else if (typeof togglePauseMenu === 'function') {
            togglePauseMenu();
        }
    });
    
    return pauseBtn;
}

// Создание кнопки магазина
function createShopButton() {
    const shopBtn = document.createElement('div');
    shopBtn.id = 'mobileShopBtn';
    shopBtn.innerHTML = '🏪';
    document.body.appendChild(shopBtn);
    
    shopBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (typeof window.openShop === 'function') {
            window.openShop();
        } else if (typeof openShop === 'function') {
            openShop();
        }
    });
    
    return shopBtn;
}

// Тап по врагу для выбора цели
function setupTapSelection() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        
        const tile = screenToTileWithCamera(x, y);
        const enemy = getEnemyAtTile(tile.x, tile.y);
        
        if (enemy) {
            window.hoveredEnemy = enemy;
            showTapFeedback(x, y, '👆');
        } else {
            // Движение при тапе
            if (isWalkable(tile.x, tile.y)) {
                window.currentTarget = { x: tile.x, y: tile.y };
                window.currentPath = [];
                window.moving = true;
                showTapFeedback(x, y, '🚶');
            }
        }
    });
}

// Визуальный фидбек при тапе
function showTapFeedback(x, y, icon) {
    const feedback = document.createElement('div');
    feedback.className = 'tap-feedback';
    feedback.innerHTML = icon;
    feedback.style.left = (x + (window.camera?.x || 0)) + 'px';
    feedback.style.top = (y + (window.camera?.y || 0)) + 'px';
    document.body.appendChild(feedback);
    
    setTimeout(() => feedback.remove(), 500);
}

// Модификация onMouseMove для поддержки тач-событий
function initMobileInput() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    
    // Замена mousemove на touchmove
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!window.gameActive || window.isPaused) return;
        
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const mouseX = (touch.clientX - rect.left) * scaleX;
        const mouseY = (touch.clientY - rect.top) * scaleY;
        
        window.mouseScreenX = mouseX;
        window.mouseScreenY = mouseY;
        
        window.mouseTile = screenToTileWithCamera(mouseX, mouseY);
        
        // Поворот игрока к месту тапа
        if (window.player) {
            const playerScreen = tileToScreenWithCamera(window.player.x, window.player.y);
            const lookAngle = Math.atan2(mouseY - playerScreen.y, mouseX - playerScreen.x);
            window.player.direction = lookAngle;
            window.player.upperBodyAngle = lookAngle;
            window.player.lowerBodyAngle = lookAngle;
        }
        
        // Обновление ховера
        const newHoveredEnemy = getEnemyAtTile(window.mouseTile.x, window.mouseTile.y);
        if (newHoveredEnemy !== window.hoveredEnemy) {
            window.hoveredEnemy = newHoveredEnemy;
        }
    });
    
    // Тап для атаки (если выбран враг)
    canvas.addEventListener('touchstart', (e) => {
        if (window.hoveredEnemy && typeof window.playerAttack === 'function') {
            window.playerAttack();
        }
    });
    
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

// Добавление мобильных стилей
function addMobileStyles() {
    if (document.getElementById('mobile-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'mobile-styles';
    style.textContent = `
        /* Джойстик */
        #touchJoystick {
            position: fixed;
            bottom: 100px;
            left: 80px;
            z-index: 200;
        }
        
        .joystick-base {
            width: 100px;
            height: 100px;
            background: rgba(30, 30, 50, 0.85);
            border-radius: 50%;
            border: 2px solid rgba(255, 204, 136, 0.8);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
        }
        
        .joystick-knob {
            width: 45px;
            height: 45px;
            background: linear-gradient(135deg, #ffcc88, #ffaa44);
            border-radius: 50%;
            transition: transform 0.05s linear;
            box-shadow: 0 0 10px rgba(255,200,100,0.5);
        }
        
        /* Мобильные кнопки */
        #mobileAttackBtn, #mobilePotionBtn, #mobileInventoryBtn, #mobilePauseBtn, #mobileShopBtn {
            position: fixed;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #2a1a3a, #1a0a2a);
            border: 2px solid #ffcc88;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            cursor: pointer;
            z-index: 200;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transition: all 0.1s ease;
            backdrop-filter: blur(5px);
            -webkit-tap-highlight-color: transparent;
        }
        
        #mobileAttackBtn { bottom: 100px; right: 80px; background: linear-gradient(135deg, #aa3355, #8a2a4a); }
        #mobilePotionBtn { bottom: 180px; right: 80px; }
        #mobileInventoryBtn { bottom: 260px; right: 80px; }
        #mobilePauseBtn { top: 20px; right: 20px; width: 50px; height: 50px; font-size: 24px; }
        #mobileShopBtn { top: 20px; right: 90px; width: 50px; height: 50px; font-size: 24px; }
        
        #mobileAttackBtn:active, #mobilePotionBtn:active, #mobileInventoryBtn:active,
        #mobilePauseBtn:active, #mobileShopBtn:active {
            transform: scale(0.95);
        }
        
        #mobileAttackBtn.cooldown {
            opacity: 0.6;
            transform: scale(0.95);
        }
        
        #mobilePotionCount {
            position: absolute;
            bottom: -5px;
            right: -5px;
            background: #ff4444;
            color: white;
            font-size: 12px;
            font-weight: bold;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid white;
        }
        
        .tap-feedback {
            position: fixed;
            font-size: 30px;
            pointer-events: none;
            z-index: 1000;
            animation: tapPulse 0.5s ease-out forwards;
            text-shadow: 0 0 5px rgba(0,0,0,0.5);
        }
        
        @keyframes tapPulse {
            0% { transform: scale(0.5); opacity: 1; }
            100% { transform: scale(1.5); opacity: 0; }
        }
        
        .mobile-tip {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.7);
            color: #ffcc88;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 11px;
            z-index: 200;
            white-space: nowrap;
            pointer-events: none;
            backdrop-filter: blur(5px);
            border: 1px solid #ffcc88;
        }
        
        @media (max-width: 600px) {
            #touchJoystick { bottom: 80px; left: 60px; }
            .joystick-base { width: 80px; height: 80px; }
            .joystick-knob { width: 35px; height: 35px; }
            
            #mobileAttackBtn { bottom: 80px; right: 60px; width: 55px; height: 55px; font-size: 24px; }
            #mobilePotionBtn { bottom: 150px; right: 60px; width: 55px; height: 55px; font-size: 24px; }
            #mobileInventoryBtn { bottom: 220px; right: 60px; width: 55px; height: 55px; font-size: 24px; }
            #mobilePauseBtn, #mobileShopBtn { width: 45px; height: 45px; font-size: 20px; }
        }
        
        @media (max-width: 400px) {
            #touchJoystick { bottom: 70px; left: 40px; }
            .joystick-base { width: 70px; height: 70px; }
            .joystick-knob { width: 30px; height: 30px; }
            
            #mobileAttackBtn { bottom: 70px; right: 40px; width: 50px; height: 50px; font-size: 22px; }
            #mobilePotionBtn { bottom: 130px; right: 40px; width: 50px; height: 50px; font-size: 22px; }
            #mobileInventoryBtn { bottom: 190px; right: 40px; width: 50px; height: 50px; font-size: 22px; }
        }
    `;
    document.head.appendChild(style);
}

// Адаптация UI для мобильных устройств
function adjustUIForMobile() {
    const controlsBar = document.querySelector('.window-controls-bar');
    if (controlsBar && isMobile) {
        controlsBar.style.display = 'flex';
        controlsBar.style.bottom = 'auto';
        controlsBar.style.top = '80px';
        controlsBar.style.right = '20px';
        controlsBar.style.left = 'auto';
        controlsBar.style.transform = 'none';
        controlsBar.style.flexDirection = 'column';
        controlsBar.style.gap = '5px';
        controlsBar.style.background = 'rgba(10, 10, 20, 0.85)';
        controlsBar.style.padding = '6px 10px';
        controlsBar.style.borderRadius = '20px';
        
        // Уменьшаем кнопки
        const btns = controlsBar.querySelectorAll('.window-control-btn');
        btns.forEach(btn => {
            btn.style.padding = '3px 8px';
            btn.style.fontSize = '9px';
            btn.style.margin = '2px 0';
        });
    }
    
    // Увеличиваем зону нажатия канваса
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        canvas.style.touchAction = 'none';
    }
}

// Основная функция инициализации мобильного управления
function initMobileControls() {
    isMobile = detectMobile();
    
    if (!isMobile) {
        console.log('💻 Десктопный режим');
        return;
    }
    
    console.log('📱 Мобильный режим активирован');
    
    addMobileStyles();
    
    setTimeout(() => {
        createTouchJoystick();
        createAttackButton();
        createPotionButton();
        createInventoryButton();
        createPauseButton();
        createShopButton();
        setupTapSelection();
        initMobileInput();
        adjustUIForMobile();
        
        // Добавляем подсказку
        const tip = document.createElement('div');
        tip.className = 'mobile-tip';
        tip.innerHTML = '👆 ДЖОЙСТИК → ДВИЖЕНИЕ | ⚔️ АТАКА | ❤️ ЛЕЧЕНИЕ';
        document.body.appendChild(tip);
        setTimeout(() => tip.remove(), 5000);
        
        // Обновляем количество зелий каждую секунду
        setInterval(() => updatePotionCount(), 1000);
        
        // Обновляем при загрузке инвентаря
        if (typeof window.updateInventoryUI === 'function') {
            const originalUpdate = window.updateInventoryUI;
            window.updateInventoryUI = function() {
                originalUpdate();
                updatePotionCount();
            };
        }
    }, 500);
}

// Экспорт функций в глобальную область
window.initMobileControls = initMobileControls;
window.isMobile = detectMobile;
window.updatePotionCount = updatePotionCount;

// Автоматический запуск
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileControls);
} else {
    initMobileControls();
}