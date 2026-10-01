# MemoryBridge 🌉

> **Landmark-based walking navigation for elderly, neurodivergent, and navigation-anxious walkers.**  
> *Never shows numeric distances. Every instruction uses landmark + color + icon.*

Built in a single hackathon session with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Web Speech API**.

---

## 🚀 Quick Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the local development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**  
   Navigate to [`http://localhost:3000`](http://localhost:3000) (mobile view recommended in DevTools or on a phone).  
   Open a second window/tab to [`http://localhost:3000/caregiver`](http://localhost:3000/caregiver) for the live multi-screen caregiver sync.

---

## ⏱️ 60-Second Stage Demo Script

Follow these exact steps on stage for maximum audience impact:

1. **(00:00 - 00:15) The Hook & Voice Destination**
   - Show the mobile screen: *"Traditional maps say 'in 300 meters turn right', which causes panic for elderly and anxious walkers. MemoryBridge uses zero numbers."*
   - Tap the huge **"Where to?"** microphone button.
   - Say or tap: *"The new cafe near the market"*.
   - Point out the voice confirmation dialog: *"Did you mean Cafe Aroma?"* -> Tap **"YES, START"**. Spoken TTS immediately guides you.

2. **(00:15 - 00:30) Hero Navigation & Landmark Collector**
   - Show the two-pane walk screen: the **OpenStreetMap map on top** with the green route line and emoji landmark pins, and the **large landmark instruction card below**.
   - Say: *"The map is only context. The instruction is a landmark, a colour and an icon — never a number."*
   - Tap the landmark card: confetti bursts and **+10 Explorer Points** are awarded!
   - Toggle **"Simulate Walk"** to show hands-free progress: the blue dot glides along the green line and the card advances to the next landmark.
   - Tap **"Calm route"** to swap to the quieter dashed pathway, and **"Demo: Simulate Off-Route"** to turn the route line red.

3. **(00:30 - 00:45) "I'm Lost" Radar & Breadcrumb Flashback**
   - Tap **"I'm Lost"**: The Compass Radar opens, asking: *"Look left: do you see the big red Domino's sign?"* Tap **"YES, I SEE IT!"** -> Watch the animated *"You are here"* re-anchor back to that exact step.
   - Tap **"Flashback"**: A 5-second animated memory loop replays visited steps (*"10 min ago: Metro Station -> 5 min ago: ICICI Bank -> Now: You are here"*).

4. **(00:45 - 01:00) The "Showstopper" Multi-Screen Caregiver Alert & Safe Haven**
   - Point to your second screen/tab at `/caregiver`.
   - On the walker phone, tap the red button **"DEMO BUTTON: SIMULATE OFF-ROUTE"**.
   - Watch the Caregiver Guardian Portal instantly flash red with an active alert and deviation notification (synced via zero-latency BroadcastChannel).
   - Tap the floating red **"SAFE HAVEN"** button to show the nearest calm shelter (*24/7 MedPlus Pharmacy with green cross directions*), one-tap caregiver alert, and emergency call.

---

## 🗺️ Feature 1 — Map + Navigate Screen

The walk screen is now a real map, not a diagram:

- **Map occupies ~45% of the screen, the landmark instruction card ~55%.** The map is
  deliberately secondary: a glanceable route overview above a large, high-contrast card.
- **`react-leaflet` + OpenStreetMap tiles**, loaded dynamically with SSR disabled
  (`DynamicMap` → `ssr: false`) because Leaflet touches `window` at import time.
- **Route lines are explained in words, never numbers:**
  - 🟢 **Green** = the route you are walking
  - ⬜ **Grey dashed** = the alternative route
  - 🔴 **Red dashed** = you have walked off the route
- **Landmark markers** use emoji/icon + coloured ring + written text label. Tapping a pin
  re-anchors navigation to that landmark and the same large instruction card updates.
- **Floating controls:** *Follow me*, *Live GPS*, *Calm route*, *Hazards* (surface layer),
  plus a legend that names every colour out loud.
- **GPS:** `navigator.geolocation.watchPosition` is used when the walker enables *Live GPS*.
  Without it — on any desktop, or when permission is denied — the demo keeps working with the
  **Simulate Walk** toggle and a walker dot that glides along the route line.
- **Routing:** `LocalRoutingProvider` supplies the offline demo route (primary, alternative and
  calm variants). Set `NEXT_PUBLIC_ROUTING_API_URL` to point at a self-hosted OSRM instance; it
  always falls back to the offline demo route on error, so the stage demo never depends on a
  public routing server.
- **Accessibility:** 48px+ touch targets everywhere, icon **and** text labels, colour names
  written out in full, keyboard-focusable map pins, and full `prefers-reduced-motion` support.

### Optional environment variables

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_TILE_LAYER_URL` | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | Swap the OpenStreetMap tile template. OSM attribution is always rendered. |
| `NEXT_PUBLIC_ROUTING_API_URL` | *(unset)* | Self-hosted OSRM base URL. Unset = fully offline demo routing. |

---

## 🔍 What's Real vs. What's Simulated

| Feature | Implementation Status | Technical Details |
|---|---|---|
| **Map (OpenStreetMap)** | **REAL** | `react-leaflet` map, client-only loaded, live OSM tiles, attribution preserved, configurable tile template. |
| **Landmark Markers** | **REAL** | Custom Leaflet `divIcon`s: emoji + coloured ring + written label, focusable and tappable. |
| **Voice Recognition** | **REAL** | Native browser `webkitSpeechRecognition` / `SpeechRecognition` API with typed fallback & quick chips. |
| **Spoken Directions (TTS)** | **REAL** | Native `SpeechSynthesis` API with natural pitch & rate tuned for elderly comprehension. |
| **High Contrast & Dark Mode** | **REAL** | Full contrast mode with WCAG AAA compliant bright yellow on black palette. |
| **Cross-Tab Caregiver Sync** | **REAL** | Real-time cross-tab synchronization via `BroadcastChannel` with `localStorage` storage-event fallback. |
| **Community Spotter Portal** | **REAL** | Image upload with client-side preview, color swatch picker, and persistent `localStorage` database. |
| **Gamification & Badges** | **REAL** | `canvas-confetti` fireworks, score counter, and dynamic badge unlocks (*Explorer* at 3, *Landmark Pro* at 6). |
| **Device GPS** | **REAL (opt-in)** | `watchPosition` tracking behind the *Live GPS* toggle; detects leaving the drawn route. |
| **Walking Progress** | **REAL or Simulated** | Real GPS drives the walker dot, or "Simulate Walk" advances every 7 seconds with no GPS hardware. |
| **Routing** | **Hybrid** | Offline `LocalRoutingProvider` demo geometry by default; optional self-hosted OSRM via env var. |
| **Off-Route Detection** | **REAL or Simulated** | Real deviation detection from the route line, plus the stage "Simulate Off-Route" demo button. |
| **Device Compass** | **Hybrid Real/Simulated** | Listens to `deviceorientation` event if hardware sensors are available; falls back to animated simulated needle. |
| **Emergency 112 Call** | *Simulated Protocol* | Uses native `tel:112` scheme with caregiver audit log. |
