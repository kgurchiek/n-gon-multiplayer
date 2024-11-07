## Protocol
- length does not include id
- all strings use 8-bit length prefix

| ID |          Name         | Length | Fields |
| -- | --------------------- | ------ | ------ |
| 00 | Sync Request          | 0      | |
| 01 | Sync                  | 3+     | clientId (Uint8), difficulty (Uint8), seed (string), players (list (95): playerId (Uint8), x (Float64), y (Float64), mouseX (Float64), mouseY (Float64), onGround (boolean), xVelocity (Float64), yVelocity (Float64), walkCycle (Float32), yOff (Float32), fieldMode (Uint8), immuneCycle (Float32), health (Float32), maxHealth (Float32), energy (Float32), maxEnergy (Float32), up (boolean), down (boolean), left (boolean), right (boolean), field (boolean), fire (boolean), crouched (boolean), isCloak (boolean), isHolding (boolean), blockId (Uint16), throwCharge (Float32), paused (boolean)) |
| 02 | Player Movement       | 58     | playerId (Uint8), mouseX (Float64), mouseY (Float64), onGround (boolean), x (Float64), y (Float64), xVelocity (Float64), yVelocity (Float64), walkCycle (Float32), yOff (Float32) |
| 03 | Player Rotation       | 17     | playerId (Uint8), mouseX (Float64), mouseY (Float64) |
| 04 | Set Field             | 2      | playerId (Uint8), fieldMode (Uint8) |
| 05 | Immune Cycle Update   | 5      | playerId (Uint8), immuneCycle (Float32) |
| 06 | Health Update         | 5      | playerId (Uint8), health (Float32) |
| 07 | Max Health Update     | 5      | playerId (Uint8), maxHealth (Float32) |
| 08 | Energy Update         | 5      | playerId (Uint8), energy (Float32) |
| 09 | Max Energy Update     | 5      | playerId (Uint8), maxEnergy (Float32) |
| 10 | Inputs                | 7      | playerId (Uint8), up (boolean), down (boolean), left (boolean), right (boolean), field (boolean), fire (boolean) |
| 11 | Toggle Crouch         | 2      | playerId (Uint8), crouched (boolean) |
| 12 | Toggle Cloak          | 2      | playerId (Uint8), isCloak (boolean) |
| 13 | Hold Block            | 4      | playerId (Uint8), isHolding (boolean), blockId (Uint16) |
| 14 | Throw Charge Update   | 5      | playerId (Uint8), throwCharge (Float32) |
| 15 | Toggle Pause          | 2      | playerId (Uint8), paused (boolean) |
| 16 | Tech                  | 3+     | playerId (Uint8), add/remove (boolean), tech (string) |
| 17 | Block Info Request    | 2      | blockId (Uint16) |
| 18 | Block Info            | 58     | blockId (Uint16), x (Float64), y (Float64), vertices (list (8): x (Float64), y (Float64)) |
| 19 | Block Position Update | 42     | blockId (Uint16), x (Float64), y (Float64), angle (Float64), xVelocity (Float64), yVelocity (Float64) |
| 20 | Block Vertex Update   | 2+     | blockId (Uint16), vertices (list (8): x (Float64), y (Float64)) |
| 21 | Delete Block          | 2      | blockId (Uint16) |
| 22 | Powerup Info Request  | 2      | powerupId (Uint16) |
| 23 | Powerup Info          | 43+    | powerupId (Uint16), x (Float64), y (Float64), size (Float64), name (string), collisionFilterCategory (BigUint64), collisionFilterMask (BigUint64) |
| 24 | Powerup Update        | 42     | powerupId (Uint16), x (Float64), y (Float64), size (Float64), collisionFilterCategory (BigUint64), collisionFilterMask (BigUint64) |
| 25 | Delete Powerup        | 2      | powerupId (Uint16) |
| 26 | Mob Info Request      | 2      | mobId (Uint16) |
| 27 | Mob Info              | 92+    | mobId (Uint16), type (Uint8), x (Float64), y (Float64), angle (Float64) sides (Uint8), radius (Float64), color (string), alpha (Float32), stroke (string), isShielded (boolean), isUnblockable (boolean), showHealthBar (boolean) collisionFilterCategory (BigUint64), collisionFilterMask (BigUint64), isBoss (boolean), isFinalBoss (boolean), isInvulnerable (boolean), isZombie (boolean), isGrouper (boolean), isMobBullet (boolean), recall (Float64), health (Float64), radius (Float64), seesPlayer (boolean) |
| 28 | Mob Position Update   | 26     | mobId (Uint16), x (Float64), y (Float64), angle (Float64) |
| 29 | Mob Vertex Update     | 2+     | mobId (Uint16), vertices (list (8): x (Float64), y (Float64)) |
| 30 | Mob Color Update      | 7+     | mobId (Uint16), color (string), alpha (Float32), stroke (string) |
| 31 | Mob Property Update   | 52     | mobId (Uint16), isShielded (boolean), isUnblockable (boolean), showHealthBar (boolean) collisionFilterCategory (BigUint64), collisionFilterMask (BigUint64), isBoss (boolean), isFinalBoss (boolean), isInvulnerable (boolean), isZombie (boolean), isGrouper (boolean), isMobBullet (boolean), recall (Float64), health (Float64), radius (Float64), seesPlayer (boolean) |
| 32 | Delete Mob            | 2      | mobId (Uint16) |