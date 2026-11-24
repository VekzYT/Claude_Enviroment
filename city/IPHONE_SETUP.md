# Putting Cubopolis on your iPhone (from a Windows 11 PC)

You need your Windows 11 PC, the USB-C cable for your iPhone 15 Pro, an Apple ID, and your GitHub login.
You don't need a Mac. GitHub's own Mac builds the app every time the game is updated, and you download the finished file.

It's free. Apple only lets apps you install yourself this way run for **7 days** with a free Apple ID. When it stops opening,
reinstall it the same way (step 5). Your city is saved on the phone and survives that, as long as you don't delete the app.

---

## One-time setup

### 1. Install Sideloadly and Apple's iTunes + iCloud
1. Go to **https://sideloadly.io** and download **Sideloadly for Windows**. Install it.
2. Sideloadly needs **iTunes and iCloud from Apple's website, not the Microsoft Store versions**. Its download page links the
   right installers. If you already have iTunes or iCloud from the Microsoft Store, uninstall those first, then install the ones it links.
3. Restart the PC.

### 2. Download the game file (Cubopolis.ipa)
1. On the PC, sign in to GitHub and open:
   **https://github.com/VekzYT/Claude_Enviroment/actions/workflows/cubopolis-ios.yml**
2. Click the newest run with a **green check mark**.
3. Scroll down to **Artifacts** and click **Cubopolis-iPhone-app**. A zip downloads.
4. Right-click the zip → **Extract All**. Inside is **Cubopolis.ipa**.

### 3. Connect the iPhone
Plug the iPhone into the PC and unlock it. If it asks **Trust This Computer?**, tap **Trust** and enter your passcode.

### 4. Turn on Developer Mode on the iPhone
**Settings → Privacy & Security → Developer Mode** → switch it **On**. Let the phone restart, then tap **Turn On** to confirm.
If Developer Mode isn't in the list yet, do step 5 once. It shows up after the first install.

### 5. Install with Sideloadly
1. Open Sideloadly. Your iPhone should show in the **iDevice** box.
2. Drag **Cubopolis.ipa** onto the big IPA icon on the left.
3. Type your Apple ID email in the **Apple account** box and click **Start**.
4. Enter your Apple ID password when it asks. If a code pops up on your phone, type it into Sideloadly.
5. Wait for **Done**.

Sideloadly sends your login only to Apple to sign the app. If you'd still rather not type your main Apple ID into it,
make a free spare Apple ID and use that instead. It works the same.

### 6. Trust yourself as the developer (first time only)
On the iPhone: **Settings → General → VPN & Device Management** → tap your Apple ID under *Developer App* → **Trust**.

Then open **Cubopolis** from your home screen and hold the phone sideways.

---

## Every week (when the app stops opening)
Don't delete the app. Plug the phone in, open Sideloadly, drag in the same **Cubopolis.ipa**, and press **Start** again.
Your city is still there afterwards.

## Getting a new version
Download the newest **Cubopolis.ipa** (step 2) and install it with Sideloadly (step 5) using the **same Apple ID**. It replaces the old
version and your city carries over.

---

## If something goes wrong

| What you see | What to do |
|---|---|
| Sideloadly doesn't see the iPhone | Unlock the phone and tap **Trust**. Make sure iTunes/iCloud are the **apple.com** versions (step 1.2). Try another USB port or cable. |
| A login or "Apple ID" error in Sideloadly | Re-type the password. If you use two-factor sign-in, enter the code shown on your phone. Check the clock on the PC is right. |
| "Maximum number of apps" | A free Apple ID can have 3 self-installed apps at once. Delete one you don't use. |
| "Untrusted Developer" when opening | Step 6. |
| "Developer Mode disabled" / app won't open | Step 4. |
| No **Artifacts** section on the GitHub page | You need to be signed in to GitHub. Or the build is still running. Wait for the green check mark. |
| The game shows an error banner | Take a screenshot and send it to Claude. |

---

## If you ever use a Mac instead
Install **Xcode** from the Mac App Store and sign it in to your Apple ID (**Xcode → Settings → Accounts**).
Then download the project zip, **https://github.com/VekzYT/Claude_Enviroment/archive/refs/heads/claude/eager-feynman-yofliv.zip**,
and open **city/ios/App/App.xcodeproj**. Under **Signing & Capabilities**, set **Team** to your Personal Team.
Pick your iPhone at the top of the window and press **▶ Run**. Developer Mode and the trust step are the same as above.
