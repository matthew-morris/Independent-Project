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
  var tower, towerBody;
  var towers = [];
  var player;
  var players = [];
  var enemies = [];
  var enemyBody;
  var enemiesBody = [];
  var jumpSensor;
  var tiles = new Array();

  var canvas = document.getElementById("gameplayCanvas");
  var backCanvas = document.getElementById("backdropCanvas")
  var dirtDiv = document.getElementById("dirt");
  var stoneDiv = document.getElementById("stone");
  var crystalDiv = document.getElementById("crystal");
  var context = canvas.getContext("2d");
  var backContext = backCanvas.getContext("2d");
  backContext.font = "30px Arial";
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
  var stoneInventory, dirtInventory, crystalInventory;
  var stopLoop = false;
  var originalEnemyId = [];
  var towerCreateMode = false;

  var towerImage = new Image();
  towerImage.src = "images/catapult/turret.svg";
  var createTowerButton;

  var mouseX, mouseY;

  function initialize() {

  }

  function run() {
    stopLoop = false;
    originalEnemyId.length = 0;
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
        if (randomInt < 85) {
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

    World.add(engine.world, [background]);
    createCharacter();
    createTower(-1000, 1450);
    //createZombie();
    for ( var x = 0; x < tiles.length; x++ ) {
      for ( var y = 0; y < tiles[x].length; y++) {
        World.add(engine.world, [tiles[x][y]]);
      }
    }
    //World.add(engine.world, [dirtInventory, stoneInventory, crystalInventory]);

    Events.on(engine, "collisionStart", function(event) {
      for ( let x = 0; x < event.pairs.length; x++ ) {
        for ( let a = 0; a < enemiesBody.length; a++ ) {
          if (event.pairs[x].bodyA.id == characterBody.id && event.pairs[x].bodyB.id == enemiesBody[a].id) {
            towers.length = 0;
            Render.stop(render);
            World.clear(engine.world);
            Engine.clear(engine);
            stopLoop = true;
            MYGAME.Game.showScreen("menu");
          }
          else if (event.pairs[x].bodyA.id == enemiesBody[a].id && event.pairs[x].bodyB.id == characterBody.id) {
            towers.length = 0;
            Render.stop(render);
            World.clear(engine.world);
            Engine.clear(engine);
            stopLoop = true;
            MYGAME.Game.showScreen("menu");
          }
          for ( let b = 0; b < towers.length; b++ ) {
            if (event.pairs[x].bodyA.id == towers[b].ball.id && event.pairs[x].bodyB.id == enemiesBody[a].id) {
              Body.setPosition(towers[b].ball, {x: 50000, y: 50000});
              Composite.remove(engine.world, enemiesBody[a]);
            }
            else if (event.pairs[x].bodyA.id == enemiesBody[a].id && event.pairs[x].bodyB.id == towers[b].ball.id) {
              Body.setPosition(towers[b].ball, {x: 50000, y: 50000});
              Composite.remove(engine.world, enemiesBody[a]);
            }
          }
        }
      }
    });

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

  function createZombie() {
    var enemy = new enemyPrototype();
    enemy.canvas = canvas;

    enemyBody = Bodies.rectangle(enemy.x, enemy.y, enemy.width, enemy.height, {
      inertia: Infinity, //prevents player rotation
      friction: 0.01,
      //frictionStatic: 0.5,
      restitution: 0.8,
      sleepThreshold: Infinity,
      render: {
        sprite: {
          texture: enemy.texture,
          xScale: 0.3,
          yScale: 0.3,
        }
      }
    });

    //originalEnemyId.push(enemyBody.id);

    enemiesBody.push(enemyBody);
    enemies.push(enemy);
    World.add(engine.world, [enemyBody]);
  }

  function createTower(x, y) {
    tower = new TowerPrototype(x, y);
    tower.canvas = canvas;

    towerBody = Bodies.rectangle(tower.x, tower.y, tower.width, tower.height, {
      isStatic:true,
      render: {
        sprite: {
          texture: towerImage.src,
        }
      }
    });

    towers.push(tower);
    World.add(engine.world, [towerBody]);
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

  const enemyPrototype = function() {
    this.x = 1700;
    this.y = 1300;
    this.width = 80;
    this.height = 110;
    this.texture = "images/enemy/walk/go_1.png";
    this.timer = 0;
    this.jumpTimer = 0;

    this.update = function(updatex, updatey) {
      this.timer += 0.15;
      this.jumpTimer += 1;
      this.x = updatex;
      this.y = updatey;
      this.x -= 2;
      if (this.timer >= 10) {
        this.timer = 0;
      }
    }
  }

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

    this.dirt = 0;
    this.stone = 0;
    this.crystal = 0;

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

  const TowerPrototype = function(x, y) {
    this.x = x;
    this.y = y;
    this.width = 100;
    this.height = 125;
    this.radius = 20;
    this.timer = 0;
    this.ball = Bodies.circle(this.x+this.radius*2, this.y, this.radius, {
      render: {
        sprite: {
          texture: "https://opengameart.org/sites/default/files/styles/medium/public/SoccerBall_0.png",
          xScale: 0.4,
          yScale: 0.4,
        }
      }
    });

    World.add(engine.world, [this.ball]);
    Body.setPosition(this.ball, {x: this.x+this.width, y: this.y-50});
    Body.applyForce(this.ball, {x: this.x, y:this.y}, {x: 0.11, y: -0.01});

    this.update = function() {
      this.timer += 0.01;

      if(this.timer >= 2) {
        Composite.remove(engine.world, this.ball);
        World.add(engine.world, [this.ball]);
        Body.setPosition(this.ball, {x: this.x+this.width+5, y: this.y-50});
        Body.applyForce(this.ball, {x: this.x, y:this.y}, {x: 0.11, y: -0.01});
        this.timer = 0;
      }
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

  function setInventoryPos() {
    /*
    Body.setPosition(dirtInventory, {x: -200+character.x, y: -250+character.y});
    Body.setPosition(stoneInventory, {x: 0+character.x, y: -250+character.y});
    Body.setPosition(crystalInventory, {x: 200+character.x, y: -250+character.y});
    dirtDiv.innerHTML = character.dirt;
    stoneDiv.innerHTML = character.stone;
    crystalDiv.innerHTML = character.crystal;
    */
    backContext.clearRect(0, 0, backCanvas.width, backCanvas.height);
    backContext.drawImage(dirtTile, 450, 50);
    backContext.strokeText(character.dirt, 510, 80);
    backContext.drawImage(stoneTile, 650, 50);
    backContext.strokeText(character.stone, 710, 80);
    backContext.drawImage(iceTile, 850, 50);
    backContext.strokeText(character.crystal, 910, 80);
    backContext.drawImage(towerImage, 250, 50, towerImage.width * 0.5, towerImage.height * 0.5);
  }

  function updateEnemies() {
      for ( let x = 0; x < enemiesBody.length; x++ ) {
        enemies[x].update(enemiesBody[x].position.x, enemiesBody[x].position.y);
        if (enemies[x].jumpTimer > 200) {
          Body.applyForce(enemiesBody[x], {x: 0, y: 1}, {x: 0, y: 0.5});
          enemies[x].jumpTimer = 0;
        }
        Body.setPosition(enemiesBody[x], {x: enemies[x].x, y: enemies[x].y});
        if (enemies[x].timer >= 0) {
          enemiesBody[x].render.sprite.texture = "images/enemy/walk/go_1.png";
        }
        if (enemies[x].timer >= 1) {
          enemiesBody[x].render.sprite.texture = "images/enemy/walk/go_2.png";
        }
        if (enemies[x].timer >= 2) {
          enemiesBody[x].render.sprite.texture = "images/enemy/walk/go_3.png";
        }
        if (enemies[x].timer >= 3) {
          enemiesBody[x].render.sprite.texture = "images/enemy/walk/go_4.png";
        }
        if (enemies[x].timer >= 4) {
          enemiesBody[x].render.sprite.texture = "images/enemy/walk/go_5.png";
        }
        if (enemies[x].timer >= 5) {
          enemiesBody[x].render.sprite.texture = "images/enemy/walk/go_6.png";
        }
        if (enemies[x].timer >= 6) {
          enemiesBody[x].render.sprite.texture = "images/enemy/walk/go_7.png";
        }
        if (enemies[x].timer >= 7) {
          enemiesBody[x].render.sprite.texture = "images/enemy/walk/go_8.png";
        }
        if (enemies[x].timer >= 8) {
          enemiesBody[x].render.sprite.texture = "images/enemy/walk/go_9.png";
        }
        if (enemies[x].timer >= 9) {
          enemiesBody[x].render.sprite.texture = "images/enemy/walk/go_10.png";
        }
      }
  }

  var spawnEnemyTimer = 0;
  var maxSpawnTimer = 50;
  function spawnenemies() {
    spawnEnemyTimer += 1;
    if (spawnEnemyTimer > maxSpawnTimer) {
      createZombie();
      //maxSpawnTimer -= 1;
      spawnEnemyTimer = 0;
    }
  }

  function gameLoop() {
    /*
    game.timing();
    character.keyMove();
    character.draw();
    */

    game.timing();

    setInventoryPos();
    if (towers.length != 0) {
      for ( let x = 0; x < towers.length; x++ ) {
        towers[x].update();
      }
    }
    character.keyMove();
    updateEnemies();
    spawnenemies();
    character.move();
    character.look();
    context.save();
    context.translate(character.transX, character.transY);
    character.draw();
    context.restore();

    if (stopLoop == false) {
      requestAnimationFrame(gameLoop);
    }
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
          if (tiles[x][y] != null) {
            if ( mouseX >= tiles[x][y].position.x-20 && mouseX <= tiles[x][y].position.x + 45) {
              if ( mouseY >= tiles[x][y].position.y-30 && mouseY <= tiles[x][y].position.y + 40) {
                if (tiles[x][y].render.sprite.texture == dirtTile.src || tiles[x][y].render.sprite.texture == grassDirtTile.src) {
                  character.dirt++;
                }
                else if (tiles[x][y].render.sprite.texture == stoneTile.src) {
                  character.stone++;
                }
                else if (tiles[x][y].render.sprite.texture == iceTile.src) {
                  character.crystal++;
                }
                Composite.remove(engine.world, tiles[x][y]);
                tiles[x][y] = null;
              }
            }
          }
        }
      }
    }

    if(towerCreateMode) {
      createTower(mouseX, mouseY);
      towerCreateMode = false;
    }

    var dirtCost = 5;
    var stoneCost = 1;
    if (character.mouse.x <= -345 && character.mouse.x >= -390) {
      if (character.mouse.y <= -275 && character.mouse.y >= -350) {
        if (character.dirt >= dirtCost && character.stone >= stoneCost) {
          towerCreateMode = true;
          character.dirt -= dirtCost;
          character.stone -= stoneCost;
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
