# Universe from Black Hole: Gaia BH1 Simulator

A real-time, cinematic 3D visualization of a **Cyclic Universe** model. This simulation demonstrates the hypothetical journey of a solar system being consumed by a stellar-mass black hole (Gaia BH1), compressed into a singularity, and subsequently triggering a new Big Bang—suggesting that our universe may be born from the collapse of a previous one.

![Simulation Preview](https://via.placeholder.com/800x450?text=Universe+from+Black+Hole+Preview)

## 🌌 Scientific Theories & Formulas

This project blends established astrophysics with theoretical cosmology.

### 1. Schwarzschild Radius (The Event Horizon)
The point of no return for the invading Black Hole.
$$ R_s = \frac{2GM}{c^2} $$
*   **G**: Gravitational Constant
*   **M**: Mass of the Black Hole (~$1.9 \times 10^{31}$ kg for Gaia BH1)
*   **c**: Speed of Light

### 2. Gravitational Singularity (Math Concepts)
The simulation visualizes the breakdown of spacetime geometry using mathematical analogies found in the dashboard:
*   **The Pole**: $f(x) = 1/x$. As $x \to 0$, $f(x) \to \infty$. Visualized as the infinite stretching of the "Gravity Well" grid.
*   **The Cusp**: $y^2 - x^3 = 0$. Represents the geometric "pinching" of spacetime fabric right before total collapse.

### 3. Cyclic Universe / Multiverse Theory
Based on Conformal Cyclic Cosmology (CCC) and Multiverse hypotheses, where the entropy of a black hole ($S_{BH}$) seeds the complexity of a new universe ($N_{univ}$).
$$ N_{univ} \propto S_{BH} $$
*   **Hypothesis**: The "White Hole" explosion (Big Bang) is the other side of the Black Hole, ejecting consumed matter/energy into a new spacetime coordinate system.

---

## 🚀 Simulation Phases

1.  **Stable**: Our Solar System (Sun, Mercury, Venus, Earth, Mars, Jupiter, Saturn, Asteroid Belt, Comets) in equilibrium.
2.  **Approach (The Intruder)**: Gaia BH1 enters the system. It appears as a gravitational lens (transparent distortion) bending light around it.
3.  **Interaction (Binary Wobble)**: The Sun and Black Hole engage in a gravitational dance. The Sun stretches (tidal forces) and leaks plasma via a "Light Siphon" stream.
4.  **Consumption**: The Sun is devoured, transforming into the Black Hole's accretion disk. The screen fades to pitch black.
5.  **Void (Singularity)**: All matter is compressed into a single, infinitely dense point ($t=0$).
6.  **Rebirth (Big Bang)**: A "White Hole" explosion occurs. Shockwaves expand, forming a protoplanetary disk, and a new solar system coalesces from the debris.

---

## 🎮 Controls

*   **Play/Pause**: Toggle the time flow.
*   **Time Dilation Slider**: Speed up or slow down the simulation (0.1x to 5.0x).
*   **Orbit Controls**: Left Click + Drag to rotate, Right Click + Drag to pan, Scroll to Zoom.
*   **Galaxy Zoom**: Zoom out far (>100 units) to see the Milky Way backdrop.
*   **Interactive Tooltips**: Hover over planets, the Sun, or the Black Hole to see real mass data and descriptions.

---

## 🛠 Tech Stack

*   **React 19**: UI and State Management.
*   **Three.js**: Core 3D Rendering engine.
*   **React Three Fiber (R3F)**: Declarative 3D scene graph.
*   **React Three Drei**: Helpers for Stars, Trails, Sparkles, and HTML overlays.
*   **Tailwind CSS**: Styling for the Dashboard and UI.
*   **Recharts**: Real-time graphing (Stability Metric).

## 📦 Installation & Setup

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm start
    ```

---

*Note: While based on real physics (orbital mechanics, gravity wells), this is an artistic simulation intended for educational and visualization purposes.*