let player2;

b.multiplayerExplosion = (where, radius, color) => { // typically used for some bullets with .onEnd
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
        if (player2.immuneCycle < m.cycle) {
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
        b.explosion(path[1], explosionRadius, 'rgba(255,25,0,0.6)')
        const off = explosionRadius * 1.2
        b.explosion({
            x: path[1].x + off * (Math.random() - 0.5),
            y: path[1].y + off * (Math.random() - 0.5)
        }, explosionRadius, 'rgba(255,25,0,0.6)')
        b.explosion({
            x: path[1].x + off * (Math.random() - 0.5),
            y: path[1].y + off * (Math.random() - 0.5)
        }, explosionRadius, 'rgba(255,25,0,0.6)')
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
    console.log(size)
    const me = bullet.length;
    bullet[me] = Bodies.circle(where.x, where.y, 15, b.fireAttributes(angle, false));
    Matter.Body.setDensity(bullet[me], 0.0003);
    // bullet[me].multiplayer = true;
    bullet[me].explodeRad = 300 * size; //+ 100 * tech.isBlockExplode;
    bullet[me].onEnd = b.grenadeEnd
    bullet[me].minDmgSpeed = 1;
    bullet[me].beforeDmg = function () {
        this.endCycle = 0; //bullet ends cycle after doing damage  //this also triggers explosion
    };
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
    const origin = playerId == 1 ? m : player2;
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
},

b.multiplayerHarpoon = (where, target, angle, harpoonSize, isReturn, totalCycles, isReturnAmmo, thrust, playerId) => {
    const origin = playerId == 1 ? m : player2;
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

b.multiplayerMissile = (where, angle, speed, size) => {
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
        endCycle: simulation.cycle + Math.floor((230 + 40 * Math.random()) /** tech.bulletsLastLonger + 120 * tech.isMissileBiggest + 60 * tech.isMissileBig*/),
        collisionFilter: {
            category: cat.bullet,
            mask: cat.map | cat.body | cat.mob | cat.mobBullet | cat.mobShield
        },
        minDmgSpeed: 10,
        lookFrequency: Math.floor(10 + Math.random() * 3),
        explodeRad: (/*tech.isMissileBig ? 230 :*/ 180) + 60 * Math.random(),
        density: 0.02, //0.001 is normal
        beforeDmg() {
            Matter.Body.setDensity(this, 0.0001); //reduce density to normal
            this.tryToLockOn();
            this.endCycle = 0; //bullet ends cycle after doing damage  // also triggers explosion
        },
        onEnd() {
            b.explosion(this.position, this.explodeRad * size); //makes bullet do explosive damage at end
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
    // bullet[me].multiplayer = true;
    const thrust = 0.0066 * bullet[me].mass; //* (tech.isMissileBig ? (tech.isMissileBiggest ? 0.3 : 0.7) : 1);
    Matter.Body.setVelocity(bullet[me], {
        x: player2.Vx / 2 + speed * Math.cos(angle),
        y: player2.Vy / 2 + speed * Math.sin(angle)
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
                best.who.damage(damage);
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
    await new Promise(async (resolve, reject) => {
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
        let peerLocal = new RTCPeerConnection(config);

        peerLocal.onconnectionstatechange = function(e) {
            console.log('peerLocal', 'onconnectionstatechange', e);
        };
        peerLocal.ondatachannel = function(e) {
            console.log('peerLocal', 'ondatachannel', e);
        };
        peerLocal.onsignalingstatechange = function(e) {
            console.log('peerLocal', 'onsignalingstatechange', peerLocal.signalingState);
        };
        peerLocal.onicegatheringstatechange = function(e) {
            console.log('peerLocal', 'onicegatheringstatechange', peerLocal.iceGatheringState);
            if (peerLocal.iceGatheringState == 'complete') {
                ws.close();
                resolve();
            }
        };
        peerLocal.onicecandidate = function(e){
            console.log('peerLocal', 'onicecandidate', e.candidate);
            //Share ICE candidates with peerRemote
            console.log('candidate', e.candidate)
            if (e.candidate != null) ws.send(`\x00${JSON.stringify(e.candidate)}`);
        };
        peerLocal.onnegotiationneeded = function(e) {
            console.log('peerLocal', 'onnegotiationneeded', e);
        };
        window.dcLocal = peerLocal.createDataChannel('rtcdc');
        window.dcLocal.onopen = function(e) {
            console.log('dcLocal', 'onopen', e);
            console.log('dcLocal.send("message") to send from server');
        };
        window.dcLocal.onmessage = async (message) => {
            // console.log('dcLocal', 'onmessage', message.data);
            const data = typeof message.data.arrayBuffer == 'function' ? new DataView(await message.data.arrayBuffer()) : new DataView(message.data);
            const id = new Uint8Array(data.buffer)[0];
            if (id == 0) {
                // rotation
                player2.mouseInGame.x = data.getFloat64(1);
                player2.mouseInGame.y = data.getFloat64(9);
            }
            if (id == 1) {
                // movement
                player2.mouseInGame.x = data.getFloat64(1);
                player2.mouseInGame.y = data.getFloat64(9);
                player2.onGround = new Uint8Array(data.buffer)[17] == 1;
                player2.pos.x = data.getFloat64(18);
                player2.pos.y = data.getFloat64(26);
                player2.Vx = data.getFloat64(34);
                player2.Vy = data.getFloat64(42);
                player2.walk_cycle = data.getFloat32(50);
                player2.yOff = data.getFloat32(54);
                Matter.Body.setPosition(player2.hitbox, { x: player2.pos.x, y: player2.pos.y + player2.yOff - 24.714076782448295});
                Matter.Body.setVelocity(player2.hitbox, { x: player2.Vx, y: player2.Vy });
            }
            if (id == 2) {
                // set field
                player2.fieldMode = new Uint8Array(data.buffer)[1];
                player2.fieldMeterColor = fieldData[player2.fieldMode].fieldMeterColor;
                player2.fieldRange = fieldData[player2.fieldMode].fieldRange;
                player2.fieldPosition = { x: player2.pos.x, y: player2.pos.y };
                player2.fieldAngle = player2.angle;
                player2.fieldArc = 0.2;
            }
            if (id == 3) {
                // immune cycle update
                player2.immuneCycle = data.getFloat32(1);
            }
            if (id == 4) {
                // health update
                player2.health = data.getFloat32(1);
            }
            if (id == 5) {
                // max health update
                player2.maxHealth = data.getFloat32(1);
            }
            if (id == 6) {
                // energy update
                player2.energy = data.getFloat32(1);
            }
            if (id == 7) {
                // max energy update
                player2.maxEnergy = data.getFloat32(1);
            }
            if (id == 8) {
                // inputs
                player2.input.up = new Uint8Array(data.buffer)[1] == 1;
                player2.input.down = new Uint8Array(data.buffer)[2] == 1;
                player2.input.left = new Uint8Array(data.buffer)[3] == 1;
                player2.input.right = new Uint8Array(data.buffer)[4] == 1;
                player2.input.field = new Uint8Array(data.buffer)[5] == 1;
                player2.input.fire = new Uint8Array(data.buffer)[6] == 1;
                if (!player2.input.fire) b.multiplayerLasers = b.multiplayerLasers.filter(a => a.id != 2);
            }
            if (id == 9) {
                // toggle crouch
                player2.crouch = new Uint8Array(data.buffer)[1] == 1;
            }
            if (id == 10) {
                // toggle cloak
                player2.isCloak = new Uint8Array(data.buffer)[1] == 1;
            }
            if (id == 11) {
                // sync request
                const textEncoder = new TextEncoder();
                const data = new Uint8Array(new ArrayBuffer(3 + textEncoder.encode(Math.initialSeed).length));
                data[0] = 12;
                data[1] = simulation.difficultyMode;
                data[2] = textEncoder.encode(Math.initialSeed).length;
                data.set(textEncoder.encode(Math.initialSeed), 3);
                dcLocal.send(new DataView(data.buffer));
            }
            if (id == 13) {
                // block info request
                let block;
                for (let i = 0; i < body.length; i++) if (body[i].id == data.getUint16(1)) block = body[i];
                if (block != null) {
                    const data = new Uint8Array(new ArrayBuffer(20 + 16 * block.vertices.length));
                    data[0] = 14;
                    const dataView = new DataView(data.buffer);
                    dataView.setUint16(1, block.id);
                    dataView.setFloat64(3, block.position.x);
                    dataView.setFloat64(11, block.position.y);
                    dataView.setUint8(19, 16 * block.vertices.length);
                    let index = 20;
                    for (const vertex of block.vertices) {
                        dataView.setFloat64(index, vertex.x);
                        dataView.setFloat64(index + 8, vertex.y);
                        index += 16;
                    }
                    dcLocal.send(dataView);
                }
            }
            if (id == 15) {
                // block update
                let found = false;
                for (let i = 0; i < body.length && !found; i++) {
                    if (body[i].id == data.getUint16(1)) {
                        found = true;
                        Matter.Body.setPosition(body[i], { x: data.getFloat64(3), y: data.getFloat64(11) });
                        Matter.Body.setAngle(body[i], data.getFloat64(19));
                        Matter.Body.setVelocity(body[i], { x: data.getFloat64(27), y: data.getFloat64(35) });
                    }
                }
            }
            if (id == 16) {
                // explosion
                b.multiplayerExplosion({ x: data.getFloat64(1), y: data.getFloat64(9) }, data.getFloat64(17), new TextDecoder().decode(data.buffer.slice(26, new Uint8Array(data.buffer)[25] + 26)));
                dcLocal.send(data);
            }
            if (id == 17) {
                // pulse
                b.multiplayerPulse(data.getFloat64(1), data.getFloat64(9), { x: data.getFloat64(17), y: data.getFloat64(25) });
                dcLocal.send(data);
            }
            if (id == 18) {
                // grenade
                b.multiplayerGrenade({ x: data.getFloat64(1), y: data.getFloat64(9) }, data.getFloat64(17), data.getFloat32(25), new Uint8Array(data.buffer)[31] == 1);
                dcLocal.send(data);
            }
            if (id == 19) {
                // harpoon
                b.multiplayerHarpoon({ x: data.getFloat64(1), y: data.getFloat64(9) }, data.getUint32(17), data.getFloat64(21), data.getUint16(29), new Uint8Array(data.buffer)[31] == 1, data.getFloat32(32), new Uint8Array(data.buffer)[36] == 1, data.getFloat64(37), 2);
                dcLocal.send(data);
            }
            if (id == 20) {
                // missile
                const me = bullet.length;
                b.multiplayerMissile({ x: data.getFloat64(1), y: data.getFloat64(9) }, data.getFloat64(17), data.getFloat64(25), data.getUint16(33));
                bullet[me].force.x += data.getFloat64(55);
                bullet[me].force.y += data.getFloat64(63);
                // console.log({ extraForce: { x: data.getFloat64(55), y: data.getFloat64(63) }});
                // console.log({ x: bullet[me].position.x, y: bullet[me].position.y, forceX: bullet[me].force.x, forceY: bullet[me].force.y, mass: bullet[me].mass, angle: bullet[me].angle});
                // simulation.ephemera.push({do: () => {simulation.ephemera.length -= 1; console.log({ x: bullet[me].position.x, y: bullet[me].position.y, forceX: bullet[me].force.x, forceY: bullet[me].force.y, mass: bullet[me].mass, angle: bullet[me].angle})}})
                const dataView = new DataView(data.buffer);
                dataView.setFloat32(35, bullet[me].endCycle - m.cycle);
                dataView.setFloat64(39, bullet[me].lookFrequency);
                dataView.setFloat64(47, bullet[me].explodeRad);
                dcLocal.send(dataView);
            }
            if (id == 21) {
                // hold block
                player2.isHolding = data.getUint8(1) == 1;
                if (!player2.isHolding && player2.holdingTarget) {
                    player2.holdingTarget.collisionFilter.category = cat.body;
                    player2.holdingTarget.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet;
                }
                player2.holdingTarget = data.getUint16(2) == -1 ? null : body.find(block => block.id == data.getUint16(2));
                if (player2.isHolding) {
                    player2.holdingTarget.collisionFilter.category = 0;
                    player2.holdingTarget.collisionFilter.mask = 0;
                }
            }
            if (id == 22) {
                // throw charge update
                player2.throwCharge = data.getFloat32(1);
            }
            if (id == 23) {
                // laser
                b.multiplayerLasers = b.multiplayerLasers.filter(a => a.id != 2);
                b.multiplayerLasers.push({ id: 2, created: new Date(), where: { x: data.getFloat64(1), y: data.getFloat64(9) }, whereEnd: { x: data.getFloat64(17), y: data.getFloat64(25) }, dmg: data.getFloat64(33), reflections: data.getUint8(41), isThickBeam: data.getUint8(42) == 1, push: data.getFloat64(43) });
                const dataView = new DataView(data.buffer);
                dataView.setUint8(51, 2);
                dcLocal.send(data);
            }
            if (id == 25) {
                // powerup info request
                const powerup = powerUp.find(a => a.id == data.getUint16(1));
                if (powerUp != null) {
                    const textEncoder = new TextEncoder();
                    const data = new Uint8Array(new ArrayBuffer(28 + textEncoder.encode(powerup.name).length));
                    data[0] = 26;
                    data.set(textEncoder.encode(powerup.name), 28)
                    const dataView = new DataView(data.buffer);
                    dataView.setUint16(1, powerup.id);
                    dataView.setFloat64(3, powerup.position.x);
                    dataView.setFloat64(11, powerup.position.y);
                    dataView.setFloat64(19, powerup.size);
                    dataView.setUint8(27, textEncoder.encode(powerup.name).length);
                    dcLocal.send(dataView);
                }
            }
            if (id == 29) {
                // mob info request
                const requestedMob = mob.find(a => a.id == data.getUint16(1));
                if (requestedMob != null && !requestedMob.isUnblockable) {
                    const color = requestedMob.fill; // == 'transparent' ? '#000' : requestedMob.fill;
                    const stroke = requestedMob.stroke; // == 'transparent' ? '#000' : requestedMob.stroke;
                    const textEncoder = new TextEncoder();
                    const data = new Uint8Array(new ArrayBuffer(42 + textEncoder.encode(color).length + textEncoder.encode(stroke).length));
                    data[0] = 30;
                    data.set(textEncoder.encode(color), 37);
                    data.set(textEncoder.encode(stroke), 42 + textEncoder.encode(color).length);
                    const dataView = new DataView(data.buffer);
                    dataView.setUint16(1, requestedMob.id);
                    dataView.setFloat64(3, requestedMob.position.x);
                    dataView.setFloat64(11, requestedMob.position.y);
                    dataView.setFloat64(19, requestedMob.angle);
                    dataView.setUint8(27, requestedMob.vertices.length);
                    dataView.setFloat64(28, requestedMob.radius);
                    dataView.setUint8(36, textEncoder.encode(color).length);
                    dataView.setFloat32(37 + textEncoder.encode(color).length, requestedMob.alpha || 1);
                    dataView.setUint8(41 + textEncoder.encode(color).length, textEncoder.encode(stroke).length);
                    dcLocal.send(dataView);
                }
            }
        };
        window.dcLocal.onerror = function(e) {
            console.error('dcLocal', 'onerror', e);
        };
        window.dcLocal.onclose = function(e) {
            console.log('dcLocal', 'onclose', e);
        };

        console.log('peerLocal', 'createOffer');
        let peerLocalOffer = await peerLocal.createOffer();

        ws = new WebSocket('ws://localhost' /*'wss://n-gon.cornbread2100.com'*/);
        ws.onopen = async () => {
            console.log('connected');
            ws.send(`\x00${JSON.stringify(peerLocalOffer)}`);
        }
        let state = 0;
        ws.onmessage = async (message) => {
            console.log('message:', message.data)

            if (message.data[0] == '\x00') {
                if (state == 0) {
                    alert(`Join code: ${message.data.substring(1)}`);
                    state++;
                } else {
                    const peerRemoteAnswer = new RTCSessionDescription(JSON.parse(message.data.substring(1)));
                    console.log('peerLocal', 'setLocalDescription', peerLocalOffer);
                    await peerLocal.setLocalDescription(peerLocalOffer);
                    console.log('peerLocal', 'setRemoteDescription', peerRemoteAnswer);
                    await peerLocal.setRemoteDescription(peerRemoteAnswer);
                }
            }
            if (message.data[0] == '\x01') peerLocal.addIceCandidate(new RTCIceCandidate(JSON.parse(message.data.substring(1))));
            if (message.data[0] == '\x02') console.error(message.data.substring(1));
        }
        ws.onerror = (err) => {
            console.error(err);
        }
        ws.onclose = () => {
            console.log('disconnected');
        }
    });

    const fieldData = [
        {
            // field emitter
            do: () => {},
            drawField: () => {
                if (player2.holdingTarget) {
                    ctx.fillStyle = "rgba(110,170,200," + (m.energy * (0.05 + 0.05 * Math.random())) + ")";
                    ctx.strokeStyle = "rgba(110, 200, 235, " + (0.3 + 0.08 * Math.random()) + ")";
                } else {
                    ctx.fillStyle = "rgba(110,170,200," + (0.02 + player2.energy * (0.15 + 0.15 * Math.random())) + ")";
                    ctx.strokeStyle = "rgba(110, 200, 235, " + (0.6 + 0.2 * Math.random()) + ")";
                }
                const range = player2.fieldRange;
                ctx.beginPath();
                ctx.arc(player2.pos.x, player2.pos.y, range, player2.angle - Math.PI * player2.fieldArc, player2.angle + Math.PI * player2.fieldArc, false);
                ctx.lineWidth = 2;
                ctx.stroke();
                let eye = 13;
                let aMag = 0.75 * Math.PI * player2.fieldArc
                let a = player2.angle + aMag
                let cp1x = player2.pos.x + 0.6 * range * Math.cos(a)
                let cp1y = player2.pos.y + 0.6 * range * Math.sin(a)
                ctx.quadraticCurveTo(cp1x, cp1y, player2.pos.x + eye * Math.cos(player2.angle), player2.pos.y + eye * Math.sin(player2.angle))
                a = player2.angle - aMag
                cp1x = player2.pos.x + 0.6 * range * Math.cos(a)
                cp1y = player2.pos.y + 0.6 * range * Math.sin(a)
                ctx.quadraticCurveTo(cp1x, cp1y, player2.pos.x + 1 * range * Math.cos(player2.angle - Math.PI * player2.fieldArc), player2.pos.y + 1 * range * Math.sin(player2.angle - Math.PI * player2.fieldArc))
                ctx.fill();
        
                //draw random lines in field for cool effect
                let offAngle = player2.angle + 1.7 * Math.PI * player2.fieldArc * (Math.random() - 0.5);
                ctx.beginPath();
                eye = 15;
                ctx.moveTo(player2.pos.x + eye * Math.cos(player2.angle), player2.pos.y + eye * Math.sin(player2.angle));
                ctx.lineTo(player2.pos.x + range * Math.cos(offAngle), player2.pos.y + range * Math.sin(offAngle));
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
            do: () => {},
            drawField: () => {
                player2.harmonicRadius = 1; // TODO: changes with expansion tech
                const fieldRange1 = (0.75 + 0.3 * Math.sin(m.cycle / 23)) * player2.fieldRange * player2.harmonicRadius
                const fieldRange2 = (0.68 + 0.37 * Math.sin(m.cycle / 37)) * player2.fieldRange * player2.harmonicRadius
                const fieldRange3 = (0.7 + 0.35 * Math.sin(m.cycle / 47)) * player2.fieldRange * player2.harmonicRadius
                const netFieldRange = Math.max(fieldRange1, fieldRange2, fieldRange3)
                ctx.fillStyle = "rgba(110,170,200," + Math.min(0.6, (0.04 + 0.7 * player2.energy * (0.1 + 0.11 * Math.random()))) + ")";
                ctx.beginPath();
                ctx.arc(player2.pos.x, player2.pos.y, fieldRange1, 0, 2 * Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(player2.pos.x, player2.pos.y, fieldRange2, 0, 2 * Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(player2.pos.x, player2.pos.y, fieldRange3, 0, 2 * Math.PI);
                ctx.fill();
            },
            fieldMeterColor: '#0cf',
            fieldRange: 185,
            fieldRegen: 0.001
        },
        {
            // perfect diamagnetism
            do: () => {},
            drawField: () => {
                const wave = Math.sin(m.cycle * 0.022);
                player2.fieldRange = 180 + 12 * wave; // TODO: changes with Miessner Effect tech
                player2.fieldArc = 0.35 + 0.045 * wave; // TODO: changes with Miessner Effect tech
                if (player2.input.field) {
                    player2.fieldPosition = { x: player2.pos.x, y: player2.pos.y };
                    player2.fieldAngle = player2.angle;
                    ctx.fillStyle = `rgba(110,150,220, ${0.27 + 0.2 * Math.random() - 0.1 * wave})`
                    ctx.strokeStyle = `rgba(110,150,220, ${0.4 + 0.5 * Math.random()})`
                    ctx.beginPath();
                    ctx.arc(player2.pos.x, player2.pos.y, player2.fieldRange, player2.angle - Math.PI * player2.fieldArc, player2.angle + Math.PI * player2.fieldArc, false);
                    ctx.lineWidth = 2.5 - 1.5 * wave;
                    ctx.stroke();
                    const curve = 0.57 + 0.04 * wave
                    const aMag = (1 - curve * 1.2) * Math.PI * player2.fieldArc
                    let a = player2.angle + aMag
                    let cp1x = player2.pos.x + curve * player2.fieldRange * Math.cos(a)
                    let cp1y = player2.pos.y + curve * player2.fieldRange * Math.sin(a)
                    ctx.quadraticCurveTo(cp1x, cp1y, player2.pos.x + 30 * Math.cos(player2.angle), player2.pos.y + 30 * Math.sin(player2.angle))
                    a = player2.angle - aMag
                    cp1x = player2.pos.x + curve * player2.fieldRange * Math.cos(a)
                    cp1y = player2.pos.y + curve * player2.fieldRange * Math.sin(a)
                    ctx.quadraticCurveTo(cp1x, cp1y, player2.pos.x + 1 * player2.fieldRange * Math.cos(player2.angle - Math.PI * player2.fieldArc), player2.pos.y + 1 * player2.fieldRange * Math.sin(player2.angle - Math.PI * player2.fieldArc))
                    ctx.fill();
                } else {
                    ctx.fillStyle = `rgba(110,150,220, ${0.27 + 0.2 * Math.random() - 0.1 * wave})`
                    ctx.strokeStyle = `rgba(110,180,255, ${0.4 + 0.5 * Math.random()})`
                    ctx.beginPath();
                    ctx.arc(player2.fieldPosition.x, player2.fieldPosition.y, player2.fieldRange, player2.fieldAngle - Math.PI * player2.fieldArc, player2.fieldAngle + Math.PI * player2.fieldArc, false);
                    ctx.lineWidth = 2.5 - 1.5 * wave;
                    ctx.stroke();
                    const curve = 0.8 + 0.06 * wave
                    const aMag = (1 - curve * 1.2) * Math.PI * player2.fieldArc
                    let a = player2.fieldAngle + aMag
                    ctx.quadraticCurveTo(player2.fieldPosition.x + curve * player2.fieldRange * Math.cos(a), player2.fieldPosition.y + curve * player2.fieldRange * Math.sin(a), player2.fieldPosition.x + 1 * player2.fieldRange * Math.cos(player2.fieldAngle - Math.PI * player2.fieldArc), player2.fieldPosition.y + 1 * player2.fieldRange * Math.sin(player2.fieldAngle - Math.PI * player2.fieldArc))
                    ctx.fill();
                }
            },
            fieldMeterColor: '#48f',
            fieldRange: 180,
            fieldRegen: 0.000833
        },
        {
            // negative mass
            do: () => {},
            drawField: () => {
                if (player2.input.field) {
                    player2.FxAir = 0.016;
                    if (player2.input.down) player2.fieldDrawRadius = player2.fieldDrawRadius * 0.97 + 400 * 0.03;
                    else if (player2.input.up) player2.fieldDrawRadius = player2.fieldDrawRadius * 0.97 + 850 * 0.03;
                    else player2.fieldDrawRadius = player2.fieldDrawRadius * 0.97 + 650 * 0.03;
                    ctx.beginPath();
                    ctx.arc(player2.pos.x, player2.pos.y, player2.fieldDrawRadius, 0, 2 * Math.PI);
                    ctx.fillStyle = "#f5f5ff";
                    ctx.globalCompositeOperation = "difference";
                    ctx.fill();
                    ctx.globalCompositeOperation = "source-over";

                    // effect on player
                    player2.FxAir = 0.005
                    const dist = Math.sqrt((player2.pos.x - m.pos.x) * (player2.pos.x - m.pos.x) + (player2.pos.y - m.pos.y) * (player2.pos.y - m.pos.y));
                    if (dist < player2.fieldDrawRadius) {
                        if (player2.input.down) player.force.y -= 0.5 * player.mass * simulation.g;
                        else if (player2.input.up) player.force.y -= 1.45 * player.mass * simulation.g;
                        else player.force.y -= 1.07 * player.mass * simulation.g;
                    }
                } else player2.fieldDrawRadius = 0;
            },
            fieldMeterColor: '#333',
            fieldRange: 155,
            fieldRegen: 0.001
        },
        {
            // molecular assembler
            do: () => {},
            drawField: () => {
                ctx.fillStyle = "rgba(110,170,200," + (0.02 + player2.energy * (0.15 + 0.15 * Math.random())) + ")";
                ctx.strokeStyle = "rgba(110, 200, 235, " + (0.6 + 0.2 * Math.random()) + ")";
                const range = player2.fieldRange;
                ctx.beginPath();
                ctx.arc(player2.pos.x, player2.pos.y, range, player2.angle - Math.PI * player2.fieldArc, player2.angle + Math.PI * player2.fieldArc, false);
                ctx.lineWidth = 2;
                ctx.stroke();
                let eye = 13;
                let aMag = 0.75 * Math.PI * player2.fieldArc
                let a = player2.angle + aMag
                let cp1x = player2.pos.x + 0.6 * range * Math.cos(a)
                let cp1y = player2.pos.y + 0.6 * range * Math.sin(a)
                ctx.quadraticCurveTo(cp1x, cp1y, player2.pos.x + eye * Math.cos(player2.angle), player2.pos.y + eye * Math.sin(player2.angle))
                a = player2.angle - aMag
                cp1x = player2.pos.x + 0.6 * range * Math.cos(a)
                cp1y = player2.pos.y + 0.6 * range * Math.sin(a)
                ctx.quadraticCurveTo(cp1x, cp1y, player2.pos.x + 1 * range * Math.cos(player2.angle - Math.PI * player2.fieldArc), player2.pos.y + 1 * range * Math.sin(player2.angle - Math.PI * player2.fieldArc))
                ctx.fill();
        
                //draw random lines in field for cool effect
                let offAngle = player2.angle + 1.7 * Math.PI * player2.fieldArc * (Math.random() - 0.5);
                ctx.beginPath();
                eye = 15;
                ctx.moveTo(player2.pos.x + eye * Math.cos(player2.angle), player2.pos.y + eye * Math.sin(player2.angle));
                ctx.lineTo(player2.pos.x + range * Math.cos(offAngle), player2.pos.y + range * Math.sin(offAngle));
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
            do: () => {},
            drawField: () => {
                let range = 120 + (player2.crouch ? 400 : 300) * Math.sqrt(Math.random()) // TODO: can change with tech
                const path = [
                    {
                        x: player2.pos.x + 20 * Math.cos(player2.angle),
                        y: player2.pos.y + 20 * Math.sin(player2.angle)
                    },
                    {
                        x: player2.pos.x + range * Math.cos(player2.angle),
                        y: player2.pos.y + range * Math.sin(player2.angle)
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
                const Dx = Math.cos(player2.angle);
                const Dy = Math.sin(player2.angle);
                let x = player2.pos.x + 20 * Dx;
                let y = player2.pos.y + 20 * Dy;
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
            do: () => {},
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
            do: () => {},
            drawField: () => {},
            fieldMeterColor: '#333',
            fieldRange: 155,
            fieldRegen: 0.001
        },
        {
            // pilot wave
            do: () => {},
            drawField: () => {
                if (player2.input.field) {
                    if (player2.fieldDrawRadius == 0) {
                        player2.fieldPosition = { x: player2.mouseInGame.x, y: player2.mouseInGame.y };
                        player2.lastFieldPosition = { x: player2.mouseInGame.x, y: player2.mouseInGame.y };
                    } else {
                        const scale = 25;
                        const bounds = {
                            min: {
                                x: player2.fieldPosition.x - scale,
                                y: player2.fieldPosition.y - scale
                            },
                            max: {
                                x: player2.fieldPosition.x + scale,
                                y: player2.fieldPosition.y + scale
                            }
                        }
                        const isInMap = Matter.Query.region(map, bounds).length

                        player2.lastFieldPosition = { //used to find velocity of field changes
                            x: player2.fieldPosition.x,
                            y: player2.fieldPosition.y
                        }
                        const smooth = isInMap ? 0.985 : 0.96;
                        player2.fieldPosition = { //smooth the mouse position
                            x: player2.fieldPosition.x * smooth + player2.mouseInGame.x * (1 - smooth),
                            y: player2.fieldPosition.y * smooth + player2.mouseInGame.y * (1 - smooth),
                        }
                    }

                    const diff = Vector.sub(player2.fieldPosition, player2.lastFieldPosition)
                    const speed = Vector.magnitude(diff)
                    let radius, radiusSmooth
                    if (Matter.Query.ray(map, player2.fieldPosition, player2.pos).length) { //is there something block the player's view of the field
                        radius = 0
                        radiusSmooth = Math.max(0, isInMap ? 0.96 - 0.02 * speed : 0.995); //0.99
                    } else {
                        radius = Math.max(50, 250 - 2 * speed)
                        radiusSmooth = 0.97
                    }
                    player2.fieldDrawRadius = player2.fieldDrawRadius * radiusSmooth + radius * (1 - radiusSmooth)

                    ctx.beginPath();
                    const rotate = m.cycle * 0.008;
                    player2.fieldPhase += 0.2
                    const off1 = 1 + 0.06 * Math.sin(player2.fieldPhase);
                    const off2 = 1 - 0.06 * Math.sin(player2.fieldPhase);
                    ctx.beginPath();
                    ctx.ellipse(player2.fieldPosition.x, player2.fieldPosition.y, 1.2 * player2.fieldDrawRadius * off1, 1.2 * player2.fieldDrawRadius * off2, rotate, 0, 2 * Math.PI);
                    ctx.globalCompositeOperation = "exclusion";
                    ctx.fillStyle = "#fff";
                    ctx.fill();
                    ctx.globalCompositeOperation = "source-over";
                    ctx.beginPath();
                    ctx.ellipse(player2.fieldPosition.x, player2.fieldPosition.y, 1.2 * player2.fieldDrawRadius * off1, 1.2 * player2.fieldDrawRadius * off2, rotate, 0, 2 * Math.PI * player2.energy / player2.maxEnergy);
                    ctx.strokeStyle = "#000";
                    ctx.lineWidth = 4;
                    ctx.stroke();
                } else player2.fieldDrawRadius = 0;
            },
            fieldMeterColor: '#333',
            fieldRange: 155,
            fieldRegen: 0.001667
        },
        {
            // wormhole
            do: () => {},
            drawField: () => {
                const scale = 60;
                const justPastMouse = Vector.add(Vector.mult(Vector.normalise(Vector.sub(player2.mouseInGame, player2.pos)), 50), player2.mouseInGame)
                const sub = Vector.sub(player2.mouseInGame, player2.pos);
                const mag = Vector.magnitude(sub);
                if (player2.input.field) {

                    this.drain = 0.05 + 0.005 * Math.sqrt(mag)
                    const unit = Vector.perp(Vector.normalise(sub))
                    const where = { x: player2.pos.x + 30 * Math.cos(player2.angle), y: player2.pos.y + 30 * Math.sin(player2.angle) }
                    player2.fieldRange = 0.97 * player2.fieldRange + 0.03 * (50 + 10 * Math.sin(simulation.cycle * 0.025))
                    const edge2a = Vector.add(Vector.mult(unit, 1.5 * player2.fieldRange), player2.mouseInGame)
                    const edge2b = Vector.add(Vector.mult(unit, -1.5 * player2.fieldRange), player2.mouseInGame)
                    ctx.beginPath();
                    ctx.moveTo(where.x, where.y)
                    ctx.bezierCurveTo(where.x, where.y, player2.mouseInGame.x, player2.mouseInGame.y, edge2a.x, edge2a.y);
                    ctx.moveTo(where.x, where.y)
                    ctx.bezierCurveTo(where.x, where.y, player2.mouseInGame.x, player2.mouseInGame.y, edge2b.x, edge2b.y);
                    if (
                        mag > 250 && player2.energy > this.drain &&
                        (/*tech.isWormholeMapIgnore ||*/ Matter.Query.ray(map, player2.pos, justPastMouse).length === 0) &&
                        Matter.Query.region(map, {
                            min: {
                                x: player2.mouseInGame.x - scale,
                                y: player2.mouseInGame.y - scale
                            },
                            max: {
                                x: player2.mouseInGame.x + scale,
                                y: player2.mouseInGame.y + scale
                            }
                        }).length === 0
                    ) {
                        player2.hole.isReady = true;
                        ctx.lineWidth = 1
                        ctx.strokeStyle = "#000"
                        ctx.stroke();
                    } else {
                        player2.hole.isReady = false;
                        ctx.lineWidth = 1
                        ctx.strokeStyle = "#000"
                        ctx.lineDashOffset = 30 * Math.random()
                        ctx.setLineDash([20, 40]);
                        ctx.stroke();
                        ctx.setLineDash([]);
                    }
                } else if (
                    player2.hole.isReady && mag > 250 && player2.energy > this.drain &&
                    (/*tech.isWormholeMapIgnore ||*/ Matter.Query.ray(map, player2.pos, justPastMouse).length === 0) &&
                    Matter.Query.region(map, {
                        min: {
                            x: player2.mouseInGame.x - scale,
                            y: player2.mouseInGame.y - scale
                        },
                        max: {
                            x: player2.mouseInGame.x + scale,
                            y: player2.mouseInGame.y + scale
                        }
                    }).length === 0
                ) {
                    player2.hole.isReady = false;
                    player2.fieldRange = 0;
                    player2.hole.isOn = true;
                    player2.hole.pos1.x = player2.pos.x;
                    player2.hole.pos1.y = player2.pos.y;
                    player2.hole.pos2.x = player2.mouseInGame.x;
                    player2.hole.pos2.y = player2.mouseInGame.y;
                    player2.hole.angle = Math.atan2(sub.y, sub.x);
                    player2.hole.unit = Vector.perp(Vector.normalise(sub));
                }

                if (player2.hole.isOn) {
                    player2.fieldRange = 0.97 * player2.fieldRange + 0.03 * (50 + 10 * Math.sin(simulation.cycle * 0.025))
                    const semiMajorAxis = player2.fieldRange + 30
                    const edge1a = Vector.add(Vector.mult(player2.hole.unit, semiMajorAxis), player2.hole.pos1)
                    const edge1b = Vector.add(Vector.mult(player2.hole.unit, -semiMajorAxis), player2.hole.pos1)
                    const edge2a = Vector.add(Vector.mult(player2.hole.unit, semiMajorAxis), player2.hole.pos2)
                    const edge2b = Vector.add(Vector.mult(player2.hole.unit, -semiMajorAxis), player2.hole.pos2)
                    ctx.beginPath();
                    ctx.moveTo(edge1a.x, edge1a.y)
                    ctx.bezierCurveTo(player2.hole.pos1.x, player2.hole.pos1.y, player2.hole.pos2.x, player2.hole.pos2.y, edge2a.x, edge2a.y);
                    ctx.lineTo(edge2b.x, edge2b.y)
                    ctx.bezierCurveTo(player2.hole.pos2.x, player2.hole.pos2.y, player2.hole.pos1.x, player2.hole.pos1.y, edge1b.x, edge1b.y);
                    ctx.fillStyle = `rgba(255,255,255,${200 / player2.fieldRange / player2.fieldRange})` //"rgba(0,0,0,0.1)"
                    ctx.fill();
                    ctx.beginPath();
                    ctx.ellipse(player2.hole.pos1.x, player2.hole.pos1.y, player2.fieldRange, semiMajorAxis, player2.hole.angle, 0, 2 * Math.PI)
                    ctx.ellipse(player2.hole.pos2.x, player2.hole.pos2.y, player2.fieldRange, semiMajorAxis, player2.hole.angle, 0, 2 * Math.PI)
                    ctx.fillStyle = `rgba(255,255,255,${32 / player2.fieldRange})`
                    ctx.fill();
                }
            },
            fieldMeterColor: '#bbf',
            fieldRange: 0,
            fieldRegen: 0.001
        },
        {
            // grappling hook
            do: () => {},
            drawField: () => {
                // console.log(player2.input.field, player2.fieldCDcycle, m.cycle)
                if (player2.input.field && player2.fieldCDcycle < m.cycle) {
                    b.multiplayerGrapple({ x: player2.pos.x + 40 * Math.cos(player2.angle), y: player2.pos.y + 40 * Math.sin(player2.angle) }, player2.angle, 2);
                    if (player2.fieldCDcycle < m.cycle + 20) player2.fieldCDcycle = m.cycle + 20;
                }
            },
            fieldMeterColor: '#0cf',
            fieldRange: 155,
            fieldRegen: 0.0015
        }
    ]

    player2 = {
        angle: 0,
        bodyGradient: null,
        calcLeg: (cycle_offset, offset) => {
            player2.hip.x = 12 + offset;
            player2.hip.y = 24 + offset;
            //stepSize goes to zero if Vx is zero or not on ground (make m transition cleaner)
            player2.stepSize = 0.8 * player2.stepSize + 0.2 * (7 * Math.sqrt(Math.min(9, Math.abs(player2.Vx))) * player2.onGround);
            //changes to stepsize are smoothed by adding only a percent of the new value each cycle
            const stepAngle = 0.034 * player2.walk_cycle + cycle_offset;
            player2.foot.x = 2.2 * player2.stepSize * Math.cos(stepAngle) + offset;
            player2.foot.y = offset + 1.2 * player2.stepSize * Math.sin(stepAngle) + player2.yOff + player2.height;
            const Ymax = player2.yOff + player2.height;
            if (player2.foot.y > Ymax) player2.foot.y = Ymax;
    
            //calculate knee position as intersection of circle from hip and foot
            const d = Math.sqrt((player2.hip.x - player2.foot.x) * (player2.hip.x - player2.foot.x) + (player2.hip.y - player2.foot.y) * (player2.hip.y - player2.foot.y));
            const l = (player2.legLength1 * player2.legLength1 - player2.legLength2 * player2.legLength2 + d * d) / (2 * d);
            const h = Math.sqrt(player2.legLength1 * player2.legLength1 - l * l);
            player2.knee.x = (l / d) * (player2.foot.x - player2.hip.x) - (h / d) * (player2.foot.y - player2.hip.y) + player2.hip.x + offset;
            player2.knee.y = (l / d) * (player2.foot.y - player2.hip.y) + (h / d) * (player2.foot.x - player2.hip.x) + player2.hip.y;
        },
        color: { hue: 0, sat: 0, light: 100 },
        crouch: false,
        drawHealthbar: () => {
            if (player2.health < player2.maxHealth) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                const xOff = player2.pos.x - 40 * player2.maxHealth;
                const yOff = player2.pos.y - 70;
                ctx.fillRect(xOff, yOff, 80 * player2.maxHealth, 10);
                ctx.fillStyle = '#09f5a6';
                ctx.fillRect(xOff, yOff, 80 * player2.health, 10);
            } else if (player2.health > player2.maxHealth + 0.05 || player2.input.field) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                const xOff = player2.pos.x - 40 * player2.health;
                const yOff = player2.pos.y - 70;
                ctx.fillStyle = '#09f5a6';
                ctx.fillRect(xOff, yOff, 80 * player2.health, 10);
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
                    player2.pos.x + eye * Math.cos(player2.angle),
                    player2.pos.y + eye * Math.sin(player2.angle)
                );
                ctx.lineTo(target.vertices[len].x, target.vertices[len].y);
                ctx.lineTo(target.vertices[0].x, target.vertices[0].y);
                ctx.fill();
                ctx.stroke();
                for (let i = 0; i < len; i++) {
                    ctx.beginPath();
                    ctx.moveTo(
                        player2.pos.x + eye * Math.cos(player2.angle),
                        player2.pos.y + eye * Math.sin(player2.angle)
                    );
                    ctx.lineTo(target.vertices[i].x, target.vertices[i].y);
                    ctx.lineTo(target.vertices[i + 1].x, target.vertices[i + 1].y);
                    ctx.fill();
                    ctx.stroke();
                }
            }
        },
        drawLeg: (stroke) => {
            if (player2.angle > -Math.PI / 2 && player2.angle < Math.PI / 2) {
                player2.flipLegs = 1;
            } else {
                player2.flipLegs = -1;
            }
            ctx.save();

            if (player2.isCloak) {
                ctx.globalAlpha *= 2;
                ctx.scale(player2.flipLegs, 1); //leg lines
                ctx.beginPath();
                ctx.moveTo(player2.hip.x, player2.hip.y);
                ctx.lineTo(player2.knee.x, player2.knee.y);
                ctx.lineTo(player2.foot.x, player2.foot.y);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 12;
                ctx.stroke();
                ctx.globalAlpha /= 2;
            }
            ctx.scale(player2.flipLegs, 1); //leg lines
            ctx.beginPath();
            ctx.moveTo(player2.hip.x, player2.hip.y);
            ctx.lineTo(player2.knee.x, player2.knee.y);
            ctx.lineTo(player2.foot.x, player2.foot.y);
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 6;
            ctx.stroke();


            //toe lines
            if (player2.isCloak) {
                ctx.globalAlpha *= 2;
                ctx.beginPath();
                ctx.moveTo(player2.foot.x, player2.foot.y);
                ctx.lineTo(player2.foot.x - 14, player2.foot.y + 5);
                ctx.moveTo(player2.foot.x, player2.foot.y);
                ctx.lineTo(player2.foot.x + 14, player2.foot.y + 5);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 10;
                ctx.stroke();
                ctx.globalAlpha /= 2;
            }

            ctx.beginPath();
            ctx.moveTo(player2.foot.x, player2.foot.y);
            ctx.lineTo(player2.foot.x - 14, player2.foot.y + 5);
            ctx.moveTo(player2.foot.x, player2.foot.y);
            ctx.lineTo(player2.foot.x + 14, player2.foot.y + 5);
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 4;
            ctx.stroke();


            if (player2.isCloak) {
                ctx.globalAlpha *= 2;
                //hip joint
                ctx.beginPath();
                ctx.arc(player2.hip.x, player2.hip.y, 9, 0, 2 * Math.PI);
                //knee joint
                ctx.moveTo(player2.knee.x + 5, player2.knee.y);
                ctx.arc(player2.knee.x, player2.knee.y, 5, 0, 2 * Math.PI);
                //foot joint
                ctx.moveTo(player2.foot.x + 4, player2.foot.y + 1);
                ctx.arc(player2.foot.x, player2.foot.y + 1, 4, 0, 2 * Math.PI);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 8;
                ctx.stroke();
                ctx.globalAlpha /= 2;
            }

            //hip joint
            ctx.beginPath();
            ctx.arc(player2.hip.x, player2.hip.y, 9, 0, 2 * Math.PI);
            //knee joint
            ctx.moveTo(player2.knee.x + 5, player2.knee.y);
            ctx.arc(player2.knee.x, player2.knee.y, 5, 0, 2 * Math.PI);
            //foot joint
            ctx.moveTo(player2.foot.x + 4, player2.foot.y + 1);
            ctx.arc(player2.foot.x, player2.foot.y + 1, 4, 0, 2 * Math.PI);
            ctx.fillStyle = player2.fillColor;
            ctx.fill();
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        },
        drawRegenEnergy: (bgColor = "rgba(0, 0, 0, 0.4)", range = 60) => {
            if (player2.energy < player2.maxEnergy) {
                // m.regenEnergy();
                ctx.fillStyle = bgColor;
                const xOff = player2.pos.x - player2.radius * player2.maxEnergy;
                const yOff = player2.pos.y - 50;
                ctx.fillRect(xOff, yOff, range * player2.maxEnergy, 10);
                ctx.fillStyle = player2.fieldMeterColor;
                ctx.fillRect(xOff, yOff, range * player2.energy, 10);
            } else if (player2.energy > player2.maxEnergy + 0.05 || player2.input.field) {
                ctx.fillStyle = bgColor;
                const xOff = player2.pos.x - player2.radius * player2.energy;
                const yOff = player2.pos.y - 50;
                ctx.fillStyle = player2.fieldMeterColor;
                ctx.fillRect(xOff, yOff, range * player2.energy, 10);
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
        grabPowerUp: () => {
            for (let i = 0, len = powerUp.length; i < len; ++i) {
                const dxP = player2.pos.x - powerUp[i].position.x;
                const dyP = player2.pos.y - powerUp[i].position.y;
                const dist2 = dxP * dxP + dyP * dyP + 10;
                // float towards player  if looking at and in range  or  if very close to player
                if (
                    dist2 < m.grabPowerUpRange2 &&
                    (player2.lookingAt(powerUp[i]) || dist2 < 10000) &&
                    Matter.Query.ray(map, powerUp[i].position, player2.pos).length === 0
                ) {
                    if (true /*!tech.isHealAttract || powerUp[i].name !== "heal"*/) { //if you have accretion heals are already pulled in a different way
                        powerUp[i].force.x += 0.04 * (dxP / Math.sqrt(dist2)) * powerUp[i].mass;
                        powerUp[i].force.y += 0.04 * (dyP / Math.sqrt(dist2)) * powerUp[i].mass - powerUp[i].mass * simulation.g; //negate gravity
                        Matter.Body.setVelocity(powerUp[i], { x: powerUp[i].velocity.x * 0.11, y: powerUp[i].velocity.y * 0.11 }); //extra friction
                    }
                    if ( //use power up if it is close enough
                        dist2 < 5000 &&
                        !simulation.isChoosing &&
                        (powerUp[i].name !== "heal" || player2.maxHealth - player2.health > 0.01 || tech.isOverHeal)
                    ) {
                        // powerUps.onPickUp(powerUp[i]);
                        player.velocity.x += powerUp[i].velocity.x / player.mass * 4 * powerUp[i].mass,
                        player.velocity.y += powerUp[i].velocity.y / player.mass * 4 * powerUp[i].mass
                        // powerUp[i].effect();
                        Matter.Composite.remove(engine.world, powerUp[i]);
                        powerUp.splice(i, 1);
                        return; //because the array order is messed up after splice
                    }
                }
            }
        },
        health: 1,
        height: 42,
        hip: { x: 12, y: 24 },
        holdingTarget: null,
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
        lookingAt: (who) => {
            //calculate a vector from body to player and make it length 1
            const diff = Vector.normalise(Vector.sub(who.position, player2.pos));
            //make a vector for the player's direction of length 1
            const dir = {
                x: Math.cos(player2.angle),
                y: Math.sin(player2.angle)
            };
            //the dot product of diff and dir will return how much over lap between the vectors
            if (Vector.dot(dir, diff) > Math.cos((player2.fieldArc) * Math.PI)) {
                return true;
            }
            return false;
        },
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
    window.player2 = player2;
    player2.fillColor = `hsl(${player2.color.hue},${player2.color.sat}%,${player2.color.light}%)`;
    player2.fillColorDark = `hsl(${player2.color.hue},${player2.color.sat}%,${player2.color.light - 25}%)`;
    let grd = ctx.createLinearGradient(-30, 0, 30, 0);
    grd.addColorStop(0, player2.fillColorDark);
    grd.addColorStop(1, player2.fillColor);
    player2.bodyGradient = grd;

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
                        if (obj.multiplayer) return;
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
                                    if (mob[k].alive && Math.sqrt((mob[k].position.x - player2.pos.x)**2 + (mob[k].position.y - player2.pos.y)**2) < 1000000 && !m.isCloak) mob[k].foundPlayer();
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

    const oldBodyRect = spawn.bodyRect;
    spawn.bodyRect = (x, y, width, height, chance, properties) => {
        const me = body.length;
        oldBodyRect(x, y, width, height, chance, properties);
        body[me].width = width;
        body[me].height = height;
    }

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
        dcLocal.send(dataView);

        oldExplosion(where, radius, color);
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
        dcLocal.send(dataView);

        oldPulse(charge, angle, where);
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
            dcLocal.send(dataView);

            oldGrenade(where, angle, size);
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
        dataView.setUint8(45, 1); // TODO: player id
        dcLocal.send(dataView);

        oldHarpoon(where, target, angle, harpoonSize, isReturn, totalCycles, isReturnAmmo, thrust);
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
                    b.missile({
                        x: m.pos.x + 30 * direction.x,
                        y: m.pos.y + 30 * direction.y
                    }, m.angle, 20, sqrtCountReduction)
                    const extraForce = { x: 0.5 * push.x * (Math.random() - 0.5), y: 0.004 + 0.5 * push.y * (Math.random() - 0.5) }
                    bullet[bullet.length - 1].force.x += extraForce.x;
                    bullet[bullet.length - 1].force.y += extraForce.y;

                    const data = new Uint8Array(new ArrayBuffer(71));
                    data[0] = 20;
                    const dataView = new DataView(data.buffer);
                    dataView.setFloat64(1, m.pos.x + 30 * direction.x);
                    dataView.setFloat64(9, m.pos.y + 30 * direction.y);
                    dataView.setFloat64(17, m.angle);
                    dataView.setFloat64(25, 20);
                    dataView.setUint16(33, sqrtCountReduction);
                    dataView.setFloat32(35, bullet[me].endCycle - m.cycle);
                    dataView.setFloat64(39, bullet[me].lookFrequency);
                    dataView.setFloat64(47, bullet[me].explodeRad);
                    dataView.setFloat64(55, extraForce.x);
                    dataView.setFloat64(63, extraForce.y);
                    dcLocal.send(dataView);
                } else {
                    const me = bullet.length;
                    b.missile({
                        x: m.pos.x + 30 * direction.x,
                        y: m.pos.y + 30 * direction.y
                    }, m.angle, -15, sqrtCountReduction)
                    const extraForce = { x: push.x * (Math.random() - 0.5), y: 0.005 + push.y * (Math.random() - 0.5) }
                    bullet[bullet.length - 1].force.x += extraForce.x;
                    bullet[bullet.length - 1].force.y += extraForce.y;

                    const data = new Uint8Array(new ArrayBuffer(71));
                    data[0] = 20;
                    const dataView = new DataView(data.buffer);
                    dataView.setFloat64(1, m.pos.x + 30 * direction.x);
                    dataView.setFloat64(9, m.pos.y + 30 * direction.y);
                    dataView.setFloat64(17, m.angle);
                    dataView.setFloat64(25, -15);
                    dataView.setUint16(33, sqrtCountReduction);
                    dataView.setFloat32(35, bullet[me].endCycle - m.cycle);
                    dataView.setFloat64(39, bullet[me].lookFrequency);
                    dataView.setFloat64(47, bullet[me].explodeRad);
                    dataView.setFloat64(55, extraForce.x);
                    dataView.setFloat64(63, extraForce.y);
                    dcLocal.send(dataView);
                }
            }
            const cycle = () => {
                if ((simulation.paused || m.isBodiesAsleep) && m.alive) {
                    requestAnimationFrame(cycle)
                } else {
                    count++
                    if (!(count % launchDelay)) {
                        fireMissile()
                    }
                    if (count < tech.missileCount * launchDelay && m.alive) requestAnimationFrame(cycle);
                }
            }
            requestAnimationFrame(cycle);
        } else {
            if (m.crouch) {
                const me = bullet.length;
                b.missile({
                    x: m.pos.x + 40 * direction.x,
                    y: m.pos.y + 40 * direction.y
                }, m.angle, 25);

                const data = new Uint8Array(new ArrayBuffer(71));
                data[0] = 20;
                const dataView = new DataView(data.buffer);
                dataView.setFloat64(1, m.pos.x + 40 * direction.x);
                dataView.setFloat64(9, m.pos.y + 40 * direction.y);
                dataView.setFloat64(17, m.angle);
                dataView.setFloat64(25, 25);
                dataView.setUint16(33, 1);
                dataView.setFloat32(35, bullet[me].endCycle - m.cycle);
                dataView.setFloat64(39, bullet[me].lookFrequency);
                dataView.setFloat64(47, bullet[me].explodeRad);
                dataView.setFloat64(55, 0);
                dataView.setFloat64(63, 0);
                dcLocal.send(dataView);
            } else {
                const me = bullet.length;
                b.missile({
                    x: m.pos.x + 40 * direction.x,
                    y: m.pos.y + 40 * direction.y
                }, m.angle, -12);
                extraForce = 0.04 * (Math.random() - 0.2);
                bullet[bullet.length - 1].force.y += extraForce;

                const data = new Uint8Array(new ArrayBuffer(71));
                data[0] = 20;
                const dataView = new DataView(data.buffer);
                dataView.setFloat64(1, m.pos.x + 40 * direction.x);
                dataView.setFloat64(9, m.pos.y + 40 * direction.y);
                dataView.setFloat64(17, m.angle);
                dataView.setFloat64(25, -12);
                dataView.setUint16(33, 1);
                dataView.setFloat32(35, bullet[me].endCycle - m.cycle);
                dataView.setFloat64(39, bullet[me].lookFrequency);
                dataView.setFloat64(47, bullet[me].explodeRad);
                dataView.setFloat64(55, 0);
                dataView.setFloat64(63, extraForce);
                dcLocal.send(dataView);
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
        dataView.setUint8(51, 1); // TODO: player id
        dcLocal.send(dataView);

        oldLaser(where, whereEnd, dmg, reflections, isThickBeam, push);
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
    const oldBlocks = [];
    const oldPowerups = [];
    const oldMobs = [];

    const oldStartGame = simulation.startGame;
    simulation.startGame = () => {
        oldStartGame();
        Math.random = Math.seededRandom;

        //load player in matter.js physic engine
        let vertices = Vertices.fromPath("0,40, 50,40, 50,115, 30,130, 20,130, 0,115, 0,40"); //player as a series of vertices
        player2.body = Bodies.fromVertices(0, 0, vertices);
        player2.jumpSensor = Bodies.rectangle(0, 46, 36, 6, {
            //this sensor check if the player is on the ground to enable jumping
            sleepThreshold: 99999999999,
            isSensor: true
        });
        vertices = Vertices.fromPath("16 -82  2 -66  2 -37  43 -37  43 -66  30 -82");
        player2.head = Bodies.fromVertices(0, -55, vertices); //this part of the player lowers on crouch
        player2.headSensor = Bodies.rectangle(0, -57, 48, 45, {
            //senses if the player's head is empty and can return after crouching
            sleepThreshold: 99999999999,
            isSensor: true
        });
        player2.hitbox = Body.create({
            parts: [player2.body, player2.head, player2.jumpSensor, player2.headSensor],
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
        Matter.Body.setMass(player2.hitbox, player2.mass);
        Composite.add(engine.world, [player2.hitbox]);

        simulation.ephemera.push({ name: 'Player2', count: 0, do: () => {
            player2.angle = Math.atan2(player2.mouseInGame.y - player2.pos.y, player2.mouseInGame.x - player2.pos.x);
            ctx.fillStyle = player2.fillColor;
            ctx.save();
            ctx.globalAlpha = player2.isCloak ? 0.25 : player2.immuneCycle < m.cycle ? 1 : 0.5;
            ctx.translate(player2.pos.x, player2.pos.y);
            player2.calcLeg(Math.PI, -3);
            player2.drawLeg("#4a4a4a");
            player2.calcLeg(0, 0);
            player2.drawLeg("#333");
            ctx.rotate(player2.angle);
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, 2 * Math.PI);
            ctx.fillStyle = player2.bodyGradient;
            ctx.fill();
            ctx.arc(15, 0, 4, 0, 2 * Math.PI);
            ctx.strokeStyle = "#333";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
            powerUps.boost.draw();
            if (!player2.isHolding && player2.input.field) fieldData[player2.fieldMode].do();
            if (!player2.isHolding && player2.input.field) player2.grabPowerUp();
            if (!player2.isHolding && (player2.input.field || player2.fieldMode == 1 || player2.fieldMode == 2 || player2.fieldMode == 3 || player2.fieldMode == 8 || player2.fieldMode == 9 || player2.fieldMode == 10)) fieldData[player2.fieldMode].drawField();
            if (player2.holdingTarget) {
                ctx.beginPath(); //draw on each valid body
                let vertices = player2.holdingTarget.vertices;
                ctx.moveTo(vertices[0].x, vertices[0].y);
                for (let i = 1; i < vertices.length; i += 1) ctx.lineTo(vertices[i].x, vertices[i].y);
                ctx.lineTo(vertices[0].x, vertices[0].y);
                ctx.fillStyle = "rgba(190,215,230," + (0.3 + 0.7 * Math.random()) + ")";
                ctx.fill();
    
                ctx.globalAlpha = player2.isHolding ? 1 : 0.2;
                player2.drawHold(player2.holdingTarget);
                ctx.globalAlpha = 1;

                //draw charge
                const x = player2.pos.x + 15 * Math.cos(player2.angle);
                const y = player2.pos.y + 15 * Math.sin(player2.angle);
                const len = player2.holdingTarget.vertices.length - 1;
                const edge = player2.throwCharge * player2.throwCharge * player2.throwCharge;
                const grd = ctx.createRadialGradient(x, y, edge, x, y, edge + 5);
                grd.addColorStop(0, "rgba(255,50,150,0.3)");
                grd.addColorStop(1, "transparent");
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(player2.holdingTarget.vertices[len].x, player2.holdingTarget.vertices[len].y);
                ctx.lineTo(player2.holdingTarget.vertices[0].x, player2.holdingTarget.vertices[0].y);
                ctx.fill();
                for (let i = 0; i < len; i++) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(player2.holdingTarget.vertices[i].x, player2.holdingTarget.vertices[i].y);
                    ctx.lineTo(player2.holdingTarget.vertices[i + 1].x, player2.holdingTarget.vertices[i + 1].y);
                    ctx.fill();
                }
                ctx.strokeStyle = "rgba(68, 68, 68, 0.15)";
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            if (player2.isHolding) {
                player2.energy -= fieldData[player2.fieldMode].fieldRegen;
                if (player2.energy < 0) player2.energy = 0;
                Matter.Body.setPosition(player2.holdingTarget, {
                    x: player2.pos.x + 70 * Math.cos(player2.angle),
                    y: player2.pos.y + 70 * Math.sin(player2.angle)
                });
                Matter.Body.setVelocity(player2.holdingTarget, { x: player2.Vx, y: player2.Vy });
                Matter.Body.rotate(player2.holdingTarget, 0.01 / player2.holdingTarget.mass); //gently spin the block
            }

            if (player2.isCloak) {
                ctx.beginPath();
                ctx.arc(player2.pos.x, player2.pos.y, 35, 0, 2 * Math.PI);
                ctx.strokeStyle = "rgba(255,255,255,0.5)";
                ctx.lineWidth = 6;
                ctx.stroke();
            }

            player2.drawHealthbar();
            player2.drawRegenEnergy();

            for (const multiplayerLaser of b.multiplayerLasers) if (new Date().getTime() - multiplayerLaser.created.getTime() < 100) b.multiplayerLaser(multiplayerLaser.where, multiplayerLaser.whereEnd, multiplayerLaser.dmg, multiplayerLaser.reflections, multiplayerLaser.isThickBeam, multiplayerLaser.push);
        }})
        simulation.ephemera.push({ name: 'Broadcast', count: 0, do: () => {
            // player broadcast
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
                dcLocal.send(dataView);
            } else if (simulation.mouseInGame.x != oldM.mouseInGame.x || simulation.mouseInGame.y != oldM.mouseInGame.y) {
                // rotation
                const data = new Uint8Array(new ArrayBuffer(17));
                data[0] = 0;
                const dataView = new DataView(data.buffer);
                dataView.setFloat64(1, simulation.mouseInGame.x);
                dataView.setFloat64(9, simulation.mouseInGame.y);
                dcLocal.send(dataView);
            }
            if (m.fieldMode != oldM.fieldMode) {
                // set field
                const data = new Uint8Array(new ArrayBuffer(2));
                data[0] = 2;
                data[1] = m.fieldMode;
                dcLocal.send(new DataView(data.buffer));
            }
            if (m.immuneCycle != oldM.immuneCycle) {
                // immune cycle update
                const data = new Uint8Array(new ArrayBuffer(5));
                data[0] = 3;
                const dataView = new DataView(data.buffer);
                dataView.setFloat32(1, m.immuneCycle);
                dcLocal.send(dataView);
            }
            if (m.health != oldM.health) {
                // health update
                const data = new Uint8Array(new ArrayBuffer(6));
                data[0] = 4;
                const dataView = new DataView(data.buffer);
                dataView.setFloat32(1, m.health);
                dataView.setUint8(5, 1); // TODO: player id
                dcLocal.send(dataView);
            }
            if (m.maxHealth != oldM.maxHealth) {
                // max health update
                const data = new Uint8Array(new ArrayBuffer(6));
                data[0] = 5;
                const dataView = new DataView(data.buffer);
                dataView.setFloat32(1, m.maxHealth);
                dataView.setUint8(5, 1); // TODO: player id
                dcLocal.send(dataView);
            }
            if (m.energy != oldM.energy) {
                // energy update
                const data = new Uint8Array(new ArrayBuffer(6));
                data[0] = 6;
                const dataView = new DataView(data.buffer);
                dataView.setFloat32(1, m.energy);
                dataView.setUint8(5, 1); // TODO: player id
                dcLocal.send(dataView);
            }
            if (m.maxEnergy != oldM.maxEnergy) {
                // max energy update
                const data = new Uint8Array(new ArrayBuffer(6))
                data[0] = 7;
                const dataView = new DataView(data.buffer);
                dataView.setFloat32(1, m.maxEnergy);
                dataView.setUint8(5, 1); // TODO: player id
                dcLocal.send(dataView);
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
                dcLocal.send(new DataView(data.buffer));
            }
            if (m.crouch != oldM.crouch) {
                // toggle crouch
                const data = new Uint8Array(new ArrayBuffer(2));
                data[0] = 9;
                data[1] = m.crouch ? 1 : 0;
                dcLocal.send(new DataView(data.buffer));
            }
            if (m.isCloak != oldM.isCloak) {
                // toggle cloak
                const data = new Uint8Array(new ArrayBuffer(2));
                data[0] = 10;
                data[1] = m.isCloak ? 1 : 0;
                dcLocal.send(new DataView(data.buffer));
            }
            if (m.isHolding != oldM.isHolding || m.holdingTarget?.id != oldM.holdingTarget?.id) {
                // hold block
                const data = new Uint8Array(new ArrayBuffer(5));
                data[0] = 21;
                data[1] = m.isHolding ? 1 : 0;
                const dataView = new DataView(data.buffer);
                dataView.setUint16(2, m.holdingTarget?.id || -1);
                dataView.setUint8(4, 1); // TODO: player id
                dcLocal.send(dataView);
            }
            if (m.throwCharge != oldM.throwCharge) {
                // throw charge update
                const data = new Uint8Array(new ArrayBuffer(7));
                data[0] = 22;
                const dataView = new DataView(data.buffer);
                dataView.setFloat32(1, m.throwCharge);
                dataView.setUint8(5, 1); // TODO: player id
                dcLocal.send(dataView);
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
                onGround: false,
                pos: { x: m.pos.y, y: m.pos.y },
                throwCharge: m.throwCharge,
                Vx: m.Vx,
                Vy: m.Vy,
                walk_cycle: m.walk_cycle,
                yOff: m.yOff
            }

            // block update
            const blockChanges = [];
            for (const block of body) {
                let changed = false;
                let found = false; 
                for (let i = 0; i < oldBlocks.length && !found; i++) {
                    if (block.id == oldBlocks[i].id) {
                        found = true;
                        if (block.position.x != oldBlocks[i].position.x || block.position.y != oldBlocks[i].position.y || block.angle != oldBlocks[i].angle) changed = true;
                    }
                }
                changed = changed || !found;
                if (changed) blockChanges.push(block);
            }
            for (const block of blockChanges) {
                const data = new Uint8Array(new ArrayBuffer(43));
                data[0] = 15;
                const dataView = new DataView(data.buffer);
                dataView.setUint16(1, block.id);
                dataView.setFloat64(3, block.position.x);
                dataView.setFloat64(11, block.position.y);
                dataView.setFloat64(19, block.angle);
                dataView.setFloat64(27, block.velocity.x);
                dataView.setFloat64(35, block.velocity.y);
                dcLocal.send(dataView);
            }

            for (const oldBlock of oldBlocks) {
                let found = false;
                for (let i = 0; i < body.length; i++) if (oldBlock.id == body[i].id) found = true;
                if (!found) {
                    const data = new Uint8Array(new ArrayBuffer(3));
                    data[0] = 24;
                    const dataView = new DataView(data.buffer);
                    dataView.setUint16(1, oldBlock.id);
                    dcLocal.send(dataView);
                }
            }

            oldBlocks.length = 0;
            for (const block of body) oldBlocks.push({ id: block.id, position: { x: block.position.x, y: block.position.y }, angle: block.angle });


            // powerup update
            const powerupChanges = [];
            for (const powerup of powerUp) {
                let changed = false;
                let found = false; 
                for (let i = 0; i < oldPowerups.length && !found; i++) {
                    if (powerup.id == oldPowerups[i].id) {
                        found = true;
                        if (powerup.position.x != oldPowerups[i].position.x || powerup.position.y != oldPowerups[i].position.y || powerup.size != oldPowerups[i].size) changed = true;
                    }
                }
                if (changed || !found) powerupChanges.push(powerup);
            }
            for (const powerup of powerupChanges) {
                const data = new Uint8Array(new ArrayBuffer(27));
                data[0] = 27;
                const dataView = new DataView(data.buffer);
                dataView.setUint16(1, powerup.id);
                dataView.setFloat64(3, powerup.position.x);
                dataView.setFloat64(11, powerup.position.y);
                dataView.setFloat64(19, powerup.size);
                dcLocal.send(dataView);
            }

            for (const oldPowerup of oldPowerups) {
                let found = false;
                for (let i = 0; i < powerUp.length; i++) if (oldPowerup.id == powerUp[i].id) found = true;
                if (!found) {
                    const data = new Uint8Array(new ArrayBuffer(3));
                    data[0] = 28;
                    const dataView = new DataView(data.buffer);
                    dataView.setUint16(1, oldPowerup.id);
                    dcLocal.send(dataView);
                }
            }

            oldPowerups.length = 0;
            for (const powerup of powerUp) oldPowerups.push({ id: powerup.id, position: { x: powerup.position.x, y: powerup.position.y }, size: powerup.size });


            // mob update
            const mobChanges = [];
            for (const newMob of mob) {
                let changed = false;
                let found = false;
                for (let i = 0; i < oldMobs.length && !found; i++) {
                    if (newMob.id == oldMobs[i].id) {
                        found = true;
                        if (newMob.position.x != oldMobs[i].position.x || newMob.position.y != oldMobs[i].position.y || newMob.angle != oldMobs[i].angle) changed = true;
                    }
                }
                if (changed || !found) mobChanges.push(newMob);
            }
            for (const newMob of mobChanges) {
                const data = new Uint8Array(new ArrayBuffer(27));
                data[0] = 31;
                const dataView = new DataView(data.buffer);
                dataView.setUint16(1, newMob.id);
                dataView.setFloat64(3, newMob.position.x);
                dataView.setFloat64(11, newMob.position.y);
                dataView.setFloat64(19, newMob.angle);
                dcLocal.send(dataView);
            }

            mobChanges.length = 0;
            for (const newMob of mob) {
                let changed = false;
                let found = false;
                for (let i = 0; i < oldMobs.length && !found; i++) {
                    if (newMob.id == oldMobs[i].id) {
                        found = true;
                        if (newMob.vertices.length != oldMobs[i].vertices.length) changed = true;
                        for (let j = 0; j < newMob.vertices.length; j++) if (newMob.vertices[j].x != oldMobs[i].vertices[j].x || newMob.vertices[j].y != oldMobs[i].vertices[j].y) changed = true;
                    }
                }
                if (changed || !found) mobChanges.push(newMob);
            }
            for (const newMob of mobChanges) {
                const data = new Uint8Array(new ArrayBuffer(3 + 16 * newMob.vertices.length));
                data[0] = 32;
                const dataView = new DataView(data.buffer);
                dataView.setUint16(1, newMob.id);
                let index = 3;
                for (const vertex of newMob.vertices) {
                    dataView.setFloat64(index, vertex.x);
                    dataView.setFloat64(index + 8, vertex.y);
                    index += 16;
                }
                dcLocal.send(dataView);
            }

            for (const oldMob of oldMobs) {
                let found = false;
                for (let i = 0; i < mob.length; i++) if (oldMob.id == mob[i].id) found = true;
                if (!found) {
                    const data = new Uint8Array(new ArrayBuffer(3));
                    data[0] = 33;
                    const dataView = new DataView(data.buffer);
                    dataView.setUint16(1, oldMob.id);
                    dcLocal.send(dataView);
                }
            }

            oldMobs.length = 0;
            for (const newMob of mob) {
                vertices = [];
                for (const vertex of newMob.vertices) vertices.push({ x: vertex.x, y: vertex.y });
                oldMobs.push({ id: newMob.id, position: { x: newMob.position.x, y: newMob.position.y }, angle: newMob.size, vertices });
            };
        }})
    }
})();