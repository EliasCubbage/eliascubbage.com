document.addEventListener('DOMContentLoaded',function(){
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
