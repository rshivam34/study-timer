/* ========== SUMMARY & ANALYTICS MODULE ========== */
/* Part 4/7 — 11 Weekly & Monthly Summary Enhancements */

var SUM=(function(){
  function getJournal(){return D.getLocal().journal||{}}
  function setJournal(j){var d=D.getLocal();d.journal=j;D.saveLocal(d)}

  function init(){document.getElementById('sumDate').value=D.todayKey();render()}
  function today(){document.getElementById('sumDate').value=D.todayKey();render()}

  function render(){
    var dk=document.getElementById('sumDate').value||D.todayKey();
    renderDaily(dk);
    renderJournal(dk);
    renderWeekly(dk);
    renderMonthly(dk);
    renderAnalytics();
  }

  /* ---- HELPERS ---- */
  function sumRow(label,value){
    return'<div class="sum-row"><span class="sum-label">'+label+'</span><span class="sum-value">'+value+'</span></div>';
  }
  function _grade(pct){
    if(pct>=90)return{letter:'A',color:'var(--grn)'};
    if(pct>=75)return{letter:'B',color:'var(--cyn)'};
    if(pct>=60)return{letter:'C',color:'var(--yel)'};
    if(pct>=40)return{letter:'D',color:'var(--acc)'};
    return{letter:'F',color:'var(--red)'};
  }
  function _delta(curr,prev){
    if(prev===0)return curr>0?{cls:'delta-up',txt:'↑ new'}:{cls:'delta-same',txt:'—'};
    var pc=Math.round((curr-prev)/prev*100);
    return pc>0?{cls:'delta-up',txt:'↑'+pc+'%'}:pc<0?{cls:'delta-down',txt:'↓'+Math.abs(pc)+'%'}:{cls:'delta-same',txt:'—'};
  }
  function _deltaCard(label,curr,prev,unit){
    var d=_delta(curr,prev);
    return'<div class="delta-card"><div class="delta-label">'+label+'</div><div class="delta-vals"><span class="delta-curr">'+(unit?unit(curr):curr)+'</span><span class="delta-prev">'+(unit?unit(prev):prev)+'</span></div><div class="delta-badge '+d.cls+'">'+d.txt+'</div></div>';
  }
  var _COLORS=['var(--acc)','var(--cyn)','var(--pur)','var(--grn)','var(--yel)','var(--blu)','var(--red)','#ec4899'];

  /* Rating info popup HTML */
  function _ratingInfoBtn(){
    return '<span class="rating-info-btn" onclick="event.stopPropagation();this.querySelector(\'.rating-popup\').classList.toggle(\'show\')" title="What do ratings mean?">ⓘ'
      +'<div class="rating-popup">'
      +'<div style="font-size:.7rem;font-weight:700;color:var(--heading);margin-bottom:6px">Grade Scale</div>'
      +'<div class="rating-popup-row"><span class="rating-popup-grade" style="color:var(--grn)">A</span><span class="rating-popup-desc">Excellent — 90%+ of daily goal met</span></div>'
      +'<div class="rating-popup-row"><span class="rating-popup-grade" style="color:var(--cyn)">B</span><span class="rating-popup-desc">Good — 75-89% of daily goal met</span></div>'
      +'<div class="rating-popup-row"><span class="rating-popup-grade" style="color:var(--yel)">C</span><span class="rating-popup-desc">Average — 60-74% of daily goal met</span></div>'
      +'<div class="rating-popup-row"><span class="rating-popup-grade" style="color:var(--acc)">D</span><span class="rating-popup-desc">Below Average — 40-59% of goal</span></div>'
      +'<div class="rating-popup-row"><span class="rating-popup-grade" style="color:var(--red)">F</span><span class="rating-popup-desc">Poor — Less than 40% of goal</span></div>'
      +'<div style="font-size:.55rem;color:var(--tf);margin-top:6px;border-top:1px solid var(--brd);padding-top:4px">Based on avg % of daily goal achieved across the period</div>'
      +'</div></span>';
  }

  /* ---- DAILY ---- */
  function renderDaily(dk){
    var studySess=D.getSess('study',dk);var workSess=D.getSess('work',dk);
    var plans=PLAN.getForDate(dk);
    var totalStudy=0,totalWork=0,longest=0,subjects={},topics=[];
    studySess.forEach(function(s){totalStudy+=s.dur;if(s.dur>longest)longest=s.dur;subjects[s.cat]=1;if(s.note)topics.push(s.note)});
    workSess.forEach(function(s){totalWork+=s.dur;if(s.dur>longest)longest=s.dur});
    var totalSess=studySess.length+workSess.length;
    var planDone=plans.filter(function(p){return p.status==='completed'}).length;
    var planPct=plans.length?Math.round(planDone/plans.length*100):0;
    var dayName=new Date(dk).toLocaleDateString([],{weekday:'long',month:'short',day:'numeric'});

    var h='<div class="summary-card"><h4>📊 '+dayName+'</h4>';
    h+=sumRow('Study Hours',UI.fd(totalStudy));
    h+=sumRow('Work Hours',UI.fd(totalWork));
    h+=sumRow('Total Hours',UI.fd(totalStudy+totalWork));
    h+=sumRow('Sessions',totalSess);
    h+=sumRow('Subjects',Object.keys(subjects).map(esc).join(', ')||'—');
    h+=sumRow('Topics',topics.length?topics.slice(0,3).map(esc).join(', ')+(topics.length>3?' +more':''):'—');
    h+=sumRow('Plan Completion',planPct+'% ('+planDone+'/'+plans.length+')');
    h+=sumRow('Longest Session',longest?UI.fd(longest):'—');
    h+=sumRow('Avg Session',totalSess?UI.fd(Math.round((totalStudy+totalWork)/totalSess)):'—');
    h+='</div>';
    document.getElementById('sumDailyCard').innerHTML=h;
  }

  /* ---- JOURNAL ---- */
  function renderJournal(dk){
    var journal=getJournal();var entry=journal[dk]||{};
    var moods=['😤','😞','😐','😊','🤩'];
    var h='<div class="summary-card"><h4>📝 Daily Journal</h4>';
    h+='<div class="df" style="margin-bottom:6px"><span class="df-lbl">Day Type</span>';
    h+='<select class="cat-sel" id="sumDayType" onchange="SUM.saveJournal()" style="flex:1">';
    ['Office','WFH','Even Sat','Odd Sat','Sunday','Leave','Holiday'].forEach(function(t){
      h+='<option'+(entry.dayType===t?' selected':'')+'>'+t+'</option>';
    });
    h+='</select></div>';
    h+='<div class="df" style="margin-bottom:6px"><span class="df-lbl">Day Rating</span><div class="mood-sel" style="margin:0">';
    for(var i=1;i<=5;i++) h+='<span class="mood-btn'+((entry.rating||0)===i?' on':'')+'" onclick="SUM.setRating('+i+')">⭐'+i+'</span>';
    h+='</div></div>';
    h+='<div class="df" style="margin-bottom:6px"><span class="df-lbl">Mood</span><div class="mood-sel" style="margin:0">';
    moods.forEach(function(m){h+='<span class="mood-btn'+(entry.mood===m?' on':'')+'" onclick="SUM.setMood(\''+m+'\')">'+m+'</span>'});
    h+='</div></div>';
    h+='<div class="sl" style="margin:6px 0 4px;text-align:left">What Went Right</div>';
    h+='<textarea class="note-inp" id="sumRight" onblur="SUM.saveJournal()" placeholder="Positive highlights...">'+(entry.wentRight||'')+'</textarea>';
    h+='<div class="sl" style="margin:4px 0 4px;text-align:left">What Went Wrong</div>';
    h+='<textarea class="note-inp" id="sumWrong" onblur="SUM.saveJournal()" placeholder="Areas to improve...">'+(entry.wentWrong||'')+'</textarea>';
    h+='<div class="sl" style="margin:4px 0 4px;text-align:left">Notes / Triggers</div>';
    h+='<textarea class="note-inp" id="sumNotes" onblur="SUM.saveJournal()" placeholder="Any notes...">'+(entry.notes||'')+'</textarea>';
    /* [7] Quick Journal Tags */
    var TAGS=['productive','distracted','tired','motivated','stressed','relaxed','focused','procrastinated','social','solo'];
    var selTags=entry.tags||[];
    h+='<div class="sl" style="margin:6px 0 4px;text-align:left">Quick Tags</div>';
    h+='<div class="jtag-wrap">';
    TAGS.forEach(function(t){
      var on=selTags.indexOf(t)!==-1;
      h+='<span class="jtag'+(on?' on':'')+'" onclick="SUM.toggleTag(\''+t+'\')">'+t+'</span>';
    });
    h+='</div>';

    /* [#38] Journal Streak — consecutive days with rating or mood */
    h+=_journalStreak(journal);

    /* [#39] Mood Trend Sparkline — 7-day mini bar chart */
    h+=_moodSparkline(journal);

    h+='</div>';
    document.getElementById('sumJournal').innerHTML=h;
  }

  /* ---- [#38] Journal Streak ---- */
  function _journalStreak(journal){
    var jStreak=0;var jd=new Date();jd.setDate(jd.getDate()-1);
    for(var i=0;i<365;i++){
      var jk=D.todayKey(jd);
      var je=journal[jk];
      if(je&&(je.rating||je.mood))jStreak++;else break;
      jd.setDate(jd.getDate()-1);
    }
    /* Check today too */
    var todayEntry=journal[D.todayKey()];
    if(todayEntry&&(todayEntry.rating||todayEntry.mood))jStreak++;
    return'<div style="margin-top:8px;padding:8px;background:var(--s3);border-radius:8px;display:flex;align-items:center;gap:8px"><span style="font-size:1.1rem">📝</span><div><div style="font-size:.65rem;font-weight:700;color:var(--heading)">Journal Streak</div><div style="font-size:.85rem;font-weight:800;color:var(--acc)">'+jStreak+' day'+(jStreak!==1?'s':'')+'</div></div></div>';
  }

  /* ---- [#39] Mood Trend Sparkline ---- */
  function _moodSparkline(journal){
    var MOOD_MAP={'\uD83D\uDE24':1,'\uD83D\uDE1E':2,'\uD83D\uDE10':3,'\uD83D\uDE0A':4,'\uD83E\uDD29':5};
    var days=[];
    for(var i=6;i>=0;i--){
      var md=new Date();md.setDate(md.getDate()-i);
      var mk=D.todayKey(md);
      var me=journal[mk]||{};
      var mVal=me.mood?MOOD_MAP[me.mood]||0:0;
      var dayLabel=['Su','Mo','Tu','We','Th','Fr','Sa'][md.getDay()];
      days.push({label:dayLabel,val:mVal,mood:me.mood||''});
    }
    var hasAny=days.some(function(d){return d.val>0});
    if(!hasAny)return'';

    var h='<div style="margin-top:8px"><div style="font-size:.6rem;font-weight:600;color:var(--td);margin-bottom:4px">Mood Trend (7 days)</div>';
    h+='<div style="display:flex;align-items:flex-end;gap:4px;height:40px">';
    days.forEach(function(d){
      var barH=d.val?Math.round(d.val/5*100):4;
      var col=d.val>=4?'var(--grn)':d.val===3?'var(--yel)':d.val>=1?'var(--red)':'var(--s3)';
      h+='<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:1px">';
      if(d.mood)h+='<span style="font-size:.55rem">'+d.mood+'</span>';
      h+='<div style="width:100%;height:'+barH+'%;background:'+col+';border-radius:3px;min-height:2px"></div>';
      h+='</div>';
    });
    h+='</div>';
    h+='<div style="display:flex;gap:4px;margin-top:2px">';
    days.forEach(function(d){
      h+='<div style="flex:1;text-align:center;font-size:.42rem;color:var(--tf)">'+d.label+'</div>';
    });
    h+='</div></div>';
    return h;
  }
  function setRating(r){var dk=document.getElementById('sumDate').value;var j=getJournal();if(!j[dk])j[dk]={};j[dk].rating=r;setJournal(j);renderJournal(dk);D.push()}
  function setMood(m){var dk=document.getElementById('sumDate').value;var j=getJournal();if(!j[dk])j[dk]={};j[dk].mood=m;setJournal(j);renderJournal(dk);D.push()}
  function saveJournal(){var dk=document.getElementById('sumDate').value;var j=getJournal();if(!j[dk])j[dk]={};j[dk].dayType=document.getElementById('sumDayType').value;j[dk].wentRight=document.getElementById('sumRight').value;j[dk].wentWrong=document.getElementById('sumWrong').value;j[dk].notes=document.getElementById('sumNotes').value;setJournal(j);D.push()}
  function toggleTag(tag){
    var dk=document.getElementById('sumDate').value;
    var j=getJournal();if(!j[dk])j[dk]={};
    if(!j[dk].tags)j[dk].tags=[];
    var idx=j[dk].tags.indexOf(tag);
    if(idx===-1)j[dk].tags.push(tag);else j[dk].tags.splice(idx,1);
    setJournal(j);renderJournal(dk);D.push();
  }

  /* ============================================================
     WEEKLY — Enhanced with 5 new features
     [1] Best & Worst Day Labels
     [2] Weekly Grade (A→F)
     [3] Week-over-Week Comparison delta cards
     [4] Stacked Study+Work bar chart
     [5] Work hours in weekly breakdown
     ============================================================ */
  function renderWeekly(dk){
    var d=new Date(dk);var dayOfWeek=d.getDay();
    var weekStart=new Date(d);weekStart.setDate(d.getDate()-dayOfWeek);
    var weekEnd=new Date(weekStart);weekEnd.setDate(weekStart.getDate()+6);

    var totalStudy=0,totalWork=0,totalSess=0,dayData=[];
    var subjectTime={};
    var cfg=D.getCfg();

    for(var i=0;i<7;i++){
      var dd=new Date(weekStart);dd.setDate(weekStart.getDate()+i);
      var wk=D.todayKey(dd);
      var ss=D.getSess('study',wk);var ws=D.getSess('work',wk);
      var ds=0,dw=0;
      ss.forEach(function(s){ds+=s.dur;if(!subjectTime[s.cat])subjectTime[s.cat]=0;subjectTime[s.cat]+=s.dur});
      ws.forEach(function(s){dw+=s.dur});
      totalStudy+=ds;totalWork+=dw;totalSess+=ss.length+ws.length;
      dayData.push({day:['Su','Mo','Tu','We','Th','Fr','Sa'][dd.getDay()],study:ds,work:dw,dk:wk});
    }

    /* [2] Weekly Grade */
    var goalPcts=[];
    dayData.forEach(function(dd){
      var goal=D.getGoalForDate(dd.dk)*3600;
      goalPcts.push(Math.min(100,Math.round((dd.study+dd.work)/goal*100)));
    });
    var avgGoalPct=Math.round(goalPcts.reduce(function(a,b){return a+b},0)/7);
    var grade=_grade(avgGoalPct);

    var wkLabel=UI.fdate(D.todayKey(weekStart))+' — '+UI.fdate(D.todayKey(weekEnd));
    var h='<div class="summary-card">';
    h+='<div style="display:flex;justify-content:space-between;align-items:center"><h4>📅 Week: '+wkLabel+'</h4>';
    h+='<div style="display:flex;align-items:center;gap:2px"><span class="week-grade" style="color:'+grade.color+'">'+grade.letter+'</span>'+_ratingInfoBtn()+'</div></div>';

    /* [5] Work hours in breakdown */
    h+=sumRow('Total Study',UI.fd(totalStudy));
    h+=sumRow('Total Work',UI.fd(totalWork));
    h+=sumRow('Total Combined',UI.fd(totalStudy+totalWork));
    h+=sumRow('Avg Study/Day',UI.fd(Math.round(totalStudy/7)));
    h+=sumRow('Avg Work/Day',UI.fd(Math.round(totalWork/7)));
    h+=sumRow('Sessions',totalSess);
    h+=sumRow('Avg Goal %',avgGoalPct+'%');

    /* [1] Best & Worst Day */
    var bestIdx=0,worstIdx=0;
    dayData.forEach(function(dd,i){
      if(dd.study+dd.work>dayData[bestIdx].study+dayData[bestIdx].work)bestIdx=i;
      if(dd.study+dd.work<dayData[worstIdx].study+dayData[worstIdx].work)worstIdx=i;
    });
    var bestD=dayData[bestIdx],worstD=dayData[worstIdx];
    h+=sumRow('🏆 Best Day',bestD.day+' — '+UI.fd(bestD.study+bestD.work));
    h+=sumRow('📉 Worst Day',worstD.day+' — '+UI.fd(worstD.study+worstD.work));

    /* [4] Stacked Study + Work bar chart */
    var maxD=1;dayData.forEach(function(dd){var t=dd.study+dd.work;if(t>maxD)maxD=t});
    h+='<div style="margin-top:10px;font-size:.65rem;color:var(--td);font-weight:600">Daily Breakdown</div>';
    h+='<div class="chart-bars">';
    dayData.forEach(function(dd,i){
      var pctS=maxD?Math.round(dd.study/maxD*100):0;
      var pctW=maxD?Math.round(dd.work/maxD*100):0;
      var pctT=Math.max(4,pctS+pctW);
      h+='<div class="chart-bar-stacked" style="height:'+pctT+'%" data-tip="'+dd.day+': S'+UI.fd(dd.study)+' W'+UI.fd(dd.work)+'">';
      if(pctW>0&&(pctS+pctW)>0)h+='<div class="bar-work" style="height:'+Math.round(pctW/(pctS+pctW)*100)+'%"></div>';
      h+='</div>';
    });
    h+='</div><div class="chart-labels">';
    dayData.forEach(function(dd,i){
      var lbl=dd.day;
      if(i===bestIdx)lbl='<b style="color:var(--grn)">'+dd.day+'🏆</b>';
      else if(i===worstIdx)lbl='<b style="color:var(--red)">'+dd.day+'</b>';
      h+='<span class="chart-label">'+lbl+'</span>';
    });
    h+='</div>';
    h+='<div style="display:flex;gap:10px;margin-top:4px;font-size:.55rem;color:var(--td)"><span><span style="display:inline-block;width:8px;height:8px;background:var(--acc);border-radius:2px"></span> Study</span><span><span style="display:inline-block;width:8px;height:8px;background:var(--cyn);border-radius:2px"></span> Work</span></div>';

    /* Subject breakdown */
    var sKeys=Object.keys(subjectTime).sort(function(a,b){return subjectTime[b]-subjectTime[a]});
    if(sKeys.length){
      h+='<div style="margin-top:8px">';
      sKeys.forEach(function(k,i){
        var pct=totalStudy?Math.round(subjectTime[k]/totalStudy*100):0;
        h+='<div class="legend-item"><div class="legend-dot" style="background:'+_COLORS[i%_COLORS.length]+'"></div>'+esc(k)+' — '+UI.fd(subjectTime[k])+' ('+pct+'%)</div>';
      });
      h+='</div>';
    }

    /* [3] Week-over-Week Comparison — FAIR: only compare same number of days */
    var prevWeekStart=new Date(weekStart);prevWeekStart.setDate(prevWeekStart.getDate()-7);
    /* Calculate how many days into the current week we are */
    var todayDate=new Date(D.todayKey());
    var daysIntoCurrWeek=Math.min(7,Math.floor((todayDate-weekStart)/(1000*60*60*24))+1);
    /* If viewing a past week, compare full 7 days */
    var compareDays=(weekEnd<todayDate)?7:daysIntoCurrWeek;
    var pStudy=0,pWork=0,pSess=0;
    for(var i=0;i<compareDays;i++){
      var pd=new Date(prevWeekStart);pd.setDate(prevWeekStart.getDate()+i);
      var pk=D.todayKey(pd);
      D.getSess('study',pk).forEach(function(s){pStudy+=s.dur});
      D.getSess('work',pk).forEach(function(s){pWork+=s.dur});
      pSess+=D.getSess('study',pk).length+D.getSess('work',pk).length;
    }
    /* Only sum current week's data for same number of days for fair comparison */
    var currStudyFair=0,currWorkFair=0,currSessFair=0;
    for(var ci=0;ci<compareDays;ci++){
      var cd=new Date(weekStart);cd.setDate(weekStart.getDate()+ci);
      var ck=D.todayKey(cd);
      D.getSess('study',ck).forEach(function(s){currStudyFair+=s.dur});
      D.getSess('work',ck).forEach(function(s){currWorkFair+=s.dur});
      currSessFair+=D.getSess('study',ck).length+D.getSess('work',ck).length;
    }
    var prevWkLabel=UI.fdate(D.todayKey(prevWeekStart));
    var prevWkEnd=new Date(prevWeekStart);prevWkEnd.setDate(prevWeekStart.getDate()+compareDays-1);
    h+='<div style="margin-top:10px;font-size:.65rem;color:var(--td);font-weight:600;margin-bottom:2px">vs Previous Week</div>';
    h+='<div style="font-size:.52rem;color:var(--tf);margin-bottom:6px">Comparing '+compareDays+' day'+(compareDays>1?'s':'')+': '+prevWkLabel+' — '+UI.fdate(D.todayKey(prevWkEnd))+'</div>';
    h+='<div class="delta-grid">';
    h+=_deltaCard('Study',currStudyFair,pStudy,UI.fd);
    h+=_deltaCard('Work',currWorkFair,pWork,UI.fd);
    h+=_deltaCard('Sessions',currSessFair,pSess);
    h+=_deltaCard('Total',currStudyFair+currWorkFair,pStudy+pWork,UI.fd);
    h+='</div>';

    h+='</div>';
    document.getElementById('sumWeekly').innerHTML=h;
  }

  /* ============================================================
     MONTHLY — Enhanced with 6 new features
     [6] Monthly Trend Chart (day-by-day bars)
     [7] Monthly Subject Donut
     [8] Monthly Grade (A→F)
     [9] Month-over-Month Comparison
     [10] Best/Worst Day of Month
     [11] Monthly Plan Accuracy
     ============================================================ */
  function renderMonthly(dk){
    var d=new Date(dk);var year=d.getFullYear(),month=d.getMonth();
    var daysInMonth=new Date(year,month+1,0).getDate();
    var cfg=D.getCfg();
    var totalStudy=0,totalWork=0,totalSess=0,daysTracked=0;
    var dayTotals=[];var subjectTime={};var goalPcts=[];
    var bestDay={dk:'',total:0,day:0},worstDay={dk:'',total:Infinity,day:0};
    var totalPlans=0,completedPlans=0;

    for(var i=1;i<=daysInMonth;i++){
      var mk=year+'-'+String(month+1).padStart(2,'0')+'-'+String(i).padStart(2,'0');
      var ss=D.getSess('study',mk);var ws=D.getSess('work',mk);
      var ds=0,dw=0;
      ss.forEach(function(s){ds+=s.dur;if(!subjectTime[s.cat])subjectTime[s.cat]=0;subjectTime[s.cat]+=s.dur});
      ws.forEach(function(s){dw+=s.dur});
      var dayTotal=ds+dw;
      if(ss.length||ws.length)daysTracked++;
      totalStudy+=ds;totalWork+=dw;totalSess+=ss.length+ws.length;
      dayTotals.push({day:i,study:ds,work:dw,total:dayTotal,dk:mk});
      var goal=D.getGoalForDate(mk)*3600;
      if(dayTotal>0)goalPcts.push(Math.min(100,Math.round(dayTotal/goal*100)));
      if(dayTotal>bestDay.total){bestDay={dk:mk,total:dayTotal,day:i}}
      if(dayTotal>0&&dayTotal<worstDay.total){worstDay={dk:mk,total:dayTotal,day:i}}
      var plans=PLAN.getForDate(mk);
      totalPlans+=plans.length;
      completedPlans+=plans.filter(function(p){return p.status==='completed'}).length;
    }
    if(worstDay.total===Infinity)worstDay={dk:'',total:0,day:0};

    var avgGoalPct=goalPcts.length?Math.round(goalPcts.reduce(function(a,b){return a+b},0)/goalPcts.length):0;
    var grade=_grade(avgGoalPct);

    var monthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
    var h='<div class="summary-card">';
    h+='<div style="display:flex;justify-content:space-between;align-items:center"><h4>📆 '+monthNames[month]+' '+year+'</h4>';
    h+='<div style="display:flex;align-items:center;gap:2px"><span class="week-grade" style="color:'+grade.color+'">'+grade.letter+'</span>'+_ratingInfoBtn()+'</div></div>';

    h+=sumRow('Days Tracked',daysTracked+'/'+daysInMonth);
    h+=sumRow('Total Study',UI.fd(totalStudy));
    h+=sumRow('Total Work',UI.fd(totalWork));
    h+=sumRow('Total Combined',UI.fd(totalStudy+totalWork));
    h+=sumRow('Avg Study/Day',daysTracked?UI.fd(Math.round(totalStudy/daysTracked)):'—');
    h+=sumRow('Avg Work/Day',daysTracked?UI.fd(Math.round(totalWork/daysTracked)):'—');
    h+=sumRow('Total Sessions',totalSess);
    h+=sumRow('Avg Session',totalSess?UI.fd(Math.round((totalStudy+totalWork)/totalSess)):'—');
    h+=sumRow('Avg Goal %',avgGoalPct+'%');

    /* [10] Best & Worst */
    if(bestDay.day)h+=sumRow('🏆 Best Day',bestDay.day+' '+monthNames[month].slice(0,3)+' — '+UI.fd(bestDay.total));
    if(worstDay.day)h+=sumRow('📉 Worst Day',worstDay.day+' '+monthNames[month].slice(0,3)+' — '+UI.fd(worstDay.total));

    /* [11] Plan Accuracy */
    var planPct=totalPlans?Math.round(completedPlans/totalPlans*100):0;
    h+=sumRow('📋 Plan Accuracy',totalPlans?planPct+'% ('+completedPlans+'/'+totalPlans+')':'No plans');

    /* [6] Monthly Trend Chart */
    var maxDayT=1;dayTotals.forEach(function(dd){if(dd.total>maxDayT)maxDayT=dd.total});
    h+='<div style="margin-top:10px;font-size:.65rem;color:var(--td);font-weight:600">Daily Trend</div>';
    h+='<div class="month-chart">';
    dayTotals.forEach(function(dd){
      var pct=maxDayT?Math.max(1,Math.round(dd.total/maxDayT*100)):1;
      var col=dd.day===bestDay.day?'var(--grn)':dd.total===0?'var(--s3)':'var(--acc)';
      h+='<div class="month-bar" style="height:'+pct+'%;background:'+col+'" title="'+dd.day+': '+UI.fd(dd.total)+'"></div>';
    });
    h+='</div>';
    h+='<div style="display:flex;justify-content:space-between;font-size:.45rem;color:var(--tf);margin-top:2px"><span>1</span><span>'+Math.ceil(daysInMonth/2)+'</span><span>'+daysInMonth+'</span></div>';

    /* [7] Monthly Subject Donut */
    var sKeys=Object.keys(subjectTime).sort(function(a,b){return subjectTime[b]-subjectTime[a]});
    if(sKeys.length){
      var segments=[];var offset=0;
      sKeys.forEach(function(k,i){
        var pct=totalStudy?subjectTime[k]/totalStudy*100:0;
        segments.push(_COLORS[i%_COLORS.length]+' '+offset.toFixed(1)+'% '+(offset+pct).toFixed(1)+'%');
        offset+=pct;
      });
      h+='<div style="margin-top:10px;font-size:.65rem;color:var(--td);font-weight:600">Subject Breakdown</div>';
      h+='<div style="display:flex;align-items:center;gap:12px;margin-top:6px">';
      h+='<div class="donut" style="background:conic-gradient('+segments.join(',')+')"></div>';
      h+='<div style="flex:1">';
      sKeys.forEach(function(k,i){
        var pct=totalStudy?Math.round(subjectTime[k]/totalStudy*100):0;
        h+='<div class="legend-item"><div class="legend-dot" style="background:'+_COLORS[i%_COLORS.length]+'"></div>'+esc(k)+' — '+UI.fd(subjectTime[k])+' ('+pct+'%)</div>';
      });
      h+='</div></div>';
    }

    /* [9] Month-over-Month Comparison — FAIR: compare same day range */
    var prevMonth=month-1,prevYear=year;
    if(prevMonth<0){prevMonth=11;prevYear--}
    /* Determine how many days to compare fairly */
    var todayD=new Date(D.todayKey());
    var isCurrentMonth=(todayD.getFullYear()===year&&todayD.getMonth()===month);
    var comparableDays=isCurrentMonth?todayD.getDate():daysInMonth;
    var prevDaysInMonth=new Date(prevYear,prevMonth+1,0).getDate();
    var fairDays=Math.min(comparableDays,prevDaysInMonth);
    var pmStudy=0,pmWork=0,pmSess=0;
    for(var i=1;i<=fairDays;i++){
      var pk=prevYear+'-'+String(prevMonth+1).padStart(2,'0')+'-'+String(i).padStart(2,'0');
      D.getSess('study',pk).forEach(function(s){pmStudy+=s.dur});
      D.getSess('work',pk).forEach(function(s){pmWork+=s.dur});
      pmSess+=D.getSess('study',pk).length+D.getSess('work',pk).length;
    }
    /* Also recalculate current month totals for fair days only */
    var currMStudy=0,currMWork=0,currMSess=0;
    for(var fi=1;fi<=fairDays;fi++){
      var fk=year+'-'+String(month+1).padStart(2,'0')+'-'+String(fi).padStart(2,'0');
      D.getSess('study',fk).forEach(function(s){currMStudy+=s.dur});
      D.getSess('work',fk).forEach(function(s){currMWork+=s.dur});
      currMSess+=D.getSess('study',fk).length+D.getSess('work',fk).length;
    }
    var prevMonthName=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][prevMonth];
    var currMonthShort=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month];
    h+='<div style="margin-top:10px;font-size:.65rem;color:var(--td);font-weight:600;margin-bottom:2px">vs '+prevMonthName+' '+prevYear+'</div>';
    h+='<div style="font-size:.52rem;color:var(--tf);margin-bottom:6px">Fair comparison: 1st — '+fairDays+(fairDays===1?'st':fairDays===2?'nd':fairDays===3?'rd':'th')+' of each month ('+currMonthShort+' vs '+prevMonthName+')</div>';
    h+='<div class="delta-grid">';
    h+=_deltaCard('Study',currMStudy,pmStudy,UI.fd);
    h+=_deltaCard('Work',currMWork,pmWork,UI.fd);
    h+=_deltaCard('Sessions',currMSess,pmSess);
    h+=_deltaCard('Total',currMStudy+currMWork,pmStudy+pmWork,UI.fd);
    h+='</div>';

    h+='</div>';
    document.getElementById('sumMonthly').innerHTML=h;
  }

  /* ============================================================
     ANALYTICS — Enhanced with 5 new features (Part 5/7)
     [12] Day-Type Performance Analysis
     [13] Rolling 7d/30d Average Trend Lines
     [14] Subject Consistency Chart
     [15] Session Length Trend
     [16] Productive Time Detection (best 2-hour window)
     ============================================================ */
  function renderAnalytics(){
    var cfg=D.getCfg(),data=D.getLocal(),today=D.todayKey();

    /* --- Streak --- */
    var streak=0;var d2=new Date();d2.setDate(d2.getDate()-1);
    for(var i=0;i<365;i++){
      var k=D.todayKey(d2);var ds=D.getSess('study',k);var dt=0;
      ds.forEach(function(s){dt+=s.dur});
      var gk=D.getGoalForDate(k);
      if(dt>=gk*3600)streak++;else break;
      d2.setDate(d2.getDate()-1);
    }

    /* [#27] Track longest streak ever */
    var longestStreak=cfg.longestStreak||0;
    if(streak>longestStreak){longestStreak=streak;cfg.longestStreak=streak;D.setCfg(cfg)}

    /* --- Hour buckets --- */
    var hourBuckets=new Array(24).fill(0);
    if(data.study){Object.values(data.study).forEach(function(sess){
      sess.forEach(function(s){var h2=new Date(s.start).getHours();hourBuckets[h2]+=s.dur});
    })}
    var peakHour=hourBuckets.indexOf(Math.max.apply(null,hourBuckets));

    /* --- Goal achievement --- */
    var goalDays=0,achievedDays=0;
    if(data.study){Object.keys(data.study).forEach(function(k){
      goalDays++;var dt2=0;data.study[k].forEach(function(s){dt2+=s.dur});
      var goal=(D.getGoalForDate(k))*3600;
      if(dt2>=goal)achievedDays++;
    })}

    /* --- Collect 90 days of data for rolling/trends --- */
    var last90=[],journal=getJournal();
    for(var i=89;i>=0;i--){
      var dd=new Date();dd.setDate(dd.getDate()-i);
      var dk=D.todayKey(dd);
      var ss=D.getSess('study',dk);var ws=D.getSess('work',dk);
      var sDur=0,wDur=0;
      ss.forEach(function(s){sDur+=s.dur});ws.forEach(function(s){wDur+=s.dur});
      var sessCount=ss.length+ws.length;
      var avgSess=sessCount?(sDur+wDur)/sessCount:0;
      var je=journal[dk]||{};
      last90.push({dk:dk,study:sDur,work:wDur,total:sDur+wDur,sessions:sessCount,avgSess:avgSess,dayType:je.dayType||'Unknown',subjects:{}});
      ss.forEach(function(s){if(!last90[last90.length-1].subjects[s.cat])last90[last90.length-1].subjects[s.cat]=0;last90[last90.length-1].subjects[s.cat]+=s.dur});
    }

    var h='<div class="summary-card"><h4>📈 Analytics Overview</h4>';
    h+=sumRow('🔥 Study Streak',streak+'d');
    h+=sumRow('🏅 Longest Streak',longestStreak+'d');

    /* [#27] Streak Calendar — 4-week × 7-day mini grid */
    h+='<div style="margin-top:8px;font-size:.65rem;color:var(--td);font-weight:600;margin-bottom:4px">Streak Calendar (4 weeks)</div>';
    h+='<div style="display:flex;gap:1px;font-size:.4rem;color:var(--tf);margin-bottom:2px">';
    ['S','M','T','W','T','F','S'].forEach(function(dl){h+='<div style="width:calc((100% - 6px)/7);text-align:center">'+dl+'</div>'});
    h+='</div>';
    var streakWeeks=[];
    for(var sw=3;sw>=0;sw--){
      var weekRow=[];
      for(var sd=0;sd<7;sd++){
        /* Align to Sunday of current week, then offset by week and day */
        var sdd=new Date();
        var todayDow=sdd.getDay();
        sdd.setDate(sdd.getDate()-todayDow-sw*7+sd);
        var sdk=D.todayKey(sdd);
        var sdSess=D.getSess('study',sdk);var sdTotal=0;
        sdSess.forEach(function(s){sdTotal+=s.dur});
        var sdGoal=D.getGoalForDate(sdk)*3600;
        var sdStatus='none';
        if(sdTotal>=sdGoal)sdStatus='met';
        else if(sdTotal>=sdGoal*0.5)sdStatus='partial';
        else if(sdTotal>0)sdStatus='miss';
        weekRow.push(sdStatus);
      }
      streakWeeks.push(weekRow);
    }
    streakWeeks.forEach(function(week){
      h+='<div style="display:flex;gap:1px;margin-bottom:1px">';
      week.forEach(function(st){
        var col=st==='met'?'var(--grn)':st==='partial'?'var(--yel)':st==='miss'?'var(--red)':'var(--s3)';
        h+='<div style="width:calc((100% - 6px)/7);aspect-ratio:1;background:'+col+';border-radius:3px"></div>';
      });
      h+='</div>';
    });
    h+='<div style="display:flex;gap:8px;margin-top:4px;font-size:.48rem;color:var(--tf)">';
    h+='<span><span style="display:inline-block;width:8px;height:8px;background:var(--grn);border-radius:2px"></span> Met</span>';
    h+='<span><span style="display:inline-block;width:8px;height:8px;background:var(--yel);border-radius:2px"></span> Partial</span>';
    h+='<span><span style="display:inline-block;width:8px;height:8px;background:var(--red);border-radius:2px"></span> Miss</span>';
    h+='<span><span style="display:inline-block;width:8px;height:8px;background:var(--s3);border-radius:2px"></span> None</span>';
    h+='</div>';

    /* [#27] Weekly streak breakdown — last 4 weeks */
    h+='<div style="margin-top:8px;font-size:.65rem;color:var(--td);font-weight:600;margin-bottom:4px">Weekly Streak Breakdown</div>';
    for(var wb=3;wb>=0;wb--){
      var wbMet=0,wbPartial=0,wbMiss=0;
      streakWeeks[3-wb].forEach(function(st){
        if(st==='met')wbMet++;else if(st==='partial')wbPartial++;else if(st==='miss')wbMiss++;
      });
      var wbLabel=wb===0?'This week':wb===1?'Last week':wb+' weeks ago';
      var wbPct=Math.round(wbMet/7*100);
      h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;font-size:.58rem">';
      h+='<span style="width:72px;color:var(--tf)">'+wbLabel+'</span>';
      h+='<div style="flex:1;height:8px;background:var(--s3);border-radius:4px;overflow:hidden"><div style="height:100%;width:'+wbPct+'%;background:var(--grn);border-radius:4px"></div></div>';
      h+='<span style="width:32px;text-align:right;font-weight:600;color:var(--heading)">'+wbMet+'/7</span>';
      h+='</div>';
    }

    h+=sumRow('⏰ Peak Study Hour',peakHour+':00 — '+(peakHour+1)+':00');
    h+=sumRow('🎯 Goal Achievement',goalDays?Math.round(achievedDays/goalDays*100)+'% ('+achievedDays+'/'+goalDays+')':'No data');

    /* [16] Productive Time Detection — best 2-hour window */
    var bestWindow=0,bestWindowStart=0;
    for(var w=0;w<23;w++){
      var windowSum=hourBuckets[w]+hourBuckets[w+1];
      if(windowSum>bestWindow){bestWindow=windowSum;bestWindowStart=w}
    }
    if(bestWindow>0)h+=sumRow('🎯 Most Productive',bestWindowStart+':00 — '+(bestWindowStart+2)+':00 ('+UI.fd(bestWindow)+')');

    /* Hour distribution chart */
    var maxH=Math.max.apply(null,hourBuckets)||1;
    h+='<div style="margin-top:8px"><div style="font-size:.65rem;color:var(--td);font-weight:600;margin-bottom:4px">Study Hours Distribution</div>';
    h+='<div class="chart-bars" style="height:50px">';
    for(var i2=5;i2<=23;i2++){
      var pct=Math.max(2,Math.round(hourBuckets[i2]/maxH*100));
      var isWindow=i2>=bestWindowStart&&i2<bestWindowStart+2;
      h+='<div class="chart-bar" style="height:'+pct+'%;background:'+(isWindow?'var(--grn)':i2===peakHour?'var(--acc)':'var(--acc2)')+'" data-tip="'+i2+':00 '+UI.fd(hourBuckets[i2])+'"></div>';
    }
    h+='</div><div class="chart-labels">';
    for(var i2=5;i2<=23;i2++) h+='<span class="chart-label">'+i2+'</span>';
    h+='</div></div>';
    h+='</div>';

    /* [12] Day-Type Performance Analysis */
    var byType={};
    last90.forEach(function(d){
      var t=d.dayType;
      if(!byType[t])byType[t]={count:0,study:0,work:0,total:0};
      if(d.total>0){byType[t].count++;byType[t].study+=d.study;byType[t].work+=d.work;byType[t].total+=d.total}
    });
    var typeKeys=Object.keys(byType).filter(function(t){return byType[t].count>0}).sort(function(a,b){return(byType[b].study/byType[b].count)-(byType[a].study/byType[a].count)});
    if(typeKeys.length>1){
      h+='<div class="summary-card"><h4>🏢 Day-Type Performance</h4>';
      h+='<div style="font-size:.55rem;color:var(--tf);margin-bottom:6px">Last 90 days · Based on journal day type</div>';
      typeKeys.forEach(function(t,i){
        var d=byType[t];var avgS=Math.round(d.study/d.count);var avgW=Math.round(d.work/d.count);var avgT=Math.round(d.total/d.count);
        var barPct=Math.max(8,Math.round(avgT/((byType[typeKeys[0]].total/byType[typeKeys[0]].count)||1)*100));
        h+='<div style="margin-bottom:6px"><div style="display:flex;justify-content:space-between;font-size:.68rem;margin-bottom:2px"><span style="font-weight:600;color:var(--heading)">'+t+'</span><span style="color:var(--td)">'+d.count+' days</span></div>';
        h+='<div style="height:14px;background:var(--s3);border-radius:4px;overflow:hidden;position:relative"><div style="height:100%;width:'+barPct+'%;background:'+_COLORS[i%_COLORS.length]+';border-radius:4px"></div></div>';
        h+='<div style="display:flex;gap:8px;font-size:.55rem;color:var(--tf);margin-top:2px"><span>Study: '+UI.fd(avgS)+'/d</span><span>Work: '+UI.fd(avgW)+'/d</span><span>Total: '+UI.fd(avgT)+'/d</span></div></div>';
      });
      h+='</div>';
    }

    /* [13] Rolling 7d/30d Average Trend */
    h+='<div class="summary-card"><h4>📊 Rolling Averages</h4>';
    var last30=last90.slice(-30);
    /* 7-day rolling for last 30 days */
    var roll7=[],roll30Avg=0;
    for(var r=6;r<last30.length;r++){
      var sum7=0;for(var j=r-6;j<=r;j++)sum7+=last30[j].study;
      roll7.push({day:last30[r].dk,avg:Math.round(sum7/7)});
    }
    /* 30-day average */
    var sum30=0;last30.forEach(function(d){sum30+=d.study});roll30Avg=Math.round(sum30/30);

    h+=sumRow('7-Day Avg Study',roll7.length?UI.fd(roll7[roll7.length-1].avg)+'/day':'—');
    h+=sumRow('30-Day Avg Study',UI.fd(roll30Avg)+'/day');

    /* Mini trend chart: 7-day rolling for last 24 points */
    if(roll7.length>2){
      var maxRoll=1;roll7.forEach(function(r){if(r.avg>maxRoll)maxRoll=r.avg});
      h+='<div style="margin-top:6px;font-size:.55rem;color:var(--tf)">7-Day Rolling Avg (last 30 days)</div>';
      h+='<div class="chart-bars" style="height:40px">';
      roll7.forEach(function(r){
        var p=Math.max(2,Math.round(r.avg/maxRoll*100));
        h+='<div class="chart-bar" style="height:'+p+'%;background:var(--cyn)" data-tip="'+UI.fd(r.avg)+'/d"></div>';
      });
      h+='</div>';
    }
    h+='</div>';

    /* [14] Subject Consistency — days studied per subject in last 30 days */
    var subjDays={};
    last30.forEach(function(d){
      Object.keys(d.subjects).forEach(function(s){
        if(!subjDays[s])subjDays[s]={days:0,total:0};
        subjDays[s].days++;subjDays[s].total+=d.subjects[s];
      });
    });
    var scKeys=Object.keys(subjDays).sort(function(a,b){return subjDays[b].days-subjDays[a].days});
    if(scKeys.length){
      h+='<div class="summary-card"><h4>📚 Subject Consistency</h4>';
      h+='<div style="font-size:.55rem;color:var(--tf);margin-bottom:6px">Days studied in last 30 days</div>';
      scKeys.forEach(function(s,i){
        var d=subjDays[s];var pct=Math.round(d.days/30*100);
        h+='<div style="margin-bottom:5px"><div style="display:flex;justify-content:space-between;font-size:.68rem;margin-bottom:2px"><span style="font-weight:600;color:var(--heading)">'+esc(s)+'</span><span style="font-family:JetBrains Mono,monospace;font-weight:700;color:'+_COLORS[i%_COLORS.length]+'">'+d.days+'/30 days ('+pct+'%)</span></div>';
        h+='<div style="height:10px;background:var(--s3);border-radius:3px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+_COLORS[i%_COLORS.length]+';border-radius:3px"></div></div>';
        h+='<div style="font-size:.5rem;color:var(--tf);margin-top:1px">Total: '+UI.fd(d.total)+' · Avg: '+UI.fd(Math.round(d.total/d.days))+'/session day</div></div>';
      });
      h+='</div>';
    }

    /* [15] Session Length Trend — avg session over last 30 days */
    var sessLenData=last30.filter(function(d){return d.sessions>0});
    if(sessLenData.length>3){
      h+='<div class="summary-card"><h4>⏱️ Session Length Trend</h4>';
      var first7=sessLenData.slice(0,Math.min(7,Math.floor(sessLenData.length/2)));
      var last7=sessLenData.slice(-Math.min(7,Math.floor(sessLenData.length/2)));
      var avgFirst=0,avgLast=0;
      first7.forEach(function(d){avgFirst+=d.avgSess});avgFirst=Math.round(avgFirst/first7.length);
      last7.forEach(function(d){avgLast+=d.avgSess});avgLast=Math.round(avgLast/last7.length);
      var trend;
      if(avgLast>avgFirst)trend='↑ Improving';else if(avgLast<avgFirst)trend='↓ Declining';else trend='→ Stable';
      var trendCol=avgLast>=avgFirst?'var(--grn)':'var(--red)';
      h+=sumRow('Early Avg',UI.fd(avgFirst)+'/session');
      h+=sumRow('Recent Avg',UI.fd(avgLast)+'/session');
      h+=sumRow('Trend','<span style="color:'+trendCol+'">'+trend+'</span>');

      var maxSL=1;sessLenData.forEach(function(d){if(d.avgSess>maxSL)maxSL=d.avgSess});
      h+='<div class="chart-bars" style="height:40px;margin-top:6px">';
      sessLenData.forEach(function(d){
        var p=Math.max(2,Math.round(d.avgSess/maxSL*100));
        h+='<div class="chart-bar" style="height:'+p+'%;background:var(--pur)" data-tip="'+UI.fd(Math.round(d.avgSess))+'"></div>';
      });
      h+='</div>';
      h+='</div>';
    }

    /* [#28] Goal Achievement Calendar — mini month grid */
    h+=_goalCalendar(cfg);

    /* [#29] Focus Score — composite 0-100 */
    h+=_focusScore(last90,cfg,goalDays,achievedDays);

    /* [#30] Plan Completion Trend — 4-week bar chart */
    h+=_planTrend();

    /* [#31] Estimation Accuracy — estimated vs actual */
    h+=_estimationAccuracy();

    /* [#32] Subject Balance Radar — planned vs actual per subject */
    h+=_subjectBalanceRadar();

    document.getElementById('sumAnalytics').innerHTML=h;
  }

  /* ---- [#28] Goal Achievement Calendar ---- */
  function _goalCalendar(cfg){
    var now=new Date();var year=now.getFullYear(),month=now.getMonth();
    var daysInMonth=new Date(year,month+1,0).getDate();
    var firstDow=new Date(year,month,1).getDay();
    var monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var h='<div class="summary-card"><h4>🗓️ Goal Calendar — '+monthNames[month]+' '+year+'</h4>';
    /* Day-of-week headers */
    h+='<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;font-size:.45rem;color:var(--tf);text-align:center;margin-bottom:2px">';
    ['S','M','T','W','T','F','S'].forEach(function(dl){h+='<div>'+dl+'</div>'});
    h+='</div>';
    h+='<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px">';
    /* Empty cells for offset */
    for(var e=0;e<firstDow;e++) h+='<div></div>';
    for(var day=1;day<=daysInMonth;day++){
      var gk=year+'-'+String(month+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');
      var gSess=D.getSess('study',gk);var gTotal=0;
      gSess.forEach(function(s){gTotal+=s.dur});
      var gGoal=D.getGoalForDate(gk)*3600;
      var gCol='var(--s3)'; /* no data = gray */
      if(gTotal>0){gCol=gTotal>=gGoal?'var(--grn)':'var(--red)'}
      var todayMark=gk===D.todayKey()?' outline:2px solid var(--acc);outline-offset:-2px;':'';
      h+='<div style="aspect-ratio:1;background:'+gCol+';border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:.42rem;color:var(--heading);font-weight:600;'+todayMark+'" title="'+gk+': '+UI.fd(gTotal)+'">'+day+'</div>';
    }
    h+='</div>';
    /* Legend */
    h+='<div style="display:flex;gap:10px;margin-top:6px;font-size:.5rem;color:var(--tf)">';
    h+='<span><span style="display:inline-block;width:8px;height:8px;background:var(--grn);border-radius:2px"></span> Goal Met</span>';
    h+='<span><span style="display:inline-block;width:8px;height:8px;background:var(--red);border-radius:2px"></span> Missed</span>';
    h+='<span><span style="display:inline-block;width:8px;height:8px;background:var(--s3);border-radius:2px"></span> No Data</span>';
    h+='</div></div>';
    return h;
  }

  /* ---- [#29] Focus Score ---- */
  function _focusScore(last90,cfg,goalDays,achievedDays){
    var last30=last90.slice(-30);
    /* Component 1: Avg session length (25%) — target 50 min = 3000s for 100 */
    var totalSessLen=0,sessCount=0;
    last30.forEach(function(d){
      if(d.sessions>0){totalSessLen+=d.avgSess*d.sessions;sessCount+=d.sessions}
    });
    var avgSessLen=sessCount?totalSessLen/sessCount:0;
    var sessScore=Math.min(100,Math.round(avgSessLen/3000*100));
    /* Component 2: Consistency (25%) — % of last 30 days with any study */
    var activeDays=last30.filter(function(d){return d.study>0}).length;
    var consistScore=Math.round(activeDays/30*100);
    /* Component 3: Goal % (25%) */
    var goalScore=goalDays?Math.round(achievedDays/goalDays*100):0;
    goalScore=Math.min(100,goalScore);
    /* Component 4: Plan completion % (25%) */
    var planTotal=0,planDone=0;
    last30.forEach(function(d){
      var plans=PLAN.getForDate(d.dk);
      planTotal+=plans.length;
      planDone+=plans.filter(function(p){return p.status==='completed'}).length;
    });
    var planScore=planTotal?Math.round(planDone/planTotal*100):0;

    var focusTotal=Math.round((sessScore+consistScore+goalScore+planScore)/4);

    /* SVG ring */
    var ringR=38,ringC=2*Math.PI*ringR;
    var ringOffset=ringC-(focusTotal/100)*ringC;
    var ringColor=focusTotal>=75?'var(--grn)':focusTotal>=50?'var(--yel)':focusTotal>=25?'var(--acc)':'var(--red)';

    var h='<div class="summary-card"><h4>🎯 Focus Score</h4>';
    h+='<div style="display:flex;align-items:center;gap:16px">';
    h+='<div class="focus-ring" style="position:relative;width:90px;height:90px">';
    h+='<svg width="90" height="90" viewBox="0 0 90 90">';
    h+='<circle cx="45" cy="45" r="'+ringR+'" fill="none" stroke="var(--s3)" stroke-width="8"/>';
    h+='<circle cx="45" cy="45" r="'+ringR+'" fill="none" stroke="'+ringColor+'" stroke-width="8" stroke-linecap="round" stroke-dasharray="'+ringC.toFixed(1)+'" stroke-dashoffset="'+ringOffset.toFixed(1)+'" transform="rotate(-90 45 45)"/>';
    h+='</svg>';
    h+='<div class="focus-ring-num" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:1.3rem;font-weight:800;color:'+ringColor+'">'+focusTotal+'</div>';
    h+='</div>';
    h+='<div style="flex:1">';
    /* 4 mini progress bars */
    var components=[
      {label:'Avg Session',score:sessScore},
      {label:'Consistency',score:consistScore},
      {label:'Goal %',score:goalScore},
      {label:'Plan Done',score:planScore}
    ];
    components.forEach(function(c){
      var cCol=c.score>=75?'var(--grn)':c.score>=50?'var(--yel)':c.score>=25?'var(--acc)':'var(--red)';
      h+='<div style="margin-bottom:4px"><div style="display:flex;justify-content:space-between;font-size:.55rem;color:var(--tf);margin-bottom:1px"><span>'+c.label+'</span><span style="font-weight:700;color:var(--heading)">'+c.score+'</span></div>';
      h+='<div class="mini-pbar" style="height:6px;background:var(--s3);border-radius:3px;overflow:hidden"><div class="mini-pbar-fg" style="height:100%;width:'+c.score+'%;background:'+cCol+';border-radius:3px"></div></div></div>';
    });
    h+='</div></div></div>';
    return h;
  }

  /* ---- [#30] Plan Completion Trend — 4-week bar chart ---- */
  function _planTrend(){
    var weeks=[];
    for(var w=3;w>=0;w--){
      var wTotal=0,wDone=0;
      for(var d=0;d<7;d++){
        var dd=new Date();dd.setDate(dd.getDate()-w*7-dd.getDay()+d);
        var dk=D.todayKey(dd);
        var plans=PLAN.getForDate(dk);
        wTotal+=plans.length;
        wDone+=plans.filter(function(p){return p.status==='completed'}).length;
      }
      var pct=wTotal?Math.round(wDone/wTotal*100):0;
      weeks.push({label:w===0?'This wk':w===1?'Last wk':w+'wk ago',pct:pct,done:wDone,total:wTotal});
    }
    var hasData=weeks.some(function(w){return w.total>0});
    if(!hasData)return'';

    var h='<div class="summary-card"><h4>📋 Plan Completion Trend</h4>';
    h+='<div style="display:flex;align-items:flex-end;gap:6px;height:60px;margin:8px 0">';
    weeks.forEach(function(w){
      var barH=Math.max(4,w.pct);
      var col=w.pct>=75?'var(--grn)':w.pct>=50?'var(--yel)':w.pct>=25?'var(--acc)':'var(--red)';
      h+='<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">';
      h+='<span style="font-size:.5rem;font-weight:700;color:var(--heading)">'+w.pct+'%</span>';
      h+='<div style="width:100%;height:'+barH+'%;background:'+col+';border-radius:4px" title="'+w.done+'/'+w.total+'"></div>';
      h+='</div>';
    });
    h+='</div>';
    h+='<div style="display:flex;gap:6px">';
    weeks.forEach(function(w){
      h+='<div style="flex:1;text-align:center;font-size:.48rem;color:var(--tf)">'+w.label+'</div>';
    });
    h+='</div></div>';
    return h;
  }

  /* ---- [#31] Estimation Accuracy ---- */
  function _estimationAccuracy(){
    /* Aggregate estimated vs actual across all plans for the last 30 days */
    var totalEst=0,totalActual=0,planCount=0;
    for(var i=29;i>=0;i--){
      var dd=new Date();dd.setDate(dd.getDate()-i);
      var dk=D.todayKey(dd);
      var plans=PLAN.getForDate(dk);
      plans.forEach(function(p){
        if(p.estHours&&p.estHours>0){
          totalEst+=p.estHours;
          /* Actual hours: convert actualSecs to hours, or estimate from sessions */
          var actual=(p.actualSecs||0)/3600;
          if(!actual&&p.status==='completed'){
            var sess=D.getSess('study',dk);
            sess.forEach(function(s){
              if(s.cat===p.subject||s.planId===p.id)actual+=s.dur/3600;
            });
          }
          if(actual>0){totalActual+=actual;planCount++}
        }
      });
    }
    if(planCount<1)return'';

    var diff=totalActual-totalEst;
    var diffPct=totalEst?Math.round(Math.abs(diff)/totalEst*100):0;
    var msg,msgCol;
    if(diff>0){msg='You underestimate by '+diffPct+'%';msgCol='var(--yel)'}
    else if(diff<0){msg='You overestimate by '+diffPct+'%';msgCol='var(--cyn)'}
    else{msg='Your estimates are spot on!';msgCol='var(--grn)'}

    var h='<div class="summary-card"><h4>🎯 Estimation Accuracy</h4>';
    h+='<div style="font-size:.55rem;color:var(--tf);margin-bottom:6px">Last 30 days · '+planCount+' plans with estimates</div>';
    h+=sumRow('Estimated Total',totalEst.toFixed(1)+'h');
    h+=sumRow('Actual Total',totalActual.toFixed(1)+'h');
    h+='<div style="margin-top:8px;padding:8px;background:var(--s3);border-radius:8px;text-align:center">';
    h+='<div style="font-size:.85rem;font-weight:700;color:'+msgCol+'">'+msg+'</div>';
    h+='</div></div>';
    return h;
  }

  /* ---- [#32] Subject Balance Radar — planned vs actual hours per subject ---- */
  function _subjectBalanceRadar(){
    var cfg=D.getCfg();
    var subjects=cfg.studySubjects||[];
    if(subjects.length<3)return''; /* Need at least 3 axes for a meaningful radar */

    /* Collect 30 days of plan estimates and actual study per subject */
    var planned={},actual={};
    subjects.forEach(function(s){planned[s]=0;actual[s]=0});

    for(var i=29;i>=0;i--){
      var dd=new Date();dd.setDate(dd.getDate()-i);
      var dk=D.todayKey(dd);
      /* Planned hours from plan items */
      var plans=PLAN.getForDate(dk);
      plans.forEach(function(p){
        if(p.subject&&planned.hasOwnProperty(p.subject)){
          planned[p.subject]+=(p.estHours||0);
        }
      });
      /* Actual hours from study sessions */
      var sess=D.getSess('study',dk);
      sess.forEach(function(s){
        if(s.cat&&actual.hasOwnProperty(s.cat)){
          actual[s.cat]+=s.dur/3600;
        }
      });
    }

    /* Filter to subjects with any data (planned or actual) */
    var activeSubjects=subjects.filter(function(s){return planned[s]>0||actual[s]>0});
    if(activeSubjects.length<3)return''; /* Need at least 3 for radar */

    /* SVG radar chart geometry */
    var cx=110,cy=110,maxR=85; /* center and max radius */
    var n=activeSubjects.length;
    var angleStep=(2*Math.PI)/n;
    var startAngle=-Math.PI/2; /* Start from top */

    /* Find max value for scaling */
    var maxVal=0;
    activeSubjects.forEach(function(s){
      if(planned[s]>maxVal)maxVal=planned[s];
      if(actual[s]>maxVal)maxVal=actual[s];
    });
    if(maxVal===0)return'';

    /* Build grid rings (3 concentric circles) */
    var svg='<svg viewBox="0 0 220 220" width="200" height="200" style="display:block;margin:0 auto">';
    /* Background rings */
    [0.33,0.66,1].forEach(function(frac){
      var r=maxR*frac;
      svg+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="var(--brd)" stroke-width="0.5" opacity="0.5"/>';
    });

    /* Axis lines and labels */
    activeSubjects.forEach(function(s,i){
      var angle=startAngle+i*angleStep;
      var x2=cx+maxR*Math.cos(angle);
      var y2=cy+maxR*Math.sin(angle);
      svg+='<line x1="'+cx+'" y1="'+cy+'" x2="'+x2+'" y2="'+y2+'" stroke="var(--brd)" stroke-width="0.5" opacity="0.5"/>';
      /* Label position — push further out */
      var lx=cx+(maxR+14)*Math.cos(angle);
      var ly=cy+(maxR+14)*Math.sin(angle);
      var anchor='middle';
      if(Math.cos(angle)>0.3)anchor='start';
      else if(Math.cos(angle)<-0.3)anchor='end';
      var shortName=s.length>8?s.slice(0,7)+'…':s;
      svg+='<text x="'+lx+'" y="'+ly+'" text-anchor="'+anchor+'" dominant-baseline="middle" fill="var(--tf)" font-size="7" font-weight="600">'+esc(shortName)+'</text>';
    });

    /* Build polygon points for planned */
    var plannedPts=[];
    activeSubjects.forEach(function(s,i){
      var angle=startAngle+i*angleStep;
      var r=maxR*(planned[s]/maxVal);
      plannedPts.push((cx+r*Math.cos(angle)).toFixed(1)+','+(cy+r*Math.sin(angle)).toFixed(1));
    });
    svg+='<polygon points="'+plannedPts.join(' ')+'" fill="rgba(139,92,246,0.15)" stroke="var(--pur)" stroke-width="1.5" stroke-linejoin="round"/>';

    /* Build polygon points for actual */
    var actualPts=[];
    activeSubjects.forEach(function(s,i){
      var angle=startAngle+i*angleStep;
      var r=maxR*(actual[s]/maxVal);
      actualPts.push((cx+r*Math.cos(angle)).toFixed(1)+','+(cy+r*Math.sin(angle)).toFixed(1));
    });
    svg+='<polygon points="'+actualPts.join(' ')+'" fill="rgba(52,211,153,0.15)" stroke="var(--grn)" stroke-width="1.5" stroke-linejoin="round"/>';

    /* Data point dots */
    activeSubjects.forEach(function(s,i){
      var angle=startAngle+i*angleStep;
      var rP=maxR*(planned[s]/maxVal);
      var rA=maxR*(actual[s]/maxVal);
      svg+='<circle cx="'+(cx+rP*Math.cos(angle)).toFixed(1)+'" cy="'+(cy+rP*Math.sin(angle)).toFixed(1)+'" r="2.5" fill="var(--pur)"/>';
      svg+='<circle cx="'+(cx+rA*Math.cos(angle)).toFixed(1)+'" cy="'+(cy+rA*Math.sin(angle)).toFixed(1)+'" r="2.5" fill="var(--grn)"/>';
    });

    svg+='</svg>';

    /* Legend */
    var legend='<div style="display:flex;justify-content:center;gap:14px;margin-top:6px;font-size:.55rem;font-weight:600">';
    legend+='<span><span style="display:inline-block;width:10px;height:3px;background:var(--pur);border-radius:2px;vertical-align:middle;margin-right:3px"></span>Planned</span>';
    legend+='<span><span style="display:inline-block;width:10px;height:3px;background:var(--grn);border-radius:2px;vertical-align:middle;margin-right:3px"></span>Actual</span>';
    legend+='</div>';

    /* Subject detail rows */
    var detail='<div style="margin-top:8px;font-size:.6rem">';
    activeSubjects.forEach(function(s){
      var pVal=planned[s].toFixed(1);
      var aVal=actual[s].toFixed(1);
      var diff=actual[s]-planned[s];
      var diffTxt=diff>0?'+'+diff.toFixed(1)+'h':diff<0?diff.toFixed(1)+'h':'on track';
      var diffCol=diff>=0?'var(--grn)':'var(--red)';
      detail+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--brd)">';
      detail+='<span style="color:var(--heading);font-weight:600">'+esc(s)+'</span>';
      detail+='<span>Plan: '+pVal+'h · Actual: '+aVal+'h · <span style="color:'+diffCol+';font-weight:700">'+diffTxt+'</span></span>';
      detail+='</div>';
    });
    detail+='</div>';

    var h='<div class="summary-card"><h4>🎯 Subject Balance</h4>';
    h+='<div style="font-size:.55rem;color:var(--tf);margin-bottom:6px">Last 30 days — Planned vs Actual study hours</div>';
    h+=svg+legend+detail;
    h+='</div>';
    return h;
  }

  /* [#53] Export Summary as PNG — canvas-based screenshot */
  function exportSummary(){
    var target=document.getElementById('p-summary');
    if(!target){window.print();return}

    /* Calculate dimensions from the summary panel */
    var cards=target.querySelectorAll('.summary-card,.sl');
    if(!cards.length){window.print();return}

    /* Create offscreen canvas */
    var canvas=document.createElement('canvas');
    var ctx=canvas.getContext('2d');
    var w=400,padding=16,y=padding;
    var lineH=16,cardPad=12;

    /* Pre-measure: collect text content from summary cards */
    var sections=[];
    target.querySelectorAll('.summary-card').forEach(function(card){
      var title=card.querySelector('h4');
      var rows=card.querySelectorAll('.sum-row');
      var sec={title:title?title.textContent:'',rows:[]};
      rows.forEach(function(r){
        var label=r.querySelector('.sum-label');
        var value=r.querySelector('.sum-value');
        sec.rows.push({
          label:label?label.textContent:'',
          value:value?value.textContent:''
        });
      });
      sections.push(sec);
    });

    if(!sections.length){window.print();return}

    /* Calculate canvas height */
    var totalH=padding;
    totalH+=lineH*1.5; /* Title */
    sections.forEach(function(sec){
      totalH+=lineH*1.8; /* Card title */
      totalH+=sec.rows.length*(lineH*1.2); /* Rows */
      totalH+=cardPad*2+8; /* Card padding + gap */
    });
    totalH+=padding;

    canvas.width=w*2; /* 2x for retina */
    canvas.height=totalH*2;
    ctx.scale(2,2);

    /* Dark background */
    ctx.fillStyle='#0a0a12';
    ctx.fillRect(0,0,w,totalH);

    /* Main title */
    ctx.fillStyle='#e2e2ea';
    ctx.font='bold 14px system-ui, sans-serif';
    ctx.fillText('Study Timer — Summary Export',padding,y+14);
    y+=lineH*1.5;

    /* Date */
    var dateEl=document.getElementById('sumDate');
    ctx.fillStyle='#8888aa';
    ctx.font='11px system-ui, sans-serif';
    ctx.fillText(dateEl?dateEl.value:D.todayKey(),padding,y+10);
    y+=lineH;

    /* Render sections */
    sections.forEach(function(sec){
      y+=6;
      /* Card background */
      var cardH=lineH*1.5+sec.rows.length*(lineH*1.2)+cardPad;
      ctx.fillStyle='#14141f';
      ctx.beginPath();
      ctx.roundRect(padding-4,y-2,w-padding*2+8,cardH,6);
      ctx.fill();

      /* Card title */
      ctx.fillStyle='#e2e2ea';
      ctx.font='bold 11px system-ui, sans-serif';
      ctx.fillText(sec.title,padding+cardPad-4,y+12);
      y+=lineH*1.5;

      /* Rows */
      sec.rows.forEach(function(r){
        ctx.fillStyle='#8888aa';
        ctx.font='10px system-ui, sans-serif';
        ctx.fillText(r.label,padding+cardPad,y+10);
        ctx.fillStyle='#e2e2ea';
        ctx.font='bold 10px system-ui, sans-serif';
        var valW=ctx.measureText(r.value).width;
        ctx.fillText(r.value,w-padding-cardPad-valW,y+10);
        y+=lineH*1.2;
      });
      y+=cardPad;
    });

    /* Watermark */
    ctx.fillStyle='#444466';
    ctx.font='9px system-ui, sans-serif';
    ctx.fillText('Generated by Study Timer',padding,y+6);

    /* Download as PNG */
    try{
      canvas.toBlob(function(blob){
        if(!blob){window.print();return}
        var url=URL.createObjectURL(blob);
        var a=document.createElement('a');
        a.href=url;
        a.download='study-summary-'+D.todayKey()+'.png';
        a.click();
        setTimeout(function(){URL.revokeObjectURL(url)},1000);
        UI.toast('Summary exported as PNG!');
      },'image/png');
    }catch(e){
      /* Fallback to print if canvas fails */
      window.print();
    }
  }

  return{init:init,today:today,render:render,setRating:setRating,setMood:setMood,saveJournal:saveJournal,toggleTag:toggleTag,exportSummary:exportSummary};
})();
