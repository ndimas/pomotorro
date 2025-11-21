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
            streakCount: 0,
            lastPomodoro: null,
            sessionsSinceLongBreak: 0
        };

        this.tasks = {
            current: null,
            history: []
        };

        // Initialize elements first
        this.initializeElements();

        // Then load data and set up other functionality
        this.loadAllData();
        this.initializeEventListeners();
        this.updateProgress(1);
        this.initializeSettingsModal();
        this.initializeAudio();
        this.initializeTaskSystem();

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
        // Add this line at the beginning to ensure we get the timer display element
        this.timerDisplay = document.querySelector('.timer-display');
        if (!this.timerDisplay) {
            console.error('Timer display element not found');
            return;
        }

        this.startBtn = document.querySelector('.start-btn');
        this.resetBtn = document.querySelector('.reset-btn');
        this.liquidBackground = document.querySelector('.liquid-background');
        this.pointsDisplay = document.getElementById('points');
        this.navBtns = document.querySelectorAll('.nav-btn');

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
        this.resetBtn.addEventListener('click', () => this.resetTimer());

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
            this.startBtn.textContent = 'Resume';
            this.resetBtn.classList.add('show');
        } else {
            // Capture current task input if set
            if (this.taskInput && this.taskInput.value) {
                this.setCurrentTask(this.taskInput.value);
            }

            // Resume audio context if it was suspended
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            this.startTimer();
            this.startBtn.textContent = 'Pause';
            this.resetBtn.classList.remove('show');
            this.playSound('start');
        }
        this.isRunning = !this.isRunning;
    }

    startTimer() {
        // Set the end time based on remaining duration
        this.endTime = Date.now() + this.remainingTime;

        if (this.liquidBackground) {
            this.liquidBackground.classList.add('running');
        }

        this.timer = requestAnimationFrame(this.updateTimer.bind(this));
    }

    updateTimer() {
        if (!this.isRunning) return;

        const currentTime = Date.now();
        this.remainingTime = Math.max(0, this.endTime - currentTime);

        this.updateDisplay();
        this.updateProgress(this.remainingTime / this.duration);

        if (this.remainingTime === 0) {
            // Check if we're in a break
            if (this.duration === this.settings.shortBreak * 60 * 1000 ||
                this.duration === this.settings.longBreak * 60 * 1000) {
                this.completeBreak();
            } else {
                this.completePomodoro();
            }
            return;
        }

        if (document.hidden) {
            setTimeout(() => this.updateTimer(), 1000);
        } else {
            this.timer = requestAnimationFrame(this.updateTimer.bind(this));
        }
    }

    pauseTimer() {
        if (this.liquidBackground) {
            this.liquidBackground.classList.remove('running');
        }

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

    updateProgress(percent) {
        if (this.liquidBackground) {
            this.liquidBackground.style.height = `${percent * 100}%`;
        }
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

        // Handle break timer
        this.pointsSystem.sessionsSinceLongBreak++;
        const isLongBreak = this.pointsSystem.sessionsSinceLongBreak >= 4;

        if (isLongBreak) {
            this.duration = this.settings.longBreak * 60 * 1000;
            this.pointsSystem.sessionsSinceLongBreak = 0; // Reset counter
        } else {
            this.duration = this.settings.shortBreak * 60 * 1000;
        }

        this.remainingTime = this.duration;
        this.endTime = null;
        this.updateDisplay();
        this.updateProgress(1);

        if (this.settings.autoStartBreaks) {
            // Auto start the break timer
            setTimeout(() => {
                this.startTimer();
                this.isRunning = true;
                this.startBtn.textContent = 'Pause';
                document.title = isLongBreak ? 'Long Break!' : 'Short Break!';
            }, 1000);

            // Show break notification
            alert(isLongBreak ? 'Long Break started automatically!' : 'Short Break started automatically!');
        } else {
            // Manual start
            this.startBtn.textContent = 'Start Break';
            document.title = isLongBreak ? 'Long Break Ready' : 'Short Break Ready';

            // Show completion alert
            alert(isLongBreak ? 'Pomodoro completed! Time for a Long Break.' : 'Pomodoro completed! Time for a Short Break.');
        }

        // Save the state
        this.saveAllData();
    }

    reset() {
        this.pauseTimer();
        this.isRunning = false;
        this.remainingTime = this.duration;
        this.startBtn.textContent = 'Start';
        this.resetBtn.classList.remove('show');
        this.updateDisplay();
        this.updateProgress(1);
        document.title = this.originalTitle; // Reset title
    }

    resetTimer() {
        if (confirm('Are you sure you want to reset the timer?')) {
            this.reset();
        }
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

        this.settings = newSettings;
        this.duration = this.settings.focusDuration * 60 * 1000;
        this.remainingTime = this.duration;
        this.endTime = null;

        // Save to the single data store
        this.saveAllData();

        this.updateDisplay();
        this.updateProgress(1);
        this.closeSettings();
    }

    loadAllData() {
        const savedData = localStorage.getItem('pomodoroData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            this.settings = { ...this.settings, ...parsedData.settings };
            this.pointsSystem = { ...this.pointsSystem, ...parsedData.pointsSystem };
            this.tasks = { ...this.tasks, ...parsedData.tasks };

            // Always reset to focus duration on page load
            this.duration = this.settings.focusDuration * 60 * 1000;
            this.remainingTime = this.duration;
            this.isRunning = false;
            this.endTime = null;

            // Update display to show focus duration
            this.updateDisplay();
            this.updateProgress(1);
            this.startBtn.textContent = 'Start';
            document.title = this.originalTitle;
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

        // Add Enter key support to start timer
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.setCurrentTask(this.taskInput.value);
                if (!this.isRunning) {
                    this.toggleTimer();
                }
                this.taskInput.blur(); // Optional: remove focus after starting
            }
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

        const isToday = title === 'Today';

        return `
            <div class="task-group">
                <h4 class="task-group-title">${title}</h4>
                ${tasks.map(task => {
            const date = new Date(task.endTime);
            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateString = date.toLocaleDateString();
            const displayDate = isToday ? timeString : dateString;

            return `
                    <div class="task-item">
                        <div class="task-item-left">
                            <div class="task-title">${task.title}</div>
                            <div class="task-meta">
                                ${task.duration}min • ${displayDate}
                            </div>
                        </div>
                        <div class="task-points">+${task.points || 0}pts</div>
                    </div>
                    `;
        }).join('')}
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

    // Add a method to handle break completion
    async completeBreak() {
        this.pauseTimer();
        this.isRunning = false;

        // Reset to focus duration
        this.duration = this.settings.focusDuration * 60 * 1000;
        this.remainingTime = this.duration;
        this.endTime = null;

        // Update UI
        this.updateDisplay();
        this.updateProgress(1);
        this.startBtn.textContent = 'Start';
        document.title = this.originalTitle;

        // Play sound if enabled
        if (this.settings.soundEnabled) {
            this.playSound('complete');
        }

        alert('Break completed! Ready for next focus session?');

        // Save state
        this.saveAllData();
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});

