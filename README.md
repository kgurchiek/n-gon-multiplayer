## Protocol
(length does not include id)
| ID |       Name        | Length | Fields |
| -- | ----------------- | ------ | ------ |
| 00 | Rotation          | 8      | mouseInGame.x (Float32), mouseInGame.y (Float32) |
| 01 | Movement          | 33     | mouseInGame.x (Float32), mouseInGame.y (Float32), onGround (boolean), pos.x (Float32), pos.y (Float32), Vx (Float32), Vy (Float32), walk_cycle (Float32), yOff (Float32) |
| 02 | Set Field         | 4     | field index (int8) |
| 04 | Health Update     | 1      | health (Float32) |
| 05 | Max Health Update | 1      | maxHealth (Float32) |
| 06 | Energy Update     | 1      | energy (Float32) |
| 07 | Max Energy Update | 1      | maxEnergy (Float32) |
| 08 | Inputs            | 5      | up (boolean), down (boolean), left (boolean), right (boolean), field (boolean) |
| 09 | Toggle Crouch     | 1      | crouched (boolean)
| 10 | Toggle Cloak      | 1      | isCloak (boolean)
| 11 | Sync Request      | 0      | |
| 12 | Sync              | 5+     | difficulty (int8), seed (string) |
| 13 | Explosion         | 13+    | x (Float32), y (Float32), radius (Float32), color (string) |
| 14 | Pulse             | 16     | charge (Float32), angle (Float32), x (Float32), y (Float32) |
| 15 | Grenade           | 17     | x (Float32), y (Float32), angle (Float32), size (Float32), crouch (boolean)
| 16 | Harpoon           | 26     | x (Float32), y (Float32), targetIndex (Uint16), angle (Float32), harpoonSize (Uint16), isReturn (boolean), totalCycles (Float32), isReturnAmmo (boolean), thrust (Float32) |