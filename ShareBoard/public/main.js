'use strict';

(function() {

  var socket = io();
  var canvas = document.getElementsByClassName('whiteboard')[0];
  var colors = document.getElementsByClassName('color');
  var pencilWidths = document.getElementsByClassName('pencil-width');
  var eraser=document.getElementsByClassName('eraser')[0];
  var context = canvas.getContext('2d');
  
  var current = {
    color: 'black',
	pencil:'2',
	x:null,
	y:null
  };
  var drawing = false;

  canvas.addEventListener('mousedown', onMouseDown, false);
  canvas.addEventListener('mouseup', onMouseUp, false);
  canvas.addEventListener('mouseout', onMouseUp, false);
  canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);

  for (var i = 0; i < colors.length; i++){
    colors[i].addEventListener('click', onColorUpdate, false);
  }
  
  for (var i = 0; i < pencilWidths.length; i++){
    pencilWidths[i].addEventListener('click', onWidthUpdate, false);
  }

  eraser.addEventListener('click', onClear);
   
  socket.on('drawing', drawingController);

  window.addEventListener('resize', onResize, false);
  onResize();
  
  function drawingController(data){
	if(data.clear){
	    return onClearEvent(data);
	}
	if(data.resize){
		return onResizeEvent(data);
	}
    
	return onDrawingEvent(data);
  }
  
  function onMouseDown(e){
    drawing = true;
    current.x = e.clientX;
    current.y = e.clientY;
  }

  function onMouseUp(e){
    if (!drawing) { return; }
    drawing = false;
    drawLine(current.x, current.y, e.clientX, e.clientY, current.color,current.pencilWidth, true);
  }

  function onMouseMove(e){
    if (!drawing) { return; }
    drawLine(current.x, current.y, e.clientX, e.clientY, current.color,current.pencilWidth, true);
    current.x = e.clientX;
    current.y = e.clientY;
  }

  function onColorUpdate(e){
    current.color = e.target.className.split(' ')[1];
  }
  
   function onWidthUpdate(e){
    current.pencilWidth = e.target.id;
  }

  // limit the number of events per second
  function throttle(callback, delay) {
    var previousCall = new Date().getTime();
    return function() {
      var time = new Date().getTime();

      if ((time - previousCall) >= delay) {
        previousCall = time;
        callback.apply(null, arguments);
      }
    };
  }

  function onDrawingEvent(data){
    var w = canvas.width;
    var h = canvas.height;
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color,data.pencilWidth);
  }
  
   function onClearEvent(data){
    context.clearRect(0, 0, canvas.width, canvas.height);
   }
  
  function onClear(data){
	context.clearRect(0, 0, canvas.width, canvas.height);
	
	socket.emit('drawing', {'clear':true});
  }
  
  function drawLine(x0, y0, x1, y1, color, pencilWidth,emit){
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = pencilWidth;
    context.stroke();
    context.closePath();

    if (!emit) { return; }
    var w = canvas.width;
    var h = canvas.height;

    socket.emit('drawing', {
      x0: x0 / w,
      y0: y0 / h,
      x1: x1 / w,
      y1: y1 / h,
      color: color,
	  pencilWidth:pencilWidth
    });
  }
  
  // make the canvas fill its parent
  function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
	
	socket.emit('drawing', {
		 'resize':true,
		 'height': canvas.height,
		 'width':canvas.width
	});
  }
  
   // adjust broswer window size
  function onResizeEvent(data) {
    canvas.width = data.width;
    canvas.height = data.height;
  }

})();
