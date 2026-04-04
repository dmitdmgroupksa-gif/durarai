import Foundation

public enum DurarDeviceCommand: String, Codable, Sendable {
    case status = "device.status"
    case info = "device.info"
}

public enum DurarBatteryState: String, Codable, Sendable {
    case unknown
    case unplugged
    case charging
    case full
}

public enum DurarThermalState: String, Codable, Sendable {
    case nominal
    case fair
    case serious
    case critical
}

public enum DurarNetworkPathStatus: String, Codable, Sendable {
    case satisfied
    case unsatisfied
    case requiresConnection
}

public enum DurarNetworkInterfaceType: String, Codable, Sendable {
    case wifi
    case cellular
    case wired
    case other
}

public struct DurarBatteryStatusPayload: Codable, Sendable, Equatable {
    public var level: Double?
    public var state: DurarBatteryState
    public var lowPowerModeEnabled: Bool

    public init(level: Double?, state: DurarBatteryState, lowPowerModeEnabled: Bool) {
        self.level = level
        self.state = state
        self.lowPowerModeEnabled = lowPowerModeEnabled
    }
}

public struct DurarThermalStatusPayload: Codable, Sendable, Equatable {
    public var state: DurarThermalState

    public init(state: DurarThermalState) {
        self.state = state
    }
}

public struct DurarStorageStatusPayload: Codable, Sendable, Equatable {
    public var totalBytes: Int64
    public var freeBytes: Int64
    public var usedBytes: Int64

    public init(totalBytes: Int64, freeBytes: Int64, usedBytes: Int64) {
        self.totalBytes = totalBytes
        self.freeBytes = freeBytes
        self.usedBytes = usedBytes
    }
}

public struct DurarNetworkStatusPayload: Codable, Sendable, Equatable {
    public var status: DurarNetworkPathStatus
    public var isExpensive: Bool
    public var isConstrained: Bool
    public var interfaces: [DurarNetworkInterfaceType]

    public init(
        status: DurarNetworkPathStatus,
        isExpensive: Bool,
        isConstrained: Bool,
        interfaces: [DurarNetworkInterfaceType])
    {
        self.status = status
        self.isExpensive = isExpensive
        self.isConstrained = isConstrained
        self.interfaces = interfaces
    }
}

public struct DurarDeviceStatusPayload: Codable, Sendable, Equatable {
    public var battery: DurarBatteryStatusPayload
    public var thermal: DurarThermalStatusPayload
    public var storage: DurarStorageStatusPayload
    public var network: DurarNetworkStatusPayload
    public var uptimeSeconds: Double

    public init(
        battery: DurarBatteryStatusPayload,
        thermal: DurarThermalStatusPayload,
        storage: DurarStorageStatusPayload,
        network: DurarNetworkStatusPayload,
        uptimeSeconds: Double)
    {
        self.battery = battery
        self.thermal = thermal
        self.storage = storage
        self.network = network
        self.uptimeSeconds = uptimeSeconds
    }
}

public struct DurarDeviceInfoPayload: Codable, Sendable, Equatable {
    public var deviceName: String
    public var modelIdentifier: String
    public var systemName: String
    public var systemVersion: String
    public var appVersion: String
    public var appBuild: String
    public var locale: String

    public init(
        deviceName: String,
        modelIdentifier: String,
        systemName: String,
        systemVersion: String,
        appVersion: String,
        appBuild: String,
        locale: String)
    {
        self.deviceName = deviceName
        self.modelIdentifier = modelIdentifier
        self.systemName = systemName
        self.systemVersion = systemVersion
        self.appVersion = appVersion
        self.appBuild = appBuild
        self.locale = locale
    }
}
