document.addEventListener('DOMContentLoaded',function(){
  var toggle=document.getElementById('nav-toggle');
  var nav=document.getElementById('nav');
  if(toggle){ toggle.addEventListener('click',function(){ nav.classList.toggle('open'); }); }

  var cvToggle=document.querySelector('.cv-toggle');
  var cvPanel=document.querySelector('.cv-panel');
  if(cvToggle && cvPanel){
    cvToggle.addEventListener('click',function(){
      var expanded=cvToggle.getAttribute('aria-expanded')==='true';
      cvToggle.setAttribute('aria-expanded', String(!expanded));
      cvPanel.hidden=expanded;
      cvToggle.textContent=expanded ? 'View full CV' : 'Hide CV';
    });
  }

  // dynamic year
  var y=document.getElementById('year'); if(y) y.textContent=new Date().getFullYear();
  // smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click',function(e){
      var href=a.getAttribute('href');
      if(href.length>1){
        var el=document.querySelector(href); if(el){ e.preventDefault(); el.scrollIntoView({behavior:'smooth',block:'start'}); if(nav){ nav.classList.remove('open'); } }
      }
    });
  });
});
