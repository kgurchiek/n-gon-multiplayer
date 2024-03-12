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
            const data = new DataView(await message.data.arrayBuffer());
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
                player2.fieldMeterColor = new TextDecoder('utf-8').decode(data.buffer.slice(3, new Uint8Array(data.buffer)[2] + 3));
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
                    alert(`Join code: ${message.data.substring(1)}\nPress "ok" before entring it on another device.`);
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
        drawField: () => {
            if (m.holdingTarget) {
                ctx.fillStyle = "rgba(110,170,200," + (player2.energy * (0.05 + 0.05 * Math.random())) + ")";
                ctx.strokeStyle = "rgba(110, 200, 235, " + (0.3 + 0.08 * Math.random()) + ")" //"#9bd" //"rgba(110, 200, 235, " + (0.5 + 0.1 * Math.random()) + ")"
            } else {
                ctx.fillStyle = "rgba(110,170,200," + (0.02 + player2.energy * (0.15 + 0.15 * Math.random())) + ")";
                ctx.strokeStyle = "rgba(110, 200, 235, " + (0.6 + 0.2 * Math.random()) + ")" //"#9bd" //"rgba(110, 200, 235, " + (0.5 + 0.1 * Math.random()) + ")"
            }
            // const off = 2 * Math.cos(simulation.cycle * 0.1)
            const range = m.fieldRange;
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
        fieldMeterColor: '#0cf',
        fieldMode: 0,
        fieldOn: false,
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
    player2.fillColor = `hsl(${player2.color.hue},${player2.color.sat}%,${player2.color.light}%)`;
    player2.fillColorDark = `hsl(${player2.color.hue},${player2.color.sat}%,${player2.color.light - 25}%)`;
    let grd = ctx.createLinearGradient(-30, 0, 30, 0);
    grd.addColorStop(0, player2.fillColorDark);
    grd.addColorStop(1, player2.fillColor);
    player2.bodyGradient = grd;

    let oldM = {
        angle: m.angle,
        energy: m.energy,
        fieldMeterColor: m.fieldMeterColor,
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

            if (player2.fieldOn) player2.drawField();
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
            if (m.fieldMode != oldM.fieldMode || m.fieldMeterColor != oldM.fieldMeterColor) {
                // set field
                const textEncoder = new TextEncoder('utf-8');
                const data = new Uint8Array(new ArrayBuffer(3 + textEncoder.encode(m.fieldMeterColor).length));
                data[0] = 2;
                data[1] = m.fieldMode ? 1 : 0;
                data[2] = textEncoder.encode(m.fieldMeterColor).length;
                data.set(textEncoder.encode(m.fieldMeterColor), 3);
                dcLocal.send(new DataView(data.buffer));
            }
            if (input.field != oldM.fieldOn) {
                // toggle field
                const data = new Uint8Array(new ArrayBuffer(2));
                data[0] = 3;
                data[1] = input.field;
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
            
            oldM = {
                angle: m.angle,
                energy: m.energy,
                fieldMeterColor: m.fieldMeterColor,
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