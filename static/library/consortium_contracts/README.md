The translation feature still needs work.
techhouse2_contract5 is the test pilot for the translation feature. 
The issues wont be listed here, only the interim solution until the bugs get fixed and the normal methodology can be used.

Firstly there's 2 docs, `techhouse2_contract5` and `techhouse2_contract5_es`. _es being the spanish copy, the first being the english.
once the two compile, we manually copy `techhouse2_contract5_es/latest/build/html/es/*` to override `techhouse2_contract5/latest/build/html/es/*`  
The same goes for `techhouse2_contract5_es/latest/build/latex/es/*` to override `techhouse2_contract5/latest/build/latex/es/*`  e.g. PDF's

We don't include `techhouse2_contract5` in the front-facing menu e.g. `consortium_contracts/index.html` and `consortium_contracts/.treeview`


