# 🧠 AI vs Algorithms: Live Maze Learning & Racing Platform

A real-time interactive platform that visualizes how classical search algorithms and Reinforcement Learning agents solve the same maze problem.

Watch deterministic algorithms like **BFS, DFS, Dijkstra, and A*** race against learning-based agents such as **Q-Learning, SARSA, and DQN** while observing every decision, exploration pattern, and learning behavior in real time.

---

## 🚀 Project Overview

Traditional pathfinding algorithms solve mazes using predefined rules and heuristics, whereas Reinforcement Learning (RL) agents learn optimal navigation purely through trial and error.

This project provides a unified experimentation platform to:

* Compare classical search algorithms with RL agents.
* Visualize how learning evolves over time.
* Explain agent decisions using interpretable AI techniques.
* Benchmark systems performance using a C-accelerated simulation core.
* Explore adversarial and curriculum-based learning environments.

---

## ✨ Key Features

### 🔍 Classical Search Algorithms

* Breadth First Search (BFS)
* Depth First Search (DFS)
* Dijkstra's Algorithm
* A* Search

Visualize exploration patterns and compare efficiency, optimality, and search behavior.

---

### 🤖 Reinforcement Learning Agents

* Q-Learning
* SARSA
* Deep Q-Network (DQN) *(planned)*

Observe agents learning from scratch through repeated interaction with the environment.

---

### 📊 Explainable AI Dashboard

* Live Q-value visualization
* Action selection explanation
* Epsilon-greedy exploration indicators
* Confidence meter
* Policy heatmaps

Understand *why* an agent chooses a particular action at every step.

---

### 🏁 Real-Time Race Arena

* Algorithm vs Algorithm races
* Human vs AI races
* Simultaneous solver execution
* Live leaderboard and timing metrics

---

### 🧩 Interactive Maze Environment

* Custom maze editor
* Dynamic obstacle placement
* Random maze generation
* Adversarial maze generation *(planned)*

---

### 📈 Analytics Dashboard

Compare agents using metrics such as:

* Path optimality
* Exploration ratio
* Convergence speed
* Learning efficiency
* Safety score
* Computational performance

Includes automatically generated **Algorithm Personality Profiles**.

---

### ⚡ Systems Performance Benchmarking

Performance-critical simulation logic is implemented in **C** and integrated with Python.

Benchmark:

* Pure Python implementation
* C-accelerated implementation

Live performance graphs display execution time and throughput.

---

## 🏗️ Architecture

```text
+-------------------------------------------------------+
|                    React Frontend                     |
|-------------------------------------------------------|
| Maze Arena | Analytics | Explainability | Replays    |
+------------------------↑------------------------------+
                         |
                    WebSockets
                         |
+------------------------↓------------------------------+
|                 FastAPI Backend                       |
|-------------------------------------------------------|
| RL Training | Classical Algorithms | API Layer       |
+------------------------↑------------------------------+
                         |
                   ctypes / C Extension
                         |
+------------------------↓------------------------------+
|                 C Simulation Core                    |
|-------------------------------------------------------|
| Environment Step | Q-table Updates | Benchmarks      |
+-------------------------------------------------------+
```

---

## 🛠️ Tech Stack

### Frontend

* React
* TypeScript
* Framer Motion
* HTML5 Canvas / D3.js
* Tailwind CSS

### Backend

* FastAPI
* Python
* WebSockets

### AI / ML

* Q-Learning
* SARSA
* DQN *(planned)*
* Curriculum Learning

### Systems

* C
* ctypes / Python C Extensions

### Tools

* Git & GitHub
* Linux / WSL / macOS

---

## 📂 Planned Modules

* [ ] Grid Environment
* [ ] BFS Visualization
* [ ] DFS Visualization
* [ ] Dijkstra Visualization
* [ ] A* Visualization
* [ ] Q-Learning Agent
* [ ] SARSA Agent
* [ ] DQN Agent
* [ ] Live Learning Curves
* [ ] Explainability Dashboard
* [ ] Heatmap Visualization
* [ ] Confidence Meter
* [ ] C Acceleration Layer
* [ ] Benchmark Dashboard
* [ ] Human vs AI Race Mode
* [ ] Maze Editor
* [ ] Curriculum Learning
* [ ] Adversarial Maze Generator
* [ ] Replay System

---

## 🎯 Motivation

Most educational tools either demonstrate classical algorithms or machine learning in isolation.

This project bridges both worlds by enabling users to directly compare deterministic search techniques with learning-based agents, making algorithmic behavior and AI decision-making visually intuitive and explainable.

---

## 📸 Demo

> Screenshots and demo videos will be added as development progresses.

---

## 📚 Future Enhancements

* Multi-agent cooperative RL
* Procedural maze generation using Genetic Algorithms
* Advanced explainability techniques
* Distributed training
* Cloud deployment
* 3D visualization mode

---

## 👨‍💻 Author

**Veeksha V Shetty**

B.E. Computer Science Engineering
RV College of Engineering, Bengaluru

---

*"Algorithms know the path. AI learns the path."*

