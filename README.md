## Protocol
- length does not include id
- all strings use 8-bit length prefix

| ID |          Name         | Length | Fields |
| -- | --------------------- | ------ | ------ |
| 00 | Rotation              | 16     | mouseInGame.x (Float64), mouseInGame.y (Float64) |
| 01 | Movement              | 57     | mouseInGame.x (Float64), mouseInGame.y (Float64), onGround (boolean), pos.x (Float64), pos.y (Float64), Vx (Float64), Vy (Float64), walk_cycle (Float32), yOff (Float32) |
| 02 | Set Field             | 4      | field index (int8) |
| 03 | Immune Cycle Update   | 4      | immuneCycle (Float32) |
| 04 | Health Update         | 5      | health (Float32), playerId (Uint8) |
| 05 | Max Health Update     | 5      | maxHealth (Float32), playerId (Uint8) |
| 06 | Energy Update         | 5      | energy (Float32), playerId(Uint8) |
| 07 | Max Energy Update     | 5      | maxEnergy (Float32), playerId (Uint8) |
| 08 | Inputs                | 6      | up (boolean), down (boolean), left (boolean), right (boolean), field (boolean), gun (boolean) |
| 09 | Toggle Crouch         | 1      | crouched (boolean) |
| 10 | Toggle Cloak          | 1      | isCloak (boolean) |
| 11 | Sync Request          | 0      | |
| 12 | Sync                  | 2+     | difficulty (int8), seed (string) |
| 13 | Block Info Request    | 2      | blockId (Uint16) |
| 14 | Block Info            | 58     | blockId (Uint16), x (Float64), y (Float64), vertices (list: x (Float64), y (Float64)) |
| 15 | Block Position Update | 42     | blockId (Uint16), x (Float64), y (Float64), angle (Float64), xVelocity (Float64), yVelocity (Float64) |
| 16 | Explosion             | 25+    | x (Float64), y (Float64), radius (Float64), color (string) |
| 17 | Pulse                 | 32     | charge (Float64), angle (Float64), x (Float64), y (Float64) |
| 18 | Grenade               | 31     | x (Float64), y (Float64), angle (Float64), size (Float32), crouch (boolean) |
| 19 | Harpoon               | 45     | x (Float64), y (Float64), targetIndex (Uint32), angle (Float64), harpoonSize (Uint16), isReturn (boolean), totalCycles (Float32), isReturnAmmo (boolean), thrust (Float64), playerId (Uint8) |
| 20 | Missile               | 70     | x (Float64), y (Float64), angle (Float64), speed (Float64), size (Uint16), endCycle (Float32), lookFrequency (Float64), explodeRad (Float64), xForce (Float64), yForce (Float64) |
| 21 | Hold Block            | 4      | holding (boolean), blockId (Uint16), playerId (Uint8) |
| 22 | Throw Charge Update   | 6      | throwCharge (Float32), playerId (Uint8) |
| 23 | Laser                 | 51     | startX (Float64), startY (Float64), endX (Float64), endY (Float64), dmg (Float64), reflections (Uint8), isThickBeam (boolean), push (Float64), playerId (Uint8) |
| 24 | Delete Block          | 2      | blockId (Uint16) |
| 25 | Powerup Info Request  | 2      | powerupId (Uint16) |
| 26 | Powerup Info          | 43+    | powerupId (Uint16), x (Float64), y (Float64), size (Float64), name (string), collisionFilterCategory (BigUint64), collisionFilterMask (BigUint64) |
| 27 | Powerup Update        | 42     | powerupId (Uint16), x (Float64), y (Float64), size (Float64), collisionFilterCategory (BigUint64), collisionFilterMask (BigUint64) |
| 28 | Delete Powerup        | 2      | powerupId (Uint16) |
| 29 | Mob Info Request      | 2      | mobId (Uint16) |
| 30 | Mob Info              | 92+    | mobId (Uint16), type (Uint8), x (Float64), y (Float64), angle (Float64) sides (Uint8), radius (Float64), color (string), alpha (Float32), stroke (string), isShielded (boolean), isUnblockable (boolean), showHealthBar (boolean) collisionFilterCategory (BigUint64), collisionFilterMask (BigUint64), isBoss (boolean), isFinalBoss (boolean), isInvulnerable (boolean), isZombie (boolean), isGrouper (boolean), isMobBullet (boolean), recall (Float64), health (Float64), radius (Float64), seesPlayer (boolean) |
| 31 | Mob Position Update   | 26     | mobId (Uint16), x (Float64), y (Float64), angle (Float64) |
| 32 | Mob Vertex Update     | 2+     | mobId (Uint16), vertices (list: x (Float64), y (Float64)) |
| 33 | Mob Color Update      | 7+     | mobId (Uint16), color (string), alpha (Float32), stroke (string) |
| 34 | Delete Mob            | 2      | mobId (Uint16) |
| 35 | Block Vertex Update   | 2+     | blockId (Uint16), vertices (list: x (Float64), y (Float64)) |
| 36 | Mob Property Update   | 52     | mobId (Uint16), isShielded (boolean), isUnblockable (boolean), showHealthBar (boolean) collisionFilterCategory (BigUint64), collisionFilterMask (BigUint64), isBoss (boolean), isFinalBoss (boolean), isInvulnerable (boolean), isZombie (boolean), isGrouper (boolean), isMobBullet (boolean), recall (Float64), health (Float64), radius (Float64), seesPlayer (boolean) |