import CoreLocation
import Foundation
import DurarKit
import UIKit

typealias DurarCameraSnapResult = (format: String, base64: String, width: Int, height: Int)
typealias DurarCameraClipResult = (format: String, base64: String, durationMs: Int, hasAudio: Bool)

protocol CameraServicing: Sendable {
    func listDevices() async -> [CameraController.CameraDeviceInfo]
    func snap(params: DurarCameraSnapParams) async throws -> DurarCameraSnapResult
    func clip(params: DurarCameraClipParams) async throws -> DurarCameraClipResult
}

protocol ScreenRecordingServicing: Sendable {
    func record(
        screenIndex: Int?,
        durationMs: Int?,
        fps: Double?,
        includeAudio: Bool?,
        outPath: String?) async throws -> String
}

@MainActor
protocol LocationServicing: Sendable {
    func authorizationStatus() -> CLAuthorizationStatus
    func accuracyAuthorization() -> CLAccuracyAuthorization
    func ensureAuthorization(mode: DurarLocationMode) async -> CLAuthorizationStatus
    func currentLocation(
        params: DurarLocationGetParams,
        desiredAccuracy: DurarLocationAccuracy,
        maxAgeMs: Int?,
        timeoutMs: Int?) async throws -> CLLocation
    func startLocationUpdates(
        desiredAccuracy: DurarLocationAccuracy,
        significantChangesOnly: Bool) -> AsyncStream<CLLocation>
    func stopLocationUpdates()
    func startMonitoringSignificantLocationChanges(onUpdate: @escaping @Sendable (CLLocation) -> Void)
    func stopMonitoringSignificantLocationChanges()
}

@MainActor
protocol DeviceStatusServicing: Sendable {
    func status() async throws -> DurarDeviceStatusPayload
    func info() -> DurarDeviceInfoPayload
}

protocol PhotosServicing: Sendable {
    func latest(params: DurarPhotosLatestParams) async throws -> DurarPhotosLatestPayload
}

protocol ContactsServicing: Sendable {
    func search(params: DurarContactsSearchParams) async throws -> DurarContactsSearchPayload
    func add(params: DurarContactsAddParams) async throws -> DurarContactsAddPayload
}

protocol CalendarServicing: Sendable {
    func events(params: DurarCalendarEventsParams) async throws -> DurarCalendarEventsPayload
    func add(params: DurarCalendarAddParams) async throws -> DurarCalendarAddPayload
}

protocol RemindersServicing: Sendable {
    func list(params: DurarRemindersListParams) async throws -> DurarRemindersListPayload
    func add(params: DurarRemindersAddParams) async throws -> DurarRemindersAddPayload
}

protocol MotionServicing: Sendable {
    func activities(params: DurarMotionActivityParams) async throws -> DurarMotionActivityPayload
    func pedometer(params: DurarPedometerParams) async throws -> DurarPedometerPayload
}

struct WatchMessagingStatus: Sendable, Equatable {
    var supported: Bool
    var paired: Bool
    var appInstalled: Bool
    var reachable: Bool
    var activationState: String
}

struct WatchQuickReplyEvent: Sendable, Equatable {
    var replyId: String
    var promptId: String
    var actionId: String
    var actionLabel: String?
    var sessionKey: String?
    var note: String?
    var sentAtMs: Int?
    var transport: String
}

struct WatchNotificationSendResult: Sendable, Equatable {
    var deliveredImmediately: Bool
    var queuedForDelivery: Bool
    var transport: String
}

protocol WatchMessagingServicing: AnyObject, Sendable {
    func status() async -> WatchMessagingStatus
    func setReplyHandler(_ handler: (@Sendable (WatchQuickReplyEvent) -> Void)?)
    func sendNotification(
        id: String,
        params: DurarWatchNotifyParams) async throws -> WatchNotificationSendResult
}

extension CameraController: CameraServicing {}
extension ScreenRecordService: ScreenRecordingServicing {}
extension LocationService: LocationServicing {}
