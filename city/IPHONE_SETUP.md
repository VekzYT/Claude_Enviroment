# Putting Cubopolis on your iPhone

You need: a Mac, the USB-C cable for your iPhone 15 Pro, an Apple ID (yours is fine, it doesn't have to be your parents'), and about an hour the first time (most of it is Xcode downloading). After that, installing an update takes about 2 minutes.

It's free. With a free Apple ID, Apple makes apps you install yourself **stop opening after 7 days**. When that happens, plug the phone back into the Mac and press Run again (step 7). Your city is saved on the phone and survives that, as long as you don't delete the app.

---

## One-time setup

### 1. Install Xcode on the Mac
Open the **App Store** on the Mac, search **Xcode**, and click **Get**. It's a big download. When it's done, open Xcode once. If it asks which platforms you want, tick **iOS**, then let it finish installing.

> If the App Store says Xcode needs a newer macOS, update the Mac first: **System Settings → General → Software Update**. If the Mac is too old to update, tell Claude which macOS version it's on.

### 2. Sign Xcode in with your Apple ID
In Xcode: **Xcode menu → Settings… → Accounts**, click **+** at the bottom left, choose **Apple ID**, and sign in. You'll see a team called **"Your Name (Personal Team)"**.

### 3. Download the game onto the Mac
In Safari on the Mac, open this link. It downloads a zip of the game:

**https://github.com/VekzYT/Claude_Enviroment/archive/refs/heads/claude/eager-feynman-yofliv.zip**

Double-click the zip in Downloads to unzip it.

### 4. Open the project
In the unzipped folder, go into **city → ios → App** and double-click **App.xcodeproj**.

Xcode will show "Resolving package graph" for a minute while it downloads Capacitor, the part that turns the game into an iPhone app. Wait for it to finish. You need internet for this.

### 5. Choose your signing team
1. In the left sidebar, click the blue **App** icon at the very top.
2. In the middle, under **TARGETS**, click **App**, then open the **Signing & Capabilities** tab.
3. Make sure **Automatically manage signing** is ticked, and set **Team** to your Personal Team.

If a red error says the bundle identifier **app.cubopolis.city** "is not available" or "cannot be registered", click in the **Bundle Identifier** box and add something unique to the end, like `app.cubopolis.city.yourname`.

### 6. Connect your iPhone and turn on Developer Mode
1. Plug the iPhone into the Mac. On the iPhone, tap **Trust** and enter your passcode.
2. On the iPhone: **Settings → Privacy & Security → Developer Mode**, switch it **On**, and let the phone restart. After the restart, tap **Turn On** to confirm.
   (If you don't see Developer Mode yet, do step 7 once first and it will appear.)

### 7. Install it
At the top of the Xcode window, in the middle, click the device name and choose **your iPhone** from the list (not a simulator). Then press the **▶ Run** button at the top left.

The first time, Xcode may spend a few minutes "Preparing" or "Copying shared cache" from the phone. Leave it plugged in. If the Mac asks for its password to use a "codesign" key, type it and click **Always Allow**.

### 8. Trust yourself as the developer (first time only)
The first launch may be blocked with "Untrusted Developer". On the iPhone:
**Settings → General → VPN & Device Management → (your Apple ID) → Trust**.

Then open **Cubopolis** from your home screen. Hold the phone sideways.

---

## Every week (when the app stops opening)
Don't delete the app. Plug the phone into the Mac, open **App.xcodeproj**, pick your iPhone, and press **▶ Run**. Done. Your city is still there.

**Tip:** after the first cable install, open **Window → Devices and Simulators** in Xcode, select your iPhone, and tick **Connect via network**. After that, Xcode can install over Wi-Fi whenever the phone and the Mac are on the same network. No cable needed.

## Getting a new version
Download the zip again (step 3), open the new **App.xcodeproj** (step 4), check the Team (step 5), and press **▶ Run**. Your city carries over.

---

## If something goes wrong

| What you see | What to do |
|---|---|
| "Failed to register bundle identifier" / "not available" | Change the Bundle Identifier (step 5) to something unique. |
| Your iPhone isn't in the device list, or "iOS version not supported" | Update Xcode in the App Store (and macOS if Xcode needs it). Unplug and replug the phone, and tap **Trust**. |
| "Could not launch App" / "Security" / "Untrusted Developer" | Do step 8 on the phone, then press ▶ again. |
| "Developer Mode disabled" | Step 6.2. |
| Package resolving fails or hangs | Check the Mac's internet, then **File → Packages → Reset Package Caches**. |
| "Maximum number of apps for free development" | A free Apple ID can have 3 self-installed apps on a phone at once. Delete an old one. |
| The game shows an error banner | Take a screenshot and send it to Claude. |
