// swift-tools-version: 6.2
// Package manifest for the Durar macOS companion (menu bar app + IPC library).

import PackageDescription

let package = Package(
    name: "Durar",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(name: "DurarIPC", targets: ["DurarIPC"]),
        .library(name: "DurarDiscovery", targets: ["DurarDiscovery"]),
        .executable(name: "Durar", targets: ["Durar"]),
        .executable(name: "Durar-mac", targets: ["DurarMacCLI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/orchetect/MenuBarExtraAccess", exact: "1.2.2"),
        .package(url: "https://github.com/swiftlang/swift-subprocess.git", from: "0.4.0"),
        .package(url: "https://github.com/apple/swift-log.git", from: "1.10.1"),
        .package(url: "https://github.com/sparkle-project/Sparkle", from: "2.9.0"),
        .package(url: "https://github.com/steipete/Peekaboo.git", branch: "main"),
        .package(path: "../shared/DurarKit"),
        .package(path: "../../Swabble"),
    ],
    targets: [
        .target(
            name: "DurarIPC",
            dependencies: [],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "DurarDiscovery",
            dependencies: [
                .product(name: "DurarKit", package: "DurarKit"),
            ],
            path: "Sources/DurarDiscovery",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "Durar",
            dependencies: [
                "DurarIPC",
                "DurarDiscovery",
                .product(name: "DurarKit", package: "DurarKit"),
                .product(name: "DurarChatUI", package: "DurarKit"),
                .product(name: "DurarProtocol", package: "DurarKit"),
                .product(name: "SwabbleKit", package: "swabble"),
                .product(name: "MenuBarExtraAccess", package: "MenuBarExtraAccess"),
                .product(name: "Subprocess", package: "swift-subprocess"),
                .product(name: "Logging", package: "swift-log"),
                .product(name: "Sparkle", package: "Sparkle"),
                .product(name: "PeekabooBridge", package: "Peekaboo"),
                .product(name: "PeekabooAutomationKit", package: "Peekaboo"),
            ],
            exclude: [
                "Resources/Info.plist",
            ],
            resources: [
                .copy("Resources/Durar.icns"),
                .copy("Resources/DeviceModels"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "DurarMacCLI",
            dependencies: [
                "DurarDiscovery",
                .product(name: "DurarKit", package: "DurarKit"),
                .product(name: "DurarProtocol", package: "DurarKit"),
            ],
            path: "Sources/DurarMacCLI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "DurarIPCTests",
            dependencies: [
                "DurarIPC",
                "Durar",
                "DurarDiscovery",
                .product(name: "DurarProtocol", package: "DurarKit"),
                .product(name: "SwabbleKit", package: "swabble"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
