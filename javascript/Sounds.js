
MYGAME.Sound = (function () {
  function init() {
    if (!createjs.Sound.initializeDefaultPlugins()) {return;}
    var audioPath = "sounds/";
    var sounds = [
      {id:"Music", src:"M-GameBG.ogg"},
      {id:"Thunder", src:"Thunder1.ogg"}
    ];
    createjs.Sound.registerPlugins([ createjs.HTMLAudioPlugin]);
    createjs.Sound.alternateExtensions = ["mp3"];
    createjs.Sound.on("fileload", handleLoad);
    var mySound = createjs.Sound.play("sounds/M-GameBG.ogg");
  }
  function handleLoad(event) {
    createjs.Sound.play(event.src);
  }

/*
  function loadSound () {
    createjs.Sound.registerSound("sounds/Thunder1.ogg", "Thunder");
  }
  function playSound () {
    createjs.Sound.play("Thunder");
  }
  */

  return {
    init: init,
    handleLoad: handleLoad
  };
}());
