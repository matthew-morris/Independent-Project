MYGAME.screens['gameplay'] = (function (Game, Input) {
  'use strict';
  const Engine = Matter.Engine,
  Render = Matter.Render,
  World = Matter.World,
  Events = Matter.Events,
  Composites = Matter.Composites,
  Composite = Matter.Composite,
  Constraint = Matter.Constraint,
  Vertices = Matter.Vertices,
  Query = Matter.Query,
  Body = Matter.Body,
  Bodies = Matter.Bodies;

  var engine;
  var render;
  var bottomWall;
  var ball;
  var character;
  var characterBody;
  var player;
  var players = [];
  var jumpSensor;

  var canvas = document.getElementById("gameplayCanvas");
  var context = canvas.getContext("2d");
  var backgroundImage = new Image();
  backgroundImage.src = "images/full-background.png";

  window.onmousemove = function(e) {
    //character.getMousePos(e.clientX, e.clientY);
  };

  const keys = [];
  document.body.addEventListener("keyup", function(e) {
    keys[e.keyCode] = false;
  });
  document.body.addEventListener("keydown", function(e) {
    keys[e.keyCode] = true;
  });

  function initialize() {

  }

  function run() {
    engine = Engine.create();

    render = Render.create({
      element: document.body,
      canvas: canvas,
      engine: engine,
      options: {
        width: backgroundImage.width,
        height: backgroundImage.height,
        background: "images/full-background.png",
        wireframes: false
      }
    });

    bottomWall = Bodies.rectangle(0, canvas.height-105, canvas.width*2, 10,
      { isStatic: true,
        render: {
          visible: false
        }
      }
    );

    ball = Bodies.circle(90, 280, 20, {
      render: {
        sprite: {
          texture: "https://opengameart.org/sites/default/files/styles/medium/public/SoccerBall_0.png",
          xScale: 0.4,
          yScale: 0.4
        }
      }
    });

      //determine if player is on the ground
    Events.on(engine, "collisionStart", function(event) {
      playerOnGroundCheck(event);
      playerHeadCheck(event);
    });
    Events.on(engine, "collisionActive", function(event) {
      playerOnGroundCheck(event);
      playerHeadCheck(event);
    });
    Events.on(engine, 'collisionEnd', function(event) {
      playerOffGroundCheck(event);
    });
    Events.on(engine, "beforeUpdate", function(event) {
      character.numTouching = 0;
    });

    createCharacter();

    World.add(engine.world, [bottomWall, ball]);

    Engine.run(engine);
    Render.run(render);

    //open();
    requestAnimationFrame(gameLoop); //starts game loop

    document.getElementById('mainMenuButton').addEventListener('click', function() {Render.stop(render); World.clear(engine.world); Engine.clear(engine); Game.showScreen('menu');});
  }

  function createCharacter() {
    character = new CharacterPrototype();
    characterBody = Bodies.rectangle(character.x, character.y, character.width, character.height, {
      render: {
        sprite: {
          texture: character.texture
        }
      }
    });

    jumpSensor = Bodies.rectangle(character.x, character.y, character.width, character.height, {
      sleepThreshold: 99999999999,
      isSensor: true,
      render: {
        visible: false
      }
    });

    player = Body.create({ //combine jumpSensor and playerBody
      parts: [characterBody, jumpSensor],
      inertia: Infinity, //prevents player rotation
      friction: 0.01,
      //frictionStatic: 0.5,
      restitution: 0.3,
      sleepThreshold: Infinity,
      collisionFilter: {
        group: -2
      },
    });
    Body.setPosition(player, character.spawnPos);
    Body.setVelocity(player, character.spawnVelocity);
    Body.setMass(player, character.mass);

    players.push(player);
    World.add(engine.world, [player]);
  }

  function open() {
    const introCycles = 200;
    game.zoom = game.cycle/introCycles;
    if (game.cycle < introCycles) {
      requestAnimationFrame(open);
    } else{
      context.restore();
    }
  }

  const gamePrototype = function() {
    //time related vars and methods
    this.cycle = 0; //total cycles, 60 per second
    this.cyclePaused = 0;
    this.lastTimeStamp = 0; //tracks time stamps for measuing delta
    this.delta = 0; //measures how slow the engine is running compared to 60fps
    this.timing = function() {
      this.cycle++; //tracks game cycles
      //delta is used to adjust forces on game slow down;
      this.delta = (engine.timing.timestamp - this.lastTimeStamp) / 16.666666666666;
      this.lastTimeStamp = engine.timing.timestamp; //track last engine timestamp
    }
    this.wipe = function() {
      if (this.isPaused) {
        context.fillStyle = "rgba(255,255,255,0.1)";
        context.fillRect(0,0, canvas.width, canvas.height);
      } else {
        context.clearRect(0,0, canvas.width, canvas.height);
      }
    }
  }

  const game = new gamePrototype();

  const CharacterPrototype = function() {
    this.width = 80;
    this.height = 110;
    this.texture = "images/PNG/Player/Poses/player_idle.png";
    this.yOff = 70;
    this.yOffGoal = 70;
    this.onGround = false; //checks if on ground or in air
    this.onBody = {};
    this.numTouching = 0;
    this.crouch = false;
    this.isHeadClear = true;
    this.spawnPos = {
      x: Math.floor(Math.random() * 1000),
      y: 200
    };
    this.spawnVelocity = {
      x: 0,
      y: 0
    };
    this.yOffWhen = {
      crouch: 22,
      stand: 49,
      jump: 70
    }
    this.x = this.spawnPos.x;
    this.y = this.spawnPos.y;
    this.Sy = this.y; //adds a smoothing effect to vertical only
    this.Vx = 0;
    this.VxMax = 7;
    this.Vy = 0;
    this.mass = 5;
    this.Fx = 0.004 * this.mass; //run Force on ground
    this.FxAir = 0.0006 * this.mass; //run Force in Air
    this.Fy = -0.04 * this.mass; //jump Force
    this.angle = 0;
    this.walk_cycle = 0;
    this.stepSize = 0;
    this.buttonCD_jump = 0; //cooldown for player buttons
    this.move = function() {
      this.x = player.position.x;
      //looking at player body, to ignore the other parts of the player composite
      this.y = characterBody.position.y - this.yOff;
      this.Vx = player.velocity.x;
      this.Vy = player.velocity.y;
    }
    this.keyMove = function() {
      if (this.onGround) { //on ground **********************
        if ((keys[32] || keys[38] || keys[87]) && this.buttonCD_jump + 20 < game.cycle) { //jump
          this.buttonCD_jump = game.cycle; //can't jump until 20 cycles pass
          Matter.Body.setVelocity(player, { //zero player velocity for consistant jumps
            x: player.velocity.x,
            y: 0
          });
          player.force.y = this.Fy / game.delta; //jump force / delta so that force is the same on game slowdowns
        }
        //horizontal move on ground
        if (keys[37] || keys[65]) { //left or a
          if (player.velocity.x > -this.VxMax) {
            player.force.x = -this.Fx / game.delta;
          }
        } else if (keys[39] || keys[68]) { //right or d
          if (player.velocity.x < this.VxMax) {
            player.force.x = this.Fx / game.delta;
          }
        }

      } else { // in air **********************************
        //check for short jumps
        if (this.buttonCD_jump + 60 > game.cycle && //just pressed jump
          !(keys[32] || keys[38] || keys[87]) && //but not pressing jump key
          this.Vy < 0) { // and velocity is up
          Matter.Body.setVelocity(player, { //reduce player velocity every cycle until not true
            x: player.velocity.x,
            y: player.velocity.y * 0.94
          });
        }
        if (keys[37] || keys[65]) { // move player   left / a
          if (player.velocity.x > -this.VxMax + 2) {
            player.force.x = -this.FxAir / game.delta;
          }
        } else if (keys[39] || keys[68]) { //move player  right / d
          if (player.velocity.x < this.VxMax - 2) {
            player.force.x = this.FxAir / game.delta;
          }
        }
      }
      //smoothly move height towards height goal ************
      this.yOff = this.yOff * 0.85 + this.yOffGoal * 0.15;
    };
    this.enterAir = function() {
      this.onGround = false;
      player.frictionAir = 0.0005;
      if (this.isHeadClear){
        if (this.crouch) {
          this.undoCrouch();
        }
        this.yOffGoal = this.yOffWhen.jump;
      };
    }
    this.enterLand = function() {
      this.onGround = true;
      if (this.crouch){
        if (this.isHeadClear){
          this.undoCrouch();
          player.frictionAir = 0.12;
        } else {
          this.yOffGoal = this.yOffWhen.crouch;
          player.frictionAir = 0.5;
        }
      } else {
        this.yOffGoal = this.yOffWhen.stand;
        player.frictionAir = 0.12;
      }
    };

    this.draw = function() {
    }
  }

  function playerOnGroundCheck(event) { //runs on collisions events
    function enter() {
      character.numTouching++;
      if (!character.onGround) character.enterLand();
    }
    const pairs = event.pairs;
    for (let i = 0, j = pairs.length; i != j; ++i) {
      let pair = pairs[i];
      if (pair.bodyA === jumpSensor) {
        character.onBody = pair.bodyB.id;
        enter();
      } else if (pair.bodyB === jumpSensor) {
        enter();
        character.onBody = pair.bodyA.id;
      }
    }
  }

  function playerOffGroundCheck(event) { //runs on collisions events
    function enter() {
      if (character.onGround && character.numTouching === 0) character.enterAir();
    }
    const pairs = event.pairs;
    for (let i = 0, j = pairs.length; i != j; ++i) {
      let pair = pairs[i];
      if (pair.bodyA === jumpSensor) {
        enter();
      } else if (pair.bodyB === jumpSensor) {
        enter();
      }
    }
  }

  function playerHeadCheck(event) { //runs on collisions events
    if (character.crouch) {
      character.isHeadClear = true;
      const pairs = event.pairs;
      for (let i = 0, j = pairs.length; i != j; ++i) {
        let pair = pairs[i];
        if (pair.bodyA === headSensor) {
          character.isHeadClear = false;
        } else if (pair.bodyB === headSensor) {
          character.isHeadClear = false;
        }
      }
    }
  }

  function gameLoop() {
    game.timing();
    character.keyMove();

    requestAnimationFrame(gameLoop);
  }

  return {
    initialize: initialize,
    run: run
  };
}(MYGAME.Game, MYGAME.Input));
