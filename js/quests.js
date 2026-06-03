// ========== QUESTS.JS ==========
// Система квестов и достижений

let activeQuests = [];
let completedQuests = [];
let achievements = [];

function initQuests() {
    activeQuests = [
        { 
            id: 1, 
            name: 'Истребитель', 
            description: 'Убей 10 врагов', 
            type: 'kill', 
            target: 10, 
            current: 0, 
            reward: { gold: 100, xp: 50 },
            icon: '⚔️'
        },
        { 
            id: 2, 
            name: 'Богатство', 
            description: 'Собери 500 золота', 
            type: 'gold', 
            target: 500, 
            current: 0, 
            reward: { item: 'ring_power' },
            icon: '💰'
        },
        { 
            id: 3, 
            name: 'Покоритель подземелий', 
            description: 'Пройди данж', 
            type: 'dungeon', 
            target: 1, 
            current: 0, 
            reward: { gold: 300, xp: 150 },
            icon: '🏚️'
        },
        { 
            id: 4, 
            name: 'Мастер критических ударов', 
            description: 'Нанеси 20 критических ударов', 
            type: 'critical', 
            target: 20, 
            current: 0, 
            reward: { item: 'amulet_crit' },
            icon: '⚡'
        }
    ];
    
    achievements = [
        { id: 1, name: 'Первая кровь', condition: () => window.player?.kills >= 1, reward: 50, unlocked: false, icon: '🩸' },
        { id: 2, name: 'Миллионер', condition: () => window.player?.gold >= 1000, reward: 200, unlocked: false, icon: '💎' },
        { id: 3, name: 'Ветеран', condition: () => window.player?.level >= 10, reward: 500, unlocked: false, icon: '🎖️' },
        { id: 4, name: 'Охотник на боссов', condition: () => window.bossDefeated === true, reward: 300, unlocked: false, icon: '👑' },
        { id: 5, name: 'Бессмертный', condition: () => window.player?.kills >= 50 && window.player?.health > 0, reward: 400, unlocked: false, icon: '💪' }
    ];
}

function updateQuestProgress(type, amount = 1) {
    activeQuests.forEach(quest => {
        if (quest.type === type && quest.current < quest.target) {
            const oldValue = quest.current;
            quest.current = Math.min(quest.target, quest.current + amount);
            
            if (oldValue !== quest.current) {
                updateQuestUI();
            }
            
            if (quest.current >= quest.target) {
                completeQuest(quest);
            }
        }
    });
    
    // Проверяем достижения
    checkAchievements();
}

function completeQuest(quest) {
    const index = activeQuests.findIndex(q => q.id === quest.id);
    if (index !== -1) {
        activeQuests.splice(index, 1);
        completedQuests.push(quest);
        
        const msg = `✅ КВЕСТ ВЫПОЛНЕН: ${quest.name}!`;
        addPickupEffect(window.player.x, window.player.y, msg);
        if (typeof addChatMessage === 'function') addChatMessage(msg, 'system');
        
        if (quest.reward.gold && typeof addGold === 'function') {
            addGold(quest.reward.gold);
            addPickupEffect(window.player.x, window.player.y, `+${quest.reward.gold}💰`);
        }
        if (quest.reward.xp && typeof addXp === 'function') {
            addXp(quest.reward.xp);
            addPickupEffect(window.player.x, window.player.y, `+${quest.reward.xp}⭐`);
        }
        if (quest.reward.item && typeof addItemToInventory === 'function') {
            addItemToInventory(quest.reward.item);
        }
        
        updateQuestUI();
    }
}

function checkAchievements() {
    achievements.forEach(ach => {
        if (!ach.unlocked && ach.condition()) {
            ach.unlocked = true;
            const msg = `🏆 ДОСТИЖЕНИЕ: ${ach.name}! +${ach.reward}💰`;
            addPickupEffect(window.player.x, window.player.y, msg);
            if (typeof addChatMessage === 'function') addChatMessage(msg, 'warning');
            if (typeof addGold === 'function') addGold(ach.reward);
            updateQuestUI();
        }
    });
}

function updateQuestUI() {
    // Обновляем окно квестов, если оно существует
    const questWindow = document.getElementById('window-quests');
    if (questWindow) {
        const content = questWindow.querySelector('.window-content');
        if (content) {
            let html = '<div style="font-size: 11px;">';
            
            if (activeQuests.length > 0) {
                html += '<div style="color:#ffcc88; margin-bottom: 8px;">📋 АКТИВНЫЕ КВЕСТЫ:</div>';
                activeQuests.forEach(quest => {
                    const percent = (quest.current / quest.target) * 100;
                    html += `
                        <div style="margin-bottom: 10px; background: rgba(0,0,0,0.3); padding: 6px; border-radius: 6px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span>${quest.icon} ${quest.name}</span>
                                <span>${quest.current}/${quest.target}</span>
                            </div>
                            <div style="background: #330000; height: 4px; border-radius: 2px; margin-top: 4px;">
                                <div style="background: #ffaa44; width: ${percent}%; height: 100%; border-radius: 2px;"></div>
                            </div>
                            <div style="font-size: 9px; color: #aaa; margin-top: 3px;">${quest.description}</div>
                        </div>
                    `;
                });
            } else {
                html += '<div style="color:#88ff88;">✨ Все квесты выполнены!</div>';
            }
            
            if (achievements.some(a => a.unlocked)) {
                html += '<div style="color:#ffcc88; margin-top: 12px; margin-bottom: 8px;">🏆 ДОСТИЖЕНИЯ:</div>';
                achievements.forEach(ach => {
                    if (ach.unlocked) {
                        html += `<div style="font-size: 10px; color: #ffaa66; margin-bottom: 3px;">${ach.icon} ${ach.name}</div>`;
                    }
                });
            }
            
            html += '</div>';
            content.innerHTML = html;
        }
    }
}

// Создаем окно квестов
function createQuestWindow() {
    if (document.getElementById('window-quests')) return;
    
    const questWindow = new DraggableWindow(
        'window-quests',
        '📋 КВЕСТЫ',
        300, 20, 280, 350,
        '<div>Загрузка...</div>'
    );
    
    window.windows['window-quests'] = questWindow;
    updateQuestUI();
}

// Добавляем обработчик убийств для квестов
const originalUpdateEnemiesKill = window.updateEnemies;
window.updateEnemies = function() {
    if (originalUpdateEnemiesKill) originalUpdateEnemiesKill();
    
    // Проверяем, был ли убит враг
    if (window.lastEnemyKilled) {
        updateQuestProgress('kill', 1);
        if (window.lastEnemyKilled.isBoss) {
            updateQuestProgress('boss', 1);
        }
        window.lastEnemyKilled = null;
    }
};

// Модифицируем функцию убийства врага в combat.js
const originalEnemyDeathHandler = null;
window.trackEnemyDeath = function(enemy) {
    window.lastEnemyKilled = enemy;
    updateQuestProgress('kill', 1);
};

// Добавляем кнопку для открытия квестов в панель управления окнами
function addQuestButton() {
    const controlsBar = document.querySelector('.window-controls-bar');
    if (controlsBar && !document.getElementById('questsBtn')) {
        const btn = document.createElement('button');
        btn.id = 'questsBtn';
        btn.className = 'window-control-btn';
        btn.innerHTML = '📋 Квесты';
        btn.onclick = () => {
            if (window.windows['window-quests']) {
                window.windows['window-quests'].toggleVisibility();
            } else {
                createQuestWindow();
            }
        };
        controlsBar.appendChild(btn);
    }
}

// Инициализация
setTimeout(() => {
    initQuests();
    createQuestWindow();
    addQuestButton();
}, 500);

window.activeQuests = activeQuests;
window.completedQuests = completedQuests;
window.achievements = achievements;
window.updateQuestProgress = updateQuestProgress;
window.updateQuestUI = updateQuestUI;
window.checkAchievements = checkAchievements;