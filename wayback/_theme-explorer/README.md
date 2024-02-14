# DATRO Consortium: Library > Theme > Explorer (File)

## Introduction
The Library has a html solution for exploring the library via the web browser.   
The objective was origionally to list the documents, but exclude code. Both online and offline.  
While this was origionally done with the Github API, it's evolved to instead use `index.html` and `.treeview.json` files in each of the directories in the library.  
Maintainers should update the .treeview.json manually until a script has been produced to automate it.   
The method employed allows for a generic index.html to be placed in each directory, although the path to the css and jquery will need to be updated depending on the depth of the directory.   
 

