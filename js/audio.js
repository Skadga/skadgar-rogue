// ========== AUDIO.JS ==========
// ИСПРАВЛЕННАЯ ВЕРСИЯ - НОРМАЛЬНАЯ ГРОМКОСТЬ, БЕЗ ТРЕСКА + ПРАВИЛЬНЫЕ ЗВУКИ УДАРОВ

let audioEnabled = true;
let musicVolume = 0.45;
let sfxVolume = 0.5;
let audioCtx = null;
let isGeneratingMusic = false;
let currentGain = null;
let activeOscillators = [];
let activeIntervals = [];
let activeTimeouts = [];

// Функция для безопасной остановки всех звуков
function stopAllSounds() {
    for (let osc of activeOscillators) {
        try {
            osc.stop();
            osc.disconnect();
        } catch(e) {}
    }
    for (let interval of activeIntervals) {
        clearInterval(interval);
    }
    for (let timeout of activeTimeouts) {
        clearTimeout(timeout);
    }
    activeOscillators = [];
    activeIntervals = [];
    activeTimeouts = [];
    
    if (currentGain) {
        try {
            currentGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
        } catch(e) {}
    }
}

// Функция для включения/выключения музыки
function toggleMusic() {
    audioEnabled = !audioEnabled;
    const toggleBtn = document.getElementById('musicToggleBtn');
    if (audioEnabled) {
        if (toggleBtn) toggleBtn.textContent = '🎵 МУЗЫКА: ВКЛ';
        startBackgroundMusic();
    } else {
        if (toggleBtn) toggleBtn.textContent = '🎵 МУЗЫКА: ВЫКЛ';
        stopBackgroundMusic();
    }
}

// Функция изменения громкости музыки
function setMusicVolume(value) {
    musicVolume = Math.max(0, Math.min(0.8, value));
    const volumeSlider = document.getElementById('musicVolume');
    if (volumeSlider) volumeSlider.value = musicVolume;
    if (currentGain) {
        try {
            currentGain.gain.linearRampToValueAtTime(musicVolume, audioCtx.currentTime + 0.1);
        } catch(e) {}
    }
}

// Функция изменения громкости звуков
function setSfxVolume(value) {
    sfxVolume = Math.max(0, Math.min(1, value));
    const sfxSlider = document.getElementById('sfxVolume');
    if (sfxSlider) sfxSlider.value = sfxVolume;
}

// ========== ЗВУКИ УДАРОВ (МЕЧ/БРОНЯ/ПЛОТЬ) ==========

// Звук удара мечом по врагу
function playHitSound(isCritical = false, isPlayerHit = false) {
    if (!audioEnabled || !audioCtx) return;
    if (audioCtx.state === 'suspended') return;
    
    try {
        const now = audioCtx.currentTime;
        
        if (isPlayerHit) {
            // Звук получения урона игроком (звук брони/плоти)
            const osc1 = audioCtx.createOscillator();
            const osc2 = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();
            
            osc1.type = 'sawtooth';
            osc1.frequency.value = 120;
            osc1.frequency.exponentialRampToValueAtTime(60, now + 0.2);
            
            osc2.type = 'triangle';
            osc2.frequency.value = 80;
            osc2.frequency.exponentialRampToValueAtTime(40, now + 0.15);
            
            filter.type = 'lowpass';
            filter.frequency.value = 800;
            filter.Q.value = 5;
            
            gainNode.gain.setValueAtTime(sfxVolume * 0.5, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
            
            osc1.connect(filter);
            osc2.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            osc1.start();
            osc2.start();
            osc1.stop(now + 0.35);
            osc2.stop(now + 0.35);
            
        } 
        else if (isCritical) {
            // Звук критического удара (звон меча + глубокий удар)
            const osc1 = audioCtx.createOscillator();
            const osc2 = audioCtx.createOscillator();
            const osc3 = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            const gainNode2 = audioCtx.createGain();
            
            // Основной удар
            osc1.type = 'square';
            osc1.frequency.value = 200;
            osc1.frequency.exponentialRampToValueAtTime(100, now + 0.15);
            
            // Звенящая гармоника (звук меча)
            osc2.type = 'sine';
            osc2.frequency.value = 1200;
            osc2.frequency.exponentialRampToValueAtTime(600, now + 0.1);
            
            // Низкий бас для тяжести удара
            osc3.type = 'triangle';
            osc3.frequency.value = 60;
            osc3.frequency.exponentialRampToValueAtTime(30, now + 0.2);
            
            gainNode.gain.setValueAtTime(sfxVolume * 0.45, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
            
            gainNode2.gain.setValueAtTime(sfxVolume * 0.2, now);
            gainNode2.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
            
            osc1.connect(gainNode);
            osc2.connect(gainNode2);
            osc3.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            gainNode2.connect(audioCtx.destination);
            
            osc1.start();
            osc2.start();
            osc3.start();
            osc1.stop(now + 0.4);
            osc2.stop(now + 0.25);
            osc3.stop(now + 0.45);
        } 
        else {
            // Обычный звук удара мечом (хруст/рассекание воздуха + удар)
            const osc1 = audioCtx.createOscillator();
            const osc2 = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            const gainNode2 = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();
            
            // Звук рассекаемого воздуха (свист меча)
            osc1.type = 'sine';
            osc1.frequency.value = 600;
            osc1.frequency.exponentialRampToValueAtTime(200, now + 0.08);
            
            // Звук удара по плоти
            osc2.type = 'triangle';
            osc2.frequency.value = 100;
            osc2.frequency.exponentialRampToValueAtTime(50, now + 0.12);
            
            filter.type = 'lowpass';
            filter.frequency.value = 1000;
            
            gainNode.gain.setValueAtTime(sfxVolume * 0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
            
            gainNode2.gain.setValueAtTime(sfxVolume * 0.35, now);
            gainNode2.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
            
            osc1.connect(filter);
            filter.connect(gainNode);
            osc2.connect(gainNode2);
            gainNode.connect(audioCtx.destination);
            gainNode2.connect(audioCtx.destination);
            
            osc1.start();
            osc2.start();
            osc1.stop(now + 0.2);
            osc2.stop(now + 0.25);
        }
        
    } catch(e) {
        console.warn("Hit sound error:", e);
    }
}

// Звук смерти врага (предсмертный хрип/падение)
function playDeathSound() {
    if (!audioEnabled || !audioCtx) return;
    if (audioCtx.state === 'suspended') return;
    
    try {
        const now = audioCtx.currentTime;
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        
        osc1.type = 'sawtooth';
        osc1.frequency.value = 300;
        osc1.frequency.exponentialRampToValueAtTime(40, now + 0.4);
        
        osc2.type = 'triangle';
        osc2.frequency.value = 150;
        osc2.frequency.exponentialRampToValueAtTime(30, now + 0.35);
        
        filter.type = 'lowpass';
        filter.frequency.value = 600;
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.4);
        
        gainNode.gain.setValueAtTime(sfxVolume * 0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
        
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc1.start();
        osc2.start();
        osc1.stop(now + 0.5);
        osc2.stop(now + 0.45);
        
    } catch(e) {}
}

// Звук промаха (свист воздуха)
function playMissSound() {
    if (!audioEnabled || !audioCtx) return;
    if (audioCtx.state === 'suspended') return;
    
    try {
        const now = audioCtx.currentTime;
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 800;
        oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 10;
        
        gainNode.gain.setValueAtTime(sfxVolume * 0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(now + 0.15);
        
    } catch(e) {}
}

// Остановка музыки
function stopBackgroundMusic() {
    if (!isGeneratingMusic) return;
    
    stopAllSounds();
    isGeneratingMusic = false;
    currentGain = null;
}

// Плавный запуск ноты (без щелчков)
function playNote(frequency, type, duration, volume, pan = 0, delay = 0) {
    if (!isGeneratingMusic || !audioEnabled || !audioCtx) return null;
    
    const startTime = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const panner = audioCtx.createStereoPanner();
    
    osc.type = type;
    osc.frequency.value = frequency;
    
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    
    panner.pan.value = pan;
    
    osc.connect(gain);
    gain.connect(panner);
    panner.connect(currentGain);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
    
    activeOscillators.push(osc);
    
    const timeout = setTimeout(() => {
        const index = activeOscillators.indexOf(osc);
        if (index > -1) activeOscillators.splice(index, 1);
    }, (duration + delay) * 1000 + 100);
    activeTimeouts.push(timeout);
    
    return osc;
}

// Генерация фоновой музыки
function startBackgroundMusic() {
    if (!audioEnabled) return;
    if (isGeneratingMusic) return;
    
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        isGeneratingMusic = true;
        
        stopAllSounds();
        
        currentGain = audioCtx.createGain();
        currentGain.gain.value = musicVolume;
        currentGain.connect(audioCtx.destination);
        
        const bassInterval = setInterval(() => {
            if (isGeneratingMusic && audioEnabled) {
                playNote(55, 'sine', 4, 0.12, -0.2);
                playNote(82.41, 'sine', 4, 0.1, 0.1);
                playNote(110, 'sine', 4, 0.08, 0.3);
            }
        }, 4500);
        activeIntervals.push(bassInterval);
        
        const droneInterval = setInterval(() => {
            if (isGeneratingMusic && audioEnabled) {
                playNote(130.81, 'sine', 5, 0.1, -0.4);
                playNote(146.83, 'sine', 5, 0.09, 0.2);
                playNote(164.81, 'sine', 5, 0.08, 0.5);
            }
        }, 6000);
        activeIntervals.push(droneInterval);
        
        const melodyNotes = [
            { freq: 261.63, duration: 1.5, vol: 0.15, pan: -0.3 },
            { freq: 293.66, duration: 1.5, vol: 0.15, pan: -0.2 },
            { freq: 329.63, duration: 1.8, vol: 0.18, pan: -0.1 },
            { freq: 349.23, duration: 1.5, vol: 0.16, pan: 0 },
            { freq: 329.63, duration: 1.5, vol: 0.15, pan: 0.1 },
            { freq: 293.66, duration: 1.8, vol: 0.17, pan: 0.2 },
            { freq: 261.63, duration: 2, vol: 0.18, pan: 0.3 },
            { freq: 196.00, duration: 1.8, vol: 0.14, pan: 0.2 },
            { freq: 220.00, duration: 1.5, vol: 0.14, pan: 0.1 },
            { freq: 246.96, duration: 1.8, vol: 0.16, pan: -0.1 },
            { freq: 261.63, duration: 2.5, vol: 0.2, pan: -0.2 }
        ];
        
        let melodyIndex = 0;
        
        function playMelody() {
            if (!isGeneratingMusic || !audioEnabled) return;
            const note = melodyNotes[melodyIndex % melodyNotes.length];
            playNote(note.freq, 'triangle', note.duration, note.vol, note.pan);
            melodyIndex++;
            
            const timeout = setTimeout(playMelody, 3200);
            activeTimeouts.push(timeout);
        }
        
        const melodyTimeout = setTimeout(playMelody, 500);
        activeTimeouts.push(melodyTimeout);
        
        const stringNotes = [146.83, 174.61, 196.00, 164.81, 220.00, 174.61];
        let stringIndex = 0;
        
        function playString() {
            if (!isGeneratingMusic || !audioEnabled) return;
            const note = stringNotes[stringIndex % stringNotes.length];
            playNote(note, 'sine', 3.5, 0.1, -0.5);
            playNote(note * 1.5, 'sine', 3.5, 0.07, -0.6);
            stringIndex++;
            
            const timeout = setTimeout(playString, 7000);
            activeTimeouts.push(timeout);
        }
        
        const stringTimeout = setTimeout(playString, 1500);
        activeTimeouts.push(stringTimeout);
        
        let beatCount = 0;
        function playPulse() {
            if (!isGeneratingMusic || !audioEnabled) return;
            playNote(100, 'sine', 0.4, 0.08, 0);
            if (beatCount % 2 === 0) {
                playNote(120, 'sine', 0.3, 0.06, 0.2);
            }
            beatCount++;
            
            const timeout = setTimeout(playPulse, 2000);
            activeTimeouts.push(timeout);
        }
        
        const pulseTimeout = setTimeout(playPulse, 1000);
        activeTimeouts.push(pulseTimeout);
        
        let chordCount = 0;
        const chords = [
            { notes: [261.63, 329.63, 392.00], vol: 0.12 },
            { notes: [293.66, 349.23, 440.00], vol: 0.12 },
            { notes: [196.00, 246.96, 293.66], vol: 0.1 },
            { notes: [174.61, 220.00, 261.63], vol: 0.1 }
        ];
        
        function playChord() {
            if (!isGeneratingMusic || !audioEnabled) return;
            const chord = chords[chordCount % chords.length];
            for (let note of chord.notes) {
                playNote(note, 'sine', 2.5, chord.vol * 0.8, (Math.random() - 0.5) * 0.6);
            }
            chordCount++;
            
            const timeout = setTimeout(playChord, 12000);
            activeTimeouts.push(timeout);
        }
        
        const chordTimeout = setTimeout(playChord, 3000);
        activeTimeouts.push(chordTimeout);
        
        window.setMusicIntensity = function(intense) {
            if (!currentGain) return;
            const targetGain = intense ? Math.min(0.7, musicVolume * 1.6) : musicVolume;
            try {
                currentGain.gain.linearRampToValueAtTime(targetGain, audioCtx.currentTime + 1);
            } catch(e) {}
        };
        
        window._musicCleanup = function() {
            stopBackgroundMusic();
        };
        
    } catch(e) {
        console.warn("Audio not supported:", e);
        isGeneratingMusic = false;
    }
}

// Добавляем UI элементы для управления музыкой и звуками
function addMusicControls() {
    const pauseContent = document.querySelector('.pause-content');
    if (pauseContent && !document.getElementById('musicToggleBtn')) {
        const musicDiv = document.createElement('div');
        musicDiv.style.marginTop = '15px';
        musicDiv.style.display = 'flex';
        musicDiv.style.gap = '10px';
        musicDiv.style.justifyContent = 'center';
        musicDiv.style.alignItems = 'center';
        musicDiv.style.flexWrap = 'wrap';
        
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'musicToggleBtn';
        toggleBtn.textContent = '🎵 МУЗЫКА: ВКЛ';
        toggleBtn.style.padding = '8px 15px';
        toggleBtn.style.fontSize = '12px';
        toggleBtn.style.background = '#3a2a5a';
        toggleBtn.onclick = toggleMusic;
        
        const volumeLabel = document.createElement('span');
        volumeLabel.textContent = '🔊 Муз.';
        volumeLabel.style.color = '#ffcc88';
        volumeLabel.style.fontSize = '12px';
        
        const volumeSlider = document.createElement('input');
        volumeSlider.id = 'musicVolume';
        volumeSlider.type = 'range';
        volumeSlider.min = 0;
        volumeSlider.max = 0.8;
        volumeSlider.step = 0.01;
        volumeSlider.value = musicVolume;
        volumeSlider.style.width = '70px';
        volumeSlider.oninput = (e) => setMusicVolume(parseFloat(e.target.value));
        
        const sfxLabel = document.createElement('span');
        sfxLabel.textContent = '🔊 SFX:';
        sfxLabel.style.color = '#ffcc88';
        sfxLabel.style.fontSize = '12px';
        
        const sfxSlider = document.createElement('input');
        sfxSlider.id = 'sfxVolume';
        sfxSlider.type = 'range';
        sfxSlider.min = 0;
        sfxSlider.max = 1;
        sfxSlider.step = 0.01;
        sfxSlider.value = sfxVolume;
        sfxSlider.style.width = '70px';
        sfxSlider.oninput = (e) => setSfxVolume(parseFloat(e.target.value));
        
        musicDiv.appendChild(toggleBtn);
        musicDiv.appendChild(volumeLabel);
        musicDiv.appendChild(volumeSlider);
        musicDiv.appendChild(sfxLabel);
        musicDiv.appendChild(sfxSlider);
        
        const pauseNote = pauseContent.querySelector('.pause-note');
        if (pauseNote) {
            pauseContent.insertBefore(musicDiv, pauseNote);
        } else {
            pauseContent.appendChild(musicDiv);
        }
    }
    
    const ui = document.querySelector('.ui');
    if (ui && !document.getElementById('musicIndicator')) {
        const musicIndicator = document.createElement('div');
        musicIndicator.id = 'musicIndicator';
        musicIndicator.className = 'stat';
        musicIndicator.style.cursor = 'pointer';
        musicIndicator.style.fontSize = '11px';
        musicIndicator.innerHTML = '🎵 Музыка...';
        musicIndicator.onclick = () => {
            if (!audioEnabled) {
                audioEnabled = true;
                startBackgroundMusic();
                const toggleBtn = document.getElementById('musicToggleBtn');
                if (toggleBtn) toggleBtn.textContent = '🎵 МУЗЫКА: ВКЛ';
            } else {
                toggleMusic();
            }
        };
        ui.appendChild(musicIndicator);
        
        const animInterval = setInterval(() => {
            const indicator = document.getElementById('musicIndicator');
            if (indicator && audioEnabled && isGeneratingMusic) {
                const dots = '.'.repeat(Math.floor(Date.now() / 500) % 4);
                indicator.innerHTML = `🎵 Музыка${dots}`;
            } else if (indicator) {
                indicator.innerHTML = audioEnabled ? '🎵 Музыка (стоп)' : '🔇 Музыка выкл';
            }
        }, 500);
        activeIntervals.push(animInterval);
    }
}

// Автозапуск музыки после первого взаимодействия
let musicStarted = false;

function tryStartMusicOnInteraction() {
    if (musicStarted) return;
    if (!audioEnabled) return;
    
    musicStarted = true;
    setTimeout(() => {
        startBackgroundMusic();
    }, 100);
}

document.addEventListener('DOMContentLoaded', () => {
    addMusicControls();
    
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        canvas.addEventListener('click', tryStartMusicOnInteraction);
        canvas.addEventListener('keydown', tryStartMusicOnInteraction);
    }
    document.body.addEventListener('click', tryStartMusicOnInteraction);
    
    const intensityInterval = setInterval(() => {
        if (!audioEnabled || !isGeneratingMusic) return;
        
        let enemiesNearby = false;
        if (window.enemies && window.player) {
            for (let e of window.enemies) {
                const dx = Math.abs(e.x - window.player.x);
                const dy = Math.abs(e.y - window.player.y);
                if (dx + dy < 8 && window.hasLineOfSight && 
                    window.hasLineOfSight(e.x, e.y, window.player.x, window.player.y)) {
                    enemiesNearby = true;
                    break;
                }
            }
        }
        
        if (window.setMusicIntensity) {
            window.setMusicIntensity(enemiesNearby);
        }
    }, 1000);
    activeIntervals.push(intensityInterval);
});

// Звук портала
function playPortalSound() {
    if (!audioEnabled || !audioCtx) return;
    if (audioCtx.state === 'suspended') return;
    
    try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 440;
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
        
        gainNode.gain.setValueAtTime(sfxVolume * 0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(now + 0.3);
    } catch(e) {}
}

window.toggleMusic = toggleMusic;
window.setMusicVolume = setMusicVolume;
window.setSfxVolume = setSfxVolume;
window.startBackgroundMusic = startBackgroundMusic;
window.stopBackgroundMusic = stopBackgroundMusic;
window.addMusicControls = addMusicControls;
window.playHitSound = playHitSound;
window.playDeathSound = playDeathSound;
window.playMissSound = playMissSound;
window.playPortalSound = playPortalSound;