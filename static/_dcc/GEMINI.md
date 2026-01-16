# Documentation

- Docs are now generated and live in the `/docs` folder.
- Use Markdown/MDX format compatible with Docusaurus.
- Keep docs in sync with code changes by regenerating or editing as needed.

## PDF Download Functionality

To enable downloading documentation pages as PDFs:

1.  **Install necessary packages:**
    ```bash
    npm install html2pdf.js html2canvas
    # or
    yarn add html2pdf.js html2canvas
    ```

2.  **Integrate a React component (example below) into your Docusaurus theme.**
    You would typically place this component in `src/theme/` and then reference it in your theme's layout files (e.g., `src/theme/Layout/index.js`) to display it on documentation pages.

    ```javascript
    // src/theme/PDFDownloadButton.js (example)
    import React from 'react';
    import html2pdf from 'html2pdf.js';

    const PDFDownloadButton = () => {
      const handleDownload = () => {
        // Target the main content area. This might need adjustment based on Docusaurus's structure.
        // Common targets: 'main', '#__docusaurus', '.markdown', '.doc-content'
        const element = document.querySelector('.doc-content'); // Adjust selector as needed
        if (!element) {
          alert('Documentation content not found!');
          return;
        }

        const opt = {
          margin:       1,
          filename:     'dcc-documentation.pdf',
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true }, // higher scale = better quality, but slower
          jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
          pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
        };

        html2pdf().from(element).set(opt).save();
      };

      return (
        <button
          onClick={handleDownload}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '12px 20px',
            background: '#0066ff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            zIndex: 1000,
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}
        >
          Download Docs as PDF
        </button>
      );
    };

    export default PDFDownloadButton;
    ```

3.  **Add the component to your Docusaurus layout.** You would typically import and render this component in a file like `src/theme/Layout/index.js`.
