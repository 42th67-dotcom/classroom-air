import {analyze} from './analysis.js';
export const defaultRooms=[...Array.from({length:3},(_,g)=>Array.from({length:20},(_,c)=>({id:`g${g+1}-c${c+1}`,name:`${g+1}학년 ${c+1}반`}))).flat(),...['과학실','음악실','미술실','컴퓨터실','도서실'].map((name,i)=>({id:`special-${i}`,name}))];
export function schoolIdentity(region,name){const clean=s=>s.normalize('NFKC').trim().replace(/\s+/g,'');if(!clean(region)||!clean(name)||region.length>20||name.length>20)throw Error('지역과 학교 이름을 각각 1~20자로 입력해 주세요.');return {id:clean(region)+'/'+clean(name),name:clean(name),region:clean(region)};}
export function roomKey(r){return r.schoolId&&r.roomId?JSON.stringify([r.schoolId,r.roomId]):JSON.stringify(['legacy',r.classroom]);}
export function benchmark(records,targetKey,scope='all'){
 const groups=new Map();let excluded=0;
 for(const r of records){if(r.demo||!r.schoolId||!r.roomId||r.schoolId==='unassigned'||analyze(r).measuredCount!==5){excluded++;continue;}const key=roomKey(r),g=groups.get(key)||{key,schoolId:r.schoolId,school:(r.schoolRegion?r.schoolRegion+' ':'')+(r.schoolName||r.schoolId),room:r.roomName||r.classroom,values:[]};g.values.push(analyze(r).score);groups.set(key,g);}
 const all=[...groups.values()].map(g=>({...g,count:g.values.length,average:g.values.reduce((a,b)=>a+b,0)/g.values.length}));const target=all.find(g=>g.key===targetKey);const rows=all.filter(g=>scope!=='school'||!target||g.schoolId===target.schoolId).sort((a,b)=>b.average-a.average||a.key.localeCompare(b.key));const peers=rows.filter(g=>g.key!==targetKey);const peerAverage=peers.length?peers.reduce((s,g)=>s+g.average,0)/peers.length:null;
 return {rows,target,excluded,peerAverage,difference:target&&peerAverage!==null?target.average-peerAverage:null,rank:target?1+rows.filter(g=>g.average>target.average).length:null};
}
