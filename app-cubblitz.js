document.addEventListener('DOMContentLoaded',function(){
  'use strict';

  // Ensure page starts at the top
  window.scrollTo(0,0);

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

  // ===== SCROLL PROGRESS BAR =====
  var progressBar=document.getElementById('scroll-progress');
  function updateScrollProgress(){
    if(!progressBar) return;
    var st=window.scrollY||document.documentElement.scrollTop;
    var dh=document.documentElement.scrollHeight-document.documentElement.clientHeight;
    var pct=dh>0?(st/dh)*100:0;
    progressBar.style.width=pct+'%';
  }
  window.addEventListener('scroll',updateScrollProgress,{passive:true});
  updateScrollProgress();

  // ===== ACTIVE NAV HIGHLIGHTING =====
  var navLinks=Array.prototype.slice.call(document.querySelectorAll('.nav a[data-nav]'));
  var navSections=navLinks.map(function(a){ return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  if('IntersectionObserver' in window && navSections.length){
    var navObserver=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          var id='#'+entry.target.id;
          navLinks.forEach(function(l){ l.classList.toggle('active',l.getAttribute('href')===id); });
        }
      });
    },{ rootMargin:'-45% 0px -50% 0px' });
    navSections.forEach(function(s){ navObserver.observe(s); });
  }

  // ===== TYPEWRITER EFFECT =====
  var typedEl=document.getElementById('typed');
  if(typedEl){
    var roles=['Business Development · Sales Professional','B2B Technology Sales','MEDDIC & SPIN Selling','Enterprise Account Executive','Pipeline Builder & Team Leader'];
    var roleIdx=0,charIdx=0,deleting=false,typeTimer=null;
    function typeLoop(){
      var current=roles[roleIdx];
      if(!deleting){
        charIdx++;
        typedEl.textContent=current.substring(0,charIdx);
        if(charIdx>=current.length){ deleting=true; typeTimer=setTimeout(typeLoop,1800); return; }
        typeTimer=setTimeout(typeLoop,55);
      } else {
        charIdx--;
        typedEl.textContent=current.substring(0,charIdx);
        if(charIdx<=0){ deleting=false; roleIdx=(roleIdx+1)%roles.length; typeTimer=setTimeout(typeLoop,300); return; }
        typeTimer=setTimeout(typeLoop,30);
      }
    }
    typeLoop();
  }

  // ===== ANIMATED COUNTERS =====
  function animateCounter(el){
    var target=parseFloat(el.getAttribute('data-count'))||0;
    var suffix=el.getAttribute('data-suffix')||'';
    var dur=1400,start=null;
    // For decimal suffixes like ".8%", count to integer part then append
    var isDecimal=/^\.\d/.test(suffix);
    var intTarget=isDecimal?Math.floor(target):target;
    function step(ts){
      if(!start) start=ts;
      var p=Math.min((ts-start)/dur,1);
      var eased=1-Math.pow(1-p,3);
      var val=Math.floor(eased*intTarget);
      el.textContent=val+suffix;
      if(p<1) requestAnimationFrame(step);
      else el.textContent=intTarget+suffix;
    }
    requestAnimationFrame(step);
  }
  var counters=Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  if('IntersectionObserver' in window && counters.length){
    var counterObserver=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){ animateCounter(entry.target); counterObserver.unobserve(entry.target); }
      });
    },{ threshold:0.4 });
    counters.forEach(function(c){ counterObserver.observe(c); });
  } else {
    counters.forEach(function(c){ animateCounter(c); });
  }


  // ===== CARD TILT =====
  var tiltCards=Array.prototype.slice.call(document.querySelectorAll('.tilt'));
  var isTouch=window.matchMedia('(hover:none)').matches;
  if(!isTouch){
    tiltCards.forEach(function(card){
      card.addEventListener('mousemove',function(e){
        var r=card.getBoundingClientRect();
        var cx=e.clientX-r.left, cy=e.clientY-r.top;
        var rx=((cy/r.height)-0.5)*-6;
        var ry=((cx/r.width)-0.5)*6;
        card.style.transform='translateY(-6px) perspective(800px) rotateX('+rx+'deg) rotateY('+ry+'deg)';
      });
      card.addEventListener('mouseleave',function(){ card.style.transform=''; });
    });
  }

  // ===== MAGNETIC BUTTONS =====
  var magnetics=Array.prototype.slice.call(document.querySelectorAll('.magnetic'));
  if(!isTouch){
    magnetics.forEach(function(el){
      el.addEventListener('mousemove',function(e){
        var r=el.getBoundingClientRect();
        var x=e.clientX-r.left-r.width/2;
        var y=e.clientY-r.top-r.height/2;
        el.style.transform='translate('+(x*0.25)+'px,'+(y*0.4)+'px)';
      });
      el.addEventListener('mouseleave',function(){ el.style.transform=''; });
    });
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
    var player={x:W/2-18,y:H-48,w:36,h:16,speed:5,invuln:0,powerType:null,powerTimer:0,powerType2:null,powerTimer2:0,shieldHP:0,bulletDamage:1,bulletSpeed:7};
    var bullets=[];
    var enemies=[];
    var enemyBullets=[];
    var particles=[];
    var powerups=[];
    var stars=[];
    var floatTexts=[];

    // PERFORMANCE: precompute constants
    var TWO_PI = Math.PI * 2;
    var FONT_FLOAT = 'bold 11px Inter, system-ui, sans-serif';
    var FONT_LABEL = '11px Inter, system-ui, sans-serif';
    var FONT_COMBO = 'bold 12px Inter, system-ui, sans-serif';

    // init starfield
    for(var si=0;si<80;si++){
      stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.5+0.5,s:Math.random()*0.6+0.1,tw:Math.random()*TWO_PI});
    }

    var frame=0,level=1,score=0,lives=5,gameOver=true,gameStarted=false,gamePaused=false,shootCooldown=0,shake=0,combo=0,comboTimer=0,playerExploding=false,playerExplodeTimer=0,waitingForUpgrade=false,selectedUpgradeIdx=0,visibleUpgradeCount=0;
    // Enemy shoot probability multiplier (0.7 = enemies shoot 30% less)
    var enemyShootMult=0.7;
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

    // ===== PERMANENT UPGRADE SYSTEM =====
    var upgradeDefs=[
      {id:'rapid',name:'Rapid Fire',desc:'Fire rate +',icon:'⚡',maxLevel:3},
      {id:'spread',name:'Spread Shot',desc:'Extra bullets +',icon:'✦',maxLevel:2},
      {id:'shield',name:'Shield',desc:'+1 shield HP',icon:'🛡',maxLevel:3},
      {id:'speed',name:'Speed Boost',desc:'Move speed +',icon:'➤',maxLevel:3},
      {id:'bigBullets',name:'Big Bullets',desc:'Damage +',icon:'◆',maxLevel:3},
      {id:'extraLife',name:'Extra Life',desc:'+1 life',icon:'♥',maxLevel:3},
      {id:'magnet',name:'Magnet',desc:'Attract powerups',icon:'🧲',maxLevel:2},
      {id:'piercing',name:'Piercing Rounds',desc:'Bullets pierce enemies',icon:'➹',maxLevel:1},
      {id:'homing',name:'Homing Shots',desc:'Bullets home in on enemies',icon:'🎯',maxLevel:1}
    ];
    var upgrades={};
    function initUpgrades(){
      upgradeDefs.forEach(function(def){ upgrades[def.id]=0; });
    }
    initUpgrades();

    var upgradePickerEl=document.getElementById('upgrade-picker');
    var upgradeCards=document.querySelectorAll('.upgrade-card');

    function getAvailableUpgrades(){
      return upgradeDefs.filter(function(def){ return upgrades[def.id]<def.maxLevel; });
    }

    function showUpgradePicker(){
      waitingForUpgrade=true;
      gamePaused=true;
      var available=getAvailableUpgrades();
      // If no upgrades available, skip picker
      if(available.length===0){
        advanceAfterUpgrade();
        return;
      }
      // Shuffle and pick up to 3
      var shuffled=available.slice();
      for(var ui=shuffled.length-1;ui>0;ui--){
        var uj=Math.floor(Math.random()*(ui+1));
        var ut=shuffled[ui]; shuffled[ui]=shuffled[uj]; shuffled[uj]=ut;
      }
      var picks=shuffled.slice(0,3);
      for(var ci=0;ci<3;ci++){
        var card=upgradeCards[ci];
        var iconEl=document.getElementById('uc-icon-'+ci);
        var nameEl=document.getElementById('uc-name-'+ci);
        var descEl=document.getElementById('uc-desc-'+ci);
        var levelEl=document.getElementById('uc-level-'+ci);
        if(ci<picks.length){
          var pick=picks[ci];
          var curLevel=upgrades[pick.id];
          card.style.display='block';
          card.setAttribute('data-upgrade-id',pick.id);
          iconEl.textContent=pick.icon;
          nameEl.textContent=pick.name;
          descEl.textContent=pick.desc+(pick.maxLevel>1?' ('+(curLevel+1)+'/'+pick.maxLevel+')':'');
          // Show level dots
          levelEl.innerHTML='';
          if(pick.maxLevel>1){
            for(var di=0;di<pick.maxLevel;di++){
              var dot=document.createElement('span');
              dot.className='dot'+(di<curLevel+1?' filled':'')+(di===pick.maxLevel-1&&di<curLevel+1?' filled-max':'');
              levelEl.appendChild(dot);
            }
          }
        } else {
          card.style.display='none';
        }
      }
      // Set initial selection to first visible card
      selectedUpgradeIdx=0;
      highlightUpgradeCard();
      upgradePickerEl.classList.add('open');
    }

    function highlightUpgradeCard(){
      for(var hi=0;hi<upgradeCards.length;hi++){
        if(hi===selectedUpgradeIdx){
          upgradeCards[hi].classList.add('selected');
        } else {
          upgradeCards[hi].classList.remove('selected');
        }
      }
    }

    function getVisibleUpgradeCount(){
      var count=0;
      for(var vi=0;vi<upgradeCards.length;vi++){
        if(upgradeCards[vi].style.display!=='none') count++;
      }
      return count;
    }

    function applyUpgrade(upgradeId){
      var def=upgradeDefs.find(function(d){ return d.id===upgradeId; });
      if(!def) return;
      upgrades[upgradeId]++;
      var level=upgrades[upgradeId];
      if(upgradeId==='rapid'){
        spawnFloatText(W/2,H/2-20,'RAPID FIRE +','#ff66b2');
      } else if(upgradeId==='spread'){
        spawnFloatText(W/2,H/2-20,'SPREAD SHOT +','#66cc55');
      } else if(upgradeId==='shield'){
        player.shieldHP++;
        spawnFloatText(W/2,H/2-20,'SHIELD +'+(player.shieldHP),'#4488ff');
      } else if(upgradeId==='speed'){
        player.speed++;
        spawnFloatText(W/2,H/2-20,'SPEED +','#ffcc44');
      } else if(upgradeId==='bigBullets'){
        player.bulletDamage++;
        spawnFloatText(W/2,H/2-20,'BIG BULLETS +','#cc88ff');
      } else if(upgradeId==='extraLife'){
        lives++;
        setLabels();
        spawnFloatText(W/2,H/2-20,'+1 LIFE','#ff6644');
      } else if(upgradeId==='magnet'){
        spawnFloatText(W/2,H/2-20,'MAGNET +','#dd44ff');
      } else if(upgradeId==='piercing'){
        spawnFloatText(W/2,H/2-20,'PIERCING +','#44ffdd');
      } else if(upgradeId==='homing'){
        spawnFloatText(W/2,H/2-20,'HOMING SHOTS +','#66ccff');
      }
      upgradePickerEl.classList.remove('open');
      advanceAfterUpgrade();
    }

    function advanceAfterUpgrade(){
      level+=1;
      spawnWave();
      setLabels();
      setStatus('Wave cleared! Level '+level);
      waitingForUpgrade=false;
      gamePaused=false;
    }

    // upgrade card click handlers
    function handleUpgradeClick(e){
      var card=e.currentTarget;
      var upgradeId=card.getAttribute('data-upgrade-id');
      if(upgradeId) applyUpgrade(upgradeId);
    }
    upgradeCards.forEach(function(c){
      c.addEventListener('click',handleUpgradeClick);
      c.addEventListener('touchend',function(e){ e.preventDefault(); handleUpgradeClick(e); });
    });

    // ===== ENEMY TYPES =====
    var enemyTypes=[
      {w:28,h:16,bodyColor:'hsl(180,70%,55%)',coreColor:'hsl(180,50%,35%)',shape:'diamond',hp:1,score:10},
      {w:32,h:14,bodyColor:'hsl(40,80%,55%)',coreColor:'hsl(40,60%,35%)',shape:'wide',hp:1,score:15},
      {w:24,h:20,bodyColor:'hsl(280,60%,55%)',coreColor:'hsl(280,50%,35%)',shape:'tall',hp:2,score:25},
      {w:30,h:18,bodyColor:'hsl(0,70%,55%)',coreColor:'hsl(0,50%,35%)',shape:'arrow',hp:1,score:20}
    ];

    function spawnWave(){
      enemies=[];
      var rows=2+Math.min(level,5);
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
          alive:true,hp:35+level*3,maxHp:35+level*3,scoreVal:200+level*10,
          baseX:W/2-40,baseY:30,
          phase:0,descending:false,hitFlash:0,
          rocketCooldown:0
        });
      }
    }

    // ===== PARTICLES =====
    function spawnExplosion(x,y,color,count){
      count=count||12;
      for(var i=0;i<count;i++){
        var ang=Math.random()*TWO_PI;
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
      if(powerups.length>=5) return;
      if(Math.random()<0.08){
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
          player.powerTimer=420;
          player.powerTimer2=420;
          spawnFloatText(player.x+player.w/2,player.y,'RAPID+SPREAD',p.color);
        } else {
          player.powerType='rapid';
          player.powerTimer=420;
          spawnFloatText(player.x+player.w/2,player.y,'RAPID FIRE',p.color);
        }
      }
      else if(p.type==='spread'){
        if(player.powerType==='rapid'||player.powerType2==='rapid'){
          // Stack: both rapid and spread active
          player.powerType='rapid';
          player.powerType2='spread';
          player.powerTimer=420;
          player.powerTimer2=420;
          spawnFloatText(player.x+player.w/2,player.y,'RAPID+SPREAD',p.color);
        } else {
          player.powerType='spread';
          player.powerTimer=420;
          spawnFloatText(player.x+player.w/2,player.y,'SPREAD SHOT',p.color);
        }
      }
      else if(p.type==='shield'){ player.invuln=180; spawnFloatText(player.x+player.w/2,player.y,'SHIELD',p.color); }
      else if(p.type==='life'){ lives=Math.min(lives+1,9); setLabels(); spawnFloatText(player.x+player.w/2,player.y,'+1 LIFE',p.color); }
    }

    // ===== GAME FLOW =====
    function startGame(){
      initAudio();
      player.x=W/2-18; player.invuln=0; player.powerType=null; player.powerTimer=0; player.powerType2=null; player.powerTimer2=0; player.shieldHP=0; player.bulletDamage=1; player.bulletSpeed=7;
      bullets=[]; enemyBullets=[]; particles=[]; powerups=[]; floatTexts=[];
      frame=0; level=1; score=0; lives=5; combo=0; comboTimer=0; waitingForUpgrade=false;
      gameOver=false; gameStarted=true; gamePaused=false; shootCooldown=0; shake=0; playerExploding=false; playerExplodeTimer=0;
      initUpgrades(); spawnWave(); setLabels(); setStatus('Use arrows and Space to shoot.');
      hideOverlay(); upgradePickerEl.classList.remove('open');
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
    function drawStars(){ctx.fillStyle='#fff';for(var si=0,sl=stars.length;si<sl;si++){var s=stars[si];s.y+=s.s;s.tw+=0.05;if(s.y>H){s.y=-2;s.x=Math.random()*W;}ctx.globalAlpha=0.3+Math.abs(Math.sin(s.tw))*0.5;var sr=s.r*2;ctx.fillRect(s.x,s.y,sr,sr);}ctx.globalAlpha=1;}

    function drawPlayer(){
      var px=player.x,py=player.y,pw=player.w,ph=player.h;
      // Don't draw player if exploding
      if(playerExploding) return;
      // shield aura
      if(player.invuln>0){
        ctx.fillStyle='rgba(138,226,255,'+(0.15+Math.sin(frame*0.3)*0.1)+')';
        ctx.beginPath(); ctx.arc(px+pw/2,py+ph/2,pw,0,TWO_PI); ctx.fill();
      }
      ctx.fillStyle='#4a6fa5'; ctx.fillRect(px+4,py-10,pw-8,ph+10);
      ctx.fillStyle='#3a5a8a'; ctx.fillRect(px,py+2,pw,ph-6);
      ctx.fillStyle='#2a4a7a'; ctx.fillRect(px-4,py+4,4,ph-8); ctx.fillRect(px+pw,py+4,4,ph-8);
      ctx.fillStyle='#8ae2ff'; ctx.fillRect(px+10,py-14,pw-20,6);
      if(gameStarted&&!gameOver&&!gamePaused){
        ctx.fillStyle='rgba(255,180,50,'+(0.4+Math.sin(frame*0.2)*0.2)+')';
        ctx.fillRect(px+8,py+ph-2,pw-16,5);
      }
      // shield HP indicator
      if(player.shieldHP>0){
        ctx.fillStyle='rgba(68,136,255,'+(0.3+Math.sin(frame*0.1)*0.1)+')';
        ctx.fillRect(px-2,py-2,pw+4,ph+4);
        ctx.fillStyle='#4488ff';
        ctx.font='bold 9px Inter, system-ui, sans-serif';
        ctx.textAlign='center';
        ctx.fillText('🛡'+player.shieldHP,px+pw/2,py-22);
        ctx.textAlign='left';
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

    function drawEnemies(){for(var di=0,dl=enemies.length;di<dl;di++){if(enemies[di].alive)drawEnemy(enemies[di]);}}

    function drawBullets(){if(!bullets.length)return;ctx.fillStyle='#8ae2ff';for(var bi=0,bl=bullets.length;bi<bl;bi++){var b=bullets[bi];ctx.fillRect(b.x,b.y,b.w,b.h);}ctx.fillStyle='rgba(138,226,255,0.3)';for(bi=0;bi<bl;bi++){var b2=bullets[bi];ctx.fillRect(b2.x-1,b2.y+b2.h,b2.w+2,8);}}
    function drawEnemyBullets(){if(!enemyBullets.length)return;for(var ebi=0,ebl=enemyBullets.length;ebi<ebl;ebi++){var b=enemyBullets[ebi];if(b.rocket){
          // Draw rocket/missile with trail
          ctx.fillStyle='#ff2222';
          ctx.fillRect(b.x,b.y,b.w,b.h);
          ctx.fillStyle='#ff6644';
          ctx.fillRect(b.x+1,b.y+2,b.w-2,b.h-4);
          // Trail
          ctx.fillStyle='rgba(255,100,0,0.4)';
          ctx.fillRect(b.x-2,b.y+b.h,b.w+4,6);
        } else {
          ctx.fillStyle='#ff6644';
          ctx.fillRect(b.x,b.y,b.w,b.h);
          ctx.fillStyle='rgba(255,102,68,0.3)';
          ctx.fillRect(b.x-1,b.y-8,b.w+2,8);
        }
      }
    }
    function drawParticles(){if(!particles.length)return;for(var pi=0,pl=particles.length;pi<pl;pi++){var p=particles[pi];ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);}ctx.globalAlpha=1;}
    function drawFloatTexts(){if(!floatTexts.length)return;ctx.textAlign='center';ctx.font=FONT_FLOAT;for(var fi=0,fl=floatTexts.length;fi<fl;fi++){var f=floatTexts[fi];ctx.globalAlpha=Math.min(1,f.life/30);ctx.fillStyle=f.color;ctx.fillText(f.text,f.x,f.y);}ctx.globalAlpha=1;ctx.textAlign='left';}
    function drawPowerups(){if(!powerups.length)return;ctx.textAlign='center';ctx.font=FONT_FLOAT;for(var pi=0,pl=powerups.length;pi<pl;pi++){var p=powerups[pi];p.phase+=0.1;var bob=Math.sin(p.phase)*2;var cx=p.x+p.w/2,cy=p.y+p.h/2+bob;ctx.fillStyle=p.color;ctx.globalAlpha=0.9;if(p.type==='rapid'){
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
          ctx.arc(cx,cy,p.w/2,0,TWO_PI);
          ctx.fill();
        } else if(p.type==='life'){
          // plus sign
          ctx.fillRect(p.x+5,p.y+bob+2,p.w-10,12);
          ctx.fillRect(p.x+2,p.y+bob+5,12,p.h-10);
        }
        ctx.fillStyle='#000';ctx.fillText(p.label,cx,p.y+bob+p.h-5);}
      ctx.globalAlpha=1;ctx.textAlign='left';}

    // ===== UPDATE LOGIC =====
    function updateEnemies(){
      // Global formation movement (Galaga-style lockstep)
      formationX=Math.sin(frame*0.015)*40;
      formationY=Math.sin(frame*0.02)*10;

      // Dive countdown
      if(diveCountdown>0) diveCountdown--;

      // Trigger dive attack if countdown expires - more frequent, in squads
      if(diveCountdown<=0){
        // Collect alive non-boss enemies eligible for diving (only when needed)
        var diveCandidates=[];
        for(var dci=0,dcl=enemies.length;dci<dcl;dci++){
          var dce=enemies[dci];
          if(dce.alive && dce.shape!=='boss' && !dce.diving && !dce.returning){
            diveCandidates.push(dce);
          }
        }
        if(diveCandidates.length>0){
          var diveCount=Math.min(2+Math.floor(Math.random()*3), diveCandidates.length);
          var shuffled=diveCandidates.slice();
          // Sort by column to make squads dive together
          shuffled.sort(function(a,b){ return a.gridX-b.gridX; });
          for(var di=0;di<diveCount;di++){
            var diver=shuffled[di];
            if(!diver) break;
            diver.diving=true;
            // Fixed straight-line dive - slight angle based on column
            diver.diveSpeed=2.5+Math.random()*1.5;
            diver.diveVX=(diver.gridX-W/2)/W*1.0;
            diver.diveVY=diver.diveSpeed;
            // Track how many bottom-to-top wraps this enemy can do
            diver.wrapCount=0;
            diver.loopsLeft=1+Math.floor(Math.random()*2);
          }
          // Shorter delay between dive waves (come down twice as much)
          diveCountdown=120+Math.floor(Math.random()*60);
        } else {
          diveCountdown=30;
        }
      }

      // Track how many enemies shoot this frame (cap increased by 50%)
      var shooterCount=0;
      var maxShooters=Math.floor(1.5*(1+Math.floor(level/3)));
      if(maxShooters>5) maxShooters=5;

      for(var ei2=0,el2=enemies.length;ei2<el2;ei2++){
        var e=enemies[ei2];
        if(!e.alive) continue;

        // If enemy crossed below the bottom, teleport it back to the top
        if(e.y > H){
          if(e.diving && e.wrapCount < e.loopsLeft){
            // Keep diving - teleport to top with a fresh line angle
            e.y=-e.h-10;
            e.wrapCount++;
            e.diveVX=(Math.random()-0.5)*1.0;
            e.diveVY=e.diveSpeed;
          } else {
            // Loop limit reached - teleport to top and return to formation
            e.y=-e.h-10;
            e.diving=false;
            e.returning=true;
            e.returnTimer=0;
          }
        }

        // ===== BOSS =====
        if(e.shape==='boss'){
          if(!e.descending){
            var t=frame*0.02+(e.phase||0);
            e.x=(e.baseX||W/2-40)+Math.sin(t*0.5)*80;
            e.y=(e.baseY||30)+Math.sin(t)*15;
            // boss shoots homing rockets
            if(e.rocketCooldown>0) e.rocketCooldown--;
            if(shooterCount<maxShooters && e.rocketCooldown<=0 && Math.random()<0.02*enemyShootMult){
              var rocketAngle=Math.atan2(player.y+player.h/2-(e.y+e.h/2), player.x+player.w/2-(e.x+e.w/2));

              var rocketSpeed=3.5+level*0.25;
              enemyBullets.push({
                x:e.x+e.w/2-4, y:e.y+e.h,
                w:8, h:12,
                speed:rocketSpeed,
                vx:Math.cos(rocketAngle)*rocketSpeed*0.3,
                vy:Math.sin(rocketAngle)*rocketSpeed*0.3+rocketSpeed*0.7,
                rocket:true
              });
              e.rocketCooldown=60+Math.floor(Math.random()*40);
              shooterCount++;
            }
          }
          continue;
        }

        // ===== REGULAR ENEMIES =====

        // Initial descent into formation
        if(e.descending){
          e.y+=0.8;
          if(e.y>=e.gridY){
            e.y=e.gridY;
            e.descending=false;
          }
          continue;
        }

        // Diving - move in a fixed straight line
        if(e.diving){
          e.x+=e.diveVX||0;
          e.y+=e.diveVY||e.diveSpeed;
          // Keep enemy within horizontal bounds so it can always be shot
          if(e.x<0) e.x=0;
          if(e.x+e.w>W) e.x=W-e.w;
          // Diving enemies shoot straight shots only (no homing missiles)
          if(shooterCount<maxShooters && Math.random()<0.025*enemyShootMult){
            enemyBullets.push({x:e.x+e.w/2-2,y:e.y+e.h,w:4,h:8,speed:2+level*0.2,vx:0});
            shooterCount++;
          }
          continue;
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
          continue;
        }

        // Normal formation position (lockstep — all move together)
        e.x=e.gridX+formationX;
        e.y=e.gridY+formationY;

        // Formation enemies shoot straight shots only (no homing missiles)
        if(shooterCount<maxShooters && Math.random()<0.004*enemyShootMult && frame%180<20){
          enemyBullets.push({x:e.x+e.w/2-2,y:e.y+e.h,w:4,h:8,speed:2+level*0.2,vx:0});
          shooterCount++;
        }
      }
    }

    function updateBullets(){
      var bi,bl,b,e,ei,el;
      // Move bullets and filter in one pass
      var writeIdx=0;
      for(bi=0,bl=bullets.length;bi<bl;bi++){
        b=bullets[bi];
        b.y-=b.speed;
        if(b.y>-10) bullets[writeIdx++]=b;
      }
      bullets.length=writeIdx;
      // Homing shots: curve toward nearest enemy (squared distance)
      if(upgrades.homing>0){
        for(bi=0,bl=bullets.length;bi<bl;bi++){
          b=bullets[bi];
          if(!b.homing) continue;
          var nearest=null,nearestDist=999999;
          for(ei=0,el=enemies.length;ei<el;ei++){
            e=enemies[ei];
            if(!e.alive) continue;
            var ex=e.x+e.w/2,ey=e.y+e.h/2,bx=b.x+b.w/2,by=b.y+b.h/2;
            var dx=ex-bx,dy=ey-by;
            var dist=dx*dx+dy*dy;
            if(dist<nearestDist){ nearestDist=dist; nearest=e; }
          }
          if(nearest&&nearestDist<40000){
            var ndx=(nearest.x+nearest.w/2)-(b.x+b.w/2);
            var ndy=(nearest.y+nearest.h/2)-(b.y+b.h/2);
            var nd=Math.sqrt(ndx*ndx+ndy*ndy);
            if(nd>1){
              b.vx=(b.vx||0)+(ndx/nd*0.3);
              var maxVx=b.speed*0.6;
              if(b.vx>maxVx) b.vx=maxVx;
              if(b.vx<-maxVx) b.vx=-maxVx;
            }
          }
        }
      }
      // Collision detection with in-place filtering
      writeIdx=0;
      for(bi=0,bl=bullets.length;bi<bl;bi++){
        b=bullets[bi];
        if(b.hit) continue;
        for(ei=0,el=enemies.length;ei<el;ei++){
          e=enemies[ei];
          if(!e.alive) continue;
          if(b.x<e.x+e.w&&b.x+b.w>e.x&&b.y<e.y+e.h&&b.y+b.h>e.y){
            if(b.piercing){
              var eKey=e.gridX+','+e.gridY+','+e.shape;
              if(b._hitEnemies[eKey]) continue;
              b._hitEnemies[eKey]=true;
            }
            e.hp-=player.bulletDamage; e.hitFlash=4; sfxHit();
            if(!b.piercing) b.hit=true;
            if(e.hp<=0){
              e.alive=false;
              spawnExplosion(e.x+e.w/2,e.y+e.h/2,e.bodyColor,e.shape==='boss'?30:12);
              if(e.shape==='boss'){ sfxExplode(); shake=12; } else { shake=2; }
              combo+=1; comboTimer=120;
              var bonus=Math.floor(e.scoreVal*(1+combo*0.1));
              score+=bonus;
              spawnFloatText(e.x+e.w/2,e.y,'+'+bonus,e.bodyColor);
              maybeSpawnPowerup(e.x+e.w/2,e.y+e.h/2);
              setLabels();
            }
          }
        }
        if(!b.hit) bullets[writeIdx++]=b;
      }
      bullets.length=writeIdx;
    }

    function damagePlayer(){
      if(player.shieldHP>0){
        player.shieldHP--;
        shake=6; sfxPlayerHit();
        spawnExplosion(player.x+player.w/2,player.y+player.h/2,'#4488ff',8);
        player.invuln=120;
        setStatus('Shield hit! Shield HP: '+player.shieldHP);
        return false;
      }
      lives-=1; setLabels(); shake=10; sfxPlayerHit();
      spawnExplosion(player.x+player.w/2,player.y+player.h/2,'#ff4d2a',14);
      spawnExplosion(player.x+player.w/2,player.y+player.h/2,'#ff9933',10);
      spawnExplosion(player.x+player.w/2,player.y+player.h/2,'#ffcc00',8);
      spawnExplosion(player.x+player.w/2,player.y+player.h/2,'#ffffff',6);
      player.invuln=120;
      combo=0;
      if(lives<=0){ handleGameOver(); return true; }
      setStatus('Hit! Lives left: '+lives);
      return false;
    }

    function updateEnemyBullets(){
      var bi,bl,b;
      // Move bullets and filter in one pass
      var writeIdx=0;
      for(bi=0,bl=enemyBullets.length;bi<bl;bi++){
        b=enemyBullets[bi];
        if(b.rocket && b.vx){
          // Homing: curve toward player
          var targetX=player.x+player.w/2;
          var targetY=player.y+player.h/2;
          var dx=targetX-b.x;
          var dy=targetY-b.y;
          var dist=Math.sqrt(dx*dx+dy*dy);
          if(dist>1){
            var homingStrength=0.03;
            b.vx+=dx/dist*homingStrength;
            b.vy+=dy/dist*homingStrength;
            // Normalize and maintain speed
            var mag=Math.sqrt(b.vx*b.vx+b.vy*b.vy);
            if(mag>b.speed){
              b.vx=b.vx/mag*b.speed;
              b.vy=b.vy/mag*b.speed;
            }
          }
        }
        b.y+=b.vy||b.speed;
        if(b.vx) b.x+=b.vx;
        if(b.y<H+10 && (!b.vx || (b.x>-10 && b.x<W+10))) enemyBullets[writeIdx++]=b;
      }
      enemyBullets.length=writeIdx;
      // Collision with player
      writeIdx=0;
      for(bi=0,bl=enemyBullets.length;bi<bl;bi++){
        b=enemyBullets[bi];
        if(b.hit) continue;
        if(player.invuln<=0 && b.x<player.x+player.w&&b.x+b.w>player.x&&b.y<player.y+player.h&&b.y+b.h>player.y){
          b.hit=true;
          damagePlayer();
        }
        if(!b.hit) enemyBullets[writeIdx++]=b;
      }
      enemyBullets.length=writeIdx;
    }

    // ===== ENEMY CONTACT DAMAGE =====
    function checkEnemyContact(){
      if(player.invuln>0||playerExploding) return;
      for(var ei=0,el=enemies.length;ei<el;ei++){
        var e=enemies[ei];
        if(!e.alive) continue;
        if(e.x<player.x+player.w&&e.x+e.w>player.x&&e.y<player.y+player.h&&e.y+e.h>player.y){
          // Destroy the enemy on contact
          e.alive=false;
          spawnExplosion(e.x+e.w/2,e.y+e.h/2,e.bodyColor,12);
          if(!damagePlayer()){
            // If player still alive, extra effects
            spawnExplosion(player.x+player.w/2,player.y+player.h/2,'#ffcc00',6);
          }
        }
      }
    }

    function updatePowerups(){
      var pi,pl,p;
      var writeIdx=0;
      for(pi=0,pl=powerups.length;pi<pl;pi++){
        p=powerups[pi];
        // Magnet attraction - stronger pull that scales with upgrade level
        if(upgrades.magnet>0){
          var dx=player.x+player.w/2-p.x-p.w/2;
          var dy=player.y+player.h/2-p.y-p.h/2;
          var dist=Math.sqrt(dx*dx+dy*dy);
          var magnetRadius=120+upgrades.magnet*50;
          if(dist<magnetRadius && dist>1){
            var attract=0.12+upgrades.magnet*0.08;
            p.x+=dx/dist*attract;
            p.y+=dy/dist*attract;
          }
        }

        p.y+=p.vy;

        if(p.x<player.x+player.w&&p.x+p.w>player.x&&p.y<player.y+player.h&&p.y+p.h>player.y){
          p.hit=true;
          applyPowerup(p);
        }
        if(!p.hit && p.y<H+10) powerups[writeIdx++]=p;
      }
      powerups.length=writeIdx;
    }

    function updateParticles(){
      var pi,pl,p;
      var writeIdx=0;
      for(pi=0,pl=particles.length;pi<pl;pi++){
        p=particles[pi];
        p.x+=p.vx; p.y+=p.vy;
        p.vx*=0.96; p.vy*=0.96; p.vy+=0.05;
        p.life-=1;
        if(p.life>0) particles[writeIdx++]=p;
      }
      particles.length=writeIdx;
    }
    function updateFloatTexts(){
      var fi,fl,f;
      var writeIdx=0;
      for(fi=0,fl=floatTexts.length;fi<fl;fi++){
        f=floatTexts[fi];
        f.y+=f.vy; f.life-=1;
        if(f.life>0) floatTexts[writeIdx++]=f;
      }
      floatTexts.length=writeIdx;
    }

    function fireBullet(){
      if(shootCooldown>0) return;
      var isTempRapid=(player.powerType==='rapid'||player.powerType2==='rapid');
      var isTempSpread=(player.powerType==='spread'||player.powerType2==='spread');
      var permRapid=upgrades.rapid;
      var permSpread=upgrades.spread;
      // Calculate base cooldown from permanent rapid fire - slower base fire rate
      var baseCooldown=Math.max(8,16-(permRapid*4));
      if(isTempRapid) baseCooldown=Math.min(baseCooldown,10);
      var bulletSpeed=player.bulletSpeed;
      if(isTempRapid) bulletSpeed=Math.max(bulletSpeed,8);
      // Fewer bullets: spread only adds 1 bullet max, temp spread adds 1
      var spreadCount=1+permSpread+(isTempSpread?1:0);
      var newBullets=[];
      if(spreadCount===1){
        newBullets.push({x:player.x+player.w/2-2,y:player.y-14,w:4,h:10,speed:bulletSpeed});
      } else {
        var startVx=-(spreadCount-1)*1.2;
        for(var bi=0;bi<spreadCount;bi++){
          newBullets.push({
            x:player.x+player.w/2-2+(bi-(spreadCount-1)/2)*4,
            y:player.y-14,
            w:4,h:10,
            speed:bulletSpeed,
            vx:startVx+bi*2.4
          });
        }
      }
      if(upgrades.piercing>0){
        newBullets.forEach(function(b){ b.piercing=true; b._hitEnemies={}; });
      }
      if(upgrades.homing>0){
        newBullets.forEach(function(b){ b.homing=true; });
      }
      for(var nbi=0,nbl=newBullets.length;nbi<nbl;nbi++) bullets.push(newBullets[nbi]);
      shootCooldown=baseCooldown;
      sfxShoot();
    }

    function updatePlayer(){
      if(keys.left&&player.x>8) player.x-=player.speed;
      if(keys.right&&player.x+player.w<W-8) player.x+=player.speed;
      if(keys.shoot){ fireBullet(); }
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
      // apply bullet vx and filter in one pass
      var writeIdx=0;
      for(var bi=0,bl=bullets.length;bi<bl;bi++){
        var b=bullets[bi];
        if(b.vx) b.x+=b.vx;
        if(b.x>-10 && b.x<W+10) bullets[writeIdx++]=b;
      }
      bullets.length=writeIdx;
    }

    function _anyAliveEnemy(){
      for(var ai=0,al=enemies.length;ai<al;ai++){ if(enemies[ai].alive) return true; }
      return false;
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
      if(!waitingForUpgrade && !_anyAliveEnemy()){
        var waveBonus=50+level*10;
        score+=waveBonus;
        spawnFloatText(W/2,H/2,'WAVE CLEAR +'+waveBonus,'#ffd700');
        sfxWaveClear();
        setLabels();
        // Only show upgrade picker when defeating a boss
        if(level%5===0){
          showUpgradePicker();
        } else {
          advanceAfterUpgrade();
        }
      }
      if(shake>0) shake-=1;
      frame+=1;
    }

    function drawFrame(){
      var hasShake=shake>0;
      if(hasShake){
        ctx.save();
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
      ctx.fillStyle='#9e9e9e';ctx.font=FONT_LABEL;ctx.fillText('Level '+level,10,H-8);if(combo>1){ctx.fillStyle='#ffd700';ctx.font=FONT_COMBO;ctx.fillText('Combo x'+combo,W-80,H-8);}
      if(hasShake) ctx.restore();
    }

    function loop(){
      if(!document.hidden){
        updateFrame(); drawFrame();
      }
      requestAnimationFrame(loop);
    }
    loop();

    // ===== INPUT =====
    window.addEventListener('keydown',function(e){
      // Upgrade picker keyboard navigation
      if(waitingForUpgrade){
        e.preventDefault();
        var visCount=getVisibleUpgradeCount();
        if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A'){
          selectedUpgradeIdx=(selectedUpgradeIdx-1+visCount)%visCount;
          highlightUpgradeCard();
        }
        if(e.key==='ArrowRight'||e.key==='d'||e.key==='D'){
          selectedUpgradeIdx=(selectedUpgradeIdx+1)%visCount;
          highlightUpgradeCard();
        }
        if(e.key===' '||e.key==='Spacebar'||e.key==='Enter'){
          var card=upgradeCards[selectedUpgradeIdx];
          var upgradeId=card.getAttribute('data-upgrade-id');
          if(upgradeId) applyUpgrade(upgradeId);
        }
        return;
      }
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
