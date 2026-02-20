function handleAppLaunch(appId, localBaseUrl, onlineDemoUrl) {
    const hostname = window.location.hostname;
    let notificationContainer = document.getElementById('appNotificationContainer');

    // If the notification container doesn't exist, create it dynamically
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'appNotificationContainer';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '50%';
        notificationContainer.style.left = '50%';
        notificationContainer.style.transform = 'translate(-50%, -50%)';
        notificationContainer.style.backgroundColor = '#454545'; // Dashboard grey background
        notificationContainer.style.color = 'white';
        notificationContainer.style.padding = '20px';
        notificationContainer.style.borderRadius = '8px';
        notificationContainer.style.zIndex = '10000';
        notificationContainer.style.display = 'none';
        notificationContainer.style.textAlign = 'center';
        notificationContainer.style.maxWidth = '80%';
        notificationContainer.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';

        const messageElement = document.createElement('p');
        messageElement.className = 'notification-message';
        messageElement.style.margin = '0';
        messageElement.style.fontSize = '1.1em';
        notificationContainer.appendChild(messageElement);

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.marginTop = '15px';
        closeButton.style.padding = '8px 15px';
        closeButton.style.backgroundColor = '#555';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '4px';
        closeButton.style.cursor = 'pointer';
        closeButton.onclick = hideNotification;
        notificationContainer.appendChild(closeButton);

        // Add loading bar element
        const loadingBarContainer = document.createElement('div');
        loadingBarContainer.id = 'appLoadingBarContainer';
        loadingBarContainer.style.width = '80%';
        loadingBarContainer.style.height = '8px';
        loadingBarContainer.style.backgroundColor = '#555';
        loadingBarContainer.style.borderRadius = '4px';
        loadingBarContainer.style.margin = '15px auto 0';
        loadingBarContainer.style.display = 'none'; // Hidden by default

        const loadingBar = document.createElement('div');
        loadingBar.id = 'appLoadingBar';
        loadingBar.style.width = '0%';
        loadingBar.style.height = '100%';
        loadingBar.style.backgroundColor = '#04da97'; // Accent color
        loadingBar.style.borderRadius = '4px';
        loadingBar.style.transition = 'width 2s ease-in-out'; // Animation for loading
        loadingBarContainer.appendChild(loadingBar);
        notificationContainer.appendChild(loadingBarContainer);

        document.body.appendChild(notificationContainer);
    }

    function showNotification(message) {
        stopLoadingAnimation(); // Ensure loading is stopped before showing notification
        notificationContainer.querySelector('.notification-message').textContent = message;
        notificationContainer.style.display = 'flex';
    }

    function hideNotification() {
        notificationContainer.style.display = 'none';
        stopLoadingAnimation(); // Also stop loading if notification is closed manually
    }

    // Function to start the loading animation
    function startLoadingAnimation() {
        const loadingBarContainer = document.getElementById('appLoadingBarContainer');
        const loadingBar = document.getElementById('appLoadingBar');
        if (loadingBarContainer && loadingBar) {
            loadingBarContainer.style.display = 'block';
            // Trigger reflow to ensure CSS transition is applied
            void loadingBarContainer.offsetWidth;
            loadingBar.style.width = '100%';
        }
    }

    // Function to stop the loading animation
    function stopLoadingAnimation() {
        const loadingBarContainer = document.getElementById('appLoadingBarContainer');
        const loadingBar = document.getElementById('appLoadingBar');
        if (loadingBarContainer && loadingBar) {
            loadingBar.style.width = '0%'; // Reset width
            loadingBarContainer.style.display = 'none';
        }
    }

    // Close notification if escape key is pressed
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && notificationContainer && notificationContainer.style.display === 'flex') {
            hideNotification();
        }
    });

    if (hostname.includes("datro")) { // Running on datro.xyz
        if (onlineDemoUrl) {
            window.location.href = onlineDemoUrl;
        } else {
            showNotification('This app does not appear to have an online demo available.');
        }
    } else { // Running on localhost
        const redirectTimeout = setTimeout(() => {
            // If timeout occurs, show custom error page
            window.location.href = '/app-error.html';
        }, 2000); // 2 seconds timeout

        // Use fetch to check reachability without CORS issues for status inspection
        fetch(localBaseUrl, { mode: 'cors', redirect: 'manual' })
            .then(response => {
                clearTimeout(redirectTimeout);
                if (response.ok) {
                    stopLoadingAnimation();
                    window.location.href = localBaseUrl;
                } else {
                    // If response is not ok (e.g., 404, 500), redirect to custom error page
                    window.location.href = '/app-error.html';
                }
            })
            .catch(() => {
                // If fetch itself fails (e.g., network error, server not running)
                clearTimeout(redirectTimeout);
                window.location.href = '/app-error.html';
                stopLoadingAnimation();
            });
        
        startLoadingAnimation(); // Start loading animation when attempting local connection
    }
}