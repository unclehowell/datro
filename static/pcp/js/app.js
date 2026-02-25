document.addEventListener('DOMContentLoaded', () => {
    const ocTab = document.getElementById('ocTab');
    const ocDrawer = document.getElementById('ocDrawer');
    const ocToggleUp = document.getElementById('ocToggleUp');
    const powerBtn = document.getElementById('power-btn');
    const muteBtn = document.getElementById('mute-btn');
    const userQuery = document.getElementById('user-query');
    const sendBtn = document.getElementById('send-btn');
    const dynamicContentArea = document.getElementById('dynamic-content-area');
    const radioStream = document.getElementById('radio-stream');
    const timerDisplay = document.getElementById('timer-display');
    const johnVideoOverlay = document.getElementById('john-video-overlay'); // New element

    let drawerState = 'CLOSED'; // CLOSED, OPEN, CLOSING
    let isMuted = false;
    let countdownInterval = null;
    let countdownTimeout = null;
    let radioFadeInterval = null;

    const ASSET_PINE_IMG = '../assets/img/pine.png';
    const ASSET_TESTCARD = '../assets/img/testcard.png';
    const ASSET_WELCOME_VIDEO = '../assets/videos/welcometotechsupport.mp4';
    const ASSET_BYE_VIDEO = '../assets/videos/byhaveanicelife.mp4';
    const ASSET_JOHN_VIDEO = '../assets/videos/john.webm'; // New asset
    const GUAC_URL = 'https://ai.carfinancecheque.uk/';

    // Initial setup for ocTab (pine.png)
    ocTab.innerHTML = `<img src="${ASSET_PINE_IMG}" alt="Open Drawer">`;
    ocToggleUp.innerHTML = `<img src="${ASSET_PINE_IMG}" alt="Close Drawer">`;

    function clearDynamicContent() {
        while (dynamicContentArea.firstChild) {
            dynamicContentArea.removeChild(dynamicContentArea.firstChild);
        }
    }

    function loadContent(url, type = 'image', autoplay = false, controls = false, loop = false) {
        clearDynamicContent();
        johnVideoOverlay.style.display = 'none'; // Hide overlay when new content loads

        if (type === 'image') {
            const img = document.createElement('img');
            img.src = url;
            dynamicContentArea.appendChild(img);
            return Promise.resolve(img);
        } else if (type === 'video') {
            const video = document.createElement('video');
            video.src = url;
            video.autoplay = autoplay;
            video.controls = controls;
            video.muted = false; // Video audio should play
            video.volume = 1.0;
            video.classList.add('fullscreen-video');
            dynamicContentArea.appendChild(video);
            
            const promise = new Promise((resolve) => {
                video.onended = resolve;
                video.onerror = () => resolve(); // Resolve even on error to continue flow
            });
            promise.video = video;
            return promise;

        } else if (type === 'iframe') {
            const iframe = document.createElement('iframe');
            iframe.id = 'guac-frame';
            iframe.src = url;
            iframe.sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.style.overflow = 'hidden';
            dynamicContentArea.appendChild(iframe);
            return Promise.resolve(iframe);
        }
    }

    function updateTimerDisplay(remainingTime) {
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        if (remainingTime <= 60) {
            timerDisplay.classList.add('critical');
            timerDisplay.classList.remove('warning', 'active');
        } else if (remainingTime <= 120) {
            timerDisplay.classList.add('warning');
            timerDisplay.classList.remove('critical', 'active');
        } else {
            timerDisplay.classList.add('active');
            timerDisplay.classList.remove('warning', 'critical');
        }
    }

    function startCountdown() {
        clearInterval(countdownInterval);
        clearTimeout(countdownTimeout);

        let remainingTime = 3 * 60; // 3 minutes
        updateTimerDisplay(remainingTime);

        countdownInterval = setInterval(() => {
            remainingTime--;
            updateTimerDisplay(remainingTime);
            if (remainingTime <= 0) {
                clearInterval(countdownInterval);
                if (drawerState === 'OPEN') {
                    setDrawerState('CLOSING'); // Auto power off
                }
            }
        }, 1000);

        // This timeout is for the initial 3-minute duration, after which it triggers CLOSING
        countdownTimeout = setTimeout(() => {
            if (drawerState === 'OPEN') {
                setDrawerState('CLOSING');
            }
        }, 3 * 60 * 1000);
    }
    
    function stopCountdown() {
        clearInterval(countdownInterval);
        clearTimeout(countdownTimeout);
        timerDisplay.textContent = '--:--';
        timerDisplay.classList.remove('active', 'warning', 'critical');
    }

    function fadeRadioVolume(targetVolume, duration, onComplete) {
        clearInterval(radioFadeInterval);
        const startVolume = radioStream.volume;
        const steps = duration / 100; // 100ms per step
        const volumeChangePerStep = (targetVolume - startVolume) / steps;
        let currentStep = 0;

        radioFadeInterval = setInterval(() => {
            currentStep++;
            radioStream.volume = startVolume + volumeChangePerStep * currentStep;
            if (currentStep >= steps) {
                clearInterval(radioFadeInterval);
                radioStream.volume = targetVolume; // Ensure final volume is exact
                if (onComplete) onComplete();
            }
        }, 100);
    }

    function setDrawerState(newState) {
        drawerState = newState;

        if (newState === 'CLOSED') {
            ocDrawer.classList.remove('open', 'closing');
            ocTab.style.top = '0'; // Move pine.png to top
            ocTab.style.transform = 'translateX(-50%)';
            ocTab.style.display = 'block'; // Ensure ocTab is visible
            ocToggleUp.style.display = 'none'; // Hide ocToggleUp when closed

            powerBtn.classList.remove('on');
            userQuery.disabled = true;
            sendBtn.disabled = true;
            userQuery.style.opacity = '0.5';
            sendBtn.style.opacity = '0.5';
            muteBtn.style.display = 'none';
            johnVideoOverlay.style.display = 'none'; // Hide john.webm
            johnVideoOverlay.pause();
            radioStream.pause();
            radioStream.currentTime = 0;
            radioStream.volume = 0;
            isMuted = false;
            updateMuteButton();
            stopCountdown();
            loadContent(ASSET_TESTCARD, 'image'); // Initial image
            document.getElementById('standby-screen').classList.remove('hidden'); // Show standby screen
        } else if (newState === 'OPEN') {
            document.getElementById('standby-screen').classList.add('hidden'); // Hide standby screen
            ocDrawer.classList.add('open');
            ocDrawer.classList.remove('closing');
            ocTab.style.display = 'none'; // Hide ocTab when drawer is open
            ocToggleUp.style.display = 'block'; // Show ocToggleUp when drawer is open

            // Wait for drawer to fully open before proceeding
            ocDrawer.addEventListener('transitionend', function handler() {
                ocDrawer.removeEventListener('transitionend', handler);
                
                // Move ocToggleUp (pine.png) to the bottom of the drawer
                ocToggleUp.style.position = 'absolute';
                ocToggleUp.style.bottom = '0';
                ocToggleUp.style.left = '50%';
                ocToggleUp.style.transform = 'translateX(-50%)';
                ocToggleUp.style.zIndex = '12000'; // Ensure it's above other content

                powerBtn.classList.add('on');
                userQuery.disabled = false;
                sendBtn.disabled = userQuery.value.trim() === '';
                userQuery.style.opacity = '1';
                sendBtn.style.opacity = userQuery.value.trim() === '' ? '0.5' : '1';
                muteBtn.style.display = 'flex'; // Show mute button
                startCountdown();

                // 1 second delay before playing welcome video
                setTimeout(() => {
                    loadContent(ASSET_WELCOME_VIDEO, 'video', true, false).then(videoPromise => {
                        const welcomeVideo = videoPromise.video;
                        welcomeVideo.onended = () => {
                            // 1 second before video ends, fade in radio
                            setTimeout(() => {
                                radioStream.play();
                                fadeRadioVolume(0.05, 1000); // Fade in to 5% over 1 second
                            }, 1000); // 1 second before video ends

                            loadContent(GUAC_URL, 'iframe').then(() => {
                                // Overlay john.webm
                                johnVideoOverlay.style.display = 'block';
                                johnVideoOverlay.play();
                                // Adjust johnVideoOverlay height to be 50% of dynamicContentArea
                                johnVideoOverlay.style.height = (dynamicContentArea.offsetHeight / 2) + 'px';
                                johnVideoOverlay.style.objectFit = 'cover'; // Ensure it covers the area
                            });
                        };
                    });
                }, 1000); // 1 second delay
            }, { once: true }); // Ensure the event listener is removed after it fires once
        } else if (newState === 'CLOSING') {
            // Hide john.webm immediately
            johnVideoOverlay.style.display = 'none';
            johnVideoOverlay.pause();

            // Fade out radio over 2 seconds
            fadeRadioVolume(0, 2000, () => {
                radioStream.pause();
                radioStream.currentTime = 0;
                isMuted = false;
                updateMuteButton();

                // Play bye video, then close drawer
                loadContent(ASSET_BYE_VIDEO, 'video', true, false).then(videoPromise => {
                    const byeVideo = videoPromise.video;
                    byeVideo.onended = () => {
                        ocDrawer.classList.add('closing');
                        ocDrawer.classList.remove('open');
                        // Reset ocToggleUp position
                        ocToggleUp.style.position = '';
                        ocToggleUp.style.bottom = '';
                        ocToggleUp.style.left = '';
                        ocToggleUp.style.transform = '';
                        ocToggleUp.style.zIndex = '';
                        
                        ocDrawer.addEventListener('transitionend', function handler() {
                            ocDrawer.removeEventListener('transitionend', handler);
                            setDrawerState('CLOSED');
                        }, { once: true });
                    };
                });
            });

            powerBtn.classList.remove('on');
            userQuery.disabled = true;
            sendBtn.disabled = true;
            userQuery.style.opacity = '0.5';
            sendBtn.style.opacity = '0.5';
            muteBtn.style.display = 'none';
            stopCountdown();
        }
    }

    function togglePower() {
        if (drawerState === 'CLOSED') {
            setDrawerState('OPEN');
        } else if (drawerState === 'OPEN') {
            setDrawerState('CLOSING');
        }
    }

    function sendMessage() {
        const message = userQuery.value.trim();
        if (message === '') return;

        console.log('Sending message:', message);
        // The iframe content, video overlay, and audio stream should not reload or change.
        // This is handled by ensuring loadContent is not called here for these elements.
        userQuery.value = ''; // Clear input after sending
        sendBtn.disabled = true;
        sendBtn.style.opacity = '0.5';
    }

    function toggleMute() {
        isMuted = !isMuted;
        if (isMuted) {
            radioStream.volume = 0;
            johnVideoOverlay.muted = true; // Mute john.webm as well
        } else {
            fadeRadioVolume(0.05, 100); // Fade in quickly if unmuting
            johnVideoOverlay.muted = false; // Unmute john.webm
        }
        updateMuteButton();
    }

    function updateMuteButton() {
        const volumeIcon = muteBtn.querySelector('.volume-icon');
        const muteSlash = muteBtn.querySelector('.mute-slash');
        if (isMuted) {
            volumeIcon.style.display = 'none';
            muteSlash.style.display = 'block';
            muteBtn.classList.remove('on');
        } else {
            volumeIcon.style.display = 'block';
            muteSlash.style.display = 'none';
            muteBtn.classList.add('on');
        }
    }

    // Event Listeners
    ocTab.addEventListener('click', () => {
        if (drawerState === 'CLOSED') setDrawerState('OPEN');
    });
    ocToggleUp.addEventListener('click', () => {
        if (drawerState === 'OPEN') setDrawerState('CLOSING');
    });
    powerBtn.addEventListener('click', togglePower);
    muteBtn.addEventListener('click', toggleMute);
    sendBtn.addEventListener('click', sendMessage);

    userQuery.addEventListener('input', () => {
        if (drawerState === 'OPEN') {
            sendBtn.disabled = userQuery.value.trim() === '';
            sendBtn.style.opacity = sendBtn.disabled ? '0.5' : '1';
        }
    });

    // Initial state
    setDrawerState('CLOSED');
});

