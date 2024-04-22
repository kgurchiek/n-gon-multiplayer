const oldMACHO = spawn.MACHO;
            spawn.MACHO = (x = m.pos.x, y = m.pos.y) => {
                oldMACHO(x, y);
                mob[mob.length - 1].mobId = 0;
            }
            
            const oldWIMP = spawn.WIMP;
            spawn.WIMP = (x = level.exit.x + tech.wimpCount * 200 * (Math.random() - 0.5), y = level.exit.y + tech.wimpCount * 200 * (Math.random() - 0.5)) => {
                oldWIMP(x, y);
                mob[mob.length - 1].mobId = 1;
            }
            
            const oldFinalBoss = spawn.finalBoss;
            spawn.finalBoss = (x, y, radius = 300) => {
                oldFinalBoss(x, y, radius);
                mob[mob.length - 1].mobId = 2;
            }
            
            const oldZombie = spawn.zombie;
            spawn.zombie = (x, y, radius, sides, color) => {
                oldZombie(x, y, radius, sides, color);
                mob[mob.length - 1].mobId = 3;
            }
            
            const oldStarter = spawn.starter;
            spawn.starter = (x, y, radius = Math.floor(15 + 20 * Math.random())) => {
                oldStarter(x, y, radius);
                mob[mob.length - 1].mobId = 4;
            }
            
            const oldBlockGroupMob = spawn.blockGroupMob;
            spawn.blockGroupMob = (x, y, radius = 25 + Math.floor(Math.random() * 20)) => {
                oldBlockGroupMob(x, y, radius);
                mob[mob.length - 1].mobId = 5;
            }
            
            const oldBlockBoss = spawn.blockBoss;
            spawn.blockBoss = (x, y, radius = 60) => {
                oldBlockBoss(x, y, radius);
                mob[mob.length - 1].mobId = 6;
            }
            
            const oldBlockMob = spawn.blockMob;
            spawn.blockMob = (x, y, host, growCycles = 60) => {
                oldBlockMob(x, y, host, growCycles);
                mob[mob.length - 1].mobId = 7;
            }
            
            const oldCellBoss = spawn.cellBoss;
            spawn.cellBoss = (x, y, radius = 20, cellID) => {
                oldCellBoss(x, y, radius, cellID);
                mob[mob.length - 1].mobId = 8;
            }
            
            const oldSpawnerBoss = spawn.spawnerBoss;
            spawn.spawnerBoss = (x, y, radius, spawnID) => {
                oldSpawnerBoss(x, y, radius, spawnID);
                mob[mob.length - 1].mobId = 9;
            }
            
            const oldGrowBoss = spawn.growBoss;
            spawn.growBoss = (x, y, radius, buffID) => {
                oldGrowBoss(x, y, radius, buffID);
                mob[mob.length - 1].mobId = 10;
            }
            
            const oldPowerUpBossBaby = spawn.powerUpBossBaby;
            spawn.powerUpBossBaby = (x, y, vertices = 9, radius = 60) => {
                oldPowerUpBossBaby(x, y, vertices, radius);
                mob[mob.length - 1].mobId = 11;
            }
            
            const oldPowerUpBoss = spawn.powerUpBoss;
            spawn.powerUpBoss = (x, y, vertices = 9, radius = 130) => {
                oldPowerUpBoss(x, y, vertices, radius);
                mob[mob.length - 1].mobId = 12;
            }
            
            const oldGrower = spawn.grower;
            spawn.grower = (x, y, radius = 15) => {
                oldGrower(x, y, radius);
                mob[mob.length - 1].mobId = 13;
            }
            
            const oldSpringer = spawn.springer;
            spawn.springer = (x, y, radius = 20 + Math.ceil(Math.random() * 35)) => {
                oldSpringer(x, y, radius);
                mob[mob.length - 1].mobId = 14;
            }
            
            const oldHopper = spawn.hopper;
            spawn.hopper = (x, y, radius = 35 + Math.ceil(Math.random() * 30)) => {
                oldHopper(x, y, radius);
                mob[mob.length - 1].mobId = 15;
            }
            
            const oldHopMother = spawn.hopMother;
            spawn.hopMother = (x, y, radius = 20 + Math.ceil(Math.random() * 20)) => {
                oldHopMother(x, y, radius);
                mob[mob.length - 1].mobId = 16;
            }
            
            const oldHopEgg = spawn.hopEgg;
            spawn.hopEgg = (x, y) => {
                oldHopEgg(x, y);
                mob[mob.length - 1].mobId = 17;
            }
            
            const oldHopBullet = spawn.hopBullet;
            spawn.hopBullet = (x, y, radius = 10 + Math.ceil(Math.random() * 8)) => {
                oldHopBullet(x, y, radius);
                mob[mob.length - 1].mobId = 18;
            }
            
            const oldHopMotherBoss = spawn.hopMotherBoss;
            spawn.hopMotherBoss = (x, y, radius = 120) => {
                oldHopMotherBoss(x, y, radius);
                mob[mob.length - 1].mobId = 19;
            }
            
            const oldSpinner = spawn.spinner;
            spawn.spinner = (x, y, radius = 30 + Math.ceil(Math.random() * 35)) => {
                oldSpinner(x, y, radius);
                mob[mob.length - 1].mobId = 20;
            }
            
            const oldSucker = spawn.sucker;
            spawn.sucker = (x, y, radius = 30 + Math.ceil(Math.random() * 25)) => {
                oldSucker(x, y, radius);
                mob[mob.length - 1].mobId = 21;
            }
            
            const oldSuckerBoss = spawn.suckerBoss;
            spawn.suckerBoss = (x, y, radius = 25) => {
                oldSuckerBoss(x, y, radius);
                mob[mob.length - 1].mobId = 22;
            }
            
            const oldSpiderBoss = spawn.spiderBoss;
            spawn.spiderBoss = (x, y, radius = 60 + Math.ceil(Math.random() * 10)) => {
                oldSpiderBoss(x, y, radius);
                mob[mob.length - 1].mobId = 23;
            }
            
            const oldMantisBoss = spawn.mantisBoss;
            spawn.mantisBoss = (x, y, radius = 35, isSpawnBossPowerUp = true) => {
                oldMantisBoss(x, y, radius, isSpawnBossPowerUp);
                mob[mob.length - 1].mobId = 24;
            }
            
            const oldBeamer = spawn.beamer;
            spawn.beamer = (x, y, radius = 15 + Math.ceil(Math.random() * 15)) => {
                oldBeamer(x, y, radius);
                mob[mob.length - 1].mobId = 25;
            }
            
            const oldHistoryBoss = spawn.historyBoss;
            spawn.historyBoss = (x, y, radius = 30) => {
                oldHistoryBoss(x, y, radius);
                mob[mob.length - 1].mobId = 26;
            }
            
            const oldFocuser = spawn.focuser;
            spawn.focuser = (x, y, radius = 30 + Math.ceil(Math.random() * 10)) => {
                oldFocuser(x, y, radius);
                mob[mob.length - 1].mobId = 27;
            }
            
            const oldFlutter = spawn.flutter;
            spawn.flutter = (x, y, radius = 20 + 6 * Math.random()) => {
                oldFlutter(x, y, radius);
                mob[mob.length - 1].mobId = 28;
            }
            
            const oldStinger = spawn.stinger;
            spawn.stinger = (x, y, radius = 18 + 4 * Math.random()) => {
                oldStinger(x, y, radius);
                mob[mob.length - 1].mobId = 29;
            }
            
            const oldBeetleBoss = spawn.beetleBoss;
            spawn.beetleBoss = (x, y, radius = 50) => {
                oldBeetleBoss(x, y, radius);
                mob[mob.length - 1].mobId = 30;
            }
            
            const oldLaserTargetingBoss = spawn.laserTargetingBoss;
            spawn.laserTargetingBoss = (x, y, radius = 80) => {
                oldLaserTargetingBoss(x, y, radius);
                mob[mob.length - 1].mobId = 31;
            }
            
            const oldLaserBombingBoss = spawn.laserBombingBoss;
            spawn.laserBombingBoss = (x, y, radius = 80) => {
                oldLaserBombingBoss(x, y, radius);
                mob[mob.length - 1].mobId = 32;
            }
            
            const oldBlinkBoss = spawn.blinkBoss;
            spawn.blinkBoss = (x, y) => {
                oldBlinkBoss(x, y);
                mob[mob.length - 1].mobId = 33;
            }
            
            const oldPulsarBoss = spawn.pulsarBoss;
            spawn.pulsarBoss = (x, y, radius = 90, isNonCollide = false) => {
                oldPulsarBoss(x, y, radius, isNonCollide);
                mob[mob.length - 1].mobId = 34;
            }
            
            const oldPulsar = spawn.pulsar;
            spawn.pulsar = (x, y, radius = 40) => {
                oldPulsar(x, y, radius);
                mob[mob.length - 1].mobId = 35;
            }
            
            const oldLaserLayer = spawn.laserLayer;
            spawn.laserLayer = (x, y, radius = 18 + Math.floor(6 * Math.random())) => {
                oldLaserLayer(x, y, radius);
                mob[mob.length - 1].mobId = 36;
            }
            
            const oldLaserLayerBoss = spawn.laserLayerBoss;
            spawn.laserLayerBoss = (x, y, radius = 65) => {
                oldLaserLayerBoss(x, y, radius);
                mob[mob.length - 1].mobId = 37;
            }
            
            const oldLaser = spawn.laser;
            spawn.laser = (x, y, radius = 30) => {
                oldLaser(x, y, radius);
                mob[mob.length - 1].mobId = 38;
            }
            
            const oldLaserBoss = spawn.laserBoss;
            spawn.laserBoss = (x, y, radius = 30) => {
                oldLaserBoss(x, y, radius);
                mob[mob.length - 1].mobId = 39;
            }
            
            const oldStabber = spawn.stabber;
            spawn.stabber = (x, y, radius = 25 + Math.ceil(Math.random() * 12), spikeMax = 7) => {
                oldStabber(x, y, radius, spikeMax);
                mob[mob.length - 1].mobId = 40;
            }
            
            const oldStriker = spawn.striker;
            spawn.striker = (x, y, radius = 14 + Math.ceil(Math.random() * 25)) => {
                oldStriker(x, y, radius);
                mob[mob.length - 1].mobId = 41;
            }
            
            const oldRevolutionBoss = spawn.revolutionBoss;
            spawn.revolutionBoss = (x, y, radius = 70) => {
                oldRevolutionBoss(x, y, radius);
                mob[mob.length - 1].mobId = 42;
            }
            
            const oldSprayBoss = spawn.sprayBoss;
            spawn.sprayBoss = (x, y, radius = 40, isSpawnBossPowerUp = true) => {
                oldSprayBoss(x, y, radius, isSpawnBossPowerUp);
                mob[mob.length - 1].mobId = 43;
            }
            
            const oldMineBoss = spawn.mineBoss;
            spawn.mineBoss = (x, y, radius = 120, isSpawnBossPowerUp = true) => {
                oldMineBoss(x, y, radius, isSpawnBossPowerUp);
                mob[mob.length - 1].mobId = 44;
            }
            
            const oldMine = spawn.mine;
            spawn.mine = (x, y) => {
                oldMine(x, y);
                mob[mob.length - 1].mobId = 45;
            }
            
            const oldBounceBoss = spawn.bounceBoss;
            spawn.bounceBoss = (x, y, radius = 80, isSpawnBossPowerUp = true) => {
                oldBounceBoss(x, y, radius, isSpawnBossPowerUp);
                mob[mob.length - 1].mobId = 46;
            }
            
            const oldTimeBoss = spawn.timeBoss;
            spawn.timeBoss = (x, y, radius = 50, isSpawnBossPowerUp = true) => {
                oldTimeBoss(x, y, radius, isSpawnBossPowerUp);
                mob[mob.length - 1].mobId = 47;
            }
            
            const oldBounceBullet = spawn.bounceBullet;
            spawn.bounceBullet = (x, y, velocity = 0 /*FIX LATER*/, radius = 11, sides = 6) => {
                oldBounceBullet(x, y, velocity, radius, sides);
                mob[mob.length - 1].mobId = 48;
            }
            
            const oldSlashBoss = spawn.slashBoss;
            spawn.slashBoss = (x, y, radius = 80) => {
                oldSlashBoss(x, y, radius);
                mob[mob.length - 1].mobId = 49;
            }
            
            const oldSlasher = spawn.slasher;
            spawn.slasher = (x, y, radius = 33 + Math.ceil(Math.random() * 30)) => {
                oldSlasher(x, y, radius);
                mob[mob.length - 1].mobId = 50;
            }
            
            const oldSlasher2 = spawn.slasher2;
            spawn.slasher2 = (x, y, radius = 33 + Math.ceil(Math.random() * 30)) => {
                oldSlasher2(x, y, radius);
                mob[mob.length - 1].mobId = 51;
            }
            
            const oldSlasher3 = spawn.slasher3;
            spawn.slasher3 = (x, y, radius = 33 + Math.ceil(Math.random() * 30)) => {
                oldSlasher3(x, y, radius);
                mob[mob.length - 1].mobId = 52;
            }
            
            const oldSneakBoss = spawn.sneakBoss;
            spawn.sneakBoss = (x, y, radius = 70) => {
                oldSneakBoss(x, y, radius);
                mob[mob.length - 1].mobId = 53;
            }
            
            const oldSneaker = spawn.sneaker;
            spawn.sneaker = (x, y, radius = 15 + Math.ceil(Math.random() * 10)) => {
                oldSneaker(x, y, radius);
                mob[mob.length - 1].mobId = 54;
            }
            
            const oldGhoster = spawn.ghoster;
            spawn.ghoster = (x, y, radius = 50 + Math.ceil(Math.random() * 90)) => {
                oldGhoster(x, y, radius);
                mob[mob.length - 1].mobId = 55;
            }
            
            const oldBomberBoss = spawn.bomberBoss;
            spawn.bomberBoss = (x, y, radius = 88) => {
                oldBomberBoss(x, y, radius);
                mob[mob.length - 1].mobId = 56;
            }
            
            const oldShooter = spawn.shooter;
            spawn.shooter = (x, y, radius = 25 + Math.ceil(Math.random() * 50)) => {
                oldShooter(x, y, radius);
                mob[mob.length - 1].mobId = 57;
            }
            
            const oldShooterBoss = spawn.shooterBoss;
            spawn.shooterBoss = (x, y, radius = 110, isSpawnBossPowerUp = true) => {
                oldShooterBoss(x, y, radius, isSpawnBossPowerUp);
                mob[mob.length - 1].mobId = 58;
            }
            
            const oldBullet = spawn.bullet;
            spawn.bullet = (x, y, radius = 9, sides = 0) => {
                oldBullet(x, y, radius, sides);
                mob[mob.length - 1].mobId = 59;
            }
            
            const oldBomb = spawn.bomb;
            spawn.bomb = (x, y, radius = 9, sides = 5) => {
                oldBomb(x, y, radius, sides);
                mob[mob.length - 1].mobId = 60;
            }
            
            const oldSniper = spawn.sniper;
            spawn.sniper = (x, y, radius = 35 + Math.ceil(Math.random() * 30)) => {
                oldSniper(x, y, radius);
                mob[mob.length - 1].mobId = 61;
            }
            
            const oldSniperBullet = spawn.sniperBullet;
            spawn.sniperBullet = (x, y, radius = 9, sides = 5) => {
                oldSniperBullet(x, y, radius, sides);
                mob[mob.length - 1].mobId = 62;
            }
            
            const oldLauncherOne = spawn.launcherOne;
            spawn.launcherOne = (x, y, radius = 30 + Math.ceil(Math.random() * 40)) => {
                oldLauncherOne(x, y, radius);
                mob[mob.length - 1].mobId = 63;
            }
            
            const oldLauncher = spawn.launcher;
            spawn.launcher = (x, y, radius = 30 + Math.ceil(Math.random() * 40)) => {
                oldLauncher(x, y, radius);
                mob[mob.length - 1].mobId = 64;
            }
            
            const oldLauncherBoss = spawn.launcherBoss;
            spawn.launcherBoss = (x, y, radius = 90, isSpawnBossPowerUp = true) => {
                oldLauncherBoss(x, y, radius, isSpawnBossPowerUp);
                mob[mob.length - 1].mobId = 65;
            }
            
            const oldGrenadierBoss = spawn.grenadierBoss;
            spawn.grenadierBoss = (x, y, radius = 95) => {
                oldGrenadierBoss(x, y, radius);
                mob[mob.length - 1].mobId = 66;
            }
            
            const oldGrenadier = spawn.grenadier;
            spawn.grenadier = (x, y, radius = 35 + Math.ceil(Math.random() * 20)) => {
                oldGrenadier(x, y, radius);
                mob[mob.length - 1].mobId = 67;
            }
            
            const oldGrenade = spawn.grenade;
            spawn.grenade = (x, y, lifeSpan = 90 + Math.ceil(60 / simulation.accelScale), pulseRadius = Math.min(550, 250 + simulation.difficulty * 3), size = 3) => {
                oldGrenade(x, y, lifeSpan, pulseRadius, 250 + simulation.difficulty * 3), size);
                mob[mob.length - 1].mobId = 68;
            }
            
            const oldShieldingBoss = spawn.shieldingBoss;
            spawn.shieldingBoss = (x, y, radius = 200) => {
                oldShieldingBoss(x, y, radius);
                mob[mob.length - 1].mobId = 69;
            }
            
            const oldTimeSkipBoss = spawn.timeSkipBoss;
            spawn.timeSkipBoss = (x, y, radius = 50) => {
                oldTimeSkipBoss(x, y, radius);
                mob[mob.length - 1].mobId = 70;
            }
            
            const oldStreamBoss = spawn.streamBoss;
            spawn.streamBoss = (x, y, radius = 110) => {
                oldStreamBoss(x, y, radius);
                mob[mob.length - 1].mobId = 71;
            }
            
            const oldSeeker = spawn.seeker;
            spawn.seeker = (x, y, radius = 8, sides = 6) => {
                oldSeeker(x, y, radius, sides);
                mob[mob.length - 1].mobId = 72;
            }
            
            const oldSpawner = spawn.spawner;
            spawn.spawner = (x, y, radius = 55 + Math.ceil(Math.random() * 50)) => {
                oldSpawner(x, y, radius);
                mob[mob.length - 1].mobId = 73;
            }
            
            const oldSpawns = spawn.spawns;
            spawn.spawns = (x, y, radius = 15) => {
                oldSpawns(x, y, radius);
                mob[mob.length - 1].mobId = 74;
            }
            
            const oldExploder = spawn.exploder;
            spawn.exploder = (x, y, radius = 40 + Math.ceil(Math.random() * 50)) => {
                oldExploder(x, y, radius);
                mob[mob.length - 1].mobId = 75;
            }
            
            const oldSnakeSpitBoss = spawn.snakeSpitBoss;
            spawn.snakeSpitBoss = (x, y, radius = 50) => {
                oldSnakeSpitBoss(x, y, radius);
                mob[mob.length - 1].mobId = 76;
            }
            
            const oldDragonFlyBoss = spawn.dragonFlyBoss;
            spawn.dragonFlyBoss = (x, y, radius = 42) => {
                oldDragonFlyBoss(x, y, radius);
                mob[mob.length - 1].mobId = 77;
            }
            
            const oldSnakeBody = spawn.snakeBody;
            spawn.snakeBody = (x, y, radius = 10) => {
                oldSnakeBody(x, y, radius);
                mob[mob.length - 1].mobId = 78;
            }
            
            const oldTetherBoss = spawn.tetherBoss;
            spawn.tetherBoss = (x, y, constraint, radius = 90) => {
                oldTetherBoss(x, y, constraint, radius);
                mob[mob.length - 1].mobId = 79;
            }
            
            const oldShield = spawn.shield;
            spawn.shield = (target, x, y, chance = Math.min(0.02 + simulation.difficulty * 0.005, 0.2) + tech.duplicationChance(), isExtraShield = false) => {
                oldShield(target, x, y, chance, 0.2) + tech.duplicationChance(), isExtraShield);
                mob[mob.length - 1].mobId = 80;
            }
            
            const oldGroupShield = spawn.groupShield;
            spawn.groupShield = (targets, x, y, radius, stiffness = 0.4) => {
                oldGroupShield(targets, x, y, radius, stiffness);
                mob[mob.length - 1].mobId = 81;
            }
            
            const oldOrbital = spawn.orbital;
            spawn.orbital = (who, radius, phase, speed) => {
                oldOrbital(who, radius, phase, speed);
                mob[mob.length - 1].mobId = 82;
            }
            
            const oldOrbitalBoss = spawn.orbitalBoss;
            spawn.orbitalBoss = (x, y, radius = 70) => {
                oldOrbitalBoss(x, y, radius);
                mob[mob.length - 1].mobId = 83;
            }
            
            