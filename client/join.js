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
}
let players = [];

function fetchPlayer(id, connection) {
    let player = players.find(player => player.id == id);
    if (player) return player;
    const dataView = new DataView(new ArrayBuffer(1));
    dataView.setUint8(0, protocol.game.syncRequest);
    connection.send(dataView.buffer);
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

let player1 = null;
let clientId;
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
        let newPlayer;
        peerRemote.onconnectionstatechange = (e) => console.log('peerRemote', 'onconnectionstatechange', e)
        peerRemote.ondatachannel = (e) => {
            // peerLocal started a data channel, so connect to it here
            // console.log('peerRemote', 'ondatachannel', e);
            const connection = e.channel;
            newPlayer = new Player(0, connection);
            players.push(newPlayer);
            player1 = newPlayer;
            connection.onopen = function(e) {
                // console.log('dcRemote', 'onopen', e);
            };
            connection.onmessage = async (message) => {
                // console.log('dcRemote', 'onmessage', message.data);
                const data = typeof message.data.arrayBuffer == 'function' ? new DataView(await message.data.arrayBuffer()) : new DataView(message.data);
                const id = data.getUint8(0);
                switch (id) {
                    case protocol.game.sync: {
                        clientId = data.getUint8(1);
                        simulation.difficultyMode = data.getUint8(2);
                        Math.initialSeed = new TextDecoder().decode(data.buffer.slice(4, 4 + data.getUint8(2)));
                        Math.seed = Math.abs(Math.hash(Math.initialSeed));
                        let index = 4 + data.getUint8(3);
                        for (let i = index; i < data.byteLength;) {
                            const playerId = data.getUint8(i);
                            let techCount = data.getUint16(i + 95);    
                            if (playerId == clientId) {
                                m.health = data.getFloat32(i + 63);
                                m.maxHealth = data.getFloat32(i + 67);
                                if (m.health > m.maxHealth) m.health = m.maxHealth;
                                m.displayHealth();
                                m.energy = data.getFloat32(i + 71);
                                m.maxEnergy = data.getFloat32(i + 75);
                            } else {
                                let playerIndex = players.findIndex(player => player.id == playerId);
                                if (playerIndex == -1) {
                                    const newPlayer = new Player(playerId);
                                    newPlayer.spawn();
                                    players.push(newPlayer);
                                    playerIndex = players.length - 1;
                                }
                                const player = players[playerIndex];
                                player.pos.x = data.getFloat64(i + 1);
                                player.pos.y = data.getFloat64(i + 9);
                                player.mouseInGame.x = data.getFloat64(i + 17);
                                player.mouseInGame.y = data.getFloat64(i + 25);
                                player.onGround = data.getUint8(33) == 1;
                                player.Vx = data.getFloat64(34);
                                player.Vy = data.getFloat64(42);
                                player.walk_cycle = data.getFloat32(50);
                                player.yOff = data.getFloat32(54);
                                player.fieldMode = data.getUint8(58);
                                player.immuneCycle = data.getFloat32(59);
                                player.health = data.getFloat32(i + 63);
                                player.maxHealth = data.getFloat32(i + 67);
                                player.energy = data.getFloat32(i + 71);
                                player.maxEnergy = data.getFloat32(i + 75);
                                player.input.up = data.getUint8(i + 79) == 1;
                                player.input.down = data.getUint8(i + 80) == 1;
                                player.input.left = data.getUint8(i + 81) == 1;
                                player.input.right = data.getUint8(i + 82) == 1;
                                player.input.field = data.getUint8(i + 83) == 1;
                                player.input.fire = data.getUint8(i + 84) == 1;
                                player.crouch = data.getUint8(i + 85) == 1;
                                player.isCloak = data.getUint8(i + 86) == 1;
                                player.isHolding = data.getUint8(i + 87) == 1;
                                if (player.isHolding) {
                                    player.holdingTarget = body.find(a => a.id == data.getUint16(i + 88));
                                    player.throwCharge = data.getFloat32(i + 90);
                                }
                                player.paused = data.getUint8(i + 94) == 1;
                                if (newPlayer.hitbox != null) {
                                    Matter.Body.setPosition(player.hitbox, { x: player.pos.x, y: player.pos.y + player.yOff - 24.714076782448295});
                                    Matter.Body.setVelocity(player.hitbox, { x: player.Vx, y: player.Vy }); 
                                }
                                for (let j = 0; j < techCount; j++) {
                                    let playerTech = [...(tech.tech)].sort((a, b) => a.name > b.name ? 1 : -1)[data.getUint16(i + 97 + j * 3)];
                                    player.tech[playerTech.name] = data.getUint8(i + 99 + j * 3);
                                }
                            }
                            i += 97 + techCount * 3;
                        }
                        break;
                    }
                    case protocol.player.rotation: {
                        const player = fetchPlayer(data.getUint8(1), connection);
                        if (!player) return;
                        player.mouseInGame.x = data.getFloat64(2);
                        player.mouseInGame.y = data.getFloat64(10);
                        break;
                    }
                    case protocol.player.movement: {
                        const player = fetchPlayer(data.getUint8(1), connection);
                        if (!player) return;
                        player.mouseInGame.x = data.getFloat64(2);
                        player.mouseInGame.y = data.getFloat64(10);
                        player.onGround = data.getUint8(18) == 1;
                        player.pos.x = data.getFloat64(19);
                        player.pos.y = data.getFloat64(27);
                        player.Vx = data.getFloat64(35);
                        player.Vy = data.getFloat64(43);
                        player.walk_cycle = data.getFloat32(51);
                        player.yOff = data.getFloat32(55);
                        if (player.hitbox != null) {
                            Matter.Body.setPosition(player.hitbox, { x: player.pos.x, y: player.pos.y + player.yOff - 24.714076782448295});
                            Matter.Body.setVelocity(player.hitbox, { x: player.Vx, y: player.Vy });
                        }
                        break;
                    }
                    case protocol.player.setField: {
                        const player = fetchPlayer(data.getUint8(1), connection);
                        if (!player) return;
                        player.fieldMode = data.getUint8(2);
                        player.fieldMeterColor = fieldData[player.fieldMode].fieldMeterColor;
                        player.fieldRange = fieldData[player.fieldMode].fieldRange;
                        player.fieldPosition = { x: player.pos.x, y: player.pos.y };
                        player.fieldAngle = player.angle;
                        player.fieldArc = 0.2;
                        break;
                    }
                    case protocol.player.immuneCycleUpdate: {
                        const player = fetchPlayer(data.getUint8(1), connection);
                        if (!player) return;
                        player.immuneCycle = data.getFloat32(2);
                        break;
                    }
                    case protocol.player.healthUpdate: {
                        if (data.getUint8(1) == clientId) {
                            m.health = data.getFloat32(2);
                            if (m.health > m.maxHealth) m.health = m.maxHealth;
                            m.displayHealth();
                        } else {
                            const player = fetchPlayer(data.getUint8(1), connection);
                            if (!player) return;
                            player.health = data.getFloat32(2);
                        }
                        break;
                    }
                    case protocol.player.maxHealthUpdate: {
                        if (data.getUint8(1) == clientId) {
                            m.maxHealth = data.getFloat32(2);
                            if (m.health > m.maxHealth) m.health = m.maxHealth;
                            m.displayHealth();
                        } else {
                            const player = fetchPlayer(data.getUint8(1), connection);
                            if (!player) return;
                            player.maxHealth = data.getFloat32(2);
                        }
                        break;
                    }
                    case protocol.player.energyUpdate: {
                        if (data.getUint8(1) == clientId) m.energy = data.getFloat32(2);
                        else {
                            const player = fetchPlayer(data.getUint8(1), connection);
                            if (!player) return;
                            player.energy = data.getFloat32(2);
                        }
                        break;
                    }
                    case protocol.player.maxEnergyUpdate: {
                        if (data.getUint8(1) == clientId) m.maxEnergy = data.getFloat32(2);
                        else {
                            const player = fetchPlayer(data.getUint8(1), connection);
                            if (!player) return;
                            player.maxEnergy = data.getFloat32(2);
                        }
                        break;
                    }
                    case protocol.player.inputs: {
                        const player = fetchPlayer(data.getUint8(1), connection);
                        if (!player) return;
                        player.input.up = data.getUint8(2) == 1;
                        player.input.down = data.getUint8(3) == 1;
                        player.input.left = data.getUint8(4) == 1;
                        player.input.right = data.getUint8(5) == 1;
                        player.input.field = data.getUint8(6) == 1;
                        player.input.fire = data.getUint8(7) == 1;
                        break;
                    }
                    case protocol.player.toggleCrouch: {
                        const player = fetchPlayer(data.getUint8(1), connection);
                        if (!player) return;
                        player.crouch = data.getUint8(2) == 1;
                        break;
                    }
                    case protocol.player.toggleCloak: {
                        const player = fetchPlayer(data.getUint8(1), connection);
                        if (!player) return;
                        player.isCloak = data.getUint8(2) == 1;
                        break;
                    }
                    case protocol.player.holdBlock: {
                        const player = fetchPlayer(data.getUint8(1), connection);
                        if (!player) return;
                        player.isHolding = data.getUint8(2) == 1;
                        if (!player.isHolding && player.holdingTarget) {
                            player.holdingTarget.collisionFilter.category = cat.body;
                            player.holdingTarget.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet;
                        }
                        player.holdingTarget = data.getUint16(3) == -1 ? null : body.find(block => block.id == data.getUint16(3));
                        if (player.isHolding) {
                            player.holdingTarget.collisionFilter.category = 0;
                            player.holdingTarget.collisionFilter.mask = 0;
                        }
                        break;
                    }
                    case protocol.player.throwChargeUpdate: {
                        const player = fetchPlayer(data.getUint8(1), connection);
                        if (!player) return;
                        player.throwCharge = data.getFloat32(2);
                        break;
                    }
                    case protocol.player.togglePause: {
                        const player = fetchPlayer(data.getUint8(1), connection);
                        player.paused = data.getUint8(2) == 1;
                        break;
                    }
                    case protocol.player.tech: {
                        const player = fetchPlayer(data.getUint8(1), connection);
                        let name = [...(tech.tech)].sort((a, b) => a.name > b.name ? 1 : -1)[data.getUint16(2)].name;
                        let count = data.getUint8(4);
                        if (player.tech[name]) player.tech[name] = count;
                        else player.tech[name] = count;
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
                            connection.send(dataView);
                        }
                        break;
                    }
                    case protocol.block.vertexUpdate: {
                        const block = body.find(a => a.id == data.getUint16(1));
                        if (block == null) {
                            const dataView = new DataView(new ArrayBuffer(3));
                            dataView.setUint8(0, protocol.block.infoRequest);
                            dataView.setUint16(1, data.getUint16(1));
                            connection.send(dataView);
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
                            connection.send(dataView);
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
                        if (index != -1) {
                            Matter.Composite.remove(engine.world, powerUp[index]);
                            powerUp = powerUp.slice(0, index).concat(powerUp.slice(index + 1));
                        }
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
                                        if ((player.speed > 1 && !m.isCloak)) { // TODO: activate if the player moves
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
                            connection.send(dataView);
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
                            connection.send(dataView);
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
                            connection.send(dataView);
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
                            connection.send(dataView);
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
                }
            };
            connection.onerror = function(e) {
                console.error('dcRemote', 'onerror', e);
            };
            connection.onclose = function(e) {
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
    let oldPowerups = [];

    const oldStartGame = simulation.startGame;
    simulation.startGame = async () => {
        // sync request
        Math.initialSeed = null;
        const dataView = new DataView(new ArrayBuffer(1));
        dataView.setUint8(0, protocol.game.syncRequest);
        player1.connection.send(dataView);
        
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
            player1.connection.send(dataView);
        }

        for (const player of players) player.spawn();
        simulation.ephemera.push({ name: 'Broadcast', count: 0, do: () => {
            if (m.onGround != oldM.onGround || m.pos.x != oldM.pos.x || m.pos.y != oldM.pos.y || m.Vx != oldM.Vx || m.Vy != oldM.Vy || m.walk_cycle != oldM.walk_cycle || m.yOff != oldM.yOff) {
                const dataView = new DataView(new ArrayBuffer(59));
                dataView.setUint8(0, protocol.player.movement);
                dataView.setUint8(1, clientId);
                dataView.setFloat64(2, simulation.mouseInGame.x);
                dataView.setFloat64(10, simulation.mouseInGame.y);
                dataView.setUint8(18, m.onGround ? 1 : 0);
                dataView.setFloat64(19, m.pos.x);
                dataView.setFloat64(27, m.pos.y);
                dataView.setFloat64(35, m.Vx);
                dataView.setFloat64(43, m.Vy);
                dataView.setFloat32(51, m.walk_cycle);
                dataView.setFloat32(55, m.yOff);
                player1.connection.send(dataView);
            } else if (simulation.mouseInGame.x != oldM.mouseInGame.x || simulation.mouseInGame.y != oldM.mouseInGame.y) {
                const dataView = new DataView(new ArrayBuffer(18));
                dataView.setUint8(0, protocol.player.rotation);
                dataView.setUint8(1, clientId);
                dataView.setFloat64(2, simulation.mouseInGame.x);
                dataView.setFloat64(10, simulation.mouseInGame.y);
                player1.connection.send(dataView);
            }
            if (m.fieldMode != oldM.fieldMode) {
                const dataView = new DataView(new ArrayBuffer(3));
                dataView.setUint8(0, protocol.player.setField);
                dataView.setUint8(1, clientId);
                dataView.setUint8(2, m.fieldMode);
                player1.connection.send(dataView);
            }
            if (m.immuneCycle != oldM.immuneCycle) {
                const dataView = new DataView(new ArrayBuffer(6));
                dataView.setUint8(0, protocol.player.immuneCycleUpdate);
                dataView.setUint8(1, clientId);
                dataView.setFloat32(2, m.immuneCycle);
                player1.connection.send(dataView);
            }
            if (m.health != oldM.health) {
                const dataView = new DataView(new ArrayBuffer(6));
                dataView.setUint8(0, protocol.player.healthUpdate);
                dataView.setUint8(1, clientId);
                dataView.setFloat32(2, m.health);
                player1.connection.send(dataView);
            }
            if (m.maxHealth != oldM.maxHealth) {
                const dataView = new DataView(new ArrayBuffer(6));
                dataView.setUint8(0, protocol.player.maxHealthUpdate);
                dataView.setUint8(1, clientId);
                dataView.setFloat32(2, m.maxHealth);
                player1.connection.send(dataView);
            }
            if (m.energy != oldM.energy) {
                const dataView = new DataView(new ArrayBuffer(6));
                dataView.setUint8(0, protocol.player.energyUpdate);
                dataView.setUint8(1, clientId);
                dataView.setFloat32(2, m.energy);
                player1.connection.send(dataView);
            }
            if (m.maxEnergy != oldM.maxEnergy) {
                const dataView = new DataView(new ArrayBuffer(6));
                dataView.setUint8(0, protocol.player.maxEnergyUpdate);
                dataView.setUint8(1, clientId);
                dataView.setFloat32(2, m.maxEnergy);
                player1.connection.send(dataView);
            }
            if (input.up != oldM.input.up || input.down != oldM.input.down || input.left != oldM.input.left || input.right != oldM.input.right || input.field != oldM.input.field || input.fire != oldM.input.fire) {
                const dataView = new DataView(new ArrayBuffer(8));
                dataView.setUint8(0, protocol.player.inputs);
                dataView.setUint8(1, clientId);
                dataView.setUint8(2, input.up ? 1 : 0);
                dataView.setUint8(3, input.down ? 1 : 0);
                dataView.setUint8(4, input.left ? 1 : 0);
                dataView.setUint8(5, input.right ? 1 : 0);
                dataView.setUint8(6, input.field ? 1 : 0);
                dataView.setUint8(7, input.fire ? 1 : 0);
                player1.connection.send(dataView);
            }
            if (m.crouch != oldM.crouch) {
                const dataView = new DataView(new ArrayBuffer(3));
                dataView.setUint8(0, protocol.player.toggleCrouch);
                dataView.setUint8(1, clientId);
                dataView.setUint8(2, m.crouch ? 1 : 0);
                player1.connection.send(dataView);
            }
            if (m.isCloak != oldM.isCloak) {
                const dataView = new DataView(new ArrayBuffer(3));
                dataView.setUint8(0, protocol.player.toggleCloak);
                dataView.setUint8(1, clientId);
                dataView.setUint8(2, m.isCloak ? 1 : 0);
                player1.connection.send(dataView);
            }
            if (m.isHolding != oldM.isHolding || m.holdingTarget?.id != oldM.holdingTarget?.id) {
                const dataView = new DataView(new ArrayBuffer(6));
                dataView.setUint8(0, protocol.player.holdBlock);
                dataView.setUint8(1, clientId);
                dataView.setUint8(2, m.isHolding ? 1 : 0);
                dataView.setUint16(3, m.holdingTarget?.id || -1);
                dataView.setUint8(5, 2); // TODO: player id
                player1.connection.send(dataView);
            }
            if (m.throwCharge != oldM.throwCharge) {
                const dataView = new DataView(new ArrayBuffer(7));
                dataView.setUint8(0, protocol.player.throwChargeUpdate);
                dataView.setUint8(1, clientId);
                dataView.setFloat32(2, m.throwCharge);
                player1.connection.send(dataView);
            }
            if (simulation.paused != oldM.paused) {
                const dataView = new DataView(new ArrayBuffer(3));
                dataView.setUint8(0, protocol.player.togglePause);
                dataView.setUint8(1, clientId);
                dataView.setUint8(2, simulation.paused ? 1 : 0);
                player1.connection.send(dataView);
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
                player1.connection.send(dataView);
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
                tech: tech.tech.filter(a => a.count > 0).map(a => ({ name: a.name, count: a.count })),
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
                    player1.connection.send(dataView);
                }
            }

            oldPowerups.splice(0);
            for (const powerup of powerUp) oldPowerups.push({ id: powerup.id, position: { x: powerup.position.x, y: powerup.position.y }, size: powerup.size, collisionFilter: { category: powerup.collisionFilter.category, mask: powerup.collisionFilter.mask }});
        }})
    }
})();