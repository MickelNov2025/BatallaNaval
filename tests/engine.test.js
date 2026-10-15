import test from 'node:test';
import assert from 'node:assert/strict';
import { makeBoard, makeFleet, shoot, aiTarget, SIZE } from '../engine.js';
test('Las flotas caben y no se superponen en ambas orientaciones',()=>{
  for(let i=0;i<200;i++){
    const fleet=makeFleet();const occupied=new Set();
    assert.deepEqual(fleet.map(s=>s.length),[45,36,27,18]);
    for(const s of fleet){assert.equal(Math.min(s.w,s.h),9);assert(s.x>=0&&s.y>=0&&s.x+s.w<=SIZE&&s.y+s.h<=SIZE);for(let y=s.y;y<s.y+s.h;y++)for(let x=s.x;x<s.x+s.w;x++){const key=y*SIZE+x;assert(!occupied.has(key));occupied.add(key);}}
  }
});
test('Disparo exacto, dispersión y bordes mantienen nueve celdas',()=>{
  const b=makeBoard();const exact=shoot(b,20,20,()=>0);assert.equal(exact.cx,20);assert.equal(exact.cy,20);assert.equal(exact.cells.length,9);
  const drift=shoot(b,20,20,()=>.99);assert.equal(drift.cx,22);assert.equal(drift.cy,22);
  for(const [x,y] of [[0,0],[59,59],[0,59],[59,0]]){const r=shoot(b,x,y,()=>.99);assert.equal(r.cells.length,9);assert(r.cells.every(([xx,yy])=>xx>=0&&yy>=0&&xx<60&&yy<60));}
});
test('Repetir impactos no duplica daño y hundir toda la flota termina la partida',()=>{
  const b=makeBoard(()=>0);const s=b.ships[0];const a=shoot(b,s.x+1,s.y+1,()=>0);assert.equal(a.hits,9);const hits=s.hits;assert.equal(shoot(b,s.x+1,s.y+1,()=>0).hits,0);assert.equal(s.hits,hits);
  let won=false;for(let y=1;y<60;y+=3)for(let x=1;x<60;x+=3)won=shoot(b,x,y,()=>0).won;assert(won);assert(b.ships.every(s=>s.hits===s.w*s.h));
});
test('La IA apunta usando impactos públicos sin consultar barcos',()=>{
  const b={shots:new Map([[30*60+30,true]])};const [x,y]=aiTarget(b,()=>0);assert.equal(Math.abs(x-30)+Math.abs(y-30),3);
  const empty={shots:new Map()};assert.deepEqual(aiTarget(empty,()=>0),[1,1]);
});

test('Modo rápido hunde al 25 % y no acumula daño después del hundimiento', async()=>{
  const {damageLimit,isSunk}=await import('../engine.js');
  const b=makeBoard(()=>0), s=b.ships[0];s.hits=damageLimit(s,.25)-1;
  const r=shoot(b,s.x+1,s.y+1,()=>0,.25);assert.deepEqual(r.sunk,[s.name]);assert(isSunk(s,.25));assert.equal(s.hits,damageLimit(s,.25));
  shoot(b,s.x+5,s.y+1,()=>0,.25);assert.equal(s.hits,damageLimit(s,.25));
});
test('El límite compara barcos hundidos, luego daño y permite empate',async()=>{
  const {roundWinner,damageLimit}=await import('../engine.js');const b=[makeBoard(()=>0),makeBoard(()=>0)];
  assert.equal(roundWinner(b,.25),null);b[1].ships[0].hits=5;assert.equal(roundWinner(b,.25),0);
  b[0].ships[3].hits=damageLimit(b[0].ships[3],.25);assert.equal(roundWinner(b,.25),1);
  b[1].ships[3].hits=damageLimit(b[1].ships[3],.25);assert.equal(roundWinner(b,.25),0);
});
