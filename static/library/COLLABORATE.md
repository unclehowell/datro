## Collaboration

To collaborate on the Files Library you will need to read and install the following:

     ```
        - sphinx-common

        - https://www.sphinx-doc.org/en/master/  

        - https://sphinx-rtd-theme.readthedocs.io/en/stable/installing.html  

        - https://rst2pdf.org/  
     ```

If you have Windows, you'll need to use the Linux command-line Windows "Sub-System"  
Understanding Git is crucial e.g. Pull, Push, etc. (Git Desktop GUI for Windows Users)  

### Other Dependencies

```
apt install texlive-latex-base texlive-fonts-recommended texlive-fonts-extra texlive-latex-extra texlive-luatex

pip3 install -U sphinx (updates sphinx so that extension 'sphinx.ext.autosectionlabel' works).  

pip3 install hieroglyph  

sudo apt install latexmk  

sudo apt-get install xdg-utils  

To open index.html & *.pdf from commandline use xdg-open e.g. `xdg-open build/html/index.html` or `xdg-open build/latex/business-plan.pdf`


## Getting Started

### New Document
In the case of a creating a completely new document, you can run the 'sphinx-quickstart' command.   
But it's faster to clone a draft document and taylor it  
After this quickstart wizard is completed or you've cloned another doc as the template don't run auto-rebuild.sh or rebuild.sh  
First make sure all dependancies are installed (install will be included in the rebuild.sh to allow skipping this manual step)
Next edit the conf.py according. Paying particular attention to include the following:

      ~~~

      language = "en"                # sets default language to english
      locale_dirs = ['locales']      # labels the directory which will store the `.po`/`.pot`/`.mo` files (the files you edit to parallel the text in alternate languages) 
      gettext_auto_build = True      # actually produce alternate languages during the rebuild/compile e.g. produces this `source/locales/{2letter language code}/LC_MESSAGES/docs.po` 
      gettext_compact = "docs"       # without this you get a corresponding .po`/`.pot`/`.mo` file for each `.rst` file e.g. intro.rst > intro.po --  
      today_fmt = 'May 02, 2021'     # if hashed out the date appended in the published PDF will be the date of its rebuild/compile. 
                                     # by default we leave this set to the date of the last publication, so we can run new rebuild.sh releases,
                                     # without having to follow the semantic changelog/archive protocol, required when re-releasing a document. 
                                     # One exception to this rule. It's best to follow the full changelog/archive protocol in the even the file path changes.   
                                     # The protocol is explained elsewhere in this document e.g. copy /latest/* to /0-0-x/, copy /latest/latex/*.pdf to world.datro.xyz/wayback/, `make clean` 0-0-x, update latest/source/conf.py & olderversion.csv and recompile 
 
      ~~~

Remember in any case, following the file structure methodology (as explained at the top of this page).   

### New Version
Before a new version of a document can be produced, you must archive the current version.  
If there are existing versions, you will see them as the titles of the sub-directories in the sphinx document directory e.g. 0-0-1, 0-0-2 etc  
Obviously the current version you are archiving, will be labeled as the next in the sequence e.g. 0-0-3  

1. Create a folder entitled x-x-x (the version number).  

2. Copy the content of the 'latest' directory to it.  

3. move the compiled pdf from x-x-x to world.datro.xyz/wayback (the 'netlify' branch of the monorepo)  

4. run `make clean` in x-x-x  

# we'll add a link to the archived version in the new version  
# make clean trims down the file size. if we ever have to revert to an older version, we can run rebuild.sh and recompile the pdf and html

5. Go into the 'latest' directory and change the version number in the .py file (as well as making updates to the changelog, olderversions.csv and *.rst files)  

6. Once you've made all your changes to `latest/source/{conf.py,releasenotes.rst, index.rst` etc, run the rebuild.sh script to produce the PDF and HTML   

# For multiple languages edit the .po files described above after rebuild, then rebuild again. The modifications to the .po files won't overwrite    


## Formatting - Text
The RST files use reStructuredText, which requires the text to be in a specific format which must be learnt.  
For consistancy each document in this Files Library will use a specific reStructuredText format, as explained below:  

Each RST file should represent a Chapter of the document.  
This is reflected by putting a line of stars above and below the Chapter Title.  

`**************`  

Chapter Title

`**************`  

A Sub Title is reflected by underlining it with these characters ==========  

A Sub Sub Title is reflected by underlining it with these characters  -----  
And possibly two stars (**) at the beginning and the end of the Sub-sub Title to make the text bold. 

## Formatting - Images
Another principle employed by this Files Library is to always use base64 image encoding and NOT links to images in the _static directory, as suggested by Sphinx.  The benefit of this is a reduced amount of http requests.  
Personally rst can become a mindfield and deviate far from a normal looking text file. In this case it's worth sourcing .csv and images rather than trying to embedd images and tables   
The real value of base64 images and reStructuredText Tables as oppose to sourcing a .csv file, is to reduce the overall filesize of the branch or onorepo as a whole.  
Housekeeping a monorepo in this way is a full time job and/or a job for a team in itself. In the interim of such luxuries/ feasibility, be as dilligent as possible while working on this   

All images should have their width set to 620.  
Combined with the custom css changes in the build script, the images will appear perfectly centered on mobile and desktop and shouldn't overflow.  

It's also best practice to number and title each image as follows .. Fig 1.0 - Image Title  
The consistent method of doing this is as follows:  

* **Fig 1.0** - *Image Title*
*
The first star creates a bullet point which is the best way to center align the text.  
The Fig x.x is in bold (using the two stars are the beginning and end)  
The Image Title is in italics (using the single star at the beginning and end)  
If the text above the image overflows then forget bullet pointing the line.  

# I believe the pdf autogenerates the figures for tables and images. In html there's a string that can be used.
# The same string which is used to insert the `content` html-only title, above the opening pages index (see index.rst) 

## Source Files (self-updating build script)
These source files work in conjuntion with the update-all process:

- Update-all is our way of bulk rebuilding all the documents in this Files Library.  
- There's an update-all.sh in each sub-directory e.g. management, services, hardware etc  
  This shell script triggers the auto-rebuild.sh in every sphinx document directory in the sub-directory  
- There's also an update-all.sh in the top level directory, which triggers all of the above 'update-all' shell scripts, a sub-directory at a time  


The purpose of the script files contained in this directory are as follows:  

**updater.sh** : gets the latest copy of the two *-master.sh files (it only allow itself to be run twice an hour to reduce server traffic)  
**rebuild-master.sh** : found in every sphinx document folder (entitled rebuild.sh),it custom builds the rst files into PDF and HTML and updates the auto-rebuild
**auto-rebuild-master.sh** : placed in every sphinx document folder (entitled auto-rebuild.sh). Used by update-all.sh to update the rebuild.sh file before running it.  


## Functions
* auto-rebuild.sh does the following:  
        - trigger the updater.sh in the _blue-build-source directory. Updater.sh gets the latest *-master files (if not already run in the last 30 minutes).  
        - copies the *-master.sh files from the _blue-build-source directory to the sphinx document directory (removing the -master from the destination filename).  
        - runs the latest rebuild.sh, producing a PDF and HTML verison of its rst files  

* rebuild.sh does the following:  
        - rebuild the PDF and HTML  
        - copies the auto-rebuild-master.sh file from the _blue-build-source directory to its own sphinx document directory  
        - * when the latest auto-rebuild-master.sh is copied across the -master part of the filename is removed.  


* updater.sh does the following:  
        - checks it hasn't already been run in the last 30 minutes, if it has then it ceases to do anything.  
        - if it hasn't been run in the last 30 minutes the latest *-master.sh scripts are fetched and written over the local ones.  

To learn more about the source files go into the _blue-build-source directory and view the dedicated README.md  


## Quality Control
So you've modified the releasenotes and conf.py and checked the html and latex PDF locally.  
And you're happy with your changes and have published to Github e.g. you've 'pulled' the latest, 'pushed' your changes and there's no conflicts showing, so you've 'committed' your work.  
The repository administrator will review and hopefully accept the changes. Now the changes to the Files Library are live.  
If required the administrator will also update the datro.xyz/static/library/ website, if not done automatically.  

When you see the changes on datro.xyz/static/library/ the process is complete.  

* ensure you enter the date and version of your publication in the conf.py file  
* ensure you check the build.log after running the build for build errors e.g. formatting errors are common  
* ensure your build script is the latest (check the _blue-build-source) - the files only update a maximum of twice per hour and upon request of the auto-rebuild.sh  
* ensure there's no orphaned rst files e.g. the index.rst must index all the rst files in the source directory  
* ensure that you open the index.html and pdf locally and look at the output of the build before submitting to GitHub e.g. `xdg-open build/html/index.html` or `xdg-open build/latex/business-plan.pdf`  
* ensure you Git 'pull' & 'push' the latest Files Library, to make sure your local copy and working directory doesn't conflict with anothers contribution (if it does, rectify the conflic before proceeding)  
* ensure after Git 'commit' you monitor the administrators role to ensure you get feedback and/or approval in order the work be published.  
* ensure your contribution appears on datro.xyz/static/library/ by visiting it regularly and/or chasing it up with the administrator.  


## Translation 

This is being implimented into the rebuild.sh script for full autonomy. 
Below is more of a troubleshooter if there's failure and/or guide for understanding of the process.

1. install dependacies

`sudo apt-get install -y sphinx-intl python3-stemmer`

There maybe more. Will revisit this command later.


2. make sure conf.py is correct (language settings)

	``
	language = "en"
	locale_dirs = ['locales']
	gettext_auto_build = True
	gettext_compact = False

	``

3. make sure .local and build/gettext exist

mkdir build/gettext
mkdir .local

4. run this command to generate a gettext directory containing .po file equivalents of the .rst files (in static directory)

`make gettext` 

5. generates .local/es/LC_MESSAGES/ directory and copies .po files to this directory

`sphinx-intl update -p build/gettext -l es`

sphinx-intl update -p build/gettext -l en -l es


maybe run the syntax error check command ? e.g. msgstr file.po (I think)

6. Use a POE Editor (localise.biz/free/poeditor and maybe Google Translate) to append the other languages text to the .po files
(there's a `trans` command that can surely be hacked to automate this step of manually translating ???/) 

7. overwrite the old .po files with the new ones in .local/es/LC_MESSAGES/

maybe run the syntax error check command ? e.g. msgstr file.po (I think)

8. run this command 

`sphinx-build -b html source build/html/es -D language='es'`

