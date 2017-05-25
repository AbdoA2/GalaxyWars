function createEnemies(managers, counts, size, w, h, x, y, health) {
	remainingEnemies = 0;
	for (var k=0; k < counts.length; k++) {
		for (var i=0; i < counts[k]; i++) {
			var e = new BABYLON.Sprite("e_" + k + "_" + i, managers[k]);
		    e.stopAnimation(); // Not animated
			e.cellIndex = 0; // Going to frame number 2
		    e.position.y = y[k] + 3;
		    e.position.x = x[k] + i * 2 * w;
		    e.size = size;
		    e.w = w;
		    e.h = h;
		    e.health = health;
		    enemies.push(e);
		    remainingEnemies += 1;
		}
	}
}

function formatTime(time) {
	minutes = Math.floor(time/60);
	seconds = time % 60;
	minutes = minutes < 10? "0" + minutes: minutes;
	seconds = seconds < 10? "0" + seconds: seconds;
	return minutes + ":" + seconds;
}

function createGameTimers(level) {
	// register keydown action for player movement and firing
	window.addEventListener("keydown", registerKey);
	window.addEventListener("keyup", registerKey);

	// move the enemies
	var moves = [[0.2, 0.2, 0.2, 0.2, -0.2, -0.2, -0.2, -0.2, -0.2, -0.2, -0.2, -0.2, 0.2, 0.2, 0.2, 0.2],
			 [-0.2, -0.2, -0.2, -0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, -0.2, -0.2, -0.2, -0.2]];
	var ind = 0;

	var enemyMoves = setInterval(function() {
		for (var i=0; i < enemies.length; i++) {
			enemies[i].position.y += moves[i % 2][ind] * 0.1; 
		}
		ind = (ind + 1) % 16;
	}, 100);

	// move the bullets and check for collision
	var bulletsMoves = setInterval(function() {
		for (var i=0; i < bullets.length; i++) {
			if (checkCollision(bullets[i]) || bullets[i].position.y > 3) {
				bullets[i].dispose();
				bullets.splice(i, 1);
			}
			else
				bullets[i].position.y += 0.2;
		}
	}, 20);


	// enemy attack
	var enemyAttackTimer = setInterval(function() {
		var n = (Math.ceil(Math.random() * 100) % settings[level].attackers - 1) + 1;
		enemyAttack(n, settings[level].attacks);
	}, settings[level].attackInterval);


	// move the enemy bullets and check for collision
	var enemyBulletsMoves = setInterval(function() {
		for (var i=0; i < enemyBullets.length; i++) {
			if (checkCollisionPlayer(enemyBullets[i]) || enemyBullets[i].position.y < -3.5) {
				enemyBullets[i].dispose();
				enemyBullets.splice(i, 1);
			}
			else {
				enemyBullets[i].position.y += enemyBullets[i].nextY;
				enemyBullets[i].position.x += enemyBullets[i].nextX;
			}
		}
	}, settings[level].bulletSpeed);


	// update time
    time = 0;
    var timer = setInterval(function() {
    	time += 1;
    	board.children[0].text = "Time: " + formatTime(time) + "\nHealth: " + player.health + "\nMissiles: " + player.missiles;

    	// check for level finishing
    	if (remainingEnemies == 0 || player.health <= 0) {
    		clearInterval(enemyMoves);
    		clearInterval(bulletsMoves);
    		clearInterval(timer);
    		clearInterval(enemyAttackTimer);
    		clearInterval(enemyBulletsMoves);

    		if (player.health > 0) {
    			player.health = 100;
	    		if (level == 3)
	    			endGame(0);
	    		else
	    			createLevel(level + 1);
	    	}
	    	else {
	    		clearScreen();
	    		endGame(1);
	    	}

	    	// remove event listeners
	    	window.removeEventListener("keydown", registerKey);
			window.removeEventListener("keyup", registerKey);
    		
    	}
    }, 1000);

}

function createLevel(level) {
	// load the level settings
	var images = settings[level].images, counts = settings[level].counts, size = settings[level].size;
	var  w = settings[level].w, h = settings[level].h, x = settings[level].x, y = settings[level].y;
	var health = settings[level].health;

	// create enemy sprite managers
	var managers = [];
	enemies = [];

	for (var i=0; i < images.length; i++)
		managers.push(new BABYLON.SpriteManager("enemyManager" + i, images[i].url, counts[i], images[i].size, scene));

	// create exploions sprites
	spriteManagerExplosion = new BABYLON.SpriteManager("expManager", "explosion.png", 14, 96, scene);
    spriteManagerMissile = new BABYLON.SpriteManager("missileManager", "missile.png", 3, 350, scene);
    spriteManagerFire = new BABYLON.SpriteManager("fireManager", "fire.png", 300, 75, scene);

    player.missiles = settings[level].missiles;
    player.exp = settings[level].exp;
    player.health = settings[level].pHealth;

	// create the enemies
	createEnemies(managers, counts, size, w, h, x, y, health);

	// show enemies
	var t = 0;
	showEnemies = setInterval(function() {
		if (t == 29) {
			clearInterval(showEnemies);
			createGameTimers(level);
		}

		for (var i = 0; i < enemies.length; i++)
			enemies[i].position.y -= 0.1;

		t++;
	}, 100);

	
    themeSound.stop();
    themeSound = settings[level].theme; 
    themeSound.play();
    
}