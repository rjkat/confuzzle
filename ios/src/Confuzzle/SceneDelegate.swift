import UIKit

@available(iOS 13.0, *)
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    
    var window: UIWindow?
    
    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        // Use this method to optionally configure and attach the UIWindow `window` to the provided UIWindowScene `scene`.
        // If using a storyboard, the `window` property will automatically be initialized and attached to the scene.
        // This delegate does not imply the connecting scene or session are new (see `application:configurationForConnectingSceneSession` instead).
        guard let _ = (scene as? UIWindowScene) else { return }
        // https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app
        // Get URL components from the incoming user activity.
        guard let userActivity = connectionOptions.userActivities.first,
              userActivity.activityType == NSUserActivityTypeBrowsingWeb,
              let incomingURL = userActivity.webpageURL else {
                  return
              }
        let handledRequest = URLRequest(url: incomingURL)
        Confuzzle.webView.load(handledRequest)
        return
    }
    
    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        // https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app
        // Get URL components from the incoming user activity.
        guard userActivity.activityType == NSUserActivityTypeBrowsingWeb,
              let incomingURL = userActivity.webpageURL else {
                  return
              }
        let handledRequest = URLRequest(url: incomingURL)
        Confuzzle.webView.load(handledRequest)
        return
    }
}

