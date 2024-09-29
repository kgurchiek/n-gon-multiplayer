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

let player2;

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
            switch (id) {
                case protocol.game.syncRequest: {
                    const textEncoder = new TextEncoder();
                    const data = new Uint8Array(new ArrayBuffer(3 + textEncoder.encode(Math.initialSeed).length));
                    data.set(textEncoder.encode(Math.initialSeed), 3);
                    const dataView = new DataView(data.buffer);
                    dataView.setUint8(0, protocol.game.sync);
                    dataView.setUint8(1, simulation.difficultyMode);
                    dataView.setUint8(2, textEncoder.encode(Math.initialSeed).length);
                    dcLocal.send(dataView);
                    break;
                }
                case protocol.player.movement: {
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
                    break;
                }
                case protocol.player.rotation: {
                    // rotation
                    player2.mouseInGame.x = data.getFloat64(1);
                    player2.mouseInGame.y = data.getFloat64(9);
                    break;
                }
                case protocol.player.setField: {
                    player2.fieldMode = new Uint8Array(data.buffer)[1];
                    player2.fieldMeterColor = fieldData[player2.fieldMode].fieldMeterColor;
                    player2.fieldRange = fieldData[player2.fieldMode].fieldRange;
                    player2.fieldPosition = { x: player2.pos.x, y: player2.pos.y };
                    player2.fieldAngle = player2.angle;
                    player2.fieldArc = 0.2;
                    break;
                }
                case protocol.player.immuneCycleUpdate: {
                    player2.immuneCycle = data.getFloat32(1);
                    break;
                }
                case protocol.player.healthUpdate: {
                    player2.health = data.getFloat32(1);
                    break;
                }
                case protocol.player.maxHealthUpdate: {
                    player2.maxHealth = data.getFloat32(1);
                    break;
                }
                case protocol.player.energyUpdate: {
                    player2.energy = data.getFloat32(1);
                    break;
                }
                case protocol.player.maxEnergyUpdate: {
                    player2.maxEnergy = data.getFloat32(1);
                    break;
                }
                case protocol.player.inputs: {
                    player2.input.up = new Uint8Array(data.buffer)[1] == 1;
                    player2.input.down = new Uint8Array(data.buffer)[2] == 1;
                    player2.input.left = new Uint8Array(data.buffer)[3] == 1;
                    player2.input.right = new Uint8Array(data.buffer)[4] == 1;
                    player2.input.field = new Uint8Array(data.buffer)[5] == 1;
                    player2.input.fire = new Uint8Array(data.buffer)[6] == 1;
                    // if (!player2.input.fire) b.multiplayerLasers = b.multiplayerLasers.filter(a => a.id != 2);
                    break;
                }
                case protocol.player.toggleCrouch: {
                    player2.crouch = new Uint8Array(data.buffer)[1] == 1;
                    break;
                }
                case protocol.player.toggleCloak: {
                    player2.isCloak = new Uint8Array(data.buffer)[1] == 1;
                    break;
                }
                case protocol.player.holdBlock: {
                    player2.isHolding = data.getUint8(1) == 1;
                    if (!player2.isHolding && player2.holdingTarget) {
                        player2.holdingTarget.collisionFilter.category = cat.body;
                        player2.holdingTarget.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet;
                    }
                    player2.holdingTarget = data.getUint16(2) == -1 ? null : body.find(block => block.id == data.getUint16(2));
                    if (player2.holdingTarget == null) player2.isHolding = false;
                    if (player2.isHolding) {
                        player2.holdingTarget.collisionFilter.category = 0;
                        player2.holdingTarget.collisionFilter.mask = 0;
                    }
                    break;
                }
                case protocol.player.throwChargeUpdate: {
                    player2.throwCharge = data.getFloat32(1);
                    break;
                }
                case protocol.player.togglePause: {
                    player2.paused = new Uint8Array(data.buffer)[1] == 1;
                    break;
                }
                case protocol.block.infoRequest: {
                    let block = body.find(a => a.id == data.getUint16(1));
                    if (block != null) {
                        const dataView = new DataView(new ArrayBuffer(20 + 16 * block.vertices.length));
                        dataView.setUint8(0, protocol.block.info);
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
                    break;
                }
                case protocol.powerup.infoRequest: {
                    const powerup = powerUp.find(a => a.id == data.getUint16(1));
                    if (powerup != null) {
                        const powerupName = new TextEncoder().encode(powerup.name);
                        const data = new Uint8Array(new ArrayBuffer(44 + powerupName.length));
                        data.set(powerupName, 28)
                        const dataView = new DataView(data.buffer);
                        dataView.setUint8(0, protocol.powerup.info);
                        dataView.setUint16(1, powerup.id);
                        dataView.setFloat64(3, powerup.position.x);
                        dataView.setFloat64(11, powerup.position.y);
                        dataView.setFloat64(19, powerup.size);
                        dataView.setUint8(27, powerupName.length);
                        dataView.setBigUint64(28 + powerupName.length, BigInt(powerup.collisionFilter.category));
                        dataView.setBigUint64(36 + powerupName.length, BigInt(powerup.collisionFilter.mask));
                        dcLocal.send(dataView);
                    }
                    break;
                }
                case protocol.powerup.delete: {
                    const index = powerUp.findIndex(a => a.id == data.getUint16(1));
                    Matter.Composite.remove(engine.world, powerUp[index]);
                    powerUp = powerUp.slice(0, index).concat(powerUp.slice(index + 1));
                    break;
                }
                case protocol.mob.infoRequest: {
                    const requestedMob = mob.find(a => a.id == data.getUint16(1));
                    if (requestedMob != null && requestedMob.mobType != null) {
                        const textEncoder = new TextEncoder();
                        const color = textEncoder.encode(requestedMob.fill);
                        const stroke = textEncoder.encode(requestedMob.stroke);
                        const data = new Uint8Array(new ArrayBuffer(93 + color.length + stroke.length));
                        data.set(color, 38);
                        data.set(stroke, 43 + color.length);
                        const dataView = new DataView(data.buffer);
                        dataView.setUint8(0, protocol.mob.info);
                        dataView.setUint16(1, requestedMob.id);
                        dataView.setUint8(3, requestedMob.mobType);
                        dataView.setFloat64(4, requestedMob.position.x);
                        dataView.setFloat64(12, requestedMob.position.y);
                        dataView.setFloat64(20, requestedMob.angle);
                        dataView.setUint8(28, requestedMob.vertices.length);
                        dataView.setFloat64(29, requestedMob.radius);
                        dataView.setUint8(37, color.length);
                        dataView.setFloat32(38 + color.length, requestedMob.alpha || 1);
                        dataView.setUint8(42 + color.length, stroke.length);
                        dataView.setUint8(43 + color.length + stroke.length, requestedMob.isShielded ? 1 : 0);
                        dataView.setUint8(44 + color.length + stroke.length, requestedMob.isUnblockable ? 1 : 0);
                        dataView.setUint8(45 + color.length + stroke.length, requestedMob.showHealthBar ? 1 : 0);
                        dataView.setBigUint64(46 + color.length + stroke.length, BigInt(requestedMob.collisionFilter.category));
                        dataView.setBigUint64(54 + color.length + stroke.length, BigInt(requestedMob.collisionFilter.mask));
                        dataView.setUint8(62 + color.length + stroke.length, requestedMob.isBoss ? 1 : 0);
                        dataView.setUint8(63 + color.length + stroke.length, requestedMob.isFinalBoss ? 1 : 0);
                        dataView.setUint8(64 + color.length + stroke.length, requestedMob.isInvulnerable ? 1 : 0);
                        dataView.setUint8(65 + color.length + stroke.length, requestedMob.isZombie ? 1 : 0);
                        dataView.setUint8(66 + color.length + stroke.length, requestedMob.isGrouper ? 1 : 0);
                        dataView.setUint8(67 + color.length + stroke.length, requestedMob.isMobBullet ? 1 : 0);
                        dataView.setFloat64(68 + color.length + stroke.length, requestedMob.seePlayer.recall);
                        dataView.setFloat64(76 + color.length + stroke.length, requestedMob.health);
                        dataView.setFloat64(84 + color.length + stroke.length, requestedMob.radius);
                        dataView.setUint8(92 + color.length + stroke.length, requestedMob.seePlayer.yes ? 1 : 0);
                        dcLocal.send(dataView);
                    }
                    break;
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
            console.log('Signaling complete');
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
                        // Matter.Composite.remove(engine.world, powerUp[i]);
                        // powerUp.splice(i, 1);
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
        paused: false,
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

    const oldMACHO = spawn.MACHO;
    spawn.MACHO = (x = m.pos.x, y = m.pos.y) => {
        oldMACHO(x, y);
        mob[mob.length - 1].mobType = 0;
    }
    
    const oldWIMP = spawn.WIMP;
    spawn.WIMP = (x = level.exit.x + tech.wimpCount * 200 * (Math.random() - 0.5), y = level.exit.y + tech.wimpCount * 200 * (Math.random() - 0.5)) => {
        oldWIMP(x, y);
        mob[mob.length - 1].mobType = 1;
    }
    
    const oldFinalBoss = spawn.finalBoss;
    spawn.finalBoss = (x, y, radius = 300) => {
        oldFinalBoss(x, y, radius);
        mob[mob.length - 1].mobType = 2;
    }
    
    const oldZombie = spawn.zombie;
    spawn.zombie = (x, y, radius, sides, color) => {
        oldZombie(x, y, radius, sides, color);
        mob[mob.length - 1].mobType = 3;
    }
    
    const oldStarter = spawn.starter;
    spawn.starter = (x, y, radius = Math.floor(15 + 20 * Math.random())) => {
        oldStarter(x, y, radius);
        mob[mob.length - 1].mobType = 4;
    }
    
    const oldBlockGroupMob = spawn.blockGroupMob;
    spawn.blockGroupMob = (x, y, radius = 25 + Math.floor(Math.random() * 20)) => {
        oldBlockGroupMob(x, y, radius);
        mob[mob.length - 1].mobType = 5;
    }
    
    const oldBlockBoss = spawn.blockBoss;
    spawn.blockBoss = (x, y, radius = 60) => {
        oldBlockBoss(x, y, radius);
        mob[mob.length - 1].mobType = 6;
    }
    
    const oldBlockMob = spawn.blockMob;
    spawn.blockMob = (x, y, host, growCycles = 60) => {
        oldBlockMob(x, y, host, growCycles);
        mob[mob.length - 1].mobType = 7;
    }
    
    const oldCellBoss = spawn.cellBoss;
    spawn.cellBoss = (x, y, radius = 20, cellID) => {
        oldCellBoss(x, y, radius, cellID);
        mob[mob.length - 1].mobType = 8;
    }
    
    const oldSpawnerBoss = spawn.spawnerBoss;
    spawn.spawnerBoss = (x, y, radius, spawnID) => {
        oldSpawnerBoss(x, y, radius, spawnID);
        mob[mob.length - 1].mobType = 9;
    }
    
    const oldGrowBoss = spawn.growBoss;
    spawn.growBoss = (x, y, radius, buffID) => {
        oldGrowBoss(x, y, radius, buffID);
        mob[mob.length - 1].mobType = 10;
    }
    
    const oldPowerUpBossBaby = spawn.powerUpBossBaby;
    spawn.powerUpBossBaby = (x, y, vertices = 9, radius = 60) => {
        oldPowerUpBossBaby(x, y, vertices, radius);
        mob[mob.length - 1].mobType = 11;
    }
    
    const oldPowerUpBoss = spawn.powerUpBoss;
    spawn.powerUpBoss = (x, y, vertices = 9, radius = 130) => {
        oldPowerUpBoss(x, y, vertices, radius);
        mob[mob.length - 1].mobType = 12;
    }
    
    const oldGrower = spawn.grower;
    spawn.grower = (x, y, radius = 15) => {
        oldGrower(x, y, radius);
        mob[mob.length - 1].mobType = 13;
    }
    
    const oldSpringer = spawn.springer;
    spawn.springer = (x, y, radius = 20 + Math.ceil(Math.random() * 35)) => {
        oldSpringer(x, y, radius);
        mob[mob.length - 1].mobType = 14;
    }
    
    const oldHopper = spawn.hopper;
    spawn.hopper = (x, y, radius = 35 + Math.ceil(Math.random() * 30)) => {
        oldHopper(x, y, radius);
        mob[mob.length - 1].mobType = 15;
    }
    
    const oldHopMother = spawn.hopMother;
    spawn.hopMother = (x, y, radius = 20 + Math.ceil(Math.random() * 20)) => {
        oldHopMother(x, y, radius);
        mob[mob.length - 1].mobType = 16;
    }
    
    const oldHopEgg = spawn.hopEgg;
    spawn.hopEgg = (x, y) => {
        oldHopEgg(x, y);
        mob[mob.length - 1].mobType = 17;
    }
    
    const oldHopBullet = spawn.hopBullet;
    spawn.hopBullet = (x, y, radius = 10 + Math.ceil(Math.random() * 8)) => {
        oldHopBullet(x, y, radius);
        mob[mob.length - 1].mobType = 18;
    }
    
    const oldHopMotherBoss = spawn.hopMotherBoss;
    spawn.hopMotherBoss = (x, y, radius = 120) => {
        oldHopMotherBoss(x, y, radius);
        mob[mob.length - 1].mobType = 19;
    }
    
    const oldSpinner = spawn.spinner;
    spawn.spinner = (x, y, radius = 30 + Math.ceil(Math.random() * 35)) => {
        oldSpinner(x, y, radius);
        mob[mob.length - 1].mobType = 20;
    }
    
    const oldSucker = spawn.sucker;
    spawn.sucker = (x, y, radius = 30 + Math.ceil(Math.random() * 25)) => {
        oldSucker(x, y, radius);
        mob[mob.length - 1].mobType = 21;
    }
    
    const oldSuckerBoss = spawn.suckerBoss;
    spawn.suckerBoss = (x, y, radius = 25) => {
        oldSuckerBoss(x, y, radius);
        mob[mob.length - 1].mobType = 22;
    }
    
    const oldSpiderBoss = spawn.spiderBoss;
    spawn.spiderBoss = (x, y, radius = 60 + Math.ceil(Math.random() * 10)) => {
        oldSpiderBoss(x, y, radius);
        mob[mob.length - 1].mobType = 23;
    }
    
    const oldMantisBoss = spawn.mantisBoss;
    spawn.mantisBoss = (x, y, radius = 35, isSpawnBossPowerUp = true) => {
        oldMantisBoss(x, y, radius, isSpawnBossPowerUp);
        mob[mob.length - 1].mobType = 24;
    }
    
    const oldBeamer = spawn.beamer;
    spawn.beamer = (x, y, radius = 15 + Math.ceil(Math.random() * 15)) => {
        oldBeamer(x, y, radius);
        mob[mob.length - 1].mobType = 25;
    }
    
    const oldHistoryBoss = spawn.historyBoss;
    spawn.historyBoss = (x, y, radius = 30) => {
        oldHistoryBoss(x, y, radius);
        mob[mob.length - 1].mobType = 26;
    }
    
    const oldFocuser = spawn.focuser;
    spawn.focuser = (x, y, radius = 30 + Math.ceil(Math.random() * 10)) => {
        oldFocuser(x, y, radius);
        mob[mob.length - 1].mobType = 27;
    }
    
    const oldFlutter = spawn.flutter;
    spawn.flutter = (x, y, radius = 20 + 6 * Math.random()) => {
        oldFlutter(x, y, radius);
        mob[mob.length - 1].mobType = 28;
    }
    
    const oldStinger = spawn.stinger;
    spawn.stinger = (x, y, radius = 18 + 4 * Math.random()) => {
        oldStinger(x, y, radius);
        mob[mob.length - 1].mobType = 29;
    }
    
    const oldBeetleBoss = spawn.beetleBoss;
    spawn.beetleBoss = (x, y, radius = 50) => {
        oldBeetleBoss(x, y, radius);
        mob[mob.length - 1].mobType = 30;
    }
    
    const oldLaserTargetingBoss = spawn.laserTargetingBoss;
    spawn.laserTargetingBoss = (x, y, radius = 80) => {
        oldLaserTargetingBoss(x, y, radius);
        mob[mob.length - 1].mobType = 31;
    }
    
    const oldLaserBombingBoss = spawn.laserBombingBoss;
    spawn.laserBombingBoss = (x, y, radius = 80) => {
        oldLaserBombingBoss(x, y, radius);
        mob[mob.length - 1].mobType = 32;
    }
    
    const oldBlinkBoss = spawn.blinkBoss;
    spawn.blinkBoss = (x, y) => {
        oldBlinkBoss(x, y);
        mob[mob.length - 1].mobType = 33;
    }
    
    const oldPulsarBoss = spawn.pulsarBoss;
    spawn.pulsarBoss = (x, y, radius = 90, isNonCollide = false) => {
        oldPulsarBoss(x, y, radius, isNonCollide);
        mob[mob.length - 1].mobType = 34;
    }
    
    const oldPulsar = spawn.pulsar;
    spawn.pulsar = (x, y, radius = 40) => {
        oldPulsar(x, y, radius);
        mob[mob.length - 1].mobType = 35;
    }
    
    const oldLaserLayer = spawn.laserLayer;
    spawn.laserLayer = (x, y, radius = 18 + Math.floor(6 * Math.random())) => {
        oldLaserLayer(x, y, radius);
        mob[mob.length - 1].mobType = 36;
    }
    
    const oldLaserLayerBoss = spawn.laserLayerBoss;
    spawn.laserLayerBoss = (x, y, radius = 65) => {
        oldLaserLayerBoss(x, y, radius);
        mob[mob.length - 1].mobType = 37;
    }
    
    const oldMobLaser = spawn.laser;
    spawn.laser = (x, y, radius = 30) => {
        oldMobLaser(x, y, radius);
        mob[mob.length - 1].mobType = 38;
    }
    
    const oldLaserBoss = spawn.laserBoss;
    spawn.laserBoss = (x, y, radius = 30) => {
        oldLaserBoss(x, y, radius);
        mob[mob.length - 1].mobType = 39;
    }
    
    const oldStabber = spawn.stabber;
    spawn.stabber = (x, y, radius = 25 + Math.ceil(Math.random() * 12), spikeMax = 7) => {
        oldStabber(x, y, radius, spikeMax);
        mob[mob.length - 1].mobType = 40;
    }
    
    const oldStriker = spawn.striker;
    spawn.striker = (x, y, radius = 14 + Math.ceil(Math.random() * 25)) => {
        oldStriker(x, y, radius);
        mob[mob.length - 1].mobType = 41;
    }
    
    const oldRevolutionBoss = spawn.revolutionBoss;
    spawn.revolutionBoss = (x, y, radius = 70) => {
        oldRevolutionBoss(x, y, radius);
        mob[mob.length - 1].mobType = 42;
    }
    
    const oldSprayBoss = spawn.sprayBoss;
    spawn.sprayBoss = (x, y, radius = 40, isSpawnBossPowerUp = true) => {
        oldSprayBoss(x, y, radius, isSpawnBossPowerUp);
        mob[mob.length - 1].mobType = 43;
    }
    
    const oldMineBoss = spawn.mineBoss;
    spawn.mineBoss = (x, y, radius = 120, isSpawnBossPowerUp = true) => {
        oldMineBoss(x, y, radius, isSpawnBossPowerUp);
        mob[mob.length - 1].mobType = 44;
    }
    
    const oldMine = spawn.mine;
    spawn.mine = (x, y) => {
        oldMine(x, y);
        mob[mob.length - 1].mobType = 45;
    }
    
    const oldBounceBoss = spawn.bounceBoss;
    spawn.bounceBoss = (x, y, radius = 80, isSpawnBossPowerUp = true) => {
        oldBounceBoss(x, y, radius, isSpawnBossPowerUp);
        mob[mob.length - 1].mobType = 46;
    }
    
    const oldTimeBoss = spawn.timeBoss;
    spawn.timeBoss = (x, y, radius = 50, isSpawnBossPowerUp = true) => {
        oldTimeBoss(x, y, radius, isSpawnBossPowerUp);
        mob[mob.length - 1].mobType = 47;
    }
    
    const oldBounceBullet = spawn.bounceBullet;
    spawn.bounceBullet = (x, y, velocity = { x: 0, y: 0 }, radius = 11, sides = 6) => {
        oldBounceBullet(x, y, velocity, radius, sides);
        mob[mob.length - 1].mobType = 48;
    }
    
    const oldSlashBoss = spawn.slashBoss;
    spawn.slashBoss = (x, y, radius = 80) => {
        oldSlashBoss(x, y, radius);
        mob[mob.length - 1].mobType = 49;
    }
    
    const oldSlasher = spawn.slasher;
    spawn.slasher = (x, y, radius = 33 + Math.ceil(Math.random() * 30)) => {
        oldSlasher(x, y, radius);
        mob[mob.length - 1].mobType = 50;
    }
    
    const oldSlasher2 = spawn.slasher2;
    spawn.slasher2 = (x, y, radius = 33 + Math.ceil(Math.random() * 30)) => {
        oldSlasher2(x, y, radius);
        mob[mob.length - 1].mobType = 51;
    }
    
    const oldSlasher3 = spawn.slasher3;
    spawn.slasher3 = (x, y, radius = 33 + Math.ceil(Math.random() * 30)) => {
        oldSlasher3(x, y, radius);
        mob[mob.length - 1].mobType = 52;
    }
    
    const oldSneakBoss = spawn.sneakBoss;
    spawn.sneakBoss = (x, y, radius = 70) => {
        oldSneakBoss(x, y, radius);
        mob[mob.length - 1].mobType = 53;
    }
    
    const oldSneaker = spawn.sneaker;
    spawn.sneaker = (x, y, radius = 15 + Math.ceil(Math.random() * 10)) => {
        oldSneaker(x, y, radius);
        mob[mob.length - 1].mobType = 54;
    }
    
    const oldGhoster = spawn.ghoster;
    spawn.ghoster = (x, y, radius = 50 + Math.ceil(Math.random() * 90)) => {
        oldGhoster(x, y, radius);
        mob[mob.length - 1].mobType = 55;
    }
    
    const oldBomberBoss = spawn.bomberBoss;
    spawn.bomberBoss = (x, y, radius = 88) => {
        oldBomberBoss(x, y, radius);
        mob[mob.length - 1].mobType = 56;
    }
    
    const oldShooter = spawn.shooter;
    spawn.shooter = (x, y, radius = 25 + Math.ceil(Math.random() * 50)) => {
        oldShooter(x, y, radius);
        mob[mob.length - 1].mobType = 57;
    }
    
    const oldShooterBoss = spawn.shooterBoss;
    spawn.shooterBoss = (x, y, radius = 110, isSpawnBossPowerUp = true) => {
        oldShooterBoss(x, y, radius, isSpawnBossPowerUp);
        mob[mob.length - 1].mobType = 58;
    }
    
    const oldBullet = spawn.bullet;
    spawn.bullet = (x, y, radius = 9, sides = 0) => {
        oldBullet(x, y, radius, sides);
        mob[mob.length - 1].mobType = 59;
    }
    
    const oldBomb = spawn.bomb;
    spawn.bomb = (x, y, radius = 9, sides = 5) => {
        oldBomb(x, y, radius, sides);
        mob[mob.length - 1].mobType = 60;
    }
    
    const oldSniper = spawn.sniper;
    spawn.sniper = (x, y, radius = 35 + Math.ceil(Math.random() * 30)) => {
        oldSniper(x, y, radius);
        mob[mob.length - 1].mobType = 61;
    }
    
    const oldSniperBullet = spawn.sniperBullet;
    spawn.sniperBullet = (x, y, radius = 9, sides = 5) => {
        oldSniperBullet(x, y, radius, sides);
        mob[mob.length - 1].mobType = 62;
    }
    
    const oldLauncherOne = spawn.launcherOne;
    spawn.launcherOne = (x, y, radius = 30 + Math.ceil(Math.random() * 40)) => {
        oldLauncherOne(x, y, radius);
        mob[mob.length - 1].mobType = 63;
    }
    
    const oldLauncher = spawn.launcher;
    spawn.launcher = (x, y, radius = 30 + Math.ceil(Math.random() * 40)) => {
        oldLauncher(x, y, radius);
        mob[mob.length - 1].mobType = 64;
    }
    
    const oldLauncherBoss = spawn.launcherBoss;
    spawn.launcherBoss = (x, y, radius = 90, isSpawnBossPowerUp = true) => {
        oldLauncherBoss(x, y, radius, isSpawnBossPowerUp);
        mob[mob.length - 1].mobType = 65;
    }
    
    const oldGrenadierBoss = spawn.grenadierBoss;
    spawn.grenadierBoss = (x, y, radius = 95) => {
        oldGrenadierBoss(x, y, radius);
        mob[mob.length - 1].mobType = 66;
    }
    
    const oldGrenadier = spawn.grenadier;
    spawn.grenadier = (x, y, radius = 35 + Math.ceil(Math.random() * 20)) => {
        oldGrenadier(x, y, radius);
        mob[mob.length - 1].mobType = 67;
    }
    
    const oldMobGrenade = spawn.grenade;
    spawn.grenade = (x, y, lifeSpan = 90 + Math.ceil(60 / simulation.accelScale), pulseRadius = Math.min(550, 250 + simulation.difficulty * 3), size = 3) => {
        oldMobGrenade(x, y, lifeSpan, pulseRadius, size);
        mob[mob.length - 1].mobType = 68;
    }
    
    const oldShieldingBoss = spawn.shieldingBoss;
    spawn.shieldingBoss = (x, y, radius = 200) => {
        oldShieldingBoss(x, y, radius);
        mob[mob.length - 1].mobType = 69;
    }
    
    const oldTimeSkipBoss = spawn.timeSkipBoss;
    spawn.timeSkipBoss = (x, y, radius = 50) => {
        oldTimeSkipBoss(x, y, radius);
        mob[mob.length - 1].mobType = 70;
    }
    
    const oldStreamBoss = spawn.streamBoss;
    spawn.streamBoss = (x, y, radius = 110) => {
        oldStreamBoss(x, y, radius);
        mob[mob.length - 1].mobType = 71;
    }
    
    const oldSeeker = spawn.seeker;
    spawn.seeker = (x, y, radius = 8, sides = 6) => {
        oldSeeker(x, y, radius, sides);
        mob[mob.length - 1].mobType = 72;
    }
    
    const oldSpawner = spawn.spawner;
    spawn.spawner = (x, y, radius = 55 + Math.ceil(Math.random() * 50)) => {
        oldSpawner(x, y, radius);
        mob[mob.length - 1].mobType = 73;
    }
    
    const oldSpawns = spawn.spawns;
    spawn.spawns = (x, y, radius = 15) => {
        oldSpawns(x, y, radius);
        mob[mob.length - 1].mobType = 74;
    }
    
    const oldExploder = spawn.exploder;
    spawn.exploder = (x, y, radius = 40 + Math.ceil(Math.random() * 50)) => {
        oldExploder(x, y, radius);
        mob[mob.length - 1].mobType = 75;
    }
    
    const oldSnakeSpitBoss = spawn.snakeSpitBoss;
    spawn.snakeSpitBoss = (x, y, radius = 50) => {
        oldSnakeSpitBoss(x, y, radius);
        mob[mob.length - 1].mobType = 76;
    }
    
    const oldDragonFlyBoss = spawn.dragonFlyBoss;
    spawn.dragonFlyBoss = (x, y, radius = 42) => {
        oldDragonFlyBoss(x, y, radius);
        mob[mob.length - 1].mobType = 77;
    }
    
    const oldSnakeBody = spawn.snakeBody;
    spawn.snakeBody = (x, y, radius = 10) => {
        oldSnakeBody(x, y, radius);
        mob[mob.length - 1].mobType = 78;
    }
    
    const oldTetherBoss = spawn.tetherBoss;
    spawn.tetherBoss = (x, y, constraint, radius = 90) => {
        oldTetherBoss(x, y, constraint, radius);
        mob[mob.length - 1].mobType = 79;
    }
    
    const oldShield = spawn.shield;
    spawn.shield = (target, x, y, chance = Math.min(0.02 + simulation.difficulty * 0.005, 0.2) + tech.duplicationChance(), isExtraShield = false) => {
        oldShield.call(spawn, target, x, y, chance, isExtraShield);
        mob[mob.length - 1].mobType = 80;
    }
    
    const oldGroupShield = spawn.groupShield;
    spawn.groupShield = (targets, x, y, radius, stiffness = 0.4) => {
        oldGroupShield(targets, x, y, radius, stiffness);
        mob[mob.length - 1].mobType = 81;
    }
    
    const oldOrbital = spawn.orbital;
    spawn.orbital = (who, radius, phase, speed) => {
        oldOrbital(who, radius, phase, speed);
        mob[mob.length - 1].mobType = 82;
    }
    
    const oldOrbitalBoss = spawn.orbitalBoss;
    spawn.orbitalBoss = (x, y, radius = 70) => {
        oldOrbitalBoss(x, y, radius);
        mob[mob.length - 1].mobType = 83;
    }

    const oldExplosion = b.explosion;
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
        dcLocal.send(dataView);

        oldExplosion(where, radius, color);
    }

    const oldPulse = b.pulse;
    b.pulse = (charge, angle = m.angle, where = m.pos) => {
        const dataView = new DataView(new ArrayBuffer(33));
        dataView.setUint8(0, protocol.bullet.pulse);
        dataView.setFloat64(1, charge);
        dataView.setFloat64(9, angle);
        dataView.setFloat64(17, where.x);
        dataView.setFloat64(25, where.y);
        dcLocal.send(dataView);

        oldPulse(charge, angle, where);
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
            if (!player2.paused) {
                if (!player2.isHolding && player2.input.field) {
                    fieldData[player2.fieldMode].do();
                    player2.grabPowerUp();
                }
                if (!player2.isHolding && (player2.input.field || player2.fieldMode == 1 || player2.fieldMode == 2 || player2.fieldMode == 3 || player2.fieldMode == 8 || player2.fieldMode == 9 || player2.fieldMode == 10)) fieldData[player2.fieldMode].drawField();
            }
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

            // for (const multiplayerLaser of b.multiplayerLasers) if (new Date().getTime() - multiplayerLaser.created.getTime() < 100) b.multiplayerLaser(multiplayerLaser.where, multiplayerLaser.whereEnd, multiplayerLaser.dmg, multiplayerLaser.reflections, multiplayerLaser.isThickBeam, multiplayerLaser.push);
        }})
        simulation.ephemera.push({ name: 'Broadcast', count: 0, do: () => {
            // player broadcast
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
                dcLocal.send(dataView);
            } else if (simulation.mouseInGame.x != oldM.mouseInGame.x || simulation.mouseInGame.y != oldM.mouseInGame.y) {
                const dataView = new DataView(new ArrayBuffer(17));
                dataView.setUint8(0, protocol.player.rotation);
                dataView.setFloat64(1, simulation.mouseInGame.x);
                dataView.setFloat64(9, simulation.mouseInGame.y);
                dcLocal.send(dataView);
            }
            if (m.fieldMode != oldM.fieldMode) {
                const dataView = new DataView(new ArrayBuffer(2));
                dataView.setUint8(0, protocol.player.setField);
                dataView.setUint8(1, m.fieldMode);
                dcLocal.send(dataView);
            }
            if (m.immuneCycle != oldM.immuneCycle) {
                const dataView = new DataView(new ArrayBuffer(5));
                dataView.setUint8(0, protocol.player.immuneCycleUpdate);
                dataView.setFloat32(1, m.immuneCycle);
                dcLocal.send(dataView);
            }
            if (m.health != oldM.health) {
                const dataView = new DataView(new ArrayBuffer(6));
                dataView.setUint8(0, protocol.player.healthUpdate);
                dataView.setFloat32(1, m.health);
                dataView.setUint8(5, 1); // TODO: player id
                dcLocal.send(dataView);
            }
            if (m.maxHealth != oldM.maxHealth) {
                const dataView = new DataView(ArrayBuffer(6));
                dataView.setUint8(0, protocol.player.maxHealthUpdate);
                dataView.setFloat32(1, m.maxHealth);
                dataView.setUint8(5, 1); // TODO: player id
                dcLocal.send(dataView);
            }
            if (m.energy != oldM.energy) {
                const dataView = new DataView(new ArrayBuffer(6));
                dataView.setUint8(0, protocol.player.energyUpdate);
                dataView.setFloat32(1, m.energy);
                dataView.setUint8(5, 1); // TODO: player id
                dcLocal.send(dataView);
            }
            if (m.maxEnergy != oldM.maxEnergy) {
                const dataView = new DataView(new ArrayBuffer(6));
                dataView.setUint8(0, protocol.player.maxEnergyUpdate);
                dataView.setFloat32(1, m.maxEnergy);
                dataView.setUint8(5, 1); // TODO: player id
                dcLocal.send(dataView);
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
                dcLocal.send(dataView);
            }
            if (m.crouch != oldM.crouch) {
                const dataView = new DataView(new ArrayBuffer(2));
                dataView.setUint8(0, protocol.player.toggleCrouch);
                dataView.setUint8(1, m.crouch ? 1 : 0);
                dcLocal.send(dataView);
            }
            if (m.isCloak != oldM.isCloak) {
                // toggle cloak
                const dataView = new DataView(new ArrayBuffer(2));
                dataView.setUint8(0, protocol.player.toggleCloak);
                dataView.setUint8(1, m.isCloak ? 1 : 0);
                dcLocal.send(dataView);
            }
            if (m.isHolding != oldM.isHolding || m.holdingTarget?.id != oldM.holdingTarget?.id) {
                const dataView = new DataView(new ArrayBuffer(5));
                dataView.setUint8(0, protocol.player.holdBlock);
                dataView.setUint8(1, m.isHolding ? 1 : 0);
                dataView.setUint16(2, m.holdingTarget?.id || -1);
                dataView.setUint8(4, 1); // TODO: player id
                dcLocal.send(dataView);
            }
            if (m.throwCharge != oldM.throwCharge) {
                const dataView = new DataView(new ArrayBuffer(7));
                dataView.setUint8(0, protocol.player.throwChargeUpdate);
                dataView.setFloat32(1, m.throwCharge);
                dataView.setUint8(5, 1); // TODO: player id
                dcLocal.send(dataView);
            }
            if (simulation.paused != oldM.paused) {
                const dataView = new DataView(new ArrayBuffer(2));
                dataView.setUint8(0, protocol.player.togglePause);
                dataView.setUint8(1, simulation.paused ? 1 : 0);
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
                yOff: m.yOff,
                paused: simulation.paused
            }

            // block update
            const blockChanges = [];
            for (const block of body) {
                let positionChanged = false;
                let verticesChanged = false;
                const oldBlock = oldBlocks.find(a => a.id == block.id);
                if (oldBlock != null) {
                    if (block.position.x != oldBlock.position.x || block.position.y != oldBlock.position.y || block.angle != oldBlock.angle) positionChanged = true;
                    if (block.vertices.length != oldBlock.vertices.length) verticesChanged = true;
                    else for (let i = 0; i < block.vertices.length; i++) if (block.vertices[i].x != oldBlock.vertices[i].x || block.vertices[i].y != oldBlock.vertices[i].y) verticesChanged = true;
                }
                if (oldBlock == null || positionChanged) {
                    const dataView = new DataView(new ArrayBuffer(43));
                    dataView.setUint8(0, protocol.block.positionUpdate)
                    dataView.setUint16(1, block.id);
                    dataView.setFloat64(3, block.position.x);
                    dataView.setFloat64(11, block.position.y);
                    dataView.setFloat64(19, block.angle);
                    dataView.setFloat64(27, block.velocity.x);
                    dataView.setFloat64(35, block.velocity.y);
                    dcLocal.send(dataView);
                }
                if (verticesChanged) {
                    const dataView = new DataView(new ArrayBuffer(3 + 16 * block.vertices.length));
                    dataView.setUint8(0, protocol.block.vertexUpdate);
                    dataView.setUint16(1, block.id);
                    let index = 3;
                    for (const vertex of block.vertices) {
                        dataView.setFloat64(index, vertex.x);
                        dataView.setFloat64(index + 8, vertex.y);
                        index += 16;
                    }
                    dcLocal.send(dataView);
                }
            }

            for (const oldBlock of oldBlocks) {
                if (!body.find(block => block.id == oldBlock.id)) {
                    const dataView = new DataView(new ArrayBuffer(3));
                    dataView.setUint8(0, protocol.block.delete);
                    dataView.setUint16(1, oldBlock.id);
                    dcLocal.send(dataView);
                }
            }
            
            oldBlocks.splice(0);
            for (const block of body) {
                vertices = [];
                for (const vertex of block.vertices) vertices.push({ x: vertex.x, y: vertex.y });
                oldBlocks.push({ id: block.id, position: { x: block.position.x, y: block.position.y }, angle: block.angle, vertices });
            }


            // powerup update
            for (const powerup of powerUp) {
                const oldPowerup = oldPowerups.find(a => a.id == powerup.id);
                if (oldPowerup == null || powerup.position.x != oldPowerup.position.x || powerup.position.y != oldPowerup.position.y || powerup.size != oldPowerup.size || powerup.collisionFilter.category != oldPowerup.collisionFilter.category || powerup.collisionFilter.mask != oldPowerup.collisionFilter.mask) {
                    const dataView = new DataView(new ArrayBuffer(43));
                    dataView.setUint8(0, protocol.powerup.update);
                    dataView.setUint16(1, powerup.id);
                    dataView.setFloat64(3, powerup.position.x);
                    dataView.setFloat64(11, powerup.position.y);
                    dataView.setFloat64(19, powerup.size);
                    dataView.setBigUint64(27, BigInt(powerup.collisionFilter.category));
                    dataView.setBigUint64(35, BigInt(powerup.collisionFilter.mask));
                    dcLocal.send(dataView);
                }
            }

            for (const oldPowerup of oldPowerups) {
                if (!powerUp.find(a => a.id == oldPowerup.id)) {
                    const dataView = new DataView(new ArrayBuffer(3));
                    dataView.setUint8(0, protocol.powerup.delete);
                    dataView.setUint16(1, oldPowerup.id);
                    dcLocal.send(dataView);
                }
            }

            oldPowerups.splice(0);
            for (const powerup of powerUp) oldPowerups.push({ id: powerup.id, position: { x: powerup.position.x, y: powerup.position.y }, size: powerup.size, collisionFilter: { category: powerup.collisionFilter.category, mask: powerup.collisionFilter.mask }});


            // mob update
            for (const newMob of mob) {
                let moved = false;
                let vertexChange = false;
                let colorChange = false;
                let propertyChange = false;
                const oldMob = oldMobs.find(a => a.id == newMob.id);
                if (oldMob != null) {
                    if (newMob.position.x != oldMob.position.x || newMob.position.y != oldMob.position.y || newMob.angle != oldMob.angle) moved = true;
                    if (newMob.vertices.length != oldMob.vertices.length) vertexChange = true;
                    else for (let j = 0; j < newMob.vertices.length; j++) if (newMob.vertices[j].x != oldMob.vertices[j].x || newMob.vertices[j].y != oldMob.vertices[j].y) vertexChange = true;
                    if (newMob.fill != oldMob.fill || newMob.alpha != oldMob.alpha || newMob.stroke != oldMob.stroke) colorChange = true;
                    if (newMob.isShielded != oldMob.isShielded || newMob.isUnblockable != oldMob.isUnblockable || newMob.showHealthBar != oldMob.showHealthBar || newMob.collisionFilter.category != oldMob.collisionFilter.category || newMob.collisionFilter.mask != oldMob.collisionFilter.mask || newMob.isBoss != oldMob.isBoss || newMob.isFinalBoss != oldMob.isFinalBoss || newMob.isInvulnerable != oldMob.isInvulnerable || newMob.isZombie != oldMob.isZombie || newMob.isGrouper != oldMob.isGrouper || newMob.isMobBullet != oldMob.isMobBullet || newMob.seePlayer.recall != oldMob.seePlayer.recall || newMob.health != oldMob.health || newMob.radius != oldMob.radius) propertyChange = true;
                }
                if (oldMob == null || moved) {
                    const dataView = new DataView(new ArrayBuffer(27));
                    dataView.setUint8(0, protocol.mob.positionUpdate);
                    dataView.setUint16(1, newMob.id);
                    dataView.setFloat64(3, newMob.position.x);
                    dataView.setFloat64(11, newMob.position.y);
                    dataView.setFloat64(19, newMob.angle);
                    dcLocal.send(dataView);
                }
                if (vertexChange) {
                    const dataView = new DataView(new ArrayBuffer(3 + 16 * newMob.vertices.length));
                    dataView.setUint8(0, protocol.mob.vertexUpdate);
                    dataView.setUint16(1, newMob.id);
                    let index = 3;
                    for (const vertex of newMob.vertices) {
                        dataView.setFloat64(index, vertex.x);
                        dataView.setFloat64(index + 8, vertex.y);
                        index += 16;
                    }
                    dcLocal.send(dataView);
                }
                if (colorChange) {
                    // mob color update
                    const color = new TextEncoder().encode(newMob.fill);
                    const stroke = new TextEncoder().encode(newMob.stroke);
                    const data = new Uint8Array(new ArrayBuffer(9 + color.length + stroke.length));
                    data.set(color, 4);
                    data.set(stroke, 9 + color.length);
                    const dataView = new DataView(data.buffer);
                    dataView.setUint8(0, protocol.mob.colorUpdate);
                    dataView.setUint16(1, newMob.id);
                    dataView.setUint8(3, color.length);
                    dataView.setFloat32(4 + color.length, newMob.alpha || 1);
                    dataView.setUint8(8 + color.length, stroke.length);
                    dcLocal.send(dataView);   
                }
                if (propertyChange) {
                    const dataView = new DataView(new ArrayBuffer(53));
                    dataView.setUint8(0, protocol.mob.propertyUpdate);
                    dataView.setUint16(1, newMob.id);
                    dataView.setUint8(3, newMob.isShielded ? 1 : 0);
                    dataView.setUint8(4, newMob.isUnblockable ? 1 : 0);
                    dataView.setUint8(5, newMob.showHealthBar ? 1 : 0);
                    dataView.setBigUint64(6, BigInt(newMob.collisionFilter.category));
                    dataView.setBigUint64(14, BigInt(newMob.collisionFilter.mask));
                    dataView.setUint8(22, newMob.isBoss ? 1 : 0);
                    dataView.setUint8(23, newMob.isFinalBoss ? 1 : 0);
                    dataView.setUint8(24, newMob.isInvulnerable ? 1 : 0);
                    dataView.setUint8(25, newMob.isZombie ? 1 : 0);
                    dataView.setUint8(26, newMob.isGrouper ? 1 : 0);
                    dataView.setUint8(27, newMob.isMobBullet ? 1 : 0);
                    dataView.setFloat64(28, newMob.seePlayer.recall);
                    dataView.setFloat64(36, newMob.health);
                    dataView.setFloat64(44, newMob.radius);
                    dataView.setUint8(52, newMob.seePlayer.yes ? 1 : 0);
                    dcLocal.send(dataView);
                }
            }

            for (const oldMob of oldMobs) {
                if (!mob.find(a => a.id == oldMob.id)) {
                    const dataView = new DataView(new ArrayBuffer(3));
                    dataView.setUint8(0, protocol.mob.delete);
                    dataView.setUint16(1, oldMob.id);
                    dcLocal.send(dataView);
                }
            }

            oldMobs.splice(0);
            for (const newMob of mob) {
                vertices = [];
                for (const vertex of newMob.vertices) vertices.push({ x: vertex.x, y: vertex.y });
                oldMobs.push({ id: newMob.id, position: { x: newMob.position.x, y: newMob.position.y }, angle: newMob.size, vertices, fill: newMob.fill, stroke: newMob.stroke, isShielded: newMob.isShielded, isUnblockable: newMob.isUnblockable, showHealthBar: newMob.showHealthBar, collisionFilter: { category: newMob.collisionFilter.category, mask: newMob.collisionFilter.mask }, isBoss: newMob.isBoss, isFinalBoss: newMob.isFinalBoss, isInvulnerable: newMob.isInvulnerable, isZombie: newMob.isZombie, isGrouper: newMob.isGrouper, isMobBullet: newMob.isMobBullet, seePlayer: { recall: newMob.seePlayer.recall }, health: newMob.health, radius: newMob.radius });
            };
        }})
    }
})();