## Protocol
(length does not include id)
| ID |       Name        | Length | Fields |
| -- | ----------------- | ------ | ------ |
| 00 | Rotation          | 8      | mouseInGame.x (Float32), mouseInGame.y (Float32) |
| 01 | Movement          | 33     | mouseInGame.x (Float32), mouseInGame.y (Float32), onGround (boolean), pos.x (Float32), pos.y (Float32), Vx (Float32), Vy (Float32), walk_cycle (Float32), yOff (Float32) |
| 02 | Set Field         | 3+     | field index (int) |
| 03 | Toggle Field      | 1      | fieldOn (boolean) |
| 04 | Health Update     | 1      | health (Float32) |
| 05 | Max Health Update | 1      | maxHealth (Float32) |
| 06 | Energy Update     | 1      | energy (Float32) |
| 07 | Max Energy Update | 1      | maxEnergy (Float32) |
| 08 | Inputs            | 5      | up (boolean), down (boolean), left (boolean), right (boolean), field (boolean) |