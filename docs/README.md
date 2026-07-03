# Documentation

This folder will hold architecture notes, API contracts, and experiment write-ups as the platform grows.

The current simulation flow uses `POST /maze/generate` to create a grid, then
opens `WS /ws/simulation` for live solver visualization. The first WebSocket
message from the client selects the algorithm and grid:

```json
{"algorithm":"astar","grid":[[0,0],[0,0]]}
```

The stream emits one event for each explored cell, one event for each final path
cell, and then a completion event:

```json
{"event":"visit","cell":[0,0]}
{"event":"path","cell":[1,1]}
{"event":"complete"}
```
