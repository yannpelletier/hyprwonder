import { bind, derive } from "astal";
import { Gtk } from "astal/gtk3";
import AstalNetwork from "gi://AstalNetwork";
import MaterialIcon from "../../widgets/MaterialIcon";

export default () => {
  const network = AstalNetwork.get_default();

  const primaryBind = bind(network, "primary");

  const wifi = network.wifi;
  const wifiSsidBind = bind(wifi, "ssid");
  const wifiEnabledBind = bind(wifi, "enabled");
  const wifiStateBind = bind(wifi, "state");
  const wifiStrength = bind(wifi, "strength");

  const wired = network.wired;
  const wiredStateBind = bind(wired, "state");

  // Derive network icon based on primary, Wi-Fi, and wired states
  const iconBind = derive(
    [primaryBind, wifiEnabledBind, wifiStateBind, wifiStrength, wiredStateBind],
    (primary, wifiEnabled, wifiState, wifiStrength, wiredState) => {
      switch (primary) {
        case AstalNetwork.Primary.WIFI: {
          if (!wifiEnabled) {
            return "signal_wifi_off";
          } else if (wifiState === AstalNetwork.DeviceState.DISCONNECTED) {
            return "signal_wifi_statusbar_not_connected";
          } else if (wifiState === AstalNetwork.DeviceState.FAILED) {
            return "signal_wifi_off";
          }

          // Map strength (0–100) to icons
          const strength = wifiStrength || 0;
          const needsAuth = wifiState == AstalNetwork.DeviceState.NEED_AUTH;
          if (strength >= 90) {
            return needsAuth ? "network_wifi_locked" : "signal_wifi_4_bar"
          } else if (strength >= 70) {
            return needsAuth ? "network_wifi_locked" : "network_wifi";
          } else if (strength >= 50) {
            return needsAuth ? "network_wifi_3_bar_locked" : "network_wifi_3_bar";
          } else if (strength >= 30) {
            return needsAuth ? "network_wifi_2_bar_locked" : "network_wifi_2_bar";
          } else if (strength >= 10) {
            return needsAuth ? "network_wifi_1_bar_locked" : "network_wifi_1_bar";
          } else {
            return needsAuth ? "wifi_lock" : "signal_wifi_bad";
          }
        }
        case AstalNetwork.Primary.WIRED:
          return wiredState === AstalNetwork.DeviceState.ACTIVATED ? "cable" : "cable_unplugged";

        default:
          return "wifi_off";
      }
    })();

  // Derive tooltip text for network status
  const tooltipBind = derive(
    [primaryBind, wifiEnabledBind, wifiStateBind, wifiSsidBind, wiredStateBind],
    (primary, wifiEnabled, wifiState, wifiSsid, wiredState) => {
      switch (primary) {
        case AstalNetwork.Primary.WIFI: {
          if (!wifiEnabled) {
            return "Wi-Fi Disabled";
          } else if (wifiState === AstalNetwork.DeviceState.DISCONNECTED) {
            return "Wi-Fi Disabled";
          } else if (wifiState === AstalNetwork.DeviceState.NEED_AUTH) {
            return "Wi-Fi Needs Authentication";
          } else if (wifiState === AstalNetwork.DeviceState.FAILED) {
            return "Wi-Fi Connection Failed";
          }

          return `Connected to ${wifiSsid || "Wi-Fi"}`
        }
        case AstalNetwork.Primary.WIRED:
          return wiredState === AstalNetwork.DeviceState.ACTIVATED ? "cable" : "cable_unplugged";

        default:
          return "wifi_off";
      }
    })();

  return (
    <box
      tooltipText={tooltipBind}
      halign={Gtk.Align.CENTER}
      valign={Gtk.Align.CENTER}
      child={
        <button
          halign={Gtk.Align.CENTER}
          valign={Gtk.Align.CENTER}
          className="btn-ghost rounded-full"
          child={<MaterialIcon icon={iconBind} className="material-icon" />}
        />
      }
    />
  )
}
