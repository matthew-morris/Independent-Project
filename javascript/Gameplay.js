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
  var tiles = new Array();

  var canvas = document.getElementById("gameplayCanvas");
  var context = canvas.getContext("2d");
  var backgroundImage = new Image();
  backgroundImage.src = "images/full-background2.png";
  var grassDirtTile = new Image();
  grassDirtTile.src = "images/Ardentryst-TilesAndObjects/Ardentryst-grassc1.png";
  var dirtTile = new Image();
  dirtTile.src = "images/Ardentryst-TilesAndObjects/Ardentryst-dirtc1.png";
  var iceTile = new Image();
  iceTile.src = "images/Ardentryst-TilesAndObjects/Ardentryst-cavejl.png";
  var stoneTile = new Image();
  stoneTile.src = "images/Ardentryst-TilesAndObjects/Ardentryst-cstl_ground1.png";

  var mouseX, mouseY;

  function initialize() {

  }

  function run() {
    tiles[0] = new Array();
    var tempTile, randomInt;
    for ( var x = 0; x < 100; x++ ) {
      tiles[0][x] = Bodies.rectangle((x * 40*1.5)-1980, backgroundImage.height - 445, grassDirtTile.width, grassDirtTile.height,
      {
        isStatic: true,
        render: {
          visible: true,
          sprite: {
            texture: grassDirtTile.src,
            xScale: 1.5,
            yScale: 1.5
          }
        }
      });
      tiles[0][x].time = 0;
    }
    for ( var x = 1; x < 50; x++ ) {
      tiles[x] = new Array();
      for ( var y = 0; y < 100; y++ ){
        randomInt = Math.floor(Math.random() * 100);
        if (randomInt < 90) {
          tempTile = dirtTile;
        }
        else if (randomInt < 99) {
          tempTile = stoneTile;
        }
        else {
          tempTile = iceTile;
        }
        tiles[x][y] = Bodies.rectangle((y * 40*1.5)-1980, backgroundImage.height - 445 + x * 44*1.5, tempTile.width, tempTile.height,
        {
          isStatic: true,
          render: {
            visible: true,
            sprite: {
              texture: tempTile.src,
              xScale: 1.5,
              yScale: 1.65
            }
          }
        });
        tiles[x][y].time = 0;
      }
    }

    engine = Engine.create();

    render = Render.create({
      element: document.body,
      canvas: canvas,
      engine: engine,
      options: {
        width: window.width,
        height: window.height,
        wireframes: false,
        hasBounds: true,
        //background: backgroundImage.src
      }
    });

    bottomWall = Bodies.rectangle(0, backgroundImage.height-465, backgroundImage.width, 10,
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

    var background = Bodies.rectangle(0, canvas.height, backgroundImage.width, backgroundImage.height, {
      isStatic: true,
      collisionFilter: {mask: 2},
      render: {
        sprite: {
          texture: backgroundImage.src,
          xScale: 1,
          yScale: 1
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

    World.add(engine.world, [background, ball]);
    createCharacter();
    for ( var x = 0; x < tiles.length; x++ ) {
      for ( var y = 0; y < tiles[x].length; y++) {
        World.add(engine.world, [tiles[x][y]]);
      }
    }

    Engine.run(engine);
    Render.run(render);

    open();
    requestAnimationFrame(gameLoop); //starts game loop

    //document.getElementById('mainMenuButton').addEventListener('click', function() {Render.stop(render); World.clear(engine.world); Engine.clear(engine); MYGAME.Game.showScreen('menu');});
  }

  function createCharacter() {
    character = new CharacterPrototype();
    character.canvas = canvas;
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
    this.flipBody = -1;
    this.mouse = {
      x: canvas.width / 3,
      y: canvas.height
    }
    this.getMousePos = function(x,y) {
      this.mouse.x = x;
      this.mouse.y = y;
    }

    this.canvasX = canvas.width/2;
    this.canvasY = canvas.height/2;
    this.transX = this.canvasX - this.x;
    this.transY = this.canvasX - this.x;

    this.look = function() {
      //set a max on mouse look
      let mX = this.mouse.x;
      if (mX > canvas.width * 0.8) {
        mX = canvas.width * 0.8;
      } else if (mX < canvas.width * 0.2) {
        mX = canvas.width * 0.2;
      }
      let mY = this.mouse.y;
      if (mY > canvas.height * 0.8) {
        mY = canvas.height * 0.8;
      } else if (mY < canvas.height * 0.2) {
        mY = canvas.height * 0.2;
      }
      //set mouse look
      this.canvasX = this.canvasX * 0.94 + (canvas.width - mX) * 0.06;
      this.canvasY = this.canvasY * 0.94 + (canvas.height - mY) * 0.06;
      //set translate values
      this.transX = this.canvasX - this.x;
      this.Sy = 0.99 * this.Sy + 0.01 * (this.y);
      //hard caps how behind y position tracking can get.
      if (this.Sy - this.y > canvas.height/2){
         this.Sy = this.y + canvas.height/2
      } else if (this.Sy - this.y < -canvas.height/2){
        this.Sy = this.y - canvas.height/2
      }
      this.transY = this.canvasY - this.Sy;

      if (this.mouse.x <0 ) {
        if (this.flipBody == -1) {
          characterBody.render.sprite.texture = "images/PNG/Player/Poses/player_idle_left.png";
          this.flipBody =1;
        }
      }
      else if (this.mouse.x > 0) {
        if (this.flipBody == 1) {
          characterBody.render.sprite.texture = "images/PNG/Player/Poses/player_idle.png";
          this.flipBody = -1;
        }
      }
    };
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
        if (player.velocity.x <= 3 && player.velocity.x >= -3) {
          if (this.flipBody == -1) {
            if (characterBody.render.sprite.texture != "images/PNG/Player/Poses/player_idle.png") {
              characterBody.render.sprite.texture = "images/PNG/Player/Poses/player_idle.png";
            }
          }
          else if (this.flipBody == 1) {
            if (characterBody.render.sprite.texture != "images/PNG/Player/Poses/player_idle_left.png") {
              characterBody.render.sprite.texture = "images/PNG/Player/Poses/player_idle_left.png";
            }
          }
        }
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
            this.walk_cycle += 0.05;
            if (this.walk_cycle == 0.2) {
              if (this.flipBody == -1) {
                if ( characterBody.render.sprite.texture != "images/PNG/Player/Poses/player_walk1.png") {
                  characterBody.render.sprite.texture = "images/PNG/Player/Poses/player_walk1.png";
                }
              }
              else if (this.flipBody == 1) {
                if ( characterBody.render.sprite.texture != "images/PNG/Player/Poses/player_walk1_left.png") {
                  characterBody.render.sprite.texture = "images/PNG/Player/Poses/player_walk1_left.png";
                }
              }
            }
            else if (this.walk_cycle >= 0.4) {
              if (this.flipBody == -1) {
                if ( characterBody.render.sprite.texture != "images/PNG/Player/Poses/player_walk2.png") {
                  characterBody.render.sprite.texture = "images/PNG/Player/Poses/player_walk2.png";
                  this.walk_cycle = 0;
                }
              }
              else if (this.flipBody == 1) {
                if ( characterBody.render.sprite.texture != "images/PNG/Player/Poses/player_walk2_left.png") {
                  characterBody.render.sprite.texture = "images/PNG/Player/Poses/player_walk2_left.png";
                  this.walk_cycle = 0;
                }
              }
            }
            player.force.x = -this.Fx / game.delta;
          }
        } else if (keys[39] || keys[68]) { //right or d
          this.walk_cycle += 0.05;
          if (this.walk_cycle == 0.2) {
            if ( characterBody.render.sprite.texture != "images/PNG/Player/Poses/player_walk1.png") {
              characterBody.render.sprite.texture = "images/PNG/Player/Poses/player_walk1.png";
            }
          }
          else if (this.walk_cycle >= 0.4) {
            if ( characterBody.render.sprite.texture != "images/PNG/Player/Poses/player_walk2.png") {
              characterBody.render.sprite.texture = "images/PNG/Player/Poses/player_walk2.png";
              this.walk_cycle = 0;
            }
          }
          if (player.velocity.x < this.VxMax) {
            player.force.x = this.Fx / game.delta;
          }
        }

      } else { // in air **********************************
        if (this.flipBody == -1) {
          if ( characterBody.render.sprite.texture != "images/PNG/Player/Poses/player_jump.png") {
            characterBody.render.sprite.texture = "images/PNG/Player/Poses/player_jump.png";
          }
        }
        else if (this.flipBody == 1) {
          if ( characterBody.render.sprite.texture != "images/PNG/Player/Poses/player_jump_left.png") {
            characterBody.render.sprite.texture = "images/PNG/Player/Poses/player_jump_left.png";
          }
        }

        //check for short jumps
        if (this.buttonCD_jump + 60 > game.cycle && //just pressed jump
          !(keys[32] || keys[38] || keys[87]) && this.Vy < 0) { // and velocity is up, but not pressing jump key
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
      Render.lookAt(render, player, {x: (render.canvas.width-character.width)/2, y: (render.canvas.height-character.height)/2});
    };
  };

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
    /*
    game.timing();
    character.keyMove();
    character.draw();
    */

    game.timing();
    character.keyMove();

    character.move();
    character.look();
    context.save();
    context.translate(character.transX, character.transY);
    character.draw();
    context.restore();

    requestAnimationFrame(gameLoop);
  }

  window.onmousemove = function(e) {
    if (character != null ) {
      character.getMousePos(e.clientX - (render.bounds.max.x - render.bounds.min.x)+ canvas.width/2, e.clientY - (render.bounds.max.y - render.bounds.min.y) + canvas.height/2);
    }
  };

  window.onmousedown = function(e) {
    mouseX = e.clientX + (render.bounds.min.x);
    mouseY = e.clientY + (render.bounds.min.y);
    if (character.mouse.x >= -100 && character.mouse.x <= 100 && character.mouse.y >= -100 && character.mouse.y <= 100) {
      for ( var x = 0; x < tiles.length; x++ ) {
        for ( var y = 0; y < tiles[x].length; y++ ) {
          if ( mouseX >= tiles[x][y].position.x-20 && mouseX <= tiles[x][y].position.x + 45) {
            if ( mouseY >= tiles[x][y].position.y-30 && mouseY <= tiles[x][y].position.y + 40) {
              Composite.remove(engine.world, tiles[x][y]);
            }
          }
        }
      }
    }
  }

  const keys = [];
  document.body.addEventListener("keyup", function(e) {
    keys[e.keyCode] = false;
  });
  document.body.addEventListener("keydown", function(e) {
    keys[e.keyCode] = true;
  });

  return {
    initialize: initialize,
    run: run
  };
}(MYGAME.Game, MYGAME.Input));
