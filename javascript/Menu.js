MYGAME.screens['menu'] = (function (Game) {
  'use strict';
  /* Update items */
  var frames = 30;
  var timerId = 0;
  var time = 0.0;
  var fadeId = 0;

  /* Canvas items */
  var canvas = document.getElementById('menuCanvas');
  var context = canvas.getContext("2d");

  /* Background Animation items */
  var bgImage = new Image();
  bgImage.src = "images/full-background.png";
  var backgroundX = 0;
  var speed = 3;
  var clearBool = true;

  /* Sword Animation items */
  var swordImage = new Image();
  swordImage.src = "images/menu_short_sword.png";
  var swordX = [0,0];
  var swordY = [0,0];
  var swordWidth = swordImage.width;
  var swordHeight = swordImage.height;
  var swordVisible = false;
  var swordSize = swordWidth;
  var swordRotate = 0;

  /* Mouse items */
  var mouseX;
  var mouseY;

  /* Button items */
  var buttonX = [600,600,574];
  var buttonY = [305,430,554];
  var buttonWidth = [120,120,170];
  var buttonHeight = [60,60,60];

  function initialize() {

  }

  function update() {
    clear();
    moveBackground();
    moveSword();
    drawBackground();
    drawSword();
  }

  function run() {
    clearInterval(timerId);
    clearInterval(fadeId);

    canvas.addEventListener("mousemove", checkMousePos);
    canvas.addEventListener("mouseup", checkMouseClick);

    timerId = setInterval(update, 1000/frames);
  }

  function clear() {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function moveBackground() {
    backgroundX -= speed;
    if (backgroundX <= -1 * (bgImage.width)){
      backgroundX = 0;
    }
  }

  function moveSword() {
    if(swordSize == swordWidth){
        swordRotate = -1;
    }
    if(swordSize == 0){
        swordRotate = 1;
    }
    swordSize += swordRotate;
  }

  function drawBackground() {
    context.drawImage(bgImage, backgroundX, 0);
    context.drawImage(bgImage, backgroundX + bgImage.width, 0);
    context.fillStyle = "rgba(0,0,0,1)";
    context.font = "80px Arial";
    context.fillText("Game Name Goes Here", canvas.width/2 - 400, 100);
    context.font = "50px Arial";
    context.fillText("Play", canvas.width/2 - 30, 350);
    context.fillText("Help", canvas.width/2 - 30, 475);
    context.fillText("Credits", canvas.width/2 - 60, 600);
  }

  function drawSword() {
    if(swordVisible == true){
        context.drawImage(swordImage, swordX[0] - (swordSize/2), swordY[0], swordSize, swordHeight);
        context.drawImage(swordImage, swordX[1] - (swordSize/2), swordY[1], swordSize, swordHeight);
    }
  }

  function checkMousePos(mouseEvent) {
    if(mouseEvent.pageX || mouseEvent.pageY == 0){
        mouseX = mouseEvent.pageX - this.offsetLeft;
        mouseY = mouseEvent.pageY - this.offsetTop;
    }
    else if(mouseEvent.offsetX || mouseEvent.offsetY == 0){
        mouseX = mouseEvent.offsetX;
        mouseY = mouseEvent.offsetY;
    }

    for(var i = 0; i < buttonX.length; i++){
        if(mouseX > buttonX[i] && mouseX < buttonX[i] + buttonWidth[i]){
            if(mouseY > buttonY[i] && mouseY < buttonY[i] + buttonHeight[i]){
              swordVisible = true;
              swordX[0] = buttonX[i] - (swordWidth/2) - 2;
              swordY[0] = buttonY[i] + 2;
              swordX[1] = buttonX[i] + buttonWidth[i] + (swordWidth/2);
              swordY[1] = buttonY[i] + 2;
            }
        }else{
          swordVisible = false;
        }
    }
  }

  function checkMouseClick(mouseEvent){
    for(var i = 0; i < buttonX.length; i++){
        if(mouseX > buttonX[i] && mouseX < buttonX[i] + buttonWidth[i]){
            if(mouseY > buttonY[i] && mouseY < buttonY[i] + buttonHeight[i]){
              fadeId = setInterval(fadeOut, 1000/frames);
              clearInterval(timerId);
              canvas.removeEventListener("mousemove", checkMousePos);
              canvas.removeEventListener("mouseup", checkMouseClick);
            }
        }
    }
  }
  function fadeOut(){
      context.fillStyle = "rgba(0,0,0, 0.2)";
      context.fillRect (0, 0, canvas.width, canvas.height);
      time += 0.1;
      if(time >= 2){
          clearInterval(fadeId);
          time = 0;
          Game.showScreen('gameplay');
          socket.emit('start game', MYGAME.screens['gameplay'].createCharacter());
      }
  }

  return {
    initialize: initialize,
    run: run
  };
}(MYGAME.Game));
