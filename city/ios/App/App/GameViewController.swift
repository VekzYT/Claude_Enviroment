import UIKit
import WebKit
import Capacitor

/// Hosts the game's web view and gives the game two things a web page can't do on its own:
///
/// * haptic taps (`op: "haptic"`), so placing a road or a building feels physical;
/// * a save file in the app's own Application Support folder (`op: "save" / "load" / "delete"`),
///   which iOS never clears the way it may clear a web view's localStorage.
///
/// JavaScript reaches this through `window.webkit.messageHandlers.cubopolis.postMessage({...})`,
/// which returns a Promise that resolves with whatever the reply handler passes back.
class GameViewController: CAPBridgeViewController, WKScriptMessageHandlerWithReply {

    private let lightImpact = UIImpactFeedbackGenerator(style: .light)
    private let mediumImpact = UIImpactFeedbackGenerator(style: .medium)
    private let heavyImpact = UIImpactFeedbackGenerator(style: .heavy)
    private let selection = UISelectionFeedbackGenerator()
    private let notification = UINotificationFeedbackGenerator()

    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        webView?.configuration.userContentController.addScriptMessageHandler(self, contentWorld: .page, name: "cubopolis")
        lightImpact.prepare()
        selection.prepare()
    }

    // A city builder is all dragging near the screen edges: keep the home bar out of the way and
    // make the system edge swipes need a second swipe, the way other full-screen games do.
    override var prefersHomeIndicatorAutoHidden: Bool { true }
    override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge { .all }

    // MARK: - Messages from the game

    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage,
                               replyHandler: @escaping (Any?, String?) -> Void) {
        guard let body = message.body as? [String: Any], let op = body["op"] as? String else {
            replyHandler(nil, "message needs an op")
            return
        }
        switch op {
        case "haptic":
            playHaptic(body["style"] as? String ?? "light")
            replyHandler(true, nil)
        case "save":
            guard let slot = slotName(body["slot"]), let data = body["data"] as? String else {
                replyHandler(nil, "save needs a slot and data")
                return
            }
            do {
                try data.write(to: saveURL(slot), atomically: true, encoding: .utf8)
                replyHandler(true, nil)
            } catch {
                replyHandler(nil, "save failed: \(error.localizedDescription)")
            }
        case "load":
            guard let slot = slotName(body["slot"]) else {
                replyHandler(nil, "load needs a slot")
                return
            }
            let url = saveURL(slot)
            if FileManager.default.fileExists(atPath: url.path),
               let text = try? String(contentsOf: url, encoding: .utf8) {
                replyHandler(text, nil)
            } else {
                replyHandler(NSNull(), nil)
            }
        case "delete":
            guard let slot = slotName(body["slot"]) else {
                replyHandler(nil, "delete needs a slot")
                return
            }
            try? FileManager.default.removeItem(at: saveURL(slot))
            replyHandler(true, nil)
        default:
            replyHandler(nil, "unknown op \(op)")
        }
    }

    private func playHaptic(_ style: String) {
        switch style {
        case "selection": selection.selectionChanged()
        case "medium": mediumImpact.impactOccurred()
        case "heavy": heavyImpact.impactOccurred()
        case "success": notification.notificationOccurred(.success)
        case "warning": notification.notificationOccurred(.warning)
        case "error": notification.notificationOccurred(.error)
        default: lightImpact.impactOccurred()
        }
    }

    /// Slot names become file names, so only letters, digits, dashes and underscores get through.
    private func slotName(_ value: Any?) -> String? {
        guard let name = value as? String, !name.isEmpty, name.count <= 40 else { return nil }
        let allowed = CharacterSet.alphanumerics.union(CharacterSet(charactersIn: "-_"))
        return name.unicodeScalars.allSatisfy { allowed.contains($0) } ? name : nil
    }

    private func saveURL(_ slot: String) -> URL {
        let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        let folder = support.appendingPathComponent("Saves", isDirectory: true)
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        return folder.appendingPathComponent("\(slot).json")
    }
}
