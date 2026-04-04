package ai.Durar.app.protocol

import org.junit.Assert.assertEquals
import org.junit.Test

class DurarProtocolConstantsTest {
  @Test
  fun canvasCommandsUseStableStrings() {
    assertEquals("canvas.present", DurarCanvasCommand.Present.rawValue)
    assertEquals("canvas.hide", DurarCanvasCommand.Hide.rawValue)
    assertEquals("canvas.navigate", DurarCanvasCommand.Navigate.rawValue)
    assertEquals("canvas.eval", DurarCanvasCommand.Eval.rawValue)
    assertEquals("canvas.snapshot", DurarCanvasCommand.Snapshot.rawValue)
  }

  @Test
  fun a2uiCommandsUseStableStrings() {
    assertEquals("canvas.a2ui.push", DurarCanvasA2UICommand.Push.rawValue)
    assertEquals("canvas.a2ui.pushJSONL", DurarCanvasA2UICommand.PushJSONL.rawValue)
    assertEquals("canvas.a2ui.reset", DurarCanvasA2UICommand.Reset.rawValue)
  }

  @Test
  fun capabilitiesUseStableStrings() {
    assertEquals("canvas", DurarCapability.Canvas.rawValue)
    assertEquals("camera", DurarCapability.Camera.rawValue)
    assertEquals("voiceWake", DurarCapability.VoiceWake.rawValue)
    assertEquals("location", DurarCapability.Location.rawValue)
    assertEquals("sms", DurarCapability.Sms.rawValue)
    assertEquals("device", DurarCapability.Device.rawValue)
    assertEquals("notifications", DurarCapability.Notifications.rawValue)
    assertEquals("system", DurarCapability.System.rawValue)
    assertEquals("photos", DurarCapability.Photos.rawValue)
    assertEquals("contacts", DurarCapability.Contacts.rawValue)
    assertEquals("calendar", DurarCapability.Calendar.rawValue)
    assertEquals("motion", DurarCapability.Motion.rawValue)
    assertEquals("callLog", DurarCapability.CallLog.rawValue)
  }

  @Test
  fun cameraCommandsUseStableStrings() {
    assertEquals("camera.list", DurarCameraCommand.List.rawValue)
    assertEquals("camera.snap", DurarCameraCommand.Snap.rawValue)
    assertEquals("camera.clip", DurarCameraCommand.Clip.rawValue)
  }

  @Test
  fun notificationsCommandsUseStableStrings() {
    assertEquals("notifications.list", DurarNotificationsCommand.List.rawValue)
    assertEquals("notifications.actions", DurarNotificationsCommand.Actions.rawValue)
  }

  @Test
  fun deviceCommandsUseStableStrings() {
    assertEquals("device.status", DurarDeviceCommand.Status.rawValue)
    assertEquals("device.info", DurarDeviceCommand.Info.rawValue)
    assertEquals("device.permissions", DurarDeviceCommand.Permissions.rawValue)
    assertEquals("device.health", DurarDeviceCommand.Health.rawValue)
  }

  @Test
  fun systemCommandsUseStableStrings() {
    assertEquals("system.notify", DurarSystemCommand.Notify.rawValue)
  }

  @Test
  fun photosCommandsUseStableStrings() {
    assertEquals("photos.latest", DurarPhotosCommand.Latest.rawValue)
  }

  @Test
  fun contactsCommandsUseStableStrings() {
    assertEquals("contacts.search", DurarContactsCommand.Search.rawValue)
    assertEquals("contacts.add", DurarContactsCommand.Add.rawValue)
  }

  @Test
  fun calendarCommandsUseStableStrings() {
    assertEquals("calendar.events", DurarCalendarCommand.Events.rawValue)
    assertEquals("calendar.add", DurarCalendarCommand.Add.rawValue)
  }

  @Test
  fun motionCommandsUseStableStrings() {
    assertEquals("motion.activity", DurarMotionCommand.Activity.rawValue)
    assertEquals("motion.pedometer", DurarMotionCommand.Pedometer.rawValue)
  }

  @Test
  fun smsCommandsUseStableStrings() {
    assertEquals("sms.send", DurarSmsCommand.Send.rawValue)
    assertEquals("sms.search", DurarSmsCommand.Search.rawValue)
  }

  @Test
  fun callLogCommandsUseStableStrings() {
    assertEquals("callLog.search", DurarCallLogCommand.Search.rawValue)
  }

}
