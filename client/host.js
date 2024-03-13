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
                player2.angle = data.getFloat32(1);
            }
            if (id == 1) {
                // movement
                player2.angle = data.getFloat32(1);
                player2.onGround = new Uint8Array(data.buffer)[5] == 1;
                player2.pos.x = data.getFloat32(6);
                player2.pos.y = data.getFloat32(10);
                player2.Vx = data.getFloat32(14);
                player2.Vy = data.getFloat32(18);
                player2.walk_cycle = data.getFloat32(22);
                player2.yOff = data.getFloat32(26);
            }
            if (id == 2) {
                // set field
                player2.fieldMode = new Uint8Array(data.buffer)[1];
                player2.fieldMeterColor = fieldData[player2.fieldMode].fieldMeterColor;
                player2.fieldRange = fieldData[player2.fieldMode].fieldRange;
                player2.fieldPosition = { x: player2.pos.x, y: player2.pos.y };
                player2.fieldAngle = player2.angle;
            }
            if (id == 3) {
                // toggle field
                player2.fieldOn = new Uint8Array(data.buffer)[1] == 1;
            }
            if (id == 4) {
                // energy update
                player2.energy = data.getFloat32(1);
            }
            if (id == 5) {
                // max energy update
                player2.maxEnergy = data.getFloat32(1);
            }
            if (id == 6) {
                // inputs (up/down)
                player2.input.up = new Uint8Array(data.buffer)[1] == 1;
                player2.input.down = new Uint8Array(data.buffer)[2] == 1;
                player2.input.left = new Uint8Array(data.buffer)[3] == 1;
                player2.input.right = new Uint8Array(data.buffer)[4] == 1;
            }
            if (id == 7) {
                // toggle crouch
                player2.crouch = new Uint8Array(data.buffer)[1] == 1;
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
                if (m.holdingTarget) {
                    ctx.fillStyle = "rgba(110,170,200," + (player2.energy * (0.05 + 0.05 * Math.random())) + ")";
                    ctx.strokeStyle = "rgba(110, 200, 235, " + (0.3 + 0.08 * Math.random()) + ")" //"#9bd" //"rgba(110, 200, 235, " + (0.5 + 0.1 * Math.random()) + ")"
                } else {
                    ctx.fillStyle = "rgba(110,170,200," + (0.02 + player2.energy * (0.15 + 0.15 * Math.random())) + ")";
                    ctx.strokeStyle = "rgba(110, 200, 235, " + (0.6 + 0.2 * Math.random()) + ")" //"#9bd" //"rgba(110, 200, 235, " + (0.5 + 0.1 * Math.random()) + ")"
                }
                // const off = 2 * Math.cos(simulation.cycle * 0.1)
                const range = player2.fieldRange;
                ctx.beginPath();
                ctx.arc(player2.pos.x, player2.pos.y, range, player2.angle - Math.PI * m.fieldArc, player2.angle + Math.PI * m.fieldArc, false);
                ctx.lineWidth = 2;
                ctx.stroke();
                let eye = 13;
                let aMag = 0.75 * Math.PI * m.fieldArc
                let a = player2.angle + aMag
                let cp1x = player2.pos.x + 0.6 * range * Math.cos(a)
                let cp1y = player2.pos.y + 0.6 * range * Math.sin(a)
                ctx.quadraticCurveTo(cp1x, cp1y, player2.pos.x + eye * Math.cos(player2.angle), player2.pos.y + eye * Math.sin(player2.angle))
                a = player2.angle - aMag
                cp1x = player2.pos.x + 0.6 * range * Math.cos(a)
                cp1y = player2.pos.y + 0.6 * range * Math.sin(a)
                ctx.quadraticCurveTo(cp1x, cp1y, player2.pos.x + 1 * range * Math.cos(player2.angle - Math.PI * m.fieldArc), player2.pos.y + 1 * range * Math.sin(player2.angle - Math.PI * m.fieldArc))
                ctx.fill();
        
                //draw random lines in field for cool effect
                let offAngle = player2.angle + 1.7 * Math.PI * m.fieldArc * (Math.random() - 0.5);
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
                if (player2.fieldOn) {
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
                if (player2.fieldOn) {
                    const mag = player2.input.down ? 0.7 : player2.input.up ? 1.38 : 1.06; 
                    player2.FxAir = 0.005
                    const dist = Math.sqrt((player2.pos.x - m.pos.x) * (player2.pos.x - m.pos.x) + (player2.pos.y - m.pos.y) * (player2.pos.y - m.pos.y));
                    if (dist < player2.fieldDrawRadius) {
                        m.Vy -= m.mass * (simulation.g * mag); //add a bit more then standard gravity
                        if (input.left) { //blocks move horizontally with the same force as the player
                            m.Vx -= player2.FxAir * m.mass / 10; // move player   left / a
                        } else if (input.right) {
                            m.Vx += player2.FxAir * m.mass / 10; //move player  right / d
                        }
                    }
                }
            },
            fieldMeterColor: '#333',
            fieldRange: 155
        },
        {
            // molecular assembler
            drawField: () => {
                if (m.holdingTarget) {
                    ctx.fillStyle = "rgba(110,170,200," + (player2.energy * (0.05 + 0.05 * Math.random())) + ")";
                    ctx.strokeStyle = "rgba(110, 200, 235, " + (0.3 + 0.08 * Math.random()) + ")" //"#9bd" //"rgba(110, 200, 235, " + (0.5 + 0.1 * Math.random()) + ")"
                } else {
                    ctx.fillStyle = "rgba(110,170,200," + (0.02 + player2.energy * (0.15 + 0.15 * Math.random())) + ")";
                    ctx.strokeStyle = "rgba(110, 200, 235, " + (0.6 + 0.2 * Math.random()) + ")" //"#9bd" //"rgba(110, 200, 235, " + (0.5 + 0.1 * Math.random()) + ")"
                }
                // const off = 2 * Math.cos(simulation.cycle * 0.1)
                const range = player2.fieldRange;
                ctx.beginPath();
                ctx.arc(player2.pos.x, player2.pos.y, range, player2.angle - Math.PI * m.fieldArc, player2.angle + Math.PI * m.fieldArc, false);
                ctx.lineWidth = 2;
                ctx.stroke();
                let eye = 13;
                let aMag = 0.75 * Math.PI * m.fieldArc
                let a = player2.angle + aMag
                let cp1x = player2.pos.x + 0.6 * range * Math.cos(a)
                let cp1y = player2.pos.y + 0.6 * range * Math.sin(a)
                ctx.quadraticCurveTo(cp1x, cp1y, player2.pos.x + eye * Math.cos(player2.angle), player2.pos.y + eye * Math.sin(player2.angle))
                a = player2.angle - aMag
                cp1x = player2.pos.x + 0.6 * range * Math.cos(a)
                cp1y = player2.pos.y + 0.6 * range * Math.sin(a)
                ctx.quadraticCurveTo(cp1x, cp1y, player2.pos.x + 1 * range * Math.cos(player2.angle - Math.PI * m.fieldArc), player2.pos.y + 1 * range * Math.sin(player2.angle - Math.PI * m.fieldArc))
                ctx.fill();
        
                //draw random lines in field for cool effect
                let offAngle = player2.angle + 1.7 * Math.PI * m.fieldArc * (Math.random() - 0.5);
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
            drawField: () => {},
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
            drawField: () => {},
            fieldMeterColor: '#333',
            fieldRange: 155
        },
        {
            // wormhole
            drawField: () => {},
            fieldMeterColor: '#bbf',
            fieldRange: 155
        },
        {
            // grappling hook
            drawField: () => {},
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
        drawLeg: (stroke) => {
            if (player2.angle > -Math.PI / 2 && player2.angle < Math.PI / 2) {
                player2.flipLegs = 1;
            } else {
                player2.flipLegs = -1;
            }
            ctx.save();
            ctx.scale(player2.flipLegs, 1); //leg lines
            ctx.beginPath();
            ctx.moveTo(player2.hip.x, player2.hip.y);
            ctx.lineTo(player2.knee.x, player2.knee.y);
            ctx.lineTo(player2.foot.x, player2.foot.y);
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 6;
            ctx.stroke();

            //toe lines
            ctx.beginPath();
            ctx.moveTo(player2.foot.x, player2.foot.y);
            ctx.lineTo(player2.foot.x - 14, player2.foot.y + 5);
            ctx.moveTo(player2.foot.x, player2.foot.y);
            ctx.lineTo(player2.foot.x + 14, player2.foot.y + 5);
            ctx.lineWidth = 4;
            ctx.stroke();

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
            } else if (player2.energy > player2.maxEnergy + 0.05 || player2.fieldOn) {
                ctx.fillStyle = bgColor;
                const xOff = player2.pos.x - player2.radius * player2.energy;
                const yOff = player2.pos.y - 50;
                ctx.fillStyle = player2.fieldMeterColor;
                ctx.fillRect(xOff, yOff, range * player2.energy, 10);
            }
        },
        energy: 1,
        fieldAngle: 0,
        fieldDrawRadius: 0,
        fieldMeterColor: '#0cf',
        fieldMode: 0,
        fieldOn: false,
        fieldPosition: { x: 0, y: 0 },
        fieldRange: 155,
        fillColor: null,
        fillColorDark: null,
        flipLegs: -1,
        foot: { x: 0, y: 0 },
        FxAir: 0.016,
        height: 42,
        hip: { x: 12, y: 24 },
        immuneCycle: 0,
        input: { up: false, down: false, left: false, right: false },
        knee: { x: 0, y: 0, x2: 0, y2: 0 },
        legLength1: 55,
        legLength2: 45,
        maxEnergy: 1,
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
        angle: m.angle,
        crouch: m.crouch,
        energy: m.energy,
        fieldMode: m.fieldMode,
        fieldOn: input.field,
        input: { up: input.up, down: input.down },
        maxEnergy: m.maxEnergy,
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
        simulation.ephemera.push({ name: 'Player2', count: 0, do: () => {
            ctx.fillStyle = player2.fillColor;
            ctx.save();
            ctx.globalAlpha = (player2.immuneCycle < m.cycle) ? 1 : 0.5;
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

            if (player2.fieldOn || player2.fieldMode == 1 || player2.fieldMode == 2 || player2.fieldMode == 3) fieldData[player2.fieldMode].drawField();
            player2.drawRegenEnergy();
        }})
        simulation.ephemera.push({ name: 'Broadcast', count: 0, do: () => {
            if (m.onGround != oldM.onGround || m.pos.x != oldM.pos.x || m.pos.y != oldM.pos.y || m.Vx != oldM.Vx || m.Vy != oldM.Vy || m.walk_cycle != oldM.walk_cycle || m.yOff != oldM.yOff) {
                // movement
                const data = new Uint8Array(new ArrayBuffer(30));
                data[0] = 1;
                data[5] = m.onGround ? 1 : 0;
                const dataView = new DataView(data.buffer);
                dataView.setFloat32(1, m.angle);
                dataView.setFloat32(6, m.pos.x);
                dataView.setFloat32(10, m.pos.y);
                dataView.setFloat32(14, m.Vx);
                dataView.setFloat32(18, m.Vy);
                dataView.setFloat32(22, m.walk_cycle);
                dataView.setFloat32(26, m.yOff);
                dcLocal.send(dataView);
            } else if (m.angle != oldM.angle) {
                // rotation
                const data = new Uint8Array(new ArrayBuffer(5));
                data[0] = 0;
                const dataView = new DataView(data.buffer);
                dataView.setFloat32(1, m.angle);
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
            if (input.field != oldM.fieldOn) {
                // toggle field
                const data = new Uint8Array(new ArrayBuffer(2));
                data[0] = 3;
                data[1] = input.field ? 1 : 0;
                dcLocal.send(new DataView(data.buffer));
            }
            if (m.energy != oldM.energy) {
                // energy update
                const data = new Uint8Array(new ArrayBuffer(5));
                data[0] = 4;
                const dataView = new DataView(data.buffer);
                dataView.setFloat32(1, m.energy);
                dcLocal.send(dataView);
            }
            if (m.maxEnergy != oldM.maxEnergy) {
                // max energy update
                const data = new Uint8Array(new ArrayBuffer(5))
                data[0] = 5;
                const dataView = new DataView(data.buffer);
                dataView.setFloat32(1, m.maxEnergy);
                dcLocal.send(dataView);
            }
            if (input.up != oldM.input.up || input.down != oldM.input.down) {
                // inputs (up/down)
                const data = new Uint8Array(new ArrayBuffer(3));
                data[0] = 6;
                data[1] = input.up ? 1 : 0;
                data[2] = input.down ? 1 : 0;
                data[3] = input.left ? 1 : 0;
                data[4] = input.right ? 1 : 0;
                dcLocal.send(new DataView(data.buffer));
            }
            if (m.crouch != oldM.crouch) {
                // toggle crouch
                const data = new Uint8Array(new ArrayBuffer(2));
                data[0] = 7;
                data[1] = m.crouch ? 1 : 0;
                dcLocal.send(new DataView(data.buffer));
            }
            
            oldM = {
                angle: m.angle,
                crouch: m.crouch,
                energy: m.energy,
                fieldMode: m.fieldMode,
                fieldOn: input.field,
                input: { up: input.up, down: input.down },
                maxEnergy: m.maxEnergy,
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