import UIKit
import WebKit
import AuthenticationServices
import SafariServices

var incomingURL: URL?

func createWebView(container: UIView, WKSMH: WKScriptMessageHandler, WKND: WKNavigationDelegate, NSO: NSObject, VC: ViewController) -> WKWebView{
    
    let config = WKWebViewConfiguration()
    let userContentController = WKUserContentController()
    
    let script = WKUserScript(source: "window.print = function() { window.webkit.messageHandlers.print.postMessage('print') }", injectionTime: WKUserScriptInjectionTime.atDocumentEnd, forMainFrameOnly: true)
    userContentController.addUserScript(script);
    
    userContentController.add(WKSMH, name: "print")
    config.userContentController = userContentController
    
    if #available(iOS 14, *) {
        config.limitsNavigationsToAppBoundDomains = true;
        
    }
    config.preferences.javaScriptCanOpenWindowsAutomatically = true
    
    let webView = WKWebView(frame: calcWebviewFrame(webviewView: container, toolbarView: nil), configuration: config)
    
    setCustomCookie(webView: webView)
    
    webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    
    webView.isHidden = true;
    webView.navigationDelegate = WKND;
    webView.isMultipleTouchEnabled = false
    webView.scrollView.bounces = false
    webView.scrollView.bouncesZoom = false
    webView.scrollView.isScrollEnabled = false
    webView.allowsBackForwardNavigationGestures = true
    webView.scrollView.contentInsetAdjustmentBehavior = .never
    webView.scrollView.maximumZoomScale = 1.0
    webView.scrollView.minimumZoomScale = 1.0

    webView.addObserver(NSO, forKeyPath: #keyPath(WKWebView.estimatedProgress), options: NSKeyValueObservingOptions.new, context: nil)
    
    return webView
}

func setAppStoreAsReferrer(contentController: WKUserContentController) {
    let scriptSource = "document.referrer = `app-info://platform/ios-store`;"
    let script = WKUserScript(source: scriptSource, injectionTime: .atDocumentEnd, forMainFrameOnly: true)
    contentController.addUserScript(script);
}

func setCustomCookie(webView: WKWebView) {
    let _platformCookie = HTTPCookie(properties: [
        .domain: rootUrl.host!,
        .path: "/",
        .name: platformCookie.name,
        .value: platformCookie.value,
        .secure: "FALSE",
        .expires: NSDate(timeIntervalSinceNow: 31556926)
    ])!
    
    webView.configuration.websiteDataStore.httpCookieStore.setCookie(_platformCookie)
    
}

func calcWebviewFrame(webviewView: UIView, toolbarView: UIToolbar?) -> CGRect{
    if ((toolbarView) != nil) {
        return CGRect(x: 0, y: toolbarView!.frame.height, width: webviewView.frame.width, height: webviewView.frame.height - toolbarView!.frame.height)
    }
    else {
        return CGRect(x: 0, y: 0, width: webviewView.frame.width, height: webviewView.frame.height)
    }
}

extension ViewController: WKUIDelegate {
    // redirect new tabs to main webview
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if (navigationAction.targetFrame == nil) {
            webView.load(navigationAction.request)
        }
        return nil
    }
    // restrict navigation to target host, open external links in 3rd party apps
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if let requestUrl = navigationAction.request.url{
            if let requestHost = requestUrl.host {
                if (requestHost.range(of: allowedOrigin) != nil) {
                    // Open in main webview
                    decisionHandler(.allow)
                    if (!toolbarView.isHidden) {
                        toolbarView.isHidden = true
                        webView.frame = calcWebviewFrame(webviewView: webviewView, toolbarView: nil)
                    }
                    
                } else {
                    let matchingAuthOrigin = authOrigins.first(where: { requestHost.range(of: $0) != nil })
                    //if (requestHost.range(of: authOrigin_1) != nil || requestHost.range(of: authOrigin_2) != nil || requestHost.range(of: authOrigin_3) != nil || requestHost.range(of: authOrigin_4) != nil) {
                    if (matchingAuthOrigin != nil) {
                        decisionHandler(.allow)
                        if (toolbarView.isHidden) {
                            toolbarView.isHidden = false
                            webView.frame = calcWebviewFrame(webviewView: webviewView, toolbarView: toolbarView)
                        }
                        return
                    }
                    else {
                        if (navigationAction.navigationType == .other &&
                            navigationAction.value(forKey: "syntheticClickType") as! Int == 0 &&
                            (navigationAction.targetFrame != nil)
                        ) {
                            decisionHandler(.allow)
                            return
                        }
                        else {
                            decisionHandler(.cancel)
                        }
                    }
                    
                    
                    if ["http", "https"].contains(requestUrl.scheme?.lowercased() ?? "") {
                        // Can open with SFSafariViewController
                        let safariViewController = SFSafariViewController(url: requestUrl)
                        self.present(safariViewController, animated: true, completion: nil)
                    } else {
                        // Scheme is not supported or no scheme is given, use openURL
                        if (UIApplication.shared.canOpenURL(requestUrl)) {
                            UIApplication.shared.open(requestUrl)
                        }
                    }
                    
                }
            } else {
                decisionHandler(.cancel)
                if (navigationAction.request.url?.scheme == "tel" || navigationAction.request.url?.scheme == "mailto" ){
                    if (UIApplication.shared.canOpenURL(requestUrl)) {
                        UIApplication.shared.open(requestUrl)
                    }
                }
            }
        }
        else {
            decisionHandler(.cancel)
        }
        
    }
    func webView(_ webView: WKWebView,
                 runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo,
                 completionHandler: @escaping () -> Void) {
        
        // Set the message as the UIAlertController message
        let alert = UIAlertController(
            title: nil,
            message: message,
            preferredStyle: .alert
        )
        
        // Add a confirmation action “OK”
        let okAction = UIAlertAction(
            title: "OK",
            style: .default,
            handler: { _ in
                // Call completionHandler
                completionHandler()
            }
        )
        alert.addAction(okAction)
        
        // Display the NSAlert
        present(alert, animated: true, completion: nil)
    }
}
