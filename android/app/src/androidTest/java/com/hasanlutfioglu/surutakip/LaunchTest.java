package com.hasanlutfioglu.surutakip;

import android.content.Context;
import android.content.Intent;
import android.content.ComponentName;
import android.content.pm.PackageManager;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.By;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.Until;
import com.google.androidbrowserhelper.trusted.ManageDataLauncherActivity;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class LaunchTest {
 @Test public void siteSettingsShortcutDoesNotCrashWithoutBrowserSupport() {
  Context context=InstrumentationRegistry.getInstrumentation().getTargetContext();
  // Reproduces LauncherActivity's startup callback. This failed on Android when
  // ManageDataLauncherActivity was omitted from the manifest.
  ManageDataLauncherActivity.addSiteSettingsShortcut(context, context.getPackageName());
  ComponentName component=new ComponentName(context, ManageDataLauncherActivity.class);
  assertEquals(PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
   context.getPackageManager().getComponentEnabledSetting(component));
 }
 @Test public void launcherOpensChrome() throws Exception {
  Context context=InstrumentationRegistry.getInstrumentation().getTargetContext();
  UiDevice device=UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
  device.pressHome();
  Intent launch=context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
  assertNotNull(launch);
  context.startActivity(launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TASK));
  assertTrue("Launcher did not bring Chrome to the foreground",
   device.wait(Until.hasObject(By.pkg("com.android.chrome").depth(0)),20000));
 }
}
