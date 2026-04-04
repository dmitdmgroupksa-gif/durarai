import Foundation

// Stable identifier used for both the macOS LaunchAgent label and Nix-managed defaults suite.
// nix-Durar writes app defaults into this suite to survive app bundle identifier churn.
let launchdLabel = "ai.Durar.mac"
let gatewayLaunchdLabel = "ai.Durar.gateway"
let onboardingVersionKey = "Durar.onboardingVersion"
let onboardingSeenKey = "Durar.onboardingSeen"
let currentOnboardingVersion = 7
let pauseDefaultsKey = "Durar.pauseEnabled"
let iconAnimationsEnabledKey = "Durar.iconAnimationsEnabled"
let swabbleEnabledKey = "Durar.swabbleEnabled"
let swabbleTriggersKey = "Durar.swabbleTriggers"
let voiceWakeTriggerChimeKey = "Durar.voiceWakeTriggerChime"
let voiceWakeSendChimeKey = "Durar.voiceWakeSendChime"
let showDockIconKey = "Durar.showDockIcon"
let defaultVoiceWakeTriggers = ["Durar"]
let voiceWakeMaxWords = 32
let voiceWakeMaxWordLength = 64
let voiceWakeMicKey = "Durar.voiceWakeMicID"
let voiceWakeMicNameKey = "Durar.voiceWakeMicName"
let voiceWakeLocaleKey = "Durar.voiceWakeLocaleID"
let voiceWakeAdditionalLocalesKey = "Durar.voiceWakeAdditionalLocaleIDs"
let voicePushToTalkEnabledKey = "Durar.voicePushToTalkEnabled"
let voiceWakeTriggersTalkModeKey = "Durar.voiceWakeTriggersTalkMode"
let talkEnabledKey = "Durar.talkEnabled"
let iconOverrideKey = "Durar.iconOverride"
let connectionModeKey = "Durar.connectionMode"
let remoteTargetKey = "Durar.remoteTarget"
let remoteIdentityKey = "Durar.remoteIdentity"
let remoteProjectRootKey = "Durar.remoteProjectRoot"
let remoteCliPathKey = "Durar.remoteCliPath"
let canvasEnabledKey = "Durar.canvasEnabled"
let cameraEnabledKey = "Durar.cameraEnabled"
let systemRunPolicyKey = "Durar.systemRunPolicy"
let systemRunAllowlistKey = "Durar.systemRunAllowlist"
let systemRunEnabledKey = "Durar.systemRunEnabled"
let locationModeKey = "Durar.locationMode"
let locationPreciseKey = "Durar.locationPreciseEnabled"
let peekabooBridgeEnabledKey = "Durar.peekabooBridgeEnabled"
let deepLinkKeyKey = "Durar.deepLinkKey"
let modelCatalogPathKey = "Durar.modelCatalogPath"
let modelCatalogReloadKey = "Durar.modelCatalogReload"
let cliInstallPromptedVersionKey = "Durar.cliInstallPromptedVersion"
let heartbeatsEnabledKey = "Durar.heartbeatsEnabled"
let debugPaneEnabledKey = "Durar.debugPaneEnabled"
let debugFileLogEnabledKey = "Durar.debug.fileLogEnabled"
let appLogLevelKey = "Durar.debug.appLogLevel"
let voiceWakeSupported: Bool = ProcessInfo.processInfo.operatingSystemVersion.majorVersion >= 26
