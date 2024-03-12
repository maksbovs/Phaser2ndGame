var config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};
var game = new Phaser.Game(config);
var player;
var stars;
var bombs;
var platforms;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;
var health = 100;
var healthText;
var healthBar;
var starSound;
var bombSound;
var timer;
var timerText;
var startTime;
var replayButton;
var worldWidth = 9600;
var pspeed=230;
//
var badGuy;

function preload() {
    this.load.image('sky', 'assets/fon1.jpg');
    this.load.image('ground', 'assets/2.png');
    this.load.image('star', 'assets/star.jpg');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
    //
    this.load.spritesheet('dude_angry', 'assets/dude_angry.png', { frameWidth: 32, frameHeight: 48 });
    //
    this.load.image('replay', 'assets/replay.png');

    this.load.audio('starSound', 'assets/sound.wav');
    this.load.audio('bombSound', 'assets/bomb.mp3');
    this.load.image('platform1', 'assets/13.png');
    this.load.image('tree', 'assets/Tree_1.png');
    this.load.image('tree2', 'assets/Tree_2.png');
    this.load.image('platform2', 'assets/14.png');
    this.load.image('platform3', 'assets/15.png');
    this.load.image('stone', 'assets/Stone.png');
}

function create() {
    this.add.tileSprite(0, 0, worldWidth, 1080, "sky").setOrigin(0, 0);
    replayButton = this.add.image(100, 100, 'replay')
        .setOrigin(0, 0)
        .setInteractive()
        .setScrollFactor(0)
        .on('pointerdown', resetGame, this);
    //this.add.image(0, 0, 'sky').setOrigin(0, 0);

    platforms = this.physics.add.staticGroup();
    stones = this.physics.add.staticGroup();
    trees = this.physics.add.staticGroup();
    //
    badGuy = this.physics.add.sprite(950, 750, 'dude_angry');
    badGuy.setBounce(0.2);
    badGuy.setCollideWorldBounds(true);
    badGuy.setGravityY(0);

    this.physics.add.collider(badGuy, platforms);

    this.anims.create({
        key: 'badGuyLeft',
        frames: this.anims.generateFrameNumbers('dude_angry', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'badGuyTurn',
        frames: [{ key: 'dude_angry', frame: 4 }],
        frameRate: 20
    });

    this.anims.create({
        key: 'badGuyRight',
        frames: this.anims.generateFrameNumbers('dude_angry', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });
    //

    createMap();

    player = this.physics.add.sprite(100, 450, 'dude');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [{ key: 'dude', frame: 4 }],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });
    
    this.cameras.main.setBounds(0, 0, worldWidth, 1080);
    this.physics.world.setBounds(0, 0, worldWidth, 1080);
    this.cameras.main.startFollow(player);

    cursors = this.input.keyboard.createCursorKeys();

    //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
    stars = this.physics.add.group({
        key: 'star',
        repeat: 96,
        setXY: { x: 0, y: 0, stepX: 100 }
    });

    stars.children.iterate(function (child) {
        child.setBounceY(Phaser.Math.FloatBetween(.5, .8));
    });






    bombs = this.physics.add.group();

    scoreText = this.add.text(16, 50, 'Score: 0', { fontSize: '32px', fill: '#000' });
    healthText = this.add.text(0, 0, '100%', { fontSize: '16px', fill: '#00ff00' });
    healthBar = this.add.graphics();
    updateHealthBar();

    startTime = new Date();
    timer = this.time.addEvent({
        delay: 1000,
        callback: updateTimer,
        callbackScope: this,
        loop: true
    });

    timerText = this.add.text(700, 16, 'Time: 0', { fontSize: '32px', fill: '#000' });

    this.physics.add.collider(player, platforms);
    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(bombs, platforms);

    this.physics.add.overlap(player, stars, collectStar, null, this);
    this.physics.add.collider(player, bombs, hitBomb, null, this);

    starSound = this.sound.add('starSound');
    bombSound = this.sound.add('bombSound');

    replayButton = this.add.image(400, 300, 'replay').setInteractive();
    replayButton.setVisible(false);
    replayButton.on('pointerdown', resetGame, this);
    stars = this.physics.add.group({
        key: 'star',
        repeat: 12,
        setXY: function (star, i) {
            var x = (i + 1) * (worldWidth); // Distribute stars evenly across the worldWidth
            var y = Phaser.Math.Between(50, 300); // Set a random y-coordinate
            star.setXY(x, y);
            return star;
        }
    });

    stars.children.iterate(function (child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });
  
   
}






function update() {
    if (gameOver) {
        return;
    }

    if (cursors.left.isDown) {
        player.setVelocityX(-pspeed);
        player.anims.play('left', true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(pspeed);
        player.anims.play('right', true);
    } else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
    }

    healthText.setPosition(player.x - healthText.displayWidth / 2, player.y - 70);
    healthBar.setPosition(player.x - 20, player.y - 40);
    //
      // Bad Guy movement
      if (Math.random() < 0.02) {
        // Change direction randomly
        badGuy.setVelocityX(Phaser.Math.Between(-200, 200));
    }

    // Bad Guy and Player collision detection
    this.physics.world.collide(player, badGuy, function () {
        endGame();
    });

    // Update bad guy's animations based on velocity
    if (badGuy.body.velocity.x > 0) {
        badGuy.anims.play('badGuyRight', true);
    } else if (badGuy.body.velocity.x < 0) {
        badGuy.anims.play('badGuyLeft', true);
    } else {
        badGuy.anims.play('badGuyTurn');
    }
    //
}

function collectStar(player, star) {
    star.disableBody(true, true);
    score += 10;
    scoreText.setText('Score: ' + score).setScrollFactor(0);

    var x = Phaser.Math.Between(0, worldWidth);
    var bomb = bombs.create(x, 16, 'bomb');
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    bomb.allowGravity = false;

    starSound.play();
}

function hitBomb(player, bomb) {
    health -= 50;
    updateHealthBar();
    bombSound.play();

    if (health <= 0) {
        this.physics.pause();
        player.setTint(0xff0000);
        player.anims.play('turn');
        gameOver = true;
        replayButton.setVisible(true);
    }
}

function resetGame() {
    score = 0;
    scoreText.setText('Score: 0');
    player.setX(100);
    player.setY(450);
    player.clearTint();
    health = 100;
    updateHealthBar();
    badGuy.setX(100);
    badGuy.setY(450);
    badGuy.clearTint();
    gameOver = false;
    replayButton.setVisible(false);
    this.scene.restart();
}

function updateHealthBar() {
    healthText.setText(health + '%');
    healthBar.clear();
    healthBar.fillStyle(0x2ecc71, 1);
    healthBar.fillRect(0, 0, health / 100 * 40, 5);
}

function updateTimer() {
    var elapsedTime = Math.floor((new Date() - startTime) / 1000);
    timerText.setText('Time: ' + elapsedTime).setScrollFactor(0);
}

function createMap() {
    for (var x = 0; x < worldWidth; x = x + 128) {
        platforms.create(x, 892, 'ground').setOrigin(0, 0).refreshBody();
    }
    for (var y = 0; y < worldWidth; y = y + 1920) {
    console.log(y)
    trees.create(1100+y, 870, 'tree').setScale(1);
    trees.create(500+y, 740, 'tree2').setScale(1);
    trees.create(1500+y, 865, 'stone').setScale(1);

    platforms.create(600+y, 770, 'platform1');
    platforms.create(728+y, 770, 'platform2');
    platforms.create(856+y, 770, 'platform3');

    platforms.create(1600+y, 770, 'platform1');
    platforms.create(1728+y, 770, 'platform2');
    platforms.create(1856+y, 770, 'platform3');

    platforms.create(1000+y, 630, 'platform1');
    platforms.create(1128+y, 630, 'platform2');
    platforms.create(1256+y, 630, 'platform3');

    platforms.create(200+y, 630, 'platform1');
    platforms.create(328+y, 630, 'platform2');
    platforms.create(456+y, 630, 'platform3');
    }
    function resetGame() {
        score = 0;
        scoreText.setText('Score: 0');
        player.setX(500);
        player.setY(500);
        player.clearTint();
        health = 100;
        updateHealthBar();
        gameOver = false;
        replayButton.setVisible(false);
        this.scene.restart();
    }
    


}

