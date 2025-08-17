// KCT Menswear Sound Preview Page JavaScript

class SoundPreview {
    constructor() {
        this.currentAudio = null;
        this.currentPlayButton = null;
        this.audioStatus = document.getElementById('audioStatus');
        this.feedbackMessage = document.getElementById('feedbackMessage');
        this.saveButton = document.getElementById('saveSelection');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createAudioElements();
        this.setDefaultSelection();
    }

    setupEventListeners() {
        // Play button listeners
        const playButtons = document.querySelectorAll('.play-button');
        playButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handlePlayButtonClick(button);
            });
        });

        // Sound item click listeners (for radio selection)
        const soundItems = document.querySelectorAll('.sound-item');
        soundItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't trigger if clicking the play button
                if (e.target.closest('.play-button')) return;
                
                const radio = item.querySelector('.sound-radio');
                if (radio) {
                    radio.checked = true;
                    this.updateSelection();
                }
            });
        });

        // Radio button listeners
        const radioButtons = document.querySelectorAll('.sound-radio');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', () => {
                this.updateSelection();
            });
        });

        // Save button listener
        this.saveButton.addEventListener('click', () => {
            this.saveSelection();
        });

        // Keyboard support for sound items
        soundItems.forEach(item => {
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const radio = item.querySelector('.sound-radio');
                    if (radio) {
                        radio.checked = true;
                        this.updateSelection();
                    }
                }
            });
        });
    }

    createAudioElements() {
        // Create a single audio element for reuse
        this.audio = new Audio();
        this.audio.preload = 'metadata';
        
        // Audio event listeners
        this.audio.addEventListener('ended', () => {
            this.stopCurrentAudio();
        });

        this.audio.addEventListener('error', (e) => {
            this.handleAudioError(e);
        });

        this.audio.addEventListener('loadstart', () => {
            this.updatePlayButtonState(this.currentPlayButton, 'loading');
        });

        this.audio.addEventListener('canplaythrough', () => {
            if (this.currentPlayButton) {
                this.updatePlayButtonState(this.currentPlayButton, 'ready');
            }
        });
    }

    setDefaultSelection() {
        // Set luxury-bell as default (recommended)
        const defaultRadio = document.querySelector('input[value="luxury-bell"]');
        if (defaultRadio) {
            defaultRadio.checked = true;
        }
    }

    handlePlayButtonClick(button) {
        const soundFile = button.getAttribute('data-sound');
        const soundItem = button.closest('.sound-item');
        const soundId = soundItem.getAttribute('data-sound-id');
        const soundTitle = soundItem.querySelector('.sound-title').textContent;

        // If this sound is currently playing, pause it
        if (this.currentPlayButton === button && !this.audio.paused) {
            this.pauseCurrentAudio();
            return;
        }

        // Stop any currently playing audio
        this.stopCurrentAudio();

        // Start playing the new sound
        this.playSound(soundFile, button, soundTitle);
    }

    playSound(soundFile, button, soundTitle) {
        try {
            // Check if sound file exists (in a real implementation)
            // For demo purposes, we'll use a fallback approach
            this.audio.src = soundFile;
            this.currentPlayButton = button;
            
            // Update UI immediately
            this.updatePlayButtonState(button, 'playing');
            
            // Announce to screen readers
            this.announceToScreenReader(`Now playing: ${soundTitle}`);

            // Attempt to play
            const playPromise = this.audio.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // Audio started successfully
                    this.updatePlayButtonState(button, 'playing');
                }).catch((error) => {
                    // Audio failed to start
                    this.handleAudioError(error, soundTitle);
                });
            }
        } catch (error) {
            this.handleAudioError(error, soundTitle);
        }
    }

    pauseCurrentAudio() {
        if (this.audio && !this.audio.paused) {
            this.audio.pause();
            this.updatePlayButtonState(this.currentPlayButton, 'paused');
            this.announceToScreenReader('Audio paused');
        }
    }

    stopCurrentAudio() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }
        
        if (this.currentPlayButton) {
            this.updatePlayButtonState(this.currentPlayButton, 'stopped');
            this.currentPlayButton = null;
        }
    }

    updatePlayButtonState(button, state) {
        if (!button) return;

        const playIcon = button.querySelector('.play-icon');
        const pauseIcon = button.querySelector('.pause-icon');
        
        // Reset all states
        button.classList.remove('playing', 'loading');
        
        switch (state) {
            case 'playing':
                button.classList.add('playing');
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
                button.setAttribute('aria-label', button.getAttribute('aria-label').replace('Play', 'Pause'));
                break;
                
            case 'paused':
            case 'stopped':
            case 'ready':
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';
                button.setAttribute('aria-label', button.getAttribute('aria-label').replace('Pause', 'Play'));
                break;
                
            case 'loading':
                // Could add a loading spinner here if desired
                break;
        }
    }

    updateSelection() {
        // Clear any previous feedback
        this.showFeedback('', 'info');
    }

    saveSelection() {
        const selectedRadio = document.querySelector('input[name="notification-sound"]:checked');
        
        if (!selectedRadio) {
            this.showFeedback('Please select a notification sound.', 'error');
            return;
        }

        const selectedValue = selectedRadio.value;
        const soundTitle = selectedRadio.closest('.sound-item').querySelector('.sound-title').textContent;
        
        // Disable save button during save
        this.saveButton.disabled = true;
        this.saveButton.textContent = 'Saving...';
        
        // Simulate API call
        this.simulateSaveToAPI(selectedValue, soundTitle);
    }

    simulateSaveToAPI(selectedValue, soundTitle) {
        // In a real implementation, this would be an actual API call
        // For demo purposes, we'll simulate a successful save
        setTimeout(() => {
            try {
                // Simulate successful save
                localStorage.setItem('kct-notification-sound', selectedValue);
                
                this.showFeedback(`✓ Saved! "${soundTitle}" will be used for order notifications.`, 'success');
                
                // Re-enable button
                this.saveButton.disabled = false;
                this.saveButton.textContent = 'Save Selection';
                
                // Announce success to screen readers
                this.announceToScreenReader(`Settings saved. ${soundTitle} selected for notifications.`);
                
            } catch (error) {
                this.handleSaveError();
            }
        }, 1000); // Simulate network delay
    }

    handleSaveError() {
        this.showFeedback('Error saving selection. Please try again.', 'error');
        this.saveButton.disabled = false;
        this.saveButton.textContent = 'Save Selection';
    }

    handleAudioError(error, soundTitle = '') {
        console.warn('Audio playback error:', error);
        
        // Reset button state
        if (this.currentPlayButton) {
            this.updatePlayButtonState(this.currentPlayButton, 'stopped');
        }
        
        // For demo purposes, show a user-friendly message
        const errorMessage = soundTitle 
            ? `Unable to play "${soundTitle}". This is a demo - actual sound files need to be provided.`
            : 'Audio playback not available in demo mode.';
            
        this.showFeedback(errorMessage, 'error');
        this.announceToScreenReader(errorMessage);
        
        this.currentPlayButton = null;
    }

    showFeedback(message, type = 'info') {
        this.feedbackMessage.textContent = message;
        this.feedbackMessage.className = `feedback-message ${type}`;
        
        // Clear feedback after 5 seconds for non-error messages
        if (type !== 'error' && message) {
            setTimeout(() => {
                if (this.feedbackMessage.textContent === message) {
                    this.feedbackMessage.textContent = '';
                    this.feedbackMessage.className = 'feedback-message';
                }
            }, 5000);
        }
    }

    announceToScreenReader(message) {
        this.audioStatus.textContent = message;
        
        // Clear announcement after a brief moment
        setTimeout(() => {
            this.audioStatus.textContent = '';
        }, 1000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SoundPreview();
});

// Handle page visibility changes to pause audio
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, pause any playing audio
        const soundPreview = window.soundPreview;
        if (soundPreview && soundPreview.currentPlayButton) {
            soundPreview.pauseCurrentAudio();
        }
    }
});