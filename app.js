const $=s=>document.querySelector(s);
let names=Array(8).fill(''),people=[],initial=[],drag=null,nextId=1;
function parseNames(text){return text.replace(/(?:^|[\s,，、;；])\d{1,3}\s*[.．、:：)）]\s*/gu,' ').split(/[\s,，、;；]+/u).map(x=>x.trim()).filter(Boolean)}
function message(text,ok=false){$('#message').textContent=text;$('#message').classList.toggle('success',ok)}
function filled(){$('#filled').textContent=`已填写 ${names.filter(x=>x.trim()).length} / ${names.length}`}
function fields(){const root=$('#fields');root.replaceChildren();names.forEach((name,i)=>{const label=document.createElement('label');label.className='field';const n=document.createElement('span');n.textContent=String(i+1).padStart(2,'0');const input=document.createElement('input');input.value=name;input.placeholder='填写姓名';input.maxLength=40;input.setAttribute('aria-label',`${i+1}号姓名`);input.addEventListener('input',()=>{names[i]=input.value;filled();if(people.length)message('名单已修改，点击“更新圆桌座位图”应用。')});label.append(n,input);root.append(label)});$('#count').value=names.length;$('#minus').disabled=names.length<=4;$('#plus').disabled=names.length>=30;filled()}
function resizeCount(n){if(!Number.isInteger(n)||n<4||n>30){message('人数需为 4–30 之间的整数。');$('#count').value=names.length;return}while(names.length<n)names.push('');names=names.slice(0,n);fields();message(people.length?'名单已修改，请更新圆桌座位图。':'')}
function importList(){const parsed=parseNames($('#bulk').value);if(parsed.length<4||parsed.length>30){message(`识别到 ${parsed.length} 人，请输入 4–30 人；现有名单未修改。`);return}if(parsed.some(x=>x.length>40)){message('单个姓名请控制在 40 字以内；现有名单未修改。');return}names=parsed;fields();message(`已按顺序填入 ${names.length} 人，可继续编辑姓名。`,true)}
$('#import').onclick=importList;$('#minus').onclick=()=>resizeCount(names.length-1);$('#plus').onclick=()=>resizeCount(names.length+1);$('#count').onchange=e=>resizeCount(Number(e.target.value));
function generate(){if(names.some(x=>!x.trim())){message('请填写所有姓名，或调整人数后再生成。');const i=names.findIndex(x=>!x.trim());$('#fields').children[i].querySelector('input').focus();return false}people=names.map(name=>({id:nextId++,name:name.trim()}));initial=people.map(p=>({...p}));$('#empty').hidden=true;$('#seating').hidden=false;$('#step2').classList.add('active');$('#generate').textContent='更新圆桌座位图';$('#table-badge').textContent=`${people.length} 人 · 可拖动`;
layout();$('#guest-total').replaceChildren(document.createTextNode(String(people.length)),Object.assign(document.createElement('span'),{textContent:'位用餐者'}));$('#seats').replaceChildren();people.forEach(p=>{const b=document.createElement('button');b.className='seat';b.dataset.id=p.id;b.title=p.name;b.innerHTML='<span class="num"></span><span class="name"></span>';b.querySelector('.name').textContent=p.name;b.addEventListener('pointerdown',startDrag);b.addEventListener('keydown',keyMove);$('#seats').append(b)});render();message('座位图已生成，可以拖动调整。',true);return true}
$('#generate').onclick=()=>{if(generate()&&matchMedia('(max-width:760px)').matches) $('.table-panel').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'})};
const mobileQuery=matchMedia('(max-width:760px)');
function layout(){
 const c=$('#canvas'),mobile=mobileQuery.matches,n=people.length;
 const track=mobile&&(n>8||(c.clientWidth<300&&n>6));
 c.classList.toggle('racetrack',track);
 const size=n>20?1200:n>14?720:n>10?560:0;
 c.style.minWidth=mobile?'0':size?`${size}px`:'0';
 c.style.minHeight='0';
 c.style.height=track?`${Math.max(420,2*(Math.max((c.clientWidth-60)/2,140)+24)+(Math.ceil(Math.max(0,n-12)/2)+1)*42)}px`:'';
 $('#table-badge').textContent=`${n} 人 · ${track?'跑道桌':'圆桌'}`;
}
function trackPoint(index,n,width,height){
 const radius=(width-60)/2,verticalRadius=Math.max(radius,140),top=verticalRadius+24,bottom=height-verticalRadius-24;
 if(n<12){const angle=index/n*Math.PI*2-Math.PI/2;return {x:width/2+radius*Math.cos(angle),y:height/2+(height/2-26)*Math.sin(angle)}}
 const right=Math.ceil((n-12)/2),left=n-12-right;
 const arc=(angle,center)=>({x:width/2+radius*Math.cos(angle*Math.PI/180),y:center+verticalRadius*Math.sin(angle*Math.PI/180)});
 if(index<4)return arc(-105+index*30,top);
 index-=4;
 if(index<right)return {x:width-30,y:top+(index+1)*(bottom-top)/(right+1)};
 index-=right;
 if(index<6)return arc(15+index*30,bottom);
 index-=6;
 if(index<left)return {x:30,y:bottom-(index+1)*(bottom-top)/(left+1)};
 index-=left;return arc(-165+index*30,top);
}
function point(index){const r=$('#canvas').getBoundingClientRect();if($('#canvas').classList.contains('racetrack'))return trackPoint(index,people.length,r.width,r.height);const angle=index/people.length*Math.PI*2-Math.PI/2;return {x:r.width/2+Math.cos(angle)*(r.width/2-(mobileQuery.matches?38:50)),y:r.height/2+Math.sin(angle)*(r.height/2-(mobileQuery.matches?38:50))}}
mobileQuery.addEventListener('change',()=>{endDrag(true);if(people.length){layout();render()}});
function render(){people.forEach((p,i)=>{const b=$(`#seats [data-id="${p.id}"]`),pos=point(i);b.querySelector('.num').textContent=`${String(i+1).padStart(2,'0')} 号`;b.setAttribute('aria-label',`${i+1}号 ${p.name}，可用方向键调整座位`);if(!drag||drag.id!==p.id){b.style.left=`${pos.x}px`;b.style.top=`${pos.y}px`}});$('#order').replaceChildren(...people.map((p,i)=>{const li=document.createElement('li'),b=document.createElement('b');b.textContent=i+1;li.append(b,document.createTextNode(p.name));return li}))}
function move(id,to){const from=people.findIndex(p=>p.id===id);if(from===to)return;const [p]=people.splice(from,1);people.splice(to,0,p);render()}
function startDrag(e){if(e.button!==0||drag)return;const b=e.currentTarget;drag={id:Number(b.dataset.id),pointer:e.pointerId,before:people.slice(),button:b};b.classList.add('dragging');b.setPointerCapture(e.pointerId);e.preventDefault();drag.clientX=e.clientX;drag.clientY=e.clientY;pointerMove(e);drag.frame=requestAnimationFrame(autoScroll)}
function pointerMove(e){if(!drag||e.pointerId!==drag.pointer)return;drag.clientX=e.clientX;drag.clientY=e.clientY;const rect=$('#canvas').getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;drag.button.style.left=`${x}px`;drag.button.style.top=`${y}px`;let nearest=0,min=Infinity;people.forEach((_,i)=>{const p=point(i),d=(p.x-x)**2+(p.y-y)**2;if(d<min){min=d;nearest=i}});move(drag.id,nearest)}
function autoScroll(){if(!drag)return;const y=drag.clientY,edge=90;const speed=y<edge?-Math.ceil((edge-y)/7):y>innerHeight-edge?Math.ceil((y-innerHeight+edge)/7):0;if(speed){window.scrollBy(0,speed);pointerMove({pointerId:drag.pointer,clientX:drag.clientX,clientY:drag.clientY})}drag.frame=requestAnimationFrame(autoScroll)}
function endDrag(cancel=false){if(!drag)return;const d=drag;cancelAnimationFrame(d.frame);if(cancel)people=d.before;drag=null;d.button.classList.remove('dragging');if(d.button.hasPointerCapture(d.pointer))d.button.releasePointerCapture(d.pointer);render();announce(d.id);d.button.focus({preventScroll:true})}
function announce(id){const index=people.findIndex(p=>p.id===id);$('#announcement').textContent=`${people[index].name}，已移至 ${index+1} 号座位`}
window.addEventListener('pointermove',pointerMove);window.addEventListener('pointerup',e=>{if(drag&&e.pointerId===drag.pointer)endDrag()});window.addEventListener('pointercancel',()=>endDrag(true));window.addEventListener('keydown',e=>{if(e.key==='Escape')endDrag(true)});window.addEventListener('blur',()=>endDrag(true));
function keyMove(e){if(drag)return;const direction={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[e.key];if(!direction)return;e.preventDefault();const id=Number(e.currentTarget.dataset.id),i=people.findIndex(p=>p.id===id);move(id,(i+direction+people.length)%people.length);announce(id)}
$('#reset').onclick=()=>{endDrag(true);people=initial.map(p=>({...p}));render();$('#announcement').textContent='已恢复录入顺序'};new ResizeObserver(()=>{if(people.length){layout();render()}}).observe($('#canvas'));fields();
if(document.modelContext?.registerTool){for(const tool of [{name:'get_seating_order',description:'读取当前圆桌顺时针座位顺序。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:()=>({seats:people.map((p,i)=>({seat:i+1,name:p.name}))})},{name:'move_guest_to_seat',description:'将当前圆桌某个座位上的人移动到指定座位，其余人顺移。',inputSchema:{type:'object',properties:{from:{type:'integer',minimum:1,maximum:30},to:{type:'integer',minimum:1,maximum:30}},required:['from','to'],additionalProperties:false},annotations:{readOnlyHint:false},execute:({from,to})=>{if(drag||!Number.isInteger(from)||!Number.isInteger(to)||from<1||to<1||from>people.length||to>people.length)throw Error('请提供当前圆桌有效的座位编号，并在拖动结束后操作。');const id=people[from-1].id;move(id,to-1);announce(id);return {seats:people.map((p,i)=>({seat:i+1,name:p.name}))}}}]){try{Promise.resolve(document.modelContext.registerTool(tool)).catch(()=>{})}catch{}}}
