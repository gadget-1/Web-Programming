// My Phaser game: collect stars, avoid cubes, shoot them with space
// Arrow keys = move and jump, Space = shoot

let player, cursors, spaceKey, stars, enemies, bullets, scoreText;
let score = 0;

const config = {
  type: Phaser.AUTO, width: 800, height: 600,
  physics: { default: "arcade", arcade: { gravity: { y: 500 } } },
  scene: { preload: preload, create: create, update: update }
};
new Phaser.Game(config);

function preload() {
  const g = this.make.graphics();
  g.fillStyle(0x4da6ff).fillRect(0, 0, 32, 32).generateTexture("player", 32, 32);
  g.clear().fillStyle(0x00aa00).fillRect(0, 0, 200, 30).generateTexture("ground", 200, 30);
  g.clear().fillStyle(0xffd23f).fillRect(0, 0, 20, 20).generateTexture("star", 20, 20);
  g.clear().fillStyle(0xff4f4f).fillRect(0, 0, 20, 20).generateTexture("redstar", 20, 20);
  g.clear().fillStyle(0xaa66ff).fillRect(0, 0, 30, 30).generateTexture("enemy", 30, 30);
  g.clear().fillStyle(0xffffff).fillRect(0, 0, 10, 5).generateTexture("bullet", 10, 5);
}

function create() {
  // the ground and two platforms to jump on
  const platforms = this.physics.add.staticGroup();
  platforms.create(400, 585, "ground").setScale(4, 1).refreshBody();
  platforms.create(150, 430, "ground");
  platforms.create(650, 430, "ground");

  player = this.physics.add.sprite(400, 500, "player").setCollideWorldBounds(true);
  this.physics.add.collider(player, platforms);

  // stars fall from the sky, every third one is red and worth more points
  stars = this.physics.add.group();
  for (let i = 0; i < 10; i++) {
    stars.create(80 * i + 40, 0, i % 3 === 0 ? "redstar" : "star").setBounceY(0.4);
  }
  this.physics.add.collider(stars, platforms);
  this.physics.add.overlap(player, stars, collectStar, null, this);

  // two enemies that walk back and forth (they bounce off the walls)
  enemies = this.physics.add.group();
  enemies.create(150, 380, "enemy").setVelocityX(100).setBounce(1, 0).setCollideWorldBounds(true);
  enemies.create(650, 380, "enemy").setVelocityX(-100).setBounce(1, 0).setCollideWorldBounds(true);
  this.physics.add.collider(enemies, platforms);
  this.physics.add.overlap(player, enemies, hitEnemy, null, this);

  // bullets fly straight, no gravity
  bullets = this.physics.add.group({ allowGravity: false });
  this.physics.add.overlap(bullets, enemies, shootEnemy, null, this);

  cursors = this.input.keyboard.createCursorKeys();
  spaceKey = this.input.keyboard.addKey("SPACE");
  scoreText = this.add.text(16, 16, "Score: 0", { fontSize: "24px", fill: "#fff" });
}

function update() {
  // left/right to move, up to jump (only when standing on something)
  if (cursors.left.isDown) player.setVelocityX(-200);
  else if (cursors.right.isDown) player.setVelocityX(200);
  else player.setVelocityX(0);
  if (cursors.up.isDown && player.body.touching.down) player.setVelocityY(-400);

  // press space to shoot one bullet in the direction I am moving
  if (Phaser.Input.Keyboard.JustDown(spaceKey)) {
    const dir = player.body.velocity.x < 0 ? -1 : 1;
    bullets.create(player.x, player.y, "bullet").setVelocityX(400 * dir);
  }
}

// yellow star = 10 points, red star = 25 points
function collectStar(player, star) {
  score += star.texture.key === "redstar" ? 25 : 10;
  scoreText.setText("Score: " + score);
  star.destroy();
}

// a bullet hit an enemy: both disappear and I get 50 points
function shootEnemy(bullet, enemy) {
  bullet.destroy(); enemy.destroy();
  score += 50; scoreText.setText("Score: " + score);
}

// an enemy touched me: game over, restart from zero
function hitEnemy() {
  score = 0; this.scene.restart();
}