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

  // mini shooter game
  var canvas=document.getElementById('game-canvas');
  var scoreLabel=document.getElementById('game-score');
  var livesLabel=document.getElementById('game-lives');
  var statusLabel=document.getElementById('game-status');
  var startBtn=document.getElementById('game-start');
  var resetBtn=document.getElementById('game-reset');
  if(canvas && scoreLabel && livesLabel && statusLabel && startBtn && resetBtn){
    var ctx=canvas.getContext('2d');
    var width=canvas.width;
    var height=canvas.height;
    var keys={left:false,right:false,shoot:false};
    var player={x:width/2-16,y:height-32,w:32,h:12,speed:4};
    var bullets=[];
    var enemies=[];
    var frame=0;
    var level=1;
    var score=0;
    var lives=3;
    var gameOver=true;
    var shootCooldown=0;
    var enemyDirection=1;

    function setStatus(text){ statusLabel.textContent=text; }
    function setLabels(){ scoreLabel.textContent=score; livesLabel.textContent=lives; }

    function spawnWave(){
      enemies=[];
      var rows=2 + Math.min(level,3);
      var cols=6;
      for(var row=0; row<rows; row++){
        for(var col=0; col<cols; col++){
          enemies.push({
            x: 30 + col*46,
            y: 30 + row*28,
            w: 28,
            h: 14,
            alive:true
          });
        }
      }
      enemyDirection=1;
    }

    function resetGame(){
      player.x=width/2-16;
      bullets=[];
      frame=0;
      level=1;
      score=0;
      lives=3;
      gameOver=false;
      shootCooldown=0;
      spawnWave();
      setLabels();
      setStatus('Use ← → and Space to shoot.');
    }

    function drawRect(x,y,w,h,color){ ctx.fillStyle=color; ctx.fillRect(x,y,w,h); }
    function drawPlayer(){ drawRect(player.x, player.y, player.w, player.h, '#e6eef6'); ctx.fillRect(player.x+12, player.y-6, 8, 6); }
    function drawEnemies(){ enemies.forEach(function(enemy){ if(enemy.alive){ drawRect(enemy.x, enemy.y, enemy.w, enemy.h, '#cfcfcf'); }}); }
    function drawBullets(){ bullets.forEach(function(b){ drawRect(b.x, b.y, b.w, b.h, '#8ae2ff'); }); }

    function updateEnemies(){
      var edge=false;
      enemies.forEach(function(enemy){ if(enemy.alive){ enemy.x += 0.5 * level * enemyDirection; if(enemy.x <= 10 || enemy.x + enemy.w >= width-10){ edge=true; } }});
      if(edge){ enemyDirection *= -1; enemies.forEach(function(enemy){ if(enemy.alive){ enemy.y += 16; }}); }
      enemies.forEach(function(enemy){ if(enemy.alive && enemy.y + enemy.h >= player.y){ lives = 0; gameOver=true; setStatus('Game over — enemy reached you.'); }});
    }

    function updateBullets(){
      bullets = bullets.filter(function(b){ return b.y > -10; });
      bullets.forEach(function(b){ b.y -= b.speed; });
      bullets.forEach(function(b){ enemies.forEach(function(enemy){ if(enemy.alive && b.x < enemy.x + enemy.w && b.x + b.w > enemy.x && b.y < enemy.y + enemy.h && b.y + b.h > enemy.y){ enemy.alive=false; b.hit=true; score += 10; setLabels(); }}); });
      bullets = bullets.filter(function(b){ return !b.hit; });
    }

    function fireBullet(){
      if(shootCooldown > 0){ return; }
      bullets.push({ x: player.x + player.w/2 - 2, y: player.y - 12, w:4, h:10, speed:6 });
      shootCooldown = 14;
    }

    function updatePlayer(){
      if(keys.left && player.x > 8){ player.x -= player.speed; }
      if(keys.right && player.x + player.w < width-8){ player.x += player.speed; }
      if(keys.shoot){ fireBullet(); }
      if(shootCooldown > 0){ shootCooldown -= 1; }
    }

    function updateFrame(){
      if(gameOver){ return; }
      updatePlayer();
      updateBullets();
      updateEnemies();
      if(enemies.every(function(enemy){ return !enemy.alive; })){ level += 1; setStatus('Wave cleared! Level ' + level); spawnWave(); }
      if(lives <= 0){ gameOver = true; setStatus('Game over — press Reset to try again.'); }
      frame += 1;
    }

    function drawFrame(){
      ctx.clearRect(0,0,width,height);
      drawPlayer();
      drawEnemies();
      drawBullets();
      ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.lineWidth=1;
      ctx.strokeRect(2,2,width-4,height-4);
      ctx.fillStyle='rgba(255,255,255,0.08)';
      ctx.fillRect(0,height-20,width,20);
      ctx.fillStyle='#9e9e9e'; ctx.font='11px Inter, system-ui, sans-serif'; ctx.fillText('Level ' + level, 10, height-8);
    }

    function loop(){ updateFrame(); drawFrame(); requestAnimationFrame(loop); }
    loop();

    window.addEventListener('keydown', function(e){ if(e.key==='ArrowLeft' || e.key==='a'){ keys.left=true; } if(e.key==='ArrowRight' || e.key==='d'){ keys.right=true; } if(e.key===' ' || e.key==='Spacebar'){ keys.shoot=true; e.preventDefault(); }});
    window.addEventListener('keyup', function(e){ if(e.key==='ArrowLeft' || e.key==='a'){ keys.left=false; } if(e.key==='ArrowRight' || e.key==='d'){ keys.right=false; } if(e.key===' ' || e.key==='Spacebar'){ keys.shoot=false; }});

    startBtn.addEventListener('click', function(){ if(gameOver){ resetGame(); } else { setStatus('Game started'); } });
    resetBtn.addEventListener('click', resetGame);
    resetGame();
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
