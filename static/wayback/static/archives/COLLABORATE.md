# COLLABORATE

Please read the README.md for a general overview of Wayback, before attempting to collaborate on its development. 

## Getting Started

This presumes you have a github account and a webserver configured on your local machine, with the following home directory: `var/www/html`

  ``
  # on the github website fork the DATRO repository: `https://github.com/unclehowell/datro/`
  # on your local machine, make a new directory
  mkdir /var/www/html/datro-netlify
  # then enter it
  cd /var/www/html/datro-netlify
  # then initiate it
  git init
  # then remote add the target repo 
  git remote add origin https://github.com/[your_github_username]/datro/
  # then checkout the target branch
  git checkout -b netlify
  # then rename your branch (typically you'd append your github username)
  git branch -m netlify-[your_github_username]
  #then pull the branch to your local machine
  git pull origin netlify
    
  `` 

Now you have a copy of the DATRO repo in your github account and a local copy of the netlify branch, renamed in order to create a distinction from the origional during the pull request. 
Now you can proceed to make your proposed changes. 

In order to submit your proposed changes (pull request from your forked repo) you must do the following:

  ``
  # prep the local repo
  git add ./
  git commit -m "summary of the changelog entries and corresponding changelogs location"
  git push
  # Personal Access Token
