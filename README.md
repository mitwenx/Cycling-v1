# miii - Cycling Computer for Termux 🚴‍♂️

**miii** is a modern, privacy-first, production-grade cycling computer that runs entirely locally on your Android phone using Termux. 

It features a beautiful dark-mode interface built with React, real-time GPS tracking via the Termux:API, and a lightweight Python FastAPI backend that handles physics calculations (Power, Calories, Elevation).

## 📱 Prerequisites

Because this app uses local hardware, you need the correct Android environment.
**DO NOT install Termux from the Google Play Store.** It is deprecated.

1. Download and install **Termux** from(https://f-droid.org/en/packages/com.termux/) or their(https://github.com/termux/termux-app/releases).
2. Download and install **Termux:API** from F-Droid (must match the source of your Termux app).
3. Open your Android Settings -> Apps -> Termux:API -> Permissions, and allow **Location** (Set to "Allow all the time" for best background tracking).

## 🛠️ Installation

1. Open the **Termux** app.
2. Clone this repository (or download and extract the ZIP file):
   ```bash
   pkg install git
   git clone https://github.com/mitwenx/Cycling-v1
   cd Cycling-v1
