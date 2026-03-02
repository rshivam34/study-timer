/* ========== KNOWLEDGE LOG MODULE (KNOW) ========== */
/* Logs casual learning — things learned outside the study/work timer flow */

var KNOW=(function(){
  var editingId=null;
  var groupBy='date'; /* 'date' or 'category' */
  var collapsedCats={}; /* tracks which categories are collapsed in accordion view */

  /* ── Data helpers ── */
  function getEntries(){return D.getLocal().knowledge||[]}
  function setEntries(arr){var d=D.getLocal();d.knowledge=arr;D.saveLocal(d)}
  function getCategories(){return D.getCfg().knowledgeCategories||['Health & Fitness','Current Affairs','Technology','Finance','Life Skills','Other']}

  /* ── Init ── */
  function init(){
    var dateEl=document.getElementById('knAddDate');
    if(dateEl&&!dateEl.value)dateEl.value=D.todayKey();
    _populateCategoryDropdowns();
    render();
  }

  function _populateCategoryDropdowns(){
    var cats=getCategories();
    var opts=cats.map(function(c){return'<option>'+esc(c)+'</option>'}).join('');
    var addCat=document.getElementById('knAddCat');
    if(addCat)addCat.innerHTML=opts;
    var filterCat=document.getElementById('knFilterCat');
    if(filterCat)filterCat.innerHTML='<option value="">All Categories</option>'+opts;
  }

  /* ── Add entry ── */
  function add(){
    var cat=(document.getElementById('knAddCat')||{}).value;
    var topic=(document.getElementById('knAddTopic')||{}).value||'';
    topic=topic.trim();
    if(!topic){UI.toast('Topic is required');return}
    var hrs=parseInt(document.getElementById('knAddHrs').value)||0;
    var mins=parseInt(document.getElementById('knAddMins').value)||0;
    var duration=hrs*60+mins;
    var source=(document.getElementById('knAddSource')||{}).value||'';
    source=source.trim();
    var notes=(document.getElementById('knAddNotes')||{}).value||'';
    notes=notes.trim();
    var date=(document.getElementById('knAddDate')||{}).value||D.todayKey();

    var entry={
      id:'kn_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
      date:date,
      category:cat,
      topic:topic,
      duration:duration,
      source:source,
      notes:notes,
      createdAt:new Date().toISOString()
    };

    var entries=getEntries();
    entries.push(entry);
    setEntries(entries);

    /* Clear form */
    document.getElementById('knAddTopic').value='';
    document.getElementById('knAddHrs').value='';
    document.getElementById('knAddMins').value='';
    document.getElementById('knAddSource').value='';
    document.getElementById('knAddNotes').value='';

    render();
    D.push().then(function(){App.syncUI('on')}).catch(function(){App.syncUI('err')});
    UI.toast('Knowledge entry added');
  }

  /* ── Remove entry ── */
  function remove(id){
    if(!confirm('Delete this entry?'))return;
    var entries=getEntries().filter(function(e){return e.id!==id});
    setEntries(entries);
    render();
    D.push();
    UI.toast('Deleted');
  }

  /* ── Edit entry ── */
  function openEdit(id){
    var entry=getEntries().find(function(e){return e.id===id});
    if(!entry)return;
    editingId=id;

    var cats=getCategories();
    var catOpts=cats.map(function(c){return'<option'+(c===entry.category?' selected':'')+'>'+esc(c)+'</option>'}).join('');
    document.getElementById('keCategory').innerHTML=catOpts;
    document.getElementById('keTopic').value=entry.topic;
    document.getElementById('keHrs').value=entry.duration>=60?Math.floor(entry.duration/60):'';
    document.getElementById('keMins').value=entry.duration%60||'';
    document.getElementById('keSource').value=entry.source||'';
    document.getElementById('keNotes').value=entry.notes||'';
    document.getElementById('keDate').value=entry.date;
    document.getElementById('knowledgeEditModal').classList.remove('hidden');
  }

  function saveEdit(){
    if(!editingId)return;
    var entries=getEntries();
    var entry=entries.find(function(e){return e.id===editingId});
    if(!entry)return;

    var topic=(document.getElementById('keTopic').value||'').trim();
    if(!topic){UI.toast('Topic is required');return}

    entry.category=document.getElementById('keCategory').value;
    entry.topic=topic;
    var hrs=parseInt(document.getElementById('keHrs').value)||0;
    var mins=parseInt(document.getElementById('keMins').value)||0;
    entry.duration=hrs*60+mins;
    entry.source=(document.getElementById('keSource').value||'').trim();
    entry.notes=(document.getElementById('keNotes').value||'').trim();
    entry.date=document.getElementById('keDate').value||entry.date;

    setEntries(entries);
    closeEdit();
    render();
    D.push();
    UI.toast('Updated');
  }

  function closeEdit(){
    editingId=null;
    document.getElementById('knowledgeEditModal').classList.add('hidden');
  }

  /* ── Group-by toggle ── */
  function setGroupBy(mode){
    groupBy=mode;
    var dateBtn=document.getElementById('knGrpDate');
    var catBtn=document.getElementById('knGrpCat');
    if(dateBtn)dateBtn.classList.toggle('on',mode==='date');
    if(catBtn)catBtn.classList.toggle('on',mode==='category');
    render();
  }

  /* ── Card helper — renders one knowledge entry card ── */
  function _renderCard(e,showDate){
    var catColor=_catColor(e.category);
    var h='<div class="knowledge-card">';
    h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">';
    h+='<span class="knowledge-cat-badge" style="background:'+catColor+'">'+esc(e.category)+'</span>';
    h+='<span style="font-size:.82rem;font-weight:700;color:var(--heading);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(e.topic)+'</span>';
    if(showDate)h+='<span style="font-family:JetBrains Mono,monospace;font-size:.55rem;color:var(--td);font-weight:600;white-space:nowrap">'+UI.fdate(e.date)+'</span>';
    h+='<div style="display:flex;gap:3px">';
    h+='<button class="b b-xs" onclick="KNOW.openEdit(\''+e.id+'\')">✏️</button>';
    h+='<button class="b b-xs b-danger" onclick="KNOW.remove(\''+e.id+'\')">✕</button>';
    h+='</div></div>';
    /* Duration + source */
    var meta=[];
    if(e.duration>0){
      var dH=Math.floor(e.duration/60),dM=e.duration%60;
      meta.push((dH?dH+'h ':'')+(dM?dM+'m':''));
    }
    if(e.source){
      var srcHtml=esc(e.source);
      if(/^https?:\/\//i.test(e.source))srcHtml='<a href="'+esc(e.source)+'" target="_blank" rel="noopener" style="color:var(--acc);text-decoration:underline">'+srcHtml+'</a>';
      meta.push('📎 '+srcHtml);
    }
    if(meta.length)h+='<div style="font-size:.62rem;color:var(--td);margin-bottom:2px">'+meta.join(' · ')+'</div>';
    if(e.notes)h+='<div style="font-size:.62rem;color:var(--tf);font-style:italic;line-height:1.4">'+esc(e.notes).substring(0,200)+(e.notes.length>200?'...':'')+'</div>';
    h+='</div>';
    return h;
  }

  /* ── Render ── */
  function render(){
    var entries=getEntries();
    var filterCat=(document.getElementById('knFilterCat')||{}).value||'';
    var searchVal=((document.getElementById('knSearch')||{}).value||'').toLowerCase().trim();

    /* From/To date range filter */
    var fromVal=(document.getElementById('knFilterFrom')||{}).value||'';
    var toVal=(document.getElementById('knFilterTo')||{}).value||'';

    /* Filter */
    var filtered=entries.filter(function(e){
      if(filterCat&&e.category!==filterCat)return false;
      if(fromVal&&e.date<fromVal)return false;
      if(toVal&&e.date>toVal)return false;
      if(searchVal&&e.topic.toLowerCase().indexOf(searchVal)===-1&&(e.source||'').toLowerCase().indexOf(searchVal)===-1&&(e.notes||'').toLowerCase().indexOf(searchVal)===-1)return false;
      return true;
    });

    /* Sort by date descending */
    filtered.sort(function(a,b){return b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt)});

    var listEl=document.getElementById('knList');
    if(!listEl)return;

    if(!filtered.length){
      listEl.innerHTML='<div class="empty"><div class="empty-ico">💡</div><p>No knowledge entries'+((fromVal||toVal)?' in this range':'')+'</p></div>';
      _renderStats(filtered);
      return;
    }

    var h='';

    if(groupBy==='category'){
      /* ── Group by Category ── */
      var catGroups={};var catOrder=[];
      filtered.forEach(function(e){
        if(!catGroups[e.category]){catGroups[e.category]=[];catOrder.push(e.category)}
        catGroups[e.category].push(e);
      });
      catOrder.sort(function(a,b){return catGroups[b].length-catGroups[a].length});

      catOrder.forEach(function(cat){
        var items=catGroups[cat];
        var totalMins=0;
        items.forEach(function(e){totalMins+=e.duration||0});
        var tH=Math.floor(totalMins/60),tM=totalMins%60;
        var timeStr=tH?tH+'h '+(tM?tM+'m':''):(tM?tM+'m':'0m');
        var catColor=_catColor(cat);
        var catId=cat.replace(/[^a-zA-Z0-9]/g,'_');
        var isOpen=!collapsedCats[catId];
        /* Accordion header — always visible */
        h+='<div class="kn-cat-header" onclick="KNOW.toggleCatGroup(\''+catId+'\')" style="border-left:3px solid '+catColor+'">';
        h+='<span class="kn-cat-arrow'+(isOpen?' open':'')+'">▶</span>';
        h+='<span class="knowledge-cat-badge" style="background:'+catColor+'">'+esc(cat)+'</span>';
        h+='<span style="color:var(--td);font-size:.6rem;font-weight:600">'+items.length+' entries · '+timeStr+'</span>';
        h+='</div>';
        /* Accordion body — compact topic rows */
        h+='<div class="kn-cat-body'+(isOpen?'':' hidden')+'" id="knCatBody_'+catId+'">';
        items.forEach(function(e){
          var dH=Math.floor((e.duration||0)/60),dM=(e.duration||0)%60;
          var durStr=(dH?dH+'h ':'')+(dM?dM+'m':'');
          h+='<div class="kn-topic-row">';
          h+='<span class="kn-topic-name">'+esc(e.topic)+'</span>';
          if(durStr)h+='<span class="kn-topic-dur">'+durStr+'</span>';
          h+='<span class="kn-topic-date">'+UI.fdate(e.date)+'</span>';
          h+='<div class="kn-topic-actions">';
          h+='<button class="b b-xs" onclick="event.stopPropagation();KNOW.openEdit(\''+e.id+'\')">✏️</button>';
          h+='<button class="b b-xs b-danger" onclick="event.stopPropagation();KNOW.remove(\''+e.id+'\')">✕</button>';
          h+='</div></div>';
          /* Source & notes sub-line */
          var extra=[];
          if(e.source)extra.push('📎 '+esc(e.source));
          if(e.notes)extra.push(esc(e.notes).substring(0,120)+(e.notes.length>120?'...':''));
          if(extra.length)h+='<div class="kn-topic-extra">'+extra.join(' · ')+'</div>';
        });
        h+='</div>';
      });
    } else {
      /* ── Default: Group by Category across all dates, show dates inside ── */
      var catGroups={};var catOrder=[];
      filtered.forEach(function(e){
        if(!catGroups[e.category]){catGroups[e.category]=[];catOrder.push(e.category)}
        catGroups[e.category].push(e);
      });
      /* Sort categories by entry count (most entries first) */
      catOrder.sort(function(a,b){return catGroups[b].length-catGroups[a].length});

      catOrder.forEach(function(cat){
        var items=catGroups[cat];
        if(items.length===1){
          /* Single entry — flat card with date shown */
          h+=_renderCard(items[0],true);
        } else {
          /* Multiple entries — collapsible group with date sub-headers inside */
          var catKey='dc_'+cat;
          var isCollapsed=collapsedCats[catKey];
          var totalDur=0;items.forEach(function(e){totalDur+=e.duration||0});
          var catColor=_catColor(cat);
          h+='<div class="kn-cat-header" onclick="KNOW.toggleDateCatGroup(\''+catKey+'\')" style="border-left:3px solid '+catColor+'">';
          h+='<span class="kn-cat-arrow'+(isCollapsed?'':' open')+'">▶</span>';
          h+='<span class="knowledge-cat-badge" style="background:'+catColor+'">'+esc(cat)+'</span>';
          h+='<span style="color:var(--td);font-size:.6rem;font-weight:600">'+items.length+' entries · '+Math.floor(totalDur/60)+'h '+((totalDur%60)||0)+'m</span>';
          h+='</div>';
          h+='<div class="kn-cat-body'+(isCollapsed?' hidden':'')+'">';
          /* Sub-group by date within this category */
          var dateGroups={};var dateOrder=[];
          items.forEach(function(e){
            if(!dateGroups[e.date]){dateGroups[e.date]=[];dateOrder.push(e.date)}
            dateGroups[e.date].push(e);
          });
          dateOrder.forEach(function(dk){
            if(dateOrder.length>1){
              h+='<div style="font-size:.58rem;font-weight:700;color:var(--acc);text-transform:uppercase;letter-spacing:.05em;padding:6px 0 2px;margin-left:4px">'+UI.fdn(dk)+'</div>';
            }
            dateGroups[dk].forEach(function(e){h+=_renderCard(e,dateOrder.length===1)});
          });
          h+='</div>';
        }
      });
    }

    listEl.innerHTML=h;
    _renderStats(filtered);
  }

  /* ── Stats ── */
  function _renderStats(entries){
    var el=document.getElementById('knStats');
    if(!el)return;
    if(!entries.length){el.innerHTML='';return}

    var totalMins=0;var catCount={};
    entries.forEach(function(e){
      totalMins+=e.duration||0;
      catCount[e.category]=(catCount[e.category]||0)+1;
    });

    var h='<div style="font-size:.62rem;font-weight:700;color:var(--heading);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Stats</div>';
    h+='<div style="display:flex;gap:12px;margin-bottom:8px;flex-wrap:wrap">';
    h+='<div style="text-align:center"><div style="font-family:JetBrains Mono,monospace;font-size:.9rem;font-weight:700;color:var(--acc)">'+entries.length+'</div><div style="font-size:.55rem;color:var(--td)">Entries</div></div>';
    var totalH=Math.floor(totalMins/60),totalM=totalMins%60;
    h+='<div style="text-align:center"><div style="font-family:JetBrains Mono,monospace;font-size:.9rem;font-weight:700;color:var(--grn)">'+(totalH?totalH+'h ':'')+(totalM?totalM+'m':'0m')+'</div><div style="font-size:.55rem;color:var(--td)">Total Time</div></div>';
    h+='<div style="text-align:center"><div style="font-family:JetBrains Mono,monospace;font-size:.9rem;font-weight:700;color:var(--cyn)">'+Object.keys(catCount).length+'</div><div style="font-size:.55rem;color:var(--td)">Categories</div></div>';
    h+='</div>';

    /* Category bar chart */
    var maxCount=Math.max.apply(null,Object.values(catCount));
    var sortedCats=Object.keys(catCount).sort(function(a,b){return catCount[b]-catCount[a]});
    sortedCats.forEach(function(cat){
      var pct=Math.round(catCount[cat]/maxCount*100);
      var color=_catColor(cat);
      h+='<div style="margin-bottom:4px">';
      h+='<div style="display:flex;justify-content:space-between;font-size:.58rem;color:var(--t2);margin-bottom:1px"><span>'+esc(cat)+'</span><span style="font-weight:700">'+catCount[cat]+'</span></div>';
      h+='<div style="height:6px;background:var(--s3);border-radius:3px;overflow:hidden"><div style="width:'+pct+'%;height:100%;background:'+color+';border-radius:3px"></div></div>';
      h+='</div>';
    });

    el.innerHTML=h;
  }

  /* ── Today's knowledge minutes (for time budget) ── */
  function getTodayMins(){
    var today=D.todayKey();
    var total=0;
    getEntries().forEach(function(e){
      if(e.date===today)total+=(e.duration||0);
    });
    return total;
  }

  /* ── Toggle date+category sub-group accordion ── */
  function toggleDateCatGroup(key){
    collapsedCats[key]=!collapsedCats[key];
    render();
  }

  /* ── Toggle category accordion group ── */
  function toggleCatGroup(catId){
    collapsedCats[catId]=!collapsedCats[catId];
    var body=document.getElementById('knCatBody_'+catId);
    if(body)body.classList.toggle('hidden');
    /* Flip arrow */
    var header=body?body.previousElementSibling:null;
    if(header){var arrow=header.querySelector('.kn-cat-arrow');if(arrow)arrow.classList.toggle('open')}
  }

  /* ── Quick filter — sets From/To dates from preset range ── */
  function quickFilter(range){
    var fromEl=document.getElementById('knFilterFrom');
    var toEl=document.getElementById('knFilterTo');
    if(!fromEl||!toEl)return;
    var today=D.todayKey();
    if(range==='all'){fromEl.value='';toEl.value=''}
    else if(range==='today'){fromEl.value=today;toEl.value=today}
    else{
      var days=parseInt(range)||7;
      var d=new Date();d.setDate(d.getDate()-days+1);
      fromEl.value=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
      toEl.value=today;
    }
    /* Highlight active quick button */
    document.querySelectorAll('.kn-quick-btn').forEach(function(b){b.classList.remove('on')});
    var btns=document.querySelectorAll('.kn-quick-btn');
    btns.forEach(function(b){if(b.textContent.trim().toLowerCase().replace(/\s/g,'')===range)b.classList.add('on')});
    render();
  }

  /* ── Category color helper ── */
  var _catColors={
    'Health & Fitness':'var(--grn)','Current Affairs':'var(--acc)',
    'Technology':'var(--cyn)','Finance':'var(--yel)',
    'Life Skills':'var(--pur)','Other':'var(--td)'
  };
  function _catColor(cat){
    if(_catColors[cat])return _catColors[cat];
    /* Hash-based fallback */
    var palette=['var(--acc)','var(--cyn)','var(--pur)','var(--grn)','var(--yel)','var(--blu)','var(--red)'];
    var hash=0;for(var i=0;i<cat.length;i++)hash+=cat.charCodeAt(i);
    return palette[hash%palette.length];
  }

  return{
    init:init,render:render,add:add,remove:remove,
    openEdit:openEdit,saveEdit:saveEdit,closeEdit:closeEdit,
    getEntries:getEntries,setEntries:setEntries,
    setGroupBy:setGroupBy,getTodayMins:getTodayMins,
    toggleCatGroup:toggleCatGroup,toggleDateCatGroup:toggleDateCatGroup,quickFilter:quickFilter
  };
})();
