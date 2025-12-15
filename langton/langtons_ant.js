class LangtonsAnt {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Grid dimensions
        this.gridWidth = 75;
        this.gridHeight = 56;
        this.cellSize = Math.min(
            this.canvas.width / this.gridWidth,
            this.canvas.height / this.gridHeight
        );
        
        // Adjust canvas size to fit grid perfectly
        this.canvas.width = this.gridWidth * this.cellSize;
        this.canvas.height = this.gridHeight * this.cellSize;
        
        // Grid state (false = white, true = black)
        this.grid = Array(this.gridHeight).fill().map(() => Array(this.gridWidth).fill(false));
        
        // Ant properties
        this.antX = Math.floor(this.gridWidth / 2);
        this.antY = Math.floor(this.gridHeight / 2);
        this.direction = 0; // 0=North, 1=East, 2=South, 3=West
        this.directions = ['North', 'East', 'South', 'West'];
        
        // Animation properties
        this.isRunning = false;
        this.animationId = null;
        this.stepCount = 0;
        this.speed = 50;
        
        // Sound properties
        this.audioContext = null;
        this.soundEnabled = true;
        this.soundMode = 'default';
        this.highwayDetected = false;
        this.highwaySoundPlaying = false;
        this.canContinueAfterHighway = false;
        
        // Background music properties
        this.backgroundMusicPlaying = false;
        this.backgroundMusicOscillator = null;
        this.backgroundMusicGain = null;
        this.backgroundMusicIndex = 0;
        this.backgroundMusicInterval = null;
        
        // Musical note properties
        this.musicalNoteIndex = 0;
        this.musicalScale = [
            261.63, // C4
            293.66, // D4
            329.63, // E4
            349.23, // F4
            392.00, // G4
            440.00, // A4
            493.88, // B4
            523.25, // C5
            587.33, // D5
            659.25, // E5
            698.46, // F5
            783.99  // G5
        ];
        
        // Random notes scale (pentatonic for pleasant sound)
        this.randomScale = [
            261.63, 293.66, 329.63, 392.00, 440.00, // C D E G A
            523.25, 587.33, 659.25, 783.99, 880.00  // C5 D5 E5 G5 A5
        ];
        
        // Für Elise melody (Beethoven)
        this.cornfieldMelody = [
            // Opening theme - iconic beginning
            659.25, 622.25, 659.25, 622.25, 659.25, 493.88, 587.33, 523.25,
            293.66, 196.00, 246.94, 293.66, 329.63, 220.00, 261.63, 329.63,
            // Second phrase
            369.99, 246.94, 329.63, 369.99, 415.30, 277.18, 349.23, 415.30,
            // Development
            659.25, 622.25, 659.25, 622.25, 659.25, 493.88, 587.33, 523.25,
            293.66, 196.00, 246.94, 293.66, 329.63, 220.00, 261.63, 329.63,
            // Variation
            369.99, 246.94, 329.63, 369.99, 415.30, 277.18, 415.30, 440.00,
            // Bridge section
            493.88, 523.25, 554.37, 587.33, 622.25, 659.25, 698.46, 739.99,
            783.99, 739.99, 698.46, 659.25, 622.25, 587.33, 554.37, 523.25,
            // Final return to theme
            659.25, 622.25, 659.25, 622.25, 659.25, 493.88, 587.33, 523.25,
            293.66, 196.00, 246.94, 293.66, 329.63, 220.00, 261.63, 329.63
        ];
        
        // Für Elise timing - expressive and flowing
        this.cornfieldNoteDurations = [
            // Opening theme - delicate
            0.3, 0.3, 0.3, 0.3, 0.3, 0.5, 0.5, 0.8,
            1.2, 0.4, 0.4, 0.5, 0.8, 0.4, 0.4, 0.5,
            // Second phrase - similar rhythm
            0.8, 0.4, 0.4, 0.5, 0.8, 0.4, 0.4, 0.5,
            // Development - repeat of opening
            0.3, 0.3, 0.3, 0.3, 0.3, 0.5, 0.5, 0.8,
            1.2, 0.4, 0.4, 0.5, 0.8, 0.4, 0.4, 0.5,
            // Variation - slightly different
            0.8, 0.4, 0.4, 0.5, 0.8, 0.4, 0.5, 0.8,
            // Bridge section - flowing
            0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6,
            1.0, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.8,
            // Final return - gentle ending
            0.3, 0.3, 0.3, 0.3, 0.3, 0.5, 0.5, 0.8,
            1.2, 0.4, 0.4, 0.5, 0.8, 0.4, 0.4, 1.5
        ];
        this.cornfieldIndex = 0;
        
        // Movement rules
        this.currentRule = 'LR';
        this.rules = {
            'LR': [1, -1], // Classic: Right on white, Left on black
            'RL': [-1, 1], // Reverse: Left on white, Right on black
            'LLRR': [-1, -1, 1, 1], // LLRR pattern
            'LRRL': [-1, 1, 1, -1]  // LRRL pattern
        };
        
        // Highway detection
        this.pathHistory = [];
        this.highwayStartStep = -1;
        this.highwayPattern = [];
        this.patternLength = 104; // Classic Langton's Ant highway pattern length
        
        // Highway prediction based on rule type
        this.highwayPredictions = {
            'LR': 10400,   // Classic rule
            'RL': 8500,    // Reverse rule (estimated)
            'LLRR': 15000, // More complex pattern
            'LRRL': 12000  // Another complex pattern
        };
        
        // Colors
        this.colors = {
            white: '#ffffff',
            black: '#2c3e50',
            ant: '#e74c3c',
            antBody: '#c0392b',
            grid: '#ecf0f1'
        };
        
        this.initializeAudio();
        this.initializeEventListeners();
        this.draw();
        this.updateUI();
    }
    
    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            this.soundEnabled = false;
        }
    }
    
    playMoveSound() {
        if (!this.soundEnabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            const currentCell = this.grid[this.antY][this.antX];
            
            switch (this.soundMode) {
                case 'default':
                    this.playDefaultSound(oscillator, gainNode, currentCell);
                    break;
                case 'interesting':
                    this.playInterestingSound(oscillator, gainNode, currentCell);
                    break;
                case 'musical':
                    this.playMusicalSound(oscillator, gainNode);
                    break;
                case 'random':
                    this.playRandomSound(oscillator, gainNode);
                    break;
                case 'cornfield':
                    this.playCornfieldSound(oscillator, gainNode);
                    break;
            }
            
            oscillator.start();
            
            // Different durations for different sound modes
            const duration = this.soundMode === 'cornfield' ? 
                (this.cornfieldIndex % 7 === 6 ? 0.25 : this.cornfieldIndex % 7 === 1 ? 0.22 : 0.18) : 
                0.15;
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.warn('Error playing move sound:', e);
        }
    }
    
    playDefaultSound(oscillator, gainNode, currentCell) {
        // Original default sound
        oscillator.frequency.setValueAtTime(
            currentCell ? 800 : 400,
            this.audioContext.currentTime
        );
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
    }
    
    playInterestingSound(oscillator, gainNode, currentCell) {
        // More interesting sound with harmonics
        const baseFreq = currentCell ? 660 : 330;
        const modulation = Math.sin(this.stepCount * 0.1) * 50;
        
        oscillator.frequency.setValueAtTime(
            baseFreq + modulation,
            this.audioContext.currentTime
        );
        oscillator.frequency.linearRampToValueAtTime(
            baseFreq + modulation + (currentCell ? 100 : -50),
            this.audioContext.currentTime + 0.1
        );
        
        oscillator.type = currentCell ? 'sawtooth' : 'triangle';
        gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
    }
    
    playMusicalSound(oscillator, gainNode) {
        // Play musical notes in sequence
        const frequency = this.musicalScale[this.musicalNoteIndex % this.musicalScale.length];
        this.musicalNoteIndex++;
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = 'sine';
        
        // Add slight attack and decay for musical feel
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
    }
    
    playRandomSound(oscillator, gainNode) {
        // Play random notes from pentatonic scale
        const randomIndex = Math.floor(Math.random() * this.randomScale.length);
        const frequency = this.randomScale[randomIndex];
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = Math.random() > 0.5 ? 'sine' : 'triangle';
        
        // Vary volume for more dynamic feel
        const volume = 0.1 + Math.random() * 0.1;
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.12);
    }
    
    playCornfieldSound(oscillator, gainNode) {
        // Play Cornfield Chase inspired melody
        const frequency = this.cornfieldMelody[this.cornfieldIndex % this.cornfieldMelody.length];
        this.cornfieldIndex++;
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = 'sine';
        
        // Musical phrasing with slight variations
        const phrasePosition = this.cornfieldIndex % 7; // 7-note phrases
        let volume = 0.2;
        let duration = 0.18;
        
        // Emphasize phrase beginnings and endings
        if (phrasePosition === 1 || phrasePosition === 0) {
            volume = 0.25; // Slightly louder for phrase starts
            duration = 0.22;
        } else if (phrasePosition === 6) {
            volume = 0.15; // Softer for phrase endings
            duration = 0.25;
        }
        
        // Longer, more expressive notes for cinematic feel
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(volume * 0.8, this.audioContext.currentTime + duration * 0.7);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    }
    
    playHighwaySound() {
        if (!this.soundEnabled || !this.audioContext || this.highwaySoundPlaying) return;
        
        try {
            this.highwaySoundPlaying = true;
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Highway formation sound - ascending notes
            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(600, this.audioContext.currentTime + 1.5);
            
            oscillator.type = 'triangle';
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.5);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 1.5);
            
            setTimeout(() => {
                this.highwaySoundPlaying = false;
            }, 1500);
        } catch (e) {
            console.warn('Error playing highway sound:', e);
        }
    }
    initializeEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('stepBtn').addEventListener('click', () => this.step());
        document.getElementById('continueBtn').addEventListener('click', () => this.continueAfterHighway());
        
        const speedRange = document.getElementById('speedRange');
        speedRange.addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
            document.getElementById('speedValue').textContent = this.speed;
        });
        
        const soundToggle = document.getElementById('soundToggle');
        soundToggle.addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
            if (this.soundEnabled && !this.audioContext) {
                this.initializeAudio();
            }
        });
        
        // Handle radio button sound mode selection
        const soundModeRadios = document.querySelectorAll('input[name="soundMode"]');
        soundModeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.soundMode = e.target.value;
                    // Reset indexes when switching modes
                    if (this.soundMode === 'musical') {
                        this.musicalNoteIndex = 0;
                    } else if (this.soundMode === 'cornfield') {
                        this.cornfieldIndex = 0;
                    }
                }
            });
        });
        
        const ruleSelect = document.getElementById('ruleSelect');
        ruleSelect.addEventListener('change', (e) => {
            this.currentRule = e.target.value;
            this.updateRuleDescription();
            this.updateHighwayPrediction();
        });
        
        // Handle title click for background music
        const titleHeader = document.getElementById('titleHeader');
        titleHeader.addEventListener('click', () => this.toggleBackgroundMusic());
        
        this.updateRuleDescription();
    }
    
    updateRuleDescription() {
        const descriptions = {
            'LR': [
                'At a white square: turn 90° right, flip the color, move forward',
                'At a black square: turn 90° left, flip the color, move forward'
            ],
            'RL': [
                'At a white square: turn 90° left, flip the color, move forward',
                'At a black square: turn 90° right, flip the color, move forward'
            ],
            'LLRR': [
                'White (0): turn left, flip, move forward',
                'Black (1): turn left, flip, move forward',
                'Color 2: turn right, flip, move forward',
                'Color 3: turn right, flip, move forward'
            ],
            'LRRL': [
                'White (0): turn left, flip, move forward',
                'Black (1): turn right, flip, move forward',
                'Color 2: turn right, flip, move forward',
                'Color 3: turn left, flip, move forward'
            ]
        };
        
        const ruleDesc = document.getElementById('ruleDescription');
        const rules = descriptions[this.currentRule] || descriptions['LR'];
        ruleDesc.innerHTML = '<ul>' + rules.map(rule => `<li>${rule}</li>`).join('') + '</ul>';
    }
    
    updateHighwayPrediction() {
        const prediction = this.highwayPredictions[this.currentRule] || 10400;
        document.getElementById('highwayPrediction').textContent = `~${prediction.toLocaleString()} steps`;
    }
    
    toggleBackgroundMusic() {
        if (!this.audioContext) {
            this.initializeAudio();
        }
        
        if (this.backgroundMusicPlaying) {
            this.stopBackgroundMusic();
        } else {
            this.startBackgroundMusic();
        }
    }
    
    startBackgroundMusic() {
        if (!this.audioContext || this.backgroundMusicPlaying) return;
        
        try {
            this.backgroundMusicPlaying = true;
            this.backgroundMusicIndex = 0;
            
            // Add visual indicator
            document.getElementById('titleHeader').classList.add('playing');
            
            // Resume audio context if needed
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            // Start playing the melody
            this.playBackgroundNote();
            
        } catch (e) {
            console.warn('Error starting background music:', e);
            this.backgroundMusicPlaying = false;
        }
    }
    
    stopBackgroundMusic() {
        this.backgroundMusicPlaying = false;
        
        // Remove visual indicator
        document.getElementById('titleHeader').classList.remove('playing');
        
        // Clear the interval
        if (this.backgroundMusicInterval) {
            clearTimeout(this.backgroundMusicInterval);
            this.backgroundMusicInterval = null;
        }
        
        // Stop current note if playing
        if (this.backgroundMusicOscillator) {
            try {
                this.backgroundMusicOscillator.stop();
            } catch (e) {
                // Oscillator may already be stopped
            }
            this.backgroundMusicOscillator = null;
        }
        
        // Reset background music index for smooth restart
        this.backgroundMusicIndex = 0;
    }
    
    playBackgroundNote() {
        if (!this.backgroundMusicPlaying || !this.audioContext) return;
        
        try {
            // Create oscillator and gain for piano-like background music
            this.backgroundMusicOscillator = this.audioContext.createOscillator();
            this.backgroundMusicGain = this.audioContext.createGain();
            
            // Create additional oscillators for piano-like harmonics
            const harmonic2 = this.audioContext.createOscillator();
            const harmonic3 = this.audioContext.createOscillator();
            const harmonicGain2 = this.audioContext.createGain();
            const harmonicGain3 = this.audioContext.createGain();
            
            // Connect main oscillator
            this.backgroundMusicOscillator.connect(this.backgroundMusicGain);
            this.backgroundMusicGain.connect(this.audioContext.destination);
            
            // Connect harmonics for piano-like timbre
            harmonic2.connect(harmonicGain2);
            harmonic3.connect(harmonicGain3);
            harmonicGain2.connect(this.audioContext.destination);
            harmonicGain3.connect(this.audioContext.destination);
            
            // Get current note from Cornfield Chase melody
            const noteIndex = this.backgroundMusicIndex % this.cornfieldMelody.length;
            const frequency = this.cornfieldMelody[noteIndex];
            const noteDuration = this.cornfieldNoteDurations[noteIndex];
            this.backgroundMusicIndex++;
            
            // Set frequencies (fundamental + harmonics for piano sound)
            this.backgroundMusicOscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            harmonic2.frequency.setValueAtTime(frequency * 2, this.audioContext.currentTime); // Octave
            harmonic3.frequency.setValueAtTime(frequency * 3, this.audioContext.currentTime); // Fifth
            
            // Use triangle wave for warmer, more piano-like tone
            this.backgroundMusicOscillator.type = 'triangle';
            harmonic2.type = 'sine';
            harmonic3.type = 'sine';
            
            // Set volumes - main note louder, harmonics softer for Für Elise
            const mainVolume = 0.08; // Softer for delicate Für Elise
            const harmonic2Volume = 0.02;
            const harmonic3Volume = 0.01;
            
            // Für Elise piano envelope - very expressive
            this.backgroundMusicGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            this.backgroundMusicGain.gain.linearRampToValueAtTime(mainVolume, this.audioContext.currentTime + 0.02); // Quick, delicate attack
            this.backgroundMusicGain.gain.linearRampToValueAtTime(mainVolume * 0.5, this.audioContext.currentTime + noteDuration * 0.6); // Medium sustain
            this.backgroundMusicGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + noteDuration); // Natural decay
            
            // Harmonic envelopes
            harmonicGain2.gain.setValueAtTime(0, this.audioContext.currentTime);
            harmonicGain2.gain.linearRampToValueAtTime(harmonic2Volume, this.audioContext.currentTime + 0.02);
            harmonicGain2.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + noteDuration * 0.7);
            
            harmonicGain3.gain.setValueAtTime(0, this.audioContext.currentTime);
            harmonicGain3.gain.linearRampToValueAtTime(harmonic3Volume, this.audioContext.currentTime + 0.03);
            harmonicGain3.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + noteDuration * 0.5);
            
            // Start all oscillators
            this.backgroundMusicOscillator.start();
            harmonic2.start();
            harmonic3.start();
            
            // Stop all oscillators
            this.backgroundMusicOscillator.stop(this.audioContext.currentTime + noteDuration);
            harmonic2.stop(this.audioContext.currentTime + noteDuration * 0.7);
            harmonic3.stop(this.audioContext.currentTime + noteDuration * 0.5);
            
            // Schedule next note with Für Elise's articulated timing
            this.backgroundMusicInterval = setTimeout(() => {
                this.playBackgroundNote();
            }, noteDuration * 1000); // Clear articulation for Für Elise
            
        } catch (e) {
            console.warn('Error playing background note:', e);
        }
    }
    continueAfterHighway() {
        this.canContinueAfterHighway = true;
        this.highwayDetected = false; // Allow continued movement
        document.getElementById('continueBtn').style.display = 'none';
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        
        // Remove highway visual effect
        document.querySelector('.stats').classList.remove('highway-detected');
        
        // Update highway status
        document.getElementById('highwayStatus').textContent = 'Continuing after highway';
        document.getElementById('highwayStatus').style.color = '#f39c12';
    }
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.animate();
            document.getElementById('startBtn').disabled = true;
            document.getElementById('pauseBtn').disabled = false;
            
            // Hide continue button when starting
            document.getElementById('continueBtn').style.display = 'none';
            
            // Resume audio context if needed
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        }
    }
    
    pause() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
    }
    
    reset() {
        this.pause();
        
        // Reset grid
        this.grid = Array(this.gridHeight).fill().map(() => Array(this.gridWidth).fill(false));
        
        // Reset ant
        this.antX = Math.floor(this.gridWidth / 2);
        this.antY = Math.floor(this.gridHeight / 2);
        this.direction = 0;
        this.stepCount = 0;
        
        // Reset highway detection
        this.highwayDetected = false;
        this.highwaySoundPlaying = false;
        this.canContinueAfterHighway = false;
        this.pathHistory = [];
        this.highwayStartStep = -1;
        this.highwayPattern = [];
        
        // Reset musical note index
        this.musicalNoteIndex = 0;
        this.cornfieldIndex = 0;
        
        // Stop background music
        this.stopBackgroundMusic();
        
        // Hide continue button
        document.getElementById('continueBtn').style.display = 'none';
        
        // Remove highway visual effect
        document.querySelector('.stats').classList.remove('highway-detected');
        
        this.draw();
        this.updateUI();
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
    }
    
    step() {
        // Get current cell state
        const currentCell = this.grid[this.antY][this.antX];
        
        // Play move sound (but not if we've detected highway and aren't continuing)
        if (this.soundEnabled && (!this.highwayDetected || this.canContinueAfterHighway)) {
            this.playMoveSound();
        }
        
        // Apply movement rules based on selected rule set
        const ruleSet = this.rules[this.currentRule];
        let turnDirection;
        
        if (ruleSet.length === 2) {
            // Simple binary rules (LR, RL)
            turnDirection = currentCell ? ruleSet[1] : ruleSet[0];
        } else {
            // Multi-state rules (LLRR, LRRL)
            const cellState = this.getCellState(this.antX, this.antY);
            turnDirection = ruleSet[cellState % ruleSet.length];
        }
        
        // Turn ant
        this.direction = (this.direction + turnDirection + 4) % 4;
        
        // Flip the color of current cell
        this.grid[this.antY][this.antX] = !currentCell;
        
        // Record position for highway detection (only if we haven't found one yet or are continuing)
        if (!this.highwayDetected || this.canContinueAfterHighway) {
            this.pathHistory.push({x: this.antX, y: this.antY, step: this.stepCount});
        }
        
        // Move ant forward
        switch (this.direction) {
            case 0: // North
                this.antY = (this.antY - 1 + this.gridHeight) % this.gridHeight;
                break;
            case 1: // East
                this.antX = (this.antX + 1) % this.gridWidth;
                break;
            case 2: // South
                this.antY = (this.antY + 1) % this.gridHeight;
                break;
            case 3: // West
                this.antX = (this.antX - 1 + this.gridWidth) % this.gridWidth;
                break;
        }
        
        this.stepCount++;
        
        // Check for highway formation (only if we haven't found one yet or are continuing)
        if (!this.highwayDetected || this.canContinueAfterHighway) {
            this.checkHighwayFormation();
        }
        
        this.draw();
        this.updateUI();
    }
    
    getCellState(x, y) {
        // For multi-state rules, we need to track more than just black/white
        // This is a simplified version - could be extended for true multi-state cellular automata
        const cell = this.grid[y][x];
        return cell ? 1 : 0;
    }
    
    checkHighwayFormation() {
        if (this.highwayDetected && !this.canContinueAfterHighway) return;
        
        // Look for repeating pattern in movement
        if (this.pathHistory.length < this.patternLength * 2) return;
        
        const recentPath = this.pathHistory.slice(-this.patternLength);
        const previousPath = this.pathHistory.slice(-this.patternLength * 2, -this.patternLength);
        
        // Check if the ant is following a repeating pattern
        let isRepeating = true;
        for (let i = 0; i < this.patternLength; i++) {
            const recent = recentPath[i];
            const previous = previousPath[i];
            
            // Calculate relative positions (accounting for translation)
            const dx1 = recent.x - recentPath[0].x;
            const dy1 = recent.y - recentPath[0].y;
            const dx2 = previous.x - previousPath[0].x;
            const dy2 = previous.y - previousPath[0].y;
            
            if (dx1 !== dx2 || dy1 !== dy2) {
                isRepeating = false;
                break;
            }
        }
        
        if (isRepeating && (!this.highwayDetected || this.canContinueAfterHighway)) {
            this.highwayDetected = true;
            this.canContinueAfterHighway = false;
            this.highwayStartStep = this.stepCount - this.patternLength;
            this.playHighwaySound();
            
            // Add visual effect
            document.querySelector('.stats').classList.add('highway-detected');
            
            // Show continue button instead of auto-stopping
            document.getElementById('continueBtn').style.display = 'inline-block';
            
            // Gradually slow down and then pause
            setTimeout(() => {
                if (this.isRunning) {
                    this.pause();
                }
            }, 3000); // Pause after 3 seconds
        }
    }
    animate() {
        if (!this.isRunning) return;
        
        this.step();
        
        // If highway detected and not continuing, gradually slow down
        let delay;
        if (this.highwayDetected && !this.canContinueAfterHighway) {
            // Gradually increase delay to slow down
            const timeSinceHighway = this.stepCount - this.highwayStartStep;
            const slowdownFactor = Math.min(timeSinceHighway / 20, 5); // Slow down over 20 steps
            delay = Math.max(2, 502 - (this.speed * 2.5)) * (1 + slowdownFactor);
        } else {
            // Calculate delay based on speed (1-200 maps to 500ms-2ms)
            delay = Math.max(2, 502 - (this.speed * 2.5));
        }
        
        setTimeout(() => {
            this.animationId = requestAnimationFrame(() => this.animate());
        }, delay);
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = this.colors.grid;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw cells
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.grid[y][x]) {
                    this.ctx.fillStyle = this.colors.black;
                    this.ctx.fillRect(
                        x * this.cellSize + 1,
                        y * this.cellSize + 1,
                        this.cellSize - 2,
                        this.cellSize - 2
                    );
                }
            }
        }
        
        // Draw ant
        this.drawAnt();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#bdc3c7';
        this.ctx.lineWidth = 0.5;
        
        // Vertical lines
        for (let x = 0; x <= this.gridWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.cellSize, 0);
            this.ctx.lineTo(x * this.cellSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.gridHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.cellSize);
            this.ctx.lineTo(this.canvas.width, y * this.cellSize);
            this.ctx.stroke();
        }
    }
    
    drawAnt() {
        const centerX = this.antX * this.cellSize + this.cellSize / 2;
        const centerY = this.antY * this.cellSize + this.cellSize / 2;
        const size = this.cellSize * 0.4;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate((this.direction * Math.PI) / 2);
        
        // Draw ant body
        this.ctx.fillStyle = this.colors.antBody;
        this.ctx.fillRect(-size/4, -size/2, size/2, size);
        
        // Draw ant head (pointing up in local coordinates)
        this.ctx.fillStyle = this.colors.ant;
        this.ctx.beginPath();
        this.ctx.arc(0, -size/2, size/4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw antennae
        this.ctx.strokeStyle = this.colors.ant;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-size/6, -size/2 - size/8);
        this.ctx.lineTo(-size/4, -size/2 - size/4);
        this.ctx.moveTo(size/6, -size/2 - size/8);
        this.ctx.lineTo(size/4, -size/2 - size/4);
        this.ctx.stroke();
        
        // Draw legs
        this.ctx.strokeStyle = this.colors.antBody;
        this.ctx.lineWidth = 1.5;
        for (let i = -1; i <= 1; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(-size/4, i * size/6);
            this.ctx.lineTo(-size/2, i * size/6);
            this.ctx.moveTo(size/4, i * size/6);
            this.ctx.lineTo(size/2, i * size/6);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    updateUI() {
        document.getElementById('stepCount').textContent = this.stepCount;
        document.getElementById('antX').textContent = this.antX;
        document.getElementById('antY').textContent = this.antY;
        document.getElementById('antDirection').textContent = this.directions[this.direction];
        
        // Update highway status
        const highwayStatus = document.getElementById('highwayStatus');
        if (this.highwayDetected && !this.canContinueAfterHighway) {
            highwayStatus.textContent = `Detected at step ${this.highwayStartStep} - Paused`;
            highwayStatus.style.color = '#27ae60';
        } else if (this.canContinueAfterHighway) {
            highwayStatus.textContent = 'Continuing after highway';
            highwayStatus.style.color = '#f39c12';
        } else {
            highwayStatus.textContent = 'Not Detected';
            highwayStatus.style.color = '#e74c3c';
        }
        
        // Update prediction based on current progress
        const prediction = this.highwayPredictions[this.currentRule] || 10400;
        const progress = (this.stepCount / prediction * 100).toFixed(1);
        document.getElementById('highwayPrediction').textContent = 
            `~${prediction.toLocaleString()} steps (${progress}% complete)`;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const ant = new LangtonsAnt('canvas');
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case ' ':
                e.preventDefault();
                if (ant.isRunning) {
                    ant.pause();
                } else {
                    ant.start();
                }
                break;
            case 's':
            case 'S':
                e.preventDefault();
                ant.step();
                break;
            case 'r':
            case 'R':
                e.preventDefault();
                ant.reset();
                break;
        }
    });
    
    // Add keyboard shortcuts info
    console.log('Keyboard shortcuts:');
    console.log('Space: Start/Pause');
    console.log('S: Step');
    console.log('R: Reset');
});