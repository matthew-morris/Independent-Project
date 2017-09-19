
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
    //playSound("GameMusic3.mp3");
  }
  function handleLoad(event) {
    createjs.Sound.play(event.src);
  }

  /*
  function loadSound () {
    createjs.Sound.registerSound("sounds/Thunder1.ogg", "Thunder");
  }
  */
  function playSound (soundName) {
    createjs.Sound.play("sounds/" + soundName);
  }

  return {
    init: init,
    handleLoad: handleLoad
  };
}());
