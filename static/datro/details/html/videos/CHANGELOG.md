# Changelog
It's expected that developers log all changes to this directory, in this CHANGELOG.md file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [-html-videos-0.3] - Q3/2021

### Changed
Sep-30 - Moved video from `gh-pages` branch to `netlify` branch, because all the push/pulling on the first branch was causing corruption  
Sep-06 - Changed date format on this changelog from DD-MM to MM-DD  
Sep-06 - Replaced hbnb-intro.jpg with .webp version, generated using Sqoosh CLI command `npx @squoosh/cli --webp auto ./*.jpg`  

## [-html-videos-0.2] - Q2/2021

### Fixed
May-08 - `lodash` updated to `v4.17.21`) - versions prior to 4.17.21 are vulnerable to Command Injection via the template function.  
May-08 - `ua-parser-js` updated to `v0.7.24`) - used a regular expression which is vulnerable to denial of service. If an attacker sends a malicious User-Agent header, ua-parser-js will get stuck processing it for an extended period of time.  
May-05 - Mistakenly deleted package.json-lock file. It broke the video playback on the landing page. re-instated it.  
May-05 - Security Vunerability in dependancy - package xmlhttprequest - updated to latest which has fix (v1.6.2) (in json file)  


## [-html-videos-0.1] - 2020-09-09

### Added
    - The source of this video player solutions is https://freshman.tech/custom-html5-video/  

### Changed
    - added two div's (left and right side of video), so that mousing over the video reveals the player  
    - the reason there's a gap in the middle, is so that the play/pause still works when you click on the video  
    - had there not been a gap, you'd not be able to start/stop the video by clicking it. which is how most people do it I guess   

### Removed

### Fixed

### To Do

### Issues
