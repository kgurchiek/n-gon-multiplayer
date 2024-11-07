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
        togglePause: 15,
        tech: 16
    },
    block: {
        infoRequest: 17,
        info: 18,
        positionUpdate: 19,
        vertexUpdate: 20,
        delete: 21
    },
    powerup: {
        infoRequest: 22,
        info: 23,
        update: 24,
        delete: 25
    },
    mob: {
        infoRequest: 26,
        info: 27,
        positionUpdate: 28,
        vertexUpdate: 29,
        colorUpdate: 30,
        propertyUpdate: 31,
        delete: 32
    },
    bullet: {
    }
}

class Player {
    constructor(id, connection) {
        this.angle = 0;
        this.color = { hue: 0, sat: 0, light: 100 };
        this.connection = connection;
        this.crouch = false;
        this.energy = 1;
        this.fieldAngle = 0;
        this.fieldArc = 0.2;
        this.fieldCDcycle = 0;
        this.fieldDrawRadius = 0;
        this.fieldMeterColor = '#0cf';
        this.fieldMode = 0;
        this.fieldPhase = 0;
        this.fieldPosition = { x: 0, y: 0 };
        this.fieldRange = 155;
        this.fillColor = `hsl(${this.color.hue},${this.color.sat}%,${this.color.light}%)`;
        this.fillColorDark = `hsl(${this.color.hue},${this.color.sat}%,${this.color.light - 25}%)`;
        this.flipLegs = -1;
        this.foot = { x: 0, y: 0 };
        this.FxAir = 0.016;
        this.health = 0.25;
        this.height = 42;
        this.hip = { x: 12, y: 24 };
        this.holdingTarget = null;
        this.hole = {
            isOn: false,
            isReady: true,
            pos1: { x: 0, y: 0 },
            pos2: { x: 0, y: 0 },
            angle: 0,
            unit: { x: 0, y: 0 }
        };
        this.immuneCycle = 0;
        this.input = { up: false, down: false, left: false, right: false, field: false, fire: false };
        this.isCloak = false;
        this.id = id;
        this.isHolding = false;
        this.knee = { x: 0, y: 0, x2: 0, y2: 0 };
        this.lastFieldPosition = { x: 0, y: 0 };
        this.legLength1 = 55;
        this.legLength2 = 45;
        this.mass = 5;
        this.maxEnergy = 1;
        this.maxHealth = 1;
        this.mouseInGame = { x: 0, y: 0 },
        this.onGround = false;
        this.paused = false;
        this.pos = { x: 0, y: 0 };
        this.radius = 30;
        this.stepSize = 0;
        this.tech = {};
        this.throwCharge = 0;
        this.Vx = 0;
        this.Vy = 0;
        this.walk_cycle = 0;
        this.yOff = 70;
        
        let grd = ctx.createLinearGradient(-30, 0, 30, 0);
        grd.addColorStop(0, this.fillColorDark);
        grd.addColorStop(1, this.fillColor);
        this.bodyGradient = grd;
    }
  
    calcLeg(cycle_offset, offset) {
        this.hip.x = 12 + offset;
        this.hip.y = 24 + offset;
        //stepSize goes to zero if Vx is zero or not on ground (make m transition cleaner)
        this.stepSize = 0.8 * this.stepSize + 0.2 * (7 * Math.sqrt(Math.min(9, Math.abs(this.Vx))) * this.onGround);
        //changes to stepsize are smoothed by adding only a percent of the new value each cycle
        const stepAngle = 0.034 * this.walk_cycle + cycle_offset;
        this.foot.x = 2.2 * this.stepSize * Math.cos(stepAngle) + offset;
        this.foot.y = offset + 1.2 * this.stepSize * Math.sin(stepAngle) + this.yOff + this.height;
        const Ymax = this.yOff + this.height;
        if (this.foot.y > Ymax) this.foot.y = Ymax;
  
        //calculate knee position as intersection of circle from hip and foot
        const d = Math.sqrt((this.hip.x - this.foot.x) * (this.hip.x - this.foot.x) + (this.hip.y - this.foot.y) * (this.hip.y - this.foot.y));
        const l = (this.legLength1 * this.legLength1 - this.legLength2 * this.legLength2 + d * d) / (2 * d);
        const h = Math.sqrt(this.legLength1 * this.legLength1 - l * l);
        this.knee.x = (l / d) * (this.foot.x - this.hip.x) - (h / d) * (this.foot.y - this.hip.y) + this.hip.x + offset;
        this.knee.y = (l / d) * (this.foot.y - this.hip.y) + (h / d) * (this.foot.x - this.hip.x) + this.hip.y;
    }
  
    drawHealthbar() {
        if (this.health < this.maxHealth) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            const xOff = this.pos.x - 40 * this.maxHealth;
            const yOff = this.pos.y - 70;
            ctx.fillRect(xOff, yOff, 80 * this.maxHealth, 10);
            ctx.fillStyle = '#09f5a6';
            ctx.fillRect(xOff, yOff, 80 * this.health, 10);
        } else if (this.health > this.maxHealth + 0.05 || this.input.field) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            const xOff = this.pos.x - 40 * this.health;
            const yOff = this.pos.y - 70;
            ctx.fillStyle = '#09f5a6';
            ctx.fillRect(xOff, yOff, 80 * this.health, 10);
        }
    }
  
    drawHold(target) {
        if (target) {
            const eye = 15;
            const len = target.vertices.length - 1;
            ctx.fillStyle = "rgba(110,170,200," + (0.2 + 0.4 * Math.random()) + ")";
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#000";
            ctx.beginPath();
            ctx.moveTo(
                this.pos.x + eye * Math.cos(this.angle),
                this.pos.y + eye * Math.sin(this.angle)
            );
            ctx.lineTo(target.vertices[len].x, target.vertices[len].y);
            ctx.lineTo(target.vertices[0].x, target.vertices[0].y);
            ctx.fill();
            ctx.stroke();
            for (let i = 0; i < len; i++) {
                ctx.beginPath();
                ctx.moveTo(
                    this.pos.x + eye * Math.cos(this.angle),
                    this.pos.y + eye * Math.sin(this.angle)
                );
                ctx.lineTo(target.vertices[i].x, target.vertices[i].y);
                ctx.lineTo(target.vertices[i + 1].x, target.vertices[i + 1].y);
                ctx.fill();
                ctx.stroke();
            }
        }
    }
  
    drawLeg(stroke) {
        if (this.angle > -Math.PI / 2 && this.angle < Math.PI / 2) {
            this.flipLegs = 1;
        } else {
            this.flipLegs = -1;
        }
        ctx.save();
  
        ctx.scale(this.flipLegs, 1); //leg lines
        if (this.isCloak) {
            ctx.globalAlpha *= 2;
            ctx.beginPath();
            ctx.moveTo(this.hip.x, this.hip.y);
            ctx.lineTo(this.knee.x, this.knee.y);
            ctx.lineTo(this.foot.x, this.foot.y);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 12;
            ctx.stroke();
            ctx.globalAlpha /= 2;
        }
        ctx.beginPath();
        ctx.moveTo(this.hip.x, this.hip.y);
        ctx.lineTo(this.knee.x, this.knee.y);
        ctx.lineTo(this.foot.x, this.foot.y);
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 6;
        ctx.stroke();
  
  
        //toe lines
        if (this.isCloak) {
            ctx.globalAlpha *= 2;
            ctx.beginPath();
            ctx.moveTo(this.foot.x, this.foot.y);
            ctx.lineTo(this.foot.x - 14, this.foot.y + 5);
            ctx.moveTo(this.foot.x, this.foot.y);
            ctx.lineTo(this.foot.x + 14, this.foot.y + 5);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 10;
            ctx.stroke();
            ctx.globalAlpha /= 2;
        }
  
        ctx.beginPath();
        ctx.moveTo(this.foot.x, this.foot.y);
        ctx.lineTo(this.foot.x - 14, this.foot.y + 5);
        ctx.moveTo(this.foot.x, this.foot.y);
        ctx.lineTo(this.foot.x + 14, this.foot.y + 5);
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 4;
        ctx.stroke();
  
  
        if (this.isCloak) {
            ctx.globalAlpha *= 2;
            //hip joint
            ctx.beginPath();
            ctx.arc(this.hip.x, this.hip.y, 9, 0, 2 * Math.PI);
            //knee joint
            ctx.moveTo(this.knee.x + 5, this.knee.y);
            ctx.arc(this.knee.x, this.knee.y, 5, 0, 2 * Math.PI);
            //foot joint
            ctx.moveTo(this.foot.x + 4, this.foot.y + 1);
            ctx.arc(this.foot.x, this.foot.y + 1, 4, 0, 2 * Math.PI);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 8;
            ctx.stroke();
            ctx.globalAlpha /= 2;
        }
  
        //hip joint
        ctx.beginPath();
        ctx.arc(this.hip.x, this.hip.y, 9, 0, 2 * Math.PI);
        //knee joint
        ctx.moveTo(this.knee.x + 5, this.knee.y);
        ctx.arc(this.knee.x, this.knee.y, 5, 0, 2 * Math.PI);
        //foot joint
        ctx.moveTo(this.foot.x + 4, this.foot.y + 1);
        ctx.arc(this.foot.x, this.foot.y + 1, 4, 0, 2 * Math.PI);
        ctx.fillStyle = this.fillColor;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
  
    drawRegenEnergy(bgColor = "rgba(0, 0, 0, 0.4)", range = 60) {
        if (this.energy < this.maxEnergy) {
            // m.regenEnergy();
            ctx.fillStyle = bgColor;
            const xOff = this.pos.x - this.radius * this.maxEnergy;
            const yOff = this.pos.y - 50;
            ctx.fillRect(xOff, yOff, range * this.maxEnergy, 10);
            ctx.fillStyle = this.fieldMeterColor;
            ctx.fillRect(xOff, yOff, range * this.energy, 10);
        } else if (this.energy > this.maxEnergy + 0.05 || this.input.field) {
            ctx.fillStyle = bgColor;
            const xOff = this.pos.x - this.radius * this.energy;
            const yOff = this.pos.y - 50;
            ctx.fillStyle = this.fieldMeterColor;
            ctx.fillRect(xOff, yOff, range * this.energy, 10);
        }
    }
  
    grabPowerUp() {
        for (let i = 0, len = powerUp.length; i < len; ++i) {
            const dxP = this.pos.x - powerUp[i].position.x;
            const dyP = this.pos.y - powerUp[i].position.y;
            const dist2 = dxP * dxP + dyP * dyP + 10;
            // float towards player  if looking at and in range  or  if very close to player
            if (
                dist2 < m.grabPowerUpRange2 &&
                (this.lookingAt(powerUp[i]) || dist2 < 10000) &&
                Matter.Query.ray(map, powerUp[i].position, this.pos).length === 0
            ) {
                if (true /*!tech.isHealAttract || powerUp[i].name !== "heal"*/) { //if you have accretion heals are already pulled in a different way
                    powerUp[i].force.x += 0.04 * (dxP / Math.sqrt(dist2)) * powerUp[i].mass;
                    powerUp[i].force.y += 0.04 * (dyP / Math.sqrt(dist2)) * powerUp[i].mass - powerUp[i].mass * simulation.g; //negate gravity
                    Matter.Body.setVelocity(powerUp[i], { x: powerUp[i].velocity.x * 0.11, y: powerUp[i].velocity.y * 0.11 }); //extra friction
                }
                if ( //use power up if it is close enough
                    dist2 < 5000 &&
                    !simulation.isChoosing &&
                    (powerUp[i].name !== "heal" || this.maxHealth - this.health > 0.01 || tech.isOverHeal)
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
    }
  
    lookingAt(who) {
        //calculate a vector from body to player and make it length 1
        const diff = Vector.normalise(Vector.sub(who.position, this.pos));
        //make a vector for the player's direction of length 1
        const dir = {
            x: Math.cos(this.angle),
            y: Math.sin(this.angle)
        };
        //the dot product of diff and dir will return how much over lap between the vectors
        if (Vector.dot(dir, diff) > Math.cos((this.fieldArc) * Math.PI)) {
            return true;
        }
        return false;
    }

    spawn() {
        let vertices = Vertices.fromPath("0,40, 50,40, 50,115, 30,130, 20,130, 0,115, 0,40"); //player as a series of vertices
        this.body = Bodies.fromVertices(0, 0, vertices);
        this.jumpSensor = Bodies.rectangle(0, 46, 36, 6, {
            //this sensor check if the player is on the ground to enable jumping
            sleepThreshold: 99999999999,
            isSensor: true
        });
        vertices = Vertices.fromPath("16 -82  2 -66  2 -37  43 -37  43 -66  30 -82");
        this.head = Bodies.fromVertices(0, -55, vertices); //this part of the player lowers on crouch
        this.headSensor = Bodies.rectangle(0, -57, 48, 45, {
            //senses if the player's head is empty and can return after crouching
            sleepThreshold: 99999999999,
            isSensor: true
        });
        this.hitbox = Body.create({
            parts: [this.body, this.head, this.jumpSensor, this.headSensor],
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
        Matter.Body.setMass(this.hitbox, this.mass);
        Composite.add(engine.world, [this.hitbox]);

        simulation.ephemera.push({ name: `Player${this.id}`, count: 0, do: () => {
            this.angle = Math.atan2(this.mouseInGame.y - this.pos.y, this.mouseInGame.x - this.pos.x);
            ctx.fillStyle = this.fillColor;
            ctx.save();
            ctx.globalAlpha = this.isCloak ? 0.25 : (this.immuneCycle < m.cycle ? 1 : 0.5);
            ctx.translate(this.pos.x, this.pos.y);
            this.calcLeg(Math.PI, -3);
            this.drawLeg("#4a4a4a");
            this.calcLeg(0, 0);
            this.drawLeg("#333");
            ctx.rotate(this.angle);
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, 2 * Math.PI);
            ctx.fillStyle = this.bodyGradient;
            ctx.fill();
            ctx.arc(15, 0, 4, 0, 2 * Math.PI);
            ctx.strokeStyle = "#333";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
            powerUps.boost.draw();
            if (!this.paused) {
                if (!this.isHolding && this.input.field) {
                    fieldData[this.fieldMode].do();
                    this.grabPowerUp();
                }
                if (!this.isHolding && (this.input.field || this.fieldMode == 1 || this.fieldMode == 2 || this.fieldMode == 3 || this.fieldMode == 8 || this.fieldMode == 9 || this.fieldMode == 10)) fieldData[this.fieldMode].drawField(this);
            }
            if (this.holdingTarget) {
                ctx.beginPath(); //draw on each valid body
                let vertices = this.holdingTarget.vertices;
                ctx.moveTo(vertices[0].x, vertices[0].y);
                for (let j = 1; j < vertices.length; j += 1) ctx.lineTo(vertices[j].x, vertices[j].y);
                ctx.lineTo(vertices[0].x, vertices[0].y);
                ctx.fillStyle = "rgba(190,215,230," + (0.3 + 0.7 * Math.random()) + ")";
                ctx.fill();
    
                ctx.globalAlpha = this.isHolding ? 1 : 0.2;
                this.drawHold(this.holdingTarget);
                ctx.globalAlpha = 1;

                //draw charge
                const x = this.pos.x + 15 * Math.cos(this.angle);
                const y = this.pos.y + 15 * Math.sin(this.angle);
                const len = this.holdingTarget.vertices.length - 1;
                const edge = this.throwCharge * this.throwCharge * this.throwCharge;
                const grd = ctx.createRadialGradient(x, y, edge, x, y, edge + 5);
                grd.addColorStop(0, "rgba(255,50,150,0.3)");
                grd.addColorStop(1, "transparent");
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(this.holdingTarget.vertices[len].x, this.holdingTarget.vertices[len].y);
                ctx.lineTo(this.holdingTarget.vertices[0].x, this.holdingTarget.vertices[0].y);
                ctx.fill();
                for (let j = 0; j < len; j++) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(this.holdingTarget.vertices[j].x, this.holdingTarget.vertices[j].y);
                    ctx.lineTo(this.holdingTarget.vertices[j + 1].x, this.holdingTarget.vertices[j + 1].y);
                    ctx.fill();
                }
                ctx.strokeStyle = "rgba(68, 68, 68, 0.15)";
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            if (this.isHolding) {
                this.energy -= fieldData[this.fieldMode].fieldRegen;
                if (this.energy < 0) this.energy = 0;
                Matter.Body.setPosition(this.holdingTarget, {
                    x: this.pos.x + 70 * Math.cos(this.angle),
                    y: this.pos.y + 70 * Math.sin(this.angle)
                });
                Matter.Body.setVelocity(this.holdingTarget, { x: this.Vx, y: this.Vy });
                Matter.Body.rotate(this.holdingTarget, 0.01 / this.holdingTarget.mass); //gently spin the block
            }

            if (this.isCloak) {
                ctx.beginPath();
                ctx.arc(this.pos.x, this.pos.y, 35, 0, 2 * Math.PI);
                ctx.strokeStyle = "rgba(255,255,255,0.5)";
                ctx.lineWidth = 6;
                ctx.stroke();
            }

            this.drawHealthbar();
            this.drawRegenEnergy();
        }})
    }

    sync() {
        const textEncoder = new TextEncoder();
        const data = new Uint8Array(new ArrayBuffer(4 + textEncoder.encode(Math.initialSeed).length + (players.length + 1) * 95));
        data.set(textEncoder.encode(Math.initialSeed), 4);
        const dataView = new DataView(data.buffer);
        dataView.setUint8(0, protocol.game.sync);
        dataView.setUint8(1, this.id);
        dataView.setUint8(2, simulation.difficultyMode);
        dataView.setUint8(3, textEncoder.encode(Math.initialSeed).length);
        let index = 4 + textEncoder.encode(Math.initialSeed).length;
        let host = {
            id: 0,
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
            pos: { x: m.pos.y, y: m.pos.y },
            throwCharge: m.throwCharge,
            Vx: m.Vx,
            Vy: m.Vy,
            walk_cycle: m.walk_cycle,
            yOff: m.yOff,
            paused: simulation.paused
        }
        for (const player of [host].concat(players)) {
            dataView.setUint8(index, player.id);
            dataView.setFloat64(index + 1, player.pos.x);
            dataView.setFloat64(index + 9, player.pos.y);
            dataView.setFloat64(index + 17, player.mouseInGame.x);
            dataView.setFloat64(index + 25, player.mouseInGame.y);
            dataView.setUint8(index + 33, player.onGround ? 1 : 0);
            dataView.setFloat64(index + 34, player.Vx);
            dataView.setFloat64(index + 42, player.Vy);
            dataView.setFloat32(index + 50, player.walk_cycle);
            dataView.setFloat32(index + 54, player.yOff);
            dataView.setUint8(index + 58, player.fieldMode);
            dataView.setFloat32(index + 59, player.immuneCycle);
            dataView.setFloat32(index + 63, player.health);
            dataView.setFloat32(index + 67, player.maxHealth);
            dataView.setFloat32(index + 71, player.energy);
            dataView.setFloat32(index + 75, player.maxEnergy);
            dataView.setUint8(index + 79, player.input.up ? 1 : 0);
            dataView.setUint8(index + 80, player.input.down ? 1 : 0);
            dataView.setUint8(index + 81, player.input.left ? 1 : 0);
            dataView.setUint8(index + 82, player.input.right ? 1 : 0);
            dataView.setUint8(index + 83, player.input.field ? 1 : 0);
            dataView.setUint8(index + 84, player.input.fire ? 1 : 0);
            dataView.setUint8(index + 85, player.crouch ? 1 : 0);
            dataView.setUint8(index + 86, player.isCloak ? 1 : 0);
            dataView.setUint8(index + 87, player.isHolding ? 1 : 0);
            dataView.setUint16(index + 88, player.holdingTarget ? player.holdingTarget.id : -1);
            dataView.setFloat32(index + 90, player.throwCharge);
            dataView.setUint8(index + 94, player.paused ? 1 : 0);
            index += 95;
        }
        this.connection.send(dataView);
    }
}
let players = [];

function broadcast(data, id = 0) {
    for (const player of players) if (player.connection.readyState == 'open' && (id != player.id)) player.connection.send(data);
}

b.multiplayerGrapple = (where, angle, playerId) => {
    const origin = players.find(a => a.id === playerId);
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

const fieldData = [
    {
        // field emitter
        do: () => {},
        drawField: (player) => {
            if (player.holdingTarget) {
                ctx.fillStyle = "rgba(110,170,200," + (m.energy * (0.05 + 0.05 * Math.random())) + ")";
                ctx.strokeStyle = "rgba(110, 200, 235, " + (0.3 + 0.08 * Math.random()) + ")";
            } else {
                ctx.fillStyle = "rgba(110,170,200," + (0.02 + player.energy * (0.15 + 0.15 * Math.random())) + ")";
                ctx.strokeStyle = "rgba(110, 200, 235, " + (0.6 + 0.2 * Math.random()) + ")";
            }
            const range = player.fieldRange;
            ctx.beginPath();
            ctx.arc(player.pos.x, player.pos.y, range, player.angle - Math.PI * player.fieldArc, player.angle + Math.PI * player.fieldArc, false);
            ctx.lineWidth = 2;
            ctx.stroke();
            let eye = 13;
            let aMag = 0.75 * Math.PI * player.fieldArc
            let a = player.angle + aMag
            let cp1x = player.pos.x + 0.6 * range * Math.cos(a)
            let cp1y = player.pos.y + 0.6 * range * Math.sin(a)
            ctx.quadraticCurveTo(cp1x, cp1y, player.pos.x + eye * Math.cos(player.angle), player.pos.y + eye * Math.sin(player.angle))
            a = player.angle - aMag
            cp1x = player.pos.x + 0.6 * range * Math.cos(a)
            cp1y = player.pos.y + 0.6 * range * Math.sin(a)
            ctx.quadraticCurveTo(cp1x, cp1y, player.pos.x + 1 * range * Math.cos(player.angle - Math.PI * player.fieldArc), player.pos.y + 1 * range * Math.sin(player.angle - Math.PI * player.fieldArc))
            ctx.fill();
    
            //draw random lines in field for cool effect
            let offAngle = player.angle + 1.7 * Math.PI * player.fieldArc * (Math.random() - 0.5);
            ctx.beginPath();
            eye = 15;
            ctx.moveTo(player.pos.x + eye * Math.cos(player.angle), player.pos.y + eye * Math.sin(player.angle));
            ctx.lineTo(player.pos.x + range * Math.cos(offAngle), player.pos.y + range * Math.sin(offAngle));
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
        drawField: (player) => {
            player.harmonicRadius = 1; // TODO: changes with expansion tech
            const fieldRange1 = (0.75 + 0.3 * Math.sin(m.cycle / 23)) * player.fieldRange * player.harmonicRadius
            const fieldRange2 = (0.68 + 0.37 * Math.sin(m.cycle / 37)) * player.fieldRange * player.harmonicRadius
            const fieldRange3 = (0.7 + 0.35 * Math.sin(m.cycle / 47)) * player.fieldRange * player.harmonicRadius
            const netFieldRange = Math.max(fieldRange1, fieldRange2, fieldRange3)
            ctx.fillStyle = "rgba(110,170,200," + Math.min(0.6, (0.04 + 0.7 * player.energy * (0.1 + 0.11 * Math.random()))) + ")";
            ctx.beginPath();
            ctx.arc(player.pos.x, player.pos.y, fieldRange1, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(player.pos.x, player.pos.y, fieldRange2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(player.pos.x, player.pos.y, fieldRange3, 0, 2 * Math.PI);
            ctx.fill();
        },
        fieldMeterColor: '#0cf',
        fieldRange: 185,
        fieldRegen: 0.001
    },
    {
        // perfect diamagnetism
        do: () => {},
        drawField: (player) => {
            const wave = Math.sin(m.cycle * 0.022);
            player.fieldRange = 180 + 12 * wave; // TODO: changes with Miessner Effect tech
            player.fieldArc = 0.35 + 0.045 * wave; // TODO: changes with Miessner Effect tech
            if (player.input.field) {
                player.fieldPosition = { x: player.pos.x, y: player.pos.y };
                player.fieldAngle = player.angle;
                ctx.fillStyle = `rgba(110,150,220, ${0.27 + 0.2 * Math.random() - 0.1 * wave})`
                ctx.strokeStyle = `rgba(110,150,220, ${0.4 + 0.5 * Math.random()})`
                ctx.beginPath();
                ctx.arc(player.pos.x, player.pos.y, player.fieldRange, player.angle - Math.PI * player.fieldArc, player.angle + Math.PI * player.fieldArc, false);
                ctx.lineWidth = 2.5 - 1.5 * wave;
                ctx.stroke();
                const curve = 0.57 + 0.04 * wave
                const aMag = (1 - curve * 1.2) * Math.PI * player.fieldArc
                let a = player.angle + aMag
                let cp1x = player.pos.x + curve * player.fieldRange * Math.cos(a)
                let cp1y = player.pos.y + curve * player.fieldRange * Math.sin(a)
                ctx.quadraticCurveTo(cp1x, cp1y, player.pos.x + 30 * Math.cos(player.angle), player.pos.y + 30 * Math.sin(player.angle))
                a = player.angle - aMag
                cp1x = player.pos.x + curve * player.fieldRange * Math.cos(a)
                cp1y = player.pos.y + curve * player.fieldRange * Math.sin(a)
                ctx.quadraticCurveTo(cp1x, cp1y, player.pos.x + 1 * player.fieldRange * Math.cos(player.angle - Math.PI * player.fieldArc), player.pos.y + 1 * player.fieldRange * Math.sin(player.angle - Math.PI * player.fieldArc))
                ctx.fill();
            } else {
                ctx.fillStyle = `rgba(110,150,220, ${0.27 + 0.2 * Math.random() - 0.1 * wave})`
                ctx.strokeStyle = `rgba(110,180,255, ${0.4 + 0.5 * Math.random()})`
                ctx.beginPath();
                ctx.arc(player.fieldPosition.x, player.fieldPosition.y, player.fieldRange, player.fieldAngle - Math.PI * player.fieldArc, player.fieldAngle + Math.PI * player.fieldArc, false);
                ctx.lineWidth = 2.5 - 1.5 * wave;
                ctx.stroke();
                const curve = 0.8 + 0.06 * wave
                const aMag = (1 - curve * 1.2) * Math.PI * player.fieldArc
                let a = player.fieldAngle + aMag
                ctx.quadraticCurveTo(player.fieldPosition.x + curve * player.fieldRange * Math.cos(a), player.fieldPosition.y + curve * player.fieldRange * Math.sin(a), player.fieldPosition.x + 1 * player.fieldRange * Math.cos(player.fieldAngle - Math.PI * player.fieldArc), player.fieldPosition.y + 1 * player.fieldRange * Math.sin(player.fieldAngle - Math.PI * player.fieldArc))
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
        drawField: (player) => {
            if (player.input.field) {
                player.FxAir = 0.016;
                if (player.input.down) player.fieldDrawRadius = player.fieldDrawRadius * 0.97 + 400 * 0.03;
                else if (player.input.up) player.fieldDrawRadius = player.fieldDrawRadius * 0.97 + 850 * 0.03;
                else player.fieldDrawRadius = player.fieldDrawRadius * 0.97 + 650 * 0.03;
                ctx.beginPath();
                ctx.arc(player.pos.x, player.pos.y, player.fieldDrawRadius, 0, 2 * Math.PI);
                ctx.fillStyle = "#f5f5ff";
                ctx.globalCompositeOperation = "difference";
                ctx.fill();
                ctx.globalCompositeOperation = "source-over";

                // effect on player
                player.FxAir = 0.005
                const dist = Math.sqrt((player.pos.x - m.pos.x) * (player.pos.x - m.pos.x) + (player.pos.y - m.pos.y) * (player.pos.y - m.pos.y));
                if (dist < player.fieldDrawRadius) {
                    if (player.input.down) player.force.y -= 0.5 * player.mass * simulation.g;
                    else if (player.input.up) player.force.y -= 1.45 * player.mass * simulation.g;
                    else player.force.y -= 1.07 * player.mass * simulation.g;
                }
            } else player.fieldDrawRadius = 0;
        },
        fieldMeterColor: '#333',
        fieldRange: 155,
        fieldRegen: 0.001
    },
    {
        // molecular assembler
        do: () => {},
        drawField: (player) => {
            ctx.fillStyle = "rgba(110,170,200," + (0.02 + player.energy * (0.15 + 0.15 * Math.random())) + ")";
            ctx.strokeStyle = "rgba(110, 200, 235, " + (0.6 + 0.2 * Math.random()) + ")";
            const range = player.fieldRange;
            ctx.beginPath();
            ctx.arc(player.pos.x, player.pos.y, range, player.angle - Math.PI * player.fieldArc, player.angle + Math.PI * player.fieldArc, false);
            ctx.lineWidth = 2;
            ctx.stroke();
            let eye = 13;
            let aMag = 0.75 * Math.PI * player.fieldArc
            let a = player.angle + aMag
            let cp1x = player.pos.x + 0.6 * range * Math.cos(a)
            let cp1y = player.pos.y + 0.6 * range * Math.sin(a)
            ctx.quadraticCurveTo(cp1x, cp1y, player.pos.x + eye * Math.cos(player.angle), player.pos.y + eye * Math.sin(player.angle))
            a = player.angle - aMag
            cp1x = player.pos.x + 0.6 * range * Math.cos(a)
            cp1y = player.pos.y + 0.6 * range * Math.sin(a)
            ctx.quadraticCurveTo(cp1x, cp1y, player.pos.x + 1 * range * Math.cos(player.angle - Math.PI * player.fieldArc), player.pos.y + 1 * range * Math.sin(player.angle - Math.PI * player.fieldArc))
            ctx.fill();
    
            //draw random lines in field for cool effect
            let offAngle = player.angle + 1.7 * Math.PI * player.fieldArc * (Math.random() - 0.5);
            ctx.beginPath();
            eye = 15;
            ctx.moveTo(player.pos.x + eye * Math.cos(player.angle), player.pos.y + eye * Math.sin(player.angle));
            ctx.lineTo(player.pos.x + range * Math.cos(offAngle), player.pos.y + range * Math.sin(offAngle));
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
        drawField: (player) => {
            let range = 120 + (player.crouch ? 400 : 300) * Math.sqrt(Math.random()) // TODO: can change with tech
            const path = [
                {
                    x: player.pos.x + 20 * Math.cos(player.angle),
                    y: player.pos.y + 20 * Math.sin(player.angle)
                },
                {
                    x: player.pos.x + range * Math.cos(player.angle),
                    y: player.pos.y + range * Math.sin(player.angle)
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
            const Dx = Math.cos(player.angle);
            const Dy = Math.sin(player.angle);
            let x = player.pos.x + 20 * Dx;
            let y = player.pos.y + 20 * Dy;
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
        drawField: (player) => {
            if (player.input.field) {
                const scale = 25;
                const bounds = {
                    min: {
                        x: player.fieldPosition.x - scale,
                        y: player.fieldPosition.y - scale
                    },
                    max: {
                        x: player.fieldPosition.x + scale,
                        y: player.fieldPosition.y + scale
                    }
                }
                const isInMap = Matter.Query.region(map, bounds).length
                if (player.fieldDrawRadius == 0) {
                    player.fieldPosition = { x: player.mouseInGame.x, y: player.mouseInGame.y };
                    player.lastFieldPosition = { x: player.mouseInGame.x, y: player.mouseInGame.y };
                } else {
                    player.lastFieldPosition = { //used to find velocity of field changes
                        x: player.fieldPosition.x,
                        y: player.fieldPosition.y
                    }
                    const smooth = isInMap ? 0.985 : 0.96;
                    player.fieldPosition = { //smooth the mouse position
                        x: player.fieldPosition.x * smooth + player.mouseInGame.x * (1 - smooth),
                        y: player.fieldPosition.y * smooth + player.mouseInGame.y * (1 - smooth),
                    }
                }

                const diff = Vector.sub(player.fieldPosition, player.lastFieldPosition)
                const speed = Vector.magnitude(diff)
                let radius, radiusSmooth
                if (Matter.Query.ray(map, player.fieldPosition, player.pos).length) { //is there something block the player's view of the field
                    radius = 0
                    radiusSmooth = Math.max(0, isInMap ? 0.96 - 0.02 * speed : 0.995); //0.99
                } else {
                    radius = Math.max(50, 250 - 2 * speed)
                    radiusSmooth = 0.97
                }
                player.fieldDrawRadius = player.fieldDrawRadius * radiusSmooth + radius * (1 - radiusSmooth)

                ctx.beginPath();
                const rotate = m.cycle * 0.008;
                player.fieldPhase += 0.2
                const off1 = 1 + 0.06 * Math.sin(player.fieldPhase);
                const off2 = 1 - 0.06 * Math.sin(player.fieldPhase);
                ctx.beginPath();
                ctx.ellipse(player.fieldPosition.x, player.fieldPosition.y, 1.2 * player.fieldDrawRadius * off1, 1.2 * player.fieldDrawRadius * off2, rotate, 0, 2 * Math.PI);
                ctx.globalCompositeOperation = "exclusion";
                ctx.fillStyle = "#fff";
                ctx.fill();
                ctx.globalCompositeOperation = "source-over";
                ctx.beginPath();
                ctx.ellipse(player.fieldPosition.x, player.fieldPosition.y, 1.2 * player.fieldDrawRadius * off1, 1.2 * player.fieldDrawRadius * off2, rotate, 0, 2 * Math.PI * player.energy / player.maxEnergy);
                ctx.strokeStyle = "#000";
                ctx.lineWidth = 4;
                ctx.stroke();
            } else player.fieldDrawRadius = 0;
        },
        fieldMeterColor: '#333',
        fieldRange: 155,
        fieldRegen: 0.001667
    },
    {
        // wormhole
        do: () => {},
        drawField: (player) => {
            const scale = 60;
            const justPastMouse = Vector.add(Vector.mult(Vector.normalise(Vector.sub(player.mouseInGame, player.pos)), 50), player.mouseInGame)
            const sub = Vector.sub(player.mouseInGame, player.pos);
            const mag = Vector.magnitude(sub);
            if (player.input.field) {

                this.drain = 0.05 + 0.005 * Math.sqrt(mag)
                const unit = Vector.perp(Vector.normalise(sub))
                const where = { x: player.pos.x + 30 * Math.cos(player.angle), y: player.pos.y + 30 * Math.sin(player.angle) }
                player.fieldRange = 0.97 * player.fieldRange + 0.03 * (50 + 10 * Math.sin(simulation.cycle * 0.025))
                const edge2a = Vector.add(Vector.mult(unit, 1.5 * player.fieldRange), player.mouseInGame)
                const edge2b = Vector.add(Vector.mult(unit, -1.5 * player.fieldRange), player.mouseInGame)
                ctx.beginPath();
                ctx.moveTo(where.x, where.y)
                ctx.bezierCurveTo(where.x, where.y, player.mouseInGame.x, player.mouseInGame.y, edge2a.x, edge2a.y);
                ctx.moveTo(where.x, where.y)
                ctx.bezierCurveTo(where.x, where.y, player.mouseInGame.x, player.mouseInGame.y, edge2b.x, edge2b.y);
                if (
                    mag > 250 && player.energy > this.drain &&
                    (/*tech.isWormholeMapIgnore ||*/ Matter.Query.ray(map, player.pos, justPastMouse).length === 0) &&
                    Matter.Query.region(map, {
                        min: {
                            x: player.mouseInGame.x - scale,
                            y: player.mouseInGame.y - scale
                        },
                        max: {
                            x: player.mouseInGame.x + scale,
                            y: player.mouseInGame.y + scale
                        }
                    }).length === 0
                ) {
                    player.hole.isReady = true;
                    ctx.lineWidth = 1
                    ctx.strokeStyle = "#000"
                    ctx.stroke();
                } else {
                    player.hole.isReady = false;
                    ctx.lineWidth = 1
                    ctx.strokeStyle = "#000"
                    ctx.lineDashOffset = 30 * Math.random()
                    ctx.setLineDash([20, 40]);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            } else if (
                player.hole.isReady && mag > 250 && player.energy > this.drain &&
                (/*tech.isWormholeMapIgnore ||*/ Matter.Query.ray(map, player.pos, justPastMouse).length === 0) &&
                Matter.Query.region(map, {
                    min: {
                        x: player.mouseInGame.x - scale,
                        y: player.mouseInGame.y - scale
                    },
                    max: {
                        x: player.mouseInGame.x + scale,
                        y: player.mouseInGame.y + scale
                    }
                }).length === 0
            ) {
                player.hole.isReady = false;
                player.fieldRange = 0;
                player.hole.isOn = true;
                player.hole.pos1.x = player.pos.x;
                player.hole.pos1.y = player.pos.y;
                player.hole.pos2.x = player.mouseInGame.x;
                player.hole.pos2.y = player.mouseInGame.y;
                player.hole.angle = Math.atan2(sub.y, sub.x);
                player.hole.unit = Vector.perp(Vector.normalise(sub));
            }

            if (player.hole.isOn) {
                player.fieldRange = 0.97 * player.fieldRange + 0.03 * (50 + 10 * Math.sin(simulation.cycle * 0.025))
                const semiMajorAxis = player.fieldRange + 30
                const edge1a = Vector.add(Vector.mult(player.hole.unit, semiMajorAxis), player.hole.pos1)
                const edge1b = Vector.add(Vector.mult(player.hole.unit, -semiMajorAxis), player.hole.pos1)
                const edge2a = Vector.add(Vector.mult(player.hole.unit, semiMajorAxis), player.hole.pos2)
                const edge2b = Vector.add(Vector.mult(player.hole.unit, -semiMajorAxis), player.hole.pos2)
                ctx.beginPath();
                ctx.moveTo(edge1a.x, edge1a.y)
                ctx.bezierCurveTo(player.hole.pos1.x, player.hole.pos1.y, player.hole.pos2.x, player.hole.pos2.y, edge2a.x, edge2a.y);
                ctx.lineTo(edge2b.x, edge2b.y)
                ctx.bezierCurveTo(player.hole.pos2.x, player.hole.pos2.y, player.hole.pos1.x, player.hole.pos1.y, edge1b.x, edge1b.y);
                ctx.fillStyle = `rgba(255,255,255,${200 / player.fieldRange / player.fieldRange})` //"rgba(0,0,0,0.1)"
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(player.hole.pos1.x, player.hole.pos1.y, player.fieldRange, semiMajorAxis, player.hole.angle, 0, 2 * Math.PI)
                ctx.ellipse(player.hole.pos2.x, player.hole.pos2.y, player.fieldRange, semiMajorAxis, player.hole.angle, 0, 2 * Math.PI)
                ctx.fillStyle = `rgba(255,255,255,${32 / player.fieldRange})`
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
        drawField: (player) => {
            // console.log(player.input.field, player.fieldCDcycle, m.cycle)
            if (player.input.field && player.fieldCDcycle < m.cycle) {
                b.multiplayerGrapple({ x: player.pos.x + 40 * Math.cos(player.angle), y: player.pos.y + 40 * Math.sin(player.angle) }, player.angle, 2);
                if (player.fieldCDcycle < m.cycle + 20) player.fieldCDcycle = m.cycle + 20;
            }
        },
        fieldMeterColor: '#0cf',
        fieldRange: 155,
        fieldRegen: 0.0015
    }
];

let joinCode;
const getNewPlayer = () => (new Promise(async (resolve, reject) => {
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
        // console.log('peerLocal', 'onconnectionstatechange', e);
    };
    peerLocal.ondatachannel = function(e) {
        // console.log('peerLocal', 'ondatachannel', e);
    };
    peerLocal.onsignalingstatechange = function(e) {
        // console.log('peerLocal', 'onsignalingstatechange', peerLocal.signalingState);
    };
    peerLocal.onicegatheringstatechange = function(e) {
        // console.log('peerLocal', 'onicegatheringstatechange', peerLocal.iceGatheringState);
        if (peerLocal.iceGatheringState == 'complete') ws.close();
    };
    peerLocal.onicecandidate = function(e){
        // console.log('peerLocal', 'onicecandidate', e.candidate);
        //Share ICE candidates with peerRemote
        // console.log('candidate', e.candidate)
        if (e.candidate != null) ws.send(`\x00${JSON.stringify(e.candidate)}`);
    };
    peerLocal.onnegotiationneeded = function(e) {
        // console.log('peerLocal', 'onnegotiationneeded', e);
    };
    const connection = peerLocal.createDataChannel('rtcdc');
    let nextId = 1;
    for  (const player of players) if (player.id >= nextId) nextId = player.id + 1;
    let newPlayer = new Player(nextId, connection);
    connection.onopen = function(e) {
        // console.log('dcLocal', 'onopen', e);
    };
    connection.onmessage = async (message) => {
        // console.log('dcLocal', 'onmessage', message.data);
        const data = typeof message.data.arrayBuffer == 'function' ? new DataView(await message.data.arrayBuffer()) : new DataView(message.data);
        const id = data.getUint8(0);
        switch (id) {
            case protocol.game.syncRequest: {
                newPlayer.sync();
                break;
            }
            case protocol.player.movement: {
                newPlayer.mouseInGame.x = data.getFloat64(2);
                newPlayer.mouseInGame.y = data.getFloat64(10);
                newPlayer.onGround = data.getUint8(18) == 1;
                newPlayer.pos.x = data.getFloat64(19);
                newPlayer.pos.y = data.getFloat64(27);
                newPlayer.Vx = data.getFloat64(35);
                newPlayer.Vy = data.getFloat64(43);
                newPlayer.walk_cycle = data.getFloat32(51);
                newPlayer.yOff = data.getFloat32(55);
                Matter.Body.setPosition(newPlayer.hitbox, { x: newPlayer.pos.x, y: newPlayer.pos.y + newPlayer.yOff - 24.714076782448295});
                Matter.Body.setVelocity(newPlayer.hitbox, { x: newPlayer.Vx, y: newPlayer.Vy });
                data.setUint8(1, newPlayer.id);
                broadcast(data, newPlayer.id);
                break;
            }
            case protocol.player.rotation: {
                newPlayer.mouseInGame.x = data.getFloat64(2);
                newPlayer.mouseInGame.y = data.getFloat64(10);
                data.setUint8(1, newPlayer.id);
                broadcast(data, newPlayer.id);
                break;
            }
            case protocol.player.setField: {
                newPlayer.fieldMode = data.getUint8(2);
                newPlayer.fieldMeterColor = fieldData[newPlayer.fieldMode].fieldMeterColor;
                newPlayer.fieldRange = fieldData[newPlayer.fieldMode].fieldRange;
                newPlayer.fieldPosition = { x: newPlayer.pos.x, y: newPlayer.pos.y };
                newPlayer.fieldAngle = newPlayer.angle;
                newPlayer.fieldArc = 0.2;
                data.setUint8(1, newPlayer.id);
                broadcast(data, newPlayer.id);
                break;
            }
            case protocol.player.immuneCycleUpdate: {
                newPlayer.immuneCycle = data.getFloat32(2);
                data.setUint8(1, newPlayer.id);
                broadcast(data, newPlayer.id);
                break;
            }
            case protocol.player.healthUpdate: {
                player.health = data.getFloat32(2);
                data.setUint8(1, newPlayer.id);
                broadcast(data, newPlayer.id);
                break;
            }
            case protocol.player.maxHealthUpdate: {
                newPlayer.maxHealth = data.getFloat32(2);
                data.setUint8(1, newPlayer.id);
                broadcast(data, newPlayer.id);
                break;
            }
            case protocol.player.energyUpdate: {
                newPlayer.energy = data.getFloat32(2);
                data.setUint8(1, newPlayer.id);
                broadcast(data, newPlayer.id);
                break;
            }
            case protocol.player.maxEnergyUpdate: {
                newPlayer.maxEnergy = data.getFloat32(2);
                data.setUint8(1, newPlayer.id);
                broadcast(data, newPlayer.id);
                break;
            }
            case protocol.player.inputs: {
                newPlayer.input.up = data.getUint8(2) == 1;
                newPlayer.input.down = data.getUint8(3) == 1;
                newPlayer.input.left = data.getUint8(4) == 1;
                newPlayer.input.right = data.getUint8(5) == 1;
                newPlayer.input.field = data.getUint8(6) == 1;
                newPlayer.input.fire = data.getUint8(7) == 1;
                data.setUint8(1, newPlayer.id);
                broadcast(data, newPlayer.id);
                break;
            }
            case protocol.player.toggleCrouch: {
                newPlayer.crouch = data.getUint8(2) == 1;
                data.setUint8(1, newPlayer.id);
                broadcast(data, newPlayer.id);
                break;
            }
            case protocol.player.toggleCloak: {
                newPlayer.isCloak = data.getUint8(2) == 1;
                data.setUint8(1, newPlayer.id);
                broadcast(data, newPlayer.id);
                break;
            }
            case protocol.player.holdBlock: {
                newPlayer.isHolding = data.getUint8(2) == 1;
                if (!newPlayer.isHolding && newPlayer.holdingTarget) {
                    newPlayer.holdingTarget.collisionFilter.category = cat.body;
                    newPlayer.holdingTarget.collisionFilter.mask = cat.newPlayer | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet;
                }
                newPlayer.holdingTarget = data.getUint16(3) == -1 ? null : body.find(block => block.id == data.getUint16(3));
                if (newPlayer.holdingTarget == null) newPlayer.isHolding = false;
                if (newPlayer.isHolding) {
                    newPlayer.holdingTarget.collisionFilter.category = 0;
                    newPlayer.holdingTarget.collisionFilter.mask = 0;
                }
                data.setUint8(1, newPlayer.id);
                broadcast(data, newPlayer.id);
                break;
            }
            case protocol.player.throwChargeUpdate: {
                newPlayer.throwCharge = data.getFloat32(2);
                data.setUint8(1, newPlayer.id);
                broadcast(data, newPlayer.id);
                break;
            }
            case protocol.player.togglePause: {
                newPlayer.paused = data.getUint8(2) == 1;
                data.setUint8(1, newPlayer.id);
                broadcast(data, newPlayer.id);
                break;
            }
            case protocol.player.tech: {
                let name = [...(tech.tech)].sort((a, b) => a.name > b.name ? 1 : -1)[data.getUint16(2)].name;
                let count = data.getUint8(4);
                if (newPlayer.tech[name]) newPlayer.tech[name] = count;
                else newPlayer.tech[name] = count;
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
                    newPlayer.connection.send(dataView);
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
                    newPlayer.connection.send(dataView);
                }
                break;
            }
            case protocol.powerup.delete: {
                const index = powerUp.findIndex(a => a.id == data.getUint16(1));
                if (index != -1) {
                    Matter.Composite.remove(engine.world, powerUp[index]);
                    powerUp = powerUp.slice(0, index).concat(powerUp.slice(index + 1));
                }
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
                    newPlayer.connection.send(dataView);
                }
                break;
            }
        }
    };
    connection.onerror = function(e) {
        console.error('dcLocal', 'onerror', e);
    };
    connection.onclose = function(e) {
        console.log('dcLocal', 'onclose', e);
    };

    // console.log('peerLocal', 'createOffer');
    let peerLocalOffer = await peerLocal.createOffer();

    ws = new WebSocket('ws://localhost' /*'wss://n-gon.cornbread2100.com'*/);
    ws.onopen = async () => {
        console.log('Connected to signaling server');
        ws.send(`\x00${joinCode ? `\x01${joinCode}` : '\x00'}${JSON.stringify(peerLocalOffer)}`);
    }
    let state = 0;
    ws.onmessage = async (message) => {
        // console.log('message:', message.data)

        if (message.data[0] == '\x00') {
            if (state == 0) {
                if (!joinCode) alert(`Join code: ${message.data.substring(1)}`);
                joinCode = message.data.substring(1);
                state++;
            } else {
                const peerRemoteAnswer = new RTCSessionDescription(JSON.parse(message.data.substring(1)));
                // console.log('peerLocal', 'setLocalDescription', peerLocalOffer);
                await peerLocal.setLocalDescription(peerLocalOffer);
                // console.log('peerLocal', 'setRemoteDescription', peerRemoteAnswer);
                await peerLocal.setRemoteDescription(peerRemoteAnswer);
            }
        }
        if (message.data[0] == '\x01') peerLocal.addIceCandidate(new RTCIceCandidate(JSON.parse(message.data.substring(1))));
        if (message.data[0] == '\x02') console.error(message.data.substring(1));
    }
    ws.onerror = (err) => {
        console.error('Error with connection to signaling server:', err);
    }
    ws.onclose = () => {
        console.log('Signaling complete');
        players.push(newPlayer);
        if (!simulation.onTitlePage) {
            newPlayer.spawn();
            for (let i = 0; i < players.length - 1; i++) players[i].sync(); 
        }
        resolve();
        setTimeout(getNewPlayer, 0);
    }
}));

(async () => {
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
                                    if (mob[k].alive) {
                                        let found = false;
                                        if (Math.sqrt((mob[k].position.x - m.pos.x)**2 + (mob[k].position.y - m.pos.y)**2) < 1000000 && !m.isCloak) found = true;
                                        else for (const player of players) if (Math.sqrt((mob[k].position.x - player.pos.x)**2 + (mob[k].position.y - player.pos.y)**2) < 1000000 && !player.isCloak) found = true;
                                        if (found) mob[k].foundPlayer();
                                    }
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
        tech: [],
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

        for (const player of players) player.spawn();
        simulation.ephemera.push({ name: 'Broadcast', count: 0, do: () => {
            // player broadcast
            if (m.onGround != oldM.onGround || m.pos.x != oldM.pos.x || m.pos.y != oldM.pos.y || m.Vx != oldM.Vx || m.Vy != oldM.Vy || m.walk_cycle != oldM.walk_cycle || m.yOff != oldM.yOff) {
                const dataView = new DataView(new ArrayBuffer(59));
                dataView.setUint8(0, protocol.player.movement);
                dataView.setUint8(1, 0);
                dataView.setFloat64(2, simulation.mouseInGame.x);
                dataView.setFloat64(10, simulation.mouseInGame.y);
                dataView.setUint8(18, m.onGround ? 1 : 0);
                dataView.setFloat64(19, m.pos.x);
                dataView.setFloat64(27, m.pos.y);
                dataView.setFloat64(35, m.Vx);
                dataView.setFloat64(43, m.Vy);
                dataView.setFloat32(51, m.walk_cycle);
                dataView.setFloat32(55, m.yOff);
                broadcast(dataView);
            } else if (simulation.mouseInGame.x != oldM.mouseInGame.x || simulation.mouseInGame.y != oldM.mouseInGame.y) {
                const dataView = new DataView(new ArrayBuffer(19));
                dataView.setUint8(0, protocol.player.rotation);
                dataView.setUint8(1, 0);
                dataView.setFloat64(2, simulation.mouseInGame.x);
                dataView.setFloat64(10, simulation.mouseInGame.y);
                broadcast(dataView);
            }
            if (m.fieldMode != oldM.fieldMode) {
                const dataView = new DataView(new ArrayBuffer(3));
                dataView.setUint8(0, protocol.player.setField);
                dataView.setUint8(1, 0);
                dataView.setUint8(2, m.fieldMode);
                broadcast(dataView);
            }
            if (m.immuneCycle != oldM.immuneCycle) {
                const dataView = new DataView(new ArrayBuffer(6));
                dataView.setUint8(0, protocol.player.immuneCycleUpdate);
                dataView.setUint8(1, 0);
                dataView.setFloat32(2, m.immuneCycle);
                broadcast(dataView);
            }
            if (m.health != oldM.health) {
                const dataView = new DataView(new ArrayBuffer(6));
                dataView.setUint8(0, protocol.player.healthUpdate);
                dataView.setUint8(1, 0);
                dataView.setFloat32(2, m.health);
                broadcast(dataView);
            }
            if (m.maxHealth != oldM.maxHealth) {
                const dataView = new DataView(ArrayBuffer(6));
                dataView.setUint8(0, protocol.player.maxHealthUpdate);
                dataView.setUint8(1, 0);
                dataView.setFloat32(2, m.maxHealth);
                broadcast(dataView);
            }
            if (m.energy != oldM.energy) {
                const dataView = new DataView(new ArrayBuffer(6));
                dataView.setUint8(0, protocol.player.energyUpdate);
                dataView.setUint8(1, 0);
                dataView.setFloat32(2, m.energy);
                broadcast(dataView);
            }
            if (m.maxEnergy != oldM.maxEnergy) {
                const dataView = new DataView(new ArrayBuffer(6));
                dataView.setUint8(0, protocol.player.maxEnergyUpdate);
                dataView.setUint8(1, 0);
                dataView.setFloat32(2, m.maxEnergy);
                broadcast(dataView);
            }
            if (input.up != oldM.input.up || input.down != oldM.input.down || input.left != oldM.input.left || input.right != oldM.input.right || input.field != oldM.input.field || input.fire != oldM.input.fire) {
                const dataView = new DataView(new ArrayBuffer(8));
                dataView.setUint8(0, protocol.player.inputs);
                dataView.setUint8(1, 0);
                dataView.setUint8(2, input.up ? 1 : 0);
                dataView.setUint8(3, input.down ? 1 : 0);
                dataView.setUint8(4, input.left ? 1 : 0);
                dataView.setUint8(5, input.right ? 1 : 0);
                dataView.setUint8(6, input.field ? 1 : 0);
                dataView.setUint8(7, input.fire ? 1 : 0);
                broadcast(dataView);
            }
            if (m.crouch != oldM.crouch) {
                const dataView = new DataView(new ArrayBuffer(3));
                dataView.setUint8(0, protocol.player.toggleCrouch);
                dataView.setUint8(1, 0);
                dataView.setUint8(2, m.crouch ? 1 : 0);
                broadcast(dataView);
            }
            if (m.isCloak != oldM.isCloak) {
                const dataView = new DataView(new ArrayBuffer(3));
                dataView.setUint8(0, protocol.player.toggleCloak);
                dataView.setUint8(1, 0);
                dataView.setUint8(2, m.isCloak ? 1 : 0);
                broadcast(dataView);
            }
            if (m.isHolding != oldM.isHolding || m.holdingTarget?.id != oldM.holdingTarget?.id) {
                const dataView = new DataView(new ArrayBuffer(5));
                dataView.setUint8(0, protocol.player.holdBlock);
                dataView.setUint8(1, 0);
                dataView.setUint8(2, m.isHolding ? 1 : 0);
                dataView.setUint16(3, m.holdingTarget?.id || -1);
                broadcast(dataView);
            }
            if (m.throwCharge != oldM.throwCharge) {
                const dataView = new DataView(new ArrayBuffer(6));
                dataView.setUint8(0, protocol.player.throwChargeUpdate);
                dataView.setUint8(1, 0);
                dataView.setFloat32(2, m.throwCharge);
                broadcast(dataView);
            }
            if (simulation.paused != oldM.paused) {
                const dataView = new DataView(new ArrayBuffer(3));
                dataView.setUint8(0, protocol.player.togglePause);
                dataView.setUint8(1, 0);
                dataView.setUint8(2, simulation.paused ? 1 : 0);
                broadcast(dataView);
            }
            let newTech = [];
            for (const currentTech of tech.tech.filter(a => a.count > 0)) {
                let index = oldM.tech.findIndex(a => a.name == currentTech.name && a.count == currentTech.count);
                if (index == -1) newTech.push(currentTech);
                else oldM.tech = oldM.tech.slice(0, index).concat(oldM.tech.slice(index + 1));
            }
            for (const item of newTech.concat(oldM.tech)) {
                let sortedTech = [...(tech.tech)].sort((a, b) => a.name > b.name ? 1 : -1);
                let index = sortedTech.findIndex(a => a.name == item.name);
                const dataView = new DataView(new ArrayBuffer(5));
                dataView.setUint8(0, protocol.player.tech);
                dataView.setUint8(1, 0);
                dataView.setUint16(2, index);
                dataView.setUint8(4, sortedTech[index].count);
                broadcast(dataView);
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
                pos: { x: m.pos.y, y: m.pos.y },
                tech: tech.tech.filter(a => a.count > 0).map(a => ({ name: a.name, count: a.count }))   ,
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
                    broadcast(dataView);
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
                    broadcast(dataView);
                }
            }

            for (const oldBlock of oldBlocks) {
                if (!body.find(block => block.id == oldBlock.id)) {
                    const dataView = new DataView(new ArrayBuffer(3));
                    dataView.setUint8(0, protocol.block.delete);
                    dataView.setUint16(1, oldBlock.id);
                    broadcast(dataView);
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
                    broadcast(dataView);
                }
            }

            for (const oldPowerup of oldPowerups) {
                if (!powerUp.find(a => a.id == oldPowerup.id)) {
                    const dataView = new DataView(new ArrayBuffer(3));
                    dataView.setUint8(0, protocol.powerup.delete);
                    dataView.setUint16(1, oldPowerup.id);
                    broadcast(dataView);
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
                    broadcast(dataView);
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
                    broadcast(dataView);
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
                    broadcast(dataView);   
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
                    broadcast(dataView);
                }
            }

            for (const oldMob of oldMobs) {
                if (!mob.find(a => a.id == oldMob.id)) {
                    const dataView = new DataView(new ArrayBuffer(3));
                    dataView.setUint8(0, protocol.mob.delete);
                    dataView.setUint16(1, oldMob.id);
                    broadcast(dataView);
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

    await getNewPlayer();
})();