// fcg.bucklerfamily.estate theme script: the nav turns solid on scroll (as on projects.bucklerfamily.estate), and inline colours
// carried over from the source pages are re-toned so no text ends up dark-on-black.
(function(){var n=document.querySelector('.sl-nav');if(n){var f=function(){n.classList.toggle('is-solid',window.scrollY>24)};f();window.addEventListener('scroll',f,{passive:true})}
function rgb(s){var m=/rgba?\(([^)]+)\)/.exec(s||'');if(!m)return null;var p=m[1].split(',').map(parseFloat);return{r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1}}
function lum(c){function ch(v){v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)}return .2126*ch(c.r)+.7152*ch(c.g)+.0722*ch(c.b)}
function bgOf(el){while(el&&el.nodeType===1){var c=rgb(getComputedStyle(el).backgroundColor);if(c&&c.a>.5)return c;el=el.parentElement}return{r:0,g:0,b:0,a:1}}
var root=document.querySelector('.content');if(!root)return;var els=root.querySelectorAll('[style],font,span,td,th,p,li,a,strong,em,div');var max=6000;
for(var i=0;i<els.length&&i<max;i++){var el=els[i];if(!el.firstChild)continue;var cs=getComputedStyle(el);var fg=rgb(cs.color);if(!fg)continue;var bg=bgOf(el);var lf=lum(fg),lb=lum(bg);var hi=Math.max(lf,lb),lo=Math.min(lf,lb);if((hi+.05)/(lo+.05)<3){el.style.setProperty('color',lb<.4?'#d4d4d4':'#212529','important')}}
})();
