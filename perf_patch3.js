const fs = require('fs');
let s = fs.readFileSync('app-cubblitz.js', 'utf8');
// Normalize line endings
s = s.split('\r\n').join('\n');
let c = 0;
function r(o, n) {
  if (s.indexOf(o) === -1) { console.error('NOT FOUND:\n' + o.substring(0, 120).replace(/\n/g, '\\n')); return false; }
  s = s.replace(o, n); c++; return true;
}

// ============================================================
// 1. updateBullets — single-pass in-place filtering, for loops,
//    squared-distance homing (avoids sqrt in the hot loop)
// ============================================================
r(`    function updateBullets(){
      bullets=bullets.filter(function(b){ return b.y>-10; });
      bullets.forEach(function(b){ b.y-=b.speed; });
      // Homing shots: curve toward nearest enemy
      if(upgrades.homing>0){
        bullets.forEach(function(b){
          if(b.homing){
            var nearest=null,nearestDist=999999;
            enemies.forEach(function(e){
              if(e.alive){
                var ex=e.x+e.w/2,ey=e.y+e.h/2,bx=b.x+b.w/2,by=b.y+b.h/2;
                var dist=Math.sqrt((ex-bx)*(ex-bx)+(ey-by)*(ey-by));
                if(dist<nearestDist){ nearestDist=dist; nearest=e; }
              }
            });
            if(nearest&&nearestDist<200){
              var dx=(nearest.x+nearest.w/2)-(b.x+b.w/2);
              var dy=(nearest.y+nearest.h/2)-(b.y+b.h/2);
              var d=Math.sqrt(dx*dx+dy*dy);
              if(d>1){
                b.vx=(b.vx||0)+(dx/d*0.3);
                var maxVx=b.speed*0.6;
                if(b.vx>maxVx) b.vx=maxVx;
                if(b.vx<-maxVx) b.vx=-maxVx;
              }
            }
          }
        });
      }
      bullets.forEach(function(b){
        if(b.hit) return;
        enemies.forEach(function(e){
          if(e.alive&&b.x<e.x+e.w&&b.x+b.w>e.x&&b.y<e.y+e.h&&b.y+b.h>e.y){
            // Piercing: track which enemies this bullet already hit
            if(b.piercing){
              var eKey=e.gridX+','+e.gridY+','+e.shape;
              if(b._hitEnemies[eKey]) return;
              b._hitEnemies[eKey]=true;
            }
            e.hp-=player.bulletDamage; e.hitFlash=4; sfxHit();
            if(!b.piercing) b.hit=true;
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
    }`,
`    function updateBullets(){
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
    }`);

// ============================================================
// 2. updateEnemies — build diveCandidates only when needed
// ============================================================
r(`      // Collect alive non-boss enemies eligible for diving
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
      }`,
`      // Trigger dive attack if countdown expires - more frequent, in squads
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
            // Squad target - spread across player area
            diver.diveTargetX=player.x+player.w/2+(Math.random()-0.5)*80;
            diver.diveTargetY=player.y+player.h/2+30+(Math.random()-0.5)*40;
            diver.diveSpeed=2.5+Math.random()*1.5;
          }
          // Shorter delay between dive waves (come down twice as much)
          diveCountdown=120+Math.floor(Math.random()*60);
        } else {
          diveCountdown=30;
        }
      }`);

// ============================================================
// 3. updateEnemies — replace enemies.forEach with for loop
// ============================================================
r(`      enemies.forEach(function(e){
        if(!e.alive) return;

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
            // Diving enemies shoot straight shots only (no homing missiles)
            if(shooterCount<maxShooters && Math.random()<0.025*enemyShootMult){
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

        // Formation enemies shoot straight shots only (no homing missiles)
        if(shooterCount<maxShooters && Math.random()<0.004*enemyShootMult && frame%180<20){
          enemyBullets.push({x:e.x+e.w/2-2,y:e.y+e.h,w:4,h:8,speed:2+level*0.2,vx:0});
          shooterCount++;
        }
      });`,
`      for(var ei2=0,el2=enemies.length;ei2<el2;ei2++){
        var e=enemies[ei2];
        if(!e.alive) continue;

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

        // Diving toward player position
        if(e.diving){
          var dx=e.diveTargetX-e.x;
          var dy=e.diveTargetY-e.y;
          var dist=Math.sqrt(dx*dx+dy*dy);
          if(dist>5){
            e.x+=dx/dist*e.diveSpeed;
            e.y+=dy/dist*e.diveSpeed;
            // Diving enemies shoot straight shots only (no homing missiles)
            if(shooterCount<maxShooters && Math.random()<0.025*enemyShootMult){
              enemyBullets.push({x:e.x+e.w/2-2,y:e.y+e.h,w:4,h:8,speed:2+level*0.2,vx:0});
              shooterCount++;
            }
          } else {
            // Reached target, return to formation
            e.diving=false;
            e.returning=true;
            e.returnTimer=30;
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
      }`);

// ============================================================
// 4. updateEnemyBullets — single-pass in-place filtering
// ============================================================
r(`    function updateEnemyBullets(){
      enemyBullets=enemyBullets.filter(function(b){ return b.y<H+10 && (!b.vx || (b.x>-10 && b.x<W+10)); });
      enemyBullets.forEach(function(b){
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
      });
      enemyBullets.forEach(function(b){
        if(b.hit) return;
        if(player.invuln<=0 && b.x<player.x+player.w&&b.x+b.w>player.x&&b.y<player.y+player.h&&b.y+b.h>player.y){
          b.hit=true;
          damagePlayer();
        }
      });
      enemyBullets=enemyBullets.filter(function(b){ return !b.hit; });
    }`,
`    function updateEnemyBullets(){
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
    }`);

// ============================================================
// 5. updatePowerups — single-pass in-place filtering
// ============================================================
r(`    function updatePowerups(){
      powerups=powerups.filter(function(p){ return p.y<H+10; });
      powerups.forEach(function(p){
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
      });
      powerups=powerups.filter(function(p){ return !p.hit; });
    }`,
`    function updatePowerups(){
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
    }`);

// ============================================================
// 6. updateParticles — single-pass in-place filtering
// ============================================================
r(`    function updateParticles(){
      particles=particles.filter(function(p){ return p.life>0; });
      particles.forEach(function(p){
        p.x+=p.vx; p.y+=p.vy;
        p.vx*=0.96; p.vy*=0.96; p.vy+=0.05;
        p.life-=1;
      });
    }`,
`    function updateParticles(){
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
    }`);

// ============================================================
// 7. updateFloatTexts — single-pass in-place filtering
// ============================================================
r(`    function updateFloatTexts(){
      floatTexts=floatTexts.filter(function(f){ return f.life>0; });
      floatTexts.forEach(function(f){ f.y+=f.vy; f.life-=1; });
    }`,
`    function updateFloatTexts(){
      var fi,fl,f;
      var writeIdx=0;
      for(fi=0,fl=floatTexts.length;fi<fl;fi++){
        f=floatTexts[fi];
        f.y+=f.vy; f.life-=1;
        if(f.life>0) floatTexts[writeIdx++]=f;
      }
      floatTexts.length=writeIdx;
    }`);

// ============================================================
// 8. checkEnemyContact — for loop
// ============================================================
r(`    function checkEnemyContact(){
      if(player.invuln>0||playerExploding) return;
      enemies.forEach(function(e){
        if(!e.alive) return;
        if(e.x<player.x+player.w&&e.x+e.w>player.x&&e.y<player.y+player.h&&e.y+e.h>player.y){
          // Destroy the enemy on contact
          e.alive=false;
          spawnExplosion(e.x+e.w/2,e.y+e.h/2,e.bodyColor,12);
          if(!damagePlayer()){
            // If player still alive, extra effects
            spawnExplosion(player.x+player.w/2,player.y+player.h/2,'#ffcc00',6);
          }
        }
      });
    }`,
`    function checkEnemyContact(){
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
    }`);

// ============================================================
// 9. updatePlayer — apply vx and filter in one pass
// ============================================================
r(`      // apply bullet vx
      bullets.forEach(function(b){ if(b.vx) b.x+=b.vx; });
      bullets=bullets.filter(function(b){ return b.x>-10 && b.x<W+10; });`,
`      // apply bullet vx and filter in one pass
      var writeIdx=0;
      for(var bi=0,bl=bullets.length;bi<bl;bi++){
        var b=bullets[bi];
        if(b.vx) b.x+=b.vx;
        if(b.x>-10 && b.x<W+10) bullets[writeIdx++]=b;
      }
      bullets.length=writeIdx;`);

// ============================================================
// 10. fireBullet — push instead of concat (no new array)
// ============================================================
r(`      bullets=bullets.concat(newBullets);
      shootCooldown=baseCooldown;`,
`      for(var nbi=0,nbl=newBullets.length;nbi<nbl;nbi++) bullets.push(newBullets[nbi]);
      shootCooldown=baseCooldown;`);

// ============================================================
// 11. drawFrame — only save/restore when shake > 0
// ============================================================
r(`    function drawFrame(){
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
      ctx.fillStyle='#9e9e9e';ctx.font=FONT_LABEL;ctx.fillText('Level '+level,10,H-8);if(combo>1){ctx.fillStyle='#ffd700';ctx.font=FONT_COMBO;ctx.fillText('Combo x'+combo,W-80,H-8);}
      ctx.restore();
    }`,
`    function drawFrame(){
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
    }`);

// ============================================================
// 12. updateFrame — replace enemies.every() with for-loop helper
// ============================================================
r(`    function updateFrame(){
      if(!gameStarted||gameOver||gamePaused){`,
`    function _anyAliveEnemy(){
      for(var ai=0,al=enemies.length;ai<al;ai++){ if(enemies[ai].alive) return true; }
      return false;
    }

    function updateFrame(){
      if(!gameStarted||gameOver||gamePaused){`);

r(`      if(!waitingForUpgrade && enemies.every(function(e){ return !e.alive; })){`,
`      if(!waitingForUpgrade && !_anyAliveEnemy()){`);

// ============================================================
// 13. drawStars — fillRect instead of arc (tiny stars)
// ============================================================
r(`    function drawStars(){ctx.fillStyle='#fff';for(var si=0,sl=stars.length;si<sl;si++){var s=stars[si];s.y+=s.s;s.tw+=0.05;if(s.y>H){s.y=-2;s.x=Math.random()*W;}ctx.globalAlpha=0.3+Math.abs(Math.sin(s.tw))*0.5;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,TWO_PI);ctx.fill();}ctx.globalAlpha=1;}`,
`    function drawStars(){ctx.fillStyle='#fff';for(var si=0,sl=stars.length;si<sl;si++){var s=stars[si];s.y+=s.s;s.tw+=0.05;if(s.y>H){s.y=-2;s.x=Math.random()*W;}ctx.globalAlpha=0.3+Math.abs(Math.sin(s.tw))*0.5;var sr=s.r*2;ctx.fillRect(s.x,s.y,sr,sr);}ctx.globalAlpha=1;}`);

// ============================================================
// 14. drawBullets — batch by color (2 fillStyle changes total)
// ============================================================
r(`    function drawBullets(){if(!bullets.length)return;for(var bi=0,bl=bullets.length;bi<bl;bi++){var b=bullets[bi];ctx.fillStyle='#8ae2ff';ctx.fillRect(b.x,b.y,b.w,b.h);ctx.fillStyle='rgba(138,226,255,0.3)';ctx.fillRect(b.x-1,b.y+b.h,b.w+2,8);}}`,
`    function drawBullets(){if(!bullets.length)return;ctx.fillStyle='#8ae2ff';for(var bi=0,bl=bullets.length;bi<bl;bi++){var b=bullets[bi];ctx.fillRect(b.x,b.y,b.w,b.h);}ctx.fillStyle='rgba(138,226,255,0.3)';for(bi=0;bi<bl;bi++){var b2=bullets[bi];ctx.fillRect(b2.x-1,b2.y+b2.h,b2.w+2,8);}}`);

// Restore Windows line endings
s = s.split('\n').join('\r\n');
fs.writeFileSync('app-cubblitz.js', s);
console.log('Changes applied: ' + c + ' Lines: ' + s.split('\r\n').length);