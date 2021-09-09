# DATRO Consortium: Library

## Introduction
* Files are hosted in our MonoREAPo at this url:  https://github.com/unclehowell/datro/static/library/  
* Key documents are presented here:  https://datro.xyz/static/datro/documents.html  
* Browse entire library with `Version 0.0.1-rtw.11-library.03`: https://datro.xyz/static/library/index.html   

## Notes
a) on the public website some of the categories may have slightly different names for easier navigation  
b) the file structure comprises of a "Top Level Directory". The Sphinx Document Folder name begins with the categoryID  
c) this method keeps the depth of the file structure to 2. Which the custom autobuild scripts depend on (see _theme-* README.md)  
d) ZOOM OUT! - If this is viewed in a webbrowser or terminal and it's all over the place, zoom out until the treeview's become clear  

## The File Structure
Top Level Directory we call "TL"  
--depth 1 contains the sphinx document source-code directories (also containing compile scripts and compiled html & pdf)  

TL directories are labeled `subsidiaryID`  
followed by a underscore (`_`) and then `categoryID`.  

--depth 1 directories are labeled `subcategoryID`  
followed by an underscore (`_`) and then `documentID`.  

e.g. TopLevelDirectory_category/subcategoryID_documentID  

This allows us to replace a deep file path with a shorter file path:  

Before:

 ```  
 | | subsidiaryID                        (-toplevel)    
 |   |-- categoryID                      (--depth 1)  
 |       |--subcategoryID                (--depth 2)  
 |          |-- documentID               (--depth 3)
 ```   

After:

 ```
 | | consortium_agreements             (-toplevel)   
 |   |-- google_patents                (--depth 1)   
 ```  

Filepath now looks like this: `consortium_agreements/google_patents`  
Technically there's two directories higher (static/library) and one deeper (/latest/ or /0-0-0/). 
Theses are incorporated into the docs explorer files (explained in the next paragraph).
But as far as the titles of the compiled PDF's, we just focus on the above mentioned 2 levels of directories e.g. `consortium_agreements-google_patents.pdf`
Notice how the `SubsidiaryID_CatagoryID` and `SubcategoryID_DocumentID` are coupled with a dash (`-`)

This is intentional in order to keep the depth of the Files Library low.   
The low depth of the Files Library is also important for the custom scripts to function.   
The depth also corresponds to the workings of the 'Docs Explorer' (e.g. `.html` and `.treeview.json` files).
Basically, the Docs Explorer has unlimited horizontal and verticle presentation of categories, subcategories, subsubcategories, but depth is limited.
The best way to understand the Docs Explorer is to view it for yourself and see. A public copy can be viewed by visiting https://datro.xyz/static/. 
  

 ```
 | consortium_   
 | |--          'technical - the_lightpaper'  
 | |--          'technical - the_whitepaper'  
 | |--         'agreements - google_patents'   
 | |--         'agreements - google_loon'    
 | |--         'agreements - techhouse2_lease1'   
 | |--         'agreements - techhouse2_lease2'   
 | |--         'agreements - techhouse2_lease3'   
 | |--         'agreements - techhouse2_lease4'   
 | |--         'agreements - techhouse2_lease5'   
 | |--         'agreements - techhouse2_lease6'   
 | |--          'investors - company_structure'   
 | |--          'investors - annual_financials'  
 | |--     'administration - business_plan'  
 | |--     'administration - elevator_pitch'  
 | |--              'legal - privacy_policy'  
 | |--              'legal - service_terms'  
 | |--            'defence - tech_saxon'  
 | |--            'defence - schindlers_ark'  
 | |--            'defence - sun_su'  
 | |--             'future - the_vision'  
 | hotspotbnb_   
 | |--          'technical - the_lightpaper'  
 | |--          'technical - the_whitepaper'  
 | |--          'technical - user_guide'  
 | |--          'technical - development_guide'  
 | |--          'slideshow - product_intro'  
 | wave_    
 | |--          'technical - the_lightpaper'  
 | |--          'technical - the_whitepaper'  
 | |--          'technical - user_guide'  
 | |--          'technical - development_guide'  
 | |--          'slideshow - product_intro'  
 | das_                
 | |--          'technical - the_lightpaper'  
 | |--          'technical - the_whitepaper'  
 | |--          'technical - user_guide'  
 | |--          'technical - development_guide'  
 | |--          'slideshow - product_intro'  
 | monoreapo_                
 | |--          'technical - the_lightpaper'  
 | |--          'technical - the_whitepaper'  
 | |--          'technical - user_guide'  
 | |--          'technical - development_guide'  
 | |--          'slideshow - product_intro'  
 | cacher_
 | |--          'technical - the_lightpaper'  
 | |--          'technical - the_whitepaper'  
 | |--          'technical - user_guide'  
 | |--          'technical - development_guide'  
 | |--          'slideshow - product_intro'  
 | togo_
 | |--          'technical - the_lightpaper'  
 | |--          'technical - the_whitepaper'  
 | |--          'technical - user_guide'  
 | |--          'technical - development_guide'  
 | |--          'slideshow - product_intro'  
 ```

## How it Works  

Within each document folders (once you drill 2 levels down) contains two sub directories:    
* source (.RST text files)  
* build (gettex, html and Latex(PDF) directory)  

As explained above, these sphinx compiled PDF (and other files like Tex) are autonomously entitled during the build, according to their category and sub-category.  
See the example below of the file `consortium_contracts-patents_google.pdf`

        ```
	- consortium_contracts  

		- patents_google  

			- latest  
                             - /source  
                             - /build  
                             - rebuild.sh
                             
                        - 0-0-1  
                             - source  
                             - build  

         ```

The Docs explorer has an index.html and a .treeview.json  in each directory as you drill down, until you reach `latest`: 

         ```
       - /static/  
           - /index.html                                                     # Generic template, other than the title   
           - /.treeview.html                                                 # An simple index of all the directories in this folder, with class attributes for styling, enabling links etc   
           - /{hbnb,datro,monoreapo,bloculus,cacher etc}                     # List of key intellectual properties e.g. Docs, Websites, Software GUI demo etc   
           - /library/  

              - index.html                                                   # "" "" (same description as above index.html)  
              - .treeview.json                                               # "" "" (same description as above .treeview.json)  
              - /consortium_{campuses,financials,plans,other}                # Names of subcategories (that have multiple categories themselves) append onto the end of their parent folder  
              - /{das,hotspotbnb,library,monoreapo,neodome etc}              # Some examples of the other directories in this one  
              - /consortium_contracts/                                       # An example of a directory/category containing multiple subdirectories e.g.`patents_google`, `lease_deals` etc

                   - /index.html  
                   - /.treeview.json  
                   - /patents_google/   

                       - /index.html                                        # The point on this page is to navigate to your desired html or pdf and in your prefered language   
                       - /.treeview.json                                    # "" ""  
                       - /latest/   

                            - /source                                       # rst files and `/locales/` which contain the .po files (use an editor to perfect the .po translations)  
                            - /build/                                       # In here is the pdf with the filepath as the name e.g. build/latex/en/`consortium_contracts-patents_google.pdf`  
                            - rebuild.sh                                    # This script autonomously recompiles the rst files into html and PDF and other fancy things  
                            - auto-rebuild.sh                               # This is used to grab the latest `rebuild.sh` and theme files before executing the rebuild process  

                  - /techhouse2_lease4/                                     # Alongside `patents_google` sits this. Similar to the `consortium_{foo,bar etc}` situation e.g. `lease{I,II etc}`  
         ```

As explained in the previous lines, once you're in `static/library/` you can only go 2 levels deep before reaching the `latest` release of any document  
Weather it be `consortium_campuses-techhouse2_casestudy` or `consortium_contracts-patents_google`,   
The next phase is to make the library more progressive e.g. webelements, manifest.json, reactjs etc.  
 - Instead of custom mods to codes to update `index.html` and `treeview.json` to include new docs, it can be made into an autonomous script (like the sitemap generator we made).  
 - The can also be an offline gui to manage the library (a single php page admin panel exists, source code is in the monorepo somewhere too)  
 - Make the whole thing install with a package manager e.g. npm  

View the COLLABORATE.md file to learn more  
Any questions, queries and concerns on this area of the DATRO monoreapo, please email hywelapbuckler@gmail.com  


