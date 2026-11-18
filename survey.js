export const scale=['전혀 아니다','아니다','보통이다','그렇다','매우 그렇다'];
export const questions=[
 {id:'hot',metric:'temperature',text:'교실이 더워서 집중하기 어렵다.',feeling:'더워요'},
 {id:'cold',metric:'temperature',text:'교실이 추워서 몸이 움츠러든다.',feeling:'추워요'},
 {id:'humid',metric:'humidity',text:'공기가 습하고 끈적하게 느껴진다.',feeling:'습해요'},
 {id:'dry',metric:'humidity',text:'공기가 건조하게 느껴진다.',feeling:'건조해요'},
 {id:'stuffy',metric:'co2',text:'교실 공기가 답답하게 느껴진다.',feeling:'답답해요'},
 {id:'dark',metric:'light',text:'책이나 칠판을 보기에는 주변이 어둡다.',feeling:'어두워요'},
 {id:'glare',metric:'light',text:'빛이나 화면 반사 때문에 눈이 부시다.',feeling:'눈부셔요'},
 {id:'loud',metric:'noise',text:'주변 소리 때문에 설명을 듣거나 집중하기 어렵다.',feeling:'시끄러워요'}
];
export function surveySummary(answers,key){return questions.filter(q=>q.metric===key).map(q=>q.feeling+' · '+(answers[q.id]==='unknown'?'잘 모르겠어요':scale[answers[q.id]-1])).join(' / ');}
export function surveyFeelings(answers={}){return questions.filter(q=>Number(answers[q.id])>=4).map(q=>q.feeling);}
export function validateSurvey(answers,key){for(const q of questions.filter(q=>q.metric===key)){if(![1,2,3,4,5,'unknown'].includes(answers?.[q.id]))throw Error('체감 질문에 모두 답하거나 잘 모르겠어요를 선택해 주세요.');}}
