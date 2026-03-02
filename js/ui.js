/* UI helpers extracted from V2 project */
var UI=(function(){function fd(s){var h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sc=s%60;if(h>0)return h+'h '+m+'m';if(m>0)return m+'m '+sc+'s';return sc+'s'}function ft(iso){return new Date(iso).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}function fdn(k){var p=k.split('-');var days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];var d=new Date(p[0],p[1]-1,p[2]);return days[d.getDay()]+', '+p[2]+'-'+p[1]+'-'+p[0]}
function fdate(k){if(!k)return'—';var p=k.split('-');if(p.length===3)return p[2]+'-'+p[1]+'-'+p[0];return k}
function fdateISO(iso){if(!iso)return'—';var d=new Date(iso);return String(d.getDate()).padStart(2,'0')+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+d.getFullYear()}
function fdateFull(iso){if(!iso)return'—';var d=new Date(iso);return String(d.getDate()).padStart(2,'0')+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+d.getFullYear()+' '+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
function fillDD(){var cfg=D.getCfg();document.getElementById('studyCat').innerHTML='<option value="">Subject...</option>'+cfg.studySubjects.map(function(s){return'<option>'+esc(s)+'</option>'}).join('');document.getElementById('workCat').innerHTML='<option value="">Category...</option>'+cfg.workCategories.map(function(s){return'<option>'+esc(s)+'</option>'}).join('');document.getElementById('sylSubj').innerHTML='<option value="">Select subject...</option>'+cfg.studySubjects.map(function(s){return'<option>'+esc(s)+'</option>'}).join('')}
function renderGoal(){var today=D.todayKey();var goalH=D.getGoalForDate(today);var ss=D.todayS('study'),total=0;ss.forEach(function(s){total+=s.dur});var goalS=goalH*3600;var pct=goalS>0?Math.min(100,Math.round((total/goalS)*100)):0;var circ=2*Math.PI*34;var off=circ-(pct/100)*circ;document.getElementById('goalWrap').innerHTML='<div class="goal-ring"><svg width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" class="goal-ring-bg"/><circle cx="40" cy="40" r="34" class="goal-ring-fg" stroke-dasharray="'+circ+'" stroke-dashoffset="'+off+'"/></svg><div class="goal-ring-text"><span class="goal-ring-pct">'+pct+'%</span><span class="goal-ring-label">study goal</span></div></div><div class="goal-info"><strong>'+fd(total)+'</strong> / '+goalH+'h study goal<br>'+fd(Math.max(0,goalS-total))+' remaining</div>'}
function renderStats(type){var ss=D.todayS(type),t=0,l=0;ss.forEach(function(s){t+=s.dur;if(s.dur>l)l=s.dur});document.getElementById('sa-'+type).innerHTML='<div class="ac c-acc"><div class="av">'+fd(t)+'</div><div class="al">Total</div></div><div class="ac c-grn"><div class="av">'+ss.length+'</div><div class="al">Sessions</div></div><div class="ac c-blu"><div class="av">'+(ss.length?fd(Math.round(t/ss.length)):'—')+'</div><div class="al">Average</div></div><div class="ac c-pur"><div class="av">'+(l?fd(l):'—')+'</div><div class="al">Longest</div></div>'}
function renderCB(type,sessions,elId){var cats={},total=0;sessions.forEach(function(s){var c=s.cat||'Other';if(!cats[c])cats[c]={dur:0};cats[c].dur+=s.dur;total+=s.dur});var el=document.getElementById(elId);var ks=Object.keys(cats).sort(function(a,b){return cats[b].dur-cats[a].dur});if(!ks.length){el.innerHTML='<div class="cbrk-t">No data</div>';return}var mx=cats[ks[0]].dur;var color=type==='study'?'var(--acc)':'var(--cyn)';var h='<div class="cbrk-t">'+fd(total)+'</div>';ks.forEach(function(k){h+='<div class="cbr"><span class="cbr-n">'+esc(k)+'</span><div class="cbr-bw"><div class="cbr-b" style="width:'+Math.max(5,Math.round(cats[k].dur/mx*100))+'%;background:'+color+'"></div></div><span class="cbr-v">'+fd(cats[k].dur)+'</span></div>'});el.innerHTML=h}
function renderWC(type){var today=new Date(),color=type==='study'?'var(--acc2)':'var(--cyn2)',ac=type==='study'?'var(--acc)':'var(--cyn)';var days=[],maxS=1;for(var i=6;i>=0;i--){var dd=new Date(today);dd.setDate(dd.getDate()-i);var k=D.todayKey(dd);var ss=D.getSess(type,k);var dt=0;ss.forEach(function(s){dt+=s.dur});if(dt>maxS)maxS=dt;days.push({lbl:['S','M','T','W','T','F','S'][dd.getDay()],s:dt,t:i===0})}var h='';days.forEach(function(d){var pct=Math.max(4,Math.round(d.s/maxS*100));var v=d.s>=3600?Math.floor(d.s/3600)+'h':d.s>=60?Math.floor(d.s/60)+'m':'';h+='<div class="wc-col"><div class="wc-val">'+v+'</div><div class="wc-bar" style="height:'+pct+'%;background:'+(d.t?ac:color)+'"></div><div class="wc-lbl">'+d.lbl+'</div></div>'});document.getElementById('wb-'+type).innerHTML=h}
function renderSessions(type){var ss=D.todayS(type),el=document.getElementById('sl-'+type);if(!ss.length){el.innerHTML='<div class="empty"><div class="empty-ico">'+(type==='study'?'📚':'💼')+'</div><p>No sessions yet</p></div>';return}var h='';for(var i=ss.length-1;i>=0;i--){var s=ss[i];h+='<div class="si"><div><div class="si-top"><span class="si-num">#'+(i+1)+'</span><span class="si-cat">'+esc(s.cat)+'</span></div><div class="si-range">'+ft(s.start)+' → '+ft(s.end)+'</div>'+(s.note?'<div class="si-note">'+esc(s.note)+'</div>':'')+'</div><div class="si-r"><span class="si-dur">'+fd(s.dur)+'</span><button class="si-del" onclick="UI.delS(\''+type+'\','+i+')">✕</button></div></div>'}el.innerHTML=h}
function delS(type,i){if(!confirm('Delete?'))return;D.deleteSession(type,i);renderAll();toast('Deleted');D.push()}
function renderHistory(type){var data=D.getLocal(),today=D.todayKey();var days=data[type]?Object.keys(data[type]).filter(function(k){return k!==today}).sort().reverse():[];var c=document.getElementById('hl-'+type);if(!days.length){c.innerHTML='<div class="empty"><p>No past days</p></div>';return}var h='',col=type==='study'?'color:var(--acc)':'color:var(--cyn)';days.forEach(function(dk){var ss=data[type][dk],t=0;ss.forEach(function(s){t+=s.dur});h+='<div class="hday"><div><div class="hd-d">'+fdn(dk)+'</div><div class="hd-m">'+ss.length+' session'+(ss.length!==1?'s':'')+'</div></div><div class="hd-t" style="'+col+'">'+fd(t)+'</div></div>'});c.innerHTML=h}
function renderManage(){var cfg=D.getCfg();['Study','Work'].forEach(function(type){var key=type==='Study'?'studySubjects':'workCategories';var el=document.getElementById('mng'+type);el.innerHTML='<div class="manage-list" id="ml-'+type+'" data-type="'+type+'">'+cfg[key].map(function(s,i){return'<span class="manage-tag" data-idx="'+i+'" data-name="'+esc(s)+'"><span class="drag-handle">☰</span>'+esc(s)+'<button class="manage-x" onclick="event.stopPropagation();App.rmCat(\''+type.toLowerCase()+'\',\''+esc(s).replace(/'/g,"\\'")+'\')">✕</button></span>'}).join('')+'</div>';DRAG.init('ml-'+type)});/* Knowledge categories */var knEl=document.getElementById('mngKnowledge');if(knEl){var knCats=cfg.knowledgeCategories||[];knEl.innerHTML='<div class="manage-list" id="ml-Knowledge" data-type="Knowledge">'+knCats.map(function(s,i){return'<span class="manage-tag" data-idx="'+i+'" data-name="'+esc(s)+'">'+esc(s)+'<button class="manage-x" onclick="event.stopPropagation();App.rmCat(\'knowledge\',\''+esc(s).replace(/'/g,"\\'")+'\')">✕</button></span>'}).join('')+'</div>'}}
function renderAll(){fillDD();renderGoal();['study','work'].forEach(function(t){renderStats(t);renderCB(t,D.todayS(t),'cb-'+t);renderWC(t);renderSessions(t);renderHistory(t)});renderManage();SYL.renderAll();REV.render();DL.render();REM.render();RECUR.render()}
function tog(id){document.getElementById('sec'+id).classList.toggle('hidden');document.getElementById('tog'+id).classList.toggle('open')}
function toast(msg){var el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');setTimeout(function(){el.classList.remove('show')},2500)}
/* ========== AUTOCOMPLETE — attach to topic inputs ========== */
function autocomplete(inputEl,getSubjFn){
  var listEl=document.createElement('div');listEl.className='ac-list';
  var wrap=inputEl.parentElement;
  if(!wrap.classList.contains('ac-wrap')){wrap.style.position='relative'}
  wrap.appendChild(listEl);
  var activeIdx=-1;
  function getTopics(q){
    var subj=getSubjFn?getSubjFn():'';
    var revs=D.getRevs();
    var seen={},results=[];
    revs.forEach(function(r){
      if(subj&&r.subj!==subj)return;
      if(seen[r.topic])return;seen[r.topic]=1;
      if(!q||r.topic.toLowerCase().indexOf(q.toLowerCase())>=0)
        results.push({topic:r.topic,subj:r.subj});
    });
    /* Also pull from plans */
    var plans=D.getLocal().plans||{};
    Object.keys(plans).forEach(function(dk){
      (plans[dk]||[]).forEach(function(p){
        if(!p.topic||seen[p.topic])return;
        if(subj&&p.subject!==subj)return;seen[p.topic]=1;
        if(!q||p.topic.toLowerCase().indexOf(q.toLowerCase())>=0)
          results.push({topic:p.topic,subj:p.subject});
      });
    });
    return results.slice(0,8);
  }
  function show(items,q){
    if(!items.length){listEl.classList.remove('show');return}
    activeIdx=-1;
    var h='';
    items.forEach(function(it,i){
      h+='<div class="ac-item" data-idx="'+i+'"><span>'+esc(it.topic)+'</span><span class="ac-subj">'+esc(it.subj)+'</span></div>';
    });
    listEl.innerHTML=h;listEl.classList.add('show');
    listEl.querySelectorAll('.ac-item').forEach(function(el,i){
      el.addEventListener('mousedown',function(e){e.preventDefault();pick(items[i])});
    });
  }
  function pick(item){inputEl.value=item.topic;listEl.classList.remove('show');inputEl.dispatchEvent(new Event('input'))}
  function hide(){setTimeout(function(){listEl.classList.remove('show')},150)}
  inputEl.addEventListener('input',function(){
    var q=inputEl.value.trim();
    if(q.length<1){listEl.classList.remove('show');return}
    show(getTopics(q),q);
  });
  inputEl.addEventListener('focus',function(){
    var q=inputEl.value.trim();
    if(q.length>=1)show(getTopics(q),q);
  });
  inputEl.addEventListener('blur',hide);
  inputEl.addEventListener('keydown',function(e){
    if(!listEl.classList.contains('show'))return;
    var items=listEl.querySelectorAll('.ac-item');
    if(e.key==='ArrowDown'){e.preventDefault();activeIdx=Math.min(activeIdx+1,items.length-1);items.forEach(function(el,i){el.classList.toggle('active',i===activeIdx)})}
    else if(e.key==='ArrowUp'){e.preventDefault();activeIdx=Math.max(activeIdx-1,0);items.forEach(function(el,i){el.classList.toggle('active',i===activeIdx)})}
    else if(e.key==='Enter'&&activeIdx>=0){e.preventDefault();items[activeIdx].dispatchEvent(new MouseEvent('mousedown'))}
    else if(e.key==='Escape'){listEl.classList.remove('show')}
  });
}
return{renderAll:renderAll,renderGoal:renderGoal,delS:delS,tog:tog,toast:toast,fd:fd,fdn:fdn,fdate:fdate,fdateISO:fdateISO,fdateFull:fdateFull,fillDD:fillDD,renderManage:renderManage,renderCB:renderCB,autocomplete:autocomplete}})();

var DRAG=(function(){function init(listId){var list=document.getElementById(listId);if(!list)return;var dragEl=null,ghost=null,startX,startY,isDragging=false,holdTimer=null;function tagAt(x,y){var tags=list.querySelectorAll('.manage-tag');for(var i=0;i<tags.length;i++){var r=tags[i].getBoundingClientRect();if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom)return tags[i]}return null}function startDrag(el,x,y){isDragging=true;dragEl=el;el.classList.add('dragging');ghost=document.createElement('div');ghost.className='drag-ghost';ghost.textContent=el.dataset.name;document.body.appendChild(ghost);ghost.style.left=(x-40)+'px';ghost.style.top=(y-20)+'px'}function moveDrag(x,y){if(!isDragging)return;ghost.style.left=(x-40)+'px';ghost.style.top=(y-20)+'px';list.querySelectorAll('.manage-tag').forEach(function(t){t.classList.remove('drag-over')});var over=tagAt(x,y);if(over&&over!==dragEl)over.classList.add('drag-over')}function endDrag(x,y){if(!isDragging){clearTimeout(holdTimer);return}isDragging=false;list.querySelectorAll('.manage-tag').forEach(function(t){t.classList.remove('drag-over');t.classList.remove('dragging')});if(ghost){ghost.remove();ghost=null}var over=tagAt(x,y);if(over&&dragEl&&over!==dragEl){var cfg=D.getCfg(),key=list.dataset.type==='Study'?'studySubjects':'workCategories';var fi=parseInt(dragEl.dataset.idx),ti=parseInt(over.dataset.idx);var item=cfg[key].splice(fi,1)[0];cfg[key].splice(ti,0,item);D.setCfg(cfg);UI.renderManage();UI.fillDD();D.push()}dragEl=null}
list.addEventListener('touchstart',function(e){var handle=e.target.closest('.drag-handle');var tag=e.target.closest('.manage-tag');if(!tag)return;var touch=e.touches[0];startX=touch.clientX;startY=touch.clientY;if(handle){holdTimer=setTimeout(function(){startDrag(tag,startX,startY);navigator.vibrate&&navigator.vibrate(30)},300)}},{passive:false});list.addEventListener('touchmove',function(e){if(isDragging){e.preventDefault();var t=e.touches[0];moveDrag(t.clientX,t.clientY)}},{passive:false});list.addEventListener('touchend',function(e){var t=e.changedTouches[0];endDrag(t.clientX,t.clientY)});list.addEventListener('touchcancel',function(){isDragging=false;clearTimeout(holdTimer);list.querySelectorAll('.manage-tag').forEach(function(t){t.classList.remove('drag-over');t.classList.remove('dragging')});if(ghost){ghost.remove();ghost=null}});list.addEventListener('mousedown',function(e){var handle=e.target.closest('.drag-handle');if(!handle)return;var tag=handle.closest('.manage-tag');startDrag(tag,e.clientX,e.clientY)});document.addEventListener('mousemove',function(e){if(isDragging&&dragEl&&dragEl.closest('#'+listId))moveDrag(e.clientX,e.clientY)});document.addEventListener('mouseup',function(e){if(isDragging&&dragEl&&dragEl.closest('#'+listId))endDrag(e.clientX,e.clientY)})}return{init:init}})();


