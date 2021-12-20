import UIKit

@available(iOS 13.0, *)
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    
    var window: UIWindow?
    
    func openAppLink(activity: NSUserActivity?) {
        Confuzzle.incomingURL = nil;
        // https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app
        if (activity == nil || activity!.activityType != NSUserActivityTypeBrowsingWeb) {
            return;
        }
        incomingURL = activity?.webpageURL
        if (incomingURL == nil) {
            return;
        }
        if (Confuzzle.webView == nil) {
            Confuzzle.incomingURL = incomingURL!
        } else {
            Confuzzle.webView.load(URLRequest(url: incomingURL!));
        }
    }
    
    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        openAppLink(activity: connectionOptions.userActivities.first)
    }
    
    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        openAppLink(activity: userActivity)
    }
}

