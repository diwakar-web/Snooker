# Retro Pixel Snooker Wallpaper

An interactive, physics-based, retro-pixelated snooker table background built for the web. This is designed as a relaxing, non-competitive sandbox wallpaper where you can drag and throw balls with realistic momentum, watch them bounce, and sink them into pockets.

## 🚀 Features

- **True 3D Pixel Rendering**: Balls aren't just 2D sprites; their stripes and features are projected dynamically onto 3D spheres that physically roll over the table.
- **Spring Drag Physics**: Dragging balls applies a spring force, allowing them to physically smash through other balls in real-time instead of ghosting through them.
- **Pixel-Art Aesthetic**: Uses low-resolution internal rendering scaled up with CSS for a crisp, authentic 90s DOS/Windows game aesthetic.
- **Satisfying Physics**: Features custom 2D elastic collision logic, cushion bouncing, friction, and a subtle particle dust system.

## 🛠️ Tech Stack

This project was built from scratch without any heavy gaming or physics libraries.

- **React.js**: Used for the component architecture and declarative setup.
- **Vite**: For lightning-fast development, HMR, and optimized production builds.
- **HTML5 Canvas 2D**: The core rendering engine. Everything—from the 3D spherical texture mapping to the subtle drop shadows and pixel font—is drawn manually using the native Canvas API.
- **Vanilla JavaScript Math/Physics**: 
  - **Kinematics & Collisions**: Custom 2D impulse resolution for perfectly elastic ball collisions.
  - **3D Rotation**: Rodrigues' rotation formula is used to calculate and update 3D normal vectors for the balls' textures, ensuring they roll realistically on a 2D plane.
- **Vanilla CSS**: Used minimally for layout, specifically relying on `image-rendering: pixelated` to preserve the crisp, blocky retro art style.

## 🏃‍♂️ Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the Vite dev server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` (or the port provided by Vite) in your browser.
