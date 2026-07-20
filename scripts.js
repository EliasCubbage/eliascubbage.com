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

  // mini game
  var guessInput=document.getElementById('guess-input');
  var guessBtn=document.getElementById('guess-btn');
  var resetGame=document.getElementById('reset-game');
  var gameFeedback=document.getElementById('game-feedback');
  var attemptsDisplay=document.getElementById('attempts');
  var secretNumber=Math.floor(Math.random()*10)+1;
  var attempts=0;

  function resetGameState(){
    secretNumber=Math.floor(Math.random()*10)+1;
    attempts=0;
    if(attemptsDisplay){ attemptsDisplay.textContent='0'; }
    if(gameFeedback){ gameFeedback.textContent='Pick a number to start.'; }
    if(guessInput){ guessInput.value=''; guessInput.focus(); }
  }

  if(guessBtn && guessInput && gameFeedback && attemptsDisplay && resetGame){
    guessBtn.addEventListener('click', function(){
      var guess=parseInt(guessInput.value,10);
      if(isNaN(guess) || guess < 1 || guess > 10){
        gameFeedback.textContent='Please enter a number from 1 to 10.';
        return;
      }
      attempts += 1;
      attemptsDisplay.textContent=attempts;
      if(guess === secretNumber){
        gameFeedback.textContent='Correct! You found the secret number.';
      } else if(guess < secretNumber){
        gameFeedback.textContent='Too low — try a higher number.';
      } else {
        gameFeedback.textContent='Too high — try a lower number.';
      }
    });

    guessInput.addEventListener('keydown', function(e){
      if(e.key==='Enter'){ e.preventDefault(); guessBtn.click(); }
    });

    resetGame.addEventListener('click', resetGameState);
    resetGameState();
  }

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
