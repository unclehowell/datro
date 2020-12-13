# README.md

## Introduction

The `_grey-build-source` directory is a solution to run Over-the-Air updates of the sphinx document build scripts, before executing them.
This ensures whomever or however many developers are modifying documents, the theme of the publication remains current & consistent:

- Update-all is our way of bulk rebuilding all the documents in this document library.

- There's an update-all.sh in each sub-directory e.g. management, services, hardware etc
  This shell script triggers the auto-rebuild.sh in every sphinx document directory in the sub-directory

- There's also an update-all.sh in the top level directory, which triggers all of the above 'update-all' shell scripts, a sub-directory at a time

The purpose of the script files contained in this directory are as follows:

**updater.sh** : gets the latest copy of the two *-master.sh files (it only allow itself to be run twice an hour to reduce server traffic)
**rebuild-master.sh** : found in every sphinx document folder (entitled rebuild.sh), it custom builds the rst files into PDF and HTML and updates the auto-rebuild
**auto-rebuild-master.sh** : placed in every sphinx document folder (entitled auto-rebuild.sh). Used by update-all.sh to update the rebuild.sh file before running it.


### File Locations

The directory structure and file locations are as follows:

  _grey-build-source/

	- updater.sh
	- rebuild-master.sh
	- auto-rebuid-master.sh

  management/

	- company-records-legal-privacy-policy/
		- rebuild.sh
		- auto-rebuild.sh

	- update-all.sh

  update-all.sh


### Functions

* auto-rebuild.sh does the following:
	- trigger the updater.sh in the _grey-build-source directory. Updater.sh gets the latest *-master files (if not already run in the last 30 minutes).
	- copies the *-master.sh files from the _grey-build-source directory to the sphinx document directory (removing the -master from the destination filename).
	- runs the latest rebuild.sh, producing a PDF and HTML verison of its rst files

* rebuild.sh does the following:
        - rebuild the PDF and HTML
        - copies the auto-rebuild-master.sh file from the _grey-build-source directory to its own sphinx document directory
        - * when the latest auto-rebuild-master.sh is copied across the -master part of the filename is removed.


* updater.sh does the following:
	- checks it hasn't already been run in the last 30 minutes, if it has then it ceases to do anything.
	- if it hasn't been run in the last 30 minutes the latest *-master.sh scripts are fetched and written over the local ones.


### update-all

These source files work in conjuntion with the update-all process:

- Update-all is our way of bulk rebuilding all the documents in this document library.

- There's an update-all.sh in each sub-directory e.g. management, services, hardware etc
  This shell script triggers the auto-rebuild.sh in every sphinx document directory in the sub-directory

- There's also an update-all.sh in the top level directory, which triggers all of the above 'update-all' shell scripts, a sub-directory at a time
