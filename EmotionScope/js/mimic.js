console.log('bobb');
const video=document.getElementById('video');
const startBtn=document.getElementById('startBtn');
const emotionText=document.getElementById('emotionText');
const emotionImg=document.getElementById('emotionImg');
const stimulusImg=document.getElementById('stimulusImg');
const overlay=document.getElementById('overlay');
const finalResult=document.getElementById('finalResult');
const closeResult=document.getElementById('closeResult');
const brainBtn=document.getElementById('brainBtn');

const scenarioButtons=document.createElement('div');
scenarioButtons.id='scenarioButtons';
document.getElementById('resultBox').appendChild(scenarioButtons);

let currentImageIndex=0;
let imageTimer=null;
let sessionTimer=null;

const imagesList=
[
'images/blob1.png',
'images/blob2.png',
'images/blob3.png',
'images/blob4.png'
];

let emotionChart;
let historyChart; 
let emotionHistory=[];

const emotionMap=
{
happy:0,
sad:1,
neutral:2,
angry:3,
fearful:4,
surprised:5
};

const emotionLabels=
[
'Happy',
'Sad',
'Neutral',
'Angry',
'Fear',
'Surprise'];

window.addEventListener('DOMContentLoaded',()=>
{
const ctx=document.getElementById('emotionChart');
emotionChart=new Chart(ctx,
{
type:'bar',
data:{
labels:emotionLabels,
datasets:[{
data:[0,0,0,0,0,0],
backgroundColor:
['yellow','blue','green','red','purple','pink']
}]
},
options:{
animation:false,
indexAxis:'y',
scales:{x:{min:0,max:1}}
}
});
});






startBtn.onclick=async()=>
{
try {
await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
await faceapi.nets.faceExpressionNet.loadFromUri('/models');
const stream=await navigator.mediaDevices.getUserMedia({video:true
});
video.srcObject=stream;
await video.play();
startBtn.style.display='none';
stimulusImg.style.display='block';
stimulusImg.src=imagesList[0];
currentImageIndex=0;
imageTimer=setInterval(()=>
{
currentImageIndex++;
if(currentImageIndex<imagesList.length)
{
stimulusImg.src=imagesList[currentImageIndex];
}
},30000);
sessionTimer=setTimeout(endSession, 120000);
}catch(e)
{
alert('Camera error');
console.error(e);
}
};








video.addEventListener('play',()=>
{
const interval = setInterval(async()=>
{
if(!faceapi.nets.faceExpressionNet.params) return;

const detection=await faceapi
.detectSingleFace(video,new faceapi.TinyFaceDetectorOptions())
.withFaceExpressions();
if(!detection) return;
const e=detection.expressions;
const maxEmotion=Object.keys(e).reduce((a,b)=>e[a]>e[b]?a:b);
emotionHistory.push(
{
imageIndex:currentImageIndex,
emotion:maxEmotion,
timestamp:Date.now()
});

emotionChart.data.datasets[0].data=
[
e.happy, e.sad, e.neutral, e.angry, e.fearful, e.surprised
];
emotionChart.update('none');

emotionText.innerText='Emotion:' + maxEmotion;
emotionImg.src=`images/${maxEmotion}.png`;
emotionImg.style.display='block';
}, 200);
});

function generateDiagnosis()
{
if(!emotionHistory.length) return "No data collected.";
const perImageAnalysis={};
emotionHistory.forEach(e=>
{
if(!perImageAnalysis[e.imageIndex]) perImageAnalysis[e.imageIndex] =[];
perImageAnalysis[e.imageIndex].push(e.emotion);
});
let text='';
for(let i=0;i<4;i++)
{
const emotions = perImageAnalysis[i]||[];
if(!emotions.length) continue;
const counts = {};
emotions.forEach(em=>counts[em]=(counts[em]||0)+ 1);
const dominant=Object.keys(counts).reduce((a,b)=>counts[a]>counts[b]?a:b);
text+= `Image ${i+1} (${imagesList[i]}):dominant emotion is ${dominant}. `;
const mixed=Object.keys(counts).filter(e=>e!==dominant&&counts[e]>0);
if(mixed.length) text += `Other noticeable emotions: ${mixed.join(', ')}. `;
text += '\n';
}
return text;
}






function analyzeSession()
{
if(!emotionHistory.length) return {dominant:'neutral', scenarioText:'No data.'
};
const counts={};
emotionHistory.forEach(e=>counts[e.emotion]=(counts[e.emotion]||0)+1);
const dominant=Object.keys(counts).reduce((a,b)=>counts[a]>counts[b] ? a : b);
const scenarios=
{
happy:"User feels positive. Suggest continuing engaging tasks.",
sad:"User shows sadness. Suggest calming music or meditation.",
angry:"User shows anger. Suggest breathing exercises or short break.",
fearful:"User feels fear. Suggest reassuring messages or light visuals.",
surprised:"User feels surprise. Suggest curiosity-driven tasks.",
neutral:"User is neutral. Suggest regular tasks or mindfulness."
};
return {dominant,scenarioText:scenarios[dominant]||"No clear scenario."
};
}

function endSession()
{
clearInterval(imageTimer);
overlay.style.display = 'flex';

const diagnosisText=generateDiagnosis();
const {dominant,scenarioText}=analyzeSession();

finalResult.innerText='TOTAL EMOTIONAL ANALYSIS:\n\n'+diagnosisText+'\nSuggested scenario:' + scenarioText;


if (!historyChart)
{
const ctx2=document.createElement('canvas');
ctx2.id='historyChart';
ctx2.style.width='100%';
ctx2.style.height='200px';
document.getElementById('resultBox').appendChild(ctx2);

historyChart=new Chart(ctx2,
{
type:'line',
data:{
labels:emotionHistory.map((_,i)=>i+1),
datasets:[{
label:'Emotion over time',
data:emotionHistory.map(e=>emotionMap[e.emotion]),
borderColor:'#1E90FF',
backgroundColor:'rgba(30,144,255,0.2)',
tension:0.2,
fill:true,
pointRadius:4
}]
},
options:
{
animation: false,
scales:
{
y:
{
type:'linear',
min:0,
max:5,
ticks:{
stepSize:1,
callback:function(val)
{return emotionLabels[val];}
}
},
x:{title:{display:true,text:'Time(events)'}}
}
}
});
}

scenarioButtons.innerHTML='';
const pages=
{
happy:'happy.html',
sad:'sad.html',
angry:'angry.html',
fearful:'fearful.html',
surprised:'surprised.html',
neutral:'neutral.html'
};
const btn=document.createElement('button');
btn.innerText='Go to scenario';
btn.onclick=()=>window.location.href=pages[dominant];
scenarioButtons.appendChild(btn);
}
closeResult.onclick=()=>location.reload();

brainBtn.onclick=()=>
{
window.location.href='brain.html';
};
