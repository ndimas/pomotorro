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
        
        // Initialize points system
        this.pointsSystem = {
            points: 0,
            level: 1,
            pointsToNextLevel: 100,
            multiplier: 1,
            streakCount: 0,
            lastPomodoro: null
        };

        this.tasks = {
            current: null,
            history: []
        };
        
        this.loadAllData(); // This already loads tasks
        this.initializeElements();
        this.initializeEventListeners();
        this.updateCircleProgress(1);
        this.initializeSettingsModal();
        this.initializeAudio();
        this.initializeTaskSystem(); // Move this here

        // Remove these lines as they're redundant
        // this.loadTasks();  // Remove this
        // this.initializeTaskSystem();  // Remove this duplicate

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
        
        // Add level display next to points
        const pointsDiv = document.querySelector('.points');
        pointsDiv.innerHTML = `
            <div class="points-content">
                <div>Level ${this.pointsSystem.level}</div>
                <div>Points: <span id="points">${this.pointsSystem.points}</span></div>
            </div>
            <div class="level-progress">
                <div class="level-bar" style="width: ${this.calculateLevelProgress()}%"></div>
            </div>
        `;
        this.pointsDisplay = document.getElementById('points');
        this.levelBar = document.querySelector('.level-bar');
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
        
        // Update page title with current task if exists
        let title = this.originalTitle;
        if (this.tasks.current && this.tasks.current.title) {
            title = this.tasks.current.title;
        }
        
        document.title = this.isRunning 
            ? `(${timeString}) ${title}`
            : title;
    }

    updateCircleProgress(percent) {
        const offset = this.circumference - (percent * this.circumference);
        this.progressRing.style.strokeDashoffset = offset;
    }

    calculateLevelProgress() {
        const pointsInCurrentLevel = this.pointsSystem.points % this.pointsSystem.pointsToNextLevel;
        return (pointsInCurrentLevel / this.pointsSystem.pointsToNextLevel) * 100;
    }

    updatePointsDisplay() {
        this.pointsDisplay.textContent = this.pointsSystem.points;
        this.levelBar.style.width = `${this.calculateLevelProgress()}%`;
        document.querySelector('.points-content div:first-child').textContent = `Level ${this.pointsSystem.level}`;
    }

    calculatePointsEarned() {
        let points = 20; // Base points

        // Check for streak bonus
        const now = new Date();
        if (this.pointsSystem.lastPomodoro) {
            const lastPomodoro = new Date(this.pointsSystem.lastPomodoro);
            const hoursSinceLastPomodoro = (now - lastPomodoro) / (1000 * 60 * 60);
            
            if (hoursSinceLastPomodoro <= 1) {
                this.pointsSystem.streakCount++;
                points *= (1 + (this.pointsSystem.streakCount * 0.1)); // 10% bonus per streak
            } else {
                this.pointsSystem.streakCount = 0;
            }
        }

        this.pointsSystem.lastPomodoro = now.toISOString();
        return Math.round(points * this.pointsSystem.multiplier);
    }

    addPoints(points) {
        this.pointsSystem.points += points;
        
        // Check for level up
        while (this.pointsSystem.points >= this.pointsSystem.pointsToNextLevel) {
            this.levelUp();
        }
        
        this.updatePointsDisplay();
        this.saveAllData();
    }

    levelUp() {
        this.pointsSystem.level++;
        this.pointsSystem.multiplier += 0.1;
        this.pointsSystem.points -= this.pointsSystem.pointsToNextLevel;
        this.pointsSystem.pointsToNextLevel = Math.round(this.pointsSystem.pointsToNextLevel * 1.5);
        
        // Show level up notification
        this.showLevelUpNotification();
    }

    showLevelUpNotification() {
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.innerHTML = `
            <h3>🎉 Level Up!</h3>
            <p>You reached Level ${this.pointsSystem.level}</p>
            <p>New point multiplier: ${this.pointsSystem.multiplier.toFixed(1)}x</p>
        `;
        document.body.appendChild(notification);
        
        // Remove notification after animation
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    async completePomodoro() {
        // Calculate points first
        let pointsEarned;
        if (this.tasks.current) {
            pointsEarned = this.completeCurrentTask();
        } else {
            pointsEarned = this.calculatePointsEarned();
        }
        
        // Reset timer state
        this.pauseTimer();
        this.isRunning = false;
        this.remainingTime = this.duration;
        this.endTime = null;  // Add this line to reset endTime
        this.timer = null;    // Add this line to ensure timer is cleared
        
        // Update UI
        this.startBtn.textContent = 'Start';
        this.updateDisplay();
        this.updateCircleProgress(1);
        
        // Add points and show notification
        this.addPoints(pointsEarned);
        
        const notification = document.createElement('div');
        notification.className = 'points-notification';
        notification.innerHTML = `
            <p>+${pointsEarned} points</p>
            ${this.tasks.current ? '<p>+25% Task Bonus!</p>' : ''}
            ${this.pointsSystem.streakCount > 1 ? `<p>🔥 ${this.pointsSystem.streakCount}x streak!</p>` : ''}
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 2000);

        // Play sound
        if (this.settings.soundEnabled) {
            const sound = this.sounds.complete;
            if (!sound.buffer) {
                await this.loadSound(sound);
            }
            this.playSound('complete');
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Save the reset state
        this.saveAllData();
        
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

    loadAllData() {
        const savedData = localStorage.getItem('pomodoroData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            this.settings = { ...this.settings, ...parsedData.settings };
            this.pointsSystem = { ...this.pointsSystem, ...parsedData.pointsSystem };
            this.tasks = { ...this.tasks, ...parsedData.tasks };
            this.duration = this.settings.focusDuration * 60 * 1000;
            this.remainingTime = parsedData.remainingTime || this.duration;
            this.isRunning = parsedData.isRunning || false;
        }
    }

    saveAllData() {
        const dataToSave = {
            settings: this.settings,
            pointsSystem: this.pointsSystem,
            remainingTime: this.remainingTime,
            isRunning: this.isRunning,
            tasks: this.tasks
        };
        localStorage.setItem('pomodoroData', JSON.stringify(dataToSave));
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

    initializeTaskSystem() {
        this.taskInput = document.getElementById('taskInput');
        this.taskList = document.getElementById('taskList');

        // Task input handler
        this.taskInput.addEventListener('change', (e) => {
            this.setCurrentTask(e.target.value);
        });

        // Initial render of task history
        this.renderTaskHistory();
    }

    setCurrentTask(taskTitle) {
        if (!taskTitle.trim()) return;

        this.tasks.current = {
            title: taskTitle.trim(),
            startTime: new Date().toISOString(),
            duration: 0,
            completed: false
        };
        
        this.saveTasks();
    }

    completeCurrentTask() {
        if (!this.tasks.current) return;

        const task = this.tasks.current;
        task.completed = true;
        task.endTime = new Date().toISOString();
        task.duration = this.settings.focusDuration; // in minutes
        
        // Calculate bonus points (25% extra for completing with a task)
        const basePoints = this.calculatePointsEarned();
        const taskBonus = Math.round(basePoints * 0.25);
        const totalPoints = basePoints + taskBonus;
        
        // Store the points with the task
        task.points = totalPoints;  // Add this line to store points

        // Add to history and clear current
        this.tasks.history.unshift(task);
        this.tasks.current = null;
        this.taskInput.value = '';
        
        // Save and render
        this.saveTasks();
        this.renderTaskHistory();

        return totalPoints;
    }

    // Add these helper functions
    groupTasksByDate(tasks) {
        const now = new Date();
        const oneDay = 24 * 60 * 60 * 1000;
        const oneWeek = 7 * oneDay;

        const groups = {
            today: [],
            lastWeek: [],
            byMonth: {}
        };

        tasks.forEach(task => {
            const taskDate = new Date(task.endTime);
            const timeDiff = now - taskDate;
            const monthKey = taskDate.toLocaleString('default', { month: 'long', year: 'numeric' });

            // Today
            if (timeDiff < oneDay && taskDate.getDate() === now.getDate()) {
                groups.today.push(task);
            }
            // Last Week
            else if (timeDiff < oneWeek) {
                groups.lastWeek.push(task);
            }
            // Group by Month
            else {
                if (!groups.byMonth[monthKey]) {
                    groups.byMonth[monthKey] = [];
                }
                groups.byMonth[monthKey].push(task);
            }
        });

        return groups;
    }

    renderTaskGroup(tasks, title) {
        if (!tasks || tasks.length === 0) return '';
        
        return `
            <div class="task-group">
                <h4 class="task-group-title">${title}</h4>
                ${tasks.map(task => `
                    <div class="task-item">
                        <div class="task-item-left">
                            <div class="task-title">${task.title}</div>
                            <div class="task-meta">
                                ${task.duration}min • ${new Date(task.endTime).toLocaleDateString()}
                            </div>
                        </div>
                        <div class="task-points">+${task.points || 0}pts</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Update the renderTaskHistory method
    renderTaskHistory() {
        if (!this.taskList) return;

        if (this.tasks.history.length === 0) {
            this.taskList.parentElement.style.display = 'none';
            return;
        }

        this.taskList.parentElement.style.display = 'block';
        const groupedTasks = this.groupTasksByDate(this.tasks.history);
        
        let html = '';

        // Today's tasks
        if (groupedTasks.today.length > 0) {
            html += this.renderTaskGroup(groupedTasks.today, 'Today');
        }

        // Last week's tasks
        if (groupedTasks.lastWeek.length > 0) {
            html += this.renderTaskGroup(groupedTasks.lastWeek, 'Last Week');
        }

        // Monthly tasks
        Object.entries(groupedTasks.byMonth).forEach(([month, tasks]) => {
            html += this.renderTaskGroup(tasks, month);
        });

        this.taskList.innerHTML = html;
    }

    loadTasks() {
        const savedTasks = localStorage.getItem('pomodoroTasks');
        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
        }
    }

    saveTasks() {
        localStorage.setItem('pomodoroTasks', JSON.stringify(this.tasks));
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});
