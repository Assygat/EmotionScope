const leftBrain=document.getElementById('leftBrain');
const rightBrain=document.getElementById('rightBrain');
const emotionText=document.getElementById('emotionText');
const alphaBtn=document.getElementById('alphaBtn');
const betaBtn=document.getElementById('betaBtn');
const gammaBtn=document.getElementById('gammaBtn');
const resetBtn=document.getElementById('resetBtn');
let brain=
{
left:{alpha:0,beta:0,gamma:0},
right:{alpha:0,beta:0,gamma:0}
};

let currentBeam='alpha';
let heatingLeft=false;
let heatingRight=false;

alphaBtn.onclick=()=>currentBeam='alpha';
betaBtn.onclick=()=>currentBeam='beta';
gammaBtn.onclick=()=>currentBeam='gamma';

function getMixedColor(b)
{
const r=b.gamma*2.2+b.alpha*1.1;
const g=b.beta*2.3;
const bl=b.alpha*2.6;
return `rgb(${Math.min(r,255)},${Math.min(g,255)}, ${Math.min(bl,255)})`;
}

function updateBrainColor(side)
{
const b=brain[side];
const color=getMixedColor(b);
if(side==='left') leftBrain.setAttribute('fill',color);
else rightBrain.setAttribute('fill',color);
}

function animate(side)
{
if(side==='left'&&!heatingLeft) return;
if(side==='right'&&!heatingRight) return;

const b=brain[side];
b[currentBeam]=Math.min(b[currentBeam]+0.9,100);
updateBrainColor(side);
predictEmotion();
requestAnimationFrame(()=>animate(side));
}

leftBrain.addEventListener('mousedown',()=>{heatingLeft=true; animate('left');});
leftBrain.addEventListener('mouseup',()=>heatingLeft=false);
leftBrain.addEventListener('mouseleave',()=>heatingLeft=false);

rightBrain.addEventListener('mousedown',()=>{heatingRight=true; animate('right'); });
rightBrain.addEventListener('mouseup',() =>heatingRight= false);
rightBrain.addEventListener('mouseleave',()=>heatingRight=false);

resetBtn.onclick=()=>
{
['left','right'].forEach(side=>
{
['alpha','beta','gamma'].forEach(w => brain[side][w] = 0);
updateBrainColor(side);
});
emotionText.innerText='Emotion: —';
};

setInterval(()=>
{
['left','right'].forEach(side=>
{
['alpha','beta','gamma'].forEach(w => brain[side][w]=Math.max(brain[side][w]-0.2,0));
updateBrainColor(side);
});
predictEmotion();
},90);

let model;
const EMOTIONS=['Calm','Happy','Concentration','Anxiety'];

function getInputVector()
{
return[
brain.left.alpha/100, brain.left.beta/100, brain.left.gamma/100,
brain.right.alpha/100, brain.right.beta/100, brain.right.gamma/100
];
}

async function initAI()
{
model = tf.sequential();
model.add(tf.layers.dense({inputShape:[6],units:20, activation:'relu'}));
model.add(tf.layers.dense({units:14,activation:'relu'}));
model.add(tf.layers.dense({units:EMOTIONS.length, activation:'softmax'}));
model.compile({optimizer:'adam',loss:'categoricalCrossentropy'});

const xs=tf.tensor2d(
[
[0.8,0.1,0,0.8,0.1,0], [0.7,0.1,0,0.7,0.1,0],
[0.8,0.3,0.1,0.4,0.2,0.1], [0.7,0.4,0.1,0.3,0.2,0.1],
[0.3,0.7,0.4,0.3,0.7,0.4], [0.4,0.6,0.5,0.4,0.6,0.5],
[0.1,0.9,0.7,0.6,0.95,0.8], [0.1,0.8,0.6,0.7,0.9,0.8]
]);

const ys = tf.tensor2d([
[1,0,0,0],[1,0,0,0],
[0,1,0,0],[0,1,0,0],
[0,0,1,0],[0,0,1,0],
[0,0,0,1],[0,0,0,1]
]);

await model.fit(xs, ys, {epochs:400, verbose:0});
}

function predictEmotion()
{
if(!model) return;
const input=tf.tensor2d([getInputVector()]);
const output=model.predict(input).dataSync();
const idx=output.indexOf(Math.max(...output));
emotionText.innerText=`Emotion: ${EMOTIONS[idx]}`;
}

initAI();
mimicBtn.onclick=()=>
{
window.location.href='index.html';
};
