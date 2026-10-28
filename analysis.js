export const metrics=[
 {key:'temperature',name:'온도',unit:'℃',icon:'°',min:-20,max:60,step:0.1,ideal:[20,26],outer:[16,30],hint:'20–26 ℃',low:'냉방을 줄이거나 난방을 조절하고, 창가의 찬바람을 확인해 주세요.',high:'블라인드로 직사광선을 줄이고 냉방 설정을 조절해 주세요.'},
 {key:'humidity',name:'습도',unit:'%',icon:'◒',min:0,max:100,step:0.1,ideal:[40,60],outer:[30,70],hint:'40–60 %',low:'건조함을 확인하고 가습기 사용을 선생님과 상의해 주세요.',high:'제습 기능을 활용하고 젖은 물건이나 결로가 있는지 확인해 주세요.'},
 {key:'co2',name:'CO₂',unit:'ppm',icon:'≋',min:250,max:10000,step:1,ideal:[250,1000],outer:[250,1500],hint:'1,000 ppm 이하',high:'실외 공기 상태를 확인한 뒤 창문과 문을 열어 환기하고 다시 측정해 주세요.'},
 {key:'light',name:'조도',unit:'lx',icon:'☼',min:0,max:10000,step:1,ideal:[300,750],outer:[150,1000],hint:'300–750 lx',low:'조명을 켜고 책상 위 그림자를 확인해 주세요. 밝기가 고르게 분포하도록 조절해 주세요.',high:'블라인드와 조명 방향을 조절하여 눈부심과 화면 반사를 줄여 주세요.'},
 {key:'noise',name:'소음',unit:'dB',icon:'≋',min:0,max:140,step:0.1,ideal:[0,50],outer:[0,65],hint:'50 dB 이하',high:'대화 소리를 낮추고 복도 소음과 기기 소리를 확인해 주세요. 활동 유형에 맞게 조절해 주세요.'}
];
export const feelings=['더워요','추워요','답답해요','습해요','건조해요','어두워요','눈부셔요','시끄러워요'];

export const quickOptions={temperature:['괜찮아요','더워요','추워요','잘 모르겠어요'],humidity:['괜찮아요','습해요','건조해요','잘 모르겠어요'],co2:['답답하지 않아요','답답해요','잘 모르겠어요'],light:['괜찮아요','어두워요','눈부셔요','잘 모르겠어요'],noise:['괜찮아요','시끄러워요','잘 모르겠어요']};
export function modeOf(r,key){return r.inputModes?.[key]||'measured';}
export function measuredValue(r,key){return modeOf(r,key)==='measured'&&Number.isFinite(r[key])?r[key]:null;}
export function validate(r){
 if(typeof r.classroom!=='string'||!r.classroom.trim()||r.classroom.length>40)throw Error('교실 이름은 1~40자로 입력해 주세요.');
 if(!r.measuredAt||!Number.isFinite(new Date(r.measuredAt).getTime()))throw Error('측정 날짜와 시간을 확인해 주세요.');
 if(!Number.isInteger(r.students)||r.students<0||r.students>100)throw Error('학생 수는 0~100명 사이 정수로 입력해 주세요.');
 for(const m of metrics){const mode=modeOf(r,m.key);if(!['quick','measured'].includes(mode))throw Error('입력 방식을 확인해 주세요.');
 if(mode==='quick'){if(!quickOptions[m.key].includes(r.responses?.[m.key]))throw Error(m.name+'의 체감 응답을 선택해 주세요.');if(r[m.key]!==null)throw Error('간편 입력에는 측정 수치를 저장하지 않습니다.');}
 else if(typeof r[m.key]!=='number'||!Number.isFinite(r[m.key])||r[m.key]<m.min||r[m.key]>m.max)throw Error(m.name+': '+m.min+'~'+m.max+' '+m.unit+' 범위로 입력해 주세요.');}
 if(!Array.isArray(r.feelings)||r.feelings.some(f=>!feelings.includes(f)))throw Error('체감 불편 항목을 확인해 주세요.');return r;
}
export function analyze(r){validate(r);
 const items=metrics.map(m=>{const v=measuredValue(r,m.key);if(v===null){const response=r.responses[m.key];const discomfort=feelings.includes(response);const low=['추워요','건조해요','어두워요'].includes(response);return {...m,mode:'quick',value:null,response,level:null,score:null,status:'체감 · 미측정',advice:discomfort?(low?m.low:m.high):'',discomfort};}
 const level=v>=m.ideal[0]&&v<=m.ideal[1]?0:v>=m.outer[0]&&v<=m.outer[1]?1:2;return {...m,mode:'measured',value:v,level,status:['적정','주의','개선 필요'][level],score:[100,60,20][level],advice:level?(v<m.ideal[0]?m.low:m.high):''};});
 const measured=items.filter(m=>m.mode==='measured');const measuredCount=measured.length;const score=measuredCount?Math.round(measured.reduce((s,m)=>s+m.score,0)/measuredCount):null;
 const suggestions=items.filter(m=>m.level>0).sort((a,b)=>b.level-a.level).map(m=>({title:m.name+' · '+m.status,text:m.advice,level:m.level}));
 for(const m of items.filter(m=>m.mode==='quick'&&m.discomfort))suggestions.push({title:m.name+' · 체감 확인',text:m.response+' 응답을 참고한 안내입니다. '+m.advice+' '+(m.key==='co2'?'답답함만으로 CO₂ 농도를 알 수 없습니다. 농도 판단에는 측정기가 필요합니다.':'실제 수치와 상태는 측정 후 확인할 수 있습니다.'),level:1});
 const map={'더워요':'temperature','추워요':'temperature','답답해요':'co2','습해요':'humidity','건조해요':'humidity','어두워요':'light','눈부셔요':'light','시끄러워요':'noise'};
 for(const f of r.feelings){const m=items.find(m=>m.key===map[f]);if(m.response===f)continue;suggestions.push({title:'체감 확인 · '+f,text:'불편한 자리의 환경을 다시 확인하고 선생님과 조절 방법을 상의해 주세요. 체감만으로 수치나 적정 여부를 판단하지 않습니다.',level:1});}
 if(r.students>=30)suggestions.push({title:'학생 수가 많은 교실',text:'학생 수가 많습니다. 쉬는 시간마다 공기 상태를 확인하고 가능하면 환기 전후 CO₂를 측정해 보세요.',level:1});
 if(new Date(r.measuredAt).getHours()>=16&&measuredValue(r,'light')!==null&&r.light<300)suggestions.push({title:'늦은 시간의 조명 점검',text:'자연광이 줄어드는 시간입니다. 책상 위치별 밝기를 확인해 주세요.',level:1});
 if(!suggestions.length)suggestions.push({title:measuredCount===5?'쾌적한 환경을 유지해 주세요':'필요한 항목부터 측정해 보세요',text:measuredCount===5?'모든 측정값이 프로젝트 적정 범위입니다. 다음 쉬는 시간에 다시 확인해 주세요.':'체감 응답은 측정값이 아닙니다. 측정하지 않은 항목의 상태는 확인할 수 없습니다.',level:0});
 return {score,measuredCount,scoreLabel:measuredCount===5?'종합 쾌적도':measuredCount?'측정 항목 평균':'체감 점검',status:score===null?'수치 판정 없음':(measuredCount<5?'측정 항목 기준 · ':'')+(score>=80?'쾌적':score>=60?'주의':'개선 필요'),items,suggestions,version:'2.0'};
}


