var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update, render: render });

function preload() {

  //game.load.image('bullet', 'assets/games/invaders/bullet.png');
  game.load.atlasJSONHash('bullet', './assets/bullet.png', './assets/bullet.json');
  game.load.atlasJSONHash('invader', './assets/alien.png', './assets/alien.json');
  game.load.atlasJSONHash('selected_invader', './assets/player.png', './assets/player.json');
  game.load.atlasJSONHash('ship', './assets/player.png', './assets/player.json');
  game.load.atlasJSONHash('kaboom', './assets/player.png', './assets/player.json');

  game.load.audio('game_music', ['./assets/invaders_from_space.wav']);
  //game.load.image('ship', 'assets/games/invaders/player.png');
  //game.load.spritesheet('kaboom', 'assets/games/invaders/explode.png', 128, 128);

}

var player;
var aliens;
var bullets;
var bulletTime = 0;
var cursors;
var explosions;
var score = 0;
var scoreString = '';
var scoreText;
var lives;
var firingTimer = 0;
var stateText;
var livingEnemies = [];
var player_position = -1;
var new_player_position = -1;
var playerTween;
var music;

function create() {

  game.physics.startSystem(Phaser.Physics.ARCADE);

  //  Our bullet group
  bullets = game.add.group();
  bullets.enableBody = true;
  bullets.physicsBodyType = Phaser.Physics.ARCADE;
  bullets.createMultiple(30, 'bullet');
  bullets.setAll('anchor.x', 0.5);
  bullets.setAll('anchor.y', 1);
  bullets.setAll('outOfBoundsKill', true);
  bullets.setAll('checkWorldBounds', true);

  player = game.add.sprite(400, 500, 'ship');
  player.anchor.setTo(0.5, 0.5);
  game.physics.enable(player, Phaser.Physics.ARCADE);

  //  The baddies!
  aliens = game.add.group();
  aliens.enableBody = true;
  aliens.physicsBodyType = Phaser.Physics.ARCADE;

  createAliens();

  //  The score
  scoreString = 'Score : ';
  scoreText = game.add.text(10, 10, scoreString + score, { font: '34px Arial', fill: '#fff' });

  //  Lives
  lives = game.add.group();
  game.add.text(game.world.width - 100, 10, 'Lives : ', { font: '34px Arial', fill: '#fff' });

  //  Text
  stateText = game.add.text(game.world.centerX,game.world.centerY,' ', { font: '84px Arial', fill: '#fff' });
  stateText.anchor.setTo(0.5, 0.5);
  stateText.visible = false;

  for (var i = 0; i < 3; i++) 
  {
    var ship = lives.create(game.world.width - 100 + (30 * i), 60, 'ship');
    ship.anchor.setTo(0.5, 0.5);
    ship.angle = 90;
    ship.alpha = 0.4;
  }

  //  An explosion pool
  explosions = game.add.group();
  explosions.createMultiple(30, 'kaboom');
  explosions.forEach(setupInvader, this);

  //  And some controls to play the game with
  cursors = game.input.keyboard.createCursorKeys();

  music = new Phaser.Sound(game,'game_music',0.75,true);
  music.play();

}

function createAliens () {

  for (var y = 0; y < 4; y++)
  {
    for (var x = 0; x < 10; x++)
    {
      var alien = aliens.create(x * 48, y * 50, 'invader');
      alien.data.index = (y * 10) + x;
      alien.anchor.setTo(0.5, 0.5);
      alien.animations.add('fly', [ 0, 1, 2, 3 ], 20, true);
      alien.play('fly');
      alien.body.moves = false;
    }
  }

  aliens.x = 100;
  aliens.y = 50;

  // We're playing as a random alien
  player_position = Math.floor((Math.random() * 40));

  //  All this does is basically start the invaders moving. Notice we're moving the Group they belong to, rather than the invaders directly.
  playerTween = game.add.tween(aliens).to( { x: 200 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);

  //  When the tween loops it calls descend
  playerTween.onRepeat.add(descend, this);

  movePlayer(player_position);

}

function setupInvader (invader) {

  invader.anchor.x = 0.5;
  invader.anchor.y = 0.5;
  invader.animations.add('kaboom');

}

function descend() {
  aliens.y += 10;

  //  Increase the score
  score += 5;
  scoreText.text = scoreString + score;

  if (aliens.y == 500) {
    endGame(1);
  }
}

/**
 * The once per frame update
 */
function update() {

  if (stateText.visible) {
    return;
  }

  if (cursors.left.isDown) {
    new_player_position = player_position - 1;
  }
  else if (cursors.right.isDown) {
    new_player_position = player_position + 1; 
  }
  else if (cursors.up.isDown) {
    new_player_position = player_position - 10;
  }
  else if (cursors.down.isDown) {
    new_player_position = player_position + 10;
  }

  if (new_player_position != -1) {
    if (cursors.left.isUp && cursors.right.isUp && cursors.up.isUp && cursors.down.isUp) {
      player_position = movePlayer(new_player_position, player_position);
      new_player_position = -1;
    }
  }

  //  Reset the player, then check for movement keys
  player.body.velocity.setTo(0, 0);

  // Randomly move 4% of the time.
  moveIt = Math.random();

  if (moveIt < 0.02 && player.position.x > 100) {
    player.body.velocity.x = -1400;
  }
  else if (moveIt > 0.98 && player.position.x < 700) {
    player.body.velocity.x = 1400;
  }

  // Randomly fire?
  if (Math.random() < 0.25) {
    fireBullet();
  }

  //  Run collision
  game.physics.arcade.overlap(bullets, aliens, collisionHandler, null, this);

}

function endGame(win = 0) {

  music.stop();
  playerTween.pause();

  if (win) {
    message = "You Won";
  }
  else {
    message = "You Lost";
  }

  stateText.text = message;
  stateText.visible = true;


  //the "click to restart" handler
  game.input.onTap.addOnce(restart,this);
}

/** 
 * Moves the player. Returns the position we moved to and updates the sprite.
 */
function movePlayer(new_position, old_position = -1) {

  if (new_position < 0 || new_position > 39) {
    return old_position;
  }

  if (!aliens.children[new_position]._exists) {
    return old_position;
  }

  aliens.children[new_position].loadTexture('selected_invader');

  if (old_position != -1) {
    aliens.children[old_position].loadTexture('invader');
  }

  return new_position;
}

function collisionHandler (bullet, alien) {

  console.log("collisionHandler");

  //  When a bullet hits an alien we kill them both
  bullet.kill();
  alien.kill();

  if (alien.data.index == player_position) {
    endGame(0);
  }

}

function fireBullet () {

  //  To avoid them being allowed to fire too fast we set a time limit
  if (game.time.now > bulletTime)
  {
    //  Grab the first bullet we can from the pool
    bullet = bullets.getFirstExists(false);

    if (bullet)
    {
      //  And fire it
      bullet.reset(player.x, player.y + 8);
      bullet.body.velocity.y = -400;
      bulletTime = game.time.now + 800;
    }
  }

}

function resetBullet (bullet) {

  //  Called if the bullet goes out of the screen
  bullet.kill();

}

function restart () {

  //  A new level starts

  //resets the life count
  lives.callAll('revive');
  //  And brings the aliens back from the dead :)
  aliens.removeAll();
  createAliens();

  //revives the player
  player.revive();
  //hides the text
  stateText.visible = false;

}

function render() {
}
