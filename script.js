class PomodoroTimer {
    constructor() {
        this.duration = 25 * 60 * 1000; // 25 minutes in milliseconds
        this.points = 120;
        this.isRunning = false;
        this.timer = null;
        this.endTime = null;
        this.remainingTime = this.duration;
        this.originalTitle = document.title;
        this.settings = {
            focusDuration: 25,
            shortBreak: 5,
            longBreak: 15,
            autoStartBreaks: false,
            soundEnabled: true
        };
        
        this.loadSettings();
        this.initializeElements();
        this.initializeEventListeners();
        this.updateCircleProgress(1);
        this.initializeSettingsModal();
        
        // Initialize Audio Context and sounds
        this.initializeAudio();
        
        // Add visibility change handler
        document.addEventListener('visibilitychange', () => {
            if (this.isRunning) {
                if (document.hidden) {
                    cancelAnimationFrame(this.timer);
                    this.updateTimer();
                } else {
                    this.timer = requestAnimationFrame(this.updateTimer.bind(this));
                }
            }
        });
    }

    initializeElements() {
        this.startBtn = document.querySelector('.start-btn');
        this.timerDisplay = document.querySelector('.timer-display');
        this.progressRing = document.querySelector('.progress-ring-circle-active');
        this.pointsDisplay = document.getElementById('points');
        this.navBtns = document.querySelectorAll('.nav-btn');
        
        // Calculate circle circumference
        const circle = this.progressRing;
        const radius = circle.r.baseVal.value;
        this.circumference = radius * 2 * Math.PI;
        circle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
    }

    initializeEventListeners() {
        this.startBtn.addEventListener('click', () => this.toggleTimer());
        
        this.navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.navBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
            this.startBtn.textContent = 'Start';
        } else {
            // Resume audio context if it was suspended
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            this.startTimer();
            this.startBtn.textContent = 'Pause';
            this.playSound('start');
        }
        this.isRunning = !this.isRunning;
    }

    startTimer() {
        // Set the end time based on remaining duration
        this.endTime = Date.now() + this.remainingTime;
        
        this.timer = requestAnimationFrame(this.updateTimer.bind(this));
    }

    updateTimer() {
        if (!this.isRunning) return;

        const currentTime = Date.now();
        this.remainingTime = Math.max(0, this.endTime - currentTime);

        this.updateDisplay();
        this.updateCircleProgress(this.remainingTime / this.duration);

        if (this.remainingTime === 0) {
            this.completePomodoro();
            return;
        }
        
        // Update more frequently when tab is not visible
        if (document.hidden) {
            setTimeout(() => this.updateTimer(), 1000);
        } else {
            this.timer = requestAnimationFrame(this.updateTimer.bind(this));
        }
    }

    pauseTimer() {
        if (this.timer) {
            cancelAnimationFrame(this.timer);
            this.timer = null;
        }
    }

    updateDisplay() {
        const totalSeconds = Math.ceil(this.remainingTime / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update timer display
        this.timerDisplay.textContent = timeString;
        
        // Update page title
        document.title = this.isRunning 
            ? `(${timeString}) ${this.originalTitle}`
            : this.originalTitle;
    }

    updateCircleProgress(percent) {
        const offset = this.circumference - (percent * this.circumference);
        this.progressRing.style.strokeDashoffset = offset;
    }

    async completePomodoro() {
        this.pauseTimer();
        this.isRunning = false;
        this.remainingTime = this.duration;
        this.points += 20;
        this.pointsDisplay.textContent = this.points;
        this.startBtn.textContent = 'Start';
        this.updateDisplay();
        this.updateCircleProgress(1);
        document.title = this.originalTitle;
        
        // Play completion sound and wait for it to load if needed
        if (this.settings.soundEnabled) {
            const sound = this.sounds.complete;
            if (!sound.buffer) {
                await this.loadSound(sound);
            }
            this.playSound('complete');
            // Wait a small moment for the sound to start playing
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        alert('Pomodoro completed! Take a break.');
    }

    reset() {
        this.pauseTimer();
        this.isRunning = false;
        this.remainingTime = this.duration;
        this.startBtn.textContent = 'Start';
        this.updateDisplay();
        this.updateCircleProgress(1);
        document.title = this.originalTitle; // Reset title
    }

    initializeSettingsModal() {
        // First verify all elements exist
        this.settingsModal = document.getElementById('settingsModal');
        this.settingsBtn = document.querySelector('.settings-btn');
        
        if (!this.settingsModal || !this.settingsBtn) {
            console.error('Settings modal elements not found');
            return;
        }
        
        // Settings inputs
        this.focusDurationInput = document.getElementById('focusDuration');
        this.shortBreakInput = document.getElementById('shortBreak');
        this.longBreakInput = document.getElementById('longBreak');
        this.autoStartBreaksInput = document.getElementById('autoStartBreaks');
        this.soundEnabledInput = document.getElementById('soundEnabled');

        // Initialize settings values
        this.focusDurationInput.value = this.settings.focusDuration;
        this.shortBreakInput.value = this.settings.shortBreak;
        this.longBreakInput.value = this.settings.longBreak;
        this.autoStartBreaksInput.checked = this.settings.autoStartBreaks;
        this.soundEnabledInput.checked = this.settings.soundEnabled;

        // Event listeners
        this.settingsBtn.addEventListener('click', () => {
            console.log('Settings button clicked'); // Debug log
            this.openSettings();
        });
        
        const closeBtn = this.settingsModal.querySelector('.close-btn');
        const cancelBtn = this.settingsModal.querySelector('.cancel-btn');
        const saveBtn = this.settingsModal.querySelector('.save-btn');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeSettings());
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeSettings());
        }
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveSettings());
        }

        // Time picker buttons
        this.settingsModal.querySelectorAll('.time-picker').forEach(picker => {
            const input = picker.querySelector('input');
            const minusBtn = picker.querySelector('.minus');
            const plusBtn = picker.querySelector('.plus');
            
            if (minusBtn) {
                minusBtn.addEventListener('click', () => {
                    input.value = Math.max(parseInt(input.value) - 1, parseInt(input.min));
                });
            }
            
            if (plusBtn) {
                plusBtn.addEventListener('click', () => {
                    input.value = Math.min(parseInt(input.value) + 1, parseInt(input.max));
                });
            }
        });

        // Close modal when clicking outside
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.closeSettings();
            }
        });
    }

    openSettings() {
        console.log('Opening settings modal'); // Debug log
        if (this.settingsModal) {
            this.settingsModal.classList.add('show');
        }
    }

    closeSettings() {
        console.log('Closing settings modal'); // Debug log
        if (this.settingsModal) {
            this.settingsModal.classList.remove('show');
        }
    }

    saveSettings() {
        const newSettings = {
            focusDuration: parseInt(this.focusDurationInput.value),
            shortBreak: parseInt(this.shortBreakInput.value),
            longBreak: parseInt(this.longBreakInput.value),
            autoStartBreaks: this.autoStartBreaksInput.checked,
            soundEnabled: this.soundEnabledInput.checked
        };

        // If sound was just enabled, initialize audio context
        if (newSettings.soundEnabled && !this.settings.soundEnabled) {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        }

        this.settings = newSettings;
        this.duration = this.settings.focusDuration * 60 * 1000;
        this.remainingTime = this.duration;
        
        localStorage.setItem('pomodoroSettings', JSON.stringify(this.settings));
        
        this.updateDisplay();
        this.updateCircleProgress(1);
        
        this.closeSettings();
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('pomodoroSettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            this.duration = this.settings.focusDuration * 60 * 1000;
            this.remainingTime = this.duration;
        }
    }

    initializeAudio() {
        // Create audio context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Define our sounds
        this.sounds = {
            start: {
                url: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
                buffer: null
            },
            complete: {
                url: 'https://assets.mixkit.co/active_storage/sfx/1434/1434-preview.mp3',
                buffer: null
            }
        };

        // Load all sounds
        Object.values(this.sounds).forEach(sound => {
            this.loadSound(sound);
        });
    }

    async loadSound(sound) {
        try {
            const response = await fetch(sound.url);
            const arrayBuffer = await response.arrayBuffer();
            sound.buffer = await this.audioContext.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error('Error loading sound:', error);
        }
    }

    playSound(soundName) {
        if (!this.settings.soundEnabled) return;
        
        const sound = this.sounds[soundName];
        if (!sound || !sound.buffer) return;

        // Create buffer source
        const source = this.audioContext.createBufferSource();
        source.buffer = sound.buffer;
        
        // Connect to destination (speakers)
        source.connect(this.audioContext.destination);
        
        // Play the sound
        source.start(0);
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});