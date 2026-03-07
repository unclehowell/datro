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
    const agentTitle = document.getElementById('oc-agent-title');
    const scanlinesLayer = dynamicContentArea ? dynamicContentArea.querySelector('.scanlines') : null;
    const accountBalanceDisplay = document.getElementById('account-balance');
    const balanceAmountSpans = document.querySelectorAll('.balance-amount');
    const bankingModal = document.getElementById('banking-modal');
    const bankingModalClose = document.getElementById('banking-modal-close');
    const bankingModalCloseBtn = document.getElementById('banking-modal-close-btn');
    const fadeOverlay = document.getElementById('fade-overlay');

    let balance = 700.00;
    let balanceInterval = null;
    const TARGET_BALANCE = 1846.23;
    const DURATION_SECONDS = 3 * 60 + 16; // 196 seconds

    function startBalanceClimb() {
        clearInterval(balanceInterval);
        const startTime = Date.now();
        const startVal = balance;
        const totalIncrease = TARGET_BALANCE - startVal;
        
        balanceInterval = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / DURATION_SECONDS, 1);
            balance = startVal + (totalIncrease * progress);
            
            balanceAmountSpans.forEach(span => {
                span.textContent = `£${balance.toFixed(2)}`;
            });

            if (progress >= 1) clearInterval(balanceInterval);
        }, 100);
    }


    function getLocalStorageItem(key, fallback = '') {
        try {
            const value = localStorage.getItem(key);
            return value === null ? fallback : value;
        } catch (error) {
            return fallback;
        }
    }

    // URL Authentication Support
    const urlParams = new URLSearchParams(window.location.search);
    const URL_USER = urlParams.get('user') || urlParams.get('username');
    const URL_PWD = urlParams.get('pwd') || urlParams.get('password');

    if (URL_USER) localStorage.setItem('user_num', URL_USER);
    if (URL_PWD) localStorage.setItem('user_pwd', URL_PWD);

    const IS_PUBLIC_LOGIN_DRAWER = Boolean(
        (document.getElementById('loginForm') && document.getElementById('ocDrawer')) ||
        (!/\/pages\//.test(window.location.pathname) && document.getElementById('ocDrawer'))
    );
    const PUBLIC_USER_NUM = '2514835';
    const PUBLIC_USER_PWD = 'quantum25148535!!';

    const USER_NUM_RAW = URL_USER || getLocalStorageItem('user_num', '').trim();
    const USER_PWD_RAW = URL_PWD || getLocalStorageItem('user_pwd', '').trim();
    const USER_NUM = IS_PUBLIC_LOGIN_DRAWER && !URL_USER
        ? PUBLIC_USER_NUM
        : (/^[1-5]$/.test(USER_NUM_RAW) ? USER_NUM_RAW : PUBLIC_USER_NUM);
    const USER_PWD = IS_PUBLIC_LOGIN_DRAWER && !URL_PWD
        ? PUBLIC_USER_PWD
        : (USER_PWD_RAW || PUBLIC_USER_PWD);
    const HAS_REMOTE_LOGIN = USER_PWD.trim().length > 0;

    const REMOTE_HOST_PRIMARY = 'https://ai.financecheque.uk';
    const REMOTE_HOST_FALLBACK = 'https://ai.financecheque.uk';

    const GATEWAY_BASE = REMOTE_HOST_PRIMARY;
    const GATEWAY_URL = `${GATEWAY_BASE}/command${USER_NUM}`;
    const LEGACY_GATEWAY_URL = `${GATEWAY_BASE}/command`;
    const GATEWAY_TOKEN = 'c4132ddefcf0597f493287f6f964db366e8286b7d3b291ff3ca94737e9822d57';

    function resolveProjectRootUrl() {
        const scriptEl = document.getElementById('app-script')
            || Array.from(document.scripts).find((s) => /\/js\/app\.js(\?|$)/.test(s.src || ''));
        if (scriptEl && scriptEl.src) {
            try {
                return new URL('../../', new URL(scriptEl.src, window.location.href));
            } catch (error) {}
        }
        if (/\/pages\//.test(window.location.pathname)) {
            return new URL('../', window.location.href);
        }
        return new URL('./', window.location.href);
    }

    const PROJECT_ROOT_URL = resolveProjectRootUrl();

    let drawerState = 'CLOSED'; // CLOSED, OPEN, CLOSING
    let isMuted = false;
    let countdownInterval = null;
    let countdownTimeout = null;
    let radioFadeInterval = null;
    let transitionToken = 0;

    const ASSET_OAK_IMG = 'assets/img/oaks.png';
    const ASSET_TESTCARD = 'assets/img/testcard.png';
    const ASSET_WELCOME_VIDEO = 'assets/videos/welcometotechsupport.mp4';
    const ASSET_BYE_VIDEO = 'assets/videos/byehaveanicelife.mp4';
    const ASSET_JOHN_VIDEO = 'assets/videos/john.webm';
    const VIDEO_FAILSAFE_MS = 30000;
    const TESTCARD_HOLD_MS = 250;
    const GUAC_BASE_URL = `${REMOTE_HOST_PRIMARY}/guacamole/`;
    const GUAC_BASE_URL_FALLBACK = `${REMOTE_HOST_FALLBACK}/guacamole/`;
    const GUAC_USERNAME = `user25148535`;
    const GUAC_PASSWORD = `quantum25148535!!`;
    const GUAC_AUTOLOGIN_URL = `${GUAC_BASE_URL}#/?${new URLSearchParams({
        username: GUAC_USERNAME,
        password: GUAC_PASSWORD
    }).toString()}`;
    const GUAC_AUTOLOGIN_URL_FALLBACK = `${GUAC_BASE_URL_FALLBACK}#/?${new URLSearchParams({
        username: GUAC_USERNAME,
        password: GUAC_PASSWORD
    }).toString()}`;
    const RADIO_MAX_VOLUME = 0.05;
    const ASSET_VERSION = (document.querySelector('meta[name="fc-asset-version"]')?.getAttribute('content') || '').trim();
    let guacToken = null;

    window.setGuacToken = (token) => { guacToken = token || null; };

    function setAgentTitleVisible(visible) {
        if (!agentTitle) return;
        agentTitle.style.visibility = visible ? 'visible' : 'hidden';
        agentTitle.style.opacity = visible ? '1' : '0';
    }

    function clampRadioVolume(value) {
        return Math.max(0, Math.min(RADIO_MAX_VOLUME, Number(value) || 0));
    }

    function getAssetUrl(path) {
        const url = new URL(path, PROJECT_ROOT_URL);
        if (ASSET_VERSION && url.origin === window.location.origin) {
            url.searchParams.set('v', ASSET_VERSION);
        }
        return url.href;
    }

    if (ocTab) ocTab.querySelector('img').src = getAssetUrl(ASSET_OAK_IMG);
    if (ocToggleUp) ocToggleUp.querySelector('img').src = getAssetUrl(ASSET_OAK_IMG);
    if (radioStream) {
        radioStream.volume = 0;
        radioStream.addEventListener('volumechange', () => {
            const capped = clampRadioVolume(radioStream.volume);
            if (radioStream.volume !== capped) {
                radioStream.volume = capped;
            }
        });
    }
    setAgentTitleVisible(false);

    async function releaseGuacConnection() {
        const iframe = document.getElementById('guac-frame');
        if (iframe) {
            try { iframe.src = 'about:blank'; } catch (error) {}
        }
        if (guacToken) {
            try {
                await fetch(`${GUAC_BASE_URL}api/session/tunnels`, {
                    method: 'DELETE',
                    headers: { 'Guacamole-Token': guacToken }
                });
            } catch (error) {}
            guacToken = null;
        }
    }

    function clearDynamicContent() {
        if (!dynamicContentArea) return;
        Array.from(dynamicContentArea.children).forEach((child) => {
            if (scanlinesLayer && child === scanlinesLayer) return;
            if (fadeOverlay && child === fadeOverlay) return;
            if (child && child.tagName === 'IFRAME' && child.id === 'guac-frame') {
                try { child.src = 'about:blank'; } catch (error) {}
            }
            dynamicContentArea.removeChild(child);
        });
    }

    function appendDynamicNode(node) {
        if (!dynamicContentArea) return;
        if (fadeOverlay && dynamicContentArea.contains(fadeOverlay)) {
            dynamicContentArea.insertBefore(node, fadeOverlay);
            return;
        }
        if (scanlinesLayer && dynamicContentArea.contains(scanlinesLayer)) {
            dynamicContentArea.insertBefore(node, scanlinesLayer);
            return;
        }
        dynamicContentArea.appendChild(node);
    }

    function loadContent(url, type = 'image', autoplay = false, controls = false, loop = false) {
        clearDynamicContent();
        const assetUrl = getAssetUrl(url);
        if (type === 'image') {
            const img = document.createElement('img');
            img.src = assetUrl;
            img.classList.add('fullscreen-video');
            appendDynamicNode(img);
            return Promise.resolve({element: img});
        } else if (type === 'video') {
            const video = document.createElement('video');
            video.src = assetUrl;
            video.autoplay = autoplay;
            video.controls = controls;
            video.muted = false;
            video.playsInline = true;
            video.loop = loop;
            video.volume = 1.0;
            video.classList.add('fullscreen-video');
            appendDynamicNode(video);
            if (autoplay) video.play().catch(() => {});
            const endPromise = new Promise((resolve) => {
                video.onended = resolve;
                video.onerror = () => resolve();
            });
            return Promise.resolve({element: video, endPromise});
        } else if (type === 'iframe') {
            const iframe = document.createElement('iframe');
            iframe.id = 'guac-frame';
            iframe.title = 'Remote Console Connection';
            iframe.src = url;
            iframe.sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock';
            iframe.allow = 'clipboard-read; clipboard-write; microphone; camera; display-capture';
            iframe.loading = 'eager';
            iframe.referrerPolicy = 'no-referrer-when-downgrade';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.style.overflow = 'hidden';
            iframe.style.backgroundColor = 'transparent';
            iframe.style.opacity = '0';
            iframe.style.transition = 'opacity 0.5s ease-in-out';
            iframe.onload = () => { iframe.style.opacity = '1'; };
            appendDynamicNode(iframe);
            return Promise.resolve({element: iframe});
        }
    }

    function waitForVideoEndOrTimeout(videoPromise, timeoutMs = VIDEO_FAILSAFE_MS) {
        return Promise.race([
            videoPromise,
            new Promise((resolve) => setTimeout(resolve, timeoutMs))
        ]);
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
        let remainingTime = DURATION_SECONDS;
        updateTimerDisplay(remainingTime);
        countdownInterval = setInterval(() => {
            remainingTime--;
            updateTimerDisplay(remainingTime);
            if (remainingTime <= 0) {
                clearInterval(countdownInterval);
                if (drawerState === 'OPEN') setDrawerState('CLOSING');
            }
        }, 1000);
        countdownTimeout = setTimeout(() => {
            if (drawerState === 'OPEN') setDrawerState('CLOSING');
        }, DURATION_SECONDS * 1000);
    }

    function stopCountdown() {
        clearInterval(countdownInterval);
        clearTimeout(countdownTimeout);
        if (timerDisplay) {
            timerDisplay.textContent = '--:--';
            timerDisplay.classList.remove('active', 'warning', 'critical');
        }
    }

    function resetCountdownOnActivity() {
        if (drawerState !== 'OPEN') return;
        startCountdown();
    }

    function fadeRadioVolume(targetVolume, duration, onComplete) {
        if (!radioStream) { if (onComplete) onComplete(); return; }
        targetVolume = clampRadioVolume(targetVolume);
        clearInterval(radioFadeInterval);
        const startVolume = clampRadioVolume(radioStream.volume);
        radioStream.volume = startVolume;
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
            radioStream.volume = clampRadioVolume(startVolume + volumeChangePerStep * currentStep);
            if (currentStep >= steps) {
                clearInterval(radioFadeInterval);
                radioStream.volume = targetVolume;
                if (onComplete) onComplete();
            }
        }, 50);
    }

    function hideJohnOverlay() {
        if (!johnVideoOverlay) return;
        setAgentTitleVisible(false);
        johnVideoOverlay.style.opacity = 0;
        setTimeout(() => {
            if (johnVideoOverlay.style.opacity === "0") {
                johnVideoOverlay.style.display = 'none';
                johnVideoOverlay.pause();
            }
        }, 1500);
    }

    function fadeToColor(duration, colors = ['#ffffff', '#ffff00']) {
        if (!fadeOverlay) return Promise.resolve();
        fadeOverlay.style.transition = 'none';
        fadeOverlay.style.opacity = 0;
        fadeOverlay.style.background = `linear-gradient(135deg, ${colors.join(', ')})`;
        return new Promise(resolve => {
            setTimeout(() => {
                fadeOverlay.style.transition = `opacity ${duration/1000}s ease`;
                fadeOverlay.style.opacity = 1;
                setTimeout(resolve, duration);
            }, 50);
        });
    }

    function startMusic() {
        if (radioStream && !isMuted) {
            if (!radioStream.src || radioStream.src === window.location.href) {
                radioStream.src = 'https://stream.rcs.revma.com/fxp289cp81uvv';
                radioStream.load();
            }
            radioStream.volume = 0;
            radioStream.play().catch(() => {});
            fadeRadioVolume(RADIO_MAX_VOLUME, 1000);
        }
    }

    function showJohnOverlay(playMusic = true) {
        if (playMusic) startMusic();
        if (!johnVideoOverlay) return;
        johnVideoOverlay.src = getAssetUrl(ASSET_JOHN_VIDEO);
        johnVideoOverlay.style.pointerEvents = 'none';
        johnVideoOverlay.style.display = 'block';
        setAgentTitleVisible(true);
        johnVideoOverlay.play().catch(() => {});
        setTimeout(() => {
            johnVideoOverlay.style.opacity = 1;
            // Set input placeholder text
            if (userQuery) userQuery.placeholder = "How can I answer your prayers today?";
            setTimeout(() => {
                if (accountBalanceDisplay && drawerState === 'OPEN') {
                    accountBalanceDisplay.style.display = 'flex';
                    // Trigger 10s fade in via CSS transition
                    setTimeout(() => {
                        accountBalanceDisplay.style.opacity = 1;
                        startBalanceClimb();
                    }, 50);
                }
            }, 1000);
        }, 50); 
    }

    function setDrawerState(newState) {
        if (drawerState === newState) return;
        drawerState = newState;
        transitionToken += 1;
        const currentToken = transitionToken;

        if (newState === 'CLOSED') {
            if (ocDrawer) ocDrawer.classList.remove('open', 'closing');
            if (ocDrawer) ocDrawer.style.pointerEvents = 'none';
            if (ocTab) ocTab.style.display = 'block';
            if (powerBtn) powerBtn.classList.remove('on');
            if (userQuery) { 
                userQuery.disabled = true; 
                userQuery.style.opacity = '0.5'; 
                userQuery.placeholder = ""; // Remove text
            }
            if (sendBtn) { sendBtn.disabled = true; sendBtn.style.opacity = '0.5'; }
            if (muteBtn) muteBtn.style.display = 'none';
            if (toggleWebmBtn) toggleWebmBtn.style.display = 'none';
            if (accountBalanceDisplay) {
                accountBalanceDisplay.style.display = 'none';
                accountBalanceDisplay.style.opacity = 0;
            }
            hideJohnOverlay();
            releaseGuacConnection();
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
            if (ocDrawer) ocDrawer.classList.remove('closing');
            if (ocDrawer) ocDrawer.style.pointerEvents = 'auto';
            if (ocTab) ocTab.style.display = 'none';

            const onOpen = () => {
                if (drawerState !== 'OPEN' || currentToken !== transitionToken) return;
                hideJohnOverlay();
                if (powerBtn) powerBtn.classList.add('on');
                if (userQuery) {
                    userQuery.disabled = !HAS_REMOTE_LOGIN;
                    userQuery.style.opacity = HAS_REMOTE_LOGIN ? '1' : '0.5';
                    userQuery.placeholder = ""; // Hidden initially
                }
                if (sendBtn) {
                    sendBtn.disabled = !HAS_REMOTE_LOGIN;
                    sendBtn.style.opacity = HAS_REMOTE_LOGIN ? '1' : '0.5';
                }
                if (muteBtn) muteBtn.style.display = HAS_REMOTE_LOGIN ? 'flex' : 'none';
                if (toggleWebmBtn) toggleWebmBtn.style.display = HAS_REMOTE_LOGIN ? 'flex' : 'none';
                startCountdown();

                if (!HAS_REMOTE_LOGIN) {
                    loadContent(ASSET_TESTCARD, 'image');
                    const feedback = document.getElementById('feedback');
                    if (feedback) feedback.textContent = 'Login to activate remote session';
                    return;
                }

                loadContent(ASSET_WELCOME_VIDEO, 'video', true, false).then(({element: video, endPromise}) => {
                    const checkDuration = () => {
                        const durationMs = video.duration * 1000 || 8000;
                        setTimeout(() => {
                            if (drawerState === 'OPEN' && currentToken === transitionToken) {
                                showJohnOverlay(true); 
                            }
                        }, Math.max(0, durationMs - 2000));
                        setTimeout(() => {
                            if (drawerState === 'OPEN' && currentToken === transitionToken) {
                                fadeToColor(800).then(() => {
                                    if (fadeOverlay) fadeOverlay.style.opacity = 0;
                                });
                            }
                        }, Math.max(0, durationMs - 800));
                        setTimeout(() => {
                            loadContent(GUAC_AUTOLOGIN_URL, 'iframe').then(() => {});
                        }, Math.max(0, durationMs - 500));
                    };
                    if (video.readyState >= 1) checkDuration();
                    else video.addEventListener('loadedmetadata', checkDuration, { once: true });
                });
            };

            if (ocDrawer) {
                const onDrawerOpenTransition = (event) => {
                    if (event.target !== ocDrawer || event.propertyName !== 'transform') return;
                    ocDrawer.removeEventListener('transitionend', onDrawerOpenTransition);
                    onOpen();
                };
                ocDrawer.addEventListener('transitionend', onDrawerOpenTransition);
            } else {
                onOpen();
            }

        } else if (newState === 'CLOSING') {
            if (ocDrawer) ocDrawer.style.pointerEvents = 'auto';
            hideJohnOverlay();
            releaseGuacConnection();
            fadeRadioVolume(0, 2000, () => {
                if (currentToken !== transitionToken) return;
                if (radioStream) { radioStream.pause(); radioStream.currentTime = 0; }
                isMuted = false;
                updateMuteButton();
            });
            const performRetraction = async () => {
                await fadeToColor(1000, ['#000', '#000']);
                loadContent(ASSET_TESTCARD, 'image');
                if (fadeOverlay) fadeOverlay.style.opacity = 0;
                const { endPromise } = await loadContent(ASSET_BYE_VIDEO, 'video', true, false);
                await endPromise;
                await fadeToColor(500, ['#000', '#000']);
                loadContent(ASSET_TESTCARD, 'image');
                if (fadeOverlay) fadeOverlay.style.opacity = 0;
                if (drawerState === 'CLOSING' && currentToken === transitionToken) {
                    ocDrawer.classList.remove('open');
                    const onDrawerCloseTransition = (event) => {
                        if (event.target !== ocDrawer || event.propertyName !== 'transform') return;
                        ocDrawer.removeEventListener('transitionend', onDrawerCloseTransition);
                        setDrawerState('CLOSED');
                    };
                    ocDrawer.addEventListener('transitionend', onDrawerCloseTransition);
                }
            };
            performRetraction();
            if (powerBtn) powerBtn.classList.remove('on');
            if (userQuery) { 
                userQuery.disabled = true; 
                userQuery.style.opacity = '0.5'; 
                userQuery.placeholder = ""; // Remove text
            }
            if (sendBtn) { sendBtn.disabled = true; sendBtn.style.opacity = '0.5'; }
            if (muteBtn) muteBtn.style.display = 'none';
            if (toggleWebmBtn) toggleWebmBtn.style.display = 'none';
            if (accountBalanceDisplay) {
                accountBalanceDisplay.style.display = 'none';
                accountBalanceDisplay.style.opacity = 0;
            }
            stopCountdown();
        }
    }

    function toggleWebmOverlay() {
        if (johnVideoOverlay) {
            if (johnVideoOverlay.style.display === 'none' || johnVideoOverlay.style.opacity === "0") {
                johnVideoOverlay.style.display = 'block';
                setAgentTitleVisible(true);
                johnVideoOverlay.play().catch(() => {});
                setTimeout(() => { johnVideoOverlay.style.opacity = 1; }, 50);
            } else {
                johnVideoOverlay.style.opacity = 0;
                setAgentTitleVisible(false);
                setTimeout(() => { 
                    if (johnVideoOverlay.style.opacity === "0") {
                        johnVideoOverlay.style.display = 'none';
                        johnVideoOverlay.pause();
                    }
                }, 1500);
            }
        }
    }

    function togglePower() {
        if (drawerState === 'CLOSED') setDrawerState('OPEN');
        else if (drawerState === 'OPEN') setDrawerState('CLOSING');
    }

    async function sendMessage() {
        if (!userQuery || !HAS_REMOTE_LOGIN) return;
        const message = userQuery.value.trim();
        if (message === '' || drawerState !== 'OPEN') return;
        const feedback = document.getElementById('feedback');
        userQuery.disabled = true;
        sendBtn.disabled = true;
        sendBtn.style.opacity = '0.5';
        if (feedback) feedback.textContent = 'Sending...';
        try {
            const payload = { message, channel: 'web_ui', user_num: USER_NUM };
            const candidateUrls = [`${REMOTE_HOST_PRIMARY}/command${USER_NUM}/support`];
            let sent = false;
            for (const url of candidateUrls) {
                try {
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GATEWAY_TOKEN}` },
                        body: JSON.stringify(payload)
                    });
                    if (res.ok) { sent = true; break; }
                } catch (error) {}
            }
            if (sent) {
                if (feedback) feedback.textContent = '✓ Sent';
                userQuery.value = '';
                setTimeout(() => { if (feedback) feedback.textContent = ''; }, 3000);
            }
        } catch (e) {} finally {
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
            if (isMuted) fadeRadioVolume(0, 300);
            else { radioStream.volume = 0; fadeRadioVolume(RADIO_MAX_VOLUME, 1000); }
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

    if (ocTab) ocTab.addEventListener('click', () => { if (drawerState === 'CLOSED') setDrawerState('OPEN'); });
    if (ocToggleUp) ocToggleUp.addEventListener('click', () => { if (drawerState === 'OPEN') setDrawerState('CLOSING'); });
    if (powerBtn) powerBtn.addEventListener('click', togglePower);
    if (muteBtn) muteBtn.addEventListener('click', toggleMute);
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (toggleWebmBtn) toggleWebmBtn.addEventListener('click', toggleWebmOverlay);
    if (ocDrawer) {
        ['pointerdown', 'touchstart', 'keydown'].forEach((eventName) => {
            ocDrawer.addEventListener(eventName, resetCountdownOnActivity, true);
        });
    }
    if (userQuery) {
        userQuery.addEventListener('input', () => {
            resetCountdownOnActivity();
            if (drawerState === 'OPEN' && sendBtn) {
                sendBtn.disabled = userQuery.value.trim() === '';
                sendBtn.style.opacity = sendBtn.disabled ? '0.5' : '1';
            }
        });
        userQuery.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !sendBtn?.disabled) sendMessage();
        });
    }
    if (accountBalanceDisplay) {
        accountBalanceDisplay.addEventListener('click', () => { if (bankingModal) bankingModal.style.display = 'flex'; });
    }
    function closeModal() { if (bankingModal) bankingModal.style.display = 'none'; }
    if (bankingModalClose) bankingModalClose.addEventListener('click', closeModal);
    if (bankingModalCloseBtn) bankingModalCloseBtn.addEventListener('click', closeModal);
    setDrawerState('CLOSED');
});
