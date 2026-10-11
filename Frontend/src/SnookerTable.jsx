import { useEffect, useRef, useCallback } from "react";

// Balance between retro pixel art and crispness
const SCALE     = 3.5;
const FRICTION  = 0.983;
const CUSHION_E = 0.66;
const BALL_E    = 0.90;
const MIN_V     = 0.04;
const MAX_V     = 18;
const RAIL      = 6;

const COLORS = [
  "#f0f0f0","#f5c200","#1a44e0","#e01818","#8c18e0",
  "#e05200","#0c8030","#aa1040","#101010",
  "#f5c200","#1a44e0","#e01818","#8c18e0","#e05200","#0c8030","#aa1040",
];
const STRIPE = Array(16).fill(false).map((_,i)=>i>=9);
const RACK   = [1,9,2,10,8,3,11,4,12,5,13,6,14,7,15];

function spawnDust(x, y, count, particles) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = Math.random() * 1.2 + 0.2;
    particles.push({
      x, y, vx: Math.cos(a)*v, vy: Math.sin(a)*v, life: 1,
      lifeDrop: 0.04 + Math.random()*0.06
    });
  }
}

function spawnConfetti(W, H, particles) {
  const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ffffff"];
  for (let i = 0; i < 300; i++) {
    const isLeft = i % 2 === 0;
    particles.push({
      x: isLeft ? 0 : W, 
      y: H * 0.8 + (Math.random() - 0.5) * H * 0.2, // spawn lower part of screen
      z: Math.random() * 15 + 10, // initial height slightly higher
      vx: (isLeft ? 1 : -1) * (Math.random() * 6 + 3.5), // increased horizontal spread
      vy: Math.random() * 6 - 3, // increased vertical spread on table
      vz: Math.random() * 4 + 4, // shoot upwards a bit more
      roll: Math.random() * Math.PI * 2, 
      pitch: Math.random() * Math.PI * 2, 
      yaw: Math.random() * Math.PI * 2,
      rollVel: (Math.random() - 0.5) * 0.4,
      pitchVel: (Math.random() - 0.5) * 0.4,
      yawVel: (Math.random() - 0.5) * 0.4,
      life: 1, 
      lifeDrop: 0, 
      isConfetti: true,
      color: colors[Math.floor(Math.random() * colors.length)],
      width: Math.random() * 3 + 2, // 2 to 5px
      length: Math.random() * 4 + 3 // 3 to 7px
    });
  }
}

function mkBalls(W, H) {
  const br = Math.max(7, Math.min(Math.floor(W * 0.021), 11));
  const sp = Math.ceil(br * 2.06);
  const ax = Math.round(W * 0.725), ay = Math.round(H / 2);
  const balls = [];
  let i = 0;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      const id = RACK[i++];
      balls.push({ id, br,
        x: Math.round(ax + row * sp * 0.866),
        y: Math.round(ay + (col - row / 2) * sp),
        vx:0, vy:0, dead:false, pocketing:false, scale:1,
        nx:0, ny:0, nz:1, sx:0, sy:1, sz:0,
        color: COLORS[id], stripe: STRIPE[id], label: id > 8 ? id - 8 : id
      });
    }
  }
  balls.push({ id:0, br,
    x: Math.round(W * 0.25), y: Math.round(H / 2),
    vx:0, vy:0, dead:false, pocketing:false, scale:1,
    nx:0, ny:0, nz:1, sx:0, sy:1, sz:0,
    color:"#f0f0f0", stripe:false, label:0
  });
  return balls;
}

function mkPockets(W, H, br) {
  const cr = Math.ceil(br * 1.6);
  const mr = Math.ceil(br * 1.35);
  const m  = Math.ceil(br * 0.5);
  return [
    {x:m,     y:m,     r:cr},{x:W-m,   y:m,     r:cr},
    {x:m,     y:H-m,   r:cr},{x:W-m,   y:H-m,   r:cr},
    {x:W>>1,  y:m,     r:mr},{x:W>>1,  y:H-m,   r:mr},
  ];
}

function rotateVec(v, ax, ay, sinT, cosT, omc) {
  const vx = v.x, vy = v.y, vz = v.z;
  const crossX = ay*vz;
  const crossY = -ax*vz;
  const crossZ = ax*vy - ay*vx;
  const dot = ax*vx + ay*vy;
  v.x = vx*cosT + crossX*sinT + ax*dot*omc;
  v.y = vy*cosT + crossY*sinT + ay*dot*omc;
  v.z = vz*cosT + crossZ*sinT;
}

function normalize(v) {
  const mag = Math.hypot(v.x, v.y, v.z) || 1;
  v.x /= mag; v.y /= mag; v.z /= mag;
}

function simulate(balls, W, H, pockets, particles, mouse, grabbedId, state) {
  const live = balls.filter(b => !b.dead);
  
  if (state && !state.winTriggered) {
    const objectBalls = balls.filter(b => b.id !== 0);
    if (objectBalls.length > 0 && objectBalls.every(b => b.pocketing)) {
      state.winTriggered = true;
      spawnConfetti(W, H, particles);
    }
  }
  
  // Update velocities
  live.forEach(b => {
    if (b.pocketing) return;
    
    if (b.id === grabbedId) {
      // Spring physics for dragging
      b.vx += (mouse.x - b.x) * 0.25;
      b.vy += (mouse.y - b.y) * 0.25;
      b.vx *= 0.75; // damping
      b.vy *= 0.75;
    } else {
      const dx = b.x - mouse.x;
      const dy = b.y - mouse.y;
      const dist = Math.hypot(dx, dy);
      const repRadius = b.br * 5; // Repel distance based on ball size
      
      if (dist < repRadius && dist > 0.01) {
        const force = (repRadius - dist) / repRadius;
        b.vx += (dx / dist) * force * 0.8;
        b.vy += (dy / dist) * force * 0.8;
      }

      b.vx *= FRICTION; 
      b.vy *= FRICTION;
    }

    const speed = Math.hypot(b.vx, b.vy);
    if (speed > MAX_V) {
      b.vx = (b.vx / speed) * MAX_V;
      b.vy = (b.vy / speed) * MAX_V;
    }
  });

  // Apply movement and borders
  live.forEach(b => {
    if (b.pocketing) {
      if (b.scale > 0.6) {
        const dx = b.pX - b.x;
        const dy = b.pY - b.y;
        b.x += dx * 0.25;
        b.y += dy * 0.25;
        b.scale *= 0.92;
        
        const vN = {x:b.nx, y:b.ny, z:b.nz};
        rotateVec(vN, 0, 1, Math.sin(0.4), Math.cos(0.4), 1-Math.cos(0.4));
        b.nx=vN.x; b.ny=vN.y; b.nz=vN.z;
        const vS = {x:b.sx, y:b.sy, z:b.sz};
        rotateVec(vS, 0, 1, Math.sin(0.4), Math.cos(0.4), 1-Math.cos(0.4));
        b.sx=vS.x; b.sy=vS.y; b.sz=vS.z;
      }
      return;
    }
    
    const dMove = Math.hypot(b.vx, b.vy);
    if (dMove < MIN_V && b.id !== grabbedId) { 
      b.vx = 0; b.vy = 0; 
    } else if (dMove > 0) {
      const ax = -b.vy / dMove;
      const ay =  b.vx / dMove;
      const theta = dMove / b.br;
      const sinT = Math.sin(theta), cosT = Math.cos(theta), omc = 1 - cosT;

      const vN = {x: b.nx, y: b.ny, z: b.nz};
      rotateVec(vN, ax, ay, sinT, cosT, omc);
      b.nx = vN.x; b.ny = vN.y; b.nz = vN.z;
      normalize(b); 
      let magN = Math.hypot(b.nx, b.ny, b.nz);
      b.nx/=magN; b.ny/=magN; b.nz/=magN;

      const vS = {x: b.sx, y: b.sy, z: b.sz};
      rotateVec(vS, ax, ay, sinT, cosT, omc);
      const dotNS = vS.x*b.nx + vS.y*b.ny + vS.z*b.nz;
      b.sx = vS.x - dotNS*b.nx;
      b.sy = vS.y - dotNS*b.ny;
      b.sz = vS.z - dotNS*b.nz;
      let magS = Math.hypot(b.sx, b.sy, b.sz);
      b.sx/=magS; b.sy/=magS; b.sz/=magS;
    }

    b.x += b.vx; b.y += b.vy;
    
    // Strict bounds (balls will never clip through cushions)
    if (b.x - b.br < RAIL)     { b.x = RAIL + b.br;     b.vx =  Math.abs(b.vx) * CUSHION_E; spawnDust(b.x-b.br, b.y, 4, particles); }
    if (b.x + b.br > W - RAIL) { b.x = W - RAIL - b.br; b.vx = -Math.abs(b.vx) * CUSHION_E; spawnDust(b.x+b.br, b.y, 4, particles); }
    if (b.y - b.br < RAIL)     { b.y = RAIL + b.br;     b.vy =  Math.abs(b.vy) * CUSHION_E; spawnDust(b.x, b.y-b.br, 4, particles); }
    if (b.y + b.br > H - RAIL) { b.y = H - RAIL - b.br; b.vy = -Math.abs(b.vy) * CUSHION_E; spawnDust(b.x, b.y+b.br, 4, particles); }
  });
  
  // Ball collisions
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i], b = live[j];
      if (a.pocketing || b.pocketing) continue;
      const dx = b.x-a.x, dy = b.y-a.y, d = Math.hypot(dx,dy), mn = a.br+b.br;
      if (d < mn && d > 0.001) {
        const nx=dx/d, ny=dy/d, ov=(mn-d)/2;
        // Move balls apart
        a.x-=nx*ov; a.y-=ny*ov; 
        b.x+=nx*ov; b.y+=ny*ov;
        const rvx = a.vx - b.vx, rvy = a.vy - b.vy;
        const velAlongNormal = rvx*nx + rvy*ny;
        if (velAlongNormal > 0) {
          const j_imp = (1 + BALL_E) * velAlongNormal / 2;
          a.vx -= j_imp*nx; a.vy -= j_imp*ny;
          b.vx += j_imp*nx; b.vy += j_imp*ny;
          if (velAlongNormal > 0.4) spawnDust(a.x + nx*a.br, a.y + ny*a.br, 6, particles);
        }
      }
    }
  }
  
  // Pocket check
  live.forEach(b => {
    if (b.pocketing) return;
    for (const p of pockets) {
      if (Math.hypot(b.x-p.x, b.y-p.y) < p.r * 1.2) {
        b.pocketing = true;
        b.pX = p.x + (Math.random()-0.5)*p.r*0.6; 
        b.pY = p.y + (Math.random()-0.5)*p.r*0.6;
        b.vx = 0; b.vy = 0;
        spawnDust(p.x, p.y, 10, particles);
      }
    }
  });

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    
    if (p.isConfetti) {
      if (p.z > 0) {
        p.x += p.vx; 
        p.y += p.vy;
        p.z += p.vz;
        
        p.vz -= 0.03; // gravity
        
        // air resistance
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.vz *= 0.995;

        // Flutter effect
        p.vx += Math.sin(p.yaw) * 0.05;
        p.vy += Math.cos(p.yaw) * 0.05;
        
        p.roll += p.rollVel;
        p.pitch += p.pitchVel;
        p.yaw += p.yawVel;

        if (p.z <= 0) {
          p.z = 0;
          p.vx = 0; p.vy = 0; p.vz = 0;
          p.rollVel = 0; p.pitchVel = 0; p.yawVel = 0;
        }
      }
      
      if (p.x < RAIL + 1) { p.x = RAIL + 1; p.vx *= -0.5; }
      if (p.x > W - RAIL - 1) { p.x = W - RAIL - 1; p.vx *= -0.5; }
      if (p.y < RAIL + 1) { p.y = RAIL + 1; p.vy *= -0.5; }
      if (p.y > H - RAIL - 1) { p.y = H - RAIL - 1; p.vy *= -0.5; }
    } else {
      p.x += p.vx; 
      p.y += p.vy;
      p.life -= p.lifeDrop;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }
}

function render(ctx, W, H, balls, pockets, particles) {
  ctx.fillStyle = "#1b5e27";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#28923e";
  ctx.fillRect(RAIL, RAIL, W - RAIL*2, H - RAIL*2);

  ctx.fillStyle = "rgba(0,0,0,0.07)";
  for (let y = RAIL; y < H - RAIL; y += 2) {
    ctx.fillRect(RAIL, y, W - RAIL*2, 1);
  }

  // Draw circular torn felt revealing wood underneath
  const drawTear = (cx, cy, r) => {
    for (let py = -r-3; py <= r+3; py++) {
      for (let px = -r-3; px <= r+3; px++) {
        const dSq = px*px + py*py;
        if (dSq > (r+2)*(r+2)) continue;
        
        let color = null;
        if (dSq <= r*r) {
          color = "#d4b37d"; // Pale yellow wood base
          if ((cy + py) % 6 === 0) {
             color = "#8a612b"; // dark plank gap
          } else {
             const hash = Math.abs(Math.sin((cx+px)*0.4 + (cy+py)*0.1)) * 10 % 1;
             if (hash > 0.6) color = "#b8945a"; // subtle grain
          }
        } else if (dSq <= (r+1)*(r+1)) {
          color = "#0a210e"; // Deep shadow under the fabric
        } else {
          const hash = Math.abs(Math.sin((cx+px)*12.98 + (cy+py)*78.23)) * 4375 % 1;
          if (hash > 0.3) {
            color = hash > 0.7 ? "#3ba352" : "#175222"; // frayed fabric threads
          }
        }
        
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(cx + px, cy + py, 1, 1);
        }
      }
    }
  };
  
  drawTear(Math.floor(W * 0.65), Math.floor(H * 0.72), 7);
  drawTear(Math.floor(W * 0.28), Math.floor(H * 0.22), 5);

  ctx.fillStyle = "#124018";
  ctx.fillRect(RAIL-1, RAIL-1, W-RAIL*2+2, 1);
  ctx.fillRect(RAIL-1, H-RAIL,   W-RAIL*2+2, 1);
  ctx.fillRect(RAIL-1, RAIL-1, 1, H-RAIL*2+2);
  ctx.fillRect(W-RAIL,  RAIL-1, 1, H-RAIL*2+2);

  ctx.fillStyle = "rgba(255,255,255,0.13)";
  for (let y = RAIL+2; y < H-RAIL-2; y += 5) {
    ctx.fillRect(Math.round(W*0.25), y, 1, 3);
  }

  [[W*0.25,H/2],[W*0.5,H/2],[W*0.725,H/2]].forEach(([sx,sy])=>{
    ctx.fillStyle="rgba(255,255,255,0.22)";
    ctx.fillRect(Math.round(sx)-1, Math.round(sy)-1, 2, 2);
  });

  ctx.strokeStyle="rgba(255,255,255,0.1)"; ctx.lineWidth=1;
  ctx.beginPath(); ctx.arc(W/2|0, H/2|0, balls[0]?.br*2.5||20, 0, Math.PI*2); ctx.stroke();

  pockets.forEach(p=>{
    ctx.fillStyle="rgba(0,0,0,0.55)";
    ctx.beginPath(); ctx.arc(p.x+1, p.y+1, p.r+2, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle="#050c08";
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle="rgba(255,200,80,0.25)"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.stroke();
  });

  balls.forEach(b=>{
    if (b.dead) return;
    const {x,y,color,stripe,label} = b;
    const scale = b.scale || 1;
    const br = Math.max(1, b.br * scale);
    const rx = Math.round(x), ry = Math.round(y);

    if (!b.pocketing) {
      ctx.fillStyle="rgba(0,0,0,0.32)";
      ctx.beginPath(); ctx.arc(rx+1, ry+2, br, 0, Math.PI*2); ctx.fill();
    }

    ctx.save();
    ctx.beginPath(); ctx.arc(rx, ry, br, 0, Math.PI*2); ctx.clip();

    const brInt = Math.ceil(br);
    for (let py = -brInt; py <= brInt; py++) {
      for (let px = -brInt; px <= brInt; px++) {
        const distSq = px*px + py*py;
        if (distSq > br*br) continue;

        const nx = px / br;
        const ny = py / br;
        const nz = Math.sqrt(Math.max(0, 1 - nx*nx - ny*ny));

        const dotN = nx*b.nx + ny*b.ny + nz*b.nz;
        const dotS = nx*b.sx + ny*b.sy + nz*b.sz;

        let pColor = color;
        
        if (stripe) {
          if (Math.abs(dotS) < 0.38) pColor = color;
          else pColor = "#eeeeee";
        }

        if (b.id === 0 && dotN > 0.985) {
          pColor = "#e01818"; // smaller red dot
        }

        ctx.fillStyle = pColor;
        ctx.fillRect(rx + px, ry + py, 1, 1);
      }
    }

    if (b.pocketing) {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(rx-brInt, ry-brInt, brInt*2, brInt*2);
    }

    ctx.restore();

    ctx.beginPath(); ctx.arc(rx, ry, br, 0, Math.PI*2);
    ctx.strokeStyle = b.pocketing ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.42)"; 
    ctx.lineWidth = 1; ctx.stroke();
  });

  particles.forEach(p => {
    if (p.isConfetti) {
      ctx.save();
      ctx.translate(Math.round(p.x), Math.round(p.y - p.z));
      
      const scaleX = Math.max(0.1, Math.abs(Math.cos(p.roll)));
      const scaleY = Math.max(0.1, Math.abs(Math.cos(p.pitch)));
      
      ctx.rotate(p.yaw);
      ctx.scale(scaleX, scaleY);
      
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.width/2, -p.length/2, p.width, p.length);
      ctx.restore();
    } else {
      ctx.fillStyle = `rgba(220, 240, 220, ${Math.max(0, p.life) * 0.7})`;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    }
  });
}

export default function SnookerTable() {
  const canvasRef = useRef(null);
  const S = useRef({ W:0, H:0, balls:[], pockets:[], particles:[], grabbed:null, mouse:{x:-9999,y:-9999}, velHist:[], anim:null, winTriggered:false });

  const init = useCallback(() => {
    const c = canvasRef.current; if (!c) return;
    const W = Math.floor(window.innerWidth  / SCALE);
    const H = Math.floor(window.innerHeight / SCALE);
    c.width = W; c.height = H;
    const s = S.current;
    s.W = W; s.H = H;
    s.balls     = mkBalls(W, H);
    s.pockets   = mkPockets(W, H, s.balls[0]?.br || 10);
    s.particles = [];
    s.grabbed   = null; s.velHist = [];
    s.winTriggered = false;
  }, []);

  const loop = useCallback(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d");
    const s   = S.current;
    simulate(s.balls, s.W, s.H, s.pockets, s.particles, s.mouse, s.grabbed, s);
    render(ctx, s.W, s.H, s.balls, s.pockets, s.particles);
    s.anim = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    init();
    S.current.anim = requestAnimationFrame(loop);
    window.addEventListener("resize", init);
    return () => { window.removeEventListener("resize", init); if (S.current.anim) cancelAnimationFrame(S.current.anim); };
  }, [init, loop]);

  const toLog = useCallback((cx, cy) => ({ x: cx / SCALE, y: cy / SCALE }), []);

  const onDown = useCallback((cx, cy) => {
    const {x,y} = toLog(cx,cy);
    const s = S.current; s.mouse = {x,y};
    for (const b of s.balls) {
      if (b.dead || b.pocketing) continue;
      if (Math.hypot(b.x-x, b.y-y) <= b.br * 1.8) {
        s.grabbed = b.id;
        break;
      }
    }
  }, [toLog]);

  const onMove = useCallback((cx, cy) => {
    const {x,y} = toLog(cx,cy);
    S.current.mouse = {x,y};
  }, [toLog]);

  const onUp = useCallback(() => {
    S.current.grabbed = null;
  }, []);

  const onLeave = useCallback(() => {
    S.current.grabbed = null;
    S.current.mouse = { x: -9999, y: -9999 };
  }, []);

  return (
    <div style={{width:"100vw",height:"100vh",overflow:"hidden",background:"#1b5e27"}}>
      <canvas
        ref={canvasRef}
        style={{width:"100vw",height:"100vh",display:"block",imageRendering:"pixelated",touchAction:"none",cursor:"default"}}
        onMouseDown={e=>onDown(e.clientX,e.clientY)}
        onMouseMove={e=>onMove(e.clientX,e.clientY)}
        onMouseUp={onUp} onMouseLeave={onLeave}
        onTouchStart={e=>{e.preventDefault();onDown(e.touches[0].clientX,e.touches[0].clientY);}}
        onTouchMove={e=>{e.preventDefault();onMove(e.touches[0].clientX,e.touches[0].clientY);}}
        onTouchEnd={e=>{e.preventDefault();onUp();}}
      />
    </div>
  );
}
