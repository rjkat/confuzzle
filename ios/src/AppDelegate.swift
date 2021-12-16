import UIKit


@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    
    var window : UIWindow?
    
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        return true
    }
    
    // Handle deep links into our app.
    // See https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app
    func application(_ application: UIApplication,
                     continue userActivity: NSUserActivity,
                     restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Ensure we're trying to launch a link.
        guard userActivity.activityType == NSUserActivityTypeBrowsingWeb,
              let incomingURL = userActivity.webpageURL else {
                  return false
              }
        
        // Handle it inside our web view.
        let handledRequest = URLRequest(url: incomingURL)
        Confuzzle.webView.load(handledRequest)
        return true
    }
    
}




