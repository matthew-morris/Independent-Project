MYGAME.screens['gameplay'] = (function (Game) {
  'use strict';
  var canvas = document.getElementById("gameplayCanvas");

  // module aliases
  var Engine = Matter.Engine,
      Render = Matter.Render,
      World = Matter.World,
      Bodies = Matter.Bodies;

  // create an engine
  var engine = Engine.create();

  // create a renderer
  var render = Render.create({
      engine: engine,
      canvas: canvas,
      element: document.body,
      options: {
        width: canvas.width,
        height: canvas.height
      }
  });

  function initialize() {
    // run the engine
    Engine.run(engine);
  }

  function run() {
    // create two boxes and a ground
    var boxA = Bodies.rectangle(400, 200, 80, 80);
    var boxB = Bodies.rectangle(450, 50, 80, 80);
    var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });

    // add all of the bodies to the world
    World.add(engine.world, [boxA, boxB, ground]);

    // run the renderer
    Render.run(render);

    document.getElementById('mainMenuButton').addEventListener('click', function() {Render.stop(render); World.clear(engine.world); Engine.clear(engine); Game.showScreen('menu'); });
  }
  return {
    initialize: initialize,
    run: run
  };
}(MYGAME.Game));
