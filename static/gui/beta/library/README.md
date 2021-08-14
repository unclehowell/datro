# DATRO Consortium: Library

## Introduction
* Files are hosted in our MonoREAPo at this url:  https://github.com/unclehowell/datro/static/library/  
* Key documents are presented here:  https://gui.8cc.online/static/datro/documents.html  
* Browse entire library with `Version 0.0.1-rtw.11-library.03`: https://gui.8cc.online/static/library/index.html   

## Notes
a) on the public website some of the categories may have slightly different names for easier navigation  
b) the file structure comprises of a "Top Level Directory". The Sphinx Document Folder name begins with the categoryID  
c) this method keeps the depth of the file structure to 2. Which the custom autobuild scripts depend on (see _theme-* README.md)  

## The File Structure
Top Level Directory we call "TLD"  
--depth 1 contains the sphinx document source-code directories (also containing compile scripts and compiled html & pdf)  

TLD directories are labeled `subsidiaryID`  
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

filepath now looks like this: `consortium_agreements/google_patents`  
Compiled PDF's are also labelled with this file path e.g. `consortium_agreements-google_patents.pdf`
Notice how the `SubsidiaryID_CatagoryID` and `SubcategoryID_DocumentID` are coupled with a dash (`-`)

This is intentional in order to keep the depth of the Files Library low.   
The low depth of the Files Library is also important for the custom scripts to function.   


 ```
 | consortium_   
 | |--          'technical - the_lightpaper'  
 | |--          'technical - the_whitepaper'  
 | |--         'agreements - google_patents'   
 | |--         'agreements - google_loon'    
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

Within each "Top Level" Directory are sphinx document folders, which contains two sub directories:  
* the source (.RST text files)  
* the build (HTML directory & Latex(PDF) directory)  

As explained above, these sphinx document folders are entitled according to their category, sub-category and their title.  
See the example below:  

        ```
	- management  

		- planning-projects-network-listing-leasing  

			- latest  
                             - source  
                             - build  

                        - 0-1-0  
                             - source  
                             - build  

		- planning-projects-network-status  

			- latest  
                             - source  
			     - build  
          ```

Any questions, queries and concerns please email hywelapbuckler@gmail.com  
