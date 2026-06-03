 
// ========== ANIMATION.JS ==========
// Продвинутая система анимаций с интерполяцией

class AnimationController {
    constructor() {
        this.animations = new Map();
        this.lastTimestamp = 0;
        this.deltaTime = 0;
    }
    
    update(currentTime) {
        if (this.lastTimestamp === 0) {
            this.lastTimestamp = currentTime;
            return 0;
        }
        this.deltaTime = Math.min(0.033, (currentTime - this.lastTimestamp) / 1000);
        this.lastTimestamp = currentTime;
        return this.deltaTime;
    }
}

// Ключевая поза для анимации
class KeyPose {
    constructor(time, values) {
        this.time = time;
        this.values = values;
    }
}

// Анимация конечности с easing
class LimbAnimation {
    constructor(duration, keyPoses, easing = 'easeInOut') {
        this.duration = duration;
        this.keyPoses = keyPoses;
        this.easing = easing;
        this.currentTime = 0;
        this.loop = true;
    }
    
    getValue(currentTime) {
        let t = (currentTime % this.duration) / this.duration;
        
        // Применяем easing
        switch(this.easing) {
            case 'easeInOut':
                t = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                break;
            case 'easeOut':
                t = 1 - Math.pow(1 - t, 3);
                break;
            case 'easeIn':
                t = t * t;
                break;
        }
        
        // Интерполяция между ключевыми позами
        let prevPose = this.keyPoses[0];
        let nextPose = this.keyPoses[this.keyPoses.length - 1];
        
        for (let i = 0; i < this.keyPoses.length - 1; i++) {
            if (t >= this.keyPoses[i].time && t <= this.keyPoses[i + 1].time) {
                prevPose = this.keyPoses[i];
                nextPose = this.keyPoses[i + 1];
                break;
            }
        }
        
        const segmentT = (t - prevPose.time) / (nextPose.time - prevPose.time);
        const result = {};
        
        for (let key in prevPose.values) {
            result[key] = prevPose.values[key] + (nextPose.values[key] - prevPose.values[key]) * segmentT;
        }
        
        return result;
    }
}

// Предопределённые анимации ходьбы
const WalkAnimations = {
    // Анимация ходьбы с естественным ускорением/замедлением
    humanWalk: new LimbAnimation(0.8, [
        new KeyPose(0, { legLeft: 0.3, legRight: -0.3, armLeft: -0.2, armRight: 0.2, bodyBob: 0 }),
        new KeyPose(0.25, { legLeft: -0.3, legRight: 0.3, armLeft: 0.2, armRight: -0.2, bodyBob: -2 }),
        new KeyPose(0.5, { legLeft: 0.3, legRight: -0.3, armLeft: -0.2, armRight: 0.2, bodyBob: 0 }),
        new KeyPose(0.75, { legLeft: -0.3, legRight: 0.3, armLeft: 0.2, armRight: -0.2, bodyBob: 2 }),
        new KeyPose(1, { legLeft: 0.3, legRight: -0.3, armLeft: -0.2, armRight: 0.2, bodyBob: 0 })
    ], 'easeInOut'),
    
    // Анимация бега/быстрого движения
    run: new LimbAnimation(0.5, [
        new KeyPose(0, { legLeft: 0.5, legRight: -0.5, armLeft: -0.4, armRight: 0.4, bodyBob: 0 }),
        new KeyPose(0.25, { legLeft: -0.5, legRight: 0.5, armLeft: 0.4, armRight: -0.4, bodyBob: -3 }),
        new KeyPose(0.5, { legLeft: 0.5, legRight: -0.5, armLeft: -0.4, armRight: 0.4, bodyBob: 0 }),
        new KeyPose(0.75, { legLeft: -0.5, legRight: 0.5, armLeft: 0.4, armRight: -0.4, bodyBob: 3 }),
        new KeyPose(1, { legLeft: 0.5, legRight: -0.5, armLeft: -0.4, armRight: 0.4, bodyBob: 0 })
    ], 'easeInOut')
};

// Глобальный контроллер анимации
const AnimController = new AnimationController();
let globalAnimTime = 0;

function updateGlobalAnimation(currentTime) {
    const delta = AnimController.update(currentTime);
    if (delta > 0) {
        globalAnimTime += delta;
    }
    return globalAnimTime;
}

function getWalkAnimationValues(isMoving) {
    if (!isMoving) return { legLeft: 0, legRight: 0, armLeft: 0, armRight: 0, bodyBob: 0 };
    return WalkAnimations.humanWalk.getValue(globalAnimTime);
}

window.AnimController = AnimController;
window.updateGlobalAnimation = updateGlobalAnimation;
window.getWalkAnimationValues = getWalkAnimationValues;
window.WalkAnimations = WalkAnimations;