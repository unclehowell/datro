document.addEventListener('DOMContentLoaded', function() {
    const initialDropdownContainer = document.getElementById('initial-dropdown-container');
    const replacedDropdownContainer = document.getElementById('replaced-dropdown-container');
    const dropdownOptions = document.getElementById('dropdown-options');
    const dropdownBackButton = document.getElementById('dropdown-back-button');

    // --- Dropdown Logic ---
    dropdownOptions.addEventListener('change', function() {
        const selectedValue = this.value;
        if (selectedValue) {
            // Hide initial dropdown and show back button
            initialDropdownContainer.style.display = 'none';
            dropdownBackButton.style.display = 'inline-block';

            // Create and show the replaced dropdown
            replacedDropdownContainer.style.display = 'block';
            replacedDropdownContainer.innerHTML = `
                <select class="custom-dropdown">
                    <option value="">Sub-option for ${selectedValue}</option>
                    <option value="${selectedValue}-a">A</option>
                    <option value="${selectedValue}-b">B</option>
                    <option value="${selectedValue}-c">C</option>
                </select>
            `;
            // Re-apply custom styling if needed for dynamically added select
            // (This might require more complex JS if the select is complex)
        }
    });

    dropdownBackButton.addEventListener('click', function() {
        // Hide replaced dropdown and back button, show initial dropdown
        replacedDropdownContainer.style.display = 'none';
        this.style.display = 'none';
        initialDropdownContainer.style.display = 'block';
        dropdownOptions.value = ''; // Reset the initial dropdown
    });

    // --- Slider and Padlock Logic ---
    const padlocks = document.querySelectorAll('.slider-item .padlock');
    padlocks.forEach(padlock => {
        padlock.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event from bubbling up to slider item click
            const isLocked = this.classList.contains('locked');
            const popupContent = this.getAttribute('data-popup-content');

            if (isLocked) {
                this.classList.remove('locked');
                this.classList.add('unlocked');

                // Trigger featherlight popup
                if (popupContent) {
                    // Use Featherlight to show content
                    $.featherlight(popupContent, {
                        iframe: true,
                        iframeMaxWidth: '100%',
                        iframeMaxHeight: '90vh',
                        closeOnClick: 'background',
                        afterContent: function() {
                            // Add a close button to the popup if needed, or rely on Featherlight's default
                            // For simplicity, we'll rely on Featherlight's default close behavior.
                            // If custom content is needed, it would be added here.
                        }
                    });
                }
            } else {
                // If already unlocked, maybe just toggle back to locked or do nothing
                // For now, let's assume clicking an unlocked padlock does nothing or re-opens it.
                // If we want it to re-lock, we'd need a mechanism for that.
                // For now, let's just re-open the popup if clicked again.
                 if (popupContent) {
                    $.featherlight(popupContent, {
                        iframe: true,
                        iframeMaxWidth: '100%',
                        iframeMaxHeight: '90vh',
                        closeOnClick: 'background'
                    });
                }
            }
        });
    });

    // --- Library Link Handling ---
    const libraryLinks = document.querySelectorAll('a[href*="library"]');
    const hostname = window.location.hostname;

    libraryLinks.forEach(link => {
        const currentHref = link.getAttribute('href');
        let newHref = currentHref;

        if (hostname === 'datro.xyz') {
            // Online: use https://library.datro.xyz/
            newHref = currentHref.replace('../library/', 'https://library.datro.xyz/');
            newHref = newHref.replace('/library/', 'https://library.datro.xyz/');
        } else {
            // Offline/localhost: use ../library/ or default to it if not present
            if (!currentHref.includes('../library/')) {
                 newHref = '../library/'; // Default to relative path if not already set
            }
        }
        link.setAttribute('href', newHref);
    });

    // Ensure featherlight is initialized if it's not already
    // This might be handled by an external script, but good to be sure.
    if (typeof $.featherlight === 'undefined') {
        console.error('Featherlight library not found. Please ensure it is included.');
    }
});
