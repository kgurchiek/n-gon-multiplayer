## Protocol
(length does not include id)
| ID |       Name        | Length | Fields |
| -- | ----------------- | ------ | ------ |
| 00 | Rotation          | 4      | angle (Float32) |
| 01 | Movement          | 29     | angle (Float32), onGround (boolean), pos.x (Float32), pos.y (Float32), Vx (Float32), Vy (Float32), walk_cycle (Float32), yOff (Float32) |
| 02 | Set Field         | 3+     | field index (int), fieldMeterColor (string) |
| 03 | Toggle Field      | 1      | fieldOn (boolean) |
| 04 | Energy Update     | 1      | energy (Float32) |
| 05 | Max Energy Update | 1      | maxEnergy (Float32) |