var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update, render: render });

// Preload our assets.
function preload() {

  game.load.audio('game_music', ['./assets/invaders_from_space.ogg']);
  game.load.audio('explosion', ['./assets/explosion.wav']);
  game.load.audio('game_win', ['./assets/win.ogg']);
  game.load.audio('game_lose', ['./assets/lose.ogg']);
  game.load.atlasJSONHash('bullet', './assets/bullet.png', './assets/bullet.json');
  game.load.atlasJSONHash('invader', './assets/alien.png', './assets/alien.json');
  game.load.atlasJSONHash('selected_invader', './assets/player.png', './assets/player.json');
  game.load.atlasJSONHash('shooter', './assets/shooter.png', './assets/shooter.json');

}

// All these globals!
var shooter;
var aliens;
var bullets;
var bulletTime = 0;
var cursors;
var score = 0;
var scoreString = '';
var scoreText;
var firingTimer = 0;
var stateText;
var livingEnemies = [];
var player_position = -1;
var new_player_position = -1;
var playerTween;
var music;
var explosion;
var win_sound;
var lose_sound;
var final_living_alien;

/**
 * Sets up the game
 */
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

  shooter = game.add.sprite(400, 500, 'shooter');
  shooter.anchor.setTo(0.5, 0.5);
  game.physics.enable(shooter, Phaser.Physics.ARCADE);

  //  The baddies!
  aliens = game.add.group();
  aliens.enableBody = true;
  aliens.physicsBodyType = Phaser.Physics.ARCADE;

  createAliens();

  // Display the score
  scoreString = 'Score : ';
  scoreText = game.add.text(10, 10, scoreString + score, { font: '34px Faster One', fill: '#ffffee' });

  //  Text
  stateText = game.add.text(game.world.centerX,game.world.centerY,' ', { font: '44px Faster One', fill: '#f00' });
  stateText.anchor.setTo(0.5, 0.5);
  stateText.visible = false;

  // This is what we control the player with
  cursors = game.input.keyboard.createCursorKeys();

  // Create the sounds, start playing the music
  explosion = new Phaser.Sound(game,'explosion',0.5,false);
  music = new Phaser.Sound(game,'game_music',0.75,true);
  win_sound = new Phaser.Sound(game,'game_win',0.75,false);
  lose_sound = new Phaser.Sound(game,'game_lose',0.75,false);
  music.play();

}

/**
 * Creates the aliens, your buddies!
 */
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

  // This is so we can keep tabs on the alien nearest the ground so that we
  // can find out when we've landed.
  final_living_alien = 39;

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

  /**
function setupInvader (invader) {
  invader.anchor.x = 0.5;
  invader.anchor.y = 0.5;
  invader.animations.add('kaboom');
}
*/

/**
 * Moves the aliens down one row, closer to the planet beneath them.
 */
function descend() {
  aliens.y += 10;

  //  Increase the score
  score += 5;
  scoreText.text = scoreString + score;

  // This is our win condition!
  if (aliens.y + aliens.children[final_living_alien].position.y > 500) {
    endGame(1);
  }
}

/**
 * The once per frame update.
 */
function update() {

  // If we've got a messsage onscreen then don't do anything.
  if (stateText.visible) {
    return;
  }

  // Move the player according to the key pressed.
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

  //  Reset the shooter, then check for movement keys
  shooter.body.velocity.setTo(0, 0);

  // Randomly move the shooter 4% of the time.
  moveIt = Math.random();

  if (moveIt < 0.02 && shooter.position.x > 100) {
    shooter.body.velocity.x = -1400;
  }
  else if (moveIt > 0.98 && shooter.position.x < 700) {
    shooter.body.velocity.x = 1400;
  }

  // Randomly fire
  if (Math.random() < 0.25) {
    fireBullet();
  }

  //  Run collision
  game.physics.arcade.overlap(bullets, aliens, collisionHandler, null, this);

}

/**
 * The game has ended.
 */
function endGame(win = 0) {

  music.stop();
  playerTween.pause();

  if (win) {
    win_sound.play();
    message = "You Won";
  }
  else {
    lose_sound.play();
    message = "You Lost";
  }
  message += "\nReload to restart";

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
    aliens.children[old_position].play('fly');
  }

  return new_position;
}

/**
 *  Handles the collision between sprites. End the game if the player has been hit.
 */
function collisionHandler (bullet, alien) {

  //  When a bullet hits an alien we kill them both
  explosion.play();
  bullet.kill();
  alien.kill();

  if (alien.data.index == player_position) {
    endGame(0);
  }

  if (alien.data.index == final_living_alien) {
    for (i = 0; i < 39; i++) {
      if (aliens.children[i].visible) {
        final_living_alien = i;
      }
    }
  }
  console.log(final_living_alien);

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
      bullet.reset(shooter.x, shooter.y + 8);
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

  //  And brings the aliens back from the dead :)
  aliens.removeAll();
  createAliens();

  //revives the player
  player.revive();

  //hides the text
  stateText.visible = false;

}

function render() {}
