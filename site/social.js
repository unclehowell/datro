/* social.js — "See more / See less" on long posts, and opening a post's Source from #id links. — Sion's Tab agent */
(function(){
  function wire(){
    document.querySelectorAll(".sp-b.clamp").forEach(function(b){
      var btn=b.nextElementSibling; if(!btn||!btn.classList.contains("sp-more"))return;
      b.classList.add("closed");
      if(b.scrollHeight<=b.clientHeight+8){b.classList.remove("closed");return;}
      btn.hidden=false; btn.setAttribute("aria-expanded","false");
      btn.addEventListener("click",function(){var open=b.classList.toggle("closed")===false;btn.textContent=open?"See less":"See more";btn.setAttribute("aria-expanded",open?"true":"false");if(!open)b.closest("article").scrollIntoView({block:"nearest"});});
    });
  }
  // keep the quoted comments right under Like · Comment · Share once comments.js has drawn its bar
  function place(){document.querySelectorAll("article.sp").forEach(function(a){var q=a.querySelector(":scope > .sp-qc"),ac=a.querySelector(".fbc-acts");if(q&&ac&&ac.nextElementSibling!==q){ac.parentNode.insertBefore(q,ac.nextSibling);}});}
  var mo=new MutationObserver(function(){place();});
  function obs(){mo.observe(document.body,{childList:true,subtree:true});setTimeout(function(){mo.disconnect();},15000);place();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",obs);else obs();
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",wire);else wire();
})();
