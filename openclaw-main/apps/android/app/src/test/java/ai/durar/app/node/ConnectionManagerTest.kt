package ai.Durar.app.node

import ai.Durar.app.LocationMode
import ai.Durar.app.SecurePrefs
import ai.Durar.app.VoiceWakeMode
import ai.Durar.app.protocol.DurarCallLogCommand
import ai.Durar.app.protocol.DurarCameraCommand
import ai.Durar.app.protocol.DurarCapability
import ai.Durar.app.protocol.DurarLocationCommand
import ai.Durar.app.protocol.DurarMotionCommand
import ai.Durar.app.protocol.DurarSmsCommand
import ai.Durar.app.gateway.GatewayEndpoint
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class ConnectionManagerTest {
  @Test
  fun resolveTlsParamsForEndpoint_prefersStoredPinOverAdvertisedFingerprint() {
    val endpoint =
      GatewayEndpoint(
        stableId = "_Durar-gw._tcp.|local.|Test",
        name = "Test",
        host = "10.0.0.2",
        port = 18789,
        tlsEnabled = true,
        tlsFingerprintSha256 = "attacker",
      )

    val params =
      ConnectionManager.resolveTlsParamsForEndpoint(
        endpoint,
        storedFingerprint = "legit",
        manualTlsEnabled = false,
      )

    assertEquals("legit", params?.expectedFingerprint)
    assertEquals(false, params?.allowTOFU)
  }

  @Test
  fun resolveTlsParamsForEndpoint_doesNotTrustAdvertisedFingerprintWhenNoStoredPin() {
    val endpoint =
      GatewayEndpoint(
        stableId = "_Durar-gw._tcp.|local.|Test",
        name = "Test",
        host = "10.0.0.2",
        port = 18789,
        tlsEnabled = true,
        tlsFingerprintSha256 = "attacker",
      )

    val params =
      ConnectionManager.resolveTlsParamsForEndpoint(
        endpoint,
        storedFingerprint = null,
        manualTlsEnabled = false,
      )

    assertNull(params?.expectedFingerprint)
    assertEquals(false, params?.allowTOFU)
  }

  @Test
  fun resolveTlsParamsForEndpoint_manualRespectsManualTlsToggle() {
    val endpoint = GatewayEndpoint.manual(host = "example.com", port = 443)

    val off =
      ConnectionManager.resolveTlsParamsForEndpoint(
        endpoint,
        storedFingerprint = null,
        manualTlsEnabled = false,
      )
    assertNull(off)

    val on =
      ConnectionManager.resolveTlsParamsForEndpoint(
        endpoint,
        storedFingerprint = null,
        manualTlsEnabled = true,
      )
    assertNull(on?.expectedFingerprint)
    assertEquals(false, on?.allowTOFU)
  }

  @Test
  fun buildNodeConnectOptions_advertisesRequestableSmsSearchWithoutSmsCapability() {
    val options =
      newManager(
        sendSmsAvailable = false,
        readSmsAvailable = false,
        smsSearchPossible = true,
      ).buildNodeConnectOptions()

    assertTrue(options.commands.contains(DurarSmsCommand.Search.rawValue))
    assertFalse(options.commands.contains(DurarSmsCommand.Send.rawValue))
    assertFalse(options.caps.contains(DurarCapability.Sms.rawValue))
  }

  @Test
  fun buildNodeConnectOptions_doesNotAdvertiseSmsWhenSearchIsImpossible() {
    val options =
      newManager(
        sendSmsAvailable = false,
        readSmsAvailable = false,
        smsSearchPossible = false,
      ).buildNodeConnectOptions()

    assertFalse(options.commands.contains(DurarSmsCommand.Search.rawValue))
    assertFalse(options.commands.contains(DurarSmsCommand.Send.rawValue))
    assertFalse(options.caps.contains(DurarCapability.Sms.rawValue))
  }

  @Test
  fun buildNodeConnectOptions_advertisesSmsCapabilityWhenReadSmsIsAvailable() {
    val options =
      newManager(
        sendSmsAvailable = false,
        readSmsAvailable = true,
        smsSearchPossible = true,
      ).buildNodeConnectOptions()

    assertTrue(options.commands.contains(DurarSmsCommand.Search.rawValue))
    assertTrue(options.caps.contains(DurarCapability.Sms.rawValue))
  }

  @Test
  fun buildNodeConnectOptions_advertisesSmsSendWithoutSearchWhenOnlySendIsAvailable() {
    val options =
      newManager(
        sendSmsAvailable = true,
        readSmsAvailable = false,
        smsSearchPossible = false,
      ).buildNodeConnectOptions()

    assertTrue(options.commands.contains(DurarSmsCommand.Send.rawValue))
    assertFalse(options.commands.contains(DurarSmsCommand.Search.rawValue))
    assertTrue(options.caps.contains(DurarCapability.Sms.rawValue))
  }

  @Test
  fun buildNodeConnectOptions_advertisesAvailableNonSmsCommandsAndCapabilities() {
    val options =
      newManager(
        cameraEnabled = true,
        locationMode = LocationMode.WhileUsing,
        voiceWakeMode = VoiceWakeMode.Always,
        motionActivityAvailable = true,
        callLogAvailable = true,
        hasRecordAudioPermission = true,
      ).buildNodeConnectOptions()

    assertTrue(options.commands.contains(DurarCameraCommand.List.rawValue))
    assertTrue(options.commands.contains(DurarLocationCommand.Get.rawValue))
    assertTrue(options.commands.contains(DurarMotionCommand.Activity.rawValue))
    assertTrue(options.commands.contains(DurarCallLogCommand.Search.rawValue))
    assertTrue(options.caps.contains(DurarCapability.Camera.rawValue))
    assertTrue(options.caps.contains(DurarCapability.Location.rawValue))
    assertTrue(options.caps.contains(DurarCapability.Motion.rawValue))
    assertTrue(options.caps.contains(DurarCapability.CallLog.rawValue))
    assertTrue(options.caps.contains(DurarCapability.VoiceWake.rawValue))
  }

  @Test
  fun buildNodeConnectOptions_omitsVoiceWakeWithoutMicrophonePermission() {
    val options =
      newManager(
        voiceWakeMode = VoiceWakeMode.Always,
        hasRecordAudioPermission = false,
      ).buildNodeConnectOptions()

    assertFalse(options.caps.contains(DurarCapability.VoiceWake.rawValue))
  }

  @Test
  fun buildNodeConnectOptions_omitsUnavailableCameraLocationAndCallLogSurfaces() {
    val options =
      newManager(
        cameraEnabled = false,
        locationMode = LocationMode.Off,
        callLogAvailable = false,
      ).buildNodeConnectOptions()

    assertFalse(options.commands.contains(DurarCameraCommand.List.rawValue))
    assertFalse(options.commands.contains(DurarCameraCommand.Snap.rawValue))
    assertFalse(options.commands.contains(DurarCameraCommand.Clip.rawValue))
    assertFalse(options.commands.contains(DurarLocationCommand.Get.rawValue))
    assertFalse(options.commands.contains(DurarCallLogCommand.Search.rawValue))
    assertFalse(options.caps.contains(DurarCapability.Camera.rawValue))
    assertFalse(options.caps.contains(DurarCapability.Location.rawValue))
    assertFalse(options.caps.contains(DurarCapability.CallLog.rawValue))
  }

  @Test
  fun buildNodeConnectOptions_advertisesOnlyAvailableMotionCommand() {
    val options =
      newManager(
        motionActivityAvailable = false,
        motionPedometerAvailable = true,
      ).buildNodeConnectOptions()

    assertFalse(options.commands.contains(DurarMotionCommand.Activity.rawValue))
    assertTrue(options.commands.contains(DurarMotionCommand.Pedometer.rawValue))
    assertTrue(options.caps.contains(DurarCapability.Motion.rawValue))
  }

  @Test
  fun buildNodeConnectOptions_omitsMotionSurfaceWhenMotionApisUnavailable() {
    val options =
      newManager(
        motionActivityAvailable = false,
        motionPedometerAvailable = false,
      ).buildNodeConnectOptions()

    assertFalse(options.commands.contains(DurarMotionCommand.Activity.rawValue))
    assertFalse(options.commands.contains(DurarMotionCommand.Pedometer.rawValue))
    assertFalse(options.caps.contains(DurarCapability.Motion.rawValue))
  }

  private fun newManager(
    cameraEnabled: Boolean = false,
    locationMode: LocationMode = LocationMode.Off,
    voiceWakeMode: VoiceWakeMode = VoiceWakeMode.Off,
    motionActivityAvailable: Boolean = false,
    motionPedometerAvailable: Boolean = false,
    sendSmsAvailable: Boolean = false,
    readSmsAvailable: Boolean = false,
    smsSearchPossible: Boolean = false,
    callLogAvailable: Boolean = false,
    hasRecordAudioPermission: Boolean = false,
  ): ConnectionManager {
    val context = RuntimeEnvironment.getApplication()
    val prefs =
      SecurePrefs(
        context,
        securePrefsOverride = context.getSharedPreferences("connection-manager-test", android.content.Context.MODE_PRIVATE),
      )

    return ConnectionManager(
      prefs = prefs,
      cameraEnabled = { cameraEnabled },
      locationMode = { locationMode },
      voiceWakeMode = { voiceWakeMode },
      motionActivityAvailable = { motionActivityAvailable },
      motionPedometerAvailable = { motionPedometerAvailable },
      sendSmsAvailable = { sendSmsAvailable },
      readSmsAvailable = { readSmsAvailable },
      smsSearchPossible = { smsSearchPossible },
      callLogAvailable = { callLogAvailable },
      hasRecordAudioPermission = { hasRecordAudioPermission },
      manualTls = { false },
    )
  }
}
