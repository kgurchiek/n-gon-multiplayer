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

        peerRemote.onconnectionstatechange = function(e) {
            console.log('peerRemote', 'onconnectionstatechange', e);
        };
        peerRemote.ondatachannel = function(e) {
            // peerLocal started a data channel, so connect to it here
            console.log('peerRemote', 'ondatachannel', e);
            window.dcRemote = e.channel;
            window.dcRemote.onopen = function(e) {
                console.log('dcRemote', 'onopen', e);
                console.log('dcRemote.send("message") to send from remote');
            };
            window.dcRemote.onmessage = async (message) => {
                // console.log('dcRemote', 'onmessage', message.data);
                const data = new DataView(await message.data.arrayBuffer());
                const id = new Uint8Array(data.buffer)[0];
                if (id == 0) {
                    // rotation
                    player1.angle = data.getFloat32(1);
                }
                if (id == 1) {
                    // movement
                    player1.angle = data.getFloat32(1);
                    player1.onGround = new Uint8Array(data.buffer)[5] == 1;
                    player1.pos.x = data.getFloat32(6);
                    player1.pos.y = data.getFloat32(10);
                    player1.Vx = data.getFloat32(14);
                    player1.Vy = data.getFloat32(18);
                    player1.walk_cycle = data.getFloat32(22);
                    player1.yOff = data.getFloat32(26);
                }
                if (id == 2) {
                    // set field
                    player1.fieldMode = new Uint8Array(data.buffer)[1];
                    player1.fieldMeterColor = fieldData[player1.fieldMode].fieldMeterColor;
                    player1.fieldRange = fieldData[player1.fieldMode].fieldRange;
                }
                if (id == 3) {
                    // toggle field
                    player1.fieldOn = new Uint8Array(data.buffer)[1] == 1;
                }
                if (id == 4) {
                    // energy update
                    player1.energy = data.getFloat32(1);
                }
                if (id == 5) {
                    // max energy update
                    player1.maxEnergy = data.getFloat32(1);
                }
            };
            window.dcRemote.onerror = function(e) {
                console.error('dcRemote', 'onerror', e);
            };
            window.dcRemote.onclose = function(e) {
                console.log('dcRemote', 'onclose', e);
            };

        };
        peerRemote.onsignalingstatechange = function(e) {
            console.log('peerRemote', 'onsignalingstatechange', peerRemote.signalingState);
            if (peerRemote.iceGatheringState == 'complete') ws.close();
        };
        peerRemote.onicegatheringstatechange = function(e) {
            console.log('peerRemote', 'onicegatheringstatechange', peerRemote.iceGatheringState);
        };
        peerRemote.onicecandidate = function(e){
            //Share ICE candidates with peerLocal
            console.log('peerRemote', 'onicecandidate', e);
            if (e.candidate != null) ws.send(`\x01${JSON.stringify(e.candidate)}`);
        };
        peerRemote.onnegotiationneeded = function(e) {
            console.log('peerRemote', 'onnegotiationneeded', e);
        };

        ws = new WebSocket('wss://n-gon.cornbread2100.com');
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
            console.log('disconnected');
            resolve();
        }
    })

    const fieldData = [
        {
            // field emitter
            drawField: () => {
                if (m.holdingTarget) {
                    ctx.fillStyle = "rgba(110,170,200," + (player1.energy * (0.05 + 0.05 * Math.random())) + ")";
                    ctx.strokeStyle = "rgba(110, 200, 235, " + (0.3 + 0.08 * Math.random()) + ")" //"#9bd" //"rgba(110, 200, 235, " + (0.5 + 0.1 * Math.random()) + ")"
                } else {
                    ctx.fillStyle = "rgba(110,170,200," + (0.02 + player1.energy * (0.15 + 0.15 * Math.random())) + ")";
                    ctx.strokeStyle = "rgba(110, 200, 235, " + (0.6 + 0.2 * Math.random()) + ")" //"#9bd" //"rgba(110, 200, 235, " + (0.5 + 0.1 * Math.random()) + ")"
                }
                // const off = 2 * Math.cos(simulation.cycle * 0.1)
                const range = m.fieldRange;
                ctx.beginPath();
                ctx.arc(player1.pos.x, player1.pos.y, range, player1.angle - Math.PI * m.fieldArc, player1.angle + Math.PI * m.fieldArc, false);
                ctx.lineWidth = 2;
                ctx.stroke();
                let eye = 13;
                let aMag = 0.75 * Math.PI * m.fieldArc
                let a = player1.angle + aMag
                let cp1x = player1.pos.x + 0.6 * range * Math.cos(a)
                let cp1y = player1.pos.y + 0.6 * range * Math.sin(a)
                ctx.quadraticCurveTo(cp1x, cp1y, player1.pos.x + eye * Math.cos(player1.angle), player1.pos.y + eye * Math.sin(player1.angle))
                a = player1.angle - aMag
                cp1x = player1.pos.x + 0.6 * range * Math.cos(a)
                cp1y = player1.pos.y + 0.6 * range * Math.sin(a)
                ctx.quadraticCurveTo(cp1x, cp1y, player1.pos.x + 1 * range * Math.cos(player1.angle - Math.PI * m.fieldArc), player1.pos.y + 1 * range * Math.sin(player1.angle - Math.PI * m.fieldArc))
                ctx.fill();
        
                //draw random lines in field for cool effect
                let offAngle = player1.angle + 1.7 * Math.PI * m.fieldArc * (Math.random() - 0.5);
                ctx.beginPath();
                eye = 15;
                ctx.moveTo(player1.pos.x + eye * Math.cos(player1.angle), player1.pos.y + eye * Math.sin(player1.angle));
                ctx.lineTo(player1.pos.x + range * Math.cos(offAngle), player1.pos.y + range * Math.sin(offAngle));
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
            fieldRange: 185
        },
        {
            // perfect diamagnetism
            drawField: () => {
                const wave = Math.sin(m.cycle * 0.022);
                player1.fieldRange = 180 + 12 * wave; // TODO: changes with Miessner Effect tech
                player1.fieldArc = 0.35 + 0.045 * wave; // TODO: changes with Miessner Effect tech
                if (player1.fieldOn) {
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
            fieldRange: 180
        },
        {
            // negative mass
            drawField: () => {},
            fieldMeterColor: '#333',
            fieldRange: 100
        },
        {
            // molecular assembler
            drawField: () => {},
            fieldMeterColor: '#ff0',
            fieldRange: 100
        },
        {
            // plasma torch
            drawField: () => {},
            fieldMeterColor: '#f0f',
            fieldRange: 100
        },
        {
            // time dilation
            drawField: () => {},
            fieldMeterColor: '#3fe',
            fieldRange: 100
        },
        {
            // metamaterial cloaking
            drawField: () => {},
            fieldMeterColor: '#333',
            fieldRange: 100
        },
        {
            // pilot wave
            drawField: () => {},
            fieldMeterColor: '#333',
            fieldRange: 100
        },
        {
            // wormhole
            drawField: () => {},
            fieldMeterColor: '#bbf',
            fieldRange: 100
        },
        {
            // grappling hook
            drawField: () => {},
            fieldMeterColor: '#0cf',
            fieldRange: 100
        }
    ]

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
        drawLeg: (stroke) => {
            if (player1.angle > -Math.PI / 2 && player1.angle < Math.PI / 2) {
                player1.flipLegs = 1;
            } else {
                player1.flipLegs = -1;
            }
            ctx.save();
            ctx.scale(player1.flipLegs, 1); //leg lines
            ctx.beginPath();
            ctx.moveTo(player1.hip.x, player1.hip.y);
            ctx.lineTo(player1.knee.x, player1.knee.y);
            ctx.lineTo(player1.foot.x, player1.foot.y);
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 6;
            ctx.stroke();

            //toe lines
            ctx.beginPath();
            ctx.moveTo(player1.foot.x, player1.foot.y);
            ctx.lineTo(player1.foot.x - 14, player1.foot.y + 5);
            ctx.moveTo(player1.foot.x, player1.foot.y);
            ctx.lineTo(player1.foot.x + 14, player1.foot.y + 5);
            ctx.lineWidth = 4;
            ctx.stroke();

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
            } else if (player1.energy > player1.maxEnergy + 0.05 || player1.fieldOn) {
                ctx.fillStyle = bgColor;
                const xOff = player1.pos.x - player1.radius * player1.energy;
                const yOff = player1.pos.y - 50;
                ctx.fillStyle = player1.fieldMeterColor;
                ctx.fillRect(xOff, yOff, range * player1.energy, 10);
            }
        },
        energy: 1,
        fieldAngle: 0,
        fieldMeterColor: '#0cf',
        fieldMode: 0,
        fieldOn: false,
        fieldPosition: { x: 0, y: 0 },
        fillColor: null,
        fillColorDark: null,
        flipLegs: -1,
        foot: { x: 0, y: 0 },
        height: 42,
        hip: { x: 12, y: 24 },
        immuneCycle: 0,
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
    player1.fillColor = `hsl(${player1.color.hue},${player1.color.sat}%,${player1.color.light}%)`;
    player1.fillColorDark = `hsl(${player1.color.hue},${player1.color.sat}%,${player1.color.light - 25}%)`;
    let grd = ctx.createLinearGradient(-30, 0, 30, 0);
    grd.addColorStop(0, player1.fillColorDark);
    grd.addColorStop(1, player1.fillColor);
    player1.bodyGradient = grd;

    let oldM = {
        angle: m.angle,
        energy: m.energy,
        fieldMode: m.fieldMode,
        fieldOn: input.field,
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
        simulation.ephemera.push({ name: 'player1', count: 0, do: () => {
            ctx.fillStyle = player1.fillColor;
            ctx.save();
            ctx.globalAlpha = (player1.immuneCycle < m.cycle) ? 1 : 0.5;
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

            if (player1.fieldOn || player1.fieldMode == 1 || player1.fieldMode == 2) fieldData[player1.fieldMode].drawField();
            player1.drawRegenEnergy();
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
                dcRemote.send(dataView);
            } else if (m.angle != oldM.angle) {
                // rotation
                const data = new Uint8Array(new ArrayBuffer(5));
                data[0] = 0;
                const dataView = new DataView(data.buffer);
                dataView.setFloat32(1, m.angle);
                dcRemote.send(dataView);
            }
            if (m.fieldMode != oldM.fieldMode) {
                // set field
                const textEncoder = new TextEncoder('utf-8');
                const data = new Uint8Array(new ArrayBuffer(2));
                data[0] = 2;
                data[1] = m.fieldMode;
                dcRemote.send(new DataView(data.buffer));
            }
            if (input.field != oldM.fieldOn) {
                // toggle field
                const data = new Uint8Array(new ArrayBuffer(2));
                data[0] = 3;
                data[1] = input.field ? 1 : 0;
                dcRemote.send(new DataView(data.buffer));
            }
            if (m.energy != oldM.energy) {
                // energy update
                const data = new Uint8Array(new ArrayBuffer(5));
                data[0] = 4;
                const dataView = new DataView(data.buffer);
                dataView.setFloat32(1, m.energy);
                dcRemote.send(dataView);
            }
            if (m.maxEnergy != oldM.maxEnergy) {
                // max energy update
                const data = new Uint8Array(new ArrayBuffer(5))
                data[0] = 5;
                const dataView = new DataView(data.buffer);
                dataView.setFloat32(1, m.maxEnergy);
                dcRemote.send(dataView);
            }
            
            oldM = {
                angle: m.angle,
                energy: m.energy,
                fieldMode: m.fieldMode,
                fieldOn: input.field,
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