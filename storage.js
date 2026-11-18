import {config} from './config.js';
import {validate} from './analysis.js';
const KEY='classroom-air-records-v1';
export class Repository{
 constructor(storage=globalThis.localStorage,fetcher=globalThis.fetch,settings=config){this.storage=storage;this.fetcher=fetcher;this.config=settings;this.warning='';this.cloud=Boolean(settings.url&&settings.key);}
 local(){try{const raw=this.storage.getItem(KEY);const rows=raw?JSON.parse(raw):[];if(!Array.isArray(rows))throw Error();return rows.filter(r=>{try{validate(r);return typeof r.id==='string';}catch{return false;}});}catch{this.warning='로컬 기록을 읽을 수 없습니다. 브라우저 저장소 설정 또는 손상된 데이터를 확인해 주세요.';return [];}}
 async request(method,body){
 const url=String(this.config.url||'').trim().replace(/\/+$/,'');const key=String(this.config.key||'').trim();
 if(!/^https?:\/\/[^/]+$/.test(url))throw Error('프로젝트 URL을 확인해 주세요. Supabase의 Project URL만 입력해야 합니다.');
 const headers={apikey:key,'Content-Type':'application/json',Prefer:'return=minimal'};if(key.startsWith('ey'))headers.Authorization=`Bearer ${key}`;
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
 try{
 const response=await this.fetcher.call(globalThis,`${url}/rest/v1/measurements${method==='GET'?'?select=id,payload&order=measured_at.desc&limit=1000':''}`,{method,headers,cache:'no-store',body:body?JSON.stringify(body):undefined,signal:controller.signal});
 if(!response.ok){let error={};try{error=await response.json();}catch{}const code=String(error.code||'');let reason;
 if(code==='42501')reason='measurements 테이블의 읽기/추가 권한을 확인해 주세요. 프로젝트의 schema.sql 설정이 필요합니다.';
 else if(response.status===401||response.status===403)reason='프로젝트 URL과 공개 API 키가 같은 프로젝트의 값인지 확인해 주세요.';
 else if(code==='PGRST205'||code==='42P01')reason='measurements 테이블이 없습니다. Supabase SQL Editor에서 schema.sql을 실행해 주세요.';
 else if(response.status===404)reason='프로젝트 주소와 Data API 활성화 상태를 확인해 주세요.';
 else if(response.status>=500)reason='Supabase 서버에 연결할 수 없습니다. 프로젝트 실행 상태를 확인한 뒤 다시 조회해 주세요.';
 else reason='잠시 후 다시 조회하거나 Supabase 프로젝트 상태를 확인해 주세요.';
 throw Error(`HTTP ${response.status}${/^[A-Z0-9]+$/.test(code)?' · '+code:''} · ${reason}`);
 }
 if(method!=='GET')return null;const rows=await response.json();if(!Array.isArray(rows))throw Error('서버 응답 형식이 올바르지 않습니다. Project URL과 테이블을 확인해 주세요.');return rows;
 }catch(error){if(controller.signal.aborted)throw Error('15초 동안 응답이 없습니다. 프로젝트가 실행 중인지 확인하고 새로고침해 주세요.');if(error instanceof TypeError)throw Error('서버 주소에 연결할 수 없습니다. 인터넷 연결과 Supabase Project URL을 확인해 주세요. 프로젝트가 일시 중지되었다면 복원한 뒤 다시 조회해 주세요.');throw error;}finally{clearTimeout(timer);}
 }
 async list(){this.warning='';const local=this.local();if(!this.cloud)return local.filter(r=>!r._deleted);try{const remote=await this.request('GET');const merged=new Map(local.map(r=>[r.id,r]));for(const row of remote){try{validate(row.payload);if(!merged.get(row.id)?._localOverride)merged.set(row.id,{...row.payload,id:row.id});}catch{}}return [...merged.values()].filter(r=>!r._deleted);}catch(error){this.warning='클라우드 조회 실패 · '+error.message+' 이 브라우저에 저장된 기록을 표시합니다.';return local.filter(r=>!r._deleted);}}
 async update(record){validate(record);return this.change(record,false);}
 async remove(record){return this.change(record,true);}
 change(record,deleted){this.warning='';const rows=this.local();if(this.warning)throw Error(this.warning);const next={...record,_localOverride:true,_deleted:deleted,updatedAt:new Date().toISOString()};try{this.storage.setItem(KEY,JSON.stringify([next,...rows.filter(r=>r.id!==record.id)]));}catch{throw Error('변경하지 못했습니다. 브라우저 저장 공간과 권한을 확인해 주세요.');}return this.cloud?'이 브라우저에 변경했습니다. 공유 원본은 유지됩니다.':deleted?'기록을 삭제했습니다.':'기록을 수정했습니다.';}
 async save(record){validate(record);const rows=this.local();if(this.warning)throw Error(this.warning);const next=[record,...rows.filter(r=>r.id!==record.id)];try{this.storage.setItem(KEY,JSON.stringify(next));}catch{throw Error('기록을 저장하지 못했습니다. 브라우저 저장 공간과 권한을 확인해 주세요.');}if(this.cloud&&!record.demo){try{await this.request('POST',{id:record.id,measured_at:record.measuredAt,classroom:record.classroom,payload:record});return '브라우저와 Supabase에 저장했습니다.';}catch(error){return '브라우저에 저장했습니다. 클라우드 저장 실패 · '+error.message+' 자동 재전송은 하지 않습니다.';}}return '이 브라우저에 저장했습니다.';}
}

