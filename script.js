(() => {
if (window.__pomotorroInitialized) {
    return;
}
window.__pomotorroInitialized = true;

const SUPABASE_URL = 'https://vdagjbbpxtrjtpldixeg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkYWdqYmJweHRyanRwbGRpeGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NzIzMzYsImV4cCI6MjA3OTU0ODMzNn0.D_EfhnLhfrThh_C2rveK2dzHefQvJpjT_ISc-j400Mk';
if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('Supabase client library failed to load.');
    return;
}
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

class AuthManager {
    constructor(timer) {
        this.timer = timer;
        this.user = null;
        this.initializeElements();
        this.initializeEventListeners();
        this.checkUser();
    }

    initializeElements() {
        this.loginBtn = document.getElementById('loginBtn');
        this.loginModal = document.getElementById('loginModal');
        this.emailInput = document.getElementById('emailInput');
        this.passwordInput = document.getElementById('passwordInput');
        this.loginSubmitBtn = document.getElementById('loginSubmitBtn');
        this.signupSubmitBtn = document.getElementById('signupSubmitBtn');
        this.authError = document.getElementById('authError');

        // Close button for modal
        if (this.loginModal) {
            this.closeBtn = this.loginModal.querySelector('.close-btn');
        }
    }

    initializeEventListeners() {
        if (this.loginBtn) {
            this.loginBtn.addEventListener('click', () => {
                if (this.user) {
                    this.signOut();
                } else {
                    this.openModal();
                }
            });
        }

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closeModal());
        }

        if (this.loginModal) {
            this.loginModal.addEventListener('click', (e) => {
                if (e.target === this.loginModal) this.closeModal();
            });
        }

        if (this.loginSubmitBtn) {
            this.loginSubmitBtn.addEventListener('click', () => this.signIn());
        }

        if (this.signupSubmitBtn) {
            this.signupSubmitBtn.addEventListener('click', () => this.signUp());
        }
    }

    async checkUser() {
        // Check for errors in URL (e.g. from email link)
        this.checkUrlForErrors();

        const { data: { session } } = await supabase.auth.getSession();
        this.handleAuthStateChange(session, true);

        supabase.auth.onAuthStateChange((event, session) => {
            // Treat INITIAL_SESSION as an initial check to prevent "Logged out" notification
            const isInitial = event === 'INITIAL_SESSION';
            this.handleAuthStateChange(session, isInitial);
        });
    }

    checkUrlForErrors() {
        const hash = window.location.hash;
        if (hash && hash.includes('error=')) {
            const params = new URLSearchParams(hash.substring(1)); // remove #
            const error = params.get('error');
            const errorDescription = params.get('error_description');

            if (error) {
                this.openModal();
                this.authError.textContent = errorDescription ? decodeURIComponent(errorDescription.replace(/\+/g, ' ')) : 'Authentication error';
                this.authError.style.color = 'red';

                // Clear the hash without reloading
                history.replaceState(null, null, ' ');
            }
        }
    }

    handleAuthStateChange(session, isInitial = false) {
        this.user = session?.user || null;

        if (this.user) {
            this.loginBtn.textContent = 'Log Out';
            this.timer.onLogin(this.user);
        } else {
            this.loginBtn.textContent = 'Log In';
            if (!isInitial) {
                this.timer.onLogout();
            }
        }
    }

    openModal() {
        this.loginModal.classList.add('show');
        this.authError.textContent = '';
    }

    closeModal() {
        this.loginModal.classList.remove('show');
        if (this.emailInput) this.emailInput.value = '';
        if (this.passwordInput) this.passwordInput.value = '';
        if (this.authError) this.authError.textContent = '';
    }

    async signIn() {
        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value.trim();

        if (!email || !password) {
            this.authError.textContent = 'Please enter email and password';
            this.authError.style.color = 'red';
            return;
        }

        this.loginSubmitBtn.disabled = true;
        this.loginSubmitBtn.textContent = 'Logging in...';
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                this.authError.textContent = error.message;
                this.authError.style.color = 'red';
                return;
            }
            this.closeModal();
        } catch (error) {
            this.authError.textContent = error?.message || 'Unable to log in right now.';
            this.authError.style.color = 'red';
        } finally {
            this.loginSubmitBtn.disabled = false;
            this.loginSubmitBtn.textContent = 'Log In';
        }
    }

    async signUp() {
        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email || !password) {
            this.authError.textContent = 'Please enter email and password';
            this.authError.style.color = 'red';
            return;
        }

        if (!emailRegex.test(email)) {
            this.authError.textContent = 'Please enter a valid email address';
            this.authError.style.color = 'red';
            return;
        }

        if (password.length < 6) {
            this.authError.textContent = 'Password must be at least 6 characters';
            this.authError.style.color = 'red';
            return;
        }

        this.signupSubmitBtn.disabled = true;
        this.signupSubmitBtn.textContent = 'Creating...';
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}${window.location.pathname}`
                }
            });

            if (error) {
                const msg = (error.message || '').toLowerCase();
                if (msg.includes('already registered') || msg.includes('already exists')) {
                    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
                    if (!signInError) {
                        this.authError.textContent = 'Account exists. Logged you in.';
                        this.authError.style.color = 'green';
                        setTimeout(() => this.closeModal(), 1000);
                        return;
                    }

                    if ((signInError.message || '').toLowerCase().includes('email not confirmed')) {
                        this.authError.textContent = 'Account exists. Please confirm your email first.';
                        this.authError.style.color = 'orange';
                        return;
                    }

                    this.authError.textContent = 'Account already exists. Use Log In with your password.';
                    this.authError.style.color = 'red';
                    return;
                }

                this.authError.textContent = error.message;
                this.authError.style.color = 'red';
                return;
            }

            if (data.session) {
                this.authError.textContent = 'Account created! You are now logged in.';
                this.authError.style.color = 'green';
                setTimeout(() => this.closeModal(), 1500);
            } else if (data.user) {
                this.authError.textContent = 'Account created! Please check your email to confirm.';
                this.authError.style.color = 'orange';
            }
        } catch (error) {
            this.authError.textContent = error?.message || 'Unable to create account right now.';
            this.authError.style.color = 'red';
        } finally {
            this.signupSubmitBtn.disabled = false;
            this.signupSubmitBtn.textContent = 'Create Account';
        }
    }

    async signOut() {
        await supabase.auth.signOut();
    }
}

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
        this.activationStorageKey = 'pomotorroActivationSeen';
        this.activationDone = false;

        // Initialize elements first
        this.initializeElements();

        // Then load data and set up other functionality
        this.loadAllData();
        this.initializeEventListeners();
        this.updateProgress(1);
        this.initializeSettingsModal();
        this.initializeAudio();
        this.initializeTaskSystem();

        // Initialize Auth Manager
        this.authManager = new AuthManager(this);

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
            this.markActivationComplete();

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
        this.updatePointsDisplay();
        this.saveAllData();

        // Sync points to Supabase if logged in
        if (this.authManager && this.authManager.user) {
            this.syncPointsToSupabase();
        }
    }

    async syncPointsToSupabase() {
        if (!this.authManager.user) return;

        const updates = {
            id: this.authManager.user.id,
            points: this.pointsSystem.points,
            level: this.pointsSystem.level,
            points_to_next_level: this.pointsSystem.pointsToNextLevel,
            multiplier: this.pointsSystem.multiplier,
            streak_count: this.pointsSystem.streakCount,
            last_pomodoro: this.pointsSystem.lastPomodoro,
            updated_at: new Date()
        };

        const { error } = await supabase
            .from('profiles')
            .upsert(updates);

        if (error) console.error('Error syncing points:', error);
    }

    async syncSessionsToSupabase() {
        if (!this.authManager.user || !this.tasks.history || this.tasks.history.length === 0) return;

        // Get all session timestamps for this user to prevent duplicates
        const { data: existingSessions, error: fetchError } = await supabase
            .from('pomodoro_sessions')
            .select('created_at')
            .eq('user_id', this.authManager.user.id);

        if (fetchError) {
            console.error('Error fetching existing sessions:', fetchError);
            return;
        }

        const existingTimestamps = new Set(existingSessions.map(s => s.created_at));

        // Filter local tasks that are not in the database
        const newSessions = this.tasks.history.filter(task => !existingTimestamps.has(task.endTime));

        if (newSessions.length === 0) {
            return;
        }



        // Prepare data for insertion
        const sessionsToInsert = newSessions.map(task => ({
            user_id: this.authManager.user.id,
            task_name: task.title,
            duration: task.duration,
            completed: true,
            created_at: task.endTime
        }));

        const { error: insertError } = await supabase
            .from('pomodoro_sessions')
            .insert(sessionsToInsert);

        if (insertError) {
            console.error('Error uploading sessions:', insertError);
        }
    }

    async onLogin(user) {
        // Fetch user profile
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (data) {
            const cloudPoints = data.points || 0;
            const localPoints = this.pointsSystem.points;



            // Smart merge: keep the higher points
            // This prevents overwriting local progress with an empty/old cloud profile
            if (localPoints > cloudPoints) {
                this.syncPointsToSupabase();
                this.showNotification(`Synced ${localPoints} points to account.`);
            } else {
                this.pointsSystem = {
                    points: cloudPoints,
                    level: data.level || 1,
                    pointsToNextLevel: data.points_to_next_level || 100,
                    multiplier: data.multiplier || 1.0,
                    streakCount: data.streak_count || 0,
                    lastPomodoro: data.last_pomodoro,
                    sessionsSinceLongBreak: this.pointsSystem.sessionsSinceLongBreak // Keep local session state
                };

                this.updatePointsDisplay();
                this.saveAllData();

                if (cloudPoints > 0) {
                    this.showNotification(`Welcome back! Loaded ${cloudPoints} points.`);
                } else {
                    this.showNotification('Account connected successfully.');
                }
            }
        } else {
            // New user or no profile, create one with current local data
            this.syncPointsToSupabase();
            if (this.pointsSystem.points > 0) {
                this.showNotification(`Account connected! Synced ${this.pointsSystem.points} points.`);
            } else {
                this.showNotification('Account connected successfully.');
            }
        }

        // Sync local sessions history to cloud
        await this.syncSessionsToSupabase();
    }

    onLogout() {
        // Optional: clear data or keep it?
        // Let's keep it for now, but maybe we should reset to default?
        // For a better UX, maybe we just keep the current state but it's no longer syncing.
        this.showNotification('Logged out. Progress will be saved locally.');
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'points-notification';
        notification.innerHTML = `<p>${message}</p>`;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
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
        this.startBtn.textContent = 'Start Focus';
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
        if (this.settingsModal) {
            this.settingsModal.classList.add('show');
        }
    }

    closeSettings() {
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
            this.startBtn.textContent = 'Start Focus';
            document.title = this.originalTitle;

            // Update points display
            this.updatePointsDisplay();
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
        this.activationHelper = document.getElementById('activationHelper');
        this.quickTasks = document.getElementById('quickTasks');
        this.quickTaskChips = Array.from(document.querySelectorAll('.quick-task-chip'));

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

        this.initializeActivationUX();

        // Initial render of task history
        this.renderTaskHistory();
    }

    initializeActivationUX() {
        const hasActivated = localStorage.getItem(this.activationStorageKey) === '1';
        this.activationDone = hasActivated;

        if (this.startBtn && !hasActivated) {
            this.startBtn.classList.add('cta-pulse');
        }

        if (this.activationHelper && hasActivated) {
            this.activationHelper.classList.add('done');
        }

        if (!this.quickTasks || !this.taskInput) return;

        this.quickTasks.addEventListener('click', (event) => {
            const chip = event.target.closest('.quick-task-chip');
            if (!chip) return;

            if (chip.dataset.action === 'more') {
                const expanded = this.quickTasks.classList.toggle('expanded');
                chip.textContent = expanded ? 'Less' : 'More';
                return;
            }

            const task = chip.dataset.task;
            if (!task) return;

            this.taskInput.value = task;
            this.setCurrentTask(task);
            this.taskInput.focus();
            try {
                this.taskInput.setSelectionRange(task.length, task.length);
            } catch (error) {
                // Ignore selection issues on browsers that don't support this state.
            }
        });
    }

    markActivationComplete() {
        if (this.activationDone) return;
        this.activationDone = true;
        localStorage.setItem(this.activationStorageKey, '1');

        if (this.startBtn) {
            this.startBtn.classList.remove('cta-pulse');
        }

        if (this.activationHelper) {
            this.activationHelper.classList.add('done');
        }
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

        // Save to Supabase
        this.saveTaskToSupabase(task);

        return totalPoints;
    }

    async saveTaskToSupabase(task) {
        if (!this.authManager || !this.authManager.user) return;

        const { error } = await supabase
            .from('pomodoro_sessions')
            .insert({
                user_id: this.authManager.user.id,
                task_name: task.title,
                duration: task.duration,
                completed: true,
                created_at: task.endTime
            });

        if (error) console.error('Error saving task:', error);
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
        this.startBtn.textContent = 'Start Focus';
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
})();
