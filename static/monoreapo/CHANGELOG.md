# Changelog
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).  

## [Unreleased]

## [monoreapo-0.0.1] - Q2/2022

### Added 
Apr-11 - Added a filter to `sitemap/make-sitemap.sh.options` to exclude non-english directories until transations done   

## [monoreapo-analytics-0.0.1] - Q2/2021

### Added
Jun-02 - Added `analytics` directory and feature. 2 bash files - `run.sh` and `undo.sh`   
 
### Changed

### Fixed

### Issues
Jun-08 - The following string was getting deleted in .svg files, potentially caused with early testing of `run.sh` or `undo.sh` - `<?xml version="1.0" encoding="UTF-8" standalone="no"?>`  
Jun-04 - Either run.sh or undo.sh is systematically removing the line above the script block it's trying to remove, needs fixing   
