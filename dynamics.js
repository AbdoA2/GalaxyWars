keys = [];

function movePlayerSprite() {
	var dist = player.nextX - player.position.x;
	if (Math.abs(dist) > 0.09) {
		var s = dist/Math.abs(dist); 
		player.position.x += 0.1 * s;
	}

	dist = player.nextY - player.position.y;
	if (Math.abs(dist) > 0.09) {
		var s = dist/Math.abs(dist); 
		player.position.y += 0.1 * s;
	}
}

function fire() {
	if (bullets.length >= 5)
		return ;

	bulletSound.play();
	var bullet = new BABYLON.Sprite("fire" + bullets.length, spriteManagerFire);
	bullet.playAnimation(0, 4, true, 50);
	bullet.position.x = player.position.x;
	bullet.position.y = player.position.y + 0.5;
	bullet.size = 0.5;
	bullets.push(bullet);
};

function collide(bullet, ship) {
	var w = ship.w, h = ship.h;
	if (bullet.position.x > ship.position.x - w/2 && bullet.position.x < ship.position.x + w/2)
		if (bullet.position.y > ship.position.y - h/2 && bullet.position.y < ship.position.y + h/2) {
			smallExplosion(bullet.position.x, bullet.position.y);
			return true;
		}

	return false;
}

function checkCollision(bullet) {
	for (var i=0; i < enemies.length; i++) {
		if (enemies[i].health > 0 && collide(bullet, enemies[i])){
			enemies[i].health -= 25;
			if (enemies[i].health <= 0)
				destroyEntity(enemies[i]);
			return true;
		}
	}
	return false;
};

function checkCollisionPlayer(bullet) {
	if (collide(bullet, player)) {
		player.health -= 15;
		if (player.health <= 0) 
			destroyEntity(player);
		return true;
	}
	return false;
}

// register keys
function registerKey(event) {
	keys[event.keyCode] = event.type == 'keydown';
	console.log(event.keyCode);
	for (var i=0; i < keys.length; i++)
		if (keys[i])
			moveFighter(i);
}

// move function
function moveFighter(key) {
	if (key == 39)
		player.nextX = Math.min(player.nextX + 0.2, 8);		 
	else if (key == 37) 
		player.nextX = Math.max(player.nextX - 0.2, -8);	
	else if (key == 32)
		fire();
	else if (key == -1)
		player.nextY = Math.min(player.nextY + 0.2, 3);
	else if (key == -2)
		player.nextY = Math.max(player.nextY - 0.2, -3);
	else if (key == 38)
		playerFireMissile();
}

function stopFighter(event) {
	if (player.nextX - player.position.x > 0.2)
		player.nextX = player.position.x + 0.2;
	else if (player.position.x - player.nextX > 0.2)
		player.nextX = player.position.x - 0.2;
}

function playerFireMissile() {
	if (player.missiles <= 0)
		return ;

	player.missiles -= 1;
	board.children[0].text = "Time: " + formatTime(time) + "\nHealth: " + player.health + "\n Missiles: " + player.missiles;
	fireMissile(player.position.x, player.position.y, player.position.x, 2, 0);
}

function damageEntity(o, x) {
	if (o.health > 0) {
		if (Math.abs(o.position.x - x) < 2)
			o.health -= 60;
		else if (Math.abs(o.position.x - x) < 4)
			o.health -= 40;
		else
			o.health -= 20;

		if (o.health <= 0)
			destroyEntity(o);
	}
}

function fireMissile(x, y, nextX, nextY, shotAt) {
	missileLaunhSound.play();
	var missile = new BABYLON.Sprite("missile", spriteManagerMissile);
	missile.position.x = x;
	missile.position.y = y;
	var dx = (nextX - x) / 20;
	var dy = (nextY - y) / 20;
	missile.angle = Math.atan(dy/dx);
	if (dx < 0)
		missile.angle += Math.PI;
	missile.playAnimation(0, 4, true, 100);

	var moveMissile = setInterval(function() {
		missile.position.y += dy;
		missile.position.x += dx;
	}, 100);

	setTimeout(function() {
		missileLaunhSound.stop();
		explosionSound.play();

		var explosion = new BABYLON.Sprite("explosion0", spriteManagerExplosion);
		explosion.position.x = nextX;
		explosion.position.y = nextY;
		explosion.size = 6;
		explosion.playAnimation(0, 16, false, 50);

		missile.dispose();
		clearInterval(moveMissile);

		setTimeout(function() { explosion.dispose(); }, 16 * 50);

		// decrease the enemies health or player health
		if (shotAt == 0) 
			for (var i=0; i < enemies.length; i++)
				damageEntity(enemies[i], x);
		else 
			damageEntity(player, x);

	}, 2000);
};

// destroy enemy
function destroyEntity(o) {
	var explosion = new BABYLON.Sprite("explosion", spriteManagerExplosion);
	explosion.position.x = o.position.x;
	explosion.position.y = o.position.y;
	explosion.size = player.exp;
	explosion.playAnimation(0, 16, false, 100);
	explosion1Sound.play();
	setTimeout(function(explosion, e) {
		explosion.stopAnimation();
		explosion.dispose();
		e.dispose();
		if (!o.exp)
			remainingEnemies -= 1;
	}, 1600, explosion, o);
}

// enemy attack
function enemyAttack(n, probs) {
	for (var i=0; i < n; i++) {
		var e = Math.ceil(Math.random() * 100) % enemies.length;
		var t = 0;
		while (t < enemies.length && enemies[e].health <= 0) {
			e = Math.ceil(Math.random() * 100) % enemies.length;
			t++;
		}
		if (t == enemies.length)
			return ;

		// set attack type
		var p = Math.random();
		if (p > probs[0]) {
			fireMissile(enemies[e].position.x, enemies[e].position.y, player.position.x, player.position.y, 1);
		}
		else {
			bulletSound.play();
			var bullet = new BABYLON.Sprite("fire_" + e + "_" + i, spriteManagerFire);
			bullet.playAnimation(0, 4, true, 50);
			bullet.position.x = enemies[e].position.x;
			bullet.position.y = enemies[e].position.y - 1;
			var x = player.position.x - enemies[e].position.x;
			var y = player.position.y - enemies[e].position.y;
			bullet.nextX = x / 20;
			bullet.nextY = y / 20;
			bullet.angle = Math.atan(y/x) + Math.PI/2;
			if (x > 0)
				bullet.angle += Math.PI;
			bullet.size = 0.5;
			enemyBullets.push(bullet);
		}
		
		
	}
}

// small explosion
function smallExplosion(x, y) {
	var explosion = new BABYLON.Sprite("explosion", spriteManagerExplosion);
	explosion.position.x = x;
	explosion.position.y = y;
	explosion.playAnimation(0, 16, false, 100);
	setTimeout(function() {
		explosion.dispose();
	}, 1600);
}