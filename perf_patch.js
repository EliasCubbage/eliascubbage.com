const fs=require('fs');
let s=fs.readFileSync('app-cubblitz.js','utf8');
let c=0;
function r(o,n){if(s.indexOf(o)===-1){console.error('NOT FOUND: '+o.substring(0,50));return;}s=s.replace(o,n);c++;}

// 1. Perf constants + starfield TWO_PI
r('    // init starfield\n    for(var si=0;si<80;si++){',
  "    // PERFORMANCE: precompute constants\n    var TWO_PI = Math.PI * 2;\n    var FONT_FLOAT = 'bold 11px Inter, system-ui, sans-serif';\n    var FONT_LABEL = '11px Inter, system-ui, sans-serif';\n    var FONT_COMBO = 'bold 12px Inter, system-ui, sans-serif';\n    // PERFORMANCE: throttled adaptive game loop\n    var FPS = 30;\n    var frameMs = 1000 / FPS;\n    var lastFrameTs = 0;\n    var _slowFrames = 0;\n    var _lowPerf = false;\n    var _perfFrames = 0;\n\n    // init starfield\n    for(var si=0;si<80;si++){");
r("tw:Math.random()*Math.PI*2});\n    }","tw:Math.random()*TWO_PI});\n    }");

// 2. Game loop
r("    function loop(){ updateFrame(); drawFrame(); requestAnimationFrame(loop); }\n    loop();",
  "    function loop(ts){\n      if(typeof ts!=='number')ts=(typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();\n      if(document.hidden){lastFrameTs=ts;requestAnimationFrame(loop);return;}\n      var delta=ts-lastFrameTs;\n      if(delta>0&&delta<frameMs){requestAnimationFrame(loop);return;}\n      lastFrameTs=ts;\n      if(gamePaused){\n        if(playerExploding){playerExplodeTimer+=1;if(playerExplodeTimer>30)playerExploding=false;}\n        updateParticles();updateFloatTexts();\n        if(shake>0)shake-=1;frame+=1;requestAnimationFrame(loop);return;\n      }\n      if(!gameStarted&&!playerExploding&&particles.length===0&&floatTexts.length===0){frame+=1;requestAnimationFrame(loop);return;}\n      var _cost=Date.now();\n      updateFrame();drawFrame();\n      if(!_lowPerf){_perfFrames++;if(Date.now()-_cost>frameMs+16)_slowFrames++;else if(_slowFrames>0)_slowFrames--;if(_slowFrames>20&&FPS>20){FPS=20;frameMs=1000/FPS;_lowPerf=true;_slowFrames=0;}}\n      requestAnimationFrame(loop);\n    }\n    loop(0);");

// 3. drawStars
r("    function drawStars(){\n      stars.forEach(function(s){\n        s.y+=s.s; s.tw+=0.05;\n        if(s.y>H){ s.y=-2; s.x=Math.random()*W; }\n        var alpha=0.3+Math.abs(Math.sin(s.tw))*0.5;\n        ctx.fillStyle='rgba(255,255,255,'+alpha+')';\n        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();\n      });\n    }",
  "    function drawStars(){ctx.fillStyle='#fff';for(var si=0,sl=stars.length;si<sl;si++){var s=stars[si];s.y+=s.s;s.tw+=0.05;if(s.y>H){s.y=-2;s.x=Math.random()*W;}ctx.globalAlpha=0.3+Math.abs(Math.sin(s.tw))*0.5;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,TWO_PI);ctx.fill();}ctx.globalAlpha=1;}");

// 4. drawParticles
r("    function drawParticles(){\n      particles.forEach(function(p){\n        var alpha=p.life/p.maxLife;\n        ctx.globalAlpha=alpha;\n        ctx.fillStyle=p.color;\n        ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);\n        ctx.globalAlpha=1;\n      });\n    }",
  "    function drawParticles(){if(!particles.length)return;for(var pi=0,pl=particles.length;pi<pl;pi++){var p=particles[pi];ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);}ctx.globalAlpha=1;}");

// 5. drawFloatTexts
r("    function drawFloatTexts(){\n      floatTexts.forEach(function(f){\n        ctx.globalAlpha=Math.min(1,f.life/30);\n        ctx.fillStyle=f.color;\n        ctx.font='bold 11px Inter, system-ui, sans-serif';\n        ctx.textAlign='center';\n        ctx.fillText(f.text,f.x,f.y);\n        ctx.textAlign='left';\n        ctx.globalAlpha=1;\n      });\n    }",
  "    function drawFloatTexts(){if(!floatTexts.length)return;ctx.textAlign='center';ctx.font=FONT_FLOAT;for(var fi=0,fl=floatTexts.length;fi<fl;fi++){var f=floatTexts[fi];ctx.globalAlpha=Math.min(1,f.life/30);ctx.fillStyle=f.color;ctx.fillText(f.text,f.x,f.y);}ctx.globalAlpha=1;ctx.textAlign='left';}");

// 6a. drawPowerups start
r("    function drawPowerups(){\n      powerups.forEach(function(p){\n        p.phase+=0.1;\n        var bob=Math.sin(p.phase)*2;\n        var cx=p.x+p.w/2, cy=p.y+p.h/2+bob;\n        ctx.fillStyle=p.color;\n        ctx.globalAlpha=0.9;\n        if(p.type==='rapid'){",
  "    function drawPowerups(){if(!powerups.length)return;ctx.textAlign='center';ctx.font=FONT_FLOAT;for(var pi=0,pl=powerups.length;pi<pl;pi++){var p=powerups[pi];p.phase+=0.1;var bob=Math.sin(p.phase)*2;var cx=p.x+p.w/2,cy=p.y+p.h/2+bob;ctx.fillStyle=p.color;ctx.globalAlpha=0.9;if(p.type==='rapid'){");

// 6b. drawPowerups end
r("        ctx.fillStyle='#000';\n        ctx.font='bold 11px Inter, system-ui, sans-serif';\n        ctx.textAlign='center';\n        ctx.fillText(p.label,cx,p.y+bob+p.h-5);\n        ctx.textAlign='left';\n        ctx.globalAlpha=1;\n      });\n    }",
  "        ctx.fillStyle='#000';ctx.fillText(p.label,cx,p.y+bob+p.h-5);}\n      ctx.globalAlpha=1;ctx.textAlign='left';}");

// 7. drawBullets
r("    function drawBullets(){\n      bullets.forEach(function(b){\n        ctx.fillStyle='#8ae2ff';\n        ctx.fillRect(b.x,b.y,b.w,b.h);\n        ctx.fillStyle='rgba(38,226,255,0.3)';\n        ctx.fillRect(b.x-1,b.y+b.h,b.w+2,8);\n      });\n    }",
  "    function drawBullets(){if(!bullets.length)return;for(var bi=0,bl=bullets.length;bi<bl;bi++){var b=bullets[bi];ctx.fillStyle='#8ae2ff';ctx.fillRect(b.x,b.y,b.w,b.h);ctx.fillStyle='rgba(38,226,255,0.3)';ctx.fillRect(b.x-1,b.y+b.h,b.w+2,8);}}");

// 8a. drawEnemyBullets start
r("    function drawEnemyBullets(){\n      enemyBullets.forEach(function(b){\n        if(b.rocket){",
  "    function drawEnemyBullets(){if(!enemyBullets.length)return;for(var ebi=0,ebl=enemyBullets.length;ebi<ebl;ebi++){var b=enemyBullets[ebi];if(b.rocket){");

// 8b. drawEnemyBullets end
r("        else {\n          ctx.fillStyle='#ff6644';\n          ctx.fillRect(b.x,b.y,b.w,b.h);\n          ctx.fillStyle='rgba(255,102,68,0.3)';\n          ctx.fillRect(b.x-1,b.y-8,b.w+2,8);\n        }\n      });\n    }",
  "        else {ctx.fillStyle='#ff6644';ctx.fillRect(b.x,b.y,b.w,b.h);ctx.fillStyle='rgba(255,102,68,0.3)';ctx.fillRect(b.x-1,b.y-8,b.w+2,8);}");

// 9. drawEnemies
r("    function drawEnemies(){ enemies.forEach(function(e){ if(e.alive) drawEnemy(e); }); }",
  "    function drawEnemies(){for(var di=0,dl=enemies.length;di<dl;di++){if(enemies[di].alive)drawEnemy(enemies[di]);}}");

// 10. drawFrame fonts
r("      ctx.fillStyle='#9e9e9e'; ctx.font='11px Inter, system-ui, sans-serif';\n      ctx.fillText('Level '+level,10,H-8);\n      if(combo>1){\n        ctx.fillStyle='#ffd700'; ctx.font='bold 12px Inter, system-ui, sans-serif';\n        ctx.fillText('Combo x'+combo,W-80,H-8);\n      }",
  "      ctx.fillStyle='#9e9e9e';ctx.font=FONT_LABEL;ctx.fillText('Level '+level,10,H-8);if(combo>1){ctx.fillStyle='#ffd700';ctx.font=FONT_COMBO;ctx.fillText('Combo x'+combo,W-80,H-8);}");

// 11. drawPlayer shield arc
r("ctx.beginPath(); ctx.arc(px+pw/2,py+ph/2,pw,0,Math.PI*2); ctx.fill();",
  "ctx.beginPath(); ctx.arc(px+pw/2,py+ph/2,pw,0,TWO_PI); ctx.fill();");

// 12. Global Math.PI*2 -> TWO_PI for any remaining
s=s.replace(/Math\.PI\*2/g,'TWO_PI');

fs.writeFileSync('app-cubblitz.js',s);
console.log('Changes:'+c+' Lines:'+s.split('\n').length);
