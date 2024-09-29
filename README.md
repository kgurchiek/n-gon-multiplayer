## Protocol
- length does not include id
- all strings use 8-bit length prefix

| ID |          Name         | Length | Fields |
| -- | --------------------- | ------ | ------ |
| 00 | Sync Request          | 0      | |
| 01 | Sync                  | 2+     | difficulty (int8), seed (string) |
| 02 | Player Movement       | 57     | mouseInGame.x (Float64), mouseInGame.y (Float64), onGround (boolean), pos.x (Float64), pos.y (Float64), Vx (Float64), Vy (Float64), walk_cycle (Float32), yOff (Float32) |
| 03 | Player Rotation       | 16     | mouseInGame.x (Float64), mouseInGame.y (Float64) |
| 04 | Set Field             | 4      | field index (int8) |
| 05 | Immune Cycle Update   | 4      | immuneCycle (Float32) |
| 06 | Health Update         | 5      | health (Float32), playerId (Uint8) |
| 07 | Max Health Update     | 5      | maxHealth (Float32), playerId (Uint8) |
| 08 | Energy Update         | 5      | energy (Float32), playerId(Uint8) |
| 09 | Max Energy Update     | 5      | maxEnergy (Float32), playerId (Uint8) |
| 10 | Inputs                | 6      | up (boolean), down (boolean), left (boolean), right (boolean), field (boolean), gun (boolean) |
| 11 | Toggle Crouch         | 1      | crouched (boolean) |
| 12 | Toggle Cloak          | 1      | isCloak (boolean) |
| 13 | Hold Block            | 4      | holding (boolean), blockId (Uint16), playerId (Uint8) |
| 14 | Throw Charge Update   | 6      | throwCharge (Float32), playerId (Uint8) |
| 15 | Toggle Pause          | 1      | paused (boolean) |
| 16 | Block Info Request    | 2      | blockId (Uint16) |
| 17 | Block Info            | 58     | blockId (Uint16), x (Float64), y (Float64), vertices (list: x (Float64), y (Float64)) |
| 18 | Block Position Update | 42     | blockId (Uint16), x (Float64), y (Float64), angle (Float64), xVelocity (Float64), yVelocity (Float64) |
| 19 | Block Vertex Update   | 2+     | blockId (Uint16), vertices (list: x (Float64), y (Float64)) |
| 20 | Delete Block          | 2      | blockId (Uint16) |
| 21 | Powerup Info Request  | 2      | powerupId (Uint16) |
| 22 | Powerup Info          | 43+    | powerupId (Uint16), x (Float64), y (Float64), size (Float64), name (string), collisionFilterCategory (BigUint64), collisionFilterMask (BigUint64) |
| 23 | Powerup Update        | 42     | powerupId (Uint16), x (Float64), y (Float64), size (Float64), collisionFilterCategory (BigUint64), collisionFilterMask (BigUint64) |
| 24 | Delete Powerup        | 2      | powerupId (Uint16) |
| 25 | Mob Info Request      | 2      | mobId (Uint16) |
| 26 | Mob Info              | 92+    | mobId (Uint16), type (Uint8), x (Float64), y (Float64), angle (Float64) sides (Uint8), radius (Float64), color (string), alpha (Float32), stroke (string), isShielded (boolean), isUnblockable (boolean), showHealthBar (boolean) collisionFilterCategory (BigUint64), collisionFilterMask (BigUint64), isBoss (boolean), isFinalBoss (boolean), isInvulnerable (boolean), isZombie (boolean), isGrouper (boolean), isMobBullet (boolean), recall (Float64), health (Float64), radius (Float64), seesPlayer (boolean) |
| 27 | Mob Position Update   | 26     | mobId (Uint16), x (Float64), y (Float64), angle (Float64) |
| 28 | Mob Vertex Update     | 2+     | mobId (Uint16), vertices (list: x (Float64), y (Float64)) |
| 29 | Mob Color Update      | 7+     | mobId (Uint16), color (string), alpha (Float32), stroke (string) |
| 30 | Mob Property Update   | 52     | mobId (Uint16), isShielded (boolean), isUnblockable (boolean), showHealthBar (boolean) collisionFilterCategory (BigUint64), collisionFilterMask (BigUint64), isBoss (boolean), isFinalBoss (boolean), isInvulnerable (boolean), isZombie (boolean), isGrouper (boolean), isMobBullet (boolean), recall (Float64), health (Float64), radius (Float64), seesPlayer (boolean) |
| 31 | Delete Mob            | 2      | mobId (Uint16) |
| 32 | Explosion             | 25+    | x (Float64), y (Float64), radius (Float64), color (string) |
| 33 | Pulse                 | 32     | charge (Float64), angle (Float64), x (Float64), y (Float64) |