// Abu Salama Games — small, dependency-free interactions.
(function(){
  document.documentElement.classList.remove('no-js');
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveal sections as they enter the viewport.
  var items=[].slice.call(document.querySelectorAll('.reveal'));
  if('IntersectionObserver' in window&&!reduce){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12});
    items.forEach(function(el){io.observe(el)});
  }else items.forEach(function(el){el.classList.add('in')});

  // Portrait SVGs preserve the original dots without a fetch or canvas dependency.
  // Gentle parallax on the halftone portrait.
  var art=document.querySelector('.art .dots');
  if(art&&!reduce&&window.matchMedia('(pointer:fine)').matches){
    window.addEventListener('pointermove',function(e){
      var x=(e.clientX/innerWidth-.5)*10,y=(e.clientY/innerHeight-.5)*8;
      art.style.transform='translate('+x+'px,'+y+'px)';
    },{passive:true});
  }

  // Mini Fakk Zahma puzzle: 6x6, two-cell cars, the marked car exits right.
  var board=document.getElementById('board');
  if(!board)return;
  var N=6,PAD=14,moves=0,won=false;
  var movesEl=document.getElementById('moves'),winEl=document.getElementById('win');
  var LEVEL=[
    {img:'cressida',o:'h',r:2,c:0,target:true},
    {img:'datsun',o:'v',r:1,c:2},
    {img:'hilux',o:'v',r:2,c:4},
    {img:'patrol',o:'h',r:4,c:3},
    {img:'hilux',o:'h',r:0,c:3},
    {img:'patrol',o:'v',r:3,c:0}
  ];
  var cars=[];
  var exit=document.createElement('div');exit.className='exit';board.appendChild(exit);
  function cell(){return (board.clientWidth-PAD*2)/N}
  function place(car){
    var s=cell();
    car.el.style.left=(PAD+car.c*s)+'px';car.el.style.top=(PAD+car.r*s)+'px';
    car.el.style.width=(car.o==='h'?2*s:s)+'px';car.el.style.height=(car.o==='v'?2*s:s)+'px';
  }
  function layoutExit(){var s=cell();exit.style.top=(PAD+2*s+s*.12)+'px';exit.style.height=(s*.76)+'px'}
  function occupied(skip){
    var g=[];for(var i=0;i<N;i++)g.push([0,0,0,0,0,0]);
    cars.forEach(function(k){if(k===skip)return;for(var j=0;j<2;j++){g[k.r+(k.o==='v'?j:0)][k.c+(k.o==='h'?j:0)]=1}});
    return g;
  }
  function range(car){
    var g=occupied(car),min=0,max=0;
    if(car.o==='h'){while(car.c+min-1>=0&&!g[car.r][car.c+min-1])min--;while(car.c+max+2<N&&!g[car.r][car.c+max+2])max++}
    else{while(car.r+min-1>=0&&!g[car.r+min-1][car.c])min--;while(car.r+max+2<N&&!g[car.r+max+2][car.c])max++}
    return{min:min,max:max};
  }
  function update(){movesEl.textContent=moves}
  function build(){
    cars.forEach(function(k){k.el.remove()});cars=[];moves=0;won=false;winEl.classList.remove('show');update();
    LEVEL.forEach(function(d){
      var el=document.createElement('button');el.type='button';
      el.className='car '+d.o+(d.target?' target':'');
      el.setAttribute('aria-label',(d.target?board.dataset.targetLabel:board.dataset.carLabel)+' — '+(d.o==='h'?board.dataset.h:board.dataset.v));
      var im=document.createElement('img');im.src=board.dataset.assets+d.img+'.webp';im.alt='';im.draggable=false;el.appendChild(im);
      var car={el:el,o:d.o,r:d.r,c:d.c,target:!!d.target};cars.push(car);board.appendChild(el);place(car);bind(car);
    });
  }
  function commit(car,delta){
    if(!delta)return;
    if(car.o==='h')car.c+=delta;else car.r+=delta;
    moves++;update();place(car);
    if(car.target&&car.c===N-2)finish(car);
  }
  function finish(car){
    won=true;var s=cell();
    setTimeout(function(){car.el.classList.add('leaving');car.el.style.left=(PAD+N*s+s)+'px'},200);
    setTimeout(function(){document.getElementById('win-moves').textContent=moves;winEl.classList.add('show');document.getElementById('again').focus()},950);
  }
  function bind(car){
    var start=null,rg=null,s=0;
    car.el.addEventListener('pointerdown',function(e){
      if(won)return;start={x:e.clientX,y:e.clientY};rg=range(car);s=cell();
      car.el.setPointerCapture(e.pointerId);car.el.classList.add('dragging');
    });
    car.el.addEventListener('pointermove',function(e){
      if(!start)return;
      var d=car.o==='h'?e.clientX-start.x:e.clientY-start.y;
      d=Math.max(rg.min*s,Math.min(rg.max*s,d));
      if(car.o==='h')car.el.style.left=(PAD+car.c*s+d)+'px';else car.el.style.top=(PAD+car.r*s+d)+'px';
    });
    function end(e){
      if(!start)return;
      var d=car.o==='h'?e.clientX-start.x:e.clientY-start.y;start=null;car.el.classList.remove('dragging');
      var steps=Math.round(Math.max(rg.min*s,Math.min(rg.max*s,d))/s);
      if(steps)commit(car,steps);else place(car);
    }
    car.el.addEventListener('pointerup',end);car.el.addEventListener('pointercancel',end);
    car.el.addEventListener('keydown',function(e){
      if(won)return;var r=range(car),k=e.key,dd=0;
      if(car.o==='h'){if(k==='ArrowRight')dd=1;if(k==='ArrowLeft')dd=-1}else{if(k==='ArrowDown')dd=1;if(k==='ArrowUp')dd=-1}
      if(dd&&dd>=r.min&&dd<=r.max){e.preventDefault();commit(car,dd)}
    });
  }
  document.getElementById('reset').addEventListener('click',build);
  document.getElementById('again').addEventListener('click',build);
  window.addEventListener('resize',function(){cars.forEach(function(k){if(!k.el.classList.contains('leaving'))place(k)});layoutExit()});
  layoutExit();build();
})();
