# Changelog
It's expected that developers log all changes to this branch, in this CHANGELOG.md file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.1-rtwx.1] - Q3/2020

### Added
15-Sep - made it so videos (inside the dashboard iframe) could be played full screen
15-Sep - Put in some cool css, to hide blue flashes (in chrome) when you click stuff:
         `a{-webkit-tap-highlight-color: transparent;}`
15-Sep - Jquery, to detect subdomain then change iframe content to correspond and raise top bar.

### Removed
15-Sep - Remove AMP from splashpage. For now.
13-Sep - Hid scrollbars, gorgeous if I do say so

### Changed
15-Sep - moved everything from /docs directory into the top level directory
15-Sep - New theme - the one kind most web-apps follow e.g. the grey, night-coding, dark-mode type
15-Sep - Merged some css files into 1, on the dashboard. And solved the bugs which came up as a result. 

### Fixed
15-Sep - The frame didn't reach the bottom, causing a small black bar. TWOK
15-Sep - The topbar button (to hide the top bar) was loading early and too think to click easily. TWOK
