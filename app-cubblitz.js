document.addEventListener('DOMContentLoaded',function(){
  'use strict';

  // mobile nav toggle
  var toggle=document.getElementById('nav-toggle');
  var nav=document.getElementById('nav');
  if(toggle){ toggle.addEventListener('click',function(){ nav.classList.toggle('open'); }); }

  // CV toggle
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

  // scroll-reveal with IntersectionObserver
  if('IntersectionObserver' in window){
    var observer=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){ entry.target.classList.add('visible'); }
      });
    },{ threshold:0.15 });
    document.querySelectorAll('.reveal').forEach(function(el){ observer.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('visible'); });
  }

// Cubblitz shooter game
  var canvas=document.getElementById('game-canvas');
  var scoreLabel=document.getElementById('game-score');
  var livesLabel=document.getElementById('game-lives');
  var statusLabel=document.getElementById('game-status');
  var startBtn=document.getElementById('game-start');
  var resetBtn=document.getElementById('game-reset');
  if(canvas && scoreLabel && livesLabel && statusLabel && startBtn && resetBtn){
    var ctx=canvas.getContext('2d');
    var W=canvas.width;
    var H=canvas.height;
    var keys={left:false,right:false,shoot:false};
    var player={x:W/2-18,y:H-48,w:36,h:16,speed:5};
    var bullets=[];
    var enemies=[];
    var enemyBullets=[];
    var stars=[];
    for(var si=0;si<60;si++){ stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.5+0.5,s:Math.random()*0.3+0.1}); }
    var frame=0,level=1,score=0,lives=5,gameOver=true,gameStarted=false,shootCooldown=0;

    // high scores
    var highScores=[];
    try{ var stored=localStorage.getItem('eliascubbage_highscores'); if(stored){ highScores=JSON.parse(stored); } }catch(e){}
    function saveHighScores(){ try{ localStorage.setItem('eliascubbage_highscores',JSON.stringify(highScores)); }catch(e){} }
    function renderHighScores(){
      var list=document.getElementById('highscore-list');
      if(!list) return;
      var lis=list.querySelectorAll('li');
      for(var i=0;i<3;i++){
        var hs=highScores[i];
        var isp=lis[i].querySelector('.hs-initials');
        var ssp=lis[i].querySelector('.hs-score');
        if(hs){ isp.textContent=hs.i; ssp.textContent=hs.s; }
        else { isp.textContent='---'; ssp.textContent='0'; }
      }
    }
    function checkHighScore(sc){ for(var i=0;i<3;i++){ if(!highScores[i]||sc>highScores[i].s) return i; } return -1; }
    function addHighScore(initials,sc){
      var idx=checkHighScore(sc); if(idx<0) return;
      var entry={i:initials.toUpperCase().substring(0,4),s:sc};
      highScores.splice(idx,0,entry); if(highScores.length>3) highScores.length=3;
      saveHighScores(); renderHighScores();
    }
    renderHighScores();

    function setStatus(t){ statusLabel.textContent=t; }
    function setLabels(){ scoreLabel.textContent=score; livesLabel.textContent=lives; }

    // enemy types
    var enemyTypes=[
      {w:28,h:16,bodyColor:'hsl(180,70%,55%)',coreColor:'hsl(180,50%,35%)',shape:'diamond'},
      {w:32,h:14,bodyColor:'hsl(40,80%,55%)',coreColor:'hsl(40,60%,35%)',shape:'wide'},
      {w:24,h:20,bodyColor:'hsl(280,60%,55%)',coreColor:'hsl(280,50%,35%)',shape:'tall'},
      {w:30,h:18,bodyColor:'hsl(0,70%,55%)',coreColor:'hsl(0,50%,35%)',shape:'arrow'}
    ];

    function spawnWave(){
      enemies=[];
      var rows=2+Math.min(level,4);
      var cols=6;
      for(var row=0;row<rows;row++){
        for(var col=0;col<cols;col++){
          var typeIdx=(row+col)%enemyTypes.length;
          var t=enemyTypes[typeIdx];
          var baseX=20+col*52;
          var baseY=20+row*30;
          var pattern=Math.floor(Math.random()*3);
          enemies.push({
            x:baseX,y:baseY,w:t.w,h:t.h,
            bodyColor:t.bodyColor,coreColor:t.coreColor,shape:t.shape,
            alive:true,
            baseX:baseX,baseY:baseY,
            pattern:pattern,
            phase:Math.random()*Math.PI*2,
            speed:0.3+level*0.05,
            shootTimer:60+Math.floor(Math.random()*120),
            descent:0,
            descending:true
          });
        }
      }
    }

    function startGame(){
      player.x=W/2-18; bullets=[]; enemyBullets=[]; frame=0; level=1; score=0; lives=5;
      gameOver=false; gameStarted=true; shootCooldown=0;
      spawnWave(); setLabels(); setStatus('Use arrows and Space to shoot.');
    }

    function stopGame(){
      gameStarted=false; gameOver=true; setLabels();
    }

    // profanity filter
    var badWords=['fuck','shit','ass','bitch','cunt','dick','piss','cock','fag','slut','whore','bastard','damn','crap','penis','vagina','porn','xxx','fuk','fuq','sht','btch'];
    function isClean(str){
      var lower=str.toLowerCase();
      for(var bi=0;bi<badWords.length;bi++){ if(lower.indexOf(badWords[bi])>=0) return false; }
      return true;
    }

    function promptInitials(){
      var overlay=document.getElementById('initials-overlay');
      var input=document.getElementById('initials-input');
      var submitBtn=document.getElementById('initials-submit');
      if(!overlay||!input||!submitBtn) return;
      overlay.classList.add('open');
      input.value=''; input.focus();
      function saveAndClose(){
        var val=input.value.trim().toUpperCase().substring(0,4);
        if(val.length<1){ input.focus(); return; }
        if(!isClean(val)){ setStatus('Please choose different initials.'); overlay.classList.remove('open'); submitBtn.removeEventListener('click',saveAndClose); window.removeEventListener('keydown',keyHandler); return; }
        addHighScore(val,score);
        overlay.classList.remove('open');
        submitBtn.removeEventListener('click',saveAndClose);
        window.removeEventListener('keydown',keyHandler);
      }
      function keyHandler(e){
        if(e.key==='Enter'){ saveAndClose(); }
        if(e.key==='Escape'){ overlay.classList.remove('open'); submitBtn.removeEventListener('click',saveAndClose); window.removeEventListener('keydown',keyHandler); }
      }
      submitBtn.addEventListener('click',saveAndClose);
      window.addEventListener('keydown',keyHandler);
    }

    // drawing
    function drawStars(){
      stars.forEach(function(s){
        s.y+=s.s; if(s.y>H){ s.y=-2; s.x=Math.random()*W; }
        ctx.fillStyle='rgba(255,255,255,'+(0.3+s.r*0.2)+')';
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();
      });
    }

    function drawPlayer(){
      var px=player.x,py=player.y,pw=player.w,ph=player.h;
      ctx.fillStyle='#4a6fa5'; ctx.fillRect(px+4,py-10,pw-8,ph+10);
      ctx.fillStyle='#3a5a8a'; ctx.fillRect(px,py+2,pw,ph-6);
      ctx.fillStyle='#2a4a7a'; ctx.fillRect(px-4,py+4,4,ph-8); ctx.fillRect(px+pw,py+4,4,ph-8);
      ctx.fillStyle='#8ae2ff'; ctx.fillRect(px+10,py-14,pw-20,6);
      if(gameStarted&&!gameOver){
        ctx.fillStyle='rgba(255,180,50,'+(0.4+Math.sin(frame*0.2)*0.2)+')';
        ctx.fillRect(px+8,py+ph-2,pw-16,5);
      }
    }

    function drawEnemy(e){
      var cx=e.x+e.w/2, cy=e.y+e.h/2;
      ctx.fillStyle=e.bodyColor;
      if(e.shape==='diamond'){
        ctx.beginPath();
        ctx.moveTo(cx,e.y); ctx.lineTo(e.x+e.w,cy); ctx.lineTo(cx,e.y+e.h); ctx.lineTo(e.x,cy);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle=e.coreColor;
        ctx.beginPath();
        ctx.moveTo(cx,e.y+4); ctx.lineTo(e.x+e.w-4,cy); ctx.lineTo(cx,e.y+e.h-4); ctx.lineTo(e.x+4,cy);
        ctx.closePath(); ctx.fill();
      } else if(e.shape==='wide'){
        ctx.fillRect(e.x,e.y,e.w,e.h);
        ctx.fillStyle=e.coreColor;
        ctx.fillRect(e.x+4,e.y+3,e.w-8,e.h-6);
      } else if(e.shape==='tall'){
        ctx.fillRect(e.x+4,e.y,e.w-8,e.h);
        ctx.fillStyle=e.coreColor;
        ctx.fillRect(e.x+8,e.y+4,e.w-16,e.h-8);
      } else if(e.shape==='arrow'){
        ctx.beginPath();
        ctx.moveTo(cx,e.y); ctx.lineTo(e.x+e.w,cy); ctx.lineTo(cx,e.y+e.h); ctx.lineTo(e.x,cy);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle=e.coreColor;
        ctx.fillRect(e.x+6,cy-3,e.w-12,6);
      }
      ctx.fillStyle='#ffe066';
      ctx.fillRect(e.x+6,e.y+3,4,4);
      ctx.fillRect(e.x+e.w-10,e.y+3,4,4);
    }

    function drawEnemies(){
      enemies.forEach(function(e){ if(e.alive) drawEnemy(e); });
    }

    function drawBullets(){
      bullets.forEach(function(b){
        ctx.fillStyle='#8ae2ff';
        ctx.fillRect(b.x,b.y,b.w,b.h);
        ctx.fillStyle='rgba(138,226,255,0.3)';
        ctx.fillRect(b.x-1,b.y+b.h,b.w+2,8);
      });
    }

    function drawEnemyBullets(){
      enemyBullets.forEach(function(b){
        ctx.fillStyle='#ff6644';
        ctx.fillRect(b.x,b.y,b.w,b.h);
        ctx.fillStyle='rgba(255,102,68,0.3)';
        ctx.fillRect(b.x-1,b.y-8,b.w+2,8);
      });
    }

    // update logic
    function updateEnemies(){
      enemies.forEach(function(e){
        if(!e.alive) return;
        if(e.descending && e.y<80+Math.floor(e.baseY/30)*20){
          e.y+=0.8;
        } else {
          e.descending=false;
        }
        if(!e.descending){
          var t=frame*0.02+e.phase;
          if(e.pattern===0){
            e.x=e.baseX+Math.sin(t*2)*30;
            e.y=e.baseY+Math.sin(t)*15;
          } else if(e.pattern===1){
            e.x=e.baseX+Math.sin(t)*25;
            e.y=e.baseY+Math.cos(t*1.5)*20;
          } else if(e.pattern===2){
            e.x=e.baseX+Math.sin(t*3)*35;
            e.y=e.baseY+Math.abs(Math.sin(t*2))*18;
          }
        }
        if(!e.descending && Math.random()<0.02 && frame%60<10){
          enemyBullets.push({x:e.x+e.w/2-2,y:e.y+e.h,w:4,h:8,speed:2+level*0.2});
        }
        if(e.y>H+20){
          e.y=-30;
          e.baseY=-30;
          e.descending=true;
        }
      });
    }

    function updateBullets(){
      bullets=bullets.filter(function(b){ return b.y>-10; });
      bullets.forEach(function(b){ b.y-=b.speed; });
      bullets.forEach(function(b){
        enemies.forEach(function(e){
          if(e.alive&&b.x<e.x+e.w&&b.x+b.w>e.x&&b.y<e.y+e.h&&b.y+b.h>e.y){
            e.alive=false; b.hit=true; score+=10; setLabels();
          }
        });
      });
      bullets=bullets.filter(function(b){ return !b.hit; });
    }

    function handleGameOver(){
      gameOver=true; gameStarted=false;
      setStatus('Game over - score: '+score);
      if(checkHighScore(score)>=0) setTimeout(function(){promptInitials();},400);
    }

    function updateEnemyBullets(){
      enemyBullets=enemyBullets.filter(function(b){ return b.y<H+10; });
      enemyBullets.forEach(function(b){ b.y+=b.speed; });
      enemyBullets.forEach(function(b){
        if(b.x<player.x+player.w&&b.x+b.w>player.x&&b.y<player.y+player.h&&b.y+b.h>player.y){
          b.hit=true;
          lives-=1; setLabels();
          if(lives<=0){ handleGameOver(); }
          else { setStatus('Hit! Lives left: '+lives); }
        }
      });
      enemyBullets=enemyBullets.filter(function(b){ return !b.hit; });
    }

    function fireBullet(){
      if(shootCooldown>0) return;
      bullets.push({x:player.x+player.w/2-2,y:player.y-14,w:4,h:10,speed:7});
      shootCooldown=10;
    }

    function updatePlayer(){
      if(keys.left&&player.x>8) player.x-=player.speed;
      if(keys.right&&player.x+player.w<W-8) player.x+=player.speed;
      if(keys.shoot) fireBullet();
      if(shootCooldown>0) shootCooldown-=1;
    }

    function updateFrame(){
      if(!gameStarted||gameOver) return;
      updatePlayer();
      updateBullets();
      updateEnemyBullets();
      updateEnemies();
      if(enemies.every(function(e){ return !e.alive; })){
        level+=1;
        setStatus('Wave cleared! Level '+level);
        spawnWave();
      }
      if(lives<=0){ handleGameOver(); }
      frame+=1;
    }

    function drawFrame(){
      ctx.clearRect(0,0,W,H);
      drawStars();
      drawPlayer();
      drawEnemies();
      drawBullets();
      drawEnemyBullets();
      ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.lineWidth=1;
      ctx.strokeRect(2,2,W-4,H-4);
      ctx.fillStyle='rgba(255,255,255,0.06)';
      ctx.fillRect(0,H-20,W,20);
      ctx.fillStyle='#9e9e9e'; ctx.font='11px Inter, system-ui, sans-serif';
      ctx.fillText('Level '+level,10,H-8);
    }

    function loop(){ updateFrame(); drawFrame(); requestAnimationFrame(loop); }
    loop();

    window.addEventListener('keydown',function(e){
      if(e.key==='ArrowLeft'||e.key==='a'){ keys.left=true; }
      if(e.key==='ArrowRight'||e.key==='d'){ keys.right=true; }
      if(e.key===' '||e.key==='Spacebar'){
        e.preventDefault();
        if(!gameStarted||gameOver){ startGame(); }
        else { keys.shoot=true; }
      }
    });
    window.addEventListener('keyup',function(e){
      if(e.key==='ArrowLeft'||e.key==='a'){ keys.left=false; }
      if(e.key==='ArrowRight'||e.key==='d'){ keys.right=false; }
      if(e.key===' '||e.key==='Spacebar'){ keys.shoot=false; }
    });

    startBtn.addEventListener('click',function(){
      if(!gameStarted||gameOver) startGame();
      else setStatus('Game is already running.');
    });
    resetBtn.addEventListener('click',stopGame);
    stopGame();
  }

  // smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click',function(e){
      var href=a.getAttribute('href');
      if(href.length>1){
        var el=document.querySelector(href);
        if(el){ e.preventDefault(); el.scrollIntoView({behavior:'smooth',block:'start'}); if(nav){ nav.classList.remove('open'); } }
      }
    });
  });
});