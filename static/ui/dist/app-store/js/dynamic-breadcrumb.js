// app-store/js/dynamic-breadcrumb.js

document.addEventListener('DOMContentLoaded', function() {
    // Function to fetch JSON data from a URL
    async function fetchJson(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching JSON:', error);
            return null;
        }
    }

    // Function to get the current page identifier
    function getCurrentPageIdentifier() {
        const path = window.location.pathname;
        const segments = path.split('/').filter(segment => segment !== '');

        // If it's the root of app-store (e.g., /app-store/)
        if (segments.length === 1 && segments[0] === 'app-store') {
            return '000'; // Assuming '000' represents the main app store page
        }

        // If it's a specific app page (e.g., /app-store/apps/004-001/fetch.html)
        // We need to extract the app ID. This might need adjustment based on actual URL structure.
        // For now, let's assume the last segment before .html is the identifier.
        if (segments.length > 1 && segments[segments.length - 1].endsWith('.html')) {
            const filename = segments[segments.length - 1];
            return filename.split('.')[0];
        }

        // Fallback for other cases, might need more specific logic
        return segments.pop()?.split('.')[0] || '000';
    }

    // Function to generate breadcrumb HTML
    function generateBreadcrumbs(sitemapData, currentPageId) {
        const breadcrumbContainer = document.querySelector('.breadcrumb');
        if (!breadcrumbContainer) {
            console.error('Breadcrumb container not found.');
            return;
        }

        let breadcrumbHtml = '';
        let listItemNumber = 1;

        // Start JSON-LD BreadcrumbList
        breadcrumbHtml += `
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
        `;

        // Find the correct breadcrumb list for the current page
        // This part needs to be adapted based on how sitemap.json is structured
        // For now, we'll use the sitemap.json we created which has a flat structure
        const pageBreadcrumbs = sitemapData.breadcrumbs;

        if (pageBreadcrumbs) {
            pageBreadcrumbs.forEach((item, index) => {
                const escapedName = item.text.replace(/"/g, '"'); // Escape quotes for JSON

                // Add JSON-LD ListItem
                breadcrumbHtml += `
                    {
                      "@type": "ListItem",
                      "position": ${listItemNumber},
                      "name": "${escapedName}",
                      "item": "${item.url}"
                    }${index < pageBreadcrumbs.length - 1 ? ',' : ''}
                `;

                // Construct the HTML for the list item
                let linkContent = '';
                let liClasses = 'btn';

                if (item.text) {
                    linkContent = `<span class="text2">${item.text}</span>`;
                    if (index > 0) { // Apply noHover to subsequent items if they have text
                        liClasses += ' noHover';
                    }
                } else {
                    // If the name is empty, it's the first item
                    linkContent = ''; // Ensure it's empty
                }

                breadcrumbHtml += `
                    <li class="${liClasses}">
                        <a href="${item.url}">${linkContent}</a>
                    </li>
                `;
                listItemNumber++;
            });
        } else {
            console.error('No breadcrumbs found for the current page in sitemap.');
        }

        // Close JSON-LD BreadcrumbList
        breadcrumbHtml += `
              ]
            }
            </script>
        `;

        // Inject the generated HTML into the container
        breadcrumbContainer.innerHTML = breadcrumbHtml;
    }

    // Main execution
    async function initializeBreadcrumbs() {
        const sitemapData = await fetchJson('/app-store/sitemap.json');
        if (!sitemapData) {
            console.error('Failed to load sitemap.json');
            return;
        }

        const currentPageId = getCurrentPageIdentifier();
        generateBreadcrumbs(sitemapData, currentPageId);
    }

    initializeBreadcrumbs();
});