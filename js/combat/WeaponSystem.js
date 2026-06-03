 // ========== WEAPONSYSTEM.JS ==========
// Система типов оружия

const WeaponTypes = {
    SWORD: {
        name: 'Меч',
        icon: '⚔️',
        damage: 15,
        attackSpeed: 0.4, // ударов в секунду
        range: 1.5,
        twoHanded: false,
        projectile: null,
        attackAnimation: 'slash',
        color: '#c0c0c0'
    },
    BOW: {
        name: 'Лук',
        icon: '🏹',
        damage: 20,
        attackSpeed: 0.6,
        range: 8,
        twoHanded: true,
        projectile: { type: 'arrow', speed: 12, size: 3 },
        attackAnimation: 'shoot',
        color: '#8B6914'
    },
    STAFF: {
        name: 'Магический посох',
        icon: '🔮',
        damage: 12,
        attackSpeed: 0.35,
        range: 6,
        twoHanded: true,
        projectile: { type: 'magic', speed: 10, size: 5, effect: 'fireball' },
        attackAnimation: 'cast',
        color: '#8844cc'
    },
    GREATSWORD: {
        name: 'Двуручный меч',
        icon: '🗡️',
        damage: 28,
        attackSpeed: 0.25,
        range: 2,
        twoHanded: true,
        projectile: null,
        attackAnimation: 'slowSlash',
        color: '#a0a0c0'
    }
};

let currentWeapon = 'SWORD';
let weaponCooldown = 0;
let attackCharge = 0; // Для двуручного меча

function setWeapon(weaponKey) {
    if (WeaponTypes[weaponKey]) {
        currentWeapon = weaponKey;
        updateWeaponUI();
        addPickupEffect(window.player.x, window.player.y, `${WeaponTypes[weaponKey].icon} ${WeaponTypes[weaponKey].name} экипирован`);
        return true;
    }
    return false;
}

function updateWeaponUI() {
    const slots = document.querySelectorAll('.weapon-slot');
    slots.forEach(slot => {
        const weapon = slot.dataset.weapon.toUpperCase();
        if (weapon === currentWeapon) {
            slot.classList.add('active');
        } else {
            slot.classList.remove('active');
        }
    });
}

function getCurrentDamage() {
    const weapon = WeaponTypes[currentWeapon];
    let damage = window.player.damage + weapon.damage;
    
    // Двуручный меч медленнее но сильнее
    if (currentWeapon === 'GREATSWORD') {
        damage *= 1.5;
    }
    
    return damage;
}

function getAttackCooldown() {
    const weapon = WeaponTypes[currentWeapon];
    // Базовый кулдаун в кадрах (при 60fps)
    return Math.floor(weapon.attackSpeed * 60);
}

function performRangedAttack(targetX, targetY, targetEnemy) {
    const weapon = WeaponTypes[currentWeapon];
    if (!weapon.projectile) return false;
    
    const startX = window.player.x;
    const startY = window.player.y;
    const angle = Math.atan2(targetY - startY, targetX - startX);
    
    const projectile = new Projectile(
        startX, startY, angle, weapon.projectile.speed,
        weapon.damage, weapon.projectile.type, weapon.projectile.size
    );
    
    window.projectiles = window.projectiles || [];
    window.projectiles.push(projectile);
    
    return true;
}

// Инициализация UI для оружия
document.addEventListener('DOMContentLoaded', () => {
    const slots = document.querySelectorAll('.weapon-slot');
    slots.forEach(slot => {
        slot.addEventListener('click', () => {
            const weapon = slot.dataset.weapon.toUpperCase();
            setWeapon(weapon);
        });
    });
    
    // Горячие клавиши 1-4
    window.addEventListener('keydown', (e) => {
        const key = e.code;
        if (key === 'Digit1') setWeapon('SWORD');
        if (key === 'Digit2') setWeapon('BOW');
        if (key === 'Digit3') setWeapon('STAFF');
        if (key === 'Digit4') setWeapon('GREATSWORD');
    });
});

window.WeaponTypes = WeaponTypes;
window.currentWeapon = currentWeapon;
window.setWeapon = setWeapon;
window.getCurrentDamage = getCurrentDamage;
window.getAttackCooldown = getAttackCooldown;
window.performRangedAttack = performRangedAttack;
