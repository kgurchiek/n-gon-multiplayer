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
                player2.mouseInGame.x = data.getFloat32(1);
                player2.mouseInGame.y = data.getFloat32(5);
            }
            if (id == 1) {
                // movement
                player2.mouseInGame.x = data.getFloat32(1);
                player2.mouseInGame.y = data.getFloat32(6);
                player2.onGround = new Uint8Array(data.buffer)[5] == 1;
                player2.pos.x = data.getFloat32(10);
                player2.pos.y = data.getFloat32(14);
                player2.Vx = data.getFloat32(18);
                player2.Vy = data.getFloat32(22);
                player2.walk_cycle = data.getFloat32(26);
                player2.yOff = data.getFloat32(30);
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
                const textEncoder = new TextEncoder('utf-8');
                const data = new Uint8Array(new ArrayBuffer(3 + textEncoder.encode(Math.initialSeed).length));
                data[0] = 12;
                data[1] = simulation.difficultyMode;
                data[2] = textEncoder.encode(Math.initialSeed).length;
                data.set(textEncoder.encode(Math.initialSeed), 3);
                dcLocal.send(new DataView(data.buffer));
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

        ws = new WebSocket('wss://n-gon.cornbread2100.com');
        ws.onopen = async () => {
            console.log('connected');
            ws.send(`\x00${JSON.stringify(peerLocalOffer)}`);
        }
        let state = 0;
        ws.onmessage = async (message) => {
            console.log('message:', message.data)

            if (message.data[0] == '\x00') {
                if (state == 0) {
                    alert(`Join code: ${message.data.substring(1)}\nPress "ok" before entering it on another device.`);
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
            fieldMeterColor: '#0cf',
            fieldRange: 155
        },
        {
            // standing wave
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
            fieldRange: 185
        },
        {
            // perfect diamagnetism
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
            fieldRange: 180
        },
        {
            // negative mass
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
                    // player2.FxAir = 0.005
                    // const dist = Math.sqrt((player2.pos.x - m.pos.x) * (player2.pos.x - m.pos.x) + (player2.pos.y - m.pos.y) * (player2.pos.y - m.pos.y));
                    // if (dist < player2.fieldDrawRadius) {
                    //     if (player2.input.down) player.force.y -= 0.5 * player.mass * simulation.g;
                    //     else if (player2.input.up) player.force.y -= 1.45 * player.mass * simulation.g;
                    //     else player.force.y -= 1.07 * player.mass * simulation.g;
                    // }
                } else player2.fieldDrawRadius = 0;
            },
            fieldMeterColor: '#333',
            fieldRange: 155
        },
        {
            // molecular assembler
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
            fieldRange: 155
        },
        {
            // plasma torch
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
            fieldRange: 155
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
            fieldRange: 155
        },
        {
            // metamaterial cloaking
            drawField: () => {},
            fieldMeterColor: '#333',
            fieldRange: 155
        },
        {
            // pilot wave
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
            fieldRange: 155
        },
        {
            // wormhole
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
                        (tech.isWormholeMapIgnore || Matter.Query.ray(map, player2.pos, justPastMouse).length === 0) &&
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
                    (tech.isWormholeMapIgnore || Matter.Query.ray(map, player2.pos, justPastMouse).length === 0) &&
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
            fieldRange: 0
        },
        {
            // grappling hook
            drawField: () => {
                // console.log(player2.input.field, player2.fieldCDcycle, m.cycle)
                if (player2.input.field && player2.fieldCDcycle < m.cycle) {
                    b.multiplayerGrapple({ x: player2.pos.x + 40 * Math.cos(player2.angle), y: player2.pos.y + 40 * Math.sin(player2.angle) }, player2.angle, player2);
                    if (player2.fieldCDcycle < m.cycle + 20) player2.fieldCDcycle = m.cycle + 20;
                }
            },
            fieldMeterColor: '#0cf',
            fieldRange: 155
        }
    ]

    let player2 = {
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
        input: { up: false, down: false, left: false, right: false, field: false },
        isCloak: false,
        knee: { x: 0, y: 0, x2: 0, y2: 0 },
        lastFieldPosition: { x: 0, y: 0 },
        legLength1: 55,
        legLength2: 45,
        maxEnergy: 1,
        maxHealth: 1,
        mouseInGame: { x: 0, y: 0 },
        onGround: false,
        pos: { x: 0, y: 0 },
        radius: 30,
        stepSize: 0,
        Vx: 0,
        Vy: 0,
        walk_cycle: 0,
        yOff: 70
    }
    player2.fillColor = `hsl(${player2.color.hue},${player2.color.sat}%,${player2.color.light}%)`;
    player2.fillColorDark = `hsl(${player2.color.hue},${player2.color.sat}%,${player2.color.light - 25}%)`;
    let grd = ctx.createLinearGradient(-30, 0, 30, 0);
    grd.addColorStop(0, player2.fillColorDark);
    grd.addColorStop(1, player2.fillColor);
    player2.bodyGradient = grd;

    let oldM = {
        crouch: m.crouch,
        energy: m.energy,
        fieldMode: m.fieldMode,
        health: m.health,
        input: { up: input.up, down: input.down, left: input.left, right: input.right, field: input.field },
        isCloak: m.isCloak,
        maxEnergy: m.maxEnergy,
        maxHealth: m.maxHealth,
        mouseInGame: { x: simulation.mouseInGame.x, y: simulation.mouseInGame.y },
        onGround: false,
        pos: { x: 0, y: 0 },
        Vx: 0,
        Vy: 0,
        walk_cycle: 0,
        yOff: 70
    }
    const oldStartGame = simulation.startGame;
    simulation.startGame = () => {
        oldStartGame();
        Math.random = Math.seededRandom;

        b.multiplayerGrapple = (where, angle, otherPlayer) => {
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
                        const where = { x: otherPlayer.pos.x + 30 * Math.cos(otherPlayer.angle), y: otherPlayer.pos.y + 30 * Math.sin(otherPlayer.angle) }
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
                        if (otherPlayer.fieldCDcycle < m.cycle + 40) otherPlayer.fieldCDcycle = m.cycle + 40  //extra long cooldown on hitting mobs
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
                        if (this.caughtPowerUp && !simulation.isChoosing && (this.caughtPowerUp.name !== "heal" || otherPlayer.health !== otherPlayer.maxHealth /*|| tech.isOverHeal*/)) {
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
                        const momentum = Vector.mult(Vector.sub(this.position, otherPlayer.pos), mag * (otherPlayer.crouch ? 0.0001 : 0.0002))
                    },
                    returnToPlayer() {
                        if (otherPlayer.fieldCDcycle < m.cycle + 5) otherPlayer.fieldCDcycle = m.cycle + 5
                        if (Vector.magnitude(Vector.sub(this.position, otherPlayer.pos)) < returnRadius) { //near player
                            this.endCycle = 0;
                            //recoil on catching grapple
                            // const momentum = Vector.mult(Vector.sub(this.velocity, player.velocity), (otherPlayer.crouch ? 0.0001 : 0.0002))
                            if (this.pickUpTarget) {
                                // if (tech.isReel && this.blockDist > 150) {
                                //     // console.log(0.0003 * Math.min(this.blockDist, 1000))
                                //     otherPlayer.energy += 0.0009 * Math.min(this.blockDist, 800) //max 0.352 energy
                                //     simulation.drawList.push({ //add dmg to draw queue
                                //         x: otherPlayer.pos.x,
                                //         y: otherPlayer.pos.y,
                                //         radius: 10,
                                //         color: otherPlayer.fieldMeterColor,
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
                            if (otherPlayer.energy > this.drain) otherPlayer.energy -= this.drain
                            const sub = Vector.sub(this.position, otherPlayer.pos)
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
                                    if (powerUp[i].name !== "heal" || otherPlayer.health !== otherPlayer.maxHealth /*|| tech.isOverHeal*/) {
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
                        if (otherPlayer.fieldCDcycle < m.cycle + 5) otherPlayer.fieldCDcycle = m.cycle + 5
                        if (otherPlayer.input.field) {
                            this.grabPowerUp()
                        } else {
                            this.retract()
                        }
                        //grappling hook
                        if (otherPlayer.input.field && Matter.Query.collides(this, map).length) {
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
                                    if (otherPlayer.fieldCDcycle < m.cycle + 5) otherPlayer.fieldCDcycle = m.cycle + 5
                                    this.grabPowerUp()
    
                                    //between player nose and the grapple
                                    const sub = Vector.sub(this.vertices[0], { x: otherPlayer.pos.x + 30 * Math.cos(otherPlayer.angle), y: otherPlayer.pos.y + 30 * Math.sin(otherPlayer.angle) })
                                    let dist = Vector.magnitude(sub)
                                    if (otherPlayer.input.field) {
                                        this.endCycle = simulation.cycle + 10
                                        if (input.down) { //down
                                            this.isSlowPull = true
                                            dist = 0
                                        } else if (input.up) {
                                            this.isSlowPull = false
                                        }
                                        if (otherPlayer.energy < this.drain) this.isSlowPull = true
    
                                        // pulling friction that allowed a slight swinging, but has high linear pull at short dist
                                        const drag = 1 - 30 / Math.min(Math.max(100, dist), 700) - 0.1 * (player.speed > 66)
                                        // console.log(player.speed)
                                        const pullScale = 0.0004
                                        const pull = Vector.mult(Vector.normalise(sub), pullScale * Math.min(Math.max(15, dist), this.isSlowPull ? 70 : 200))
                                        if (dist > 500) {
                                            otherPlayer.energy -= this.drain
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

            if (player2.input.field || player2.fieldMode == 1 || player2.fieldMode == 2 || player2.fieldMode == 3 || player2.fieldMode == 8 || player2.fieldMode == 9 || player2.fieldMode == 10) fieldData[player2.fieldMode].drawField();
            player2.drawHealthbar();
            player2.drawRegenEnergy();

            if (player2.isCloak) {
                ctx.beginPath();
                ctx.arc(player2.pos.x, player2.pos.y, 35, 0, 2 * Math.PI);
                ctx.strokeStyle = "rgba(255,255,255,0.5)";
                ctx.lineWidth = 6
                ctx.stroke();
            }
        }})
        simulation.ephemera.push({ name: 'Broadcast', count: 0, do: () => {
            if (m.onGround != oldM.onGround || m.pos.x != oldM.pos.x || m.pos.y != oldM.pos.y || m.Vx != oldM.Vx || m.Vy != oldM.Vy || m.walk_cycle != oldM.walk_cycle || m.yOff != oldM.yOff) {
                // movement
                const data = new Uint8Array(new ArrayBuffer(34));
                data[0] = 1;
                data[5] = m.onGround ? 1 : 0;
                const dataView = new DataView(data.buffer);
                dataView.setFloat32(1, simulation.mouseInGame.x);
                dataView.setFloat32(6, simulation.mouseInGame.y);
                dataView.setFloat32(10, m.pos.x);
                dataView.setFloat32(14, m.pos.y);
                dataView.setFloat32(18, m.Vx);
                dataView.setFloat32(22, m.Vy);
                dataView.setFloat32(26, m.walk_cycle);
                dataView.setFloat32(30, m.yOff);
                dcLocal.send(dataView);
            } else if (simulation.mouseInGame.x != oldM.mouseInGame.x || simulation.mouseInGame.y != oldM.mouseInGame.y) {
                // rotation
                const data = new Uint8Array(new ArrayBuffer(9));
                data[0] = 0;
                const dataView = new DataView(data.buffer);
                dataView.setFloat32(1, simulation.mouseInGame.x);
                dataView.setFloat32(5, simulation.mouseInGame.y);
                dcLocal.send(dataView);
            }
            if (m.fieldMode != oldM.fieldMode) {
                // set field
                const textEncoder = new TextEncoder('utf-8');
                const data = new Uint8Array(new ArrayBuffer(2));
                data[0] = 2;
                data[1] = m.fieldMode;
                dcLocal.send(new DataView(data.buffer));
            }
            if (m.health != oldM.health) {
                // health update
                const data = new Uint8Array(new ArrayBuffer(5));
                data[0] = 4;
                const dataView = new DataView(data.buffer);
                dataView.setFloat32(1, m.health);
                dcLocal.send(dataView);
            }
            if (m.maxHealth != oldM.maxHealth) {
                // max health update
                const data = new Uint8Array(new ArrayBuffer(5));
                data[0] = 5;
                const dataView = new DataView(data.buffer);
                dataView.setFloat32(1, m.maxHealth);
                dcLocal.send(dataView);
            }
            if (m.energy != oldM.energy) {
                // energy update
                const data = new Uint8Array(new ArrayBuffer(5));
                data[0] = 6;
                const dataView = new DataView(data.buffer);
                dataView.setFloat32(1, m.energy);
                dcLocal.send(dataView);
            }
            if (m.maxEnergy != oldM.maxEnergy) {
                // max energy update
                const data = new Uint8Array(new ArrayBuffer(5))
                data[0] = 7;
                const dataView = new DataView(data.buffer);
                dataView.setFloat32(1, m.maxEnergy);
                dcLocal.send(dataView);
            }
            if (input.up != oldM.input.up || input.down != oldM.input.down || input.left != oldM.input.left || input.right != oldM.input.right || input.field != oldM.input.field) {
                // inputs
                const data = new Uint8Array(new ArrayBuffer(6));
                data[0] = 8;
                data[1] = input.up ? 1 : 0;
                data[2] = input.down ? 1 : 0;
                data[3] = input.left ? 1 : 0;
                data[4] = input.right ? 1 : 0;
                data[5] = input.field ? 1 : 0;
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
            
            oldM = {
                crouch: m.crouch,
                energy: m.energy,
                fieldMode: m.fieldMode,
                health: m.health,
                input: { up: input.up, down: input.down, left: input.left, right: input.right, field: input.field},
                isCloak: m.isCloak,
                maxEnergy: m.maxEnergy,
                maxHealth: m.maxHealth,
                mouseInGame: { x: simulation.mouseInGame.x, y: simulation.mouseInGame.y },
                onGround: false,
                pos: { x: 0, y: 0 },
                Vx: 0,
                Vy: 0,
                walk_cycle: 0,
                yOff: 70
            }
        }})
    }
})();