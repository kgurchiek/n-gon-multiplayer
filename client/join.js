let player1;
const mobNames = ['MACHO', 'WIMP', 'finalBoss', 'zombie', 'starter', 'blockGroupMob', 'blockBoss', 'blockMob', 'cellBoss', 'spawnerBoss', 'growBoss', 'powerUpBossBaby', 'powerUpBoss', 'grower', 'springer', 'hopper', 'hopMother', 'hopEgg', 'hopBullet', 'hopMotherBoss', 'spinner', 'sucker', 'suckerBoss', 'spiderBoss', 'mantisBoss', 'beamer', 'historyBoss', 'focuser', 'flutter', 'stinger', 'beetleBoss', 'laserTargetingBoss', 'laserBombingBoss', 'blinkBoss', 'pulsarBoss', 'pulsar', 'laserLayer', 'laserLayerBoss', 'laser', 'laserBoss', 'stabber', 'striker', 'revolutionBoss', 'sprayBoss', 'mineBoss', 'mine', 'bounceBoss', 'timeBoss', 'bounceBullet', 'slashBoss', 'slasher', 'slasher2', 'slasher3', 'sneakBoss', 'sneaker', 'ghoster', 'bomberBoss', 'shooter', 'shooterBoss', 'bullet', 'bomb', 'sniper', 'sniperBullet', 'launcherOne', 'launcher', 'launcherBoss', 'grenadierBoss', 'grenadier', 'grenade', 'shieldingBoss', 'timeSkipBoss', 'streamBoss', 'seeker', 'spawner', 'spawns', 'exploder', 'snakeSpitBoss', 'dragonFlyBoss', 'snakeBody', 'tetherBoss', 'shield', 'groupShield', 'orbital', 'orbitalBoss']

b.multiplayerExplosion = (where, radius, color) => { // typically explode is used for some bullets with .onEnd
    radius *= 1; //tech.explosiveRadius

    let dist, sub, knock;
    let dmg = radius * 0.019
    // if (tech.isExplosionHarm) radius *= 1.7 //    1/sqrt(2) radius -> area
    // if (tech.isSmallExplosion) {
    //     // color = "rgba(255,0,30,0.7)"
    //     radius *= 0.66
    //     dmg *= 1.66
    // }

    /*if (tech.isExplodeRadio) { //radiation explosion
        radius *= 1.25; //alert range
        if (tech.isSmartRadius) radius = Math.max(Math.min(radius, Vector.magnitude(Vector.sub(where, player.position)) - 25), 1)
        color = "rgba(25,139,170,0.25)"
        simulation.drawList.push({ //add dmg to draw queue
            x: where.x,
            y: where.y,
            radius: radius,
            color: color,
            time: simulation.drawTime * 2
        });

        //player damage
        if (Vector.magnitude(Vector.sub(where, player.position)) < radius) {
            const DRAIN = (tech.isExplosionHarm ? 0.6 : 0.45) * (tech.isRadioactiveResistance ? 0.25 : 1)
            if (m.immuneCycle < m.cycle) m.energy -= DRAIN
            if (m.energy < 0) {
                m.energy = 0
                if (simulation.dmgScale) m.damage(tech.radioactiveDamage * 0.03 * (tech.isRadioactiveResistance ? 0.25 : 1));
            }
        }

        //mob damage and knock back with alert
        let damageScale = 1.5; // reduce dmg for each new target to limit total AOE damage
        for (let i = 0, len = mob.length; i < len; ++i) {
            if (mob[i].alive && !mob[i].isShielded) {
                sub = Vector.sub(where, mob[i].position);
                dist = Vector.magnitude(sub) - mob[i].radius;
                if (dist < radius) {
                    if (mob[i].shield) dmg *= 2.5 //balancing explosion dmg to shields
                    if (Matter.Query.ray(map, mob[i].position, where).length > 0) dmg *= 0.5 //reduce damage if a wall is in the way
                    mobs.statusDoT(mob[i], dmg * damageScale * 0.25, 240) //apply radiation damage status effect on direct hits
                    if (tech.isStun) mobs.statusStun(mob[i], 30)
                    mob[i].locatePlayer();
                    damageScale *= 0.87 //reduced damage for each additional explosion target
                }
            }
        }
    } else {*/ //normal explosions
        // if (tech.isSmartRadius) radius = Math.max(Math.min(radius, Vector.magnitude(Vector.sub(where, player.position)) - 25), 1)
        simulation.drawList.push({ //add dmg to draw queue
            x: where.x,
            y: where.y,
            radius: radius,
            color: color,
            time: simulation.drawTime
        });
        const alertRange = 100 + radius * 2; //alert range
        simulation.drawList.push({ //add alert to draw queue
            x: where.x,
            y: where.y,
            radius: alertRange,
            color: "rgba(100,20,0,0.03)",
            time: simulation.drawTime
        });

        //player damage and knock back
        if (player1.immuneCycle < m.cycle) {
            sub = Vector.sub(where, player.position);
            dist = Vector.magnitude(sub);

            if (dist < radius) {
                if (simulation.dmgScale) {
                    // const harm = /*tech.isExplosionHarm ? 0.067 :*/ 0.05
                    /*if (tech.isImmuneExplosion && m.energy > 0.25) {
                        // const mitigate = Math.min(1, Math.max(1 - m.energy * 0.5, 0))
                        m.energy -= 0.25
                        // m.damage(0.01 * harm); //remove 99% of the damage  1-0.99
                        knock = Vector.mult(Vector.normalise(sub), -0.6 * player.mass * Math.max(0, Math.min(0.15 - 0.002 * player.speed, 0.15)));
                        player.force.x = knock.x; // not +=  so crazy forces can't build up with MIRV
                        player.force.y = knock.y - 0.3; //some extra vertical kick 
                    } else {*/
                        // if (simulation.dmgScale) m.damage(harm);
                        knock = Vector.mult(Vector.normalise(sub), -Math.sqrt(dmg) * player.mass * 0.013);
                        player.force.x += knock.x;
                        player.force.y += knock.y;
                    // }
                }
            } else if (dist < alertRange) {
                knock = Vector.mult(Vector.normalise(sub), -Math.sqrt(dmg) * player.mass * 0.005);
                player.force.x += knock.x;
                player.force.y += knock.y;
            }
        }

        //body knock backs
        for (let i = body.length - 1; i > -1; i--) {
            if (!body[i].isNotHoldable) {
                sub = Vector.sub(where, body[i].position);
                dist = Vector.magnitude(sub);
                if (dist < radius) {
                    knock = Vector.mult(Vector.normalise(sub), -Math.sqrt(dmg) * body[i].mass * 0.022);
                    body[i].force.x += knock.x;
                    body[i].force.y += knock.y;
                    // if (tech.isBlockExplode) {
                    //     if (body[i] === m.holdingTarget) m.drop()
                    //     const size = 20 + 300 * Math.pow(body[i].mass, 0.25)
                    //     const where = body[i].position
                    //     const onLevel = level.onLevel //prevent explosions in the next level
                    //     Matter.Composite.remove(engine.world, body[i]);
                    //     body.splice(i, 1);
                    //     setTimeout(() => {
                    //         if (onLevel === level.onLevel) b.explosion(where, size); //makes bullet do explosive damage at end
                    //     }, 250 + 300 * Math.random());
                    // }
                } else if (dist < alertRange) {
                    knock = Vector.mult(Vector.normalise(sub), -Math.sqrt(dmg) * body[i].mass * 0.011);
                    body[i].force.x += knock.x;
                    body[i].force.y += knock.y;
                }
            }
        }

        //power up knock backs
        for (let i = 0, len = powerUp.length; i < len; ++i) {
            sub = Vector.sub(where, powerUp[i].position);
            dist = Vector.magnitude(sub);
            if (dist < radius) {
                knock = Vector.mult(Vector.normalise(sub), -Math.sqrt(dmg) * powerUp[i].mass * 0.013);
                powerUp[i].force.x += knock.x;
                powerUp[i].force.y += knock.y;
            } else if (dist < alertRange) {
                knock = Vector.mult(Vector.normalise(sub), -Math.sqrt(dmg) * powerUp[i].mass * 0.007);
                powerUp[i].force.x += knock.x;
                powerUp[i].force.y += knock.y;
            }
        }

        //mob damage and knock back with alert
        let damageScale = 1.5; // reduce dmg for each new target to limit total AOE damage
        for (let i = 0, len = mob.length; i < len; ++i) {
            if (mob[i].alive && !mob[i].isShielded) {
                sub = Vector.sub(where, mob[i].position);
                dist = Vector.magnitude(sub) - mob[i].radius;
                if (dist < radius) {
                    if (mob[i].shield) dmg *= 2.5 //balancing explosion dmg to shields
                    if (Matter.Query.ray(map, mob[i].position, where).length > 0) dmg *= 0.5 //reduce damage if a wall is in the way
                    // mob[i].damage(dmg * damageScale * m.dmgScale);
                    mob[i].locatePlayer();
                    knock = Vector.mult(Vector.normalise(sub), -Math.sqrt(dmg * damageScale) * mob[i].mass * (mob[i].isBoss ? 0.003 : 0.01));
                    /*if (tech.isStun) {
                        mobs.statusStun(mob[i], 30)
                    } else*/ if (!mob[i].isInvulnerable) {
                        mob[i].force.x += knock.x;
                        mob[i].force.y += knock.y;
                    }
                    radius *= 0.95 //reduced range for each additional explosion target
                    damageScale *= 0.87 //reduced damage for each additional explosion target
                } else if (!mob[i].seePlayer.recall && dist < alertRange) {
                    mob[i].locatePlayer();
                    knock = Vector.mult(Vector.normalise(sub), -Math.sqrt(dmg * damageScale) * mob[i].mass * (mob[i].isBoss ? 0 : 0.006));
                    /*if (tech.isStun) {
                        mobs.statusStun(mob[i], 30)
                    } else*/ if (!mob[i].isInvulnerable) {
                        mob[i].force.x += knock.x;
                        mob[i].force.y += knock.y;
                    }
                }
            }
        }
    //}
}

b.multiplayerPulse = (charge, angle, where) => {
    let best;
    let explosionRadius = 5.5 * charge
    let range = 5000
    const path = [{
        x: where.x + 20 * Math.cos(angle),
        y: where.y + 20 * Math.sin(angle)
    },
    {
        x: where.x + range * Math.cos(angle),
        y: where.y + range * Math.sin(angle)
    }
    ];
    //check for collisions
    best = {
        x: null,
        y: null,
        dist2: Infinity,
        who: null,
        v1: null,
        v2: null
    };
    if (!best.who) {
        best = vertexCollision(path[0], path[1], [mob, map, body]);
        if (best.dist2 != Infinity) { //if hitting something
            path[path.length - 1] = {
                x: best.x,
                y: best.y
            };
        }
    }
    if (best.who) {
        // b.multiplayerExplosion(path[1], explosionRadius, 'rgba(255,25,0,0.6)')
        // const off = explosionRadius * 1.2
        // b.multiplayerExplosion({
        //     x: path[1].x + off * (Math.random() - 0.5),
        //     y: path[1].y + off * (Math.random() - 0.5)
        // }, explosionRadius, 'rgba(255,25,0,0.6)')
        // b.multiplayerExplosion({
        //     x: path[1].x + off * (Math.random() - 0.5),
        //     y: path[1].y + off * (Math.random() - 0.5)
        // }, explosionRadius, 'rgba(255,25,0,0.6)')
    }
    //draw laser beam
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    ctx.lineTo(path[1].x, path[1].y);
    if (charge > 50) {
        ctx.strokeStyle = "rgba(255,0,0,0.10)"
        ctx.lineWidth = 70
        ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255,0,0,0.25)"
    ctx.lineWidth = 20
    ctx.stroke();
    ctx.strokeStyle = "#f00";
    ctx.lineWidth = 4
    ctx.stroke();

    //draw little dots along the laser path
    const sub = Vector.sub(path[1], path[0])
    const mag = Vector.magnitude(sub)
    for (let i = 0, len = Math.floor(mag * 0.0005 * charge); i < len; i++) {
        const dist = Math.random()
        simulation.drawList.push({
            x: path[0].x + sub.x * dist + 10 * (Math.random() - 0.5),
            y: path[0].y + sub.y * dist + 10 * (Math.random() - 0.5),
            radius: 1.5 + 5 * Math.random(),
            color: "rgba(255,0,0,0.5)",
            time: Math.floor(9 + 25 * Math.random() * Math.random())
        });
    }
}

b.multiplayerGrenade = (where, angle, size, crouch) => {
    const me = bullet.length;
    bullet[me] = Bodies.circle(where.x, where.y, 15, b.fireAttributes(angle, false));
    bullet[me].multiplayer = true;
    Matter.Body.setDensity(bullet[me], 0.0003);
    bullet[me].explodeRad = 300 * size; //+ 100 * tech.isBlockExplode;
    bullet[me].onEnd = b.grenadeEnd
    bullet[me].minDmgSpeed = 1;
    bullet[me].beforeDmg = function () {
        this.endCycle = 0; //bullet ends cycle after doing damage  //this also triggers explosion
    };
    bullet[me].onEnd = () => {};
    speed = crouch ? 43 : 32
    Matter.Body.setVelocity(bullet[me], {
        x: m.Vx / 2 + speed * Math.cos(angle),
        y: m.Vy / 2 + speed * Math.sin(angle)
    });
    bullet[me].endCycle = simulation.cycle + Math.floor(crouch ? 120 : 80); //* tech.bulletsLastLonger;
    bullet[me].restitution = 0.4;
    bullet[me].do = function () {
        this.force.y += this.mass * 0.0025; //extra gravity for harder arcs
    };
    Composite.add(engine.world, bullet[me]); //add bullet to world
}

b.multiplayerGrapple = (where, angle, playerId) => {
    const origin = playerId == 1 ? player1 : m;
    const me = bullet.length;
    const returnRadius = 100
    bullet[me] = Bodies.fromVertices(where.x, where.y, [
        {
            x: -40,
            y: 2,
            index: 0,
            isInternal: false
        }, {
            x: -40,
            y: -2,
            index: 1,
            isInternal: false
        }, {
            x: 37,
            y: -2,
            index: 2,
            isInternal: false
        }, {
            x: 40,
            y: -1,
            index: 3,
            isInternal: false
        }, {
            x: 37,
            y: 3,
            index: 4,
            isInternal: false
        }],
        {
            angle: angle,
            friction: 1,
            frictionAir: 0.4,
            thrustMag: 0.13,
            dmg: 8, //damage done in addition to the damage from momentum
            classType: "bullet",
            endCycle: simulation.cycle + 70,
            isSlowPull: false,
            drawStringControlMagnitude: 1000 + 1000 * Math.random(),
            drawStringFlip: (Math.round(Math.random()) ? 1 : -1),
            attached: false,
            glowColor: /*tech.hookNails ? "rgba(200,0,0,0.07)" : tech.isHarmReduce ? "rgba(50,100,255,0.1)" :*/ "rgba(0,200,255,0.07)",
            collisionFilter: {
                category: cat.bullet,
                mask: false /*tech.isShieldPierce*/ ? cat.body | cat.mob | cat.mobBullet : cat.body | cat.mob | cat.mobBullet | cat.mobShield,
            },
            minDmgSpeed: 4,
            // lookFrequency: Math.floor(7 + Math.random() * 3),
            density: 0.004, //0.001 is normal for blocks,  0.004 is normal for harpoon
            drain: 0.001,
            powerUpDamage: false, //tech.isHarpoonPowerUp && simulation.cycle - 480 < tech.harpoonPowerUpCycle,
            draw() {
                // draw rope
                const where = { x: origin.pos.x + 30 * Math.cos(origin.angle), y: origin.pos.y + 30 * Math.sin(origin.angle) }
                const sub = Vector.sub(where, this.vertices[0])
                ctx.strokeStyle = "#000" // "#0ce"
                ctx.lineWidth = 0.5
                ctx.beginPath();
                ctx.moveTo(where.x, where.y);
                if (this.attached) {
                    const controlPoint = Vector.add(where, Vector.mult(sub, -0.5))
                    ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, this.vertices[0].x, this.vertices[0].y)
                } else {
                    const long = Math.max(Vector.magnitude(sub), 60)
                    const perpendicular = Vector.mult(Vector.normalise(Vector.perp(sub)), this.drawStringFlip * Math.min(0.7 * long, 10 + this.drawStringControlMagnitude / (10 + Vector.magnitude(sub))))
                    const controlPoint = Vector.add(Vector.add(where, Vector.mult(sub, -0.5)), perpendicular)
                    ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, this.vertices[0].x, this.vertices[0].y)
                }
                // ctx.lineTo(this.vertices[0].x, this.vertices[0].y);
                // ctx.stroke();
                ctx.strokeStyle = this.glowColor // "#0ce"
                ctx.lineWidth = 10
                ctx.stroke();
                ctx.strokeStyle = "#000" // "#0ce"
                ctx.lineWidth = 0.5
                ctx.stroke();

                if (this.powerUpDamage) {
                    ctx.beginPath();
                    ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
                    ctx.lineTo(this.vertices[1].x, this.vertices[1].y);
                    ctx.lineTo(this.vertices[2].x, this.vertices[2].y);
                    ctx.lineTo(this.vertices[3].x, this.vertices[3].y);
                    ctx.lineTo(this.vertices[4].x, this.vertices[4].y);
                    ctx.lineJoin = "miter"
                    ctx.miterLimit = 30;
                    ctx.lineWidth = 25;
                    ctx.strokeStyle = "rgba(0,255,255,0.4)";
                    ctx.stroke();
                    ctx.lineWidth = 8;
                    ctx.strokeStyle = "rgb(0,255,255)";
                    ctx.stroke();
                    ctx.lineJoin = "round"
                    ctx.miterLimit = 5
                    ctx.fillStyle = "#000"
                    ctx.fill();
                }
                //draw hook
                ctx.beginPath();
                ctx.lineTo(this.vertices[0].x, this.vertices[0].y);
                const spike = Vector.add(this.vertices[3], Vector.mult(Vector.sub(this.vertices[3], this.vertices[2]), 2))
                ctx.moveTo(this.vertices[2].x, this.vertices[2].y);
                ctx.lineTo(spike.x, spike.y);
                ctx.lineTo(this.vertices[1].x, this.vertices[1].y);
                ctx.fillStyle = '#000'
                ctx.fill();
            },
            beforeDmg(who) {
                // if (tech.isShieldPierce && who.isShielded) { //disable shields
                //     who.isShielded = false
                //     requestAnimationFrame(() => {
                //         who.isShielded = true
                //     });
                // }
                if (origin.fieldCDcycle < m.cycle + 40) origin.fieldCDcycle = m.cycle + 40  //extra long cooldown on hitting mobs
                // if (tech.hookNails) {
                //     b.targetedNail(this.position, tech.hookNails)
                //     const ANGLE = 2 * Math.PI * Math.random() //make a few random ones
                //     for (let i = 0; i < 4; i++) b.nail(this.position, { x: 10.5 * Math.cos(ANGLE), y: 10.5 * Math.sin(ANGLE) }, 1.2)
                // }
                // if (this.powerUpDamage) this.density = 2 * 0.004 //double damage after pick up power up for 8 seconds


                // if (tech.isHarpoonPowerUp && simulation.cycle - 480 < tech.harpoonPowerUpCycle) {
                //     Matter.Body.setDensity(this, 1.8 * 0.004); //+90% damage after pick up power up for 8 seconds
                // } else if (tech.isHarpoonFullHealth && who.health === 1) {
                //     Matter.Body.setDensity(this, 2.11 * 0.004); //+90% damage if mob has full health do
                //     simulation.ephemera.push({
                //         name: "grapple outline",
                //         count: 3, //cycles before it self removes
                //         vertices: this.vertices,
                //         do() {
                //             this.count--
                //             if (this.count < 0) simulation.removeEphemera(this.name)

                //             ctx.beginPath();
                //             ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
                //             for (let j = 1, len = this.vertices.length; j < len; j += 1) ctx.lineTo(this.vertices[j].x, this.vertices[j].y);
                //             ctx.lineTo(this.vertices[0].x, this.vertices[0].y);
                //             ctx.lineJoin = "miter"
                //             ctx.miterLimit = 20;
                //             ctx.lineWidth = 40;
                //             ctx.strokeStyle = "rgba(255,0,100,0.35)";
                //             ctx.stroke();
                //             ctx.lineWidth = 10;
                //             ctx.strokeStyle = `#f07`;
                //             ctx.stroke();
                //             ctx.lineJoin = "round"
                //             ctx.miterLimit = 5
                //             ctx.fillStyle = "#000"
                //             ctx.fill();
                //         },
                //     })
                // }


                this.retract()
            },
            caughtPowerUp: null,
            dropCaughtPowerUp() {
                if (this.caughtPowerUp) {
                    this.caughtPowerUp.collisionFilter.category = cat.powerUp
                    this.caughtPowerUp.collisionFilter.mask = cat.map | cat.powerUp
                    this.caughtPowerUp = null
                }
            },
            onEnd() {
                if (this.caughtPowerUp && !simulation.isChoosing && (this.caughtPowerUp.name !== "heal" || origin.health !== origin.maxHealth /*|| tech.isOverHeal*/)) {
                    let index = null //find index
                    for (let i = 0, len = powerUp.length; i < len; ++i) if (powerUp[i] === this.caughtPowerUp) index = i
                    if (index !== null) powerUp.splice(index, 1);
                    else this.dropCaughtPowerUp()
                } else this.dropCaughtPowerUp()
            },
            retract() {
                this.attached = false
                this.do = this.returnToPlayer
                this.endCycle = simulation.cycle + 60
                Matter.Body.setDensity(this, 0.0005); //reduce density on return
                if (this.angularSpeed < 0.5) this.torque += this.inertia * 0.001 * (Math.random() - 0.5) //(Math.round(Math.random()) ? 1 : -1)
                this.collisionFilter.mask = 0//cat.map | cat.mob | cat.mobBullet | cat.mobShield // | cat.body
                //recoil on pulling grapple back
                const mag = this.pickUpTarget ? Math.max(this.pickUpTarget.mass, 0.5) : 0.5
                const momentum = Vector.mult(Vector.sub(this.position, origin.pos), mag * (origin.crouch ? 0.0001 : 0.0002))
            },
            returnToPlayer() {
                if (origin.fieldCDcycle < m.cycle + 5) origin.fieldCDcycle = m.cycle + 5
                if (Vector.magnitude(Vector.sub(this.position, origin.pos)) < returnRadius) { //near player
                    this.endCycle = 0;
                    //recoil on catching grapple
                    // const momentum = Vector.mult(Vector.sub(this.velocity, player.velocity), (origin.crouch ? 0.0001 : 0.0002))
                    if (this.pickUpTarget) {
                        // if (tech.isReel && this.blockDist > 150) {
                        //     // console.log(0.0003 * Math.min(this.blockDist, 1000))
                        //     origin.energy += 0.0009 * Math.min(this.blockDist, 800) //max 0.352 energy
                        //     simulation.drawList.push({ //add dmg to draw queue
                        //         x: origin.pos.x,
                        //         y: origin.pos.y,
                        //         radius: 10,
                        //         color: origin.fieldMeterColor,
                        //         time: simulation.drawTime
                        //     });
                        // }
                        // m.holdingTarget = this.pickUpTarget
                        // give block to player after it returns
                        // m.isHolding = true;
                        //conserve momentum when player mass changes
                        // totalMomentum = Vector.add(Vector.mult(player.velocity, player.mass), Vector.mult(Vector.normalise(this.velocity), 15 * Math.min(20, this.pickUpTarget.mass)))
                        // Matter.Body.setVelocity(player, Vector.mult(totalMomentum, 1 / (m.defaultMass + this.pickUpTarget.mass)));

                        // m.definePlayerMass(m.defaultMass + this.pickUpTarget.mass * m.holdingMassScale)
                        //make block collide with nothing
                        // m.holdingTarget.collisionFilter.category = 0;
                        // m.holdingTarget.collisionFilter.mask = 0;
                        this.pickUpTarget = null
                    }
                } else {
                    if (origin.energy > this.drain) origin.energy -= this.drain
                    const sub = Vector.sub(this.position, origin.pos)
                    const rangeScale = 1 + 0.000001 * Vector.magnitude(sub) * Vector.magnitude(sub) //return faster when far from player
                    const returnForce = Vector.mult(Vector.normalise(sub), rangeScale * this.thrustMag * this.mass)
                    this.force.x -= returnForce.x
                    this.force.y -= returnForce.y
                    this.grabPowerUp()
                }
                this.draw();
            },
            pickUpTarget: null,
            grabPowerUp() { //grab power ups near the tip of the harpoon
                if (this.caughtPowerUp) {
                    Matter.Body.setPosition(this.caughtPowerUp, Vector.add(this.vertices[2], this.velocity))
                    Matter.Body.setVelocity(this.caughtPowerUp, { x: 0, y: 0 })
                } else {
                    for (let i = 0, len = powerUp.length; i < len; ++i) {
                        const radius = powerUp[i].circleRadius + 50
                        if (Vector.magnitudeSquared(Vector.sub(this.vertices[2], powerUp[i].position)) < radius * radius) {
                            if (powerUp[i].name !== "heal" || origin.health !== origin.maxHealth /*|| tech.isOverHeal*/) {
                                this.caughtPowerUp = powerUp[i]
                                Matter.Body.setVelocity(powerUp[i], { x: 0, y: 0 })
                                Matter.Body.setPosition(powerUp[i], this.vertices[2])
                                powerUp[i].collisionFilter.category = 0
                                powerUp[i].collisionFilter.mask = 0
                                this.thrustMag *= 0.6
                                this.endCycle += 0.5 //it pulls back slower, so this prevents it from ending early
                                // this.retract()
                                break //just pull 1 power up if possible
                            }
                        }
                    }
                }
            },
            do() {
                if (origin.fieldCDcycle < m.cycle + 5) origin.fieldCDcycle = m.cycle + 5
                if (origin.input.field) {
                    this.grabPowerUp()
                } else {
                    this.retract()
                }
                //grappling hook
                if (origin.input.field && Matter.Query.collides(this, map).length) {
                    Matter.Body.setPosition(this, Vector.add(this.position, { x: -20 * Math.cos(this.angle), y: -20 * Math.sin(this.angle) }))
                    if (Matter.Query.collides(this, map).length) {
                        // if (tech.hookNails) {
                        //     b.targetedNail(this.position, tech.hookNails)
                        //     const ANGLE = 2 * Math.PI * Math.random() //make a few random ones
                        //     for (let i = 0; i < 4; i++) b.nail(this.position, { x: 10.5 * Math.cos(ANGLE), y: 10.5 * Math.sin(ANGLE) }, 1.2)

                        // }
                        this.attached = true
                        Matter.Body.setVelocity(this, { x: 0, y: 0 });
                        Matter.Sleeping.set(this, true)
                        this.endCycle = simulation.cycle + 5
                        // this.dropCaughtPowerUp()
                        this.do = () => {
                            if (origin.fieldCDcycle < m.cycle + 5) origin.fieldCDcycle = m.cycle + 5
                            this.grabPowerUp()

                            //between player nose and the grapple
                            const sub = Vector.sub(this.vertices[0], { x: origin.pos.x + 30 * Math.cos(origin.angle), y: origin.pos.y + 30 * Math.sin(origin.angle) })
                            let dist = Vector.magnitude(sub)
                            if (origin.input.field) {
                                this.endCycle = simulation.cycle + 10
                                if (input.down) { //down
                                    this.isSlowPull = true
                                    dist = 0
                                } else if (input.up) {
                                    this.isSlowPull = false
                                }
                                if (origin.energy < this.drain) this.isSlowPull = true

                                // pulling friction that allowed a slight swinging, but has high linear pull at short dist
                                const drag = 1 - 30 / Math.min(Math.max(100, dist), 700) - 0.1 * (player.speed > 66)
                                // console.log(player.speed)
                                const pullScale = 0.0004
                                const pull = Vector.mult(Vector.normalise(sub), pullScale * Math.min(Math.max(15, dist), this.isSlowPull ? 70 : 200))
                                if (dist > 500) {
                                    origin.energy -= this.drain
                                }
                            } else {
                                Matter.Sleeping.set(this, false)
                                this.retract()
                            }
                            this.draw();
                        }
                    }
                }
                this.force.x += this.thrustMag * this.mass * Math.cos(this.angle);
                this.force.y += this.thrustMag * this.mass * Math.sin(this.angle);
                this.draw()
            },
        });
    Composite.add(engine.world, bullet[me]); //add bullet to world
}

b.multiplayerHarpoon = (where, target, angle, harpoonSize, isReturn, totalCycles, isReturnAmmo, thrust, playerId) => {
    const origin = playerId == 1 ? player1 : m;
    const me = bullet.length;
    const returnRadius = 100 * Math.sqrt(harpoonSize)
    bullet[me] = Bodies.fromVertices(where.x, where.y, [
        {
            x: -40 * harpoonSize,
            y: 2 * harpoonSize,
            index: 0,
            isInternal: false
        }, {
            x: -40 * harpoonSize,
            y: -2 * harpoonSize,
            index: 1,
            isInternal: false
        }, {
            x: 50 * harpoonSize,
            y: -3 * harpoonSize,
            index: 3,
            isInternal: false
        }, {
            x: 30 * harpoonSize,
            y: 2 * harpoonSize,
            index: 4,
            isInternal: false
        }], {
            cycle: 0,
            angle: angle,
            friction: 1,
            frictionAir: 0.4,
            // thrustMag: 0.1,
            drain: /*tech.isRailEnergy ? 0 :*/ 0.006,
            turnRate: isReturn ? 0.1 : 0.03, //0.015
            drawStringControlMagnitude: 3000 + 5000 * Math.random(),
            drawStringFlip: (Math.round(Math.random()) ? 1 : -1),
            dmg: 6, //damage done in addition to the damage from momentum
            classType: "bullet",
            endCycle: simulation.cycle + totalCycles * 2.5 + 40,
            collisionFilter: {
                category: cat.bullet,
                mask: /*tech.isShieldPierce ? cat.map | cat.body | cat.mob | cat.mobBullet :*/ cat.map | cat.body | cat.mob | cat.mobBullet | cat.mobShield,
            },
            minDmgSpeed: 4,
            lookFrequency: Math.floor(7 + Math.random() * 3),
            density: 0.004, //tech.harpoonDensity, //0.001 is normal for blocks,  0.004 is normal for harpoon,  0.004*6 when buffed
            beforeDmg(who) {
                // if (tech.isShieldPierce && who.isShielded) { //disable shields
                //     who.isShielded = false
                //     requestAnimationFrame(() => {
                //         who.isShielded = true
                //     });
                // }
                // if (tech.fragments) {
                //     b.targetedNail(this.vertices[2], tech.fragments * Math.floor(2 + Math.random()))
                //     if (!isReturn) this.endCycle = 0;
                // }
                if (!who.isBadTarget) {
                    if (isReturn) {
                        this.do = this.returnToPlayer
                    } else {
                        this.frictionAir = 0.01
                        this.do = () => {
                            this.force.y += this.mass * 0.003; //gravity
                            this.draw();
                        }
                    }
                }
                // if (tech.isFoamBall) {
                //     for (let i = 0, len = Math.min(30, 2 + 2 * Math.sqrt(this.mass)); i < len; i++) {
                //         const radius = 5 + 8 * Math.random()
                //         const velocity = { x: Math.max(0.5, 2 - radius * 0.1), y: 0 }
                //         b.foam(this.position, Vector.rotate(velocity, 6.28 * Math.random()), radius)
                //     }
                // }
                // if (tech.isHarpoonPowerUp && simulation.cycle - 480 < tech.harpoonPowerUpCycle) {
                //     Matter.Body.setDensity(this, 1.8 * tech.harpoonDensity); //+90% damage after pick up power up for 8 seconds
                // } else if (tech.isHarpoonFullHealth && who.health === 1) {
                //     Matter.Body.setDensity(this, 2.11 * tech.harpoonDensity); //+90% damage if mob has full health do
                //     simulation.ephemera.push({
                //         name: "harpoon outline",
                //         count: 2, //cycles before it self removes
                //         vertices: this.vertices,
                //         do() {
                //             this.count--
                //             if (this.count < 0) simulation.removeEphemera(this.name)

                //             ctx.beginPath();
                //             ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
                //             for (let j = 1, len = this.vertices.length; j < len; j += 1) ctx.lineTo(this.vertices[j].x, this.vertices[j].y);
                //             ctx.lineTo(this.vertices[0].x, this.vertices[0].y);
                //             ctx.lineJoin = "miter"
                //             ctx.miterLimit = 20;
                //             ctx.lineWidth = 40;
                //             ctx.strokeStyle = "rgba(255,0,100,0.35)";
                //             ctx.stroke();
                //             ctx.lineWidth = 10;
                //             ctx.strokeStyle = `#f07`;
                //             ctx.stroke();
                //             ctx.lineJoin = "round"
                //             ctx.miterLimit = 5
                //             ctx.fillStyle = "#000"
                //             ctx.fill();
                //         },
                //     })
                // }
            },
            caughtPowerUp: null,
            dropCaughtPowerUp() {
                if (this.caughtPowerUp) {
                    this.caughtPowerUp.collisionFilter.category = cat.powerUp
                    this.caughtPowerUp.collisionFilter.mask = cat.map | cat.powerUp
                    this.caughtPowerUp = null
                }
            },
            onEnd() {
                if (this.caughtPowerUp && !simulation.isChoosing && (this.caughtPowerUp.name !== "heal" || origin.health !== origin.maxHealth /*|| tech.isOverHeal*/)) {
                    let index = null //find index
                    for (let i = 0, len = powerUp.length; i < len; ++i) {
                        if (powerUp[i] === this.caughtPowerUp) index = i
                    }
                    if (index !== null) {
                        Matter.Composite.remove(engine.world, this.caughtPowerUp);
                        powerUp.splice(index, 1);
                        // if (tech.isHarpoonPowerUp) tech.harpoonPowerUpCycle = simulation.cycle
                    } else {
                        this.dropCaughtPowerUp()
                    }
                } else {
                    this.dropCaughtPowerUp()
                }
            },
            drawDamageAura() {
                ctx.beginPath();
                ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
                for (let j = 1, len = this.vertices.length; j < len; j += 1) ctx.lineTo(this.vertices[j].x, this.vertices[j].y);
                ctx.lineTo(this.vertices[0].x, this.vertices[0].y);
                ctx.lineJoin = "miter"
                ctx.miterLimit = 20;
                ctx.lineWidth = 15;
                ctx.strokeStyle = "rgba(255,0,100,0.25)";
                ctx.stroke();
                ctx.lineWidth = 4;
                ctx.strokeStyle = `#f07`;
                ctx.stroke();
                ctx.lineJoin = "round"
                ctx.miterLimit = 5
                ctx.fillStyle = "#000"
                ctx.fill();
            },
            drawString() {
                const where = { x: origin.pos.x + 30 * Math.cos(origin.angle), y: origin.pos.y + 30 * Math.sin(origin.angle) }
                const sub = Vector.sub(where, this.vertices[0])
                const perpendicular = Vector.mult(Vector.normalise(Vector.perp(sub)), this.drawStringFlip * Math.min(80, 10 + this.drawStringControlMagnitude / (10 + Vector.magnitude(sub))))
                const controlPoint = Vector.add(Vector.add(where, Vector.mult(sub, -0.5)), perpendicular)
                ctx.strokeStyle = "#000" // "#0ce"
                ctx.lineWidth = 0.5
                ctx.beginPath();
                ctx.moveTo(where.x, where.y);
                ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, this.vertices[0].x, this.vertices[0].y)
                // ctx.lineTo(this.vertices[0].x, this.vertices[0].y);
                ctx.stroke();
            },
            draw() { },
            returnToPlayer() {
                if (Vector.magnitude(Vector.sub(this.position, origin.pos)) < returnRadius) { //near player
                    this.endCycle = 0;
                    // if (m.energy < 0.05) {
                    //     m.fireCDcycle = m.cycle + 80 * b.fireCDscale; //fire cooldown is much longer when out of energy
                    // } else if (m.cycle + 20 * b.fireCDscale < m.fireCDcycle) {
                    // if (m.energy > 0.05) m.fireCDcycle = m.cycle + 20 * b.fireCDscale //lower cd to 25 if it is above 25
                    // }
                    //recoil on catching
                    // const momentum = Vector.mult(Vector.sub(this.velocity, origin.velocity), (origin.crouch ? 0.0001 : 0.0002))
                    // refund ammo
                    if (isReturnAmmo) {
                        b.guns[9].ammo++;
                        simulation.updateGunHUD();
                        // for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                        //     if (b.guns[i].name === "harpoon") {
                        //         break;
                        //     }
                        // }
                    }
                } else {
                    const sub = Vector.sub(this.position, origin.pos)
                    const rangeScale = 1 + 0.000001 * Vector.magnitude(sub) * Vector.magnitude(sub) //return faster when far from player
                    const returnForce = Vector.mult(Vector.normalise(sub), rangeScale * thrust * this.mass)
                    if (origin.energy > this.drain) origin.energy -= this.drain
                    if (origin.energy < 0.05) {
                        this.force.x -= returnForce.x * 0.15
                        this.force.y -= returnForce.y * 0.15
                    } else { //if (m.cycle + 20 * b.fireCDscale < m.fireCDcycle)
                        this.force.x -= returnForce.x
                        this.force.y -= returnForce.y
                    }
                    this.grabPowerUp()
                }
                this.draw();
            },
            grabPowerUp() { //grab power ups near the tip of the harpoon
                if (this.caughtPowerUp) {
                    Matter.Body.setPosition(this.caughtPowerUp, Vector.add(this.vertices[2], this.velocity))
                    Matter.Body.setVelocity(this.caughtPowerUp, { x: 0, y: 0 })
                } else { //&& simulation.cycle % 2 
                    for (let i = 0, len = powerUp.length; i < len; ++i) {
                        const radius = powerUp[i].circleRadius + 50
                        if (Vector.magnitudeSquared(Vector.sub(this.vertices[2], powerUp[i].position)) < radius * radius && !powerUp[i].isGrabbed) {
                            if (powerUp[i].name !== "heal" || origin.health !== origin.maxHealth /*|| tech.isOverHeal*/) {
                                powerUp[i].isGrabbed = true
                                this.caughtPowerUp = powerUp[i]
                                Matter.Body.setVelocity(powerUp[i], { x: 0, y: 0 })
                                Matter.Body.setPosition(powerUp[i], this.vertices[2])
                                powerUp[i].collisionFilter.category = 0
                                powerUp[i].collisionFilter.mask = 0
                                thrust *= 0.6
                                this.endCycle += 0.5 //it pulls back slower, so this prevents it from ending early
                                break //just pull 1 power up if possible
                            }
                        }
                    }
                }
            },
            do() {
                this.cycle++
                if (isReturn || target) {
                    if (isReturn) {
                        if (this.cycle > totalCycles) { //return to player  //|| !input.fire
                            this.do = this.returnToPlayer
                            if (this.angularSpeed < 0.5) this.torque += this.inertia * 0.001 * (Math.random() - 0.5) //(Math.round(Math.random()) ? 1 : -1)
                            Matter.Sleeping.set(this, false)
                            this.endCycle = simulation.cycle + 240
                            // const momentum = Vector.mult(Vector.sub(this.velocity, origin.velocity), (origin.crouch ? 0.00015 : 0.0003)) //recoil on jerking line
                            requestAnimationFrame(() => { //delay this for 1 cycle to get the proper hit graphics
                                this.collisionFilter.category = 0
                                this.collisionFilter.mask = 0
                            });
                        } else {
                            this.grabPowerUp()
                        }
                    }
                    if (target) { //rotate towards the target
                        const face = {
                            x: Math.cos(this.angle),
                            y: Math.sin(this.angle)
                        };
                        const vectorGoal = Vector.normalise(Vector.sub(this.position, target.position));
                        if (Vector.cross(vectorGoal, face) > 0) {
                            Matter.Body.rotate(this, this.turnRate);
                        } else {
                            Matter.Body.rotate(this, -this.turnRate);
                        }
                    }
                    this.force.x += thrust * this.mass * Math.cos(this.angle);
                    this.force.y += thrust * this.mass * Math.sin(this.angle);
                }
                this.draw()
            },
        }
    );
    bullet[me].multiplayer = true;
    if (!isReturn && !target) {
        Matter.Body.setVelocity(bullet[me], {
            x: origin.Vx / 2 + 600 * thrust * Math.cos(bullet[me].angle),
            y: origin.Vy / 2 + 600 * thrust * Math.sin(bullet[me].angle)
        });
        bullet[me].frictionAir = 0.002
        bullet[me].do = function () {
            if (this.speed < 20) this.force.y += 0.0005 * this.mass;
            this.draw();
        }
    }
    /*if (tech.isHarpoonPowerUp && simulation.cycle - 480 < tech.harpoonPowerUpCycle) { //8 seconds
        if (isReturn) {
            bullet[me].draw = function () {
                this.drawDamageAura()
                this.drawString()
            }
        } else {
            bullet[me].draw = function () {
                this.drawDamageAura()
            }
        }
    } else*/ if (isReturn) {
        bullet[me].draw = function () {
            this.drawString()
        }
    }
    Composite.add(engine.world, bullet[me]); //add bullet to world
}

b.multiplayerMissile = (where, angle, speed, size, endCycle, lookFrequency, explodeRad) => {
    // if (tech.isMissileBig) {
    //     size *= 1.55
    //     if (tech.isMissileBiggest) size *= 1.55
    // }
    const me = bullet.length;
    bullet[me] = Bodies.rectangle(where.x, where.y, 30 * size, 4 * size, {
        angle: angle,
        friction: 0.5,
        frictionAir: 0.045,
        dmg: 0, //damage done in addition to the damage from momentum
        classType: "bullet",
        endCycle,
        collisionFilter: {
            category: cat.bullet,
            mask: cat.map | cat.body | cat.mob | cat.mobBullet | cat.mobShield
        },
        minDmgSpeed: 10,
        lookFrequency,
        explodeRad,
        density: 0.02, //0.001 is normal
        beforeDmg() {
            Matter.Body.setDensity(this, 0.0001); //reduce density to normal
            this.tryToLockOn();
            this.endCycle = 0; //bullet ends cycle after doing damage  // also triggers explosion
        },
        onEnd() {
            // b.multiplayerExplosion(this.position, this.explodeRad * size); //makes bullet do explosive damage at end
            // if (tech.fragments) b.targetedNail(this.position, tech.fragments * Math.floor(2 + 1.5 * Math.random()))
        },
        lockedOn: null,
        tryToLockOn() {
            let closeDist = Infinity;
            const futurePos = Vector.add(this.position, Vector.mult(this.velocity, 30)) //look for closest target to where the missile will be in 30 cycles
            this.lockedOn = null;
            // const futurePos = this.lockedOn ? :Vector.add(this.position, Vector.mult(this.velocity, 50))
            for (let i = 0, len = mob.length; i < len; ++i) {
                if (
                    mob[i].alive && !mob[i].isBadTarget &&
                    Matter.Query.ray(map, this.position, mob[i].position).length === 0 &&
                    !mob[i].isInvulnerable
                ) {
                    const futureDist = Vector.magnitude(Vector.sub(futurePos, mob[i].position));
                    if (futureDist < closeDist) {
                        closeDist = futureDist;
                        this.lockedOn = mob[i];
                        // this.frictionAir = 0.04; //extra friction once a target it locked
                    }
                    if (Vector.magnitude(Vector.sub(this.position, mob[i].position) < this.explodeRad)) {
                        this.endCycle = 0; //bullet ends cycle after doing damage  //also triggers explosion
                        // mob[i].lockedOn.damage(m.dmgScale * 2 * size); //does extra damage to target
                    }
                }
            }
            //explode when bullet is close enough to target
            if (this.lockedOn && Vector.magnitude(Vector.sub(this.position, this.lockedOn.position)) < this.explodeRad) {
                this.endCycle = 0; //bullet ends cycle after doing damage  //also triggers explosion
                // this.lockedOn.damage(m.dmgScale * 4 * size); //does extra damage to target
            }
        },
        do() {
            if (!(m.cycle % this.lookFrequency)) this.tryToLockOn();
            if (this.lockedOn) { //rotate missile towards the target
                const face = {
                    x: Math.cos(this.angle),
                    y: Math.sin(this.angle)
                };
                const target = Vector.normalise(Vector.sub(this.position, this.lockedOn.position));
                const dot = Vector.dot(target, face)
                const aim = Math.min(0.08, (1 + dot) * 1)
                if (Vector.cross(target, face) > 0) {
                    Matter.Body.rotate(this, aim);
                } else {
                    Matter.Body.rotate(this, -aim);
                }
                this.frictionAir = Math.min(0.1, Math.max(0.04, 1 + dot)) //0.08; //extra friction if turning
            }
            //accelerate in direction bullet is facing
            const dir = this.angle;
            this.force.x += thrust * Math.cos(dir);
            this.force.y += thrust * Math.sin(dir);

            ctx.beginPath(); //draw rocket
            ctx.arc(this.position.x - Math.cos(this.angle) * (25 * size - 3) + (Math.random() - 0.5) * 4,
                this.position.y - Math.sin(this.angle) * (25 * size - 3) + (Math.random() - 0.5) * 4,
                11 * size, 0, 2 * Math.PI);
            ctx.fillStyle = "rgba(255,155,0,0.5)";
            ctx.fill();
        },
    });
    bullet[me].multiplayer = true;
    const thrust = 0.0066 * bullet[me].mass; //* (tech.isMissileBig ? (tech.isMissileBiggest ? 0.3 : 0.7) : 1);
    Matter.Body.setVelocity(bullet[me], {
        x: origin.Vx / 2 + speed * Math.cos(angle),
        y: origin.Vy / 2 + speed * Math.sin(angle)
    });
    Composite.add(engine.world, bullet[me]); //add bullet to world
}

b.multiplayerLasers = [];
b.multiplayerLaser = (where, whereEnd, dmg, reflections, isThickBeam, push) => {
    const reflectivity = 1 - 1 / (reflections * 3)
    let damage = m.dmgScale * dmg

    let best = {
        x: 1,
        y: 1,
        dist2: Infinity,
        who: null,
        v1: 1,
        v2: 1
    };
    const path = [{
        x: where.x,
        y: where.y
    }, {
        x: whereEnd.x,
        y: whereEnd.y
    }];

    const checkForCollisions = function () {
        best = vertexCollision(path[path.length - 2], path[path.length - 1], [mob, map, body]);
    };
    const laserHitMob = function () {
        if (best.who.alive) {
            best.who.locatePlayer();
            if (best.who.damageReduction) {
                if ( //iridescence
                    tech.laserCrit && !best.who.shield &&
                    Vector.dot(Vector.normalise(Vector.sub(best.who.position, path[path.length - 1])), Vector.normalise(Vector.sub(path[path.length - 1], path[path.length - 2]))) > 0.999 - 0.5 / best.who.radius
                ) {
                    damage *= 1 + tech.laserCrit
                    simulation.drawList.push({ //add dmg to draw queue
                        x: path[path.length - 1].x,
                        y: path[path.length - 1].y,
                        radius: Math.sqrt(2500 * damage * best.who.damageReduction) + 5,
                        color: `hsla(${60 + 283 * Math.random()},100%,70%,0.5)`, // random hue, but not red
                        time: 16
                    });
                } else {
                    simulation.drawList.push({ //add dmg to draw queue
                        x: path[path.length - 1].x,
                        y: path[path.length - 1].y,
                        radius: Math.sqrt(2000 * damage * best.who.damageReduction) + 2,
                        color: tech.laserColorAlpha,
                        time: simulation.drawTime
                    });
                }
                // best.who.damage(damage);
            }
            if (tech.isLaserPush) { //push mobs away
                const index = path.length - 1
                Matter.Body.setVelocity(best.who, { x: best.who.velocity.x * 0.97, y: best.who.velocity.y * 0.97 });
                const force = Vector.mult(Vector.normalise(Vector.sub(path[index], path[Math.max(0, index - 1)])), 0.003 * push * Math.min(6, best.who.mass))
                Matter.Body.applyForce(best.who, path[index], force)
            }
        } else if (tech.isLaserPush && best.who.classType === "body") {
            const index = path.length - 1
            Matter.Body.setVelocity(best.who, { x: best.who.velocity.x * 0.97, y: best.who.velocity.y * 0.97 });
            const force = Vector.mult(Vector.normalise(Vector.sub(path[index], path[Math.max(0, index - 1)])), 0.003 * push * Math.min(6, best.who.mass))
            Matter.Body.applyForce(best.who, path[index], force)
        }
    };
    const reflection = function () { // https://math.stackexchange.com/questions/13261/how-to-get-a-reflection-vector
        const n = Vector.perp(Vector.normalise(Vector.sub(best.v1, best.v2)));
        const d = Vector.sub(path[path.length - 1], path[path.length - 2]);
        const nn = Vector.mult(n, 2 * Vector.dot(d, n));
        const r = Vector.normalise(Vector.sub(d, nn));
        path[path.length] = Vector.add(Vector.mult(r, 3000), path[path.length - 1]);
    };

    checkForCollisions();
    let lastBestOdd
    let lastBestEven = best.who //used in hack below
    if (best.dist2 !== Infinity) { //if hitting something
        path[path.length - 1] = { x: best.x, y: best.y };
        laserHitMob();
        for (let i = 0; i < reflections; i++) {
            reflection();
            checkForCollisions();
            if (best.dist2 !== Infinity) { //if hitting something
                lastReflection = best
                path[path.length - 1] = { x: best.x, y: best.y };
                damage *= reflectivity
                laserHitMob();
                //I'm not clear on how this works, but it gets rid of a bug where the laser reflects inside a block, often vertically.
                //I think it checks to see if the laser is reflecting off a different part of the same block, if it is "inside" a block
                if (i % 2) {
                    if (lastBestOdd === best.who) break
                } else {
                    lastBestOdd = best.who
                    if (lastBestEven === best.who) break
                }
            } else {
                break
            }
        }
    }
    if (isThickBeam) {
        for (let i = 1, len = path.length; i < len; ++i) {
            ctx.moveTo(path[i - 1].x, path[i - 1].y);
            ctx.lineTo(path[i].x, path[i].y);
        }
    } else if (tech.isLaserLens && b.guns[11].lensDamage !== 1) {
        ctx.strokeStyle = tech.laserColor;
        ctx.lineWidth = 2
        ctx.lineDashOffset = 900 * Math.random()
        ctx.setLineDash([50 + 120 * Math.random(), 50 * Math.random()]);
        for (let i = 1, len = path.length; i < len; ++i) {
            ctx.beginPath();
            ctx.moveTo(path[i - 1].x, path[i - 1].y);
            ctx.lineTo(path[i].x, path[i].y);
            ctx.stroke();
            ctx.globalAlpha *= reflectivity; //reflections are less intense
        }
        ctx.setLineDash([]);
        // ctx.globalAlpha = 1;

        //glow
        ctx.lineWidth = 9 + 2 * b.guns[11].lensDamageOn
        ctx.globalAlpha = 0.13
        ctx.beginPath();
        for (let i = 1, len = path.length; i < len; ++i) {
            ctx.moveTo(path[i - 1].x, path[i - 1].y);
            ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
    } else {
        ctx.strokeStyle = "#f00"; //tech.laserColor;
        ctx.lineWidth = 2;
        // ctx.lineDashOffset = 900 * Math.random()
        // ctx.setLineDash([50 + 120 * Math.random(), 50 * Math.random()]);
        for (let i = 1, len = path.length; i < len; ++i) {
            ctx.beginPath();
            ctx.moveTo(path[i - 1].x, path[i - 1].y);
            ctx.lineTo(path[i].x, path[i].y);
            ctx.stroke();
            ctx.globalAlpha *= reflectivity; //reflections are less intense
        }
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
    }
}

(async () => {
    await new Promise((resolve, reject) => {
        const config = {
            iceServers: [
                {
                    urls: [
                        'stun:stun1.l.google.com:19302',
                        'stun:stun2.l.google.com:19302',
                    ],
                },
            ]
        }
        let peerRemote = new RTCPeerConnection(config);

        peerRemote.onconnectionstatechange = (e) => console.log('peerRemote', 'onconnectionstatechange', e)
        peerRemote.ondatachannel = (e) => {
            // peerLocal started a data channel, so connect to it here
            console.log('peerRemote', 'ondatachannel', e);
            window.dcRemote = e.channel;
            window.dcRemote.onopen = function(e) {
                console.log('dcRemote', 'onopen', e);
                console.log('dcRemote.send("message") to send from remote');
            };
            window.dcRemote.onmessage = async (message) => {
                // console.log('dcRemote', 'onmessage', message.data);
                const data = typeof message.data.arrayBuffer == 'function' ? new DataView(await message.data.arrayBuffer()) : new DataView(message.data);
                const id = new Uint8Array(data.buffer)[0];
                if (id == 0) {
                    // rotation
                    player1.mouseInGame.x = data.getFloat64(1);
                    player1.mouseInGame.y = data.getFloat64(9);
                }
                if (id == 1) {
                    // movement
                    player1.mouseInGame.x = data.getFloat64(1);
                    player1.mouseInGame.y = data.getFloat64(9);
                    player1.onGround = new Uint8Array(data.buffer)[17] == 1;
                    player1.pos.x = data.getFloat64(18);
                    player1.pos.y = data.getFloat64(26);
                    player1.Vx = data.getFloat64(34);
                    player1.Vy = data.getFloat64(42);
                    player1.walk_cycle = data.getFloat32(50);
                    player1.yOff = data.getFloat32(54);
                    if (player1.hitbox != null) {
                        Matter.Body.setPosition(player1.hitbox, { x: player1.pos.x, y: player1.pos.y + player1.yOff - 24.714076782448295});
                        Matter.Body.setVelocity(player1.hitbox, { x: player1.Vx, y: player1.Vy });
                    }
                }
                if (id == 2) {
                    // set field
                    player1.fieldMode = new Uint8Array(data.buffer)[1];
                    player1.fieldMeterColor = fieldData[player1.fieldMode].fieldMeterColor;
                    player1.fieldRange = fieldData[player1.fieldMode].fieldRange;
                    player1.fieldPosition = { x: player1.pos.x, y: player1.pos.y };
                    player1.fieldAngle = player1.angle;
                    player1.fieldArc = 0.2;
                }
                if (id == 3) {
                    // immune cycle update
                    player1.immuneCycle = data.getFloat32(1);
                }
                if (id == 4) {
                    // health update
                    if (data.getUint8(5) == 1) player1.health = data.getFloat32(1);
                    else {
                        m.health = data.getFloat32(1);
                        if (m.health > m.maxHealth) m.health = m.maxHealth;
                        m.displayHealth();
                    }
                }
                if (id == 5) {
                    // max health update
                    if (data.getUint8(5) == 1) player1.maxHealth = data.getFloat32(1);
                    else {
                        m.maxHealth = data.getFloat32(1);
                        document.getElementById("health-bg").style.width = `${Math.floor(300 * m.maxHealth)}px`;
                        if (m.health > m.maxHealth) m.health = m.maxHealth;
                        m.displayHealth();
                    }

                }
                if (id == 6) {
                    // energy update
                    if (data.getUint8(5) == 1) player1.energy = data.getFloat32(1);
                    else m.maxEnergy = data.getFloat32(1);
                }
                if (id == 7) {
                    // max energy update
                    if (data.getUint8(5) == 1) player1.maxEnergy = data.getFloat32(1);
                    else m.energy = data.getFloat32(1);
                }
                if (id == 8) {
                    // inputs
                    player1.input.up = new Uint8Array(data.buffer)[1] == 1;
                    player1.input.down = new Uint8Array(data.buffer)[2] == 1;
                    player1.input.left = new Uint8Array(data.buffer)[3] == 1;
                    player1.input.right = new Uint8Array(data.buffer)[4] == 1;
                    player1.input.field = new Uint8Array(data.buffer)[5] == 1;
                    player1.input.fire = new Uint8Array(data.buffer)[6] == 1;
                    if (!player1.input.fire) b.multiplayerLasers = b.multiplayerLasers.filter(a => a.id != 1);
                }
                if (id == 9) {
                    // toggle crouch
                    player1.crouch = new Uint8Array(data.buffer)[1] == 1;
                }
                if (id == 10) {
                    // toggle cloak
                    player1.isCloak = new Uint8Array(data.buffer)[1] == 1;
                }
                if (id == 12) {
                    // sync
                    simulation.difficultyMode = new Uint8Array(data.buffer)[1];
                    Math.initialSeed = new TextDecoder().decode(data.buffer.slice(3, new Uint8Array(data.buffer)[2] + 3));
                    Math.seed = Math.abs(Math.hash(Math.initialSeed));
                }
                if (id == 14) {
                    // block info
                    let found = false;
                    for (let i = 0; i < body.length && !found; i++) if (body[i].id == data.getUint16(1)) found = true;
                    if (!found) {
                        const me = body.length;
                        let vertices = '';
                        for (let i = 0; i < data.getUint8(19); i += 16) vertices += `${vertices == '' ? '' : ' '}${data.getFloat64(20 + i)} ${data.getFloat64(20 + i + 8)}`;
                        oldBodyVertex(data.getFloat64(3), data.getFloat64(11), vertices, {});
                        body[me].id = data.getUint16(1);
                        body[me].inertia = Infinity;

                    }
                }
                if (id == 15) {
                    // block position update
                    let found = false;
                    for (let i = 0; i < body.length && !found; i++) {
                        if (body[i].id == data.getUint16(1)) {
                            found = true;
                            Matter.Body.setPosition(body[i], { x: data.getFloat64(3), y: data.getFloat64(11) });
                            Matter.Body.setAngle(body[i], data.getFloat64(19));
                            Matter.Body.setVelocity(body[i], { x: data.getFloat64(27), y: data.getFloat64(35) });
                        }
                    }
                    if (!found) {
                        const newData = new Uint8Array(new ArrayBuffer(3));
                        newData[0] = 13;
                        const dataView = new DataView(newData.buffer);
                        dataView.setUint16(1, data.getUint16(1));
                        dcRemote.send(dataView);
                    }
                }
                if (id == 16) {
                    // explosion
                    b.multiplayerExplosion({ x: data.getFloat64(1), y: data.getFloat64(9) }, data.getFloat64(17), new TextDecoder().decode(data.buffer.slice(26, new Uint8Array(data.buffer)[25] + 26)));
                }
                if (id == 17) {
                    // pulse
                    b.multiplayerPulse(data.getFloat64(1), data.getFloat64(9), { x: data.getFloat64(17), y: data.getFloat64(25) });
                }
                if (id == 18) {
                    // grenade
                    b.multiplayerGrenade({ x: data.getFloat64(1), y: data.getFloat64(9) }, data.getFloat64(17), data.getFloat32(25), new Uint8Array(data.buffer)[31] == 1);
                }
                if (id == 19) {
                    // harpoon
                    b.multiplayerHarpoon({ x: data.getFloat64(1), y: data.getFloat64(9) }, data.getUint32(17), data.getFloat64(21), data.getUint16(29), new Uint8Array(data.buffer)[31] == 1, data.getFloat32(32), new Uint8Array(data.buffer)[36] == 1, data.getFloat64(37), data.getUint8(45));
                }
                if (id == 20) {
                    // missile
                    const me = bullet.length;
                    b.multiplayerMissile({ x: data.getFloat64(1), y: data.getFloat64(9) }, data.getFloat64(17), data.getFloat64(25), data.getUint16(33), data.getFloat32(35) + m.cycle, data.getFloat64(39), data.getFloat64(47))
                    bullet[me].force.x += data.getFloat64(55);
                    bullet[me].force.y += data.getFloat64(63);
                    console.log(bullet[me]);
                }
                if (id == 21) {
                    // hold block
                    player1.isHolding = data.getUint8(1) == 1;
                    if (!player1.isHolding && player1.holdingTarget) {
                        player1.holdingTarget.collisionFilter.category = cat.body;
                        player1.holdingTarget.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet;
                    }
                    player1.holdingTarget = data.getUint16(2) == -1 ? null : body.find(block => block.id == data.getUint16(2));
                    if (player1.isHolding) {
                        player1.holdingTarget.collisionFilter.category = 0;
                        player1.holdingTarget.collisionFilter.mask = 0;
                    }
                }
                if (id == 22) {
                    // throw charge update
                    player1.throwCharge = data.getFloat32(1);
                }
                if (id == 23) {
                    // laser
                    b.multiplayerLasers = b.multiplayerLasers.filter(a => a.id != data.getUint8(51));
                    b.multiplayerLasers.push({ id: data.getUint8(51), created: new Date(), where: { x: data.getFloat64(1), y: data.getFloat64(9) }, whereEnd: { x: data.getFloat64(17), y: data.getFloat64(25) }, dmg: data.getFloat64(33), reflections: data.getUint8(41), isThickBeam: data.getUint8(42) == 1, push: data.getFloat64(43) });
                }
                if (id == 24) {
                    // delete block
                    const index = body.findIndex(a => a.id == data.getUint16(1));
                    Matter.Composite.remove(engine.world, body[index]);
                    body = body.slice(0, index).concat(body.slice(index + 1));
                }
                if (id == 26) {
                    // powerup info
                    if (powerUp.find(a => a.id == data.getUint16(1)) == null) {
                        const me = powerUp.length;
                        oldPowerupSpawn(data.getFloat64(3), data.getFloat64(11), new TextDecoder().decode(data.buffer.slice(28, new Uint8Array(data.buffer)[27] + 28)));
                        powerUp[me].id = data.getUint16(1);
                        powerUp[me].size = data.getFloat64(19);
                        powerUp[me].collisionFilter.category = Number(data.getBigUint64(28 + data.getUint8(27)));
                        powerUp[me].collisionFilter.mask = Number(data.getBigUint64(36 + data.getUint8(27)));
                    }
                }
                if (id == 27) {
                    // powerup update
                    const powerup = powerUp.find(a => a.id == data.getUint16(1));
                    if (powerup == null) {
                        const newData = new Uint8Array(new ArrayBuffer(3));
                        newData[0] = 25;
                        const dataView = new DataView(newData.buffer);
                        dataView.setUint16(1, data.getUint16(1));
                        dcRemote.send(dataView);
                    } else {
                        Matter.Body.setPosition(powerup, { x: data.getFloat64(3), y: data.getFloat64(11) });
                        powerup.size = data.getFloat64(19);
                        powerup.collisionFilter.category = Number(data.getBigUint64(27));
                        powerup.collisionFilter.mask = Number(data.getBigUint64(35));
                    }
                }
                if (id == 28) {
                    // delete powerup
                    const index = powerUp.findIndex(a => a.id == data.getUint16(1));
                    Matter.Composite.remove(engine.world, powerUp[index]);
                    powerUp = powerUp.slice(0, index).concat(powerUp.slice(index + 1));
                }
                if (id == 30) {
                    // mob info
                    if (mob.find(a => a.id == data.getUint16(1)) == null) {
                        const me = mob.length;
                        mobs.spawn(data.getFloat64(4), data.getFloat64(12), data.getUint8(28), data.getFloat64(29), 'transparent');
                        mob[me].id = data.getUint16(1);
                        mob[me].mobType = data.getUint8(3);
                        Matter.Body.setAngle(mob[me], data.getFloat64(20));
                        const colorLength = data.getUint8(37);
                        mob[me].color = new TextDecoder().decode(data.buffer.slice(38, 38 + colorLength));
                        mob[me].alpha = data.getFloat32(38 + colorLength);
                        const strokeLength = data.getUint8(42 + colorLength);
                        mob[me].stroke = new TextDecoder().decode(data.buffer.slice(43 + colorLength, 43 + colorLength + strokeLength));
                        mob[me].isDropPowerUp = false;
                        mob[me].isShielded = data.getUint8(43 + colorLength + strokeLength) == 1;
                        mob[me].isUnblockable = data.getUint8(44 + colorLength + strokeLength) == 1;
                        mob[me].showHealthBar = data.getUint8(45 + colorLength + strokeLength) == 1;
                        mob[me].collisionFilter.category = Number(data.getBigUint64(46 + colorLength + strokeLength));
                        mob[me].collisionFilter.mask = Number(data.getBigUint64(54 + colorLength + strokeLength));
                        mob[me].isBoss = data.getUint8(62 + colorLength + strokeLength) == 1;
                        mob[me].isFinalBoss = data.getUint8(63 + colorLength + strokeLength) == 1;
                        mob[me].isInvulnerable = data.getUint8(64 + colorLength + strokeLength) == 1;
                        mob[me].isZombie = data.getUint8(65 + colorLength + strokeLength) == 1;
                        mob[me].isGrouper = data.getUint8(66 + colorLength + strokeLength) == 1;
                        mob[me].isMobBullet = data.getUint8(67 + colorLength + strokeLength) == 1;
                        mob[me].seePlayer.recall = data.getFloat64(68 + colorLength + strokeLength);
                        mob[me].health = data.getFloat64(76 + colorLength + strokeLength);
                        mob[me].radius = data.getFloat64(84 + colorLength + strokeLength);
                        mob[me].seePlayer.yes = data.getUint8(92 + colorLength + strokeLength) == 1;

                        mob[me].replace = () => {}
                        
                        switch (mob[me].mobType) {
                            case 21:
                                mob[me].eventHorizon = mob[me].radius * 30;
                                break;
                            case 22:
                                mob[me].eventHorizon = mob[me].radius * 30;
                                break;
                            case 25:
                                mob[me].laserRange = 370;
                                break;
                            case 26:
                                mob[me].warpIntensity = 0;
                                mob[me].laserRange = 350;
                                break;
                            case 27:
                                mob[me].laserPos = mob[me].position;
                                break;
                            case 28:
                                mob[me].accelMag = 0.0006 + 0.0007 * Math.sqrt(simulation.accelScale);
                                mob[me].flapRate = 0.3 + Math.floor(3 * Math.random()) / 10 + 100 * mob[me].accelMag;
                                mob[me].flapRadius = 75 + mob[me].radius * 3;
                                break;
                            case 29:
                                mob[me].flapRate = 0.06 + 0.03 * Math.random();
                                mob[me].flapRadius = 40 + mob[me].radius * 3;
                                break;
                            case 30:
                                mob[me].flapRate = 0.2;
                                mob[me].wingSize = 0;
                                mob[me].wingGoal = 250 + simulation.difficulty;
                                mob[me].seePlayerFreq = 13;
                                break;
                            case 33:
                                mob[me].delay = 55 + 35 * simulation.CDScale;
                                mob[me].nextBlinkCycle = me.delay;
                                break;
                            case 68:
                                // mob[me].pulseRadius = 
                                break;
                            case 70:
                                mob[me].eventHorizon = 0;
                                break;
                        }
                        mob[me].do = function() {
                            ctx.beginPath();
                            ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
                            for (let i = 1; i < this.vertices.length; i++) ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
                            const oldGlobalAlpha = ctx.globalAlpha;
                            ctx.globalAlpha = this.alpha**2;
                            ctx.lineTo(this.vertices[0].x, this.vertices[0].y);
                            ctx.fillStyle = this.color;
                            ctx.fill();
                            ctx.strokeStyle = this.stroke;
                            ctx.stroke();
                            ctx.globalAlpha = oldGlobalAlpha;

                            switch (this.mobType) {
                                case 0:
                                    const sub = Vector.sub(player.position, this.position)
                                    const mag = Vector.magnitude(sub);
                                    if (mag < this.radius) { //buff to player when inside radius
                                        //draw halo
                                        ctx.strokeStyle = 'rgba(80,120,200,0.2)';
                                        ctx.beginPath();
                                        ctx.arc(m.pos.x, m.pos.y, 36, 0, 2 * Math.PI);
                                        ctx.lineWidth = 10;
                                        ctx.stroke();
                                    }

                                    ctx.beginPath();
                                    ctx.arc(this.position.x, this.position.y, this.radius + 15, 0, 2 * Math.PI);
                                    ctx.strokeStyle = "#000"
                                    ctx.lineWidth = 1;
                                    ctx.stroke();

                                    //draw growing and fading out ring around the arc
                                    ctx.beginPath();
                                    const rate = 150
                                    const r = simulation.cycle % rate
                                    ctx.arc(this.position.x, this.position.y, 15 + this.radius + 0.3 * r, 0, 2 * Math.PI);
                                    ctx.strokeStyle = `rgba(0,0,0,${0.5 * Math.max(0, 1 - 1.4 * r / rate)})`
                                    ctx.stroke();
                                    break;
                                case 1:
                                    if ((player.speed > 1 && !m.isCloak)) { // TODO: activate if player1 moves
                                        setTimeout(() => {
                                            this.isAwake = true;
                                        }, 1000 * Math.random());
                                    }
                                    if (this.isAwake) {
                                        ctx.beginPath();
                                        ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
                                        ctx.fillStyle = `rgba(25,139,170,${0.2 + 0.12 * Math.random()})`;
                                        ctx.fill();
                                        this.radius = 100 * (1 + 0.25 * Math.sin(simulation.cycle * 0.03))
                                    }
                                    break;
                                case 5:
                                    ctx.beginPath();
                                    for (let i = 0, len = mob.length; i < len; i++) {
                                        if (mob[i].isGrouper && mob[i] != this && mob[i].isDropPowerUp) { //don't tether to self, bullets, shields, ...
                                            const distance2 = Vector.magnitudeSquared(Vector.sub(this.position, mob[i].position))
                                            if (distance2 < this.groupingRangeMax) {
                                                ctx.moveTo(this.position.x, this.position.y);
                                                ctx.lineTo(mob[i].position.x, mob[i].position.y);
                                            }
                                        }
                                    }
                                    ctx.strokeStyle = "#0ff";
                                    ctx.lineWidth = 1;
                                    ctx.stroke();
                                    break;
                                case 21:
                                    eventHorizon = this.eventHorizon * (0.93 + 0.17 * Math.sin(simulation.cycle * 0.011));
                                    ctx.beginPath();
                                    ctx.arc(this.position.x, this.position.y, eventHorizon * 0.25, 0, 2 * Math.PI);
                                    ctx.fillStyle = "rgba(0,0,0,0.9)";
                                    ctx.fill();
                                    ctx.beginPath();
                                    ctx.arc(this.position.x, this.position.y, eventHorizon * 0.55, 0, 2 * Math.PI);
                                    ctx.fillStyle = "rgba(0,0,0,0.5)";
                                    ctx.fill();
                                    ctx.beginPath();
                                    ctx.arc(this.position.x, this.position.y, eventHorizon, 0, 2 * Math.PI);
                                    ctx.fillStyle = "rgba(0,0,0,0.1)";
                                    ctx.fill();

                                    //when player is inside event horizon
                                    if (Vector.magnitude(Vector.sub(this.position, player.position)) < eventHorizon) {
                                        const angle = Math.atan2(player.position.y - this.position.y, player.position.x - this.position.x);
                                        //draw line to player
                                        ctx.beginPath();
                                        ctx.moveTo(this.position.x, this.position.y);
                                        ctx.lineTo(m.pos.x, m.pos.y);
                                        ctx.lineWidth = Math.min(60, this.radius * 2);
                                        ctx.strokeStyle = "rgba(0,0,0,0.5)";
                                        ctx.stroke();
                                        ctx.beginPath();
                                        ctx.arc(m.pos.x, m.pos.y, 40, 0, 2 * Math.PI);
                                        ctx.fillStyle = "rgba(0,0,0,0.3)";
                                        ctx.fill();
                                    }
                                    break;
                                case 22:
                                    eventHorizon = this.eventHorizon * (0.93 + 0.17 * Math.sin(simulation.cycle * 0.011));
                                    ctx.beginPath();
                                    ctx.arc(this.position.x, this.position.y, eventHorizon * 0.2, 0, 2 * Math.PI);
                                    ctx.fillStyle = "rgba(0,20,40,0.6)";
                                    ctx.fill();
                                    ctx.beginPath();
                                    ctx.arc(this.position.x, this.position.y, eventHorizon * 0.4, 0, 2 * Math.PI);
                                    ctx.fillStyle = "rgba(0,20,40,0.4)";
                                    ctx.fill();
                                    ctx.beginPath();
                                    ctx.arc(this.position.x, this.position.y, eventHorizon * 0.6, 0, 2 * Math.PI);
                                    ctx.fillStyle = "rgba(0,20,40,0.3)";
                                    ctx.fill();
                                    ctx.beginPath();
                                    ctx.arc(this.position.x, this.position.y, eventHorizon * 0.8, 0, 2 * Math.PI);
                                    ctx.fillStyle = "rgba(0,20,40,0.2)";
                                    ctx.fill();
                                    ctx.beginPath();
                                    ctx.arc(this.position.x, this.position.y, eventHorizon, 0, 2 * Math.PI);
                                    ctx.fillStyle = "rgba(0,0,0,0.05)";
                                    ctx.fill();
                                    //when player is inside event horizon
                                    if (Vector.magnitude(Vector.sub(this.position, player.position)) < eventHorizon) {
                                        const angle = Math.atan2(player.position.y - this.position.y, player.position.x - this.position.x);
                                        //draw line to player
                                        ctx.beginPath();
                                        ctx.moveTo(this.position.x, this.position.y);
                                        ctx.lineTo(m.pos.x, m.pos.y);
                                        ctx.lineWidth = Math.min(60, this.radius * 2);
                                        ctx.strokeStyle = "rgba(0,0,0,0.5)";
                                        ctx.stroke();
                                        ctx.beginPath();
                                        ctx.arc(m.pos.x, m.pos.y, 40, 0, 2 * Math.PI);
                                        ctx.fillStyle = "rgba(0,0,0,0.3)";
                                        ctx.fill();
                                    }
                                    break;
                                case 25:
                                    if (this.seePlayer.yes) {
                                        ctx.setLineDash([125 * Math.random(), 125 * Math.random()]);
                                        // ctx.lineDashOffset = 6*(simulation.cycle % 215);
                                        if (this.distanceToPlayer() < this.laserRange) {
                                            // if (m.immuneCycle < m.cycle) {
                                            //     m.damage(0.0003 * simulation.dmgScale);
                                            //     if (m.energy > 0.1) m.energy -= 0.003
                                            // }
                                            ctx.beginPath();
                                            ctx.moveTo(this.position.x, this.position.y);
                                            ctx.lineTo(m.pos.x, m.pos.y);
                                            ctx.lineTo(m.pos.x + (Math.random() - 0.5) * 3000, m.pos.y + (Math.random() - 0.5) * 3000);
                                            ctx.lineWidth = 2;
                                            ctx.strokeStyle = "rgb(255,0,170)";
                                            ctx.stroke();
                    
                                            ctx.beginPath();
                                            ctx.arc(m.pos.x, m.pos.y, 40, 0, 2 * Math.PI);
                                            ctx.fillStyle = "rgba(255,0,170,0.15)";
                                            ctx.fill();
                                        }
                                        ctx.beginPath();
                                        ctx.arc(this.position.x, this.position.y, this.laserRange * 0.9, 0, 2 * Math.PI);
                                        ctx.strokeStyle = "rgba(255,0,170,0.5)";
                                        ctx.lineWidth = 1;
                                        ctx.stroke();
                                        ctx.setLineDash([]);
                                        ctx.fillStyle = "rgba(255,0,170,0.03)";
                                        ctx.fill();
                                    }
                                    break;
                                case 26:
                                    if (this.seePlayer.recall || (!(simulation.cycle % this.seePlayerFreq) && this.distanceToPlayer2() < this.seeAtDistance2 && !m.isCloak)) {
                                        setTimeout(() => {
                                            this.isAwake = true;
                                            this.stroke = "rgba(205,0,255,0.5)";
                                            this.fill = "rgba(205,0,255,0.1)";
                                        }, 2000);
                                    }
                                    if (this.isAwake) {
                                        const h = this.radius * 0.3;
                                        const w = this.radius * 2;
                                        const x = this.position.x - w / 2;
                                        const y = this.position.y - w * 0.7;
                                        ctx.fillStyle = "rgba(100, 100, 100, 0.3)";
                                        ctx.fillRect(x, y, w, h);
                                        ctx.fillStyle = "rgba(150,0,255,0.7)";
                                        ctx.fillRect(x, y, w * this.health, h);

                                        //draw eye
                                        const unit = Vector.normalise(Vector.sub(m.pos, this.position))
                                        const eye = Vector.add(Vector.mult(unit, 15), this.position)
                                        ctx.beginPath();
                                        ctx.arc(eye.x, eye.y, 4, 0, 2 * Math.PI);
                                        ctx.moveTo(this.position.x + 20 * unit.x, this.position.y + 20 * unit.y);
                                        ctx.lineTo(this.position.x + 30 * unit.x, this.position.y + 30 * unit.y);
                                        ctx.strokeStyle = this.stroke;
                                        ctx.lineWidth = 2;
                                        ctx.stroke();

                                        ctx.setLineDash([125 * Math.random(), 125 * Math.random()]); //the dashed effect is not set back to normal, because it looks neat for how the player is drawn
                                        if (this.distanceToPlayer() < this.laserRange) {
                                            this.warpIntensity += 0.0004;
                                            requestAnimationFrame(() => {
                                                if (!simulation.paused && m.alive) {
                                                    ctx.transform(1, this.warpIntensity * (Math.random() - 0.5), this.warpIntensity * (Math.random() - 0.5), 1, 0, 0); //ctx.transform(Horizontal scaling. A value of 1 results in no scaling,  Vertical skewing,   Horizontal skewing,   Vertical scaling. A value of 1 results in no scaling,   Horizontal translation (moving),   Vertical translation (moving)) //https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setTransform
                                                }
                                            })
                                            ctx.beginPath();
                                            ctx.moveTo(eye.x, eye.y);
                                            ctx.lineTo(m.pos.x, m.pos.y);
                                            ctx.lineTo(m.pos.x + (Math.random() - 0.5) * 3000, m.pos.y + (Math.random() - 0.5) * 3000);
                                            ctx.lineWidth = 2;
                                            ctx.strokeStyle = "rgb(150,0,255)";
                                            ctx.stroke();
                                            ctx.beginPath();
                                            ctx.arc(m.pos.x, m.pos.y, 40, 0, 2 * Math.PI);
                                            ctx.fillStyle = "rgba(150,0,255,0.1)";
                                            ctx.fill();
                                        } else {
                                            this.warpIntensity = 0;
                                        }

                                        //several ellipses spinning about the same axis
                                        const rotation = simulation.cycle * 0.015
                                        const phase = simulation.cycle * 0.021
                                        ctx.lineWidth = 1;
                                        ctx.fillStyle = "rgba(150,0,255,0.05)"
                                        ctx.strokeStyle = "#70f"
                                        for (let i = 0, len = 6; i < len; i++) {
                                            ctx.beginPath();
                                            ctx.ellipse(this.position.x, this.position.y, this.laserRange * Math.abs(Math.sin(phase + i / len * Math.PI)), this.laserRange, rotation, 0, 2 * Math.PI);
                                            ctx.fill();
                                            ctx.stroke();
                                        }
                                    }
                                    break;
                                case 27:
                                    const dist2 = this.distanceToPlayer2();
                                    if (this.seePlayer.yes && dist2 < 4000000) {
                                        const rangeWidth = 2000; //this is sqrt of 4000000 from above if()
                                        //targeting laser will slowly move from the mob to the player's position
                                        this.laserPos = Vector.add(this.laserPos, Vector.mult(Vector.sub(player.position, this.laserPos), 0.1));
                                        let targetDist = Vector.magnitude(Vector.sub(this.laserPos, m.pos));
                                        const r = 12;
                                        ctx.beginPath();
                                        ctx.moveTo(this.position.x, this.position.y);
                                        if (targetDist < r + 16) {
                                            targetDist = r + 10;
                                            //charge at player
                                            const forceMag = this.accelMag * 40 * this.mass;
                                            const angle = Math.atan2(this.seePlayer.position.y - this.position.y, this.seePlayer.position.x - this.position.x);
                                        }
                                        if (dist2 > 80000) {
                                            const laserWidth = 0.002;
                                            let laserOffR = Vector.rotateAbout(this.laserPos, (targetDist - r) * laserWidth, this.position);
                                            let sub = Vector.normalise(Vector.sub(laserOffR, this.position));
                                            laserOffR = Vector.add(laserOffR, Vector.mult(sub, rangeWidth));
                                            ctx.lineTo(laserOffR.x, laserOffR.y);
                        
                                            let laserOffL = Vector.rotateAbout(this.laserPos, (targetDist - r) * -laserWidth, this.position);
                                            sub = Vector.normalise(Vector.sub(laserOffL, this.position));
                                            laserOffL = Vector.add(laserOffL, Vector.mult(sub, rangeWidth));
                                            ctx.lineTo(laserOffL.x, laserOffL.y);
                                            ctx.fillStyle = `rgba(0,0,255,${Math.max(0, 0.3 * r / targetDist)})`
                                            ctx.fill();
                                        }
                                    }
                                    break;
                                case 28:
                                    if (this.seePlayer.recall) {
                                        let flapArc = 0.7 //don't go past 1.57 for normal flaps
                                        ctx.fillStyle = `hsla(${160 + 40 * Math.random()}, 100%, ${25 + 25 * Math.random() * Math.random()}%, 0.2)`; //"rgba(0,235,255,0.3)";   // ctx.fillStyle = `hsla(44, 79%, 31%,0.4)`; //"rgba(0,235,255,0.3)";
                                        this.wing(this.angle + Math.PI / 2 + flapArc * Math.sin(simulation.cycle * this.flapRate), this.flapRadius);
                                        this.wing(this.angle - Math.PI / 2 - flapArc * Math.sin(simulation.cycle * this.flapRate), this.flapRadius);
                                    }
                                    break;
                                case 29:
                                    if (this.seePlayer.recall) {
                                        let flapArc = 0.8 //don't go past 1.57 for normal flaps
                                        ctx.fillStyle = `hsla(${160 + 40 * Math.random()}, 100%, ${25 + 25 * Math.random() * Math.random()}%, 0.2)`; //"rgba(0,235,255,0.3)";   // ctx.fillStyle = `hsla(44, 79%, 31%,0.4)`; //"rgba(0,235,255,0.3)";
                                        this.wing(this.angle + 2.1 + flapArc * Math.sin(simulation.cycle * this.flapRate), this.flapRadius);
                                        this.wing(this.angle - 2.1 - flapArc * Math.sin(simulation.cycle * this.flapRate), this.flapRadius);
                                        const seeRange = 550 + 35 * simulation.difficultyMode;
                                        if (this.distanceToPlayer() < seeRange) {
                                            best = {
                                                x: null,
                                                y: null,
                                                dist2: Infinity,
                                                who: null,
                                                v1: null,
                                                v2: null
                                            };
                                            const seeRangeRandom = seeRange - 200 - 150 * Math.random()
                                            const look = { x: this.position.x + seeRangeRandom * Math.cos(this.angle), y: this.position.y + seeRangeRandom * Math.sin(this.angle) };
                                            best = vertexCollision(this.position, look, m.isCloak ? [map, body] : [map, body, [playerBody, playerHead]]);

                                            // hitting player
                                            if ((best.who === playerBody || best.who === playerHead) && m.immuneCycle < m.cycle) {
                                                //draw damage
                                                ctx.fillStyle = this.color;
                                                ctx.beginPath();
                                                ctx.arc(best.x, best.y, 5 + dmg * 1500, 0, 2 * Math.PI);
                                                ctx.fill();
                                            }
                                            //draw beam
                                            const vertex = 3
                                            if (best.dist2 === Infinity) best = look;
                                            ctx.beginPath();
                                            ctx.moveTo(this.vertices[vertex].x, this.vertices[vertex].y);
                                            ctx.lineTo(best.x, best.y);
                                            ctx.strokeStyle = this.color;
                                            ctx.lineWidth = 2;
                                            ctx.setLineDash([50 + 120 * Math.random(), 50 * Math.random()]);
                                            ctx.stroke();
                                            ctx.setLineDash([]);
                                        }
                                    }
                                    break;
                                case 30:
                                    if (this.seePlayer.recall) {
                                        const flapArc = 0.7; //don't go past 1.57 for normal flaps
                                        this.wingSize = 0.97 * this.wingSize + 0.03 * this.wingGoal;
                                        ctx.fillStyle = this.fill = `hsla(${160 + 40 * Math.random()}, 100%, ${25 + 25 * Math.random() * Math.random()}%, 0.9)`; //"rgba(0,235,255,0.3)";   // ctx.fillStyle = `hsla(44, 79%, 31%,0.4)`; //"rgba(0,235,255,0.3)";
                                        this.wing(this.angle + Math.PI / 2 + flapArc * Math.sin(simulation.cycle * this.flapRate), this.wingSize, 0.5, 0.0012);
                                        this.wing(this.angle - Math.PI / 2 - flapArc * Math.sin(simulation.cycle * this.flapRate), this.wingSize, 0.5, 0.0012);
                                    } else this.wingSize *= 0.96;
                                    break;
                                case 33:
                                    ctx.beginPath();
                                    ctx.moveTo(this.vertices[1].x, this.vertices[1].y);
                                    ctx.lineTo(best.x, best.y);
                                    ctx.strokeStyle = "rgba(0,235,255,1)";
                                    ctx.lineWidth = 3
                                    ctx.stroke();
                                    if (this.targetingCount / this.targetingTime > 0.33) {
                                        ctx.strokeStyle = "rgba(0,235,255,0.45)";
                                        ctx.lineWidth = 10
                                        ctx.stroke();
                                        if (this.targetingCount / this.targetingTime > 0.66) {
                                            ctx.strokeStyle = "rgba(0,235,255,0.25)";
                                            ctx.lineWidth = 30
                                            ctx.stroke();
                                        }
                                    }
                                    break;
                                case 34:
                                    if (this.isFiring) {
                                        if (this.fireCycle > this.fireDelay) { //fire
                                            simulation.drawList.push({ //add dmg to draw queue
                                                x: this.fireTarget.x,
                                                y: this.fireTarget.y,
                                                radius: this.pulseRadius,
                                                color: "rgba(120,0,255,0.6)",
                                                time: simulation.drawTime
                                            });
                                            ctx.beginPath();
                                            ctx.moveTo(this.vertices[1].x, this.vertices[1].y)
                                            ctx.lineTo(this.fireTarget.x, this.fireTarget.y)
                                            ctx.lineWidth = 20;
                                            ctx.strokeStyle = "rgba(120,0,255,0.3)";
                                            ctx.stroke();
                                            ctx.lineWidth = 5;
                                            ctx.strokeStyle = "rgba(120,0,255,1)";
                                            ctx.stroke();
                                        } else { //delay before firing
                                            this.fireCycle++
                                            //draw explosion outline
                                            ctx.beginPath();
                                            ctx.arc(this.fireTarget.x, this.fireTarget.y, this.pulseRadius, 0, 2 * Math.PI); //* this.fireCycle / this.fireDelay
                                            ctx.fillStyle = "rgba(120,0,255,0.07)";
                                            ctx.fill();
                                            //draw path from mob to explosion
                                            ctx.beginPath();
                                            ctx.moveTo(this.vertices[1].x, this.vertices[1].y)
                                            ctx.lineTo(this.fireTarget.x, this.fireTarget.y)
                                            ctx.setLineDash([40 * Math.random(), 200 * Math.random()]);
                                            ctx.lineWidth = 2;
                                            ctx.strokeStyle = "rgba(120,0,255,0.3)";
                                            ctx.stroke();
                                            ctx.setLineDash([]);
                                        }
                                    }
                                    break;
                                case 35:
                                    if (this.seePlayer.recall) {
                                        if (this.isFiring) {
                                            if (this.fireCycle > this.fireDelay) { //fire
                                                if (!this.canSeeTarget()) return
                                                this.isFiring = false
                                                this.fireCycle = 0
                                                this.torque += (0.00002 + 0.0002 * Math.random()) * this.inertia * (Math.round(Math.random()) * 2 - 1) //randomly spin around after firing
                                                //is player in beam path
                                                if (Matter.Query.ray([player], this.fireTarget, this.position).length) {
                                                    unit = Vector.mult(Vector.normalise(Vector.sub(this.vertices[1], this.position)), this.distanceToPlayer() - 100)
                                                    this.fireTarget = Vector.add(this.vertices[1], unit)
                                                }
                                                simulation.drawList.push({ //add dmg to draw queue
                                                    x: this.fireTarget.x,
                                                    y: this.fireTarget.y,
                                                    radius: this.pulseRadius,
                                                    color: "rgba(255,0,100,0.6)",
                                                    time: simulation.drawTime
                                                });
                                                ctx.beginPath();
                                                ctx.moveTo(this.vertices[1].x, this.vertices[1].y)
                                                ctx.lineTo(this.fireTarget.x, this.fireTarget.y)
                                                ctx.lineWidth = 20;
                                                ctx.strokeStyle = "rgba(255,0,100,0.3)";
                                                ctx.stroke();
                                                ctx.lineWidth = 5;
                                                ctx.strokeStyle = "rgba(255,0,100,1)";
                                                ctx.stroke();
                                            } else { //delay before firing
                                                this.fireCycle++
                                                if (!(simulation.cycle % 3)) {
                                                    if (!this.canSeeTarget()) return //if can't see stop firing
                                                }
                                                //draw explosion outline
                                                ctx.beginPath();
                                                ctx.arc(this.fireTarget.x, this.fireTarget.y, this.pulseRadius, 0, 2 * Math.PI); //* this.fireCycle / this.fireDelay
                                                ctx.fillStyle = "rgba(255,0,100,0.07)";
                                                ctx.fill();
                                                //draw path from mob to explosion
                                                ctx.beginPath();
                                                ctx.moveTo(this.vertices[1].x, this.vertices[1].y)
                                                ctx.lineTo(this.fireTarget.x, this.fireTarget.y)
                                                ctx.setLineDash([40 * Math.random(), 200 * Math.random()]);
                                                ctx.lineWidth = 2;
                                                ctx.strokeStyle = "rgba(255,0,100,0.3)";
                                                ctx.stroke();
                                                ctx.setLineDash([]);
                                            }
                                        }
                                    }
                                    break;
                                case 41:
                                    if (this.cd < simulation.cycle && this.seePlayer.recall) {
                                        this.cd = simulation.cycle + this.delay;
                                        ctx.beginPath();
                                        ctx.moveTo(this.position.x, this.position.y);
                                        ctx.lineTo(this.position.x, this.position.y);
                                        ctx.lineWidth = this.radius * 2.1;
                                        ctx.strokeStyle = this.fill; //"rgba(0,0,0,0.5)"; //'#000'
                                        ctx.stroke();
                                    }
                                    break;
                                case 53:
                                    if (this.alpha > 0) {
                                        //draw body
                                        ctx.beginPath();
                                        const vertices = this.vertices;
                                        ctx.moveTo(vertices[0].x, vertices[0].y);
                                        for (let j = 1, len = vertices.length; j < len; ++j) ctx.lineTo(vertices[j].x, vertices[j].y);
                                        ctx.lineTo(vertices[0].x, vertices[0].y);
                                        ctx.fillStyle = `rgba(0,0,0,${this.alpha * this.alpha})`;
                                        ctx.fill();
                                    }
                                    break;
                                case 54:
                                    if (this.alpha > 0) {
                                        //draw body
                                        ctx.beginPath();
                                        const vertices = this.vertices;
                                        ctx.moveTo(vertices[0].x, vertices[0].y);
                                        for (let j = 1, len = vertices.length; j < len; ++j) {
                                            ctx.lineTo(vertices[j].x, vertices[j].y);
                                        }
                                        ctx.lineTo(vertices[0].x, vertices[0].y);
                                        ctx.fillStyle = `rgba(0,0,0,${this.alpha * this.alpha})`;
                                        ctx.fill();
                                    }
                                    break;
                                case 55:
                                    if (this.alpha > 0) {
                                        //draw body
                                        ctx.beginPath();
                                        const vertices = this.vertices;
                                        ctx.moveTo(vertices[0].x, vertices[0].y);
                                        for (let j = 1, len = vertices.length; j < len; ++j) ctx.lineTo(vertices[j].x, vertices[j].y);
                                        ctx.lineTo(vertices[0].x, vertices[0].y);
                                        // ctx.lineWidth = 1;
                                        ctx.fillStyle = `rgba(255,255,255,${this.alpha * this.alpha})`;
                                        ctx.fill();
                                    }
                                    break;
                                case 61:
                                    if (this.alpha > 0) {
                                        //draw body
                                        ctx.beginPath();
                                        const vertices = this.vertices;
                                        ctx.moveTo(vertices[0].x, vertices[0].y);
                                        for (let j = 1, len = vertices.length; j < len; ++j) {
                                            ctx.lineTo(vertices[j].x, vertices[j].y);
                                        }
                                        ctx.lineTo(vertices[0].x, vertices[0].y);
                                        ctx.fillStyle = `rgba(25,0,50,${this.alpha * this.alpha})`;
                                        ctx.fill();
                                    }
                                    break;
                                case 68:
                                    ctx.beginPath(); //draw explosion outline
                                    ctx.arc(this.position.x, this.position.y, this.pulseRadius * (1.01 - this.timeLeft / this.lifeSpan), 0, 2 * Math.PI); //* this.fireCycle / this.fireDelay
                                    ctx.fillStyle = "rgba(255,0,220,0.05)";
                                    ctx.fill();
                                    break;
                                case 69:
                                    ctx.beginPath(); //draw cycle timer
                                    ctx.moveTo(this.vertices[this.vertices.length - 1].x, this.vertices[this.vertices.length - 1].y)
                                    const phase = (this.vertices.length + 1) * this.cycle / this.maxCycles
                                    if (phase > 1) ctx.lineTo(this.vertices[0].x, this.vertices[0].y)
                                    for (let i = 1; i < phase - 1; i++) {
                                        ctx.lineTo(this.vertices[i].x, this.vertices[i].y)
                                    }
                                    ctx.lineWidth = 5
                                    ctx.strokeStyle = "rgb(255,255,255)"
                                    ctx.stroke();

                                    this.cycle++
                                    if (this.cycle > this.maxCycles) {
                                        this.cycle = 0
                                        ctx.beginPath();
                                        for (let i = 0; i < mob.length; i++) {
                                            if (!mob[i].isShielded && !mob[i].shield && mob[i].isDropPowerUp && mob[i].alive && !mob[i].isBoss) {
                                                ctx.moveTo(this.position.x, this.position.y)
                                                ctx.lineTo(mob[i].position.x, mob[i].position.y)
                                            }
                                        }
                                        ctx.lineWidth = 20
                                        ctx.strokeStyle = "rgb(200,200,255)"
                                        ctx.stroke();
                                    }
                                    break;
                                case 70:
                                    this.eventHorizon = 950 + 250 * Math.sin(simulation.cycle * 0.005);
                                    if (!simulation.isTimeSkipping) {
                                        if (Vector.magnitude(Vector.sub(this.position, m.pos)) < this.eventHorizon) {
                                            ctx.beginPath();
                                            ctx.arc(this.position.x, this.position.y, this.eventHorizon, 0, 2 * Math.PI);
                                            ctx.fillStyle = "#fff";
                                            ctx.globalCompositeOperation = "destination-in"; //in or atop
                                            ctx.fill();
                                            ctx.globalCompositeOperation = "source-over";
                                            ctx.beginPath();
                                            ctx.arc(this.position.x, this.position.y, this.eventHorizon, 0, 2 * Math.PI);
                                            ctx.clip();
                                        } else {
                                            requestAnimationFrame(() => {
                                                simulation.camera();
                                                ctx.beginPath(); //gets rid of already draw shapes
                                                ctx.arc(this.position.x, this.position.y, this.eventHorizon, 0, 2 * Math.PI, false); //part you can't see
                                                ctx.fillStyle = document.body.style.backgroundColor;
                                                ctx.fill();
                                                ctx.restore();
                                            })
                                        }
                                    }
                                    break;
                            }
                        };
                    }
                }
                if (id == 31) {
                    // mob position update
                    const newMob = mob.find(a => a.id == data.getUint16(1));
                    if (newMob == null) {
                        const newData = new Uint8Array(new ArrayBuffer(3));
                        newData[0] = 29;
                        const dataView = new DataView(newData.buffer);
                        dataView.setUint16(1, data.getUint16(1));
                        dcRemote.send(dataView);
                    } else {
                        Matter.Body.setPosition(newMob, { x: data.getFloat64(3), y: data.getFloat64(11) });
                        Matter.Body.setAngle(newMob, data.getFloat64(19));
                    }
                }
                if (id == 32) {
                    // mob vertex update
                    const newMob = mob.find(a => a.id == data.getUint16(1));
                    if (newMob == null) {
                        const newData = new Uint8Array(new ArrayBuffer(3));
                        newData[0] = 29;
                        const dataView = new DataView(newData.buffer);
                        dataView.setUint16(1, data.getUint16(1));
                        dcRemote.send(dataView);
                    } else {
                        const newVertices = [];
                        for (let i = 3; i < data.byteLength; i += 16) newVertices.push({ x: data.getFloat64(i), y: data.getFloat64(i + 8) });
                        Matter.Body.setVertices(newMob, newVertices)
                    }
                }
                if (id == 33) {
                    // mob color update
                    const newMob = mob.find(a => a.id == data.getUint16(1));
                    if (newMob == null) {
                        const newData = new Uint8Array(new ArrayBuffer(3));
                        newData[0] = 29;
                        const dataView = new DataView(newData.buffer);
                        dataView.setUint16(1, data.getUint16(1));
                        dcRemote.send(dataView);
                    } else {
                        const colorLength = data.getUint8(3);
                        newMob.color = new TextDecoder().decode(data.buffer.slice(4, 4 + colorLength));
                        newMob.alpha = data.getFloat32(4 + data.getUint8(3));
                        const strokeLength = data.getUint8(8 + colorLength);
                        newMob.stroke = new TextDecoder().decode(data.buffer.slice(9 + colorLength, 9 + colorLength + strokeLength));
                    }
                }
                if (id == 34) {
                    // delete mob
                    const index = mob.findIndex(a => a.id == data.getUint16(1));
                    if (index != -1) {
                        if (mob[index].mobType == 26) {
                            requestAnimationFrame(() => {
                                requestAnimationFrame(() => {
                                    ctx.setTransform(1, 0, 0, 1, 0, 0); //reset warp effect
                                    ctx.setLineDash([]) //reset stroke dash effect
                                })
                            })
                        }
                        // mob[index].removeConsBB();
                        // mob[index].alive = false;
                        Matter.Composite.remove(engine.world, mob[index]);
                        mob = mob.slice(0, index).concat(mob.slice(index + 1));
                    }
                }
                if (id == 35) {
                    // block vertex update
                    const block = body.find(a => a.id == data.getUint16(1));
                    if (block == null) {
                        const newData = new Uint8Array(new ArrayBuffer(3));
                        newData[0] = 13;
                        const dataView = new DataView(newData.buffer);
                        dataView.setUint16(1, data.getUint16(1));
                        dcRemote.send(dataView);
                    } else {
                        const newVertices = [];
                        for (let i = 3; i < data.byteLength; i += 16) newVertices.push({ x: data.getFloat64(i), y: data.getFloat64(i + 8) });
                        Matter.Body.setVertices(block, newVertices)
                    }
                }
                if (id == 36) {
                    // mob property update
                    const newMob = mob.find(a => a.id == data.getUint16(1));
                    if (newMob == null) {
                        const newData = new Uint8Array(new ArrayBuffer(3));
                        newData[0] = 29;
                        const dataView = new DataView(newData.buffer);
                        dataView.setUint16(1, data.getUint16(1));
                        dcRemote.send(dataView);
                    } else {
                        newMob.isShielded = data.getUint8(3) == 1;
                        newMob.isUnblockable = data.getUint8(4) == 1;
                        newMob.showHealthBar = data.getUint8(5) == 1;
                        newMob.collisionFilter.category = Number(data.getBigUint64(6));
                        newMob.collisionFilter.mask = Number(data.getBigUint64(14));
                        newMob.isBoss = data.getUint8(22) == 1;
                        newMob.isFinalBoss = data.getUint8(23) == 1;
                        newMob.isInvulnerable = data.getUint8(24) == 1;
                        newMob.isZombie = data.getUint8(25) == 1;
                        newMob.isGrouper = data.getUint8(26) == 1;
                        newMob.isMobBullet = data.getUint8(27) == 1;
                        newMob.seePlayer.recall = data.getFloat64(28);
                        newMob.health = data.getFloat64(36);
                        newMob.radius = data.getFloat64(44);
                        newMob.seePlayer.yes = data.getUint8(52) == 1;
                    }
                }
            };
            window.dcRemote.onerror = function(e) {
                console.error('dcRemote', 'onerror', e);
            };
            window.dcRemote.onclose = function(e) {
                console.log('dcRemote', 'onclose', e);
            };

        };
        peerRemote.onsignalingstatechange = (e) => {
            console.log('peerRemote', 'onsignalingstatechange', peerRemote.signalingState);
            if (peerRemote.iceGatheringState == 'complete') ws.close();
        };
        peerRemote.onicegatheringstatechange = (e) => console.log('peerRemote', 'onicegatheringstatechange', peerRemote.iceGatheringState);
        peerRemote.onicecandidate = (e) => {
            // share ICE candidates with peerLocal
            console.log('peerRemote', 'onicecandidate', e);
            if (e.candidate != null) ws.send(`\x01${JSON.stringify(e.candidate)}`);
        }
        peerRemote.onnegotiationneeded = (e) => console.log('peerRemote', 'onnegotiationneeded', e);

        ws = new WebSocket('ws://localhost' /*'wss://n-gon.cornbread2100.com'*/);
        ws.onopen = async () => {
            console.log('connected');
            ws.send(`\x01${prompt('Join code:')}`)
        }
        ws.onmessage = async (message) => {
            console.log('message:', message.data, message.data[0] == '\x01')

            if (message.data[0] == '\x00') {
                const peerLocalOffer = new RTCSessionDescription(JSON.parse(message.data.substring(1)));
                console.log('peerRemote', 'setRemoteDescription', peerLocalOffer);
                await peerRemote.setRemoteDescription(peerLocalOffer);

                console.log('peerRemote', 'setRemoteDescription');
                let peerRemoteAnswer = await peerRemote.createAnswer();

                console.log('peerRemote', 'setLocalDescription', peerRemoteAnswer);
                await peerRemote.setLocalDescription(peerRemoteAnswer);
                ws.send(`\x01${JSON.stringify(peerRemoteAnswer)}`);
            }
            if (message.data[0] == '\x01') peerRemote.addIceCandidate(new RTCIceCandidate(JSON.parse(message.data.substring(1))));
            if (message.data[0] == '\x02') console.error(message.data.substring(1));
        }
        ws.onerror = (err) => {
            console.error(err);
        }
        ws.onclose = () => {
            console.log('Signaling complete');
            resolve();
        }
    })

    const fieldData = [
        {
            // field emitter
            drawField: () => {
                if (player1.holdingTarget) {
                    ctx.fillStyle = "rgba(110,170,200," + (m.energy * (0.05 + 0.05 * Math.random())) + ")";
                    ctx.strokeStyle = "rgba(110, 200, 235, " + (0.3 + 0.08 * Math.random()) + ")";
                } else {
                    ctx.fillStyle = "rgba(110,170,200," + (0.02 + player1.energy * (0.15 + 0.15 * Math.random())) + ")";
                    ctx.strokeStyle = "rgba(110, 200, 235, " + (0.6 + 0.2 * Math.random()) + ")";
                }
                ctx.fillStyle = "rgba(110,170,200," + (0.02 + player1.energy * (0.15 + 0.15 * Math.random())) + ")";
                ctx.strokeStyle = "rgba(110, 200, 235, " + (0.6 + 0.2 * Math.random()) + ")";
                const range = player1.fieldRange;
                ctx.beginPath();
                ctx.arc(player1.pos.x, player1.pos.y, range, player1.angle - Math.PI * player1.fieldArc, player1.angle + Math.PI * player1.fieldArc, false);
                ctx.lineWidth = 2;
                ctx.stroke();
                let eye = 13;
                let aMag = 0.75 * Math.PI * player1.fieldArc
                let a = player1.angle + aMag
                let cp1x = player1.pos.x + 0.6 * range * Math.cos(a)
                let cp1y = player1.pos.y + 0.6 * range * Math.sin(a)
                ctx.quadraticCurveTo(cp1x, cp1y, player1.pos.x + eye * Math.cos(player1.angle), player1.pos.y + eye * Math.sin(player1.angle))
                a = player1.angle - aMag
                cp1x = player1.pos.x + 0.6 * range * Math.cos(a)
                cp1y = player1.pos.y + 0.6 * range * Math.sin(a)
                ctx.quadraticCurveTo(cp1x, cp1y, player1.pos.x + 1 * range * Math.cos(player1.angle - Math.PI * player1.fieldArc), player1.pos.y + 1 * range * Math.sin(player1.angle - Math.PI * player1.fieldArc))
                ctx.fill();
        
                //draw random lines in field for cool effect
                let offAngle = player1.angle + 1.7 * Math.PI * player1.fieldArc * (Math.random() - 0.5);
                ctx.beginPath();
                eye = 15;
                ctx.moveTo(player1.pos.x + eye * Math.cos(player1.angle), player1.pos.y + eye * Math.sin(player1.angle));
                ctx.lineTo(player1.pos.x + range * Math.cos(offAngle), player1.pos.y + range * Math.sin(offAngle));
                ctx.strokeStyle = "rgba(120,170,255,0.6)";
                ctx.lineWidth = 1;
                ctx.stroke();
            },
            fieldMeterColor: '#0cf',
            fieldRange: 155,
            fieldRegen: 0.00067
        },
        {
            // standing wave
            drawField: () => {
                player1.harmonicRadius = 1; // TODO: changes with expansion tech
                const fieldRange1 = (0.75 + 0.3 * Math.sin(m.cycle / 23)) * player1.fieldRange * player1.harmonicRadius
                const fieldRange2 = (0.68 + 0.37 * Math.sin(m.cycle / 37)) * player1.fieldRange * player1.harmonicRadius
                const fieldRange3 = (0.7 + 0.35 * Math.sin(m.cycle / 47)) * player1.fieldRange * player1.harmonicRadius
                const netFieldRange = Math.max(fieldRange1, fieldRange2, fieldRange3)
                ctx.fillStyle = "rgba(110,170,200," + Math.min(0.6, (0.04 + 0.7 * player1.energy * (0.1 + 0.11 * Math.random()))) + ")";
                ctx.beginPath();
                ctx.arc(player1.pos.x, player1.pos.y, fieldRange1, 0, 2 * Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(player1.pos.x, player1.pos.y, fieldRange2, 0, 2 * Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(player1.pos.x, player1.pos.y, fieldRange3, 0, 2 * Math.PI);
                ctx.fill();
            },
            fieldMeterColor: '#0cf',
            fieldRange: 185,
            fieldRegen: 0.001
        },
        {
            // perfect diamagnetism
            drawField: () => {
                const wave = Math.sin(m.cycle * 0.022);
                player1.fieldRange = 180 + 12 * wave; // TODO: changes with Miessner Effect tech
                player1.fieldArc = 0.35 + 0.045 * wave; // TODO: changes with Miessner Effect tech
                if (player1.input.field) {
                    player1.fieldPosition = { x: player1.pos.x, y: player1.pos.y };
                    player1.fieldAngle = player1.angle;
                    ctx.fillStyle = `rgba(110,150,220, ${0.27 + 0.2 * Math.random() - 0.1 * wave})`
                    ctx.strokeStyle = `rgba(110,150,220, ${0.4 + 0.5 * Math.random()})`
                    ctx.beginPath();
                    ctx.arc(player1.pos.x, player1.pos.y, player1.fieldRange, player1.angle - Math.PI * player1.fieldArc, player1.angle + Math.PI * player1.fieldArc, false);
                    ctx.lineWidth = 2.5 - 1.5 * wave;
                    ctx.stroke();
                    const curve = 0.57 + 0.04 * wave
                    const aMag = (1 - curve * 1.2) * Math.PI * player1.fieldArc
                    let a = player1.angle + aMag
                    let cp1x = player1.pos.x + curve * player1.fieldRange * Math.cos(a)
                    let cp1y = player1.pos.y + curve * player1.fieldRange * Math.sin(a)
                    ctx.quadraticCurveTo(cp1x, cp1y, player1.pos.x + 30 * Math.cos(player1.angle), player1.pos.y + 30 * Math.sin(player1.angle))
                    a = player1.angle - aMag
                    cp1x = player1.pos.x + curve * player1.fieldRange * Math.cos(a)
                    cp1y = player1.pos.y + curve * player1.fieldRange * Math.sin(a)
                    ctx.quadraticCurveTo(cp1x, cp1y, player1.pos.x + 1 * player1.fieldRange * Math.cos(player1.angle - Math.PI * player1.fieldArc), player1.pos.y + 1 * player1.fieldRange * Math.sin(player1.angle - Math.PI * player1.fieldArc))
                    ctx.fill();
                } else {
                    ctx.fillStyle = `rgba(110,150,220, ${0.27 + 0.2 * Math.random() - 0.1 * wave})`
                    ctx.strokeStyle = `rgba(110,180,255, ${0.4 + 0.5 * Math.random()})`
                    ctx.beginPath();
                    ctx.arc(player1.fieldPosition.x, player1.fieldPosition.y, player1.fieldRange, player1.fieldAngle - Math.PI * player1.fieldArc, player1.fieldAngle + Math.PI * player1.fieldArc, false);
                    ctx.lineWidth = 2.5 - 1.5 * wave;
                    ctx.stroke();
                    const curve = 0.8 + 0.06 * wave
                    const aMag = (1 - curve * 1.2) * Math.PI * player1.fieldArc
                    let a = player1.fieldAngle + aMag
                    ctx.quadraticCurveTo(player1.fieldPosition.x + curve * player1.fieldRange * Math.cos(a), player1.fieldPosition.y + curve * player1.fieldRange * Math.sin(a), player1.fieldPosition.x + 1 * player1.fieldRange * Math.cos(player1.fieldAngle - Math.PI * player1.fieldArc), player1.fieldPosition.y + 1 * player1.fieldRange * Math.sin(player1.fieldAngle - Math.PI * player1.fieldArc))
                    ctx.fill();
                }
            },
            fieldMeterColor: '#48f',
            fieldRange: 180,
            fieldRegen: 0.000833
        },
        {
            // negative mass
            drawField: () => {
                if (player1.input.field) {
                    player1.FxAir = 0.016;
                    if (player1.input.down) player1.fieldDrawRadius = player1.fieldDrawRadius * 0.97 + 400 * 0.03;
                    else if (player1.input.up) player1.fieldDrawRadius = player1.fieldDrawRadius * 0.97 + 850 * 0.03;
                    else player1.fieldDrawRadius = player1.fieldDrawRadius * 0.97 + 650 * 0.03;
                    ctx.beginPath();
                    ctx.arc(player1.pos.x, player1.pos.y, player1.fieldDrawRadius, 0, 2 * Math.PI);
                    ctx.fillStyle = "#f5f5ff";
                    ctx.globalCompositeOperation = "difference";
                    ctx.fill();
                    ctx.globalCompositeOperation = "source-over";

                    // effect on player
                    player1.FxAir = 0.005
                    const dist = Math.sqrt((player1.pos.x - m.pos.x) * (player1.pos.x - m.pos.x) + (player1.pos.y - m.pos.y) * (player1.pos.y - m.pos.y));
                    if (dist < player1.fieldDrawRadius) {
                        if (player1.input.down) player.force.y -= 0.5 * player.mass * simulation.g;
                        else if (player1.input.up) player.force.y -= 1.45 * player.mass * simulation.g;
                        else player.force.y -= 1.07 * player.mass * simulation.g;
                    }
                } else player1.fieldDrawRadius = 0;
            },
            fieldMeterColor: '#333',
            fieldRange: 155,
            fieldRegen: 0.001
        },
        {
            // molecular assembler
            drawField: () => {
                ctx.fillStyle = "rgba(110,170,200," + (0.02 + player1.energy * (0.15 + 0.15 * Math.random())) + ")";
                ctx.strokeStyle = "rgba(110, 200, 235, " + (0.6 + 0.2 * Math.random()) + ")";
                const range = player1.fieldRange;
                ctx.beginPath();
                ctx.arc(player1.pos.x, player1.pos.y, range, player1.angle - Math.PI * player1.fieldArc, player1.angle + Math.PI * player1.fieldArc, false);
                ctx.lineWidth = 2;
                ctx.stroke();
                let eye = 13;
                let aMag = 0.75 * Math.PI * player1.fieldArc
                let a = player1.angle + aMag
                let cp1x = player1.pos.x + 0.6 * range * Math.cos(a)
                let cp1y = player1.pos.y + 0.6 * range * Math.sin(a)
                ctx.quadraticCurveTo(cp1x, cp1y, player1.pos.x + eye * Math.cos(player1.angle), player1.pos.y + eye * Math.sin(player1.angle))
                a = player1.angle - aMag
                cp1x = player1.pos.x + 0.6 * range * Math.cos(a)
                cp1y = player1.pos.y + 0.6 * range * Math.sin(a)
                ctx.quadraticCurveTo(cp1x, cp1y, player1.pos.x + 1 * range * Math.cos(player1.angle - Math.PI * player1.fieldArc), player1.pos.y + 1 * range * Math.sin(player1.angle - Math.PI * player1.fieldArc))
                ctx.fill();
        
                //draw random lines in field for cool effect
                let offAngle = player1.angle + 1.7 * Math.PI * player1.fieldArc * (Math.random() - 0.5);
                ctx.beginPath();
                eye = 15;
                ctx.moveTo(player1.pos.x + eye * Math.cos(player1.angle), player1.pos.y + eye * Math.sin(player1.angle));
                ctx.lineTo(player1.pos.x + range * Math.cos(offAngle), player1.pos.y + range * Math.sin(offAngle));
                ctx.strokeStyle = "rgba(120,170,255,0.6)";
                ctx.lineWidth = 1;
                ctx.stroke();
            },
            fieldMeterColor: '#ff0',
            fieldRange: 155,
            fieldRegen: 0.002
        },
        {
            // plasma torch
            drawField: () => {
                let range = 120 + (player1.crouch ? 400 : 300) * Math.sqrt(Math.random()) // TODO: can change with tech
                const path = [
                    {
                        x: player1.pos.x + 20 * Math.cos(player1.angle),
                        y: player1.pos.y + 20 * Math.sin(player1.angle)
                    },
                    {
                        x: player1.pos.x + range * Math.cos(player1.angle),
                        y: player1.pos.y + range * Math.sin(player1.angle)
                    }
                ];
                //check for collisions
                let best = {
                    x: null,
                    y: null,
                    dist2: Infinity,
                    who: null,
                    v1: null,
                    v2: null
                };
                best = vertexCollision(path[0], path[1], [mob, map, body]);
                if (best.dist2 != Infinity) { //if hitting something
                    path[path.length - 1] = { x: best.x, y: best.y };
                }

                //draw blowtorch laser beam
                ctx.strokeStyle = "rgba(255,0,255,0.1)"
                ctx.lineWidth = 14
                ctx.beginPath();
                ctx.moveTo(path[0].x, path[0].y);
                ctx.lineTo(path[1].x, path[1].y);
                ctx.stroke();
                ctx.strokeStyle = "#f0f";
                ctx.lineWidth = 2
                ctx.stroke();

                //draw electricity
                const Dx = Math.cos(player1.angle);
                const Dy = Math.sin(player1.angle);
                let x = player1.pos.x + 20 * Dx;
                let y = player1.pos.y + 20 * Dy;
                ctx.beginPath();
                ctx.moveTo(x, y);
                const step = Vector.magnitude(Vector.sub(path[0], path[1])) / 10
                for (let i = 0; i < 8; i++) {
                    x += step * (Dx + 1.5 * (Math.random() - 0.5))
                    y += step * (Dy + 1.5 * (Math.random() - 0.5))
                    ctx.lineTo(x, y);
                }
                ctx.lineWidth = 2 * Math.random();
                ctx.stroke();
            },
            fieldMeterColor: '#f0f',
            fieldRange: 155,
            fieldRegen: 0.001667
        },
        {
            // time dilation
            drawField: () => {
                ctx.globalCompositeOperation = "saturation";
                ctx.fillStyle = "#ccc";
                ctx.fillRect(-50000, -50000, 100000, 100000);
                ctx.globalCompositeOperation = "source-over";
            },
            fieldMeterColor: '#3fe',
            fieldRange: 155,
            fieldRegen: 0.002
        },
        {
            // metamaterial cloaking
            drawField: () => {},
            fieldMeterColor: '#333',
            fieldRange: 155,
            fieldRegen: 0.001
        },
        {
            // pilot wave
            drawField: () => {
                if (player1.input.field) {
                    if (player1.fieldDrawRadius == 0) {
                        player1.fieldPosition = { x: player1.mouseInGame.x, y: player1.mouseInGame.y };
                        player1.lastFieldPosition = { x: player1.mouseInGame.x, y: player1.mouseInGame.y };
                    } else {
                        const scale = 25;
                        const bounds = {
                            min: {
                                x: player1.fieldPosition.x - scale,
                                y: player1.fieldPosition.y - scale
                            },
                            max: {
                                x: player1.fieldPosition.x + scale,
                                y: player1.fieldPosition.y + scale
                            }
                        }
                        const isInMap = Matter.Query.region(map, bounds).length

                        player1.lastFieldPosition = { //used to find velocity of field changes
                            x: player1.fieldPosition.x,
                            y: player1.fieldPosition.y
                        }
                        const smooth = isInMap ? 0.985 : 0.96;
                        player1.fieldPosition = { //smooth the mouse position
                            x: player1.fieldPosition.x * smooth + player1.mouseInGame.x * (1 - smooth),
                            y: player1.fieldPosition.y * smooth + player1.mouseInGame.y * (1 - smooth),
                        }
                    }

                    const diff = Vector.sub(player1.fieldPosition, player1.lastFieldPosition)
                    const speed = Vector.magnitude(diff)
                    let radius, radiusSmooth
                    if (Matter.Query.ray(map, player1.fieldPosition, player1.pos).length) { //is there something block the player's view of the field
                        radius = 0
                        radiusSmooth = Math.max(0, isInMap ? 0.96 - 0.02 * speed : 0.995); //0.99
                    } else {
                        radius = Math.max(50, 250 - 2 * speed)
                        radiusSmooth = 0.97
                    }
                    player1.fieldDrawRadius = player1.fieldDrawRadius * radiusSmooth + radius * (1 - radiusSmooth)

                    ctx.beginPath();
                    const rotate = m.cycle * 0.008;
                    player1.fieldPhase += 0.2
                    const off1 = 1 + 0.06 * Math.sin(player1.fieldPhase);
                    const off2 = 1 - 0.06 * Math.sin(player1.fieldPhase);
                    ctx.beginPath();
                    ctx.ellipse(player1.fieldPosition.x, player1.fieldPosition.y, 1.2 * player1.fieldDrawRadius * off1, 1.2 * player1.fieldDrawRadius * off2, rotate, 0, 2 * Math.PI);
                    ctx.globalCompositeOperation = "exclusion";
                    ctx.fillStyle = "#fff";
                    ctx.fill();
                    ctx.globalCompositeOperation = "source-over";
                    ctx.beginPath();
                    ctx.ellipse(player1.fieldPosition.x, player1.fieldPosition.y, 1.2 * player1.fieldDrawRadius * off1, 1.2 * player1.fieldDrawRadius * off2, rotate, 0, 2 * Math.PI * player1.energy / player1.maxEnergy);
                    ctx.strokeStyle = "#000";
                    ctx.lineWidth = 4;
                    ctx.stroke();
                } else player1.fieldDrawRadius = 0;
            },
            fieldMeterColor: '#333',
            fieldRange: 155,
            fieldRegen: 0.001667
        },
        {
            // wormhole
            drawField: () => {
                const scale = 60;
                const justPastMouse = Vector.add(Vector.mult(Vector.normalise(Vector.sub(player1.mouseInGame, player1.pos)), 50), player1.mouseInGame)
                const sub = Vector.sub(player1.mouseInGame, player1.pos);
                const mag = Vector.magnitude(sub);
                if (player1.input.field) {

                    this.drain = 0.05 + 0.005 * Math.sqrt(mag)
                    const unit = Vector.perp(Vector.normalise(sub))
                    const where = { x: player1.pos.x + 30 * Math.cos(player1.angle), y: player1.pos.y + 30 * Math.sin(player1.angle) }
                    player1.fieldRange = 0.97 * player1.fieldRange + 0.03 * (50 + 10 * Math.sin(simulation.cycle * 0.025))
                    const edge2a = Vector.add(Vector.mult(unit, 1.5 * player1.fieldRange), player1.mouseInGame)
                    const edge2b = Vector.add(Vector.mult(unit, -1.5 * player1.fieldRange), player1.mouseInGame)
                    ctx.beginPath();
                    ctx.moveTo(where.x, where.y)
                    ctx.bezierCurveTo(where.x, where.y, player1.mouseInGame.x, player1.mouseInGame.y, edge2a.x, edge2a.y);
                    ctx.moveTo(where.x, where.y)
                    ctx.bezierCurveTo(where.x, where.y, player1.mouseInGame.x, player1.mouseInGame.y, edge2b.x, edge2b.y);
                    if (
                        mag > 250 && player1.energy > this.drain &&
                        (/*tech.isWormholeMapIgnore ||*/ Matter.Query.ray(map, player1.pos, justPastMouse).length === 0) &&
                        Matter.Query.region(map, {
                            min: {
                                x: player1.mouseInGame.x - scale,
                                y: player1.mouseInGame.y - scale
                            },
                            max: {
                                x: player1.mouseInGame.x + scale,
                                y: player1.mouseInGame.y + scale
                            }
                        }).length === 0
                    ) {
                        player1.hole.isReady = true;
                        ctx.lineWidth = 1
                        ctx.strokeStyle = "#000"
                        ctx.stroke();
                    } else {
                        player1.hole.isReady = false;
                        ctx.lineWidth = 1
                        ctx.strokeStyle = "#000"
                        ctx.lineDashOffset = 30 * Math.random()
                        ctx.setLineDash([20, 40]);
                        ctx.stroke();
                        ctx.setLineDash([]);
                    }
                } else if (
                    player1.hole.isReady && mag > 250 && player1.energy > this.drain &&
                    (/*tech.isWormholeMapIgnore ||*/ Matter.Query.ray(map, player1.pos, justPastMouse).length === 0) &&
                    Matter.Query.region(map, {
                        min: {
                            x: player1.mouseInGame.x - scale,
                            y: player1.mouseInGame.y - scale
                        },
                        max: {
                            x: player1.mouseInGame.x + scale,
                            y: player1.mouseInGame.y + scale
                        }
                    }).length === 0
                ) {
                    player1.hole.isReady = false;
                    player1.fieldRange = 0;
                    player1.hole.isOn = true;
                    player1.hole.pos1.x = player1.pos.x;
                    player1.hole.pos1.y = player1.pos.y;
                    player1.hole.pos2.x = player1.mouseInGame.x;
                    player1.hole.pos2.y = player1.mouseInGame.y;
                    player1.hole.angle = Math.atan2(sub.y, sub.x);
                    player1.hole.unit = Vector.perp(Vector.normalise(sub));
                }

                if (player1.hole.isOn) {
                    player1.fieldRange = 0.97 * player1.fieldRange + 0.03 * (50 + 10 * Math.sin(simulation.cycle * 0.025))
                    const semiMajorAxis = player1.fieldRange + 30
                    const edge1a = Vector.add(Vector.mult(player1.hole.unit, semiMajorAxis), player1.hole.pos1)
                    const edge1b = Vector.add(Vector.mult(player1.hole.unit, -semiMajorAxis), player1.hole.pos1)
                    const edge2a = Vector.add(Vector.mult(player1.hole.unit, semiMajorAxis), player1.hole.pos2)
                    const edge2b = Vector.add(Vector.mult(player1.hole.unit, -semiMajorAxis), player1.hole.pos2)
                    ctx.beginPath();
                    ctx.moveTo(edge1a.x, edge1a.y)
                    ctx.bezierCurveTo(player1.hole.pos1.x, player1.hole.pos1.y, player1.hole.pos2.x, player1.hole.pos2.y, edge2a.x, edge2a.y);
                    ctx.lineTo(edge2b.x, edge2b.y)
                    ctx.bezierCurveTo(player1.hole.pos2.x, player1.hole.pos2.y, player1.hole.pos1.x, player1.hole.pos1.y, edge1b.x, edge1b.y);
                    ctx.fillStyle = `rgba(255,255,255,${200 / player1.fieldRange / player1.fieldRange})` //"rgba(0,0,0,0.1)"
                    ctx.fill();
                    ctx.beginPath();
                    ctx.ellipse(player1.hole.pos1.x, player1.hole.pos1.y, player1.fieldRange, semiMajorAxis, player1.hole.angle, 0, 2 * Math.PI)
                    ctx.ellipse(player1.hole.pos2.x, player1.hole.pos2.y, player1.fieldRange, semiMajorAxis, player1.hole.angle, 0, 2 * Math.PI)
                    ctx.fillStyle = `rgba(255,255,255,${32 / player1.fieldRange})`
                    ctx.fill();
                }
            },
            fieldMeterColor: '#bbf',
            fieldRange: 0,
            fieldRegen: 0.001
        },
        {
            // grappling hook
            drawField: () => {
                // console.log(player1.input.field, player1.fieldCDcycle, m.cycle)
                if (player1.input.field && player1.fieldCDcycle < m.cycle) {
                    b.multiplayerGrapple({ x: player1.pos.x + 40 * Math.cos(player1.angle), y: player1.pos.y + 40 * Math.sin(player1.angle) }, player1.angle, 1);
                    if (player1.fieldCDcycle < m.cycle + 20) player1.fieldCDcycle = m.cycle + 20;
                }
            },
            fieldMeterColor: '#0cf',
            fieldRange: 155,
            fieldRegen: 0.0015
        }
    ]

    player1 = {
        angle: 0,
        bodyGradient: null,
        calcLeg: (cycle_offset, offset) => {
            player1.hip.x = 12 + offset;
            player1.hip.y = 24 + offset;
            //stepSize goes to zero if Vx is zero or not on ground (make m transition cleaner)
            player1.stepSize = 0.8 * player1.stepSize + 0.2 * (7 * Math.sqrt(Math.min(9, Math.abs(player1.Vx))) * player1.onGround);
            //changes to stepsize are smoothed by adding only a percent of the new value each cycle
            const stepAngle = 0.034 * player1.walk_cycle + cycle_offset;
            player1.foot.x = 2.2 * player1.stepSize * Math.cos(stepAngle) + offset;
            player1.foot.y = offset + 1.2 * player1.stepSize * Math.sin(stepAngle) + player1.yOff + player1.height;
            const Ymax = player1.yOff + player1.height;
            if (player1.foot.y > Ymax) player1.foot.y = Ymax;
    
            //calculate knee position as intersection of circle from hip and foot
            const d = Math.sqrt((player1.hip.x - player1.foot.x) * (player1.hip.x - player1.foot.x) + (player1.hip.y - player1.foot.y) * (player1.hip.y - player1.foot.y));
            const l = (player1.legLength1 * player1.legLength1 - player1.legLength2 * player1.legLength2 + d * d) / (2 * d);
            const h = Math.sqrt(player1.legLength1 * player1.legLength1 - l * l);
            player1.knee.x = (l / d) * (player1.foot.x - player1.hip.x) - (h / d) * (player1.foot.y - player1.hip.y) + player1.hip.x + offset;
            player1.knee.y = (l / d) * (player1.foot.y - player1.hip.y) + (h / d) * (player1.foot.x - player1.hip.x) + player1.hip.y;
        },
        color: { hue: 0, sat: 0, light: 100 },
        crouch: false,
        drawHealthbar: () => {
            if (player1.health < player1.maxHealth) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                const xOff = player1.pos.x - 40 * player1.maxHealth;
                const yOff = player1.pos.y - 70;
                ctx.fillRect(xOff, yOff, 80 * player1.maxHealth, 10);
                ctx.fillStyle = '#09f5a6';
                ctx.fillRect(xOff, yOff, 80 * player1.health, 10);
            } else if (player1.health > player1.maxHealth + 0.05 || player1.input.field) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                const xOff = player1.pos.x - 40 * player1.health;
                const yOff = player1.pos.y - 70;
                ctx.fillStyle = '#09f5a6';
                ctx.fillRect(xOff, yOff, 80 * player1.health, 10);
            }
        },
        drawHold: (target) => {
            if (target) {
                const eye = 15;
                const len = target.vertices.length - 1;
                ctx.fillStyle = "rgba(110,170,200," + (0.2 + 0.4 * Math.random()) + ")";
                ctx.lineWidth = 1;
                ctx.strokeStyle = "#000";
                ctx.beginPath();
                ctx.moveTo(
                    player1.pos.x + eye * Math.cos(player1.angle),
                    player1.pos.y + eye * Math.sin(player1.angle)
                );
                ctx.lineTo(target.vertices[len].x, target.vertices[len].y);
                ctx.lineTo(target.vertices[0].x, target.vertices[0].y);
                ctx.fill();
                ctx.stroke();
                for (let i = 0; i < len; i++) {
                    ctx.beginPath();
                    ctx.moveTo(
                        player1.pos.x + eye * Math.cos(player1.angle),
                        player1.pos.y + eye * Math.sin(player1.angle)
                    );
                    ctx.lineTo(target.vertices[i].x, target.vertices[i].y);
                    ctx.lineTo(target.vertices[i + 1].x, target.vertices[i + 1].y);
                    ctx.fill();
                    ctx.stroke();
                }
            }
        },
        drawLeg: (stroke) => {
            if (player1.angle > -Math.PI / 2 && player1.angle < Math.PI / 2) {
                player1.flipLegs = 1;
            } else {
                player1.flipLegs = -1;
            }
            ctx.save();

            if (player1.isCloak) {
                ctx.globalAlpha *= 2;
                ctx.scale(player1.flipLegs, 1); //leg lines
                ctx.beginPath();
                ctx.moveTo(player1.hip.x, player1.hip.y);
                ctx.lineTo(player1.knee.x, player1.knee.y);
                ctx.lineTo(player1.foot.x, player1.foot.y);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 10;
                ctx.stroke();
                ctx.globalAlpha /= 2;
            }

            ctx.scale(player1.flipLegs, 1); //leg lines
            ctx.beginPath();
            ctx.moveTo(player1.hip.x, player1.hip.y);
            ctx.lineTo(player1.knee.x, player1.knee.y);
            ctx.lineTo(player1.foot.x, player1.foot.y);
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 6;
            ctx.stroke();

            //toe lines
            if (player1.isCloak) {
                ctx.globalAlpha *= 2;
                ctx.beginPath();
                ctx.moveTo(player1.foot.x, player1.foot.y);
                ctx.lineTo(player1.foot.x - 14, player1.foot.y + 5);
                ctx.moveTo(player1.foot.x, player1.foot.y);
                ctx.lineTo(player1.foot.x + 14, player1.foot.y + 5);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 8;
                ctx.stroke();
                ctx.globalAlpha /= 2;
            }

            ctx.beginPath();
            ctx.moveTo(player1.foot.x, player1.foot.y);
            ctx.lineTo(player1.foot.x - 14, player1.foot.y + 5);
            ctx.moveTo(player1.foot.x, player1.foot.y);
            ctx.lineTo(player1.foot.x + 14, player1.foot.y + 5);
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 4;
            ctx.stroke();

            if (player1.isCloak) {
                ctx.globalAlpha *= 2;
                //hip joint
                ctx.beginPath();
                ctx.arc(player1.hip.x, player1.hip.y, 9, 0, 2 * Math.PI);
                //knee joint
                ctx.moveTo(player1.knee.x + 5, player1.knee.y);
                ctx.arc(player1.knee.x, player1.knee.y, 5, 0, 2 * Math.PI);
                //foot joint
                ctx.moveTo(player1.foot.x + 4, player1.foot.y + 1);
                ctx.arc(player1.foot.x, player1.foot.y + 1, 4, 0, 2 * Math.PI);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 6;
                ctx.stroke();
                ctx.globalAlpha /= 2;
            }

            //hip joint
            ctx.beginPath();
            ctx.arc(player1.hip.x, player1.hip.y, 9, 0, 2 * Math.PI);
            //knee joint
            ctx.moveTo(player1.knee.x + 5, player1.knee.y);
            ctx.arc(player1.knee.x, player1.knee.y, 5, 0, 2 * Math.PI);
            //foot joint
            ctx.moveTo(player1.foot.x + 4, player1.foot.y + 1);
            ctx.arc(player1.foot.x, player1.foot.y + 1, 4, 0, 2 * Math.PI);
            ctx.fillStyle = player1.fillColor;
            ctx.fill();
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        },
        drawRegenEnergy: (bgColor = "rgba(0, 0, 0, 0.4)", range = 60) => {
            if (player1.energy < player1.maxEnergy) {
                // m.regenEnergy();
                ctx.fillStyle = bgColor;
                const xOff = player1.pos.x - player1.radius * player1.maxEnergy;
                const yOff = player1.pos.y - 50;
                ctx.fillRect(xOff, yOff, range * player1.maxEnergy, 10);
                ctx.fillStyle = player1.fieldMeterColor;
                ctx.fillRect(xOff, yOff, range * player1.energy, 10);
            } else if (player1.energy > player1.maxEnergy + 0.05 || player1.input.field) {
                ctx.fillStyle = bgColor;
                const xOff = player1.pos.x - player1.radius * player1.energy;
                const yOff = player1.pos.y - 50;
                ctx.fillStyle = player1.fieldMeterColor;
                ctx.fillRect(xOff, yOff, range * player1.energy, 10);
            }
        },
        energy: 1,
        fieldAngle: 0,
        fieldArc: 0.2,
        fieldCDcycle: 0,
        fieldDrawRadius: 0,
        fieldMeterColor: '#0cf',
        fieldMode: 0,
        fieldPhase: 0,
        fieldPosition: { x: 0, y: 0 },
        fieldRange: 155,
        fillColor: null,
        fillColorDark: null,
        flipLegs: -1,
        foot: { x: 0, y: 0 },
        FxAir: 0.016,
        health: 1,
        height: 42,
        hip: { x: 12, y: 24 },
        hole: {
            isOn: false,
            isReady: true,
            pos1: { x: 0, y: 0 },
            pos2: { x: 0, y: 0 },
            angle: 0,
            unit: { x: 0, y: 0 },
        },
        immuneCycle: 0,
        input: { up: false, down: false, left: false, right: false, field: false, fire: false },
        isCloak: false,
        isHolding: false,
        knee: { x: 0, y: 0, x2: 0, y2: 0 },
        lastFieldPosition: { x: 0, y: 0 },
        legLength1: 55,
        legLength2: 45,
        mass: 5,
        maxEnergy: 1,
        maxHealth: 1,
        mouseInGame: { x: 0, y: 0 },
        onGround: false,
        pos: { x: 0, y: 0 },
        radius: 30,
        stepSize: 0,
        throwCharge: 0,
        Vx: 0,
        Vy: 0,
        walk_cycle: 0,
        yOff: 70
    }
    window.player1 = player1;
    player1.fillColor = `hsl(${player1.color.hue},${player1.color.sat}%,${player1.color.light}%)`;
    player1.fillColorDark = `hsl(${player1.color.hue},${player1.color.sat}%,${player1.color.light - 25}%)`;
    let grd = ctx.createLinearGradient(-30, 0, 30, 0);
    grd.addColorStop(0, player1.fillColorDark);
    grd.addColorStop(1, player1.fillColor);
    player1.bodyGradient = grd;

    collisionChecks = (event) => {
        const pairs = event.pairs;
        for (let i = 0, j = pairs.length; i != j; i++) {
            //mob + (player,bullet,body) collisions
            for (let k = 0; k < mob.length; k++) {
                if (mob[k].alive) {
                    if (pairs[i].bodyA === mob[k]) {
                        collideMob(pairs[i].bodyB);
                        break;
                    } else if (pairs[i].bodyB === mob[k]) {
                        collideMob(pairs[i].bodyA);
                        break;
                    }
    
                    function collideMob(obj) {
                        if (obj.multiplayer) {
                            if (!(m.immuneCycle < m.cycle && (obj === playerBody || obj === playerHead) && !mob[k].isSlowed && !mob[k].isStunned) && obj.classType === "bullet" && obj.speed > obj.minDmgSpeed) obj.beforeDmg(mob[k]);
                            return;
                        }
                        //player + mob collision
                        if (
                            m.immuneCycle < m.cycle &&
                            (obj === playerBody || obj === playerHead) &&
                            !mob[k].isSlowed && !mob[k].isStunned
                        ) {
                            let dmg = Math.min(Math.max(0.025 * Math.sqrt(mob[k].mass), 0.05), 0.3) * simulation.dmgScale; //player damage is capped at 0.3*dmgScale of 1.0
                            // if (m.isCloak) dmg *= 0.5
                            mob[k].foundPlayer();
                            if (tech.isRewindAvoidDeath && m.energy > 0.85 * Math.min(1, m.maxEnergy) && dmg > 0.01) { //CPT reversal runs in m.damage, but it stops the rest of the collision code here too
                                m.damage(dmg);
                                return
                            }
                            if (tech.isFlipFlop) {
                                if (tech.isFlipFlopOn) {
                                    tech.isFlipFlopOn = false
                                    if (document.getElementById("tech-flip-flop")) document.getElementById("tech-flip-flop").innerHTML = ` = <strong>OFF</strong>`
                                    m.eyeFillColor = 'transparent'
                                    m.damage(dmg);
                                } else {
                                    tech.isFlipFlopOn = true //immune to damage this hit, lose immunity for next hit
                                    if (document.getElementById("tech-flip-flop")) document.getElementById("tech-flip-flop").innerHTML = ` = <strong>ON</strong>`
                                    m.eyeFillColor = m.fieldMeterColor //'#0cf'
                                    if (!tech.isFlipFlopHarm) m.damage(dmg);
                                }
                                if (tech.isFlipFlopHealth) {
                                    m.setMaxHealth();
                                    for (let i = 0; i < powerUp.length; i++) {
                                        if (powerUp[i].name === "heal") {
                                            const oldSize = powerUp[i].size
                                            powerUp[i].size = powerUps.heal.size() //update current heals
                                            const scale = powerUp[i].size / oldSize
                                            Matter.Body.scale(powerUp[i], scale, scale); //grow    
                                        }
                                    }
                                }
                            } else {
                                m.damage(dmg); //normal damage
                            }
    
                            if (tech.isCollisionRealitySwitch && m.alive) {
                                m.switchWorlds()
                                simulation.trails()
                                simulation.makeTextLog(`simulation.amplitude <span class='color-symbol'>=</span> ${Math.random()}`);
                            }
                            if (tech.isPiezo) m.energy += 20.48;
                            if (tech.isCouplingNoHit && m.coupling > 0) {
                                m.couplingChange(-5)
    
                                const unit = Vector.rotate({ x: 1, y: 0 }, 6.28 * Math.random())
                                let where = Vector.add(m.pos, Vector.mult(unit, 17))
                                simulation.drawList.push({ //add dmg to draw queue
                                    x: where.x,
                                    y: where.y,
                                    radius: 22,
                                    color: 'rgba(0, 171, 238, 0.33)',
                                    time: 8
                                });
                                where = Vector.add(m.pos, Vector.mult(unit, 60))
                                simulation.drawList.push({ //add dmg to draw queue
                                    x: where.x,
                                    y: where.y,
                                    radius: 18,
                                    color: 'rgba(0, 171, 238, 0.5)',
                                    time: 16
                                });
                                where = Vector.add(m.pos, Vector.mult(unit, 100))
                                simulation.drawList.push({ //add dmg to draw queue
                                    x: where.x,
                                    y: where.y,
                                    radius: 14,
                                    color: 'rgba(0, 171, 238, 0.6)',
                                    time: 24
                                });
                                where = Vector.add(m.pos, Vector.mult(unit, 135))
                                simulation.drawList.push({ //add dmg to draw queue
                                    x: where.x,
                                    y: where.y,
                                    radius: 10,
                                    color: 'rgba(0, 171, 238, 0.7)',
                                    time: 32
                                });
                                // simulation.drawList.push({ //add dmg to draw queue
                                //     x: m.pos.x,
                                //     y: m.pos.y,
                                //     radius: 150,
                                //     color: 'rgba(0, 171, 238, 0.33)',
                                //     time: 6
                                // });
                                // simulation.drawList.push({ //add dmg to draw queue
                                //     x: m.pos.x,
                                //     y: m.pos.y,
                                //     radius: 75,
                                //     color: 'rgba(0, 171, 238, 0.5)',
                                //     time: 16
                                // });
                                // simulation.drawList.push({ //add dmg to draw queue
                                //     x: m.pos.x,
                                //     y: m.pos.y,
                                //     radius: 25,
                                //     color: 'rgba(0, 171, 238, 0.75)',
                                //     time: 25
                                // });
                            }
                            if (tech.isHarpoonDefense) { //fire harpoons at mobs after getting hit
                                const maxCount = 10 + 3 * tech.extraHarpoons //scale the number of hooks fired
                                let count = maxCount - 1
                                const angle = Math.atan2(mob[k].position.y - player.position.y, mob[k].position.x - player.position.x);
                                b.harpoon(m.pos, mob[k], angle, 0.75, true, 7) // harpoon(where, target, angle = m.angle, harpoonSize = 1, isReturn = false, totalCycles = 35, isReturnAmmo = true, thrust = 0.1) {
                                bullet[bullet.length - 1].drain = 0
                                for (; count > 0; count--) {
                                    b.harpoon(m.pos, mob[k], angle + count * 2 * Math.PI / maxCount, 0.75, true, 7)
                                    bullet[bullet.length - 1].drain = 0
                                }
                            }
                            if (tech.isStimulatedEmission) powerUps.ejectTech()
                            if (mob[k].onHit) mob[k].onHit();
                            if (m.immuneCycle < m.cycle + m.collisionImmuneCycles) m.immuneCycle = m.cycle + m.collisionImmuneCycles; //player is immune to damage for 30 cycles
                            //extra kick between player and mob              //this section would be better with forces but they don't work...
                            let angle = Math.atan2(player.position.y - mob[k].position.y, player.position.x - mob[k].position.x);
                            Matter.Body.setVelocity(player, {
                                x: player.velocity.x + 8 * Math.cos(angle),
                                y: player.velocity.y + 8 * Math.sin(angle)
                            });
                            Matter.Body.setVelocity(mob[k], {
                                x: mob[k].velocity.x - 8 * Math.cos(angle),
                                y: mob[k].velocity.y - 8 * Math.sin(angle)
                            });
    
                            if (tech.isAnnihilation && !mob[k].shield && !mob[k].isShielded && !mob[k].isBoss && mob[k].isDropPowerUp && m.energy > 0.1 && mob[k].damageReduction > 0) {
                                m.energy -= 0.1 //* Math.max(m.maxEnergy, m.energy) //0.33 * m.energy
                                if (m.immuneCycle === m.cycle + m.collisionImmuneCycles) m.immuneCycle = 0; //player doesn't go immune to collision damage
                                mob[k].death();
                                simulation.drawList.push({ //add dmg to draw queue
                                    x: pairs[i].activeContacts[0].vertex.x,
                                    y: pairs[i].activeContacts[0].vertex.y,
                                    radius: Math.sqrt(dmg) * 500,
                                    color: "rgba(255,0,255,0.2)",
                                    time: simulation.drawTime
                                });
                            } else {
                                simulation.drawList.push({ //add dmg to draw queue
                                    x: pairs[i].activeContacts[0].vertex.x,
                                    y: pairs[i].activeContacts[0].vertex.y,
                                    radius: Math.sqrt(dmg) * 200,
                                    color: simulation.mobDmgColor,
                                    time: simulation.drawTime
                                });
                            }
                            // return;
                            // }
                        } else {
                            //mob + bullet collisions
                            if (obj.classType === "bullet" && obj.speed > obj.minDmgSpeed) {
                                obj.beforeDmg(mob[k]); //some bullets do actions when they hits things, like despawn //forces don't seem to work here
                                let dmg = m.dmgScale * (obj.dmg + 0.15 * obj.mass * Vector.magnitude(Vector.sub(mob[k].velocity, obj.velocity)))
                                if (tech.isCrit && mob[k].isStunned) dmg *= 4
                                // console.log(dmg) //remove this
                                mob[k].damage(dmg);
                                if (mob[k].alive) mob[k].foundPlayer();
                                if (mob[k].damageReduction) {
                                    simulation.drawList.push({ //add dmg to draw queue
                                        x: pairs[i].activeContacts[0].vertex.x,
                                        y: pairs[i].activeContacts[0].vertex.y,
                                        radius: Math.log(dmg + 1.1) * 40 * mob[k].damageReduction + 3,
                                        color: simulation.playerDmgColor,
                                        time: simulation.drawTime
                                    });
                                }
                                if (tech.isLessDamageReduction && !mob[k].shield) mob[k].damageReduction *= mob[k].isBoss ? (mob[k].isFinalBoss ? 1.0005 : 1.0025) : 1.05
                                return;
                            }
                            //mob + body collisions
                            if (obj.classType === "body" && obj.speed > 6) {
                                const v = Vector.magnitude(Vector.sub(mob[k].velocity, obj.velocity));
                                if (v > 9) {
                                    if (tech.blockDmg) { //electricity
                                        Matter.Body.setVelocity(mob[k], { x: 0.5 * mob[k].velocity.x, y: 0.5 * mob[k].velocity.y });
                                        if (tech.isBlockRadiation && !mob[k].isShielded && !mob[k].isMobBullet) {
                                            mobs.statusDoT(mob[k], tech.blockDmg * 0.42, 180) //200% increase -> x (1+2) //over 7s -> 360/30 = 12 half seconds -> 3/12
                                        } else {
                                            mob[k].damage(tech.blockDmg * m.dmgScale)
                                            simulation.drawList.push({
                                                x: pairs[i].activeContacts[0].vertex.x,
                                                y: pairs[i].activeContacts[0].vertex.y,
                                                radius: 28 * mob[k].damageReduction + 3,
                                                color: "rgba(255,0,255,0.8)",
                                                time: 4
                                            });
                                        }
                                    }
    
                                    let dmg = tech.blockDamage * m.dmgScale * v * obj.mass * (tech.isMobBlockFling ? 2.5 : 1) * (tech.isBlockRestitution ? 2.5 : 1) * ((m.fieldMode === 0 || m.fieldMode === 8) ? 1 + 0.04 * m.coupling : 1);
                                    if (mob[k].isShielded) dmg *= 0.7
    
                                    mob[k].damage(dmg, true);
                                    if (tech.isBlockPowerUps && !mob[k].alive && mob[k].isDropPowerUp && m.throwCycle > m.cycle) {
                                        options = ["coupling", "boost", "heal", "research"]
                                        if (!tech.isEnergyNoAmmo) options.push("ammo")
                                        powerUps.spawn(mob[k].position.x, mob[k].position.y, options[Math.floor(Math.random() * options.length)]);
                                    }
    
                                    const stunTime = dmg / Math.sqrt(obj.mass)
                                    if (stunTime > 0.5 && mob[k].memory !== Infinity) mobs.statusStun(mob[k], 60 + 60 * Math.sqrt(stunTime))
                                    if (mob[k].alive && Math.sqrt((mob[k].position.x - player1.pos.x)**2 + (mob[k].position.y - player1.pos.y)**2) < 1000000 && !m.isCloak) mob[k].foundPlayer();
                                    if (tech.fragments && obj.speed > 10 && !obj.hasFragmented) {
                                        obj.hasFragmented = true;
                                        b.targetedNail(obj.position, tech.fragments * 4)
                                    }
                                    if (mob[k].damageReduction) {
                                        simulation.drawList.push({
                                            x: pairs[i].activeContacts[0].vertex.x,
                                            y: pairs[i].activeContacts[0].vertex.y,
                                            radius: Math.log(dmg + 1.1) * 40 * mob[k].damageReduction + 3,
                                            color: simulation.playerDmgColor,
                                            time: simulation.drawTime
                                        });
                                    }
                                    return;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    mobs.healthBar = () => {
        for (let i = 0, len = mob.length; i < len; i++) {
            if (mob[i].isZombie) {
                const h = mob[i].radius * 0.3;
                const w = mob[i].radius * 2;
                const x = mob[i].position.x - w / 2;
                const y = mob[i].position.y - w * 0.7;
                ctx.fillStyle = "rgba(100, 100, 100, 0.3)";
                ctx.fillRect(x, y, w, h);
                ctx.fillStyle = "rgba(136, 51, 170,0.7)";
                ctx.fillRect(x, y, w * mob[i].health, h);
            } else if (mob[i].seePlayer.recall && mob[i].showHealthBar) {
                const h = mob[i].radius * 0.3;
                const w = mob[i].radius * 2;
                const x = mob[i].position.x - w / 2;
                const y = mob[i].position.y - w * 0.7;
                ctx.fillStyle = "rgba(100, 100, 100, 0.3)";
                ctx.fillRect(x, y, w, h);
                ctx.fillStyle = "rgba(255,0,0,0.7)";
                ctx.fillRect(x, y, w * mob[i].health, h);
            }
        }
    }

    const oldBodyRect = spawn.bodyRect;
    spawn.bodyRect = () => {};
    const oldBodyVertex = spawn.bodyVertex;
    spawn.bodyVertex = () => {};
    const oldPowerupSpawn = powerUps.spawn;
    powerUps.spawn = () => {};

    const oldMACHO = spawn.MACHO;
    spawn.MACHO = () => {}
    
    const oldWIMP = spawn.WIMP;
    spawn.WIMP = () => {}
    
    const oldFinalBoss = spawn.finalBoss;
    spawn.finalBoss = () => {}
    
    const oldZombie = spawn.zombie;
    spawn.zombie = () => {}
    
    const oldStarter = spawn.starter;
    spawn.starter = () => {}
    
    const oldBlockGroupMob = spawn.blockGroupMob;
    spawn.blockGroupMob = () => {}
    
    const oldBlockBoss = spawn.blockBoss;
    spawn.blockBoss = () => {}
    
    const oldBlockMob = spawn.blockMob;
    spawn.blockMob = () => {}
    
    const oldCellBoss = spawn.cellBoss;
    spawn.cellBoss = () => {}
    
    const oldSpawnerBoss = spawn.spawnerBoss;
    spawn.spawnerBoss = () => {}
    
    const oldGrowBoss = spawn.growBoss;
    spawn.growBoss = () => {}
    
    const oldPowerUpBossBaby = spawn.powerUpBossBaby;
    spawn.powerUpBossBaby = () => {}
    
    const oldPowerUpBoss = spawn.powerUpBoss;
    spawn.powerUpBoss = () => {}
    
    const oldGrower = spawn.grower;
    spawn.grower = () => {}
    
    const oldSpringer = spawn.springer;
    spawn.springer = () => {}
    
    const oldHopper = spawn.hopper;
    spawn.hopper = () => {}
    
    const oldHopMother = spawn.hopMother;
    spawn.hopMother = () => {}
    
    const oldHopEgg = spawn.hopEgg;
    spawn.hopEgg = () => {}
    
    const oldHopBullet = spawn.hopBullet;
    spawn.hopBullet = () => {}
    
    const oldHopMotherBoss = spawn.hopMotherBoss;
    spawn.hopMotherBoss = () => {}
    
    const oldSpinner = spawn.spinner;
    spawn.spinner = () => {}
    
    const oldSucker = spawn.sucker;
    spawn.sucker = () => {}
    
    const oldSuckerBoss = spawn.suckerBoss;
    spawn.suckerBoss = () => {}
    
    const oldSpiderBoss = spawn.spiderBoss;
    spawn.spiderBoss = () => {}
    
    const oldMantisBoss = spawn.mantisBoss;
    spawn.mantisBoss = () => {}
    
    const oldBeamer = spawn.beamer;
    spawn.beamer = () => {}
    
    const oldHistoryBoss = spawn.historyBoss;
    spawn.historyBoss = () => {}
    
    const oldFocuser = spawn.focuser;
    spawn.focuser = () => {}
    
    const oldFlutter = spawn.flutter;
    spawn.flutter = () => {}
    
    const oldStinger = spawn.stinger;
    spawn.stinger = () => {}
    
    const oldBeetleBoss = spawn.beetleBoss;
    spawn.beetleBoss = () => {}
    
    const oldLaserTargetingBoss = spawn.laserTargetingBoss;
    spawn.laserTargetingBoss = () => {}
    
    const oldLaserBombingBoss = spawn.laserBombingBoss;
    spawn.laserBombingBoss = () => {}
    
    const oldBlinkBoss = spawn.blinkBoss;
    spawn.blinkBoss = () => {}
    
    const oldPulsarBoss = spawn.pulsarBoss;
    spawn.pulsarBoss = () => {}
    
    const oldPulsar = spawn.pulsar;
    spawn.pulsar = () => {}
    
    const oldLaserLayer = spawn.laserLayer;
    spawn.laserLayer = () => {}
    
    const oldLaserLayerBoss = spawn.laserLayerBoss;
    spawn.laserLayerBoss = () => {}
    
    const oldMobLaser = spawn.laser;
    spawn.laser = () => {}
    
    const oldLaserBoss = spawn.laserBoss;
    spawn.laserBoss = () => {}
    
    const oldStabber = spawn.stabber;
    spawn.stabber = () => {}
    
    const oldStriker = spawn.striker;
    spawn.striker = () => {}
    
    const oldRevolutionBoss = spawn.revolutionBoss;
    spawn.revolutionBoss = () => {}
    
    const oldSprayBoss = spawn.sprayBoss;
    spawn.sprayBoss = () => {}
    
    const oldMineBoss = spawn.mineBoss;
    spawn.mineBoss = () => {}
    
    const oldMine = spawn.mine;
    spawn.mine = () => {}
    
    const oldBounceBoss = spawn.bounceBoss;
    spawn.bounceBoss = () => {}
    
    const oldTimeBoss = spawn.timeBoss;
    spawn.timeBoss = () => {}
    
    const oldBounceBullet = spawn.bounceBullet;
    spawn.bounceBullet = () => {}
    
    const oldSlashBoss = spawn.slashBoss;
    spawn.slashBoss = () => {}
    
    const oldSlasher = spawn.slasher;
    spawn.slasher = () => {}
    
    const oldSlasher2 = spawn.slasher2;
    spawn.slasher2 = () => {}
    
    const oldSlasher3 = spawn.slasher3;
    spawn.slasher3 = () => {}
    
    const oldSneakBoss = spawn.sneakBoss;
    spawn.sneakBoss = () => {}
    
    const oldSneaker = spawn.sneaker;
    spawn.sneaker = () => {}
    
    const oldGhoster = spawn.ghoster;
    spawn.ghoster = () => {}
    
    const oldBomberBoss = spawn.bomberBoss;
    spawn.bomberBoss = () => {}
    
    const oldShooter = spawn.shooter;
    spawn.shooter = () => {}
    
    const oldShooterBoss = spawn.shooterBoss;
    spawn.shooterBoss = () => {}
    
    const oldBullet = spawn.bullet;
    spawn.bullet = () => {}
    
    const oldBomb = spawn.bomb;
    spawn.bomb = () => {}
    
    const oldSniper = spawn.sniper;
    spawn.sniper = () => {}
    
    const oldSniperBullet = spawn.sniperBullet;
    spawn.sniperBullet = () => {}
    
    const oldLauncherOne = spawn.launcherOne;
    spawn.launcherOne = () => {}
    
    const oldLauncher = spawn.launcher;
    spawn.launcher = () => {}
    
    const oldLauncherBoss = spawn.launcherBoss;
    spawn.launcherBoss = () => {}
    
    const oldGrenadierBoss = spawn.grenadierBoss;
    spawn.grenadierBoss = () => {}
    
    const oldGrenadier = spawn.grenadier;
    spawn.grenadier = () => {}
    
    const oldMobGrenade = spawn.grenade;
    spawn.grenade = () => {}
    
    const oldShieldingBoss = spawn.shieldingBoss;
    spawn.shieldingBoss = () => {}
    
    const oldTimeSkipBoss = spawn.timeSkipBoss;
    spawn.timeSkipBoss = () => {}
    
    const oldStreamBoss = spawn.streamBoss;
    spawn.streamBoss = () => {}
    
    const oldSeeker = spawn.seeker;
    spawn.seeker = () => {}
    
    const oldSpawner = spawn.spawner;
    spawn.spawner = () => {}
    
    const oldSpawns = spawn.spawns;
    spawn.spawns = () => {}
    
    const oldExploder = spawn.exploder;
    spawn.exploder = () => {}
    
    const oldSnakeSpitBoss = spawn.snakeSpitBoss;
    spawn.snakeSpitBoss = () => {}
    
    const oldDragonFlyBoss = spawn.dragonFlyBoss;
    spawn.dragonFlyBoss = () => {}
    
    const oldSnakeBody = spawn.snakeBody;
    spawn.snakeBody = () => {}
    
    const oldTetherBoss = spawn.tetherBoss;
    spawn.tetherBoss = () => {}
    
    const oldShield = spawn.shield;
    spawn.shield = () => {}
    
    const oldGroupShield = spawn.groupShield;
    spawn.groupShield = () => {}
    
    const oldOrbital = spawn.orbital;
    spawn.orbital = () => {}
    
    const oldOrbitalBoss = spawn.orbitalBoss;
    spawn.orbitalBoss = () => {}

    const oldExplosion = b.explosion;
    b.explosion = (where, radius, color = 'rgba(255,25,0,0.6)') => {
        const textEncoder = new TextEncoder();
        const data = new Uint8Array(new ArrayBuffer(26 + textEncoder.encode(color).length));
        data[0] = 16;
        data[25] = textEncoder.encode(color).length;
        data.set(textEncoder.encode(color), 26);
        const dataView = new DataView(data.buffer);
        dataView.setFloat64(1, where.x);
        dataView.setFloat64(9, where.y);
        dataView.setFloat64(17, radius);
        dcRemote.send(dataView);

        // oldExplosion(where, radius, color);
    }

    const oldPulse = b.pulse;
    b.pulse = (charge, angle = m.angle, where = m.pos) => {
        const data = new Uint8Array(new ArrayBuffer(33))
        data[0] = 17;
        const dataView = new DataView(data.buffer);
        dataView.setFloat64(1, charge);
        dataView.setFloat64(9, angle);
        dataView.setFloat64(17, where.x);
        dataView.setFloat64(25, where.y);
        dcRemote.send(dataView);

        // oldPulse(charge, angle, where);
    }

    b.setGrenadeMode = () => {
        grenadeDefault = function (where = {
            x: m.pos.x + 30 * Math.cos(m.angle),
            y: m.pos.y + 30 * Math.sin(m.angle)
        }, angle = m.angle, size = 1) {
            const me = bullet.length;
            bullet[me] = Bodies.circle(where.x, where.y, 15, b.fireAttributes(angle, false));
            Matter.Body.setDensity(bullet[me], 0.0003);
            bullet[me].explodeRad = 300 * size + 100 * tech.isBlockExplode;
            bullet[me].onEnd = b.grenadeEnd
            bullet[me].minDmgSpeed = 1;
            bullet[me].beforeDmg = function () {
                this.endCycle = 0; //bullet ends cycle after doing damage  //this also triggers explosion
            };
            speed = m.crouch ? 43 : 32
            Matter.Body.setVelocity(bullet[me], {
                x: m.Vx / 2 + speed * Math.cos(angle),
                y: m.Vy / 2 + speed * Math.sin(angle)
            });
            bullet[me].endCycle = simulation.cycle + Math.floor(m.crouch ? 120 : 80) * tech.bulletsLastLonger;
            bullet[me].restitution = 0.4;
            bullet[me].do = function () {
                this.force.y += this.mass * 0.0025; //extra gravity for harder arcs
            };
            Composite.add(engine.world, bullet[me]); //add bullet to world
        }
        grenadeRPG = function (where = {
            x: m.pos.x + 30 * Math.cos(m.angle),
            y: m.pos.y + 30 * Math.sin(m.angle)
        }, angle = m.angle, size = 1) {
            const me = bullet.length;
            bullet[me] = Bodies.circle(where.x, where.y, 15, b.fireAttributes(angle, false));
            Matter.Body.setDensity(bullet[me], 0.0003);
            bullet[me].explodeRad = 300 * size + 100 * tech.isBlockExplode;
            bullet[me].onEnd = b.grenadeEnd
            bullet[me].minDmgSpeed = 1;
            bullet[me].beforeDmg = function () {
                this.endCycle = 0; //bullet ends cycle after doing damage  //this also triggers explosion
            };
            speed = m.crouch ? 46 : 32
            Matter.Body.setVelocity(bullet[me], {
                x: m.Vx / 2 + speed * Math.cos(angle),
                y: m.Vy / 2 + speed * Math.sin(angle)
            });
            Composite.add(engine.world, bullet[me]); //add bullet to world

            bullet[me].endCycle = simulation.cycle + 70 * tech.bulletsLastLonger;
            bullet[me].frictionAir = 0.07;
            const MAG = 0.015
            bullet[me].thrust = {
                x: bullet[me].mass * MAG * Math.cos(angle),
                y: bullet[me].mass * MAG * Math.sin(angle)
            }
            bullet[me].do = function () {
                this.force.x += this.thrust.x;
                this.force.y += this.thrust.y;
                if (Matter.Query.collides(this, map).length || Matter.Query.collides(this, body).length) {
                    this.endCycle = 0; //explode if touching map or blocks
                }
            };
        }
        grenadeRPGVacuum = function (where = {
            x: m.pos.x + 30 * Math.cos(m.angle),
            y: m.pos.y + 30 * Math.sin(m.angle)
        }, angle = m.angle, size = 1) {
            const me = bullet.length;
            bullet[me] = Bodies.circle(where.x, where.y, 15, b.fireAttributes(angle, false));
            Matter.Body.setDensity(bullet[me], 0.0003);
            bullet[me].explodeRad = 350 * size + Math.floor(Math.random() * 50) + tech.isBlockExplode * 100
            bullet[me].onEnd = b.grenadeEnd
            bullet[me].minDmgSpeed = 1;
            bullet[me].beforeDmg = function () {
                this.endCycle = 0; //bullet ends cycle after doing damage  //this also triggers explosion
            };
            speed = m.crouch ? 46 : 32
            Matter.Body.setVelocity(bullet[me], {
                x: m.Vx / 2 + speed * Math.cos(angle),
                y: m.Vy / 2 + speed * Math.sin(angle)
            });
            Composite.add(engine.world, bullet[me]); //add bullet to world
            bullet[me].endCycle = simulation.cycle + 70 * tech.bulletsLastLonger;
            bullet[me].frictionAir = 0.07;
            bullet[me].suckCycles = 40
            const MAG = 0.015
            bullet[me].thrust = {
                x: bullet[me].mass * MAG * Math.cos(angle),
                y: bullet[me].mass * MAG * Math.sin(angle)
            }
            bullet[me].suck = function () {
                const suck = (who, radius = this.explodeRad * 3.2) => {
                    for (i = 0, len = who.length; i < len; i++) {
                        const sub = Vector.sub(this.position, who[i].position);
                        const dist = Vector.magnitude(sub);
                        if (dist < radius && dist > 150 && !who.isInvulnerable && who[i] !== this) {
                            knock = Vector.mult(Vector.normalise(sub), mag * who[i].mass / Math.sqrt(dist));
                            who[i].force.x += knock.x;
                            who[i].force.y += knock.y;
                        }
                    }
                }
                let mag = 0.1
                if (simulation.cycle > this.endCycle - 5) {
                    mag = -0.22
                    suck(mob, this.explodeRad * 3)
                    suck(body, this.explodeRad * 2)
                    suck(powerUp, this.explodeRad * 1.5)
                    suck(bullet, this.explodeRad * 1.5)
                    suck([player], this.explodeRad * 1.3)
                } else {
                    mag = 0.11
                    suck(mob, this.explodeRad * 3)
                    suck(body, this.explodeRad * 2)
                    suck(powerUp, this.explodeRad * 1.5)
                    suck(bullet, this.explodeRad * 1.5)
                    suck([player], this.explodeRad * 1.3)
                }

                Matter.Body.setVelocity(this, {
                    x: 0,
                    y: 0
                }); //keep bomb in place
                //draw suck
                const radius = 2.75 * this.explodeRad * (this.endCycle - simulation.cycle) / this.suckCycles
                ctx.fillStyle = "rgba(0,0,0,0.1)";
                ctx.beginPath();
                ctx.arc(this.position.x, this.position.y, radius, 0, 2 * Math.PI);
                ctx.fill();
            }
            bullet[me].do = function () {
                if (simulation.cycle > this.endCycle - this.suckCycles) { //suck
                    this.do = this.suck
                } else if (Matter.Query.collides(this, map).length || Matter.Query.collides(this, body).length) {
                    Matter.Body.setPosition(this, Vector.sub(this.position, this.velocity)) //undo last movement
                    this.do = this.suck
                } else {
                    this.force.x += this.thrust.x;
                    this.force.y += this.thrust.y;
                }
            };
        }
        grenadeVacuum = function (where = {
            x: m.pos.x + 30 * Math.cos(m.angle),
            y: m.pos.y + 30 * Math.sin(m.angle)
        }, angle = m.angle, size = 1) {
            const me = bullet.length;
            bullet[me] = Bodies.circle(where.x, where.y, 20, b.fireAttributes(angle, false));
            Matter.Body.setDensity(bullet[me], 0.0002);
            bullet[me].explodeRad = 350 * size + Math.floor(Math.random() * 50) + tech.isBlockExplode * 100
            bullet[me].onEnd = b.grenadeEnd
            bullet[me].beforeDmg = function () {
                this.endCycle = 0; //bullet ends cycle after doing damage  //this also triggers explosion
            };
            bullet[me].restitution = 0.4;
            bullet[me].do = function () {
                this.force.y += this.mass * 0.0025; //extra gravity for harder arcs

                const suckCycles = 40
                if (simulation.cycle > this.endCycle - suckCycles) { //suck
                    const that = this

                    function suck(who, radius = that.explodeRad * 3.2) {
                        for (i = 0, len = who.length; i < len; i++) {
                            const sub = Vector.sub(that.position, who[i].position);
                            const dist = Vector.magnitude(sub);
                            if (dist < radius && dist > 150 && !who.isInvulnerable) {
                                knock = Vector.mult(Vector.normalise(sub), mag * who[i].mass / Math.sqrt(dist));
                                who[i].force.x += knock.x;
                                who[i].force.y += knock.y;
                            }
                        }
                    }
                    let mag = 0.1
                    if (simulation.cycle > this.endCycle - 5) {
                        mag = -0.22
                        suck(mob, this.explodeRad * 3)
                        suck(body, this.explodeRad * 2)
                        suck(powerUp, this.explodeRad * 1.5)
                        suck(bullet, this.explodeRad * 1.5)
                        suck([player], this.explodeRad * 1.3)
                    } else {
                        mag = 0.11
                        suck(mob, this.explodeRad * 3)
                        suck(body, this.explodeRad * 2)
                        suck(powerUp, this.explodeRad * 1.5)
                        suck(bullet, this.explodeRad * 1.5)
                        suck([player], this.explodeRad * 1.3)
                    }
                    //keep bomb in place
                    Matter.Body.setVelocity(this, {
                        x: 0,
                        y: 0
                    });
                    //draw suck
                    const radius = 2.75 * this.explodeRad * (this.endCycle - simulation.cycle) / suckCycles
                    ctx.fillStyle = "rgba(0,0,0,0.1)";
                    ctx.beginPath();
                    ctx.arc(this.position.x, this.position.y, radius, 0, 2 * Math.PI);
                    ctx.fill();
                }
            };
            speed = 35
            // speed = m.crouch ? 43 : 32

            bullet[me].endCycle = simulation.cycle + 70 * tech.bulletsLastLonger;
            if (m.crouch) {
                speed += 9
                bullet[me].endCycle += 20;
            }
            Matter.Body.setVelocity(bullet[me], {
                x: m.Vx / 2 + speed * Math.cos(angle),
                y: m.Vy / 2 + speed * Math.sin(angle)
            });
            Composite.add(engine.world, bullet[me]); //add bullet to world
        }

        grenadeNeutron = function (where = { x: m.pos.x + 30 * Math.cos(m.angle), y: m.pos.y + 30 * Math.sin(m.angle) }, angle = m.angle, size = 1) {
            const me = bullet.length;
            bullet[me] = Bodies.polygon(where.x, where.y, 10, 4, b.fireAttributes(angle, false));
            b.fireProps((m.crouch ? 45 : 25) / Math.pow(0.92, tech.missileCount), m.crouch ? 35 : 20, angle, me); //cd , speed
            Matter.Body.setDensity(bullet[me], 0.000001);
            bullet[me].endCycle = 500 + simulation.cycle;
            bullet[me].frictionAir = 0;
            bullet[me].friction = 1;
            bullet[me].frictionStatic = 1;
            bullet[me].restitution = 0;
            bullet[me].minDmgSpeed = 0;
            bullet[me].damageRadius = 100;
            bullet[me].maxDamageRadius = 450 * size + 130 * tech.isNeutronSlow //+ 150 * Math.random()
            bullet[me].radiusDecay = (0.81 + 0.15 * tech.isNeutronSlow) / tech.bulletsLastLonger
            bullet[me].stuckTo = null;
            bullet[me].stuckToRelativePosition = null;
            if (tech.isRPG) {
                const SCALE = 2
                Matter.Body.scale(bullet[me], SCALE, SCALE);
                speed = m.crouch ? 25 : 15
                // speed = m.crouch ? 43 : 32
                Matter.Body.setVelocity(bullet[me], { x: m.Vx / 2 + speed * Math.cos(angle), y: m.Vy / 2 + speed * Math.sin(angle) });
                const MAG = 0.005
                bullet[me].thrust = { x: bullet[me].mass * MAG * Math.cos(angle), y: bullet[me].mass * MAG * Math.sin(angle) }
            }

            bullet[me].beforeDmg = function () { };
            bullet[me].stuck = function () { };
            bullet[me].do = function () {
                const onCollide = () => {
                    this.collisionFilter.mask = 0; //non collide with everything
                    Matter.Body.setVelocity(this, { x: 0, y: 0 });
                    if (tech.isRPG) this.thrust = { x: 0, y: 0 }
                    this.do = this.radiationMode;
                }
                const mobCollisions = Matter.Query.collides(this, mob)
                if (mobCollisions.length) {
                    onCollide()
                    this.stuckTo = mobCollisions[0].bodyA
                    mobs.statusDoT(this.stuckTo, 0.6, 360) //apply radiation damage status effect on direct hits
                    if (this.stuckTo.isVerticesChange) {
                        this.stuckToRelativePosition = { x: 0, y: 0 }
                    } else {
                        //find the relative position for when the mob is at angle zero by undoing the mobs rotation
                        this.stuckToRelativePosition = Vector.rotate(Vector.sub(this.position, this.stuckTo.position), -this.stuckTo.angle)
                    }
                    this.stuck = function () {
                        if (this.stuckTo && this.stuckTo.alive) {
                            const rotate = Vector.rotate(this.stuckToRelativePosition, this.stuckTo.angle) //add in the mob's new angle to the relative position vector
                            Matter.Body.setPosition(this, Vector.add(Vector.add(rotate, this.stuckTo.velocity), this.stuckTo.position))
                            Matter.Body.setVelocity(this, this.stuckTo.velocity); //so that it will move properly if it gets unstuck
                        } else {
                            this.collisionFilter.mask = cat.map | cat.body | cat.player | cat.mob; //non collide with everything but map
                            this.stuck = function () {
                                this.force.y += this.mass * 0.001;
                            }
                        }
                    }
                } else {
                    const bodyCollisions = Matter.Query.collides(this, body)
                    if (bodyCollisions.length) {
                        if (!bodyCollisions[0].bodyA.isNotHoldable) {
                            onCollide()
                            this.stuckTo = bodyCollisions[0].bodyA
                            //find the relative position for when the mob is at angle zero by undoing the mobs rotation
                            this.stuckToRelativePosition = Vector.rotate(Vector.sub(this.position, this.stuckTo.position), -this.stuckTo.angle)
                        } else {
                            this.do = this.radiationMode;
                        }
                        this.stuck = function () {
                            if (this.stuckTo) {
                                const rotate = Vector.rotate(this.stuckToRelativePosition, this.stuckTo.angle) //add in the mob's new angle to the relative position vector
                                Matter.Body.setPosition(this, Vector.add(Vector.add(rotate, this.stuckTo.velocity), this.stuckTo.position))
                                // Matter.Body.setVelocity(this, this.stuckTo.velocity); //so that it will move properly if it gets unstuck
                            } else {
                                this.force.y += this.mass * 0.001;
                            }
                        }
                    } else {
                        if (Matter.Query.collides(this, map).length) {
                            onCollide()
                        } else if (tech.isRPG) { //if colliding with nothing
                            this.force.x += this.thrust.x;
                            this.force.y += this.thrust.y;
                        } else {
                            this.force.y += this.mass * 0.001;
                        }
                    }
                }
            }
            bullet[me].radiationMode = function () { //the do code after the bullet is stuck on something,  projects a damaging radiation field
                this.stuck(); //runs different code based on what the bullet is stuck to
                this.damageRadius = this.damageRadius * 0.85 + 0.15 * this.maxDamageRadius //smooth radius towards max
                this.maxDamageRadius -= this.radiusDecay
                if (this.damageRadius < 15) {
                    this.endCycle = 0;
                } else {
                    //aoe damage to player
                    if (Vector.magnitude(Vector.sub(player.position, this.position)) < this.damageRadius) {
                        const DRAIN = (tech.isRadioactiveResistance ? 0.0025 * 0.25 : 0.0025)
                        if (m.energy > DRAIN) {
                            if (m.immuneCycle < m.cycle) m.energy -= DRAIN
                        } else {
                            m.energy = 0;
                            if (simulation.dmgScale) m.damage((tech.isRadioactiveResistance ? 0.00016 * 0.25 : 0.00016) * tech.radioactiveDamage) //0.00015
                        }
                    }
                    //aoe damage to mobs
                    let dmg = m.dmgScale * 0.15 * tech.radioactiveDamage
                    for (let i = 0, len = mob.length; i < len; i++) {
                        if (Vector.magnitude(Vector.sub(mob[i].position, this.position)) < this.damageRadius + mob[i].radius) {
                            if (Matter.Query.ray(map, mob[i].position, this.position).length > 0) dmg *= 0.2 //reduce damage if a wall is in the way
                            mob[i].damage(mob[i].shield ? dmg * 3 : dmg);
                            mob[i].locatePlayer();
                            if (tech.isNeutronSlow && mob[i].speed > 4) {
                                Matter.Body.setVelocity(mob[i], { x: mob[i].velocity.x * 0.97, y: mob[i].velocity.y * 0.97 });
                            }
                        }
                    }
                    ctx.beginPath();
                    ctx.arc(this.position.x, this.position.y, this.damageRadius, 0, 2 * Math.PI);
                    ctx.globalCompositeOperation = "lighter"
                    ctx.fillStyle = `rgba(25,139,170,${0.2 + 0.06 * Math.random()})`;
                    ctx.fill();
                    ctx.globalCompositeOperation = "source-over"
                    if (tech.isNeutronSlow) {
                        let slow = (who, radius = this.explodeRad * 3.2) => {
                            for (i = 0, len = who.length; i < len; i++) {
                                const sub = Vector.sub(this.position, who[i].position);
                                const dist = Vector.magnitude(sub);
                                if (dist < radius) {
                                    Matter.Body.setVelocity(who[i], { x: who[i].velocity.x * 0.975, y: who[i].velocity.y * 0.975 });
                                }
                            }
                        }
                        slow(body, this.damageRadius)
                        slow([player], this.damageRadius)
                    }
                }
            }
        }

        if (tech.isNeutronBomb) {
            b.grenade = grenadeNeutron
            if (tech.isRPG) {
                b.guns[5].do = function () { }
            } else {
                b.guns[5].do = function () {
                    if (!input.field && m.crouch) {
                        const cycles = 80
                        const speed = m.crouch ? 35 : 20 //m.crouch ? 43 : 32
                        const g = m.crouch ? 0.137 : 0.135
                        const v = {
                            x: speed * Math.cos(m.angle),
                            y: speed * Math.sin(m.angle)
                        }
                        ctx.strokeStyle = "rgba(68, 68, 68, 0.2)" //color.map
                        ctx.lineWidth = 2
                        ctx.beginPath()
                        for (let i = 1, len = 19; i < len + 1; i++) {
                            const time = cycles * i / len
                            ctx.lineTo(m.pos.x + time * v.x, m.pos.y + time * v.y + g * time * time)
                        }
                        ctx.stroke()
                    }
                }
            }
        } else if (tech.isRPG) {
            b.guns[5].do = function () { }
            if (tech.isVacuumBomb) {
                b.grenade = grenadeRPGVacuum
            } else {
                b.grenade = grenadeRPG
            }
        } else if (tech.isVacuumBomb) {
            b.grenade = grenadeVacuum
            b.guns[5].do = function () {
                if (!input.field && m.crouch) {
                    const cycles = Math.floor(m.crouch ? 50 : 30) //30
                    const speed = m.crouch ? 44 : 35
                    const v = { x: speed * Math.cos(m.angle), y: speed * Math.sin(m.angle) }
                    ctx.strokeStyle = "rgba(68, 68, 68, 0.2)" //color.map
                    ctx.lineWidth = 2
                    ctx.beginPath()
                    for (let i = 1.6, len = 19; i < len + 1; i++) {
                        const time = cycles * i / len
                        ctx.lineTo(m.pos.x + time * v.x, m.pos.y + time * v.y + 0.34 * time * time)
                    }
                    ctx.stroke()
                }
            }
        } else {
            b.grenade = grenadeDefault
            b.guns[5].do = function () {
                if (!input.field && m.crouch) {
                    const cycles = Math.floor(m.crouch ? 120 : 80) //30
                    const speed = m.crouch ? 43 : 32
                    const v = { x: speed * Math.cos(m.angle), y: speed * Math.sin(m.angle) } //m.Vy / 2 + removed to make the path less jerky
                    ctx.strokeStyle = "rgba(68, 68, 68, 0.2)" //color.map
                    ctx.lineWidth = 2
                    ctx.beginPath()
                    for (let i = 0.5, len = 19; i < len + 1; i++) {
                        const time = cycles * i / len
                        ctx.lineTo(m.pos.x + time * v.x, m.pos.y + time * v.y + 0.34 * time * time)
                    }
                    ctx.stroke()
                }
            }
        }

        const oldGrenade = b.grenade;
        b.grenade = (where, angle, size) => {
            const data = new Uint8Array(new ArrayBuffer(32));
            data[0] = 18;
            data[31] = m.crouch ? 1 : 0;
            const dataView = new DataView(data.buffer);
            dataView.setFloat64(1, where.x);
            dataView.setFloat64(9, where.y);
            dataView.setFloat64(17, angle);
            dataView.setFloat32(25, size);
            dcRemote.send(dataView);

            // oldGrenade(where, angle, size, crouch);
        }
    }

    const oldHarpoon = b.harpoon;
    b.harpoon = (where, target, angle = m.angle, harpoonSize = 1, isReturn = false, totalCycles = 35, isReturnAmmo = true, thrust = 0.1) => {
        const data = new Uint8Array(new ArrayBuffer(46));
        data[0] = 19;
        data[31] = isReturn ? 1 : 0;
        data[36] = isReturnAmmo ? 1 : 0;
        const dataView = new DataView(data.buffer);
        dataView.setFloat64(1, where.x);
        dataView.setFloat64(9, where.y);
        dataView.setUint32(17, target);
        dataView.setFloat64(21, angle);
        dataView.setUint16(29, harpoonSize);
        dataView.setFloat32(32, totalCycles);
        dataView.setFloat64(37, thrust);
        dataView.setUint8(45, 2);
        dcRemote.send(dataView);

        // oldHarpoon(where, target, angle, harpoonSize, isReturn, totalCycles, isReturnAmmo, thrust);
    }

    b.guns[4].fire = () => {
        const countReduction = Math.pow(0.86, tech.missileCount)
        m.fireCDcycle = m.cycle + tech.missileFireCD * b.fireCDscale / countReduction; // cool down
        const direction = {
            x: Math.cos(m.angle),
            y: Math.sin(m.angle)
        }
        
        if (tech.missileCount > 1) {
            const push = Vector.mult(Vector.perp(direction), 0.2 * countReduction / Math.sqrt(tech.missileCount))
            const sqrtCountReduction = Math.sqrt(countReduction)
            
            const launchDelay = 4
            let count = 0
            const fireMissile = () => {
                if (m.crouch) {
                    const me = bullet.length;
                    // b.missile({
                    //     x: m.pos.x + 30 * direction.x,
                    //     y: m.pos.y + 30 * direction.y
                    // }, m.angle, 20, sqrtCountReduction)
                    const extraForce = { x: 0.5 * push.x * (Math.random() - 0.5), y: 0.004 + 0.5 * push.y * (Math.random() - 0.5) }
                    // bullet[bullet.length - 1].force.x += extraForce.x;
                    // bullet[bullet.length - 1].force.y += extraForce.y;
                    // console.log({ x: bullet[me].position.x, y: bullet[me].position.y, forceX: bullet[me].force.x, forceY: bullet[me].force.y, mass: bullet[me].mass, angle: bullet[me].angle});
                    // simulation.ephemera.push({do: () => {simulation.ephemera.length -= 1; console.log({ x: bullet[me].position.x, y: bullet[me].position.y, forceX: bullet[me].force.x, forceY: bullet[me].force.y, mass: bullet[me].mass, angle: bullet[me].angle})}})

                    const data = new Uint8Array(new ArrayBuffer(71));
                    data[0] = 20;
                    const dataView = new DataView(data.buffer);
                    dataView.setFloat64(1, m.pos.x + 30 * direction.x);
                    dataView.setFloat64(9, m.pos.y + 30 * direction.y);
                    dataView.setFloat64(17, m.angle);
                    dataView.setFloat64(25, 20);
                    dataView.setUint16(33, sqrtCountReduction);
                    dataView.setFloat64(55, extraForce.x);
                    dataView.setFloat64(63, extraForce.y);
                    dcRemote.send(dataView);
                } else {
                    const me = bullet.length;
                    // b.missile({
                    //     x: m.pos.x + 30 * direction.x,
                    //     y: m.pos.y + 30 * direction.y
                    // }, m.angle, -15, sqrtCountReduction)
                    const extraForce = { x: push.x * (Math.random() - 0.5), y: 0.005 + push.y * (Math.random() - 0.5) }
                    // bullet[bullet.length - 1].force.x += extraForce.x
                    // bullet[bullet.length - 1].force.y += extraForce.y
                    // console.log({ x: bullet[me].position.x, y: bullet[me].position.y, forceX: bullet[me].force.x, forceY: bullet[me].force.y, mass: bullet[me].mass, angle: bullet[me].angle});
                    // simulation.ephemera.push({do: () => {simulation.ephemera.length -= 1; console.log({ x: bullet[me].position.x, y: bullet[me].position.y, forceX: bullet[me].force.x, forceY: bullet[me].force.y, mass: bullet[me].mass, angle: bullet[me].angle})}})

                    const data = new Uint8Array(new ArrayBuffer(71));
                    data[0] = 20;
                    const dataView = new DataView(data.buffer);
                    dataView.setFloat64(1, m.pos.x + 30 * direction.x);
                    dataView.setFloat64(9, m.pos.y + 30 * direction.y);
                    dataView.setFloat64(17, m.angle);
                    dataView.setFloat64(25, -15);
                    dataView.setUint16(33, sqrtCountReduction);
                    dataView.setFloat64(55, extraForce.x);
                    dataView.setFloat64(63, extraForce.y);
                    dcRemote.send(dataView);
                }
            }
            // const cycle = () => {
            //     if ((simulation.paused || m.isBodiesAsleep) && m.alive) {
            //         requestAnimationFrame(cycle)
            //     } else {
            //         count++
            //         if (!(count % launchDelay)) {
            //             fireMissile()
            //         }
            //         if (count < tech.missileCount * launchDelay && m.alive) requestAnimationFrame(cycle);
            //     }
            // }
            // requestAnimationFrame(cycle);
        } else {
            if (m.crouch) {
                const me = bullet.length;
                // b.missile({
                //     x: m.pos.x + 40 * direction.x,
                //     y: m.pos.y + 40 * direction.y
                // }, m.angle, 25)
                // console.log({ x: bullet[me].position.x, y: bullet[me].position.y, forceX: bullet[me].force.x, forceY: bullet[me].force.y, mass: bullet[me].mass, angle: bullet[me].angle});
                // simulation.ephemera.push({do: () => {simulation.ephemera.length -= 1; console.log({ x: bullet[me].position.x, y: bullet[me].position.y, forceX: bullet[me].force.x, forceY: bullet[me].force.y, mass: bullet[me].mass, angle: bullet[me].angle})}})

                const data = new Uint8Array(new ArrayBuffer(71));
                data[0] = 20;
                const dataView = new DataView(data.buffer);
                dataView.setFloat64(1, m.pos.x + 40 * direction.x);
                dataView.setFloat64(9, m.pos.y + 40 * direction.y);
                dataView.setFloat64(17, m.angle);
                dataView.setFloat64(25, 25);
                dataView.setUint16(33, 1);
                dataView.setFloat64(55, 0);
                dataView.setFloat64(63, 0);
                dcRemote.send(dataView);
            } else {
                const me = bullet.length;
                // b.missile({
                //     x: m.pos.x + 40 * direction.x,
                //     y: m.pos.y + 40 * direction.y
                // }, m.angle, -12)
                const extraForce = 0.04 * (Math.random() - 0.2);
                // console.log({ extraForce })
                // bullet[me].force.y += extraForce;
                // console.log({ x: bullet[me].position.x, y: bullet[me].position.y, forceX: bullet[me].force.x, forceY: bullet[me].force.y, mass: bullet[me].mass, angle: bullet[me].angle});
                // simulation.ephemera.push({do: () => {simulation.ephemera.length -= 1; console.log({ x: bullet[me].position.x, y: bullet[me].position.y, forceX: bullet[me].force.x, forceY: bullet[me].force.y, mass: bullet[me].mass, angle: bullet[me].angle})}})

                const data = new Uint8Array(new ArrayBuffer(71));
                data[0] = 20;
                const dataView = new DataView(data.buffer);
                dataView.setFloat64(1, m.pos.x + 40 * direction.x);
                dataView.setFloat64(9, m.pos.y + 40 * direction.y);
                dataView.setFloat64(17, m.angle);
                dataView.setFloat64(25, -12);
                dataView.setUint16(33, 1);
                dataView.setFloat64(55, 0);
                dataView.setFloat64(63, extraForce);
                dcRemote.send(dataView);
            }
        }
    }

    const oldLaser = b.laser;
    b.laser = (where = { x: m.pos.x + 20 * Math.cos(m.angle), y: m.pos.y + 20 * Math.sin(m.angle) }, whereEnd = { x: where.x + 3000 * Math.cos(m.angle), y: where.y + 3000 * Math.sin(m.angle) }, dmg = tech.laserDamage, reflections = tech.laserReflections, isThickBeam = false, push = 1) => {
        const data = new Uint8Array(new ArrayBuffer(52));
        data[0] = 23;
        const dataView = new DataView(data.buffer);
        dataView.setFloat64(1, where.x);
        dataView.setFloat64(9, where.y);
        dataView.setFloat64(17, whereEnd.x);
        dataView.setFloat64(25, whereEnd.y);
        dataView.setFloat64(33, dmg);
        dataView.setUint8(41, reflections);
        dataView.setUint8(42, isThickBeam ? 1 : 0);
        dataView.setFloat64(43, push);
        dataView.setUint8(51, 2); // TODO: player id
        dcRemote.send(dataView);

        // oldLaser(where, whereEnd, dmg, reflections, isThickBeam, push);
    }

    let oldM = {
        crouch: false,
        energy: 1,
        fieldMode: 0,
        health: 1,
        holdingTarget: null,
        immuneCycle: 0,
        input: { up: false, down: false, left: false, right: false, field: false, fire: false },
        isCloak: false,
        isHolding: false,
        maxEnergy: 1,
        maxHealth: 1,
        mouseInGame: { x: 0, y: 0 },
        onGround: false,
        pos: { x: 0, y: 0 },
        throwCharge: 0,
        Vx: 0,
        Vy: 0,
        walk_cycle: 0,
        yOff: 70
    }

    const oldStartGame = simulation.startGame;
    simulation.startGame = async () => {
        // sync request
        Math.initialSeed = null;
        const data = new Uint8Array(new ArrayBuffer(1));
        data[0] = 11;
        dcRemote.send(new DataView(data.buffer));
        
        // wait for sync
        await new Promise(async resolve => {
            while (Math.initialSeed == null) await new Promise(res => setTimeout(res, 100));
            resolve();
        })

        const oldDifficulty = simulation.difficultyMode;
        oldStartGame();
        simulation.difficultyMode = oldDifficulty;
        const difficulty = simulation.isCheating ? "testing" : level.difficultyText()
        document.title = `n-gon: (${difficulty})`;
        Math.random = Math.seededRandom;

        const oldThrowBlock = m.throwBlock;
        m.throwBlock = () => {
            const holdingTarget = m.holdingTarget;
            oldThrowBlock();
            const data = new Uint8Array(new ArrayBuffer(43));
            data[0] = 15;
            const dataView = new DataView(data.buffer);
            dataView.setUint16(1, holdingTarget.id);
            dataView.setFloat64(3, holdingTarget.position.x);
            dataView.setFloat64(11, holdingTarget.position.y);
            dataView.setFloat64(19, holdingTarget.angle);
            dataView.setFloat64(27, holdingTarget.velocity.x);
            dataView.setFloat64(35, holdingTarget.velocity.y);
            dcRemote.send(dataView);
        }

        //load player in matter.js physic engine
        let vertices = Vertices.fromPath("0,40, 50,40, 50,115, 30,130, 20,130, 0,115, 0,40"); //player as a series of vertices
        player1.body = Bodies.fromVertices(0, 0, vertices);
        player1.jumpSensor = Bodies.rectangle(0, 46, 36, 6, {
            //this sensor check if the player is on the ground to enable jumping
            sleepThreshold: 99999999999,
            isSensor: true
        });
        vertices = Vertices.fromPath("16 -82  2 -66  2 -37  43 -37  43 -66  30 -82");
        player1.head = Bodies.fromVertices(0, -55, vertices); //this part of the player lowers on crouch
        player1.headSensor = Bodies.rectangle(0, -57, 48, 45, {
            //senses if the player's head is empty and can return after crouching
            sleepThreshold: 99999999999,
            isSensor: true
        });
        player1.hitbox = Body.create({
            parts: [player1.body, player1.head, player1.jumpSensor, player1.headSensor],
            inertia: Infinity,
            friction: 0.002,
            frictionAir: 0.001,
            restitution: 0,
            sleepThreshold: Infinity,
            collisionFilter: {
                group: 0,
                category: cat.player,
                mask: cat.body | cat.map | cat.mob | cat.mobBullet | cat.mobShield
            },
        });
        Matter.Body.setMass(player1.hitbox, player1.mass);
        Composite.add(engine.world, [player1.hitbox]);

        simulation.ephemera.push({ name: 'Player1', count: 0, do: () => {
            player1.angle = Math.atan2(player1.mouseInGame.y - player1.pos.y, player1.mouseInGame.x - player1.pos.x);
            ctx.fillStyle = player1.fillColor;
            ctx.save();
            ctx.globalAlpha = player1.isCloak ? 0.25 : player1.immuneCycle < m.cycle ? 1 : 0.5;
            ctx.translate(player1.pos.x, player1.pos.y);
            player1.calcLeg(Math.PI, -3);
            player1.drawLeg("#4a4a4a");
            player1.calcLeg(0, 0);
            player1.drawLeg("#333");
            ctx.rotate(player1.angle);
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, 2 * Math.PI);
            ctx.fillStyle = player1.bodyGradient;
            ctx.fill();
            ctx.arc(15, 0, 4, 0, 2 * Math.PI);
            ctx.strokeStyle = "#333";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
            powerUps.boost.draw();

            if (!player1.isHolding && (player1.input.field || player1.fieldMode == 1 || player1.fieldMode == 2 || player1.fieldMode == 3 || player1.fieldMode == 8 || player1.fieldMode == 9 || player1.fieldMode == 10)) fieldData[player1.fieldMode].drawField();
            if (player1.holdingTarget) {
                ctx.beginPath(); //draw on each valid body
                let vertices = player1.holdingTarget.vertices;
                ctx.moveTo(vertices[0].x, vertices[0].y);
                for (let i = 1; i < vertices.length; i += 1) ctx.lineTo(vertices[i].x, vertices[i].y);
                ctx.lineTo(vertices[0].x, vertices[0].y);
                ctx.fillStyle = "rgba(190,215,230," + (0.3 + 0.7 * Math.random()) + ")";
                ctx.fill();
    
                ctx.globalAlpha = player1.isHolding ? 1 : 0.2;
                player1.drawHold(player1.holdingTarget);
                ctx.globalAlpha = 1;

                //draw charge
                const x = player1.pos.x + 15 * Math.cos(player1.angle);
                const y = player1.pos.y + 15 * Math.sin(player1.angle);
                const len = player1.holdingTarget.vertices.length - 1;
                const edge = player1.throwCharge * player1.throwCharge * player1.throwCharge;
                const grd = ctx.createRadialGradient(x, y, edge, x, y, edge + 5);
                grd.addColorStop(0, "rgba(255,50,150,0.3)");
                grd.addColorStop(1, "transparent");
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(player1.holdingTarget.vertices[len].x, player1.holdingTarget.vertices[len].y);
                ctx.lineTo(player1.holdingTarget.vertices[0].x, player1.holdingTarget.vertices[0].y);
                ctx.fill();
                for (let i = 0; i < len; i++) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(player1.holdingTarget.vertices[i].x, player1.holdingTarget.vertices[i].y);
                    ctx.lineTo(player1.holdingTarget.vertices[i + 1].x, player1.holdingTarget.vertices[i + 1].y);
                    ctx.fill();
                }
                ctx.strokeStyle = "rgba(68, 68, 68, 0.15)";
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            if (player1.isHolding) {
                player1.energy -= fieldData[player1.fieldMode].fieldRegen;
                if (player1.energy < 0) player1.energy = 0;
                Matter.Body.setPosition(player1.holdingTarget, {
                    x: player1.pos.x + 70 * Math.cos(player1.angle),
                    y: player1.pos.y + 70 * Math.sin(player1.angle)
                });
                Matter.Body.setVelocity(player1.holdingTarget, { x: player1.Vx, y: player1.Vy });
                Matter.Body.rotate(player1.holdingTarget, 0.01 / player1.holdingTarget.mass); //gently spin the block
            }

            if (player1.isCloak) {
                ctx.beginPath();
                ctx.arc(player1.pos.x, player1.pos.y, 35, 0, 2 * Math.PI);
                ctx.strokeStyle = "rgba(255,255,255,0.5)";
                ctx.lineWidth = 6;
                ctx.stroke();
            }
            
            player1.drawHealthbar();
            player1.drawRegenEnergy();

            for (const multiplayerLaser of b.multiplayerLasers) if (new Date().getTime() - multiplayerLaser.created.getTime() < 100) b.multiplayerLaser(multiplayerLaser.where, multiplayerLaser.whereEnd, multiplayerLaser.dmg, multiplayerLaser.reflections, multiplayerLaser.isThickBeam, multiplayerLaser.push);
        }})
        simulation.ephemera.push({ name: 'Broadcast', count: 0, do: () => {
            if (m.onGround != oldM.onGround || m.pos.x != oldM.pos.x || m.pos.y != oldM.pos.y || m.Vx != oldM.Vx || m.Vy != oldM.Vy || m.walk_cycle != oldM.walk_cycle || m.yOff != oldM.yOff) {
                // movement
                const data = new Uint8Array(new ArrayBuffer(58));
                data[0] = 1;
                data[17] = m.onGround ? 1 : 0;
                const dataView = new DataView(data.buffer);
                dataView.setFloat64(1, simulation.mouseInGame.x);
                dataView.setFloat64(9, simulation.mouseInGame.y);
                dataView.setFloat64(18, m.pos.x);
                dataView.setFloat64(26, m.pos.y);
                dataView.setFloat64(34, m.Vx);
                dataView.setFloat64(42, m.Vy);
                dataView.setFloat32(50, m.walk_cycle);
                dataView.setFloat32(54, m.yOff);
                dcRemote.send(dataView);
            } else if (simulation.mouseInGame.x != oldM.mouseInGame.x || simulation.mouseInGame.y != oldM.mouseInGame.y) {
                // rotation
                const data = new Uint8Array(new ArrayBuffer(17));
                data[0] = 0;
                const dataView = new DataView(data.buffer);
                dataView.setFloat64(1, simulation.mouseInGame.x);
                dataView.setFloat64(9, simulation.mouseInGame.y);
                dcRemote.send(dataView);
            }
            if (m.fieldMode != oldM.fieldMode) {
                // set field
                const data = new Uint8Array(new ArrayBuffer(2));
                data[0] = 2;
                data[1] = m.fieldMode;
                dcRemote.send(new DataView(data.buffer));
            }
            if (m.immuneCycle != oldM.immuneCycle) {
                // immune cycle update
                const data = new Uint8Array(new ArrayBuffer(5));
                data[0] = 3;
                const dataView = new DataView(data.buffer);
                dataView.setFloat32(1, m.immuneCycle);
                dcRemote.send(dataView);
            }
            if (m.health != oldM.health) {
                // health update
                const data = new Uint8Array(new ArrayBuffer(5));
                data[0] = 4;
                const dataView = new DataView(data.buffer);
                dataView.setFloat32(1, m.health);
                dcRemote.send(dataView);
            }
            if (m.maxHealth != oldM.maxHealth) {
                // max health update
                const data = new Uint8Array(new ArrayBuffer(5));
                data[0] = 5;
                const dataView = new DataView(data.buffer);
                dataView.setFloat32(1, m.maxHealth);
                dcRemote.send(dataView);
            }
            if (m.energy != oldM.energy) {
                // energy update
                const data = new Uint8Array(new ArrayBuffer(5));
                data[0] = 6;
                const dataView = new DataView(data.buffer);
                dataView.setFloat32(1, m.energy);
                dcRemote.send(dataView);
            }
            if (m.maxEnergy != oldM.maxEnergy) {
                // max energy update
                const data = new Uint8Array(new ArrayBuffer(5))
                data[0] = 7;
                const dataView = new DataView(data.buffer);
                dataView.setFloat32(1, m.maxEnergy);
                dcRemote.send(dataView);
            }
            if (input.up != oldM.input.up || input.down != oldM.input.down || input.left != oldM.input.left || input.right != oldM.input.right || input.field != oldM.input.field || input.fire != oldM.input.fire) {
                // inputs
                const data = new Uint8Array(new ArrayBuffer(7));
                data[0] = 8;
                data[1] = input.up ? 1 : 0;
                data[2] = input.down ? 1 : 0;
                data[3] = input.left ? 1 : 0;
                data[4] = input.right ? 1 : 0;
                data[5] = input.field ? 1 : 0;
                data[6] = input.fire ? 1 : 0;
                dcRemote.send(new DataView(data.buffer));

                if (input.fire == false) b.multiplayerLasers = b.multiplayerLasers.filter(a => a.id != 2);
            }
            if (m.crouch != oldM.crouch) {
                // toggle crouch
                const data = new Uint8Array(new ArrayBuffer(2));
                data[0] = 9;
                data[1] = m.crouch ? 1 : 0;
                dcRemote.send(new DataView(data.buffer));
            }
            if (m.isCloak != oldM.isCloak) {
                // toggle cloak
                const data = new Uint8Array(new ArrayBuffer(2));
                data[0] = 10;
                data[1] = m.isCloak ? 1 : 0;
                dcRemote.send(new DataView(data.buffer));
            }
            if (m.isHolding != oldM.isHolding || m.holdingTarget?.id != oldM.holdingTarget?.id) {
                // hold block
                const data = new Uint8Array(new ArrayBuffer(5));
                data[0] = 21;
                data[1] = m.isHolding ? 1 : 0;
                const dataView = new DataView(data.buffer);
                dataView.setUint16(2, m.holdingTarget?.id || -1);
                dataView.setUint8(4, 2); // TODO: player id
                dcRemote.send(dataView);
            }
            if (m.throwCharge != oldM.throwCharge) {
                // throw charge update
                const data = new Uint8Array(new ArrayBuffer(7));
                data[0] = 22;
                const dataView = new DataView(data.buffer);
                dataView.setFloat32(1, m.throwCharge);
                dataView.setUint8(5, 2); // TODO: player id
                dcRemote.send(dataView);
            }
            
            oldM = {
                crouch: m.crouch,
                energy: m.energy,
                fieldMode: m.fieldMode,
                health: m.health,
                holdingTarget: m.holdingTarget,
                immuneCycle: m.immuneCycle,
                input: { up: input.up, down: input.down, left: input.left, right: input.right, field: input.field, fire: input.fire },
                isCloak: m.isCloak,
                isHolding: m.isHolding,
                maxEnergy: m.maxEnergy,
                maxHealth: m.maxHealth,
                mouseInGame: { x: simulation.mouseInGame.x, y: simulation.mouseInGame.y },
                onGround: m.onGround,
                pos: { x: m.pos.x, y: m.pos.y },
                throwCharge: m.throwCharge,
                Vx: m.Vx,
                Vy: m.Vy,
                walk_cycle: m.walk_cycle,
                yOff: m.yOff
            }
        }})
    }
})();