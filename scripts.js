document.addEventListener('DOMContentLoaded',function(){
  // splash overlay behavior
  var splash=document.getElementById('splash');
  var enter=document.getElementById('enter-site');
  var splashHidden=false;
  function hideSplash(){
    if(!splash || splashHidden) return; splashHidden=true;
    splash.classList.add('splash-hidden');
    document.body.classList.remove('no-scroll');
    setTimeout(function(){ if(splash) splash.style.display='none'; },450);
  }
  if(splash){
    // prevent scroll while visible
    document.body.classList.add('no-scroll');
    // auto-hide after a short delay if user doesn't interact
    var auto=setTimeout(hideSplash, 1800);
    if(enter){ enter.addEventListener('click',function(){ clearTimeout(auto); hideSplash(); }); }
    // allow escape to skip
    document.addEventListener('keydown',function(e){ if(e.key==='Escape') { clearTimeout(auto); hideSplash(); } });
  }
  var toggle=document.getElementById('nav-toggle');
  var nav=document.getElementById('nav');
  toggle.addEventListener('click',function(){
    nav.classList.toggle('open');
  });
  // dynamic year
  var y=document.getElementById('year'); if(y) y.textContent=new Date().getFullYear();
  // smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click',function(e){
      var href=a.getAttribute('href');
      if(href.length>1){
        var el=document.querySelector(href); if(el){ e.preventDefault(); el.scrollIntoView({behavior:'smooth',block:'start'}); nav.classList.remove('open'); }
      }
    });
  });
});
