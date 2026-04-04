import Foundation

public enum DurarCameraCommand: String, Codable, Sendable {
    case list = "camera.list"
    case snap = "camera.snap"
    case clip = "camera.clip"
}

public enum DurarCameraFacing: String, Codable, Sendable {
    case back
    case front
}

public enum DurarCameraImageFormat: String, Codable, Sendable {
    case jpg
    case jpeg
}

public enum DurarCameraVideoFormat: String, Codable, Sendable {
    case mp4
}

public struct DurarCameraSnapParams: Codable, Sendable, Equatable {
    public var facing: DurarCameraFacing?
    public var maxWidth: Int?
    public var quality: Double?
    public var format: DurarCameraImageFormat?
    public var deviceId: String?
    public var delayMs: Int?

    public init(
        facing: DurarCameraFacing? = nil,
        maxWidth: Int? = nil,
        quality: Double? = nil,
        format: DurarCameraImageFormat? = nil,
        deviceId: String? = nil,
        delayMs: Int? = nil)
    {
        self.facing = facing
        self.maxWidth = maxWidth
        self.quality = quality
        self.format = format
        self.deviceId = deviceId
        self.delayMs = delayMs
    }
}

public struct DurarCameraClipParams: Codable, Sendable, Equatable {
    public var facing: DurarCameraFacing?
    public var durationMs: Int?
    public var includeAudio: Bool?
    public var format: DurarCameraVideoFormat?
    public var deviceId: String?

    public init(
        facing: DurarCameraFacing? = nil,
        durationMs: Int? = nil,
        includeAudio: Bool? = nil,
        format: DurarCameraVideoFormat? = nil,
        deviceId: String? = nil)
    {
        self.facing = facing
        self.durationMs = durationMs
        self.includeAudio = includeAudio
        self.format = format
        self.deviceId = deviceId
    }
}
