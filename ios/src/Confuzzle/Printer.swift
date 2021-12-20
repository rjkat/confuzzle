import UIKit
import WebKit

func printView(webView: WKWebView){
    let printController = UIPrintInteractionController.shared
    
    let printInfo = UIPrintInfo(dictionary:nil)
    printInfo.outputType = UIPrintInfo.OutputType.general
    printInfo.jobName = webView.title ?? allowedOrigin
    printInfo.duplex = UIPrintInfo.Duplex.none
    
    printController.printPageRenderer = UIPrintPageRenderer()
    
    printController.printPageRenderer?.addPrintFormatter(webView.viewPrintFormatter(), startingAtPageAt: 0)
    
    printController.printInfo = printInfo
    printController.present(animated: false)
}
