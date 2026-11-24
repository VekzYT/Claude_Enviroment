# Putting Cubopolis on your iPhone

Cubopolis installs as a **Home Screen app**. You open its link in Safari once and add it to your Home Screen.
After that it has its own icon, opens fullscreen, works offline, and **never expires**. You don't need a computer,
and you don't reinstall anything. When the game gets updated, the app downloads the new version by itself.

It isn't on the App Store and isn't listed anywhere. Search engines are told not to index it. It's just yours,
though anyone you give the link to could open it.

---

## One-time: switch on hosting (2 minutes)

GitHub hosts the game for free from your repository. Turn that on once (this works fine in Safari on your phone):

1. Sign in to GitHub and open **https://github.com/VekzYT/Claude_Enviroment/settings/pages**
2. Under **Build and deployment** → **Source**, choose **Deploy from a branch**.
3. Under **Branch**, pick **claude/eager-feynman-yofliv**, then pick the folder **/docs**, and tap **Save**.
4. Wait a minute or two and refresh. The page shows **"Your site is live at https://vekzyt.github.io/Claude_Enviroment/"**.

## Add it to your Home Screen

1. On your iPhone, open **https://vekzyt.github.io/Claude_Enviroment/** in **Safari** (it has to be Safari).
2. Tap the **Share** button (the square with the arrow), then **Add to Home Screen**.
   If you see an **Open as Web App** switch, leave it on. Tap **Add**.
3. Open **Cubopolis** from your Home Screen and turn the phone sideways.

From now on, always open it from the Home Screen icon, not from Safari. The icon version is the one with your city in it.

---

## Updates
When the game is updated, Cubopolis downloads the new version in the background the next time you open it,
and the version after that opening is the new one. To get it right away, swipe the app away in the app switcher and open it again.

## Your city
Your city saves automatically on the phone, inside the Home Screen app.
**Deleting the Cubopolis icon deletes the city with it.** To keep a backup, open **Menu → Back up city**
and copy the code somewhere safe, like Notes. **Restore city** in the same menu brings it back.

## If something goes wrong

| What you see | What to do |
|---|---|
| The link says "404" | Hosting isn't on yet or is still starting. Check the one-time steps above and wait a couple of minutes. |
| No "Add to Home Screen" | Make sure you're in Safari, not Chrome or the GitHub app. Scroll down the Share sheet. |
| It opens with Safari's address bar | You opened the link instead of the icon. Use the Home Screen icon. |
| The game shows an error banner | Take a screenshot and send it to Claude. |

---

## Native app (optional, not needed)
The repository also has a native iOS version in `ios/`. A free Apple ID only lets self-installed native apps run for
7 days, which is why the Home Screen app is the main way to play. With a paid Apple Developer account
($99/year), the native version can be built by the "Cubopolis iOS build" workflow (Actions → Run workflow),
which produces an unsigned `Cubopolis.ipa`. Installed with Sideloadly using that paid account, it lasts a year.
