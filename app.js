import { SIZE, makeBoard, shoot, aiTarget, RULES, isSunk, damageLimit, roundWinner } from './engine.js';
const $ = id => document.getElementById(id);
let boards, player, mode = 'solo', phase, busy, timer, generation = 0;
let last = [null,null], hover = null, aim = [30,30], turns = 0;
let ruleMode = 'quick', queued = [], completed = 0;
const rules = () => RULES[ruleMode];
const names = () => mode === 'solo' ? ['Vos','Computadora'] : ['Jugador 1','Jugador 2'];
function reset() {
  clearTimeout(timer); generation++; queued = []; completed = 0; boards = [makeBoard(),makeBoard()]; player = 0; phase = 'setup'; busy = false; last = [null,null]; hover = null; turns = 0;
  if ($('handoff').open) $('handoff').close();
  $('log').replaceChildren(); log('Flotas distribuidas. Prepará la primera maniobra.');
  $('setup').hidden = false; render();
}
function log(message) { const li = document.createElement('li'); li.textContent = message; $('log').prepend(li); while ($('log').children.length > 40) $('log').lastChild.remove(); }
function draw(id, board, reveal, shot, target) {
  const c = $(id), ctx = c.getContext('2d'), s = c.width / SIZE;
  ctx.fillStyle = '#10292c'; ctx.fillRect(0,0,c.width,c.height);
  if (reveal) for (const ship of board.ships) {
    ctx.fillStyle = isSunk(ship, rules().threshold) ? '#674d40' : '#426f70';
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
  const afloat = b => b.ships.filter(s => !isSunk(s, rules().threshold)).length;
  $('own-count').textContent = `${afloat(own)} a flote`; $('enemy-count').textContent = `${afloat(enemy)} a flote`;
  $('own-title').textContent = mode === 'solo' ? 'Tu flota' : `Flota del jugador ${player+1}`;
  $('enemy-title').textContent = mode === 'solo' ? 'Radar enemigo' : `Radar del jugador ${2-player}`;
  $('fleet').replaceChildren(...own.ships.map(s => { const el=document.createElement('span');el.textContent=`${s.name} · ${s.length} × 9 · ${Math.round(100*s.hits/(s.w*s.h))}% dañado`; return el; }));
  renderDamage();
  $('rules').disabled = phase !== 'setup';
  $('round-info').textContent = ruleMode === 'quick' ? `Ronda ${Math.min(20, Math.floor(completed / 2) + 1)} / 20 · Hundimiento al 25 %` : 'Clásica · Sin límite de rondas';
  $('salvo-info').textContent = phase === 'setup' ? 'Comenzá la batalla para elegir objetivos.' : `${queued.length} / ${rules().salvo} objetivos elegidos · Volvé a tocar un objetivo para quitarlo.`;
  $('launch').disabled = phase !== 'play' || busy || queued.length !== rules().salvo;
  if (queued.length) { const ctx = $('enemy').getContext('2d'); ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.font = 'bold 14px monospace'; queued.forEach(([x,y],i) => {ctx.strokeRect((x-1)*12,(y-1)*12,36,36);ctx.fillText(String(i+1), x*12,y*12);}); }
  if (phase !== 'over') $('status').textContent = phase === 'setup' ? 'Prepará tu flota' : busy ? 'La computadora está apuntando…' : `Turno: ${names()[player]}`;
}
function pass(next) {
  // Clear both canvases before showing the opaque handoff screen.
  for (const id of ['own','enemy']) $(id).getContext('2d').clearRect(0,0,720,720);
  $('fleet').replaceChildren(); $('damage-cards').replaceChildren(); player = next; hover = null;
  $('handoff-title').textContent = `Le toca al jugador ${player+1}`; $('handoff').showModal();
}
function fire(x,y) {
  if (phase !== 'play' || busy || $('handoff').open) return;
  const index = queued.findIndex(([xx,yy]) => xx === x && yy === y);
  if (index >= 0) queued.splice(index,1);
  else if (queued.length < rules().salvo) queued.push([x,y]);
  render();
}
function finishTurn() {
  completed++;
  if (phase === 'over') return;
  if (completed >= rules().rounds * 2) {
    const winner = roundWinner(boards, rules().threshold);
    phase = 'over';
    $('status').textContent = winner === null ? 'Empate tras 20 rondas' : `¡${names()[winner]} ganó tras 20 rondas!`;
    log($('status').textContent + ' Se compararon barcos hundidos y daño total.');
  }
}
$('launch').onclick = () => {
  if (phase !== 'play' || busy || queued.length !== rules().salvo) return;
  const salvo = queued; queued = [];
  for (const [x,y] of salvo) { takeShot(player,x,y); if (phase === 'over') break; }
  finishTurn();
  if (phase === 'over') { render(); return; }
  if (mode === 'duo') { pass(1-player); return; }
  busy = true; render(); const token = generation;
  timer = setTimeout(() => {
    if (token !== generation) return;
    // Plan the entire salvo before observing any of its results.
    const targets = [], knowledge = { shots: new Map(boards[0].shots) };
    for (let i=0;i<rules().salvo;i++) { const t=aiTarget(knowledge);targets.push(t);knowledge.shots.set(t[1]*SIZE+t[0],false); }
    for (const [x,y] of targets) { takeShot(1,x,y); if (phase === 'over') break; }
    finishTurn(); busy = false; render();
  },650);
};
function takeShot(attacker,x,y) {
  const target=1-attacker, result=shoot(boards[target],x,y,Math.random,rules().threshold); last[target]=result; turns++;
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
$('start').onclick=()=>{phase='play';$('setup').hidden=true;log(`Batalla iniciada: ${rules().salvo} tiros por turno. Elegí los objetivos y pulsá Disparar salva.`);render();};
$('new').onclick=()=>{if(phase==='play'&&!confirm('¿Terminar esta batalla y comenzar una nueva?'))return;reset();};
for(const m of ['solo','duo']) $(m).onclick=()=>{if(mode===m)return;if(phase==='play'&&!confirm('¿Cambiar de modo y reiniciar la batalla?'))return;mode=m;for(const id of ['solo','duo'])$(id).classList.toggle('active',id===m);reset();};
$('rules').onchange = () => { ruleMode = $('rules').value; reset(); };
$('ready').onclick=()=>{$('handoff').close();render();};
$('handoff').addEventListener('cancel',e=>e.preventDefault());
reset();

function renderDamage() {
  const cards = [];
  for (const owner of [player, 1-player]) for (const ship of boards[owner].ships) {
    const card = document.createElement('article');
    const title = document.createElement('strong'); title.textContent = `${owner === player ? 'Tu' : 'Rival ·'} ${ship.name}`;
    const canvas = document.createElement('canvas'); canvas.width=480;canvas.height=160;
    canvas.setAttribute('aria-label', `Ilustración de ${ship.name} con ${ship.hits} impactos`);
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#173438';ctx.fillRect(0,0,480,160);
    const visible = owner === player || ship.hits > 0 || phase === 'over';
    if (visible) {
      ctx.fillStyle=isSunk(ship,rules().threshold)?'#65534a':'#8d9b94';
      ctx.beginPath();ctx.moveTo(30,88);ctx.lineTo(450,88);ctx.lineTo(415,125);ctx.lineTo(65,125);ctx.closePath();ctx.fill();
      ctx.fillStyle='#b3bbb0';ctx.fillRect(120,65,220,23);ctx.fillRect(190,43,80,22);
      ctx.fillStyle='#6c817d';ctx.fillRect(208,20,16,23);ctx.fillRect(244,25,16,18);
      ctx.strokeStyle='#c8d6c0';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(150,65);ctx.lineTo(150,28);ctx.moveTo(310,65);ctx.lineTo(310,32);ctx.stroke();
      // Map actual hit positions into a normalized broadside, in either orientation.
      for (const [key,hit] of boards[owner].shots) {
        if(!hit) continue;
        const x=key%SIZE,y=Math.floor(key/SIZE);
        if(x<ship.x||x>=ship.x+ship.w||y<ship.y||y>=ship.y+ship.h)continue;
        const along=ship.w>ship.h?(x-ship.x+.5)/ship.w:(y-ship.y+.5)/ship.h;
        const across=ship.w>ship.h?(y-ship.y+.5)/ship.h:(x-ship.x+.5)/ship.w;
        ctx.fillStyle='#201b19';ctx.beginPath();ctx.arc(65+along*350,94+across*22,3,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#f89e67';ctx.lineWidth=1;ctx.stroke();
      }
    } else { ctx.fillStyle='#8fa6a7';ctx.font='16px system-ui';ctx.fillText('Sin impactos confirmados',130,87); }
    const detail=document.createElement('p');
    detail.textContent = `${ship.hits} / ${damageLimit(ship,rules().threshold)} impactos para hundir · ${isSunk(ship,rules().threshold)?'HUNDIDO':Math.round(ship.hits/(ship.w*ship.h)*100)+' % de daño'}`;
    card.append(title,canvas,detail);cards.push(card);
  }
  $('damage-cards').replaceChildren(...cards);
}
