#!/usr/bin/env bash
#

#unset CDPATH


#.................................................
#         DATRO Consortium - 2021 Copyleft
#.................................................
#
#   ██████╗  █████╗ ████████╗██████╗  ██████╗
#   ██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗██╔═══██╗
#   ██║  ██║███████║   ██║   ██████╔╝██║   ██║
#   ██║  ██║██╔══██║   ██║   ██╔══██╗██║   ██║
#   ██████╔╝██║  ██║   ██║   ██║  ██║╚██████╔╝
#   ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝
#................................................
#                  blue.sh v0.1
#................................................
#                   datro.xyz
#................................................


sed -i 's/<\/head>/<style>html{overflow-y:scroll;} ::-webkit-scrollbar{width:0px;background:transparent;}<\/style><\/head>/g' build/html/*.html
sed -i 's/ View page source/ /g' build/html/*.html
sed -i 's/<div class="version">/<div class="version"> Document Version : /g' build/html/*.html
sed -i 's/#33368C/darkslateblue/g' build/html/_static/css/theme.css
sed -i 's/color:initial}/color:lightgrey;}/g' build/html/_static/css/theme.css
sed -i 's/#9b59b6/#29808A/g' build/html/_static/css/theme.css
sed -i 's/#4d4d4d/grey/g' build/html/_static/css/theme.css
sed -i 's/#4e4a4a/#333569/g' build/html/_static/css/theme.css
sed -i 's/#c9c9c9/#333653/g' build/html/_static/css/theme.css
sed -i 's/#d6d6d6/#333666/g' build/html/_static/css/theme.css
sed -i 's/#f3f6f6/#333666/g' build/html/_static/css/theme.css
sed -i 's/rgb(243, 246, 246)/#333666/g' build/html/_static/css/theme.css
sed -i 's/#e5ebeb/#333666/g' build/html/_static/css/theme.css
sed -i 's/#343131/#33365D/g' build/html/_static/css/theme.css
sed -i 's/#fcfcfc/-webkit-gradient(radial,50% 50%,450,50% 55%,60,from(#333650),to(#333666))/g' build/html/_static/css/theme.css
sed -i 's/#404040/lightgrey/g' build/html/_static/css/theme.css
sed -i 's/#edf0f2/-webkit-gradient(radial,50% 50%,450,50% 55%,60,from(#333650),to(#333666))/g' build/html/_static/css/theme.css
sed -i 's/rgba(0,0,0,.05)/#33365D/g' build/html/_static/css/theme.css
sed -i 's/#d9d9d9/initial/g' build/html/_static/css/theme.css
sed -i 's/#9B59B6/#a3a3a3/g' build/html/_static/css/theme.css
sed -i 's/body{/body{text-align:justify;/g' build/html/_static/css/theme.css
sed -i 's/.wy-nav-top{/.wy-nav-top{width:100vw!important;position:fixed!important;/g' build/html/_static/css/theme.css
sed -i 's/body{/body{scroll-padding-top: 70px!important;/g' build/html/_static/css/theme.css
sed -i 's/html{/html{scroll-padding-top: 70px!important;/g' build/html/_static/css/theme.css
sed -i 's/h3{font/h3{font-align:left;font/g' build/html/_static/css/theme.css
sed -i 's/.wy-table-responsive table td/.wy-table-responsive table td {white-space: normal !important;} .wy-table-responsive table td/g' build/html/_static/css/theme.css
sed -i 's/.btn-neutral {/.btn-neutral {background-color: #333666!important; border: 1px solid rgb(229, 235, 235) !important; border-radius: 6px;  /g' build/html/_static/css/theme.css
sed -i 's/a.btn.btn-neutral.float-right {/a.btn.btn-neutral.float-right {background-color: #333666!important; border: 1px solid rgb(229, 235, 235) !important; border-radius: 6px; /g' build/html/_static/css/theme.css
sed -i 's/.wy-table-responsive {/.wy-table-responsive {overflow: visible !important;/g' build/html/_static/css/theme.css
sed -i 's/h2,/h2 {text-align:left!important;} h2,/g' build/html/_static/css/theme.css
sed -i 's/.rst-content img{/ @media all and (min-width: 680px) { .rst-content img {margin-left:24px!important;} } .rst-content img{ /g' build/html/_static/css/theme.css
sed -i 's/a:visited{color:#a3a3a3}/a:visited{color:#5F9EA0;}/g' build/html/_static/css/theme.css
sed -i 's/initial;/lightgrey;/g' build/html/_static/css/theme.css
sed -i 's/color:#333650/color:lightgrey/g' build/html/_static/css/theme.css
sed -i 's/;color:#2980b9/;color:lightskyblue/g' build/html/_static/css/theme.css
sed -i 's/#333;/#fff;/g' build/html/_static/css/theme.css
sed -i 's/background-color:#2980b9;/background-color:#333666;/g' build/html/_static/css/theme.css
sed -i 's/#bdbdbd/#333687/g' build/html/_static/css/theme.css
sed -i 's/#e3e3e3/transparent/g' build/html/_static/css/theme.css
sed -i 's/color:initial}/color:lightgrey;}/g' build/html/_static/css/theme.css
sed -i 's/a,.wy-side-nav-search>a{color:-webkit-gradient(radial,50% 50%,450,50% 55%,60,from(#333650),to(#333666));/a,.wy-side-nav-search>a{color:lightskyblue;/g' build/html/_static/css/theme.css
sed -i 's/#29808A/lightskyblue/g' build/html/_static/css/theme.css
sed -i 's/#2980b9/lightskyblue/g' build/html/_static/css/theme.css
sed -i 's/#2472a4/darkgrey/g' build/html/_static/css/theme.css
sed -i 's/#ddd/#333666/g' build/html/_static/css/theme.css
sed -i 's/border-radius:50px;padding:6px 12px;border-color:darkgrey/border-radius:50px;padding:6px 12px;border-color:darkgrey;background-color:#333666;color: lightgray; letter-spacing: 0.05em;/g' build/html/_static/css/theme.css
sed -i 's/#ccc/#333666/g' build/html/_static/css/theme.css
sed -i 's/darkgrey/darkgrey/g' build/html/_static/css/theme.css
sed -i 's/.rst-content blockquote{margin-left:24px/.rst-content blockquote{margin-left:2.5px/g' build/html/_static/css/theme.css
sed -i 's/#999/darkgrey/g' build/html/_static/css/theme.css
sed -i 's/#666/darkgrey/g' build/html/_static/css/theme.css
sed -i 's/#e74c3c/darkgrey/g' build/html/_static/css/theme.css
sed -i 's/background-color: rgb(41, 128, 185);/background-color:#333666/g' build/html/_static/css/theme.css
sed -i 's/.wy-side-nav-search .wy-dropdown>a,.wy-side-nav-search>a{color:lightskyblue;/.wy-side-nav-search .wy-dropdown>a,.wy-side-nav-search>a{color:lightslategrey;/g' build/html/_static/css/theme.css
sed -i 's/}*,:after,:before{/}div#document-author-s { color: rgba(255,255,255,0.14); font-size: 75%; margin-top: 4em;}*,:after,:before{/g' build/html/_static/css/theme.css
sed -i 's/background:lightskyblue;/background:#333666;/g' build/html/_static/css/theme.css
sed -i 's/background-color:lightskyblue;/background-color:#333666;/g' build/html/_static/css/theme.css
sed -i 's/#3091d1/lightgreen!important/g' build/html/_static/css/theme.css
sed -i 's/a:visited{color:lightskyblue/a:visited{color:darkgrey/g' build/html/_static/css/theme.css
sed -i 's/background:hsla(0,0%,100%,.1)}.wy-side-nav-search/background:transparent}.wy-side-nav-search/g' build/html/_static/css/theme.css
sed -i 's/)}.wy-nav-top/)}.wy-breadcrumbs{visibility:hidden!important;}.wy-nav-top/g' build/html/_static/css/theme.css
sed -i 's/li{list-style:disc}.wy-breadcrumbs{/li{list-style:disc}.wy-breadcrumbs{position:fixed;width:81%;display:block;height:55px;margin-left:-55px;padding-left:50px;margin-top:-50px;padding-top:14px;background:-webkit-gradient(radial,56%10%,300,188%120%,132,from(#333664),to(transparent));visibility:visible;/g' build/html/_static/css/theme.css
sed -i 's/.wy-nav-top{width:100vw/.wy-nav-top{width:105vw;border-top:2px solid #333666;top:-2px;/g' build/html/_static/css/theme.css
sed -i 's/.wy-grid-for-nav{position:absolute;width:100%;height:100%}/.wy-grid-for-nav{position:absolute;min-width:100vw;width:100%;display:contents;height:100%;}/g' build/html/_static/css/theme.css
sed -i 's/.wy-nav-top i{font-size:30px;/.wy-nav-top i{font-size:30px;margin-top: 5px!important; margin-left: 10px;/g' build/html/_static/css/theme.css
sed -i 's/footer{color:grey}/footer{color:white;}/g' build/html/_static/css/theme.css
sed -i 's/&copy;/<span class="copy-left">&copy;/g' build/html/*.html
sed -i 's/&copy;/&copy;<\/span>/g' build/html/*.html
sed -i 's/&copy; Copyright/ /g' build/html/*.html
sed -i 's/span>copy;/span> /g' build/html/*.html
sed -i 's/;copy;/ /g' build/html/*.html
sed -i 's/2021, DATRO Consortium/ /g' build/html/*.html
sed -i 's/Copyright/  <b style="font-color:darkgrey!important;font-weight:lighter;font-size:90%;font-style:italic;"><strong>2021 DATRO<\/strong> Consortium<\/b> | datro.xyz/g' build/html/*.html
sed -i 's/ datro.xyz/ <a href="https:\/\/datro.xyz" target="_popup">datro.xyz<\/a>/g' build/html/*.html
sed -i 's/}article/}.copy-left{display:inline-block;text-align:right;margin:0;font-weight:bolder!important;font-size:99.99%;-moz-transform:scaleX(-1);-o-transform:scaleX(-1);-webkit-transform:scaleX(-1);transform:scaleX(-1);filter:FlipH;-ms-filter:FlipH}article/g' build/html/_static/css/theme.css
sed -i 's/footer p{/footer p{font-size:122%;margin-bottom:0px;/g' build/html/*.html
sed -i 's/placeholder="Search docs"/placeholder="Search docs" class="placeholder-final"/g' build/html/*.html
sed -i 's/li{list-style:disc}.wy-breadcrumbs/li{list-style:disc}input.placeholder-final::placeholder{color:darkgrey;}input.placeholder-final:focus::placeholder { color: transparent;}.wy-breadcrumbs/g' build/html/_static/css/theme.css
sed -i 's/role="contentinfo"/role="contentinfo" style="opacity:0.4;"/g' build/html/*.html
sed -i 's/placeholder="Search docs"/placeholder="Search"/g' build/html/*.html
sed -i 's/Built with/<div style="opacity:0.3;font-size:76%;">Built with/g' build/html/*.html
sed -i 's/Read the Docs<\/a>./Read the Docs<\/a><\/div>/g' build/html/*.html
sed -i 's/.wy-nav-top a{color:#fff;font-weight:700/.wy-nav-top a{color:#fff;font-weight:700;font-size:75%;margin-left:-56px;/g' build/html/_static/css/theme.css
sed -i 's/thead{color:#000;/thead{color:#fff;/g' build/html/_static/css/theme.css
sed -i 's/caption{color:#000;/caption{color:#fff;/g' build/html/_static/css/theme.css
sed -i 's/.rst-content code,.rst-content tt,code{white-space:unset;font-weight:800!important;max-width:100%;border:3px solid transparent;font-size:75%;padding: 0 5px;color:#FFF;overflow-x:auto;background:#333654;max-width:100%;background:#fff;border:1px solid #e1e4e5;font-size:75%;padding:0 5px;font-family:SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,Courier,monospace;color:darkgrey;overflow-x:auto}/.rst-content code,.rst-content tt,code{white-space:unset;font-weight:800!important;max-width:100%;border:3px solid transparent;font-size:75%;padding: 0 5px;color:#FFF;overflow-x:auto;background:#333654;}/g' build/html/_static/css/theme.css
sed -i 's/.rst-content .section>a>img,.rst-content .section>img{/.rst-content .section>a>img,.rst-content .section>img{filter:brightness(0.8)invert(0.95)hue-rotate(-164deg);/g' build/html/_static/css/theme.css

exit 0
