/* ========== TO-DO MODULE (UNLIMITED NESTING) ========== */
/* Part 3/7 — FIX #4: completion timestamps, FIX #10: search bar */

var TODO=(function(){
  function getTodos(){return D.getLocal().todos||{study:[],work:[]}}
  function setTodos(t){var d=D.getLocal();d.todos=t;D.saveLocal(d)}

  function findItem(items,id){
    for(var i=0;i<items.length;i++){
      if(items[i].id===id)return items[i];
      if(items[i].children){var f=findItem(items[i].children,id);if(f)return f}
    }return null;
  }
  function findParentAndIndex(items,id,parent){
    for(var i=0;i<items.length;i++){
      if(items[i].id===id)return{parent:parent,index:i,arr:items};
      if(items[i].children){var f=findParentAndIndex(items[i].children,id,items[i]);if(f)return f}
    }return null;
  }

  function quickAdd(group){
    document.getElementById('todoInpTitle').value='';
    document.getElementById('todoInpType').value='todo';
    document.getElementById('todoInpGroup').value=group;
    document.getElementById('todoInpPriority').value='medium';
    document.getElementById('todoInpDue').value='';
    document.getElementById('todoInpContent').value='';
    document.getElementById('todoInpParent').value='';
    document.getElementById('todoInpEditId').value='';
    document.getElementById('todoModalTitle').textContent='Add To-Do';
    document.getElementById('todoExtraFields').classList.remove('hidden');
    document.getElementById('todoNoteArea').classList.add('hidden');
    document.getElementById('todoModal').classList.remove('hidden');
  }

  function openAddModal(){quickAdd(document.getElementById('todoTypeFilter').value)}

  function addChild(parentId,group){
    document.getElementById('todoInpTitle').value='';
    document.getElementById('todoInpType').value='todo';
    document.getElementById('todoInpGroup').value=group;
    document.getElementById('todoInpPriority').value='medium';
    document.getElementById('todoInpDue').value='';
    document.getElementById('todoInpContent').value='';
    document.getElementById('todoInpParent').value=parentId;
    document.getElementById('todoInpEditId').value='';
    document.getElementById('todoModalTitle').textContent='Add Sub-Item';
    document.getElementById('todoExtraFields').classList.remove('hidden');
    document.getElementById('todoNoteArea').classList.add('hidden');
    document.getElementById('todoModal').classList.remove('hidden');
  }

  function editItem(id,group){
    var todos=getTodos();
    var item=findItem(todos[group]||[],id);
    if(!item)return;
    document.getElementById('todoInpTitle').value=item.title;
    document.getElementById('todoInpType').value=item.type||'todo';
    document.getElementById('todoInpGroup').value=group;
    document.getElementById('todoInpPriority').value=item.priority||'medium';
    document.getElementById('todoInpDue').value=item.due||'';
    document.getElementById('todoInpContent').value=item.content||'';
    if(document.getElementById('todoInpRepeat'))document.getElementById('todoInpRepeat').value=item.repeat||'';
    document.getElementById('todoInpParent').value='';
    document.getElementById('todoInpEditId').value=id;
    document.getElementById('todoModalTitle').textContent='Edit Item';
    onTypeChange();
    document.getElementById('todoModal').classList.remove('hidden');
  }

  function onTypeChange(){
    var type=document.getElementById('todoInpType').value;
    document.getElementById('todoExtraFields').classList.toggle('hidden',type==='note');
    document.getElementById('todoNoteArea').classList.toggle('hidden',type!=='note');
  }

  function closeModal(){document.getElementById('todoModal').classList.add('hidden')}

  function saveFromModal(){
    var title=document.getElementById('todoInpTitle').value.trim();
    if(!title){UI.toast('Enter title');return}
    var type=document.getElementById('todoInpType').value;
    var group=document.getElementById('todoInpGroup').value;
    var priority=document.getElementById('todoInpPriority').value;
    var due=document.getElementById('todoInpDue').value;
    var content=document.getElementById('todoInpContent').value.trim();
    var parentId=document.getElementById('todoInpParent').value;
    var editId=document.getElementById('todoInpEditId').value;

    var todos=getTodos();
    if(!todos[group])todos[group]=[];
    var repeat=(document.getElementById('todoInpRepeat')||{}).value||'';

    if(editId){
      var item=findItem(todos[group],editId);
      if(item){
        item.title=title;item.type=type;item.priority=priority;item.due=due;item.content=content;
        item.repeat=repeat;
      }
    } else {
      var newItem={
        id:'td_'+Date.now()+'_'+Math.random().toString(36).slice(2,5),
        title:title,type:type,priority:priority,due:due,content:content,
        status:'pending',children:[],createdAt:D.todayKey(),repeat:repeat
      };
      if(parentId){
        var parent=findItem(todos[group],parentId);
        if(parent){if(!parent.children)parent.children=[];parent.children.push(newItem)}
      } else {
        todos[group].push(newItem);
      }
    }

    setTodos(todos);closeModal();render();renderInline();D.push();UI.toast('Saved ✓');
  }

  /* FIX #4: Completion timestamps + Recurring To-Do re-creation */
  function toggleDone(id,group){
    var todos=getTodos();
    var item=findItem(todos[group]||[],id);
    if(item){
      if(item.status==='done'){
        item.status='pending';
        delete item.completedAt;
      } else {
        item.status='done';
        item.completedAt=new Date().toISOString();
        /* Recurring: create next occurrence */
        if(item.repeat&&item.due){
          var nextDue=_nextRepeatDate(item.due,item.repeat);
          var clone={
            id:'td_'+Date.now()+'_'+Math.random().toString(36).slice(2,5),
            title:item.title,type:item.type,priority:item.priority,
            due:nextDue,content:item.content||'',status:'pending',
            children:[],createdAt:D.todayKey(),repeat:item.repeat
          };
          if(!todos[group])todos[group]=[];
          todos[group].push(clone);
        }
      }
    }
    setTodos(todos);render();renderInline();D.push();
  }

  function _nextRepeatDate(due,repeat){
    var d=new Date(due);
    if(repeat==='daily')d.setDate(d.getDate()+1);
    else if(repeat==='weekly')d.setDate(d.getDate()+7);
    else if(repeat==='monthly')d.setMonth(d.getMonth()+1);
    return D.todayKey(d);
  }

  function deleteItem(id,group){
    if(!confirm('Delete this item and all children?'))return;
    var todos=getTodos();
    var info=findParentAndIndex(todos[group]||[],id,null);
    if(info)info.arr.splice(info.index,1);
    setTodos(todos);render();renderInline();D.push();UI.toast('Deleted');
  }

  function sortItems(items,mode){
    var priOrder={critical:0,high:1,medium:2,low:3};
    var sorted=items.slice();
    if(mode==='priority'){
      sorted.sort(function(a,b){return(priOrder[a.priority]||2)-(priOrder[b.priority]||2)});
    } else if(mode==='date'){
      sorted.sort(function(a,b){return(a.due||'9999')>(b.due||'9999')?1:-1});
    } else {
      var today=D.todayKey();
      sorted.sort(function(a,b){
        var aOD=a.due&&a.due<today?0:a.due===today?1:2;
        var bOD=b.due&&b.due<today?0:b.due===today?1:2;
        if(aOD!==bOD)return aOD-bOD;
        return(priOrder[a.priority]||2)-(priOrder[b.priority]||2);
      });
    }
    return sorted;
  }

  /* FIX #10: Search helper — matches item or any descendant */
  function _matchesSearch(item,query){
    if(!query)return true;
    var q=query.toLowerCase();
    if(item.title.toLowerCase().indexOf(q)!==-1)return true;
    if(item.content&&item.content.toLowerCase().indexOf(q)!==-1)return true;
    if(item.children){
      for(var i=0;i<item.children.length;i++){
        if(_matchesSearch(item.children[i],q))return true;
      }
    }
    return false;
  }

  /* Overdue counter — recursive */
  function _countOverdue(items){
    var today=D.todayKey();var count=0;
    items.forEach(function(i){
      if(i.status!=='done'&&i.due&&i.due<today)count++;
      if(i.children)count+=_countOverdue(i.children);
    });
    return count;
  }
  function getOverdueCount(){
    var todos=getTodos();
    return _countOverdue(todos.study||[])+_countOverdue(todos.work||[]);
  }

  function renderItem(item,group,depth){
    var isDone=item.status==='done';
    var isNote=item.type==='note';
    var hasChildren=item.children&&item.children.length>0;
    var priCls=item.priority||'medium';

    var h='<div class="todo-item">';
    h+='<div class="todo-header">';

    if(!isNote){
      h+='<div class="todo-cb'+(isDone?' done':' p-'+priCls)+'" onclick="event.stopPropagation();TODO.toggleDone(\''+item.id+'\',\''+group+'\')">'+(isDone?'✓':'')+'</div>';
    } else {
      h+='<span style="font-size:.8rem">📝</span>';
    }

    h+='<span class="todo-title'+(isDone?' completed':'')+'">'+item.title+'</span>';
    if(!isNote)h+='<span class="todo-badge '+priCls+'">'+priCls+'</span>';
    if(item.due)h+='<span class="todo-due'+(item.status!=='done'&&item.due<D.todayKey()?' overdue':'')+'">'+UI.fdate(item.due)+'</span>';
    if(item.repeat)h+='<span style="font-size:.45rem;color:var(--cyn);font-weight:700">🔄 '+item.repeat+'</span>';

    /* FIX #4: Show completion timestamp */
    if(isDone&&item.completedAt){
      var cAt=new Date(item.completedAt);
      h+='<span style="font-size:.5rem;color:var(--grn);font-weight:600">✓ '+cAt.toLocaleDateString([],{month:'short',day:'numeric'})+'</span>';
    }

    if(hasChildren)h+='<button class="todo-expand-btn" onclick="event.stopPropagation();this.classList.toggle(\'open\');this.closest(\'.todo-item\').querySelector(\'.todo-children\').classList.toggle(\'hidden\')">▾</button>';
    h+='</div>';

    if(isNote&&item.content){
      h+='<div class="todo-note-body">'+item.content.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div>';
    }

    h+='<div class="todo-actions-bar">';
    h+='<button class="b b-xs" onclick="TODO.addChild(\''+item.id+'\',\''+group+'\')">+ Sub</button>';
    h+='<button class="b b-xs" onclick="TODO.editItem(\''+item.id+'\',\''+group+'\')">✏️</button>';
    h+='<button class="b b-xs b-danger" onclick="TODO.deleteItem(\''+item.id+'\',\''+group+'\')">✕</button>';
    h+='</div>';

    if(hasChildren){
      h+='<div class="todo-children">';
      item.children.forEach(function(child){h+=renderItem(child,group,depth+1)});
      h+='</div>';
    }

    h+='</div>';
    return h;
  }

  function render(){
    var group=document.getElementById('todoTypeFilter').value;
    var sortMode=document.getElementById('todoSortMode').value;
    var statusFilter=document.getElementById('todoStatusFilter').value;
    var todos=getTodos();
    var items=(todos[group]||[]).slice();

    /* FIX #10: Apply search filter */
    var searchEl=document.getElementById('todoSearch');
    var query=searchEl?searchEl.value.trim():'';
    if(query){
      items=items.filter(function(i){return _matchesSearch(i,query)});
    }

    if(statusFilter==='pending')items=items.filter(function(i){return i.status!=='done'});
    else if(statusFilter==='done')items=items.filter(function(i){return i.status==='done'});

    items=sortItems(items,sortMode);

    /* Overdue badge */
    var overdueCount=_countOverdue(todos[group]||[]);
    var badgeEl=document.getElementById('todoOverdueBadge');
    if(badgeEl){
      if(overdueCount>0){badgeEl.textContent=overdueCount+' overdue';badgeEl.classList.remove('hidden')}
      else badgeEl.classList.add('hidden');
    }

    var el=document.getElementById('todoFullList');
    if(!items.length){
      el.innerHTML='<div class="empty"><div class="empty-ico">✅</div><p>'+(query?'No matches for "'+query+'"':'No to-dos yet')+'</p></div>';
      return;
    }
    var h='';
    items.forEach(function(item){h+=renderItem(item,group,0)});
    el.innerHTML=h;
  }

  function renderInline(){
    ['study','work'].forEach(function(group){
      var el=document.getElementById('todoInline'+group.charAt(0).toUpperCase()+group.slice(1));
      if(!el)return;
      var todos=getTodos();
      var items=(todos[group]||[]).filter(function(i){return i.status!=='done'}).slice(0,5);
      var priOrder={critical:0,high:1,medium:2,low:3};
      items.sort(function(a,b){return(priOrder[a.priority]||2)-(priOrder[b.priority]||2)});

      if(!items.length){el.innerHTML='<div style="font-size:.72rem;color:var(--tf);padding:6px 0">No pending to-dos</div>';return}
      var h='';
      items.forEach(function(item){
        h+='<div style="display:flex;align-items:center;gap:6px;padding:5px 0;border-bottom:1px solid var(--brd);font-size:.73rem">';
        h+='<div class="todo-cb p-'+item.priority+'" onclick="TODO.toggleDone(\''+item.id+'\',\''+group+'\')" style="width:16px;height:16px;font-size:.5rem"></div>';
        h+='<span style="flex:1;font-weight:600;color:var(--heading)">'+item.title+'</span>';
        h+='<span class="todo-badge '+item.priority+'" style="font-size:.45rem">'+item.priority+'</span>';
        h+='</div>';
      });
      el.innerHTML=h;
    });
  }

  return{quickAdd:quickAdd,openAddModal:openAddModal,addChild:addChild,editItem:editItem,
    onTypeChange:onTypeChange,closeModal:closeModal,saveFromModal:saveFromModal,
    toggleDone:toggleDone,deleteItem:deleteItem,render:render,renderInline:renderInline,
    getOverdueCount:getOverdueCount};
})();
