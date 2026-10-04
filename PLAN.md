# Indoor Cricket App — Build Plan

## Overview

A Next.js web application that simulates indoor cricket using:
- **3D rendering** for the bowler/pitch scene
- **Computer vision** for real-time bat/body tracking via webcam
- **Phone-as-bat** mode using the device gyroscope and accelerometer

---

## Tech Stack (Recommended)

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Deployment | Vercel |
| 3D Scene | Three.js + React Three Fiber |
| Pose / Motion Tracking | MediaPipe Pose (runs in browser, no server needed) |
| Physics / Ball Logic | Custom JS (or Cannon.js for 3D physics) |
| Phone ↔ Web Comms | WebSockets (Socket.io) or WebRTC Data Channel |
| Real-time Sync | Vercel Edge + Upstash or Pusher |
| Styling | Tailwind CSS |
| State Management | Zustand |

---

## Phase-by-Phase Build Plan

### Phase 1 — Project Scaffold & 3D Scene

**Goal:** Get a basic Next.js app running with a rendered pitch and bowler.

1. Initialise Next.js project (`npx create-next-app@latest`)
2. Install Three.js + React Three Fiber + Drei
3. Build the static 3D cricket scene:
   - Pitch (rectangle with crease markings)
   - Stumps at both ends
   - Bowler character (start with a simple rigged model or a placeholder mesh)
   - Camera positioned at the batsman's end, slightly behind the crease
4. Add a basic bowling animation — ball released from bowler's hand, travels down the pitch using a physics arc
5. Deploy a "hello world" scene to Vercel to confirm the pipeline works

**Deliverables:** Playable scene, ball travels from bowler to batsman end

---

### Phase 2 — Camera-Based Body & Bat Tracking

**Goal:** Use the device webcam to detect the user's body position and bat swing.

1. Integrate **MediaPipe Pose** (or **BlazePose** via TensorFlow.js) into the Next.js client
   - Both run fully in the browser — no backend ML server needed
2. Render a live video feed overlay (picture-in-picture) so the user can see themselves
3. Detect key joint landmarks: wrists, elbows, shoulders, hips
4. Infer bat position from the dominant hand's wrist landmark:
   - Track wrist trajectory over ~200 ms to detect a swing
   - Calculate swing **speed** (pixels/frame → real-world estimate) and **direction vector**
5. Collision detection:
   - Project the ball's 3D position into 2D screen space
   - Check if the ball's projected position intersects the estimated bat zone at the moment of swing
6. Shot classification (approximate):

   | Wrist Direction | Shot Type |
   |---|---|
   | Horizontal sweep, right to left | Pull / Sweep |
   | Forward push, upward arc | Drive |
   | Flick downward | Flick / Glance |
   | Late, side angle | Cut |

7. Run calculation based on shot timing + angle → assign runs (0, 1, 2, 4, 6)

**Deliverables:** User can swing in front of webcam and the app registers a shot

---

### Phase 3 — Phone-as-Bat Integration

**Goal:** Use a smartphone as a physical bat via its motion sensors.

1. Build a **companion phone page** (a separate Next.js route, e.g. `/bat`)
   - This page runs in the phone's mobile browser — no app install needed
2. Access `DeviceMotion` and `DeviceOrientation` Web APIs (requires HTTPS — Vercel handles this)
3. Read:
   - `acceleration` → bat swing speed
   - `rotationRate` (alpha/beta/gamma) → bat angle/face direction
4. Stream sensor data in real time to the main game session using **WebSockets** or **WebRTC**:
   - Option A (simpler): Socket.io server on Vercel Edge or a small Node server (Render/Railway)
   - Option B (peer-to-peer, lower latency): WebRTC DataChannel between phone and desktop browser
5. On the game side: combine phone sensor data + camera pose data for a fused shot calculation
   - Phone data provides: speed magnitude, bat angle
   - Camera data provides: body position, approximate bat location in the pitch zone

**Deliverables:** Phone connects via QR code, swinging the phone registers a shot with realistic angle/speed

---

### Phase 4 — Game Logic & Scoring

**Goal:** Turn individual shots into a complete game loop.

1. Innings structure (e.g. 6 balls per over, N overs per game)
2. Scoring engine:
   - Miss / LBW (ball trajectory aimed at stumps + no bat contact) → Out or dot ball
   - Edge detection → possible catch/wicket
   - Clean hit → calculate runs by shot power + angle
3. Ball variation:
   - Random length (full, good, short)
   - Random line (off-stump, middle, leg)
   - Pace variation (fast, medium, spin — different arc curves)
4. Scoreboard UI overlay on the 3D scene
5. Between-ball reset animation (bowler walks back, ball resets)

---

### Phase 5 — Polish & Deployment

1. UI/UX pass — menus, start screen, tutorial overlay
2. Sound effects (ball hitting bat, crowd, commentary snippets)
3. Mobile-responsive layout for the game page (tablet support)
4. Performance optimisation:
   - Lazy-load MediaPipe model
   - Reduce Three.js draw calls
5. Environment variables + Vercel project setup
6. Analytics (Vercel Analytics or PostHog) to track session length / shots played

---

## Key Technical Challenges

### 1. Camera → Real-World Scale
MediaPipe gives you 2D (and partial 3D) landmark positions in normalised coordinates. Converting these to meaningful real-world distances (e.g. "how far did the bat travel?") requires a calibration step — either:
- Ask the user to stand a known distance from the camera at the start
- Use known body proportions (average shoulder width) as a reference scale

### 2. Latency on Phone Sensor Streaming
A shot happens in ~150 ms. WebSocket round-trip over WiFi adds ~5–30 ms — usually fine. WebRTC DataChannel is better if sub-10 ms is needed. Both phone and desktop must be on the same session (use a short room code or QR code).

### 3. `DeviceMotion` Permissions on iOS
iPhones require the user to explicitly grant permission for motion sensors (`DeviceMotionEvent.requestPermission()`). This must be triggered by a user gesture (button tap). Android grants it automatically on HTTPS.

### 4. 3D Ball Trajectory Realism
A cricket ball follows a parabolic arc modified by pitch bounce and potential swing/spin. Start with a simple Bezier curve animation; add physics (Cannon.js) later for more realism.

---

## Suggested File Structure

```
indoor-cricket-app/
├── app/
│   ├── page.tsx              # Main game screen
│   ├── bat/
│   │   └── page.tsx          # Phone companion page (gyroscope input)
│   └── layout.tsx
├── components/
│   ├── scene/
│   │   ├── CricketPitch.tsx
│   │   ├── Bowler.tsx
│   │   ├── Ball.tsx
│   │   └── Stumps.tsx
│   ├── camera/
│   │   ├── PoseTracker.tsx   # MediaPipe integration
│   │   └── BatDetector.tsx
│   ├── game/
│   │   ├── GameEngine.ts     # Shot scoring logic
│   │   └── Scoreboard.tsx
│   └── ui/
│       └── HUD.tsx
├── lib/
│   ├── socket.ts             # WebSocket client
│   └── shotClassifier.ts     # Shot type + run calculation
├── server/
│   └── socket-server.ts      # Node WebSocket server (if not using edge)
└── public/
    └── models/               # 3D assets (.glb files)
```

---

## V1 Scope (Agreed)

Based on initial planning decisions, **V1 will include only:**

- ✅ 3D pitch scene with **placeholder geometry** (boxes, cylinders — no custom models needed)
- ✅ Bowling animation — ball travels down pitch automatically
- ✅ **Webcam swing detection** via MediaPipe Pose
- ✅ Shot classification + run scoring
- ❌ ~~Phone-as-bat~~ — deferred to V2
- ❌ ~~Multiplayer~~ — deferred to V2
- ❌ ~~Custom 3D assets~~ — deferred to V2

This means **no backend server is needed for V1** — everything runs client-side in the browser.

---

## Getting Started — First Steps This Week

1. **Run:** `npx create-next-app@latest indoor-cricket-app --typescript --tailwind --app`
2. **Install:** `npm install three @react-three/fiber @react-three/drei`
3. Build the static pitch scene in `app/page.tsx` using placeholder meshes
4. Add a ball animation travelling down the pitch (no interaction yet)
5. Integrate MediaPipe Pose — render skeleton overlay on webcam feed
6. Test deploy to Vercel — confirm 3D renders and webcam access work in browser

---

## V2+ Roadmap (Deferred Features)

| Feature | Notes |
|---|---|
| Phone-as-bat | WebSocket/WebRTC, DeviceMotion API, QR code pairing |
| Multiplayer | Add PartyKit or Pusher once V1 is stable |
| Custom 3D assets | Source from Sketchfab (CC0) or commission via Fiverr/CGTrader |
| AI bowler variation | Weighted random delivery selection (length + line + pace) |
| Sound effects | Ball hit, crowd, commentary |
| Analytics | Vercel Analytics or PostHog |
