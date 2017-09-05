
MYGAME.Game = (function (screens, sound) {
  'use strict'

  function showScreen(name) {
    var screen = 0;
    var active = null;

    active = document.getElementsByClassName('active');
    for ( screen = 0; screen < active.length; screen++ ){
      active[screen].classList.remove('active');
    }

    screens[name].run();

    document.getElementById(name).classList.add('active');
  }

  function initialize() {
    var screen = null;

    for (screen in screens) {
			if (screens.hasOwnProperty(screen)) {
				screens[screen].initialize();
			}
		}

    showScreen('menu');


  }

  return {
    initialize: initialize,
    showScreen: showScreen
  };
}(MYGAME.screens));
