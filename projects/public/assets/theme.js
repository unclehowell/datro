// nav goes solid once the page scrolls past the top
(function(){var n=document.querySelector('.sl-nav');if(!n)return;function f(){n.classList.toggle('is-solid',window.scrollY>24)}f();window.addEventListener('scroll',f,{passive:true})})();
