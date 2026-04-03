package ai.Durar.app.node

import ai.Durar.app.protocol.DurarCalendarCommand
import ai.Durar.app.protocol.DurarCameraCommand
import ai.Durar.app.protocol.DurarCallLogCommand
import ai.Durar.app.protocol.DurarCapability
import ai.Durar.app.protocol.DurarContactsCommand
import ai.Durar.app.protocol.DurarDeviceCommand
import ai.Durar.app.protocol.DurarLocationCommand
import ai.Durar.app.protocol.DurarMotionCommand
import ai.Durar.app.protocol.DurarNotificationsCommand
import ai.Durar.app.protocol.DurarPhotosCommand
import ai.Durar.app.protocol.DurarSmsCommand
import ai.Durar.app.protocol.DurarSystemCommand
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class InvokeCommandRegistryTest {
  private val coreCapabilities =
    setOf(
      DurarCapability.Canvas.rawValue,
      DurarCapability.Device.rawValue,
      DurarCapability.Notifications.rawValue,
      DurarCapability.System.rawValue,
      DurarCapability.Photos.rawValue,
      DurarCapability.Contacts.rawValue,
      DurarCapability.Calendar.rawValue,
    )

  private val optionalCapabilities =
    setOf(
      DurarCapability.Camera.rawValue,
      DurarCapability.Location.rawValue,
      DurarCapability.Sms.rawValue,
      DurarCapability.CallLog.rawValue,
      DurarCapability.VoiceWake.rawValue,
      DurarCapability.Motion.rawValue,
    )

  private val coreCommands =
    setOf(
      DurarDeviceCommand.Status.rawValue,
      DurarDeviceCommand.Info.rawValue,
      DurarDeviceCommand.Permissions.rawValue,
      DurarDeviceCommand.Health.rawValue,
      DurarNotificationsCommand.List.rawValue,
      DurarNotificationsCommand.Actions.rawValue,
      DurarSystemCommand.Notify.rawValue,
      DurarPhotosCommand.Latest.rawValue,
      DurarContactsCommand.Search.rawValue,
      DurarContactsCommand.Add.rawValue,
      DurarCalendarCommand.Events.rawValue,
      DurarCalendarCommand.Add.rawValue,
    )

  private val optionalCommands =
    setOf(
      DurarCameraCommand.Snap.rawValue,
      DurarCameraCommand.Clip.rawValue,
      DurarCameraCommand.List.rawValue,
      DurarLocationCommand.Get.rawValue,
      DurarMotionCommand.Activity.rawValue,
      DurarMotionCommand.Pedometer.rawValue,
      DurarSmsCommand.Send.rawValue,
      DurarSmsCommand.Search.rawValue,
      DurarCallLogCommand.Search.rawValue,
    )

  private val debugCommands = setOf("debug.logs", "debug.ed25519")

  @Test
  fun advertisedCapabilities_respectsFeatureAvailability() {
    val capabilities = InvokeCommandRegistry.advertisedCapabilities(defaultFlags())

    assertContainsAll(capabilities, coreCapabilities)
    assertMissingAll(capabilities, optionalCapabilities)
  }

  @Test
  fun advertisedCapabilities_includesFeatureCapabilitiesWhenEnabled() {
    val capabilities =
      InvokeCommandRegistry.advertisedCapabilities(
        defaultFlags(
          cameraEnabled = true,
          locationEnabled = true,
          sendSmsAvailable = true,
          readSmsAvailable = true,
          smsSearchPossible = true,
          callLogAvailable = true,
          voiceWakeEnabled = true,
          motionActivityAvailable = true,
          motionPedometerAvailable = true,
        ),
      )

    assertContainsAll(capabilities, coreCapabilities + optionalCapabilities)
  }

  @Test
  fun advertisedCommands_respectsFeatureAvailability() {
    val commands = InvokeCommandRegistry.advertisedCommands(defaultFlags())

    assertContainsAll(commands, coreCommands)
    assertMissingAll(commands, optionalCommands + debugCommands)
  }

  @Test
  fun advertisedCommands_includesFeatureCommandsWhenEnabled() {
    val commands =
      InvokeCommandRegistry.advertisedCommands(
        defaultFlags(
          cameraEnabled = true,
          locationEnabled = true,
          sendSmsAvailable = true,
          readSmsAvailable = true,
          smsSearchPossible = true,
          callLogAvailable = true,
          motionActivityAvailable = true,
          motionPedometerAvailable = true,
          debugBuild = true,
        ),
      )

    assertContainsAll(commands, coreCommands + optionalCommands + debugCommands)
  }

  @Test
  fun advertisedCommands_onlyIncludesSupportedMotionCommands() {
    val commands =
      InvokeCommandRegistry.advertisedCommands(
        NodeRuntimeFlags(
          cameraEnabled = false,
          locationEnabled = false,
          sendSmsAvailable = false,
          readSmsAvailable = false,
          smsSearchPossible = false,
          callLogAvailable = false,
          voiceWakeEnabled = false,
          motionActivityAvailable = true,
          motionPedometerAvailable = false,
          debugBuild = false,
        ),
      )

    assertTrue(commands.contains(DurarMotionCommand.Activity.rawValue))
    assertFalse(commands.contains(DurarMotionCommand.Pedometer.rawValue))
  }

  @Test
  fun advertisedCommands_splitsSmsSendAndSearchAvailability() {
    val readOnlyCommands =
      InvokeCommandRegistry.advertisedCommands(
        defaultFlags(readSmsAvailable = true, smsSearchPossible = true),
      )
    val sendOnlyCommands =
      InvokeCommandRegistry.advertisedCommands(
        defaultFlags(sendSmsAvailable = true),
      )
    val requestableSearchCommands =
      InvokeCommandRegistry.advertisedCommands(
        defaultFlags(smsSearchPossible = true),
      )

    assertTrue(readOnlyCommands.contains(DurarSmsCommand.Search.rawValue))
    assertFalse(readOnlyCommands.contains(DurarSmsCommand.Send.rawValue))
    assertTrue(sendOnlyCommands.contains(DurarSmsCommand.Send.rawValue))
    assertFalse(sendOnlyCommands.contains(DurarSmsCommand.Search.rawValue))
    assertTrue(requestableSearchCommands.contains(DurarSmsCommand.Search.rawValue))
  }

  @Test
  fun advertisedCapabilities_includeSmsWhenEitherSmsPathIsAvailable() {
    val readOnlyCapabilities =
      InvokeCommandRegistry.advertisedCapabilities(
        defaultFlags(readSmsAvailable = true),
      )
    val sendOnlyCapabilities =
      InvokeCommandRegistry.advertisedCapabilities(
        defaultFlags(sendSmsAvailable = true),
      )
    val requestableSearchCapabilities =
      InvokeCommandRegistry.advertisedCapabilities(
        defaultFlags(smsSearchPossible = true),
      )

    assertTrue(readOnlyCapabilities.contains(DurarCapability.Sms.rawValue))
    assertTrue(sendOnlyCapabilities.contains(DurarCapability.Sms.rawValue))
    assertFalse(requestableSearchCapabilities.contains(DurarCapability.Sms.rawValue))
  }

  @Test
  fun advertisedCommands_excludesCallLogWhenUnavailable() {
    val commands = InvokeCommandRegistry.advertisedCommands(defaultFlags(callLogAvailable = false))

    assertFalse(commands.contains(DurarCallLogCommand.Search.rawValue))
  }

  @Test
  fun advertisedCapabilities_excludesCallLogWhenUnavailable() {
    val capabilities = InvokeCommandRegistry.advertisedCapabilities(defaultFlags(callLogAvailable = false))

    assertFalse(capabilities.contains(DurarCapability.CallLog.rawValue))
  }

  @Test
  fun advertisedCapabilities_includesVoiceWakeWithoutAdvertisingCommands() {
    val capabilities = InvokeCommandRegistry.advertisedCapabilities(defaultFlags(voiceWakeEnabled = true))
    val commands = InvokeCommandRegistry.advertisedCommands(defaultFlags(voiceWakeEnabled = true))

    assertTrue(capabilities.contains(DurarCapability.VoiceWake.rawValue))
    assertFalse(commands.any { it.contains("voice", ignoreCase = true) })
  }

  @Test
  fun find_returnsForegroundMetadataForCameraCommands() {
    val list = InvokeCommandRegistry.find(DurarCameraCommand.List.rawValue)
    val location = InvokeCommandRegistry.find(DurarLocationCommand.Get.rawValue)

    assertNotNull(list)
    assertEquals(true, list?.requiresForeground)
    assertNotNull(location)
    assertEquals(false, location?.requiresForeground)
  }

  @Test
  fun find_returnsNullForUnknownCommand() {
    assertNull(InvokeCommandRegistry.find("not.real"))
  }

  private fun defaultFlags(
    cameraEnabled: Boolean = false,
    locationEnabled: Boolean = false,
    sendSmsAvailable: Boolean = false,
    readSmsAvailable: Boolean = false,
    smsSearchPossible: Boolean = false,
    callLogAvailable: Boolean = false,
    voiceWakeEnabled: Boolean = false,
    motionActivityAvailable: Boolean = false,
    motionPedometerAvailable: Boolean = false,
    debugBuild: Boolean = false,
  ): NodeRuntimeFlags =
    NodeRuntimeFlags(
      cameraEnabled = cameraEnabled,
      locationEnabled = locationEnabled,
      sendSmsAvailable = sendSmsAvailable,
      readSmsAvailable = readSmsAvailable,
      smsSearchPossible = smsSearchPossible,
      callLogAvailable = callLogAvailable,
      voiceWakeEnabled = voiceWakeEnabled,
      motionActivityAvailable = motionActivityAvailable,
      motionPedometerAvailable = motionPedometerAvailable,
      debugBuild = debugBuild,
    )

  private fun assertContainsAll(actual: List<String>, expected: Set<String>) {
    expected.forEach { value -> assertTrue(actual.contains(value)) }
  }

  private fun assertMissingAll(actual: List<String>, forbidden: Set<String>) {
    forbidden.forEach { value -> assertFalse(actual.contains(value)) }
  }
}
