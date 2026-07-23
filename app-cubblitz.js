document.addEventListener('DOMContentLoaded',function(){
  'use strict';

  // mobile nav toggle
  var toggle=document.getElementById('nav-toggle');
  var nav=document.getElementById('nav');
  if(toggle){ toggle.addEventListener('click',function(){ nav.classList.toggle('open'); }); }

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

  // ===== CUBBLITZ GAME =====
  var canvas=document.getElementById('game-canvas');
  var scoreLabel=document.getElementById('game-score');
  var livesLabel=document.getElementById('game-lives');
  var levelLabel=document.getElementById('game-level');
  var statusLabel=document.getElementById('game-status');
  var startBtn=document.getElementById('game-start');
  var pauseBtn=document.getElementById('game-pause');
  var resetBtn=document.getElementById('game-reset');
  var muteBtn=document.getElementById('game-mute');
  var overlay=document.getElementById('game-overlay');
  var overlayTitle=document.getElementById('overlay-title');
  var overlayText=document.getElementById('overlay-text');
  var overlayBtn=document.getElementById('overlay-btn');

  if(canvas && scoreLabel && livesLabel && statusLabel && startBtn && resetBtn){
    var ctx=canvas.getContext('2d');
    // Make canvas bigger
    canvas.width=540;
    canvas.height=750;
    var W=canvas.width;
    var H=canvas.height;

    // game state
    var keys={left:false,right:false,shoot:false};
    var player={x:W/2-18,y:H-48,w:36,h:16,speed:5,invuln:0,powerType:null,powerTimer:0,powerType2:null,powerTimer2:0};
    var bullets=[];
    var enemies=[];
    var enemyBullets=[];
    var particles=[];
    var powerups=[];
    var stars=[];
    var floatTexts=[];

    // init starfield
    for(var si=0;si<80;si++){
      stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.5+0.5,s:Math.random()*0.6+0.1,tw:Math.random()*Math.PI*2});
    }

    var frame=0,level=1,score=0,lives=3,gameOver=true,gameStarted=false,gamePaused=false,shootCooldown=0,shake=0,combo=0,comboTimer=0,playerExploding=false,playerExplodeTimer=0;
    // formation and dive state (Galaga-style lockstep)
    var formationX=0, formationY=0, diveCountdown=0;

    // ===== AUDIO (Web Audio API) =====
    var audioCtx=null,muted=false;
    function initAudio(){
      if(!audioCtx){
        try{ audioCtx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ audioCtx=null; }
      }
    }
    function beep(freq,dur,type,vol){
      if(muted||!audioCtx) return;
      try{
        var osc=audioCtx.createOscillator();
        var gain=audioCtx.createGain();
        osc.type=type||'square';
        osc.frequency.value=freq;
        gain.gain.setValueAtTime(vol||0.08,audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+dur);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime+dur);
      }catch(e){}
    }
    function sfxShoot(){ beep(880,0.06,'square',0.04); }
    function sfxHit(){ beep(220,0.12,'sawtooth',0.06); }
    function sfxExplode(){ beep(80,0.25,'sawtooth',0.1); setTimeout(function(){beep(60,0.15,'sawtooth',0.08);},40); }
    function sfxPlayerHit(){ beep(150,0.3,'sawtooth',0.12); }
    function sfxPowerup(){ beep(660,0.08,'sine',0.08); setTimeout(function(){beep(990,0.1,'sine',0.08);},60); }
    function sfxWaveClear(){ beep(523,0.1,'sine',0.08); setTimeout(function(){beep(659,0.1,'sine',0.08);},100); setTimeout(function(){beep(784,0.15,'sine',0.08);},200); }
    function sfxGameOver(){ beep(440,0.2,'sawtooth',0.1); setTimeout(function(){beep(330,0.2,'sawtooth',0.1);},200); setTimeout(function(){beep(220,0.4,'sawtooth',0.1);},400); }

    // ===== HIGH SCORES =====
    var GITHUB_TOKEN='';
    var GIST_ID='';
    try{
      if(window.CUBBLITZ_CONFIG){
        GITHUB_TOKEN=window.CUBBLITZ_CONFIG.githubToken||'';
        GIST_ID=window.CUBBLITZ_CONFIG.gistId||'';
      }
    }catch(e){}
    var cloudEnabled=!!(GITHUB_TOKEN && GIST_ID);
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
      var idx=checkHighScore(sc); if(idx<0) return false;
      var entry={i:initials.toUpperCase().substring(0,4),s:sc};
      highScores.splice(idx,0,entry); if(highScores.length>3) highScores.length=3;
      saveHighScores(); renderHighScores();
      // try cloud sync
      postToCloud();
      return true;
    }
    function postToCloud(){
      if(!cloudEnabled) return;
      try{
        var xhr=new XMLHttpRequest();
        xhr.open('PATCH','https://api.github.com/gists/'+GIST_ID,true);
        xhr.setRequestHeader('Authorization','token '+GITHUB_TOKEN);
        xhr.setRequestHeader('Content-Type','application/json');
        var payload={
          description:'Cubblitz high scores',
          files:{
            'scores.json':{
              content:JSON.stringify(highScores.slice(0,10),null,2)
            }
          }
        };
        xhr.send(JSON.stringify(payload));
      }catch(e){}
    }
    function syncFromCloud(){
      if(!cloudEnabled) return;
      try{
        var xhr=new XMLHttpRequest();
        xhr.open('GET','https://api.github.com/gists/'+GIST_ID,true);
        xhr.setRequestHeader('Authorization','token '+GITHUB_TOKEN);
        xhr.onreadystatechange=function(){
          if(xhr.readyState===4 && xhr.status===200){
            try{
              var gist=JSON.parse(xhr.responseText);
              var file=gist.files['scores.json'];
              if(file && file.content){
                var data=JSON.parse(file.content);
                if(Array.isArray(data) && data.length>0){
                  highScores=data.slice(0,3);
                  saveHighScores();
                }
              }
            }catch(e){}
            renderHighScores();
          }
        };
        xhr.send(null);
      }catch(e){}
    }
    renderHighScores();
    syncFromCloud();

    function setStatus(t){ statusLabel.textContent=t; }
    function setLabels(){ scoreLabel.textContent=score; livesLabel.textContent=lives; if(levelLabel) levelLabel.textContent=level; }

    // ===== OVERLAY =====
    function showOverlay(title,text,btnText){
      if(!overlay) return;
      if(overlayTitle) overlayTitle.textContent=title;
      if(overlayText) overlayText.textContent=text;
      if(overlayBtn) overlayBtn.textContent=btnText||'Start';
      overlay.classList.add('open');
    }
    function hideOverlay(){ if(overlay) overlay.classList.remove('open'); }

    // ===== ENEMY TYPES =====
    var enemyTypes=[
      {w:28,h:16,bodyColor:'hsl(180,70%,55%)',coreColor:'hsl(180,50%,35%)',shape:'diamond',hp:1,score:10},
      {w:32,h:14,bodyColor:'hsl(40,80%,55%)',coreColor:'hsl(40,60%,35%)',shape:'wide',hp:1,score:15},
      {w:24,h:20,bodyColor:'hsl(280,60%,55%)',coreColor:'hsl(280,50%,35%)',shape:'tall',hp:2,score:25},
      {w:30,h:18,bodyColor:'hsl(0,70%,55%)',coreColor:'hsl(0,50%,35%)',shape:'arrow',hp:1,score:20}
    ];

    function spawnWave(){
      enemies=[];
      var rows=2+Math.min(level,4);
      var cols=6;
      // More enemies per wave at higher levels
      if(level>3) cols=7;
      if(level>6) cols=8;
      for(var row=0;row<rows;row++){
        for(var col=0;col<cols;col++){
          var typeIdx=(row+col)%enemyTypes.length;
          var t=enemyTypes[typeIdx];
          var gridX=20+col*52;
          var gridY=20+row*30;
          enemies.push({
            x:gridX,y:gridY,w:t.w,h:t.h,
            bodyColor:t.bodyColor,coreColor:t.coreColor,shape:t.shape,
            alive:true,hp:t.hp,maxHp:t.hp,scoreVal:t.score,
            gridX:gridX,gridY:gridY,
            descending:true,
            hitFlash:0,
            // dive state
            diving:false,
            returning:false,
            diveTargetX:0,diveTargetY:0,
            diveSpeed:0,
            returnTimer:0
          });
        }
      }
      formationX=0;
      formationY=0;
      diveCountdown=120+Math.floor(Math.random()*60);
      // boss every 5 levels
      if(level%5===0){
        enemies.push({
          x:W/2-40,y:30,w:80,h:40,
          bodyColor:'hsl(0,80%,50%)',coreColor:'hsl(0,60%,30%)',shape:'boss',
          alive:true,hp:20+level*2,maxHp:20+level*2,scoreVal:200+level*10,
          baseX:W/2-40,baseY:30,
          phase:0,descending:false,hitFlash:0
        });
      }
    }

    // ===== PARTICLES =====
    function spawnExplosion(x,y,color,count){
      count=count||12;
      for(var i=0;i<count;i++){
        var ang=Math.random()*Math.PI*2;
        var sp=Math.random()*3+1;
        particles.push({
          x:x,y:y,
          vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,
          life:30+Math.random()*20,maxLife:50,
          color:color,size:Math.random()*3+1
        });
      }
    }
    function spawnFloatText(x,y,text,color){
      floatTexts.push({x:x,y:y,text:text,color:color||'#fff',life:40,vy:-1});
    }

    // ===== POWER-UPS =====
    var powerTypes=[
      {type:'rapid',color:'hsl(330,80%,60%)',label:'R'},
      {type:'spread',color:'hsl(100,70%,55%)',label:'S'},
      {type:'shield',color:'hsl(220,80%,60%)',label:'D'},
      {type:'life',color:'hsl(15,90%,65%)',label:'+'}
    ];
    function maybeSpawnPowerup(x,y){
      if(Math.random()<0.12){
        var pt=powerTypes[Math.floor(Math.random()*powerTypes.length)];
        powerups.push({x:x,y:y,w:16,h:16,vy:1.2,type:pt.type,color:pt.color,label:pt.label,phase:0});
      }
    }
    function applyPowerup(p){
      sfxPowerup();
      if(p.type==='rapid'){
        if(player.powerType==='spread'||player.powerType2==='spread'){
          // Stack: both rapid and spread active
          player.powerType='rapid';
          player.powerType2='spread';
          player.powerTimer=600;
          player.powerTimer2=600;
          spawnFloatText(player.x+player.w/2,player.y,'RAPID+SPREAD',p.color);
        } else {
          player.powerType='rapid';
          player.powerTimer=600;
          spawnFloatText(player.x+player.w/2,player.y,'RAPID FIRE',p.color);
        }
      }
      else if(p.type==='spread'){
        if(player.powerType==='rapid'||player.powerType2==='rapid'){
          // Stack: both rapid and spread active
          player.powerType='rapid';
          player.powerType2='spread';
          player.powerTimer=600;
          player.powerTimer2=600;
          spawnFloatText(player.x+player.w/2,player.y,'RAPID+SPREAD',p.color);
        } else {
          player.powerType='spread';
          player.powerTimer=600;
          spawnFloatText(player.x+player.w/2,player.y,'SPREAD SHOT',p.color);
        }
      }
      else if(p.type==='shield'){ player.invuln=180; spawnFloatText(player.x+player.w/2,player.y,'SHIELD',p.color); }
      else if(p.type==='life'){ lives=Math.min(lives+1,5); setLabels(); spawnFloatText(player.x+player.w/2,player.y,'+1 LIFE',p.color); }
    }

    // ===== GAME FLOW =====
    function startGame(){
      initAudio();
      player.x=W/2-18; player.invuln=0; player.powerType=null; player.powerTimer=0; player.powerType2=null; player.powerTimer2=0;
      bullets=[]; enemyBullets=[]; particles=[]; powerups=[]; floatTexts=[];
      frame=0; level=1; score=0; lives=3; combo=0; comboTimer=0;
      gameOver=false; gameStarted=true; gamePaused=false; shootCooldown=0; shake=0; playerExploding=false; playerExplodeTimer=0;
      spawnWave(); setLabels(); setStatus('Use arrows and Space to shoot.');
      hideOverlay();
      if(pauseBtn){ pauseBtn.disabled=false; pauseBtn.textContent='Pause'; }
    }
    function stopGame(){
      gameStarted=false; gameOver=true; gamePaused=false; setLabels();
      if(pauseBtn){ pauseBtn.disabled=true; }
    }
    function togglePause(){
      if(!gameStarted||gameOver) return;
      gamePaused=!gamePaused;
      if(pauseBtn) pauseBtn.textContent=gamePaused?'Resume':'Pause';
      if(gamePaused){ showOverlay('PAUSED','Press P or Resume to continue','Resume'); }
      else { hideOverlay(); }
    }
    function handleGameOver(){
      gameOver=true; gameStarted=false;
      sfxGameOver();
      // Big player explosion
      playerExploding=true;
      playerExplodeTimer=0;
      spawnExplosion(player.x+player.w/2,player.y+player.h/2,'#ff4d2a',30);
      spawnExplosion(player.x+player.w/2,player.y+player.h/2,'#ff9933',20);
      spawnExplosion(player.x+player.w/2,player.y+player.h/2,'#ffcc00',15);
      spawnExplosion(player.x+player.w/2,player.y+player.h/2,'#ffffff',10);
      shake=20;
      setStatus('Game over - score: '+score);
      if(pauseBtn){ pauseBtn.disabled=true; }
      setTimeout(function(){
        showOverlay('GAME OVER','Final Score: '+score,'Play Again');
        if(checkHighScore(score)>=0) setTimeout(function(){ promptInitials(); },600);
      },1000);
    }

    // ===== PROFANITY FILTER =====
    var badWords=['fuck','shit','ass','bitch','cunt','dick','piss','cock','fag','slut','whore','bastard','damn','crap','penis','vagina','porn','xxx','fuk','fuq','sht','btch'];
    function isClean(str){
      var lower=str.toLowerCase();
      for(var bi=0;bi<badWords.length;bi++){ if(lower.indexOf(badWords[bi])>=0) return false; }
      return true;
    }
    function promptInitials(){
      var ov=document.getElementById('initials-overlay');
      var input=document.getElementById('initials-input');
      var submitBtn=document.getElementById('initials-submit');
      if(!ov||!input||!submitBtn) return;
      ov.classList.add('open'); ov.hidden=false;
      input.value=''; input.focus();
      function saveAndClose(){
        var val=input.value.trim().toUpperCase().substring(0,4);
        if(val.length<1){ input.focus(); return; }
        if(!isClean(val)){ setStatus('Please choose different initials.'); ov.classList.remove('open'); ov.hidden=true; submitBtn.removeEventListener('click',saveAndClose); window.removeEventListener('keydown',keyHandler); return; }
        addHighScore(val,score);
        ov.classList.remove('open'); ov.hidden=true;
        submitBtn.removeEventListener('click',saveAndClose);
        window.removeEventListener('keydown',keyHandler);
      }
      function keyHandler(e){
        if(e.key==='Enter'){ e.preventDefault(); saveAndClose(); }
        if(e.key==='Escape'){ ov.classList.remove('open'); ov.hidden=true; submitBtn.removeEventListener('click',saveAndClose); window.removeEventListener('keydown',keyHandler); }
      }
      submitBtn.addEventListener('click',saveAndClose);
      window.addEventListener('keydown',keyHandler);
    }

    // ===== DRAWING =====
    function drawStars(){
      stars.forEach(function(s){
        s.y+=s.s; s.tw+=0.05;
        if(s.y>H){ s.y=-2; s.x=Math.random()*W; }
        var alpha=0.3+Math.abs(Math.sin(s.tw))*0.5;
        ctx.fillStyle='rgba(255,255,255,'+alpha+')';
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();
      });
    }

    function drawPlayer(){
      var px=player.x,py=player.y,pw=player.w,ph=player.h;
      // Don't draw player if exploding
      if(playerExploding) return;
      // shield aura
      if(player.invuln>0){
        ctx.fillStyle='rgba(138,226,255,'+(0.15+Math.sin(frame*0.3)*0.1)+')';
        ctx.beginPath(); ctx.arc(px+pw/2,py+ph/2,pw,0,Math.PI*2); ctx.fill();
      }
      ctx.fillStyle='#4a6fa5'; ctx.fillRect(px+4,py-10,pw-8,ph+10);
      ctx.fillStyle='#3a5a8a'; ctx.fillRect(px,py+2,pw,ph-6);
      ctx.fillStyle='#2a4a7a'; ctx.fillRect(px-4,py+4,4,ph-8); ctx.fillRect(px+pw,py+4,4,ph-8);
      ctx.fillStyle='#8ae2ff'; ctx.fillRect(px+10,py-14,pw-20,6);
      if(gameStarted&&!gameOver&&!gamePaused){
        ctx.fillStyle='rgba(255,180,50,'+(0.4+Math.sin(frame*0.2)*0.2)+')';
        ctx.fillRect(px+8,py+ph-2,pw-16,5);
      }
      // power-up indicator - show both if stacked
      if(player.powerType||player.powerType2){
        var pcol1=player.powerType==='rapid'?'hsl(330,80%,60%)':
          player.powerType==='spread'?'hsl(100,70%,55%)':
          'hsl(15,90%,65%)';
        var pcol2=player.powerType2==='rapid'?'hsl(330,80%,60%)':
          player.powerType2==='spread'?'hsl(100,70%,55%)':
          'hsl(15,90%,65%)';
        if(player.powerType){
          ctx.fillStyle=pcol1;
          ctx.fillRect(px+pw/2-3,py-18,6,4);
        }
        if(player.powerType2){
          ctx.fillStyle=pcol2;
          ctx.fillRect(px+pw/2-3,py-22,6,4);
        }
      }
    }

    function drawEnemy(e){
      var cx=e.x+e.w/2, cy=e.y+e.h/2;
      var col=e.hitFlash>0?'#ffffff':e.bodyColor;
      ctx.fillStyle=col;
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
        ctx.fillStyle=e.coreColor; ctx.fillRect(e.x+4,e.y+3,e.w-8,e.h-6);
      } else if(e.shape==='tall'){
        ctx.fillRect(e.x+4,e.y,e.w-8,e.h);
        ctx.fillStyle=e.coreColor; ctx.fillRect(e.x+8,e.y+4,e.w-16,e.h-8);
      } else if(e.shape==='arrow'){
        ctx.beginPath();
        ctx.moveTo(cx,e.y); ctx.lineTo(e.x+e.w,cy); ctx.lineTo(cx,e.y+e.h); ctx.lineTo(e.x,cy);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle=e.coreColor; ctx.fillRect(e.x+6,cy-3,e.w-12,6);
      } else if(e.shape==='boss'){
        ctx.fillRect(e.x,e.y,e.w,e.h);
        ctx.fillStyle=e.coreColor; ctx.fillRect(e.x+8,e.y+6,e.w-16,e.h-12);
        // boss hp bar
        ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.fillRect(e.x,e.y-8,e.w,4);
        ctx.fillStyle='hsl(0,70%,55%)'; ctx.fillRect(e.x,e.y-8,e.w*(e.hp/e.maxHp),4);
      }
      ctx.fillStyle='#ffe066';
      ctx.fillRect(e.x+6,e.y+3,4,4);
      ctx.fillRect(e.x+e.w-10,e.y+3,4,4);
      if(e.hitFlash>0) e.hitFlash--;
    }

    function drawEnemies(){ enemies.forEach(function(e){ if(e.alive) drawEnemy(e); }); }

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
    function drawParticles(){
      particles.forEach(function(p){
        var alpha=p.life/p.maxLife;
        ctx.globalAlpha=alpha;
        ctx.fillStyle=p.color;
        ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);
        ctx.globalAlpha=1;
      });
    }
    function drawFloatTexts(){
      floatTexts.forEach(function(f){
        ctx.globalAlpha=Math.min(1,f.life/30);
        ctx.fillStyle=f.color;
        ctx.font='bold 11px Inter, system-ui, sans-serif';
        ctx.textAlign='center';
        ctx.fillText(f.text,f.x,f.y);
        ctx.textAlign='left';
        ctx.globalAlpha=1;
      });
    }
    function drawPowerups(){
      powerups.forEach(function(p){
        p.phase+=0.1;
        var bob=Math.sin(p.phase)*2;
        var cx=p.x+p.w/2, cy=p.y+p.h/2+bob;
        ctx.fillStyle=p.color;
        ctx.globalAlpha=0.9;
        if(p.type==='rapid'){
          // diamond shape
          ctx.beginPath();
          ctx.moveTo(cx,p.y+bob);
          ctx.lineTo(p.x+p.w,cy);
          ctx.lineTo(cx,p.y+p.h+bob);
          ctx.lineTo(p.x,cy);
          ctx.closePath(); ctx.fill();
        } else if(p.type==='spread'){
          // triangle pointing down
          ctx.beginPath();
          ctx.moveTo(cx,p.y+bob);
          ctx.lineTo(p.x,p.y+p.h+bob);
          ctx.lineTo(p.x+p.w,p.y+p.h+bob);
          ctx.closePath(); ctx.fill();
        } else if(p.type==='shield'){
          // circle
          ctx.beginPath();
          ctx.arc(cx,cy,p.w/2,0,Math.PI*2);
          ctx.fill();
        } else if(p.type==='life'){
          // plus sign
          ctx.fillRect(p.x+5,p.y+bob+2,p.w-10,12);
          ctx.fillRect(p.x+2,p.y+bob+5,12,p.h-10);
        }
        ctx.fillStyle='#000';
        ctx.font='bold 11px Inter, system-ui, sans-serif';
        ctx.textAlign='center';
        ctx.fillText(p.label,cx,p.y+bob+p.h-5);
        ctx.textAlign='left';
        ctx.globalAlpha=1;
      });
    }

    // ===== UPDATE LOGIC =====
    function updateEnemies(){
      // Global formation movement (Galaga-style lockstep)
      formationX=Math.sin(frame*0.015)*40;
      formationY=Math.sin(frame*0.02)*10;

      // Dive countdown
      if(diveCountdown>0) diveCountdown--;

      // Collect alive non-boss enemies eligible for diving
      var diveCandidates=[];
      enemies.forEach(function(e){
        if(e.alive && e.shape!=='boss' && !e.diving && !e.returning){
          diveCandidates.push(e);
        }
      });

      // Trigger dive attack if countdown expires - more frequent, in squads
      if(diveCountdown<=0 && diveCandidates.length>0){
        var diveCount=Math.min(2+Math.floor(Math.random()*3), diveCandidates.length);
        var shuffled=diveCandidates.slice();
        // Sort by column to make squads dive together
        shuffled.sort(function(a,b){ return a.gridX-b.gridX; });
        for(var di=0;di<diveCount;di++){
          var diver=shuffled[di];
          if(!diver) break;
          diver.diving=true;
          // Squad target - spread across player area
          diver.diveTargetX=player.x+player.w/2+(Math.random()-0.5)*80;
          diver.diveTargetY=player.y+player.h/2+30+(Math.random()-0.5)*40;
          diver.diveSpeed=2.5+Math.random()*1.5;
        }
        // Shorter delay between dive waves (come down twice as much)
        diveCountdown=120+Math.floor(Math.random()*60);
      }

      // Track how many enemies shoot this frame (cap increased by 50%)
      var shooterCount=0;
      var maxShooters=Math.floor(1.5*(1+Math.floor(level/3)));
      if(maxShooters>5) maxShooters=5;

      enemies.forEach(function(e){
        if(!e.alive) return;

        // ===== BOSS =====
        if(e.shape==='boss'){
          if(!e.descending){
            var t=frame*0.02+(e.phase||0);
            e.x=(e.baseX||W/2-40)+Math.sin(t*0.5)*80;
            e.y=(e.baseY||30)+Math.sin(t)*15;
            // boss shoots more
            if(shooterCount<maxShooters && Math.random()<0.015 && frame%60<15){
              enemyBullets.push({x:e.x+e.w/2-2,y:e.y+e.h,w:4,h:8,speed:2+level*0.2,vx:0});
              enemyBullets.push({x:e.x+e.w/2-2,y:e.y+e.h,w:4,h:8,speed:2+level*0.2,vx:-1});
              enemyBullets.push({x:e.x+e.w/2-2,y:e.y+e.h,w:4,h:8,speed:2+level*0.2,vx:1});
              shooterCount+=3;
            }
          }
          return;
        }

        // ===== REGULAR ENEMIES =====

        // Initial descent into formation
        if(e.descending){
          e.y+=0.8;
          if(e.y>=e.gridY){
            e.y=e.gridY;
            e.descending=false;
          }
          return;
        }

        // Diving toward player position
        if(e.diving){
          var dx=e.diveTargetX-e.x;
          var dy=e.diveTargetY-e.y;
          var dist=Math.sqrt(dx*dx+dy*dy);
          if(dist>5){
            e.x+=dx/dist*e.diveSpeed;
            e.y+=dy/dist*e.diveSpeed;
            // Diving enemies shoot more
            if(shooterCount<maxShooters && Math.random()<0.02){
              enemyBullets.push({x:e.x+e.w/2-2,y:e.y+e.h,w:4,h:8,speed:2+level*0.2,vx:0});
              shooterCount++;
            }
          } else {
            // Reached target, return to formation
            e.diving=false;
            e.returning=true;
            e.returnTimer=30;
          }
          return;
        }

        // Returning to formation after dive
        if(e.returning){
          if(e.returnTimer>0){
            e.returnTimer--;
          } else {
            var tx=e.gridX+formationX;
            var ty=e.gridY+formationY;
            var dx2=tx-e.x;
            var dy2=ty-e.y;
            var dist2=Math.sqrt(dx2*dx2+dy2*dy2);
            if(dist2>3){
              e.x+=dx2/dist2*2;
              e.y+=dy2/dist2*2;
            } else {
              e.x=tx;
              e.y=ty;
              e.returning=false;
            }
          }
          return;
        }

        // Normal formation position (lockstep — all move together)
        e.x=e.gridX+formationX;
        e.y=e.gridY+formationY;

        // More shooting from formation (50% more)
        if(shooterCount<maxShooters && Math.random()<0.003 && frame%180<20){
          enemyBullets.push({x:e.x+e.w/2-2,y:e.y+e.h,w:4,h:8,speed:2+level*0.2,vx:0});
          shooterCount++;
        }
      });
    }

    function updateBullets(){
      bullets=bullets.filter(function(b){ return b.y>-10; });
      bullets.forEach(function(b){ b.y-=b.speed; });
      bullets.forEach(function(b){
        if(b.hit) return;
        enemies.forEach(function(e){
          if(e.alive&&b.x<e.x+e.w&&b.x+b.w>e.x&&b.y<e.y+e.h&&b.y+b.h>e.y){
            e.hp-=1; e.hitFlash=4; b.hit=true; sfxHit();
            if(e.hp<=0){
              e.alive=false;
              spawnExplosion(e.x+e.w/2,e.y+e.h/2,e.bodyColor,e.shape==='boss'?30:12);
              if(e.shape==='boss'){ sfxExplode(); shake=12; } else { shake=2; }
              // combo
              combo+=1; comboTimer=120;
              var bonus=Math.floor(e.scoreVal*(1+combo*0.1));
              score+=bonus;
              spawnFloatText(e.x+e.w/2,e.y,'+'+bonus,e.bodyColor);
              maybeSpawnPowerup(e.x+e.w/2,e.y+e.h/2);
              setLabels();
            }
          }
        });
      });
      bullets=bullets.filter(function(b){ return !b.hit; });
    }

    function updateEnemyBullets(){
      enemyBullets=enemyBullets.filter(function(b){ return b.y<H+10 && (!b.vx || (b.x>-10 && b.x<W+10)); });
      enemyBullets.forEach(function(b){
        b.y+=b.speed;
        if(b.vx) b.x+=b.vx;
      });
      enemyBullets.forEach(function(b){
        if(b.hit) return;
        if(player.invuln<=0 && b.x<player.x+player.w&&b.x+b.w>player.x&&b.y<player.y+player.h&&b.y+b.h>player.y){
          b.hit=true;
          lives-=1; setLabels(); shake=10; sfxPlayerHit();
          spawnExplosion(player.x+player.w/2,player.y+player.h/2,'#ff4d2a',14);
          spawnExplosion(player.x+player.w/2,player.y+player.h/2,'#ff9933',10);
          spawnExplosion(player.x+player.w/2,player.y+player.h/2,'#ffcc00',8);
          spawnExplosion(player.x+player.w/2,player.y+player.h/2,'#ffffff',6);
          player.invuln=120;
          combo=0;
          if(lives<=0){ handleGameOver(); }
          else { setStatus('Hit! Lives left: '+lives); }
        }
      });
      enemyBullets=enemyBullets.filter(function(b){ return !b.hit; });
    }

    // ===== ENEMY CONTACT DAMAGE =====
    function checkEnemyContact(){
      if(player.invuln>0||playerExploding) return;
      enemies.forEach(function(e){
        if(!e.alive) return;
        if(e.x<player.x+player.w&&e.x+e.w>player.x&&e.y<player.y+player.h&&e.y+e.h>player.y){
          // Contact damage!
          lives-=1; setLabels(); shake=12; sfxPlayerHit();
          spawnExplosion(player.x+player.w/2,player.y+player.h/2,'#ff4d2a',14);
          spawnExplosion(player.x+player.w/2,player.y+player.h/2,'#ff9933',10);
          spawnExplosion(player.x+player.w/2,player.y+player.h/2,'#ffcc00',8);
          spawnExplosion(player.x+player.w/2,player.y+player.h/2,'#ffffff',6);
          // Destroy the enemy on contact too
          e.alive=false;
          spawnExplosion(e.x+e.w/2,e.y+e.h/2,e.bodyColor,12);
          player.invuln=120;
          combo=0;
          if(lives<=0){ handleGameOver(); }
          else { setStatus('Collision! Lives left: '+lives); }
        }
      });
    }

    function updatePowerups(){
      powerups=powerups.filter(function(p){ return p.y<H+10; });
      powerups.forEach(function(p){
        p.y+=p.vy;
        if(p.x<player.x+player.w&&p.x+p.w>player.x&&p.y<player.y+player.h&&p.y+p.h>player.y){
          p.hit=true;
          applyPowerup(p);
        }
      });
      powerups=powerups.filter(function(p){ return !p.hit; });
    }

    function updateParticles(){
      particles=particles.filter(function(p){ return p.life>0; });
      particles.forEach(function(p){
        p.x+=p.vx; p.y+=p.vy;
        p.vx*=0.96; p.vy*=0.96; p.vy+=0.05;
        p.life-=1;
      });
    }
    function updateFloatTexts(){
      floatTexts=floatTexts.filter(function(f){ return f.life>0; });
      floatTexts.forEach(function(f){ f.y+=f.vy; f.life-=1; });
    }

    function fireBullet(){
      if(shootCooldown>0) return;
      var isRapid=(player.powerType==='rapid'||player.powerType2==='rapid');
      var isSpread=(player.powerType==='spread'||player.powerType2==='spread');
      if(isRapid && isSpread){
        // Stacked: rapid fire spread shot
        bullets.push({x:player.x+player.w/2-2,y:player.y-14,w:4,h:10,speed:8,vx:-1.5});
        bullets.push({x:player.x+player.w/2-2,y:player.y-14,w:4,h:10,speed:8,vx:0});
        bullets.push({x:player.x+player.w/2-2,y:player.y-14,w:4,h:10,speed:8,vx:1.5});
        shootCooldown=5;
      } else if(isSpread){
        bullets.push({x:player.x+player.w/2-2,y:player.y-14,w:4,h:10,speed:7,vx:-1.5});
        bullets.push({x:player.x+player.w/2-2,y:player.y-14,w:4,h:10,speed:7,vx:0});
        bullets.push({x:player.x+player.w/2-2,y:player.y-14,w:4,h:10,speed:7,vx:1.5});
        shootCooldown=12;
      } else if(isRapid){
        bullets.push({x:player.x+player.w/2-2,y:player.y-14,w:4,h:10,speed:8});
        shootCooldown=5;
      } else {
        bullets.push({x:player.x+player.w/2-2,y:player.y-14,w:4,h:10,speed:7});
        shootCooldown=10;
      }
      sfxShoot();
    }

    function updatePlayer(){
      if(keys.left&&player.x>8) player.x-=player.speed;
      if(keys.right&&player.x+player.w<W-8) player.x+=player.speed;
      if(keys.shoot) fireBullet();
      if(shootCooldown>0) shootCooldown-=1;
      if(player.invuln>0) player.invuln-=1;
      if(player.powerTimer>0){
        player.powerTimer-=1;
        if(player.powerTimer<=0) player.powerType=null;
      }
      if(player.powerTimer2>0){
        player.powerTimer2-=1;
        if(player.powerTimer2<=0) player.powerType2=null;
      }
      // apply bullet vx
      bullets.forEach(function(b){ if(b.vx) b.x+=b.vx; });
      bullets=bullets.filter(function(b){ return b.x>-10 && b.x<W+10; });
    }

    function updateFrame(){
      if(!gameStarted||gameOver||gamePaused){
        // Still update explosion animation during game over
        if(playerExploding){
          playerExplodeTimer+=1;
          if(playerExplodeTimer>30) playerExploding=false;
        }
        updateParticles();
        updateFloatTexts();
        if(shake>0) shake-=1;
        frame+=1;
        return;
      }
      updatePlayer();
      updateBullets();
      updateEnemyBullets();
      checkEnemyContact();
      updateEnemies();
      updatePowerups();
      updateParticles();
      updateFloatTexts();
      if(comboTimer>0){ comboTimer-=1; if(comboTimer<=0) combo=0; }
      if(enemies.every(function(e){ return !e.alive; })){
        var waveBonus=50+level*10;
        score+=waveBonus;
        spawnFloatText(W/2,H/2,'WAVE CLEAR +'+waveBonus,'#ffd700');
        sfxWaveClear();
        level+=1;
        setStatus('Wave cleared! Level '+level);
        spawnWave();
        setLabels();
      }
      if(shake>0) shake-=1;
      frame+=1;
    }

    function drawFrame(){
      ctx.save();
      if(shake>0){
        ctx.translate((Math.random()-0.5)*shake,(Math.random()-0.5)*shake);
      }
      ctx.clearRect(0,0,W,H);
      drawStars();
      drawPlayer();
      drawEnemies();
      drawBullets();
      drawEnemyBullets();
      drawPowerups();
      drawParticles();
      drawFloatTexts();
      ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.lineWidth=1;
      ctx.strokeRect(2,2,W-4,H-4);
      ctx.fillStyle='rgba(255,255,255,0.06)';
      ctx.fillRect(0,H-20,W,20);
      ctx.fillStyle='#9e9e9e'; ctx.font='11px Inter, system-ui, sans-serif';
      ctx.fillText('Level '+level,10,H-8);
      if(combo>1){
        ctx.fillStyle='#ffd700'; ctx.font='bold 12px Inter, system-ui, sans-serif';
        ctx.fillText('Combo x'+combo,W-80,H-8);
      }
      ctx.restore();
    }

    function loop(){ updateFrame(); drawFrame(); requestAnimationFrame(loop); }
    loop();

    // ===== INPUT =====
    window.addEventListener('keydown',function(e){
      if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A'){ keys.left=true; }
      if(e.key==='ArrowRight'||e.key==='d'||e.key==='D'){ keys.right=true; }
      if(e.key===' '||e.key==='Spacebar'){
        e.preventDefault();
        if(!gameStarted||gameOver){ startGame(); }
        else if(gamePaused){ togglePause(); }
        else { keys.shoot=true; }
      }
      if(e.key==='p'||e.key==='P'){ togglePause(); }
    });
    window.addEventListener('keyup',function(e){
      if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A'){ keys.left=false; }
      if(e.key==='ArrowRight'||e.key==='d'||e.key==='D'){ keys.right=false; }
      if(e.key===' '||e.key==='Spacebar'){ keys.shoot=false; }
    });

    // touch controls
    var touchLeft=document.getElementById('touch-left');
    var touchRight=document.getElementById('touch-right');
    var touchFire=document.getElementById('touch-fire');
    function bindTouch(el,onDown,onUp){
      if(!el) return;
      el.addEventListener('touchstart',function(e){ e.preventDefault(); onDown(); },{passive:false});
      el.addEventListener('touchend',function(e){ e.preventDefault(); if(onUp) onUp(); },{passive:false});
      el.addEventListener('mousedown',function(e){ e.preventDefault(); onDown(); });
      el.addEventListener('mouseup',function(e){ e.preventDefault(); if(onUp) onUp(); });
      el.addEventListener('mouseleave',function(){ if(onUp) onUp(); });
    }
    bindTouch(touchLeft,function(){keys.left=true;},function(){keys.left=false;});
    bindTouch(touchRight,function(){keys.right=true;},function(){keys.right=false;});
    bindTouch(touchFire,function(){keys.shoot=true;},function(){keys.shoot=false;});

    // buttons
    startBtn.addEventListener('click',function(){
      if(!gameStarted||gameOver) startGame();
      else if(gamePaused) togglePause();
      else setStatus('Game is already running.');
    });
    if(pauseBtn) pauseBtn.addEventListener('click',togglePause);
    resetBtn.addEventListener('click',function(){ stopGame(); showOverlay('CUBBLITZ','Arrow keys to move · Space to shoot','Start'); });
    if(muteBtn) muteBtn.addEventListener('click',function(){
      muted=!muted;
      muteBtn.textContent=muted?'🔇':'🔊';
      if(!muted) initAudio();
    });
    if(overlayBtn) overlayBtn.addEventListener('click',function(){
      if(!gameStarted||gameOver) startGame();
      else if(gamePaused) togglePause();
    });

    stopGame();
    showOverlay('CUBBLITZ','Arrow keys to move · Space to shoot','Start');
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