import { SIZE, makeBoard, shoot, aiTarget } from './engine.js';
const $ = id => document.getElementById(id);
let boards, player, mode = 'solo', phase, busy, timer, generation = 0;
let last = [null,null], hover = null, aim = [30,30], turns = 0;
const names = () => mode === 'solo' ? ['Vos','Computadora'] : ['Jugador 1','Jugador 2'];
function reset() {
  clearTimeout(timer); generation++; boards = [makeBoard(),makeBoard()]; player = 0; phase = 'setup'; busy = false; last = [null,null]; hover = null; turns = 0;
  if ($('handoff').open) $('handoff').close();
  $('log').replaceChildren(); log('Flotas distribuidas. Prepará la primera maniobra.');
  $('setup').hidden = false; render();
}
function log(message) { const li = document.createElement('li'); li.textContent = message; $('log').prepend(li); while ($('log').children.length > 40) $('log').lastChild.remove(); }
function draw(id, board, reveal, shot, target) {
  const c = $(id), ctx = c.getContext('2d'), s = c.width / SIZE;
  ctx.fillStyle = '#10292c'; ctx.fillRect(0,0,c.width,c.height);
  if (reveal) for (const ship of board.ships) {
    ctx.fillStyle = ship.hits === ship.w * ship.h ? '#674d40' : '#426f70';
    ctx.fillRect(ship.x*s,ship.y*s,ship.w*s,ship.h*s);
    ctx.strokeStyle='#81a6a1'; ctx.strokeRect(ship.x*s+1,ship.y*s+1,ship.w*s-2,ship.h*s-2);
  }
  for (const [key, hit] of board.shots) {
    const x = key % SIZE, y = Math.floor(key / SIZE);
    ctx.fillStyle = hit ? '#ed946a' : '#426165'; ctx.fillRect(x*s+1,y*s+1,s-2,s-2);
  }
  ctx.strokeStyle = '#284548'; ctx.lineWidth = .5; ctx.beginPath();
  for (let i=0;i<=SIZE;i++) { ctx.moveTo(i*s,0);ctx.lineTo(i*s,c.height);ctx.moveTo(0,i*s);ctx.lineTo(c.width,i*s); } ctx.stroke();
  if (shot) { ctx.strokeStyle='#d9f477';ctx.lineWidth=2;ctx.strokeRect((shot.cx-1)*s,(shot.cy-1)*s,3*s,3*s);ctx.strokeStyle='#ffffff';ctx.beginPath();ctx.arc((shot.x+.5)*s,(shot.y+.5)*s,3,0,Math.PI*2);ctx.stroke(); }
  if (target) { ctx.fillStyle='#d9f47733';ctx.strokeStyle='#d9f477';ctx.lineWidth=2;ctx.fillRect((target[0]-1)*s,(target[1]-1)*s,3*s,3*s);ctx.strokeRect((target[0]-1)*s,(target[1]-1)*s,3*s,3*s); }
}
function render() {
  const own = boards[player], enemy = boards[1-player];
  draw('own', own, true, last[player]); draw('enemy', enemy, phase === 'over', last[1-player], phase === 'play' && !busy ? hover : null);
  const afloat = b => b.ships.filter(s => s.hits < s.w*s.h).length;
  $('own-count').textContent = `${afloat(own)} a flote`; $('enemy-count').textContent = `${afloat(enemy)} a flote`;
  $('own-title').textContent = mode === 'solo' ? 'Tu flota' : `Flota del jugador ${player+1}`;
  $('enemy-title').textContent = mode === 'solo' ? 'Radar enemigo' : `Radar del jugador ${2-player}`;
  $('fleet').replaceChildren(...own.ships.map(s => { const el=document.createElement('span');el.textContent=`${s.name} · ${s.length} × 9 · ${Math.round(100*s.hits/(s.w*s.h))}% dañado`; return el; }));
  if (phase !== 'over') $('status').textContent = phase === 'setup' ? 'Prepará tu flota' : busy ? 'La computadora está apuntando…' : `Turno: ${names()[player]}`;
}
function pass(next) {
  // Clear both canvases before showing the opaque handoff screen.
  for (const id of ['own','enemy']) $(id).getContext('2d').clearRect(0,0,720,720);
  $('fleet').replaceChildren(); player = next; hover = null;
  $('handoff-title').textContent = `Le toca al jugador ${player+1}`; $('handoff').showModal();
}
function fire(x,y) {
  if (phase !== 'play' || busy || $('handoff').open) return;
  takeShot(player,x,y);
  if (phase === 'over') return;
  if (mode === 'duo') { pass(1-player); return; }
  busy = true; render(); const token = generation;
  timer=setTimeout(() => { if (token !== generation) return; const [xx,yy]=aiTarget(boards[0]);takeShot(1,xx,yy);busy=false;render(); },650);
}
function takeShot(attacker,x,y) {
  const target=1-attacker, result=shoot(boards[target],x,y); last[target]=result; turns++;
  log(`${String(turns).padStart(2,'0')} · ${names()[attacker]} → (${x+1}, ${y+1})${result.shifted ? ` · deriva a (${result.cx+1}, ${result.cy+1})` : ' · certero'} · ${result.hits} impactos nuevos${result.sunk.length ? ' · Hundido: '+result.sunk.join(', ') : ''}`);
  if(result.won) { phase='over';$('status').textContent=`¡${names()[attacker]} ganó la batalla!`;log(`Victoria de ${names()[attacker]}. Toda la flota rival fue hundida.`); }
  render();
}
function pointer(e) { const r=$('enemy').getBoundingClientRect();return [Math.max(0,Math.min(59,Math.floor((e.clientX-r.left)/r.width*SIZE))),Math.max(0,Math.min(59,Math.floor((e.clientY-r.top)/r.height*SIZE)))]; }
$('enemy').addEventListener('pointermove', e=> { hover=pointer(e);aim=hover;$('coords').textContent=`Col ${hover[0]+1} · Fila ${hover[1]+1}`;render(); });
$('enemy').addEventListener('pointerleave',()=>{hover=null;render();});
$('enemy').addEventListener('click',e=>fire(...pointer(e)));
$('enemy').addEventListener('keydown',e=>{const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(d){e.preventDefault();aim=aim.map((v,i)=>Math.max(0,Math.min(59,v+d[i])));hover=aim;$('coords').textContent=`Col ${aim[0]+1} · Fila ${aim[1]+1}`;render();}else if(e.key==='Enter'||e.key===' '){e.preventDefault();fire(...aim);}});
$('shuffle').onclick=()=>{boards[player]=makeBoard();render();};
$('start').onclick=()=>{phase='play';$('setup').hidden=true;log('Batalla iniciada. Cada turno permite un disparo de 3 × 3.');render();};
$('new').onclick=()=>{if(phase==='play'&&!confirm('¿Terminar esta batalla y comenzar una nueva?'))return;reset();};
for(const m of ['solo','duo']) $(m).onclick=()=>{if(mode===m)return;if(phase==='play'&&!confirm('¿Cambiar de modo y reiniciar la batalla?'))return;mode=m;for(const id of ['solo','duo'])$(id).classList.toggle('active',id===m);reset();};
$('ready').onclick=()=>{$('handoff').close();render();};
$('handoff').addEventListener('cancel',e=>e.preventDefault());
reset();
