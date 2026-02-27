document.addEventListener('DOMContentLoaded', () => {
    const ocTab = document.getElementById('ocTab');
    const ocDrawer = document.getElementById('ocDrawer');
    const ocToggleUp = document.getElementById('ocToggleUp');
    const powerBtn = document.getElementById('power-btn');
    const muteBtn = document.getElementById('mute-btn');
    const userQuery = document.getElementById('user-query');
    const sendBtn = document.getElementById('send-btn');
    const toggleWebmBtn = document.getElementById('toggle-webm-btn');
    const dynamicContentArea = document.getElementById('dynamic-content-area');
    const radioStream = document.getElementById('radio-stream');
    const timerDisplay = document.getElementById('timer-display');
    const johnVideoOverlay = document.getElementById('john-video-overlay');

    const GATEWAY_URL = 'https://ai.carfinancecheque.uk/command';
    const GATEWAY_TOKEN = '9533263d7ff39819800754b970748ddf';

    let drawerState = 'CLOSED'; // CLOSED, OPEN, CLOSING
    let isMuted = false;
    let countdownInterval = null;
    let countdownTimeout = null;
    let radioFadeInterval = null;

    const ASSET_PINE_IMG = '../assets/img/pine.png';
    const ASSET_TESTCARD = '../assets/img/testcard.png';
    const ASSET_WELCOME_VIDEO = '../assets/videos/welcometotechsupport.mp4';
    const ASSET_BYE_VIDEO = '../assets/videos/byhaveanicelife.mp4';
    const ASSET_JOHN_VIDEO = '../assets/videos/john.webm';
    const GUAC_BASE_URL = 'https://ai.carfinancecheque.uk/guacamole/';
    const GUAC_USERNAME = 'user25148535';
    const GUAC_PASSWORD = 'quantum25148535!!';
    const GUAC_AUTOLOGIN_URL = `${GUAC_BASE_URL}#/?${new URLSearchParams({
        username: GUAC_USERNAME,
        password: GUAC_PASSWORD
    }).toString()}`;

    function getAssetUrl(path) {
        const url = new URL(path, window.location.href);
        url.searchParams.set('v', new Date().getTime());
        return url.href;
    }

    if (ocTab) ocTab.querySelector('img').src = getAssetUrl(ASSET_PINE_IMG);
    if (ocToggleUp) ocToggleUp.querySelector('img').src = getAssetUrl(ASSET_PINE_IMG);

    function clearDynamicContent() {
        if (!dynamicContentArea) return;
        while (dynamicContentArea.firstChild) {
            dynamicContentArea.removeChild(dynamicContentArea.firstChild);
        }
    }

    function loadContent(url, type = 'image', autoplay = false, controls = false, loop = false) {
        clearDynamicContent();

        const assetUrl = getAssetUrl(url);

        if (type === 'image') {
            const img = document.createElement('img');
            img.src = assetUrl;
            if (dynamicContentArea) dynamicContentArea.appendChild(img);
            return Promise.resolve(img);
        } else if (type === 'video') {
            const video = document.createElement('video');
            video.src = assetUrl;
            video.autoplay = autoplay;
            video.controls = controls;
            video.muted = !autoplay; // Mute autoplayed videos initially to allow playback without user interaction
            video.loop = loop;
            video.volume = 1.0;
            video.classList.add('fullscreen-video');
            if (dynamicContentArea) dynamicContentArea.appendChild(video);

            if (autoplay) {
                video.play().catch(e => console.error("Autoplay failed:", e));
            }

            const promise = new Promise((resolve) => {
                video.onended = resolve;
                video.onerror = () => resolve();
            });
            promise.video = video;
            return promise;

        } else if (type === 'iframe') {
            const iframe = document.createElement('iframe');
            iframe.id = 'guac-frame';
            iframe.src = url; // Don't cache-bust external URLs
            iframe.sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.style.overflow = 'hidden';
            if (dynamicContentArea) dynamicContentArea.appendChild(iframe);
            return Promise.resolve(iframe);
        }
    }

    function updateTimerDisplay(remainingTime) {
        if (!timerDisplay) return;
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

        let remainingTime = 3 * 60;
        updateTimerDisplay(remainingTime);

        countdownInterval = setInterval(() => {
            remainingTime--;
            updateTimerDisplay(remainingTime);
            if (remainingTime <= 0) {
                clearInterval(countdownInterval);
                if (drawerState === 'OPEN') {
                    setDrawerState('CLOSING');
                }
            }
        }, 1000);

        countdownTimeout = setTimeout(() => {
            if (drawerState === 'OPEN') {
                setDrawerState('CLOSING');
            }
        }, 3 * 60 * 1000);
    }

    function stopCountdown() {
        clearInterval(countdownInterval);
        clearTimeout(countdownTimeout);
        if (timerDisplay) {
            timerDisplay.textContent = '--:--';
            timerDisplay.classList.remove('active', 'warning', 'critical');
        }
    }

    function fadeRadioVolume(targetVolume, duration, onComplete) {
        if (!radioStream) { if (onComplete) onComplete(); return; }
        clearInterval(radioFadeInterval);
        const startVolume = radioStream.volume;
        const steps = duration / 50;
        if (steps <= 0) {
            radioStream.volume = targetVolume;
            if (onComplete) onComplete();
            return;
        }
        const volumeChangePerStep = (targetVolume - startVolume) / steps;
        let currentStep = 0;

        radioFadeInterval = setInterval(() => {
            currentStep++;
            radioStream.volume = Math.max(0, Math.min(1, startVolume + volumeChangePerStep * currentStep));
            if (currentStep >= steps) {
                clearInterval(radioFadeInterval);
                radioStream.volume = targetVolume;
                if (onComplete) onComplete();
            }
        }, 50);
    }

    function setDrawerState(newState) {
        if (drawerState === newState) return;
        drawerState = newState;

        if (newState === 'CLOSED') {
            if (ocDrawer) ocDrawer.classList.remove('open', 'closing');
            if (ocTab) ocTab.style.display = 'block';

            if (powerBtn) powerBtn.classList.remove('on');
            if (userQuery) { userQuery.disabled = true; userQuery.style.opacity = '0.5'; }
            if (sendBtn) { sendBtn.disabled = true; sendBtn.style.opacity = '0.5'; }
            if (muteBtn) muteBtn.style.display = 'none';
            if (toggleWebmBtn) toggleWebmBtn.style.display = 'none';
            if (johnVideoOverlay) { johnVideoOverlay.style.display = 'none'; johnVideoOverlay.pause(); }
            if (radioStream) { radioStream.pause(); radioStream.currentTime = 0; radioStream.volume = 0; }
            isMuted = false;
            updateMuteButton();
            stopCountdown();
            loadContent(ASSET_TESTCARD, 'image');
            const standby = document.getElementById('standby-screen');
            if (standby) standby.classList.remove('hidden');

        } else if (newState === 'OPEN') {
            const standby = document.getElementById('standby-screen');
            if (standby) standby.classList.add('hidden');
            if (ocDrawer) ocDrawer.classList.add('open');
            if (ocTab) ocTab.style.display = 'none';

            const onOpen = () => {
                if (johnVideoOverlay) johnVideoOverlay.style.display = 'none'; // Ensure it's hidden before welcome video
                if (powerBtn) powerBtn.classList.add('on');
                if (userQuery) { userQuery.disabled = false; userQuery.style.opacity = '1'; }
                if (sendBtn) {
                    sendBtn.disabled = false;
                    sendBtn.style.opacity = '1';
                }
                if (muteBtn) muteBtn.style.display = 'flex';
                if (toggleWebmBtn) toggleWebmBtn.style.display = 'flex';
                startCountdown();

                setTimeout(() => {
                    const welcomeVideoPromise = loadContent(ASSET_WELCOME_VIDEO, 'video', true, false);
                    welcomeVideoPromise.video.muted = false; // Unmute the welcome video
                    welcomeVideoPromise.then(() => {
                        // Remove the welcome video after it finishes
                        if (welcomeVideoPromise.video && dynamicContentArea.contains(welcomeVideoPromise.video)) {
                            dynamicContentArea.removeChild(welcomeVideoPromise.video);
                        }

                        // Load the Guacamole iframe (autologin via hash query params)
                        loadContent(GUAC_AUTOLOGIN_URL, 'iframe').then(() => {
                            // Then handle the johnVideoOverlay
                            setTimeout(() => {
                                if (radioStream && !isMuted) {
                                    radioStream.play().catch(() => {});
                                    fadeRadioVolume(0.05, 1000);
                                }
                            }, 1000);

                            // Now display the johnVideoOverlay
                            if (johnVideoOverlay) {
                                johnVideoOverlay.src = getAssetUrl(ASSET_JOHN_VIDEO);
                                johnVideoOverlay.style.display = 'block';
                                johnVideoOverlay.play().catch(() => {});
                            }
                        });
                    });
                }, 1000);
            };

            if (ocDrawer) {
                ocDrawer.addEventListener('transitionend', onOpen, { once: true });
            } else {
                onOpen();
            }

        } else if (newState === 'CLOSING') {
            if (johnVideoOverlay) { johnVideoOverlay.style.display = 'none'; johnVideoOverlay.pause(); }

            fadeRadioVolume(0, 2000, () => {
                if (radioStream) { radioStream.pause(); radioStream.currentTime = 0; }
                isMuted = false;
                updateMuteButton();

                const byeVideoPromise = loadContent(ASSET_BYE_VIDEO, 'video', true, false);
                byeVideoPromise.video.muted = false; // Unmute the bye video
                byeVideoPromise.then(() => {
                    if (ocDrawer) {
                        ocDrawer.classList.remove('open');
                        ocDrawer.addEventListener('transitionend', () => setDrawerState('CLOSED'), { once: true });
                    } else {
                        setDrawerState('CLOSED');
                    }
                });
            });

            if (powerBtn) powerBtn.classList.remove('on');
            if (userQuery) { userQuery.disabled = true; userQuery.style.opacity = '0.5'; }
            if (sendBtn) { sendBtn.disabled = true; sendBtn.style.opacity = '0.5'; }
            if (muteBtn) muteBtn.style.display = 'none';
            if (toggleWebmBtn) toggleWebmBtn.style.display = 'none';
            stopCountdown();
        }
    }

    function toggleWebmOverlay() {
        if (johnVideoOverlay) {
            if (johnVideoOverlay.style.display === 'none') {
                johnVideoOverlay.style.display = 'block';
                johnVideoOverlay.play().catch(() => {});
            } else {
                johnVideoOverlay.style.display = 'none';
                johnVideoOverlay.pause();
            }
        }
    }

    function togglePower() {
        if (drawerState === 'CLOSED') {
            setDrawerState('OPEN');
        } else if (drawerState === 'OPEN') {
            setDrawerState('CLOSING');
        }
    }

    async function sendMessage() {
        if (!userQuery) return;
        const message = userQuery.value.trim();
        if (message === '' || drawerState !== 'OPEN') return;

        const feedback = document.getElementById('feedback');
        userQuery.disabled = true;
        sendBtn.disabled = true;
        sendBtn.style.opacity = '0.5';
        if (feedback) feedback.textContent = 'Sending...';

        try {
            const res = await fetch(`${GATEWAY_URL}/support`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GATEWAY_TOKEN}`
                },
                body: JSON.stringify({ message, channel: 'web_ui' })
            });
            if (feedback) feedback.textContent = res.ok ? '✓ Sent' : `Error ${res.status}`;
            if (res.ok) {
                userQuery.value = '';
                setTimeout(() => { if (feedback) feedback.textContent = ''; }, 3000);
            }
        } catch (e) {
            if (feedback) feedback.textContent = 'No connection';
            console.warn('Gateway unreachable:', e.message);
        } finally {
            if (drawerState === 'OPEN') {
                userQuery.disabled = false;
                userQuery.style.opacity = '1';
                sendBtn.disabled = userQuery.value.trim() === '';
                sendBtn.style.opacity = sendBtn.disabled ? '0.5' : '1';
                userQuery.focus();
            }
        }
    }

    function toggleMute() {
        isMuted = !isMuted;
        if (radioStream) {
            if (isMuted) {
                fadeRadioVolume(0, 300);
            } else {
                radioStream.volume = 0;
                fadeRadioVolume(0.05, 1000);
            }
        }
        updateMuteButton();
    }

    function updateMuteButton() {
        if (!muteBtn) return;
        const volumeIcon = muteBtn.querySelector('.volume-icon');
        const muteSlash = muteBtn.querySelector('.mute-slash');
        if (isMuted) {
            if (volumeIcon) volumeIcon.style.display = 'none';
            if (muteSlash) muteSlash.style.display = 'block';
            muteBtn.classList.remove('on');
        } else {
            if (volumeIcon) volumeIcon.style.display = 'block';
            if (muteSlash) muteSlash.style.display = 'none';
            muteBtn.classList.add('on');
        }
    }

    // Event Listeners
    if (ocTab) ocTab.addEventListener('click', () => {
        if (drawerState === 'CLOSED') setDrawerState('OPEN');
    });
    if (ocToggleUp) ocToggleUp.addEventListener('click', () => {
        if (drawerState === 'OPEN') setDrawerState('CLOSING');
    });
    if (powerBtn) powerBtn.addEventListener('click', togglePower);
    if (muteBtn) muteBtn.addEventListener('click', toggleMute);
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (toggleWebmBtn) toggleWebmBtn.addEventListener('click', toggleWebmOverlay);
    if (userQuery) {
        userQuery.addEventListener('input', () => {
            if (drawerState === 'OPEN' && sendBtn) {
                sendBtn.disabled = userQuery.value.trim() === '';
                sendBtn.style.opacity = sendBtn.disabled ? '0.5' : '1';
            }
        });
        userQuery.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !sendBtn?.disabled) sendMessage();
        });
    }

    // Initial state
    setDrawerState('CLOSED');
});
