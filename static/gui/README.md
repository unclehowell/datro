# DATRO Consortium: Hotspotβnβ GUI/Dashboard

## Introduction

The Hotspotβnβ Graphical User Interface (GUI), also known as the 'Dashboard', is kept in our [monorepo](https://github.com/unclehowell/datro/tree/gh-pages/static/gui/ "gh-pages gui"), which permits it to be both accessible as an online [demo](https://datro.xyz/static/gui/ "Hotspotβnβ GUI Demo") and the source of the GUI for the [Hotspotβnβ Software](https://github.com/unclehowell/datro/releases "Hotspotβnβ Software") itself.

## Notes

a) Currently a straightforward collection of html static pages (re-do in React when possible/feasible) 

b) the file structure comprises of a "Top Level Directory". The Sphinx Document Folder name begins with the categoryID.

c) this method keeps the depth of the file structure to 2. Which the custom autobuild scripts depend on (see _blue-build-source README.md)


## The File Structure


 ```
 | ./                                           (   TLD   )  
 | ├── dashboard                                (--depth 1)       
 | │   ├── screen-lookups                       (--depth 2)  
 | ├── app-store                                (--depth 1)       
 | │   ├── apps                                 (--depth 2)  
 ```

