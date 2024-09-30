const protocol = {
    game: {
        syncRequest: 0,
        sync: 1
    },
    player: {
        movement: 2,
        rotation: 3,
        setField: 4,
        immuneCycleUpdate: 5,
        healthUpdate: 6,
        maxHealthUpdate: 7,
        energyUpdate: 8,
        maxEnergyUpdate: 9,
        inputs: 10,
        toggleCrouch: 11,
        toggleCloak: 12,
        holdBlock: 13,
        throwChargeUpdate: 14,
        togglePause: 15
    },
    block: {
        infoRequest: 16,
        info: 17,
        positionUpdate: 18,
        vertexUpdate: 19,
        delete: 20
    },
    powerup: {
        infoRequest: 21,
        info: 22,
        update: 23,
        delete: 24
    },
    mob: {
        infoRequest: 25,
        info: 26,
        positionUpdate: 27,
        vertexUpdate: 28,
        colorUpdate: 29,
        propertyUpdate: 30,
        delete: 31
    },
    bullet: {
        explosion: 32,
        pulse: 33
    }
}

let player1 = {
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
};


b.multiplayerExplosion = (where, radius, color) => {
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
            // console.log('peerRemote', 'ondatachannel', e);
            window.dcRemote = e.channel;
            window.dcRemote.onopen = function(e) {
                // console.log('dcRemote', 'onopen', e);
            };
            window.dcRemote.onmessage = async (message) => {
                // console.log('dcRemote', 'onmessage', message.data);
                const data = typeof message.data.arrayBuffer == 'function' ? new DataView(await message.data.arrayBuffer()) : new DataView(message.data);
                const id = new Uint8Array(data.buffer)[0];
                switch (id) {
                    case protocol.game.sync: {
                        simulation.difficultyMode = new Uint8Array(data.buffer)[1];
                        Math.initialSeed = new TextDecoder().decode(data.buffer.slice(3, new Uint8Array(data.buffer)[2] + 3));
                        Math.seed = Math.abs(Math.hash(Math.initialSeed));
                        break;
                    }
                    case protocol.player.rotation: {
                        player1.mouseInGame.x = data.getFloat64(1);
                        player1.mouseInGame.y = data.getFloat64(9);
                        break;
                    }
                    case protocol.player.movement: {
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
                        break;
                    }
                    case protocol.player.setField: {
                        player1.fieldMode = new Uint8Array(data.buffer)[1];
                        player1.fieldMeterColor = fieldData[player1.fieldMode].fieldMeterColor;
                        player1.fieldRange = fieldData[player1.fieldMode].fieldRange;
                        player1.fieldPosition = { x: player1.pos.x, y: player1.pos.y };
                        player1.fieldAngle = player1.angle;
                        player1.fieldArc = 0.2;
                        break;
                    }
                    case protocol.player.immuneCycleUpdate: {
                        player1.immuneCycle = data.getFloat32(1);
                        break;
                    }
                    case protocol.player.healthUpdate: {
                        if (data.getUint8(5) == 1) player1.health = data.getFloat32(1);
                        else {
                            m.health = data.getFloat32(1);
                            if (m.health > m.maxHealth) m.health = m.maxHealth;
                            m.displayHealth();
                        }
                        break;
                    }
                    case protocol.player.maxHealthUpdate: {
                        if (data.getUint8(5) == 1) player1.maxHealth = data.getFloat32(1);
                        else {
                            m.maxHealth = data.getFloat32(1);
                            document.getElementById("health-bg").style.width = `${Math.floor(300 * m.maxHealth)}px`;
                            if (m.health > m.maxHealth) m.health = m.maxHealth;
                            m.displayHealth();
                        }
                        break;
                    }
                    case protocol.player.energyUpdate: {
                        if (data.getUint8(5) == 1) player1.energy = data.getFloat32(1);
                        else m.maxEnergy = data.getFloat32(1);
                        break;
                    }
                    case protocol.player.maxEnergyUpdate: {
                        if (data.getUint8(5) == 1) player1.maxEnergy = data.getFloat32(1);
                        else m.energy = data.getFloat32(1);
                        break;
                    }
                    case protocol.player.inputs: {
                        player1.input.up = new Uint8Array(data.buffer)[1] == 1;
                        player1.input.down = new Uint8Array(data.buffer)[2] == 1;
                        player1.input.left = new Uint8Array(data.buffer)[3] == 1;
                        player1.input.right = new Uint8Array(data.buffer)[4] == 1;
                        player1.input.field = new Uint8Array(data.buffer)[5] == 1;
                        player1.input.fire = new Uint8Array(data.buffer)[6] == 1;
                        break;
                    }
                    case protocol.player.toggleCrouch: {
                        player1.crouch = new Uint8Array(data.buffer)[1] == 1;
                        break;
                    }
                    case protocol.player.toggleCloak: {
                        player1.isCloak = new Uint8Array(data.buffer)[1] == 1;
                        break;
                    }
                    case protocol.player.holdBlock: {
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
                        break;
                    }
                    case protocol.player.throwChargeUpdate: {
                        player1.throwCharge = data.getFloat32(1);
                        break;
                    }
                    case protocol.block.info: {
                        let block = body.find(a => a.id == data.getUint16(1));
                        if (!block) {
                            const me = body.length;
                            let vertices = '';
                            for (let i = 0; i < data.getUint8(19); i += 16) vertices += `${vertices == '' ? '' : ' '}${data.getFloat64(20 + i)} ${data.getFloat64(20 + i + 8)}`;
                            oldBodyVertex(data.getFloat64(3), data.getFloat64(11), vertices, {});
                            body[me].id = data.getUint16(1);
                            body[me].inertia = Infinity;
                        }
                        break;
                    }
                    case protocol.block.positionUpdate: {
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
                            const dataView = new DataView(new ArrayBuffer(3));
                            dataView.setUint8(0, protocol.block.infoRequest);
                            dataView.setUint16(1, data.getUint16(1));
                            dcRemote.send(dataView);
                        }
                        break;
                    }
                    case protocol.block.vertexUpdate: {
                        const block = body.find(a => a.id == data.getUint16(1));
                        if (block == null) {
                            const dataView = new DataView(new ArrayBuffer(3));
                            dataView.setUint8(0, protocol.block.infoRequest);
                            dataView.setUint16(1, data.getUint16(1));
                            dcRemote.send(dataView);
                        } else {
                            const newVertices = [];
                            for (let i = 3; i < data.byteLength; i += 16) newVertices.push({ x: data.getFloat64(i), y: data.getFloat64(i + 8) });
                            Matter.Body.setVertices(block, newVertices)
                        }
                        break;
                    }
                    case protocol.block.delete: {
                        const index = body.findIndex(a => a.id == data.getUint16(1));
                        Matter.Composite.remove(engine.world, body[index]);
                        body = body.slice(0, index).concat(body.slice(index + 1));
                        break;
                    }
                    case protocol.powerup.info: {
                        if (powerUp.find(a => a.id == data.getUint16(1)) == null) {
                            const me = powerUp.length;
                            oldPowerupSpawn(data.getFloat64(3), data.getFloat64(11), new TextDecoder().decode(data.buffer.slice(28, new Uint8Array(data.buffer)[27] + 28)));
                            powerUp[me].id = data.getUint16(1);
                            powerUp[me].size = data.getFloat64(19);
                            powerUp[me].collisionFilter.category = Number(data.getBigUint64(28 + data.getUint8(27)));
                            powerUp[me].collisionFilter.mask = Number(data.getBigUint64(36 + data.getUint8(27)));
                        }
                        break;
                    }
                    case protocol.powerup.update: {
                        const powerup = powerUp.find(a => a.id == data.getUint16(1));
                        if (powerup == null) {
                            const dataView = new DataView(new ArrayBuffer(3));
                            dataView.setUint8(0, protocol.powerup.infoRequest);
                            dataView.setUint16(1, data.getUint16(1));
                            dcRemote.send(dataView);
                        } else {
                            Matter.Body.setPosition(powerup, { x: data.getFloat64(3), y: data.getFloat64(11) });
                            powerup.size = data.getFloat64(19);
                            powerup.collisionFilter.category = Number(data.getBigUint64(27));
                            powerup.collisionFilter.mask = Number(data.getBigUint64(35));
                        }
                        break;
                    }
                    case protocol.powerup.delete: {
                        const index = powerUp.findIndex(a => a.id == data.getUint16(1));
                        Matter.Composite.remove(engine.world, powerUp[index]);
                        powerUp = powerUp.slice(0, index).concat(powerUp.slice(index + 1));
                        break;
                    }
                    case protocol.mob.info: {
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
                        break;
                    }
                    case protocol.mob.positionUpdate: {
                        const newMob = mob.find(a => a.id == data.getUint16(1));
                        if (newMob == null) {
                            const dataView = new DataView(new ArrayBuffer(3));
                            dataView.setUint8(0, protocol.mob.infoRequest);
                            dataView.setUint16(1, data.getUint16(1));
                            dcRemote.send(dataView);
                        } else {
                            Matter.Body.setPosition(newMob, { x: data.getFloat64(3), y: data.getFloat64(11) });
                            Matter.Body.setAngle(newMob, data.getFloat64(19));
                        }
                        break;
                    }
                    case protocol.mob.vertexUpdate: {
                        const newMob = mob.find(a => a.id == data.getUint16(1));
                        if (newMob == null) {
                            const dataView = new DataView(new ArrayBuffer(3));
                            dataView.setUint8(0, protocol.mob.infoRequest);
                            dataView.setUint16(1, data.getUint16(1));
                            dcRemote.send(dataView);
                        } else {
                            const newVertices = [];
                            for (let i = 3; i < data.byteLength; i += 16) newVertices.push({ x: data.getFloat64(i), y: data.getFloat64(i + 8) });
                            Matter.Body.setVertices(newMob, newVertices)
                        }
                        break;
                    }
                    case protocol.mob.colorUpdate: {
                        const newMob = mob.find(a => a.id == data.getUint16(1));
                        if (newMob == null) {
                            const dataView = new DataView(new ArrayBuffer(3));
                            dataView.setUint8(0, protocol.mob.infoRequest);
                            dataView.setUint16(1, data.getUint16(1));
                            dcRemote.send(dataView);
                        } else {
                            const colorLength = data.getUint8(3);
                            newMob.color = new TextDecoder().decode(data.buffer.slice(4, 4 + colorLength));
                            newMob.alpha = data.getFloat32(4 + data.getUint8(3));
                            const strokeLength = data.getUint8(8 + colorLength);
                            newMob.stroke = new TextDecoder().decode(data.buffer.slice(9 + colorLength, 9 + colorLength + strokeLength));
                        }
                        break;
                    }
                    case protocol.mob.propertyUpdate: {
                        const newMob = mob.find(a => a.id == data.getUint16(1));
                        if (newMob == null) {
                            const dataView = new DataView(new ArrayBuffer(3));
                            dataView.setUint8(0, protocol.mob.infoRequest);
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
                        break;
                    }
                    case protocol.mob.delete: {
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
                            Matter.Composite.remove(engine.world, mob[index]);
                            mob = mob.slice(0, index).concat(mob.slice(index + 1));
                        }
                        break;
                    }
                    case protocol.bullet.explosion: {
                        // explosion
                        b.multiplayerExplosion({ x: data.getFloat64(1), y: data.getFloat64(9) }, data.getFloat64(17), new TextDecoder().decode(data.buffer.slice(26, new Uint8Array(data.buffer)[25] + 26)));
                        break;
                    }
                    case protocol.bullet.pulse: {
                        // pulse
                        b.multiplayerPulse(data.getFloat64(1), data.getFloat64(9), { x: data.getFloat64(17), y: data.getFloat64(25) });
                        break;
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
            // console.log('peerRemote', 'onsignalingstatechange', peerRemote.signalingState);
            if (peerRemote.iceGatheringState == 'complete') ws.close();
        };
        peerRemote.onicegatheringstatechange = (e) => console.log('peerRemote', 'onicegatheringstatechange', peerRemote.iceGatheringState);
        peerRemote.onicecandidate = (e) => {
            // share ICE candidates with peerLocal
            // console.log('peerRemote', 'onicecandidate', e);
            if (e.candidate != null) ws.send(`\x01${JSON.stringify(e.candidate)}`);
        }
        // peerRemote.onnegotiationneeded = (e) => console.log('peerRemote', 'onnegotiationneeded', e);

        ws = new WebSocket('ws://localhost' /*'wss://n-gon.cornbread2100.com'*/);
        ws.onopen = async () => {
            console.log('Connected to signaling server');
            ws.send(`\x01${prompt('Join code:')}`)
        }
        ws.onmessage = async (message) => {
            // console.log('message:', message.data, message.data[0] == '\x01')

            if (message.data[0] == '\x00') {
                const peerLocalOffer = new RTCSessionDescription(JSON.parse(message.data.substring(1)));
                // console.log('peerRemote', 'setRemoteDescription', peerLocalOffer);
                await peerRemote.setRemoteDescription(peerLocalOffer);

                // console.log('peerRemote', 'setRemoteDescription');
                let peerRemoteAnswer = await peerRemote.createAnswer();

                // console.log('peerRemote', 'setLocalDescription', peerRemoteAnswer);
                await peerRemote.setLocalDescription(peerRemoteAnswer);
                ws.send(`\x01${JSON.stringify(peerRemoteAnswer)}`);
            }
            if (message.data[0] == '\x01') peerRemote.addIceCandidate(new RTCIceCandidate(JSON.parse(message.data.substring(1))));
            if (message.data[0] == '\x02') console.error(message.data.substring(1));
        }
        ws.onerror = (err) => {
            console.error('Error with connection to signaling server:', err);
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

    b.explosion = (where, radius, color = 'rgba(255,25,0,0.6)') => {
        const textEncoder = new TextEncoder();
        const data = new Uint8Array(new ArrayBuffer(26 + textEncoder.encode(color).length));
        data.set(textEncoder.encode(color), 26);
        const dataView = new DataView(data.buffer);
        dataView.setUint8(0, protocol.bullet.explosion);
        dataView.setFloat64(1, where.x);
        dataView.setFloat64(9, where.y);
        dataView.setFloat64(17, radius);
        dataView.setUint8(25, textEncoder.encode(color).length);
        dcRemote.send(dataView);
    }

    b.pulse = (charge, angle = m.angle, where = m.pos) => {
        const dataView = new DataView(new ArrayBuffer(33));
        dataView.setUint8(0, protocol.bullet.pulse);
        dataView.setFloat64(1, charge);
        dataView.setFloat64(9, angle);
        dataView.setFloat64(17, where.x);
        dataView.setFloat64(25, where.y);
        dcRemote.send(dataView);
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
        yOff: 70,
        paused: false
    }
    let oldPowerups = [];

    const oldStartGame = simulation.startGame;
    simulation.startGame = async () => {
        // sync request
        Math.initialSeed = null;
        const dataView = new DataView(new ArrayBuffer(1));
        dataView.setUint8(0, protocol.game.syncRequest);
        dcRemote.send(dataView);
        
        // wait for sync
        await new Promise(async resolve => {
            while (Math.initialSeed == null) await new Promise(res => setTimeout(res, 100));
            resolve();
        })

        const oldDifficulty = simulation.difficultyMode;
        oldStartGame();
        simulation.difficultyMode = oldDifficulty;
        if (level.difficultyText) document.title = `n-gon: (${simulation.isCheating ? "testing" : level.difficultyText()})`;
        Math.random = Math.seededRandom;

        const oldThrowBlock = m.throwBlock;
        m.throwBlock = () => {
            const holdingTarget = m.holdingTarget;
            oldThrowBlock();
            const dataView = new DataView(new ArrayBuffer(43));
            dataView.setUint8(0, protocol.block.positionUpdate);
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
        }})
        simulation.ephemera.push({ name: 'Broadcast', count: 0, do: () => {
            if (m.onGround != oldM.onGround || m.pos.x != oldM.pos.x || m.pos.y != oldM.pos.y || m.Vx != oldM.Vx || m.Vy != oldM.Vy || m.walk_cycle != oldM.walk_cycle || m.yOff != oldM.yOff) {
                const dataView = new DataView(new ArrayBuffer(58));
                dataView.setUint8(0, protocol.player.movement);
                dataView.setFloat64(1, simulation.mouseInGame.x);
                dataView.setFloat64(9, simulation.mouseInGame.y);
                dataView.setUint8(17, m.onGround ? 1 : 0);
                dataView.setFloat64(18, m.pos.x);
                dataView.setFloat64(26, m.pos.y);
                dataView.setFloat64(34, m.Vx);
                dataView.setFloat64(42, m.Vy);
                dataView.setFloat32(50, m.walk_cycle);
                dataView.setFloat32(54, m.yOff);
                dcRemote.send(dataView);
            } else if (simulation.mouseInGame.x != oldM.mouseInGame.x || simulation.mouseInGame.y != oldM.mouseInGame.y) {
                const dataView = new DataView(new ArrayBuffer(17));
                dataView.setUint8(0, protocol.player.rotation);
                dataView.setFloat64(1, simulation.mouseInGame.x);
                dataView.setFloat64(9, simulation.mouseInGame.y);
                dcRemote.send(dataView);
            }
            if (m.fieldMode != oldM.fieldMode) {
                const dataView = new DataView(new ArrayBuffer(2));
                dataView.setUint8(0, protocol.player.setField);
                dataView.setUint8(1, m.fieldMode);
                dcRemote.send(dataView);
            }
            if (m.immuneCycle != oldM.immuneCycle) {
                const dataView = new DataView(new ArrayBuffer(5));
                dataView.setUint8(0, protocol.player.immuneCycleUpdate);
                dataView.setFloat32(1, m.immuneCycle);
                dcRemote.send(dataView);
            }
            if (m.health != oldM.health) {
                const dataView = new DataView(new ArrayBuffer(5));
                dataView.setUint8(0, protocol.player.healthUpdate);
                dataView.setFloat32(1, m.health);
                dcRemote.send(dataView);
            }
            if (m.maxHealth != oldM.maxHealth) {
                const dataView = new DataView(new ArrayBuffer(5));
                dataView.setUint8(0, protocol.player.maxHealthUpdate);
                dataView.setFloat32(1, m.maxHealth);
                dcRemote.send(dataView);
            }
            if (m.energy != oldM.energy) {
                const dataView = new DataView(new ArrayBuffer(5));
                dataView.setUint8(0, protocol.player.energyUpdate);
                dataView.setFloat32(1, m.energy);
                dcRemote.send(dataView);
            }
            if (m.maxEnergy != oldM.maxEnergy) {
                const dataView = new DataView(new ArrayBuffer(5));
                dataView.setUint8(0, protocol.player.maxEnergyUpdate);
                dataView.setFloat32(1, m.maxEnergy);
                dcRemote.send(dataView);
            }
            if (input.up != oldM.input.up || input.down != oldM.input.down || input.left != oldM.input.left || input.right != oldM.input.right || input.field != oldM.input.field || input.fire != oldM.input.fire) {
                const dataView = new DataView(new ArrayBuffer(7));
                dataView.setUint8(0, protocol.player.inputs);
                dataView.setUint8(1, input.up ? 1 : 0);
                dataView.setUint8(2, input.down ? 1 : 0);
                dataView.setUint8(3, input.left ? 1 : 0);
                dataView.setUint8(4, input.right ? 1 : 0);
                dataView.setUint8(5, input.field ? 1 : 0);
                dataView.setUint8(6, input.fire ? 1 : 0);
                dcRemote.send(dataView);
            }
            if (m.crouch != oldM.crouch) {
                const dataView = new DataView(new ArrayBuffer(2));
                dataView.setUint8(0, protocol.player.toggleCrouch);
                dataView.setUint8(1, m.crouch ? 1 : 0);
                dcRemote.send(dataView);
            }
            if (m.isCloak != oldM.isCloak) {
                const dataView = new DataView(new ArrayBuffer(2));
                dataView.setUint8(0, protocol.player.toggleCloak);
                dataView.setUint8(1, m.isCloak ? 1 : 0);
                dcRemote.send(dataView);
            }
            if (m.isHolding != oldM.isHolding || m.holdingTarget?.id != oldM.holdingTarget?.id) {
                const dataView = new DataView(new ArrayBuffer(5));
                dataView.setUint8(0, protocol.player.holdBlock);
                dataView.setUint8(1, m.isHolding ? 1 : 0);
                dataView.setUint16(2, m.holdingTarget?.id || -1);
                dataView.setUint8(4, 2); // TODO: player id
                dcRemote.send(dataView);
            }
            if (m.throwCharge != oldM.throwCharge) {
                const dataView = new DataView(new ArrayBuffer(7));
                dataView.setUint8(0, protocol.player.throwChargeUpdate);
                dataView.setFloat32(1, m.throwCharge);
                dataView.setUint8(5, 2); // TODO: player id
                dcRemote.send(dataView);
            }
            if (simulation.paused != oldM.paused) {
                const dataView = new DataView(new ArrayBuffer(2));
                dataView.setUint8(0, protocol.player.togglePause);
                dataView.setUint8(1, simulation.paused ? 1 : 0);
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
                yOff: m.yOff,
                paused: simulation.paused
            }

            for (const oldPowerup of oldPowerups) {
                if (!powerUp.find(a => a.id == oldPowerup.id)) {
                    const dataView = new DataView(new ArrayBuffer(3));
                    dataView.setUint8(0, protocol.powerup.delete);
                    dataView.setUint16(1, oldPowerup.id);
                    dcRemote.send(dataView);
                }
            }

            oldPowerups.splice(0);
            for (const powerup of powerUp) oldPowerups.push({ id: powerup.id, position: { x: powerup.position.x, y: powerup.position.y }, size: powerup.size, collisionFilter: { category: powerup.collisionFilter.category, mask: powerup.collisionFilter.mask }});
        }})
    }
})();