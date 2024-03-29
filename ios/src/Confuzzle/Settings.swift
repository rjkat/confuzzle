import WebKit

struct Cookie {
    var name: String
    var value: String
}

// URL for first launch
let rootUrl = URL(string: "https://confuzzle.app")!

// allowed origin is for what we are sticking to pwa domain
// This should also appear in Info.plist
let allowedOrigin = "confuzzle.app"

// auth origins will open in modal and show toolbar for back into the main origin.
// These should also appear in Info.plist
let authOrigins: [String] = []

let platformCookie = Cookie(name: "app-platform", value: "iOS App Store")
