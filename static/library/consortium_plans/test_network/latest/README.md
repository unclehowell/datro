# Test Network

Not a latex PDF but the `build/latex/` was used to file the PDF, purely to avoid confusing the uniform html/json file explorer files.
The PDF is produced by Google Docs Presentation (an interim solution until latex slides are fully understood used). 

For the html version `build/html` we download each slide as PNG and resize them and place them into an ISM (Image Slider Magic)  

``
cp -r {testnet_title_slide_1}.png ./deck-1.png  
convert deck-3.png -resize 695x433\> deck-3.png  

``

