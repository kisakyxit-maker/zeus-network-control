package com.zeusmob

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent

class ZeusAccessibilityService : AccessibilityService() {
    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // No-op. Service exists so it can be enabled by the user in Android
        // Accessibility settings; runtime logic is handled in JS.
    }

    override fun onInterrupt() {
        // No-op.
    }
}
