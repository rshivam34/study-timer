/* ========== DEADLINES + REMINDERS + RECURRING MODULES ========== */
/* Part 3/7 — DL + REM + RECUR extracted */

var DL=(function(){var iv,editId=null;
function add(){var title=document.getElementById('dlTitle').value.trim(),type=document.getElementById('dlType').value,date=document.getElementById('dlDate').value;if(!title||!date){UI.toast('Fill title & date');return}D.setDL(D.getDL().concat([{id:'dl_'+Date.now(),type:type,title:title,date:new Date(date).toISOString()}]));document.getElementById('dlTitle').value='';document.getElementById('dlDate').value='';render();REM.render();UI.toast('Deadline added ✓');D.push()}
function render(){var el=document.getElementById('dlList'),dls=D.getDL(),now=Date.now();if(!dls.length){el.innerHTML='<div class="empty" style="padding:10px"><p>No deadlines set</p></div>';return}
dls.sort(function(a,b){return new Date(a.date)-new Date(b.date)});var h='';
dls.forEach(function(d){var target=new Date(d.date).getTime(),diff=target-now,ov=diff<0;var days=Math.floor(Math.abs(diff)/864e5),hrs=Math.floor(Math.abs(diff)%864e5/36e5);var cd,cls,cdCol;
if(ov){cd='Overdue '+days+'d '+hrs+'h';cls='urgent';cdCol='var(--red)'}
else if(days<1){cd=hrs+'h remaining';cls='urgent';cdCol='var(--red)'}
else if(days<=3){cd=days+'d '+hrs+'h';cls='warn';cdCol='var(--yel)'}
else if(days<=7){cd=days+'d '+hrs+'h';cls='warn';cdCol='var(--acc)'}
else{cd=days+'d '+hrs+'h';cls='safe';cdCol='var(--grn)'}
var typeIco=d.type==='study'?'📖':d.type==='work'?'💼':'🏠';
h+='<div class="dl-card '+cls+'" onclick="DL.edit(\''+d.id+'\')"><div class="dl-left"><div class="dl-title">'+typeIco+' '+esc(d.title)+'</div><div class="dl-meta">'+UI.fdateFull(d.date)+' · tap to edit</div></div><div class="dl-countdown" style="color:'+cdCol+'">'+cd+'</div></div>'});el.innerHTML=h}
function edit(id){editId=id;var dl=D.getDL().find(function(d){return d.id===id});if(!dl)return;document.getElementById('dlEditTitle').value=dl.title;document.getElementById('dlEditType').value=dl.type||'study';var dt=new Date(dl.date);var iso=dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0')+'T'+String(dt.getHours()).padStart(2,'0')+':'+String(dt.getMinutes()).padStart(2,'0');document.getElementById('dlEditDate').value=iso;document.getElementById('dlEditModal').classList.remove('hidden')}
function saveEdit(){if(!editId)return;var dls=D.getDL(),dl=dls.find(function(d){return d.id===editId});if(!dl)return;dl.title=document.getElementById('dlEditTitle').value.trim();dl.type=document.getElementById('dlEditType').value;dl.date=new Date(document.getElementById('dlEditDate').value).toISOString();D.setDL(dls);document.getElementById('dlEditModal').classList.add('hidden');render();REM.render();D.push();UI.toast('Updated ✓');editId=null}
function deleteFromEdit(){if(!editId)return;if(!confirm('Delete this deadline?'))return;D.setDL(D.getDL().filter(function(d){return d.id!==editId}));document.getElementById('dlEditModal').classList.add('hidden');render();REM.render();D.push();UI.toast('Deleted');editId=null}
function remove(id){if(!confirm('Remove?'))return;D.setDL(D.getDL().filter(function(d){return d.id!==id}));render();REM.render();D.push()}
function startTick(){if(iv)clearInterval(iv);iv=setInterval(function(){render();REM.render()},60000)}
return{add:add,render:render,edit:edit,saveEdit:saveEdit,deleteFromEdit:deleteFromEdit,remove:remove,startTick:startTick}})();

var REM=(function(){
function render(){var el=document.getElementById('remContent'),h='',now=new Date(),today=D.todayKey(),cfg=D.getCfg();
var goalH=D.getGoalForDate(today);var ss=D.todayS('study'),tot=0;ss.forEach(function(s){tot+=s.dur});
// Happiness banner
h+='<div class="happy-banner"><div class="hb-title">😊 Remember to be happy!</div><div class="hb-desc">You\'re doing amazing. Breathe, smile, keep going. 🌟</div></div>';
// Competition Coach
h+=buildCoach(now,tot,goalH,cfg,ss);
// Urgent Today
var rd=D.getRevs().filter(function(r){return r.active&&r.nextDate<=today});
var odls=D.getDL().filter(function(d){return new Date(d.date).getTime()<Date.now()});
if(rd.length||odls.length){h+='<div class="sl">🔴 Overdue / Due Now</div>';
rd.forEach(function(r){h+='<div class="rc-today-card" style="border-color:rgba(248,113,113,.3)"><div><div class="rc-today-title" style="color:var(--red)">'+esc(r.subj)+': '+esc(r.topic)+'</div><div class="rc-today-type">Revision · '+r.diff+' · next: '+UI.fdate(r.nextDate)+'</div></div></div>'});
odls.forEach(function(d){h+='<div class="rc-today-card" style="border-color:rgba(248,113,113,.3)"><div><div class="rc-today-title" style="color:var(--red)">'+esc(d.title)+'</div><div class="rc-today-type">Deadline · overdue · '+UI.fdateFull(d.date)+'</div></div></div>'})}
// 7-day recurring + deadline preview
h+=build7DayPreview(now,today);
el.innerHTML=h}
function buildCoach(now,tot,goalH,cfg,ss){var bedH=cfg.bedtime||23,effMin=cfg.effectiveMins||45;var goalS=goalH*3600,rem=goalS-tot;var pct=Math.min(100,Math.round(tot/goalS*100));var hr=now.getHours(),endOfDay=new Date(now);endOfDay.setHours(bedH,0,0,0);if(bedH>=24)endOfDay.setDate(endOfDay.getDate()+1),endOfDay.setHours(bedH-24,0,0,0);var secsLeft=Math.max(0,Math.floor((endOfDay-now)/1000));var hrsLeft=secsLeft/3600;var maxPoss=Math.floor(hrsLeft*(effMin/60)*3600);
var barCol=pct>=100?'var(--grn)':pct>=60?'var(--acc)':pct>=30?'var(--yel)':'var(--red)';
var msg=getCoachMsg(hr,pct,rem,hrsLeft,maxPoss,tot,goalH,goalS,effMin);
var sessCount=ss.length,longest=0;ss.forEach(function(s){if(s.dur>longest)longest=s.dur});
// Streak
var streak=0,d2=new Date(now);d2.setDate(d2.getDate()-1);
for(var i=0;i<365;i++){var k=D.todayKey(d2);var ds=D.getSess('study',k);var dt=0;ds.forEach(function(s){dt+=s.dur});var gk=D.getGoalForDate(k);if(dt>=gk*3600)streak++;else break;d2.setDate(d2.getDate()-1)}
var h='<div class="coach"><div class="coach-title">🔥 Competition Check</div>';
h+='<div class="coach-bar"><div class="coach-bar-fill" style="width:'+pct+'%;background:'+barCol+'"></div></div>';
h+='<div class="coach-stats"><span>'+UI.fd(tot)+' / '+goalH+'h</span><span>'+pct+'%</span></div>';
h+='<div class="coach-msg">'+msg+'</div>';
var remH2=rem>0?UI.fd(rem)+' remaining':'Done ✓';
h+='<div class="coach-meta"><span>⏰ '+Math.floor(hrsLeft)+'h '+Math.round((hrsLeft%1)*60)+'m left today</span><span>🎯 '+remH2+'</span></div>';
h+='<div class="coach-meta" style="margin-top:4px"><span>📈 '+sessCount+' session'+(sessCount!==1?'s':'')+' · Best: '+(longest?UI.fd(longest):'—')+'</span><span>🔥 Streak: '+streak+'d</span></div></div>';
return h}
function getCoachMsg(hr,pct,rem,hrsLeft,maxPoss,tot,goalH,goalS,effMin){
var remH=UI.fd(Math.max(0,rem)),maxH=UI.fd(maxPoss),hL=Math.floor(hrsLeft)+'h '+Math.round((hrsLeft%1)*60)+'m';
// GOAL ACHIEVED
if(pct>=100){if(pct>=130)return"🏆 "+UI.fd(tot)+" done — you're CRUSHING IT. This is what separates toppers from dreamers. But tomorrow is a new war. Rest smart, come back stronger.";
return"✅ Goal hit! But remember — the student who gets YOUR seat studied 2 more hours after hitting their goal. Winners don't stop at 'enough'. Keep going.";}
// MORNING (before 12 PM)
if(hr<12){if(pct<5)return"🚨 Toppers started at 5 AM. You haven't even begun. Every minute you waste, 1000 students are pulling ahead. While you're reading this, someone is finishing their 3rd chapter. START. NOW.";
if(pct<30)return"⚡ Good start, but "+remH+" still to go. Someone with the same dream woke up earlier and is already ahead of you. Close everything else and GRIND.";
return"💪 Solid morning, but 'solid' means average. The seat you want? 10 others want it too. "+remH+" left — make every hour count.";}
// AFTERNOON (12 PM - 5 PM)
if(hr<17){if(maxPoss<rem&&pct<50)return"🔴 "+UI.fd(tot)+" done, "+goalH+"h goal. That's only "+pct+"%. HALF THE DAY IS GONE. Thousands of students with the same dream are ahead of you right now. This is where winners are made — or broken.";
if(maxPoss<rem)return"⚠️ "+remH+" left to study, but only "+hL+" remain in your day. The math is tight. NO PHONE. NO DISTRACTIONS. Every second you waste, someone else gains on you. MOVE.";
return"🎯 You're on pace, but 'on pace' means average. The rank you want needs MORE than average. "+remH+" to go — push beyond your goal. That's where rank jumps happen.";}
// EVENING (5 PM - 9 PM)
if(hr<21){if(maxPoss<rem*0.5)return"💀 "+pct+"% done with only "+hL+" left. Uncomfortable? GOOD. That feeling is your future self screaming at you. You can still do "+maxH+" — that's "+maxH+" more than quitting. Shut everything and STUDY.";
if(maxPoss<rem)return"🔥 "+hL+" left in your day. You need "+remH+" but can realistically cover "+maxH+". Won't hit 100% — but "+maxH+" is still MASSIVE. Your competition didn't skip today. Neither should you. EVERY. MINUTE. COUNTS.";
if(rem>0)return"⚡ Almost there! Just "+remH+" to go. Don't slow down at the finish line — that's exactly where most people fail. The last push separates rank #100 from rank #1000.";
return"✅ You're close to your goal! Finish strong. Every extra minute you put in is a rank gained.";}
// LATE NIGHT (9 PM - bedtime)
if(maxPoss>0&&rem>0)return"🌙 Day is ending. "+UI.fd(tot)+" of "+goalH+"h done. You can still cover "+maxH+" before bed. Your competitors didn't skip today. Neither should you. Don't let today be a zero. GO.";
if(rem>0)return"⚠️ Day is almost over. "+UI.fd(tot)+" of "+goalH+"h done. Not your best day, but tomorrow is another battle. Sleep well, wake up fierce, and come back twice as hard.";
return"✅ Goal done! Rest now, fight harder tomorrow."}
function build7DayPreview(now,today){var h='',cfg=D.getCfg(),rcs=D.getRC().filter(function(r){return r.active!==false}),done=D.getRCDone()[today]||[];
var _dayFull=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
for(var i=0;i<7;i++){var d=new Date(now);d.setDate(d.getDate()+i);var dk=D.todayKey(d);var dayLabel=i===0?'📌 TODAY ('+UI.fdate(dk)+')':i===1?'📅 Tomorrow ('+UI.fdate(dk)+')':'📅 '+_dayFull[d.getDay()]+' '+UI.fdate(dk);
var items=[];
// Recurring tasks for this day
rcs.forEach(function(rc){if(RECUR.isDueOn(rc,d))items.push({type:'rc',data:rc})});
// Deadlines on this day
D.getDL().forEach(function(dl){var dlDate=new Date(dl.date);var dlK=D.todayKey(dlDate);if(dlK===dk)items.push({type:'dl',data:dl})});
// Revisions due on this day
D.getRevs().filter(function(r){return r.active&&r.nextDate===dk}).forEach(function(r){items.push({type:'rev',data:r})});
if(!items.length)continue;
h+='<div class="rc-day-group"><div class="rc-day-label'+(i===0?' today-label':'')+'">'+dayLabel+' <span style="font-size:.6rem;opacity:.6">('+items.length+')</span></div>';
items.forEach(function(it){if(it.type==='rc'){var isDone=i===0&&done.indexOf(it.data.id)!==-1;h+='<div class="rc-today-card'+(isDone?' done':'')+'"><div><div class="rc-today-title">🔄 '+esc(it.data.title)+'</div><div class="rc-today-type">'+esc(it.data.rcType)+' · '+it.data.pattern+(it.data.time?' · '+it.data.time:'')+'</div></div>';if(i===0&&!isDone)h+='<div class="rc-today-actions"><button class="b b-xs b-grn" onclick="REM.markDone(\''+it.data.id+'\')">✅</button><button class="b b-xs" onclick="REM.dismiss(\''+it.data.id+'\')">👁</button></div>';h+='</div>'}
else if(it.type==='dl'){var t=new Date(it.data.date),tStr=t.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});h+='<div class="rc-today-card" onclick="DL.edit(\''+it.data.id+'\')"><div><div class="rc-today-title">⏰ '+esc(it.data.title)+'</div><div class="rc-today-type">Deadline · '+it.data.type+' · '+tStr+' · tap to edit</div></div></div>'}
else{h+='<div class="rc-today-card"><div><div class="rc-today-title">🧠 '+esc(it.data.topic)+'</div><div class="rc-today-type">Revision · '+esc(it.data.subj)+' · '+it.data.diff+'</div></div></div>'}});h+='</div>'}
if(!h)h='<div class="empty" style="padding:10px"><p>Nothing scheduled for the next 7 days</p></div>';
return'<div class="sl">📋 Next 7 Days</div>'+h}
function markDone(id){D.markRCDone(id);render();D.push();UI.toast('Done ✓')}function dismiss(id){D.markRCDone(id);render();UI.toast('Dismissed')}
function setGoal(){var date=document.getElementById('goalDate').value,hrs=parseFloat(document.getElementById('goalHrs').value);if(!date||isNaN(hrs)){UI.toast('Fill both');return}var cfg=D.getCfg();cfg.dailyGoals[date]=hrs;D.setCfg(cfg);UI.toast('Goal: '+hrs+'h');render();UI.renderGoal();D.push()}
return{render:render,setGoal:setGoal,markDone:markDone,dismiss:dismiss}})();

var RECUR=(function(){var editingId=null;
function isDueOn(rc,date){var dow=date.getDay(),dom=date.getDate(),m=date.getMonth()+1,d2=date.getDate();
if(rc.pattern==='daily')return true;if(rc.pattern==='weekly')return rc.days&&rc.days.indexOf(dow)!==-1;if(rc.pattern==='specific')return rc.days&&rc.days.indexOf(dow)!==-1;
if(rc.pattern==='fortnightly'){if(!rc.startDate)return dow===1;var sd=new Date(rc.startDate),diff=Math.floor((date-sd)/(864e5));return diff%14===0}
if(rc.pattern==='monthly')return dom===(rc.monthDay||1);if(rc.pattern==='yearly')return rc.yearMonth===m&&rc.yearDay===dom;return false}
function patternChange(){renderPatternOpts('rcPattern','rcPatternOpts',null)}
function editPatternChange(){renderPatternOpts('rcEditPattern','rcEditPatternOpts',null)}
function renderPatternOpts(selId,containerId,rc){var p=document.getElementById(selId).value,el=document.getElementById(containerId);
if(p==='weekly'||p==='specific'){var days=['Su','Mo','Tu','We','Th','Fr','Sa'];var sel=rc?rc.days||[]:[1,2,3,4,5];el.innerHTML='<div class="day-chips" id="'+containerId+'-days">'+days.map(function(d,i){return'<div class="day-chip'+(sel.indexOf(i)!==-1?' on':'')+'" data-d="'+i+'" onclick="this.classList.toggle(\'on\')">'+d+'</div>'}).join('')+'</div>'}
else if(p==='monthly'){var mday=rc?rc.monthDay||1:1;var opts='';for(var i=1;i<=31;i++)opts+='<option value="'+i+'"'+(i===mday?' selected':'')+'>'+i+'</option>';el.innerHTML='<div class="df"><span class="df-lbl">Day of month</span><select class="cat-sel" id="'+containerId+'-mday" style="width:70px">'+opts+'</select></div>'}
else if(p==='yearly'){var ym=rc?rc.yearMonth||1:1,yd=rc?rc.yearDay||1:1;var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];var mopts='';months.forEach(function(m,i){mopts+='<option value="'+(i+1)+'"'+(i+1===ym?' selected':'')+'>'+m+'</option>'});var dopts='';for(var j=1;j<=31;j++)dopts+='<option value="'+j+'"'+(j===yd?' selected':'')+'>'+j+'</option>';el.innerHTML='<div class="df"><span class="df-lbl">Month</span><select class="cat-sel" id="'+containerId+'-ymonth" style="flex:1">'+mopts+'</select><span class="df-lbl">Day</span><select class="cat-sel" id="'+containerId+'-yday" style="width:60px">'+dopts+'</select></div>'}
else if(p==='fortnightly'){el.innerHTML='<div class="df"><span class="df-lbl">Starting from</span><input type="date" class="inp" id="'+containerId+'-fstart" value="'+(rc&&rc.startDate?rc.startDate:D.todayKey())+'" style="flex:1"></div>'}
else el.innerHTML=''}
function getPatternData(prefix){var p=document.getElementById(prefix.replace('Opts','')).value,data={pattern:p};
if(p==='weekly'||p==='specific'){data.days=[];document.querySelectorAll('#'+prefix+'-days .day-chip.on').forEach(function(c){data.days.push(parseInt(c.dataset.d))})}
else if(p==='monthly')data.monthDay=parseInt(document.getElementById(prefix+'-mday').value)||1;
else if(p==='yearly'){data.yearMonth=parseInt(document.getElementById(prefix+'-ymonth').value)||1;data.yearDay=parseInt(document.getElementById(prefix+'-yday').value)||1}
else if(p==='fortnightly')data.startDate=document.getElementById(prefix+'-fstart').value;return data}
function add(){var title=document.getElementById('rcTitle').value.trim(),type=document.getElementById('rcType').value;if(!title){UI.toast('Enter title');return}var pd=getPatternData('rcPatternOpts');var rc=Object.assign({id:'rc_'+Date.now(),title:title,rcType:type,time:document.getElementById('rcTime').value||'08:00',active:true},pd);D.addRC(rc);document.getElementById('rcTitle').value='';render();REM.render();D.push();UI.toast('Added ✓')}
function edit(id){editingId=id;var rc=D.getRC().find(function(r){return r.id===id});if(!rc)return;document.getElementById('rcEditTitle').value=rc.title;fillTypeDD('rcEditType');document.getElementById('rcEditType').value=rc.rcType;document.getElementById('rcEditPattern').value=rc.pattern;document.getElementById('rcEditTime').value=rc.time||'08:00';renderPatternOpts('rcEditPattern','rcEditPatternOpts',rc);document.getElementById('rcEditModal').classList.remove('hidden')}
function saveEdit(){if(!editingId)return;var rcs=D.getRC(),rc=rcs.find(function(r){return r.id===editingId});if(!rc)return;rc.title=document.getElementById('rcEditTitle').value.trim();rc.rcType=document.getElementById('rcEditType').value;rc.time=document.getElementById('rcEditTime').value;var pd=getPatternData('rcEditPatternOpts');Object.assign(rc,pd);D.setRC(rcs);document.getElementById('rcEditModal').classList.add('hidden');render();REM.render();D.push();UI.toast('Updated ✓');editingId=null}
function remove(id){if(!confirm('Delete?'))return;D.setRC(D.getRC().filter(function(r){return r.id!==id}));render();REM.render();D.push()}
function toggle(id){var rcs=D.getRC(),rc=rcs.find(function(r){return r.id===id});if(rc)rc.active=!rc.active;D.setRC(rcs);render();REM.render();D.push()}
function fillTypeDD(selId){var cfg=D.getCfg(),types=cfg.recurringTypes||['Birthdays','Anniversaries','Habits','Bills','Custom'];document.getElementById(selId).innerHTML=types.map(function(t){return'<option>'+esc(t)+'</option>'}).join('')}
function addType(){var v=document.getElementById('rcNewType').value.trim();if(!v)return;var cfg=D.getCfg();if(!cfg.recurringTypes)cfg.recurringTypes=['Birthdays','Anniversaries','Habits','Bills','Custom'];if(cfg.recurringTypes.indexOf(v)===-1)cfg.recurringTypes.push(v);D.setCfg(cfg);document.getElementById('rcNewType').value='';render();D.push();UI.toast('Type added')}
function removeType(t){if(!confirm('Remove type "'+t+'"?'))return;var cfg=D.getCfg();cfg.recurringTypes=cfg.recurringTypes.filter(function(x){return x!==t});D.setCfg(cfg);render();D.push()}
function render(){var cfg=D.getCfg(),types=cfg.recurringTypes||['Birthdays','Anniversaries','Habits','Bills','Custom'];
// Type list
document.getElementById('rcTypeList').innerHTML='<div class="manage-list">'+types.map(function(t){return'<span class="manage-tag" style="cursor:default">'+esc(t)+'<button class="manage-x" onclick="RECUR.removeType(\''+esc(t)+'\')">✕</button></span>'}).join('')+'</div>';
// Fill dropdowns
fillTypeDD('rcType');var filter=document.getElementById('rcFilter');var fv=filter.value;filter.innerHTML='<option value="">All Types</option>'+types.map(function(t){return'<option'+(t===fv?' selected':'')+'>'+esc(t)+'</option>'}).join('');
// Pattern opts init
var optsEl=document.getElementById('rcPatternOpts');if(!optsEl.innerHTML)patternChange();
// List grouped by type
var rcs=D.getRC(),filterV=document.getElementById('rcFilter').value;var el=document.getElementById('rcList');if(!rcs.length){el.innerHTML='<div class="empty"><p>No recurring tasks yet</p></div>';return}
var byType={};rcs.forEach(function(r){if(filterV&&r.rcType!==filterV)return;if(!byType[r.rcType])byType[r.rcType]=[];byType[r.rcType].push(r)});
var typeIcons={'Birthdays':'🎂','Anniversaries':'🎉','Habits':'💪','Bills':'💰','Custom':'📌'};
var h='';Object.keys(byType).sort().forEach(function(type){var items=byType[type];var ico=typeIcons[type]||'📋';h+='<div class="rg"><div class="rg-hdr" onclick="this.nextElementSibling.classList.toggle(\'hidden\')"><span class="rg-subj">'+ico+' '+esc(type)+'</span><span class="rg-count">'+items.length+'</span></div><div class="rg-body">';items.forEach(function(rc){var patDesc=rc.pattern;if(rc.pattern==='specific'||rc.pattern==='weekly'){var dnames=['Su','Mo','Tu','We','Th','Fr','Sa'];patDesc=(rc.days||[]).map(function(d){return dnames[d]}).join(', ')}else if(rc.pattern==='monthly')patDesc='Monthly · Day '+rc.monthDay;else if(rc.pattern==='yearly'){var mnames=['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];patDesc='Yearly · '+rc.yearDay+' '+(mnames[rc.yearMonth]||'')}
h+='<div class="rc-card"><div class="rc-left"><span class="rc-type-badge" style="background:var(--acc2);color:var(--acc)">'+esc(rc.rcType)+'</span><div class="rc-title"'+(rc.active===false?' style="opacity:.4;text-decoration:line-through"':'')+'>'+esc(rc.title)+'</div><div class="rc-pattern">'+patDesc+' · '+rc.time+'</div></div><div class="rc-actions"><button class="b b-xs" onclick="RECUR.edit(\''+rc.id+'\')">✏️</button><button class="b b-xs" onclick="RECUR.toggle(\''+rc.id+'\')">'+(rc.active!==false?'⏸':'▶')+'</button><button class="b b-xs b-danger" onclick="RECUR.remove(\''+rc.id+'\')">✕</button></div></div>'});h+='</div></div>'});el.innerHTML=h||'<div class="empty"><p>No tasks match filter</p></div>'}
function nextOccurrence(rc){var now=new Date();for(var i=0;i<400;i++){var d=new Date(now);d.setDate(d.getDate()+i);if(isDueOn(rc,d))return d}return null}
return{render:render,add:add,edit:edit,saveEdit:saveEdit,remove:remove,toggle:toggle,addType:addType,removeType:removeType,patternChange:patternChange,editPatternChange:editPatternChange,isDueOn:isDueOn,fillTypeDD:fillTypeDD,nextOccurrence:nextOccurrence}})();
