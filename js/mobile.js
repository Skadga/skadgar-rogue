// ========== MOBILE.JS ==========
// Полная адаптация под смартфоны - ПРИНУДИТЕЛЬНОЕ ВКЛЮЧЕНИЕ

let isMobile = false;
let joystickActive = false;
let joystickCenter = { x: 0, y: 0 };
let joystickKnob = { x: 0, y: 0 };
let joystickRadius = 50;
let joystickDirection = { x: 0, y: 0 };
let moveInterval = null;
let mobileInitialized = false;

// Проверка на мобильное устройство - РАСШИРЕННАЯ
function detectMobile() {
    // Проверка по User Agent
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS|FxiOS/i.test(ua);
    
    // Проверка по ширине экрана
    const isSmallScreen = window.innerWidth <= 768;
    
    // Проверка на поддержку touch
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    console.log('Mobile check:', { isMobileUA, isSmallScreen, hasTouch, ua: ua.substring(0, 100) });
    
    // ВОЗВРАЩАЕМ TRUE ДЛЯ ТЕСТА - убираем после отладки
    // return true;
    
    return isMobileUA || (isSmallScreen && hasTouch);
}

// Создание элементов управления с проверкой
function createMobileControls() {
    console.log('createMobileControls called');
    
    // Удаляем старые элементы
    const oldJoystick = document.getElementById('touchJoystick');
    if (oldJoystick) oldJoystick.remove();
    
    const oldAttack = document.getElementById('mobileAttackBtn');
    if (oldAttack) oldAttack.remove();
    
    const oldPotion = document.getElementById('mobilePotionBtn');
    if (oldPotion) oldPotion.remove();
    
    const oldInventory = document.getElementById('mobileInventoryBtn');
    if (oldInventory) oldInventory.remove();
    
    const oldPause = document.getElementById('mobilePauseBtn');
    if (oldPause) oldPause.remove();
    
    const oldShop = document.getElementById('mobileShopBtn');
    if (oldShop) oldShop.remove();
    
    // Создаём джойстик
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
    
    if (base && knob) {
        const startTouch = (e) => {
            e.preventDefault();
            const rect = base.getBoundingClientRect();
            joystickCenter = { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
            joystickActive = true;
            if (e.touches[0]) {
                updateJoystick(e.touches[0].clientX, e.touches[0].clientY, knob);
                startAutoMove();
            }
        };
        
        const moveTouch = (e) => {
            if (!joystickActive) return;
            e.preventDefault();
            if (e.touches[0]) {
                updateJoystick(e.touches[0].clientX, e.touches[0].clientY, knob);
            }
        };
        
        const endTouch = () => {
            joystickActive = false;
            joystickDirection = { x: 0, y: 0 };
            if (knob) knob.style.transform = 'translate(0px, 0px)';
            stopAutoMove();
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
            joystickDirection = { x: dx / joystickRadius, y: dy / joystickRadius };
            joystickKnob = { x: dx, y: dy };
            knobEl.style.transform = `translate(${dx}px, ${dy}px)`;
        }
        
        base.addEventListener('touchstart', startTouch, { passive: false });
        base.addEventListener('touchmove', moveTouch, { passive: false });
        base.addEventListener('touchend', endTouch);
        base.addEventListener('touchcancel', endTouch);
        console.log('Joystick created');
    }
    
    // Кнопка атаки
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
    
    // Кнопка зелья
    const potionBtn = document.createElement('div');
    potionBtn.id = 'mobilePotionBtn';
    potionBtn.innerHTML = '❤️';
    document.body.appendChild(potionBtn);
    
    const countSpan = document.createElement('span');
    countSpan.id = 'mobilePotionCount';
    potionBtn.appendChild(countSpan);
    
    potionBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (typeof window.useHealthPotion === 'function') {
            window.useHealthPotion();
        } else if (typeof useHealthPotion === 'function') {
            useHealthPotion();
        }
        updatePotionCount();
    });
    
    // Кнопка инвентаря
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
    
    // Кнопка паузы
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
    
    // Кнопка магазина
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
    
    console.log('All mobile buttons created');
}

function startAutoMove() {
    if (moveInterval) clearInterval(moveInterval);
    moveInterval = setInterval(() => {
        if (!joystickActive || !window.gameActive || window.isPaused) return;
        if (Math.abs(joystickDirection.x) < 0.1 && Math.abs(joystickDirection.y) < 0.1) return;
        
        const speed = Math.min(1, Math.hypot(joystickDirection.x, joystickDirection.y));
        const angle = Math.atan2(joystickDirection.y, joystickDirection.x);
        
        if (window.player) {
            let newX = window.player.x + Math.cos(angle) * 0.08 * speed;
            let newY = window.player.y + Math.sin(angle) * 0.08 * speed;
            const targetX = Math.floor(newX);
            const targetY = Math.floor(newY);
            if (typeof isWalkable !== 'undefined' && isWalkable(targetX, targetY)) {
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

function updatePotionCount() {
    let potionCount = 0;
    if (typeof window.playerPotions !== 'undefined') {
        potionCount = window.playerPotions.health;
    }
    const countEl = document.getElementById('mobilePotionCount');
    if (countEl) countEl.textContent = potionCount;
}

// Добавление мобильных стилей
function addMobileStyles() {
    if (document.getElementById('mobile-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'mobile-styles';
    style.textContent = `
        #touchJoystick {
            position: fixed;
            bottom: 100px;
            left: 80px;
            z-index: 10000;
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
            z-index: 10000;
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
            z-index: 10000;
            white-space: nowrap;
            pointer-events: none;
            backdrop-filter: blur(5px);
            border: 1px solid #ffcc88;
        }
    `;
    document.head.appendChild(style);
}

// Тап по врагу
function setupTapSelection() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    
    canvas.addEventListener('touchstart', (e) => {
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
            const feedback = document.createElement('div');
            feedback.className = 'tap-feedback';
            feedback.innerHTML = '👆';
            feedback.style.left = x + 'px';
            feedback.style.top = y + 'px';
            document.body.appendChild(feedback);
            setTimeout(() => feedback.remove(), 500);
        } else if (isWalkable(tile.x, tile.y)) {
            window.currentTarget = { x: tile.x, y: tile.y };
            window.currentPath = [];
            window.moving = true;
        }
    });
}

// Тач-движение для поворота камеры
function initMobileTouchMove() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    
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
        
        if (window.player) {
            const playerScreen = tileToScreenWithCamera(window.player.x, window.player.y);
            const lookAngle = Math.atan2(mouseY - playerScreen.y, mouseX - playerScreen.x);
            window.player.direction = lookAngle;
            window.player.upperBodyAngle = lookAngle;
            window.player.lowerBodyAngle = lookAngle;
        }
        
        const newHoveredEnemy = getEnemyAtTile(window.mouseTile.x, window.mouseTile.y);
        if (newHoveredEnemy !== window.hoveredEnemy) {
            window.hoveredEnemy = newHoveredEnemy;
        }
    });
    
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

// Основная функция
function initMobileControls() {
    console.log('initMobileControls called, mobileInitialized:', mobileInitialized);
    
    if (mobileInitialized) {
        console.log('Already initialized');
        return;
    }
    
    isMobile = detectMobile();
    console.log('isMobile detected:', isMobile);
    
    // ПРИНУДИТЕЛЬНО ВКЛЮЧАЕМ ДЛЯ ТЕСТА - убрать после отладки
    // isMobile = true;
    
    if (!isMobile) {
        console.log('Desktop mode - mobile controls not created');
        // Добавляем кнопку для принудительного включения на ПК (для теста)
        const testBtn = document.createElement('div');
        testBtn.textContent = '📱 TEST MOBILE';
        testBtn.style.cssText = 'position:fixed; bottom:10px; left:10px; background:#aa3355; color:white; padding:5px 10px; border-radius:10px; z-index:99999; font-size:10px; cursor:pointer;';
        testBtn.onclick = () => {
            isMobile = true;
            testBtn.remove();
            createMobileControls();
            setupTapSelection();
            initMobileTouchMove();
            const tip = document.createElement('div');
            tip.className = 'mobile-tip';
            tip.innerHTML = '👆 ДЖОЙСТИК → ДВИЖЕНИЕ | ⚔️ АТАКА | ❤️ ЛЕЧЕНИЕ';
            document.body.appendChild(tip);
            setTimeout(() => tip.remove(), 5000);
        };
        document.body.appendChild(testBtn);
        return;
    }
    
    console.log('📱 MOBILE MODE ACTIVATED - Creating controls');
    mobileInitialized = true;
    
    addMobileStyles();
    
    setTimeout(() => {
        createMobileControls();
        setupTapSelection();
        initMobileTouchMove();
        
        const tip = document.createElement('div');
        tip.className = 'mobile-tip';
        tip.innerHTML = '👆 ДЖОЙСТИК → ДВИЖЕНИЕ | ⚔️ АТАКА | ❤️ ЛЕЧЕНИЕ';
        document.body.appendChild(tip);
        setTimeout(() => tip.remove(), 5000);
        
        setInterval(() => updatePotionCount(), 1000);
        
        console.log('Mobile controls created successfully');
    }, 500);
}

// Запуск
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileControls);
} else {
    initMobileControls();
}

window.initMobileControls = initMobileControls;
window.updatePotionCount = updatePotionCount;

console.log('mobile.js loaded');