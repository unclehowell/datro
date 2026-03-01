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

    let balance = 271.26;
    let balanceInterval = null;

    function animateBalance(start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const currentBalance = progress * (end - start) + start;
            balance = currentBalance;
            balanceAmountSpans.forEach(span => {
                span.textContent = `£${currentBalance.toFixed(2)}`;
            });
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    function startBalanceIncrements() {
        clearInterval(balanceInterval);
        balanceInterval = setInterval(() => {
            balance += 5.00;
            balanceAmountSpans.forEach(span => {
                span.textContent = `£${balance.toFixed(2)}`;
            });
        }, 10000);
    }


    function getLocalStorageItem(key, fallback = '') {
        try {
            const value = localStorage.getItem(key);
            return value === null ? fallback : value;
        } catch (error) {
            return fallback;
        }
    }

    const IS_PUBLIC_LOGIN_DRAWER = Boolean(document.getElementById('loginForm') && document.getElementById('ocDrawer'));
    const PUBLIC_USER_NUM = '5';
    const PUBLIC_USER_PWD = 'quantum25148535!!';

    const USER_NUM_RAW = getLocalStorageItem('user_num', '').trim();
    const USER_PWD_RAW = getLocalStorageItem('user_pwd', '').trim();
    const USER_NUM = IS_PUBLIC_LOGIN_DRAWER
        ? PUBLIC_USER_NUM
        : (/^[1-5]$/.test(USER_NUM_RAW) ? USER_NUM_RAW : PUBLIC_USER_NUM);
    const USER_PWD = IS_PUBLIC_LOGIN_DRAWER
        ? PUBLIC_USER_PWD
        : (USER_PWD_RAW || PUBLIC_USER_PWD);
    const HAS_REMOTE_LOGIN = USER_PWD.trim().length > 0;

    const REMOTE_HOST_PRIMARY = 'https://ai.carfinancecheque.uk';
    const REMOTE_HOST_FALLBACK = 'https://ai.carfinancecheque.uk';

    const GATEWAY_BASE = REMOTE_HOST_PRIMARY;
    const GATEWAY_URL = `${GATEWAY_BASE}/command${USER_NUM}`;
    const LEGACY_GATEWAY_URL = `${GATEWAY_BASE}/command`;
    const GATEWAY_TOKEN = '9533263d7ff39819800754b970748ddf';

    function resolveProjectRootUrl() {
        const scriptEl = document.getElementById('app-script')
            || Array.from(document.scripts).find((s) => /\/js\/app\.js(\?|$)/.test(s.src || ''));
        if (scriptEl && scriptEl.src) {
            try {
                return new URL('../../', new URL(scriptEl.src, window.location.href));
            } catch (error) {}
        }
        // Fallback that still works when CDN script rewriting hides app.js src.
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

    const ASSET_PINE_IMG = 'assets/img/pine.png';
    const ASSET_TESTCARD = 'assets/img/testcard.png';
    const ASSET_WELCOME_VIDEO = 'assets/videos/welcometotechsupport.mp4';
    const ASSET_BYE_VIDEO = 'assets/videos/byehaveanicelife.mp4';
    const ASSET_JOHN_VIDEO = 'assets/videos/john.webm';
    const VIDEO_FAILSAFE_MS = 30000;
    const TESTCARD_HOLD_MS = 250;
    const GUAC_BASE_URL = `${REMOTE_HOST_PRIMARY}/guacamole/`;
    const GUAC_BASE_URL_FALLBACK = `${REMOTE_HOST_FALLBACK}/guacamole/`;
    const GUAC_USERNAME = `user2514853${USER_NUM}`;
    const GUAC_PASSWORD = USER_PWD;
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

    // Optional external hook if Guacamole token is available via server integration.
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

    if (ocTab) ocTab.querySelector('img').src = getAssetUrl(ASSET_PINE_IMG);
    if (ocToggleUp) ocToggleUp.querySelector('img').src = getAssetUrl(ASSET_PINE_IMG);
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

        // Best effort token-based teardown when host integration provides a token.
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
            if (child && child.tagName === 'IFRAME' && child.id === 'guac-frame') {
                try { child.src = 'about:blank'; } catch (error) {}
            }
            dynamicContentArea.removeChild(child);
        });
    }

    function appendDynamicNode(node) {
        if (!dynamicContentArea) return;
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

            if (autoplay) {
                video.play().catch(() => {});
            }

            const endPromise = new Promise((resolve) => {
                video.onended = resolve;
                video.onerror = () => resolve();
            });

            return Promise.resolve({element: video, endPromise});

        } else if (type === 'iframe') {
            const iframe = document.createElement('iframe');
            iframe.id = 'guac-frame';
            iframe.src = url; // Don't cache-bust external URLs
            iframe.sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.style.overflow = 'hidden';
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
        johnVideoOverlay.style.display = 'none';
        johnVideoOverlay.pause();
    }

    function fadeOutVideo(video, duration) {
        let currentVolume = video.volume;
        const fadeOutInterval = setInterval(() => {
            currentVolume -= 0.1;
            if (currentVolume < 0) {
                currentVolume = 0;
                clearInterval(fadeOutInterval);
                video.pause();
            }
            video.volume = currentVolume;
        }, duration / 10);
        video.style.transition = `opacity ${duration / 1000}s ease-out`;
        video.style.opacity = 0;
    }

    function showJohnOverlay() {
        if (radioStream && !isMuted) {
            radioStream.volume = clampRadioVolume(radioStream.volume);
            radioStream.play().catch(() => {});
            fadeRadioVolume(RADIO_MAX_VOLUME, 1000);
        }
        if (!johnVideoOverlay) return;
        johnVideoOverlay.src = getAssetUrl(ASSET_JOHN_VIDEO);
        johnVideoOverlay.style.pointerEvents = 'none';
        johnVideoOverlay.style.display = 'block';
        johnVideoOverlay.style.opacity = 0;
        setAgentTitleVisible(true);
        johnVideoOverlay.play().catch(() => {});
        setTimeout(() => {
            johnVideoOverlay.style.transition = 'opacity 1s ease-in';
            johnVideoOverlay.style.opacity = 1;
        }, 100); // small delay to ensure transition is applied
        if (accountBalanceDisplay) accountBalanceDisplay.style.display = 'block';
        animateBalance(271.26, 603.26, 2000);
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
            if (userQuery) { userQuery.disabled = true; userQuery.style.opacity = '0.5'; }
            if (sendBtn) { sendBtn.disabled = true; sendBtn.style.opacity = '0.5'; }
            if (muteBtn) muteBtn.style.display = 'none';
            if (toggleWebmBtn) toggleWebmBtn.style.display = 'none';
            if (accountBalanceDisplay) accountBalanceDisplay.style.display = 'none';
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
                }
                if (sendBtn) {
                    sendBtn.disabled = !HAS_REMOTE_LOGIN;
                    sendBtn.style.opacity = HAS_REMOTE_LOGIN ? '1' : '0.5';
                }
                if (muteBtn) muteBtn.style.display = HAS_REMOTE_LOGIN ? 'flex' : 'none';
                if (toggleWebmBtn) toggleWebmBtn.style.display = HAS_REMOTE_LOGIN ? 'flex' : 'none';
                if (accountBalanceDisplay) accountBalanceDisplay.style.display = HAS_REMOTE_LOGIN ? 'block' : 'none';
                startCountdown();

                if (!HAS_REMOTE_LOGIN) {
                    loadContent(ASSET_TESTCARD, 'image');
                    const feedback = document.getElementById('feedback');
                    if (feedback) feedback.textContent = 'Login to activate remote session';
                    return;
                }

                loadContent(ASSET_WELCOME_VIDEO, 'video', true, false).then(({element: video, endPromise}) => {
                    const fadeOutTime = video.duration ? (video.duration - 2) * 1000 : 5000;

                    setTimeout(() => {
                        fadeOutVideo(video, 1000);

                        setTimeout(() => {
                             // Load Guacamole iframe and guarantee john.webm overlay appears.
                            loadContent(GUAC_AUTOLOGIN_URL, 'iframe').then(({element: iframe}) => {
                                if (drawerState !== 'OPEN' || currentToken !== transitionToken) return;
                                if (!iframe) {
                                    showJohnOverlay();
                                    return;
                                }

                                let shown = false;
                                const showOnce = () => {
                                    if (drawerState !== 'OPEN' || currentToken !== transitionToken) return;
                                    if (shown) return;
                                    shown = true;
                                    showJohnOverlay();
                                };

                                iframe.addEventListener('load', showOnce, { once: true });
                                iframe.addEventListener('error', () => {
                                    iframe.src = GUAC_AUTOLOGIN_URL_FALLBACK;
                                    setTimeout(showOnce, 2200);
                                }, { once: true });

                                // Fallback for cross-origin/load event edge cases.
                                setTimeout(showOnce, 2800);
                            });
                        }, 1000); // wait for fade out to complete
                    }, fadeOutTime);
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

            // Fade radio while the closing video plays.
            fadeRadioVolume(0, 2000, () => {
                if (currentToken !== transitionToken) return;
                if (radioStream) { radioStream.pause(); radioStream.currentTime = 0; }
                isMuted = false;
                updateMuteButton();
            });

            const byeVideoPromise = loadContent(ASSET_BYE_VIDEO, 'video', true, false);
            waitForVideoEndOrTimeout(byeVideoPromise.endPromise).then(() => {
                if (drawerState !== 'CLOSING' || currentToken !== transitionToken) return;
                loadContent(ASSET_TESTCARD, 'image').then(() => {
                    if (drawerState !== 'CLOSING' || currentToken !== transitionToken) return;
                    if (ocDrawer) {
                        setTimeout(() => {
                            if (drawerState !== 'CLOSING' || currentToken !== transitionToken) return;
                            ocDrawer.classList.remove('open');
                            const onDrawerCloseTransition = (event) => {
                                if (event.target !== ocDrawer || event.propertyName !== 'transform') return;
                                ocDrawer.removeEventListener('transitionend', onDrawerCloseTransition);
                                setDrawerState('CLOSED');
                            };
                            ocDrawer.addEventListener('transitionend', onDrawerCloseTransition);
                        }, TESTCARD_HOLD_MS);
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
            if (accountBalanceDisplay) accountBalanceDisplay.style.display = 'none';
            stopCountdown();
        }
    }

    function toggleWebmOverlay() {
        if (johnVideoOverlay) {
            if (johnVideoOverlay.style.display === 'none') {
                johnVideoOverlay.style.display = 'block';
                setAgentTitleVisible(true);
                johnVideoOverlay.play().catch(() => {});
            } else {
                johnVideoOverlay.style.display = 'none';
                setAgentTitleVisible(false);
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
        if (!HAS_REMOTE_LOGIN) {
            const feedback = document.getElementById('feedback');
            if (feedback) feedback.textContent = 'Login required';
            return;
        }
        const message = userQuery.value.trim();
        if (message === '' || drawerState !== 'OPEN') return;

        const feedback = document.getElementById('feedback');
        userQuery.disabled = true;
        sendBtn.disabled = true;
        sendBtn.style.opacity = '0.5';
        if (feedback) feedback.textContent = 'Sending...';

        try {
            const payload = { message, channel: 'web_ui', user_num: USER_NUM };
            const candidateUrls = [
                `${REMOTE_HOST_PRIMARY}/command${USER_NUM}/support`,
                `${REMOTE_HOST_PRIMARY}/command/support`,
                `${REMOTE_HOST_FALLBACK}/command${USER_NUM}/support`,
                `${REMOTE_HOST_FALLBACK}/command/support`,
                `${GATEWAY_URL}/support`,
                `${LEGACY_GATEWAY_URL}/support`
            ];

            let sent = false;
            let statusCode = null;

            for (const url of candidateUrls) {
                try {
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${GATEWAY_TOKEN}`
                        },
                        body: JSON.stringify(payload)
                    });
                    statusCode = res.status;
                    if (res.ok) {
                        sent = true;
                        break;
                    }
                } catch (error) {}
            }

            if (!sent) {
                // Fallback for strict CORS setups: fire-and-forget with token in query.
                await fetch(`${REMOTE_HOST_PRIMARY}/command${USER_NUM}/support?token=${encodeURIComponent(GATEWAY_TOKEN)}`, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
                    body: JSON.stringify(payload)
                });
                sent = true;
            }

            if (sent) {
                if (feedback) feedback.textContent = '✓ Sent';
                userQuery.value = '';
                setTimeout(() => { if (feedback) feedback.textContent = ''; }, 3000);
                setTimeout(() => {
                    startBalanceIncrements();
                }, 10000);
            } else if (feedback) {
                feedback.textContent = statusCode ? `Error ${statusCode}` : 'No connection';
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
                fadeRadioVolume(RADIO_MAX_VOLUME, 1000);
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
        accountBalanceDisplay.addEventListener('click', () => {
            if (bankingModal) {
                bankingModal.style.display = 'flex';
            }
        });
    }

    function closeModal() {
        if (bankingModal) {
            bankingModal.style.display = 'none';
        }
    }

    if (bankingModalClose) {
        bankingModalClose.addEventListener('click', closeModal);
    }
    if (bankingModalCloseBtn) {
        bankingModalCloseBtn.addEventListener('click', closeModal);
    }

    // Initial state
    setDrawerState('CLOSED');
});
