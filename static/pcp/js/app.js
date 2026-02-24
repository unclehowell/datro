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

    let drawerState = 'CLOSED'; // CLOSED, OPEN, CLOSING
    let firstSend = true;
    let isMuted = false;
    let countdownTimer = null;

    const ASSET_TESTCARD = '../assets/img/testcard.png';
    const ASSET_WELCOME_VIDEO = '../assets/videos/welcometotechsupport.mp4';
    const ASSET_BYE_VIDEO = '../assets/videos/byhaveanicelife.mp4';
    const GUAC_URL = 'https://ai.carfinancecheque.uk/guacamole/';

    function clearDynamicContent() {
        while (dynamicContentArea.firstChild) {
            dynamicContentArea.removeChild(dynamicContentArea.firstChild);
        }
    }

    function loadContent(url, type = 'image', autoplay = false, controls = false) {
        clearDynamicContent();

        if (type === 'image') {
            const img = document.createElement('img');
            img.src = url;
            dynamicContentArea.appendChild(img);
            return Promise.resolve();
        } else if (type === 'video') {
            const video = document.createElement('video');
            video.src = url;
            video.autoplay = autoplay;
            video.controls = controls;
            video.muted = false;
            video.volume = 1.0;
            dynamicContentArea.appendChild(video);
            return new Promise(resolve => {
                video.onended = resolve;
            });
        } else if (type === 'iframe') {
            const iframe = document.createElement('iframe');
            iframe.id = 'guac-frame';
            iframe.src = url;
            iframe.sandbox = 'allow-scripts allow-same-origin allow-forms';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.style.overflow = 'hidden';
            dynamicContentArea.appendChild(iframe);
            return Promise.resolve();
        }
    }

    function startCountdown() {
        clearTimeout(countdownTimer);
        countdownTimer = setTimeout(() => {
            if (drawerState === 'OPEN') {
                setDrawerState('CLOSING');
            }
        }, 3 * 60 * 1000); // 3 minutes
    }

    function setDrawerState(newState) {
        drawerState = newState;

        if (newState === 'CLOSED') {
            ocDrawer.classList.remove('open', 'closing');
            ocTab.classList.remove('hidden');
            powerBtn.classList.remove('on');
            userQuery.disabled = true;
            sendBtn.disabled = true;
            userQuery.style.opacity = '0.5';
            sendBtn.style.opacity = '0.5';
            muteBtn.style.display = 'none';
            radioStream.pause();
            radioStream.currentTime = 0;
            radioStream.volume = 0;
            isMuted = false;
            updateMuteButton();
            firstSend = true;
            clearTimeout(countdownTimer);
            loadContent(ASSET_TESTCARD, 'image');
        } else if (newState === 'OPEN') {
            ocDrawer.classList.add('open');
            ocDrawer.classList.remove('closing');
            ocTab.classList.add('hidden');
            powerBtn.classList.add('on');
            userQuery.disabled = false;
            sendBtn.disabled = userQuery.value.trim() === '';
            userQuery.style.opacity = '1';
            sendBtn.style.opacity = userQuery.value.trim() === '' ? '0.5' : '1';
            startCountdown();
        } else if (newState === 'CLOSING') {
            ocDrawer.classList.add('closing');
            ocDrawer.classList.remove('open');
            powerBtn.classList.remove('on');
            userQuery.disabled = true;
            sendBtn.disabled = true;
            userQuery.style.opacity = '0.5';
            sendBtn.style.opacity = '0.5';
            muteBtn.style.display = 'none';
            radioStream.pause();
            radioStream.currentTime = 0;
            isMuted = false;
            updateMuteButton();
            clearTimeout(countdownTimer);

            loadContent(ASSET_BYE_VIDEO, 'video', true, false).then(() => {
                loadContent(ASSET_TESTCARD, 'image');
                setTimeout(() => {
                    setDrawerState('CLOSED');
                    ocDrawer.classList.remove('closing');
                }, 1000);
            });
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

        if (firstSend) {
            firstSend = false;
            loadContent(ASSET_WELCOME_VIDEO, 'video', true, false).then(() => {
                loadContent(GUAC_URL, 'iframe');
            });
            muteBtn.style.display = 'flex';
            radioStream.volume = 0.1;
            radioStream.play();
        } else {
            console.log('Sending message:', message);
        }
        // Do not clear the input field: userQuery.value = '';
    }

    function toggleMute() {
        isMuted = !isMuted;
        radioStream.volume = isMuted ? 0 : 0.1;
        updateMuteButton();
    }

    function updateMuteButton() {
        muteBtn.classList.toggle('on', !isMuted);
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
