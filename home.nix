{
  self,
  config,
  pkgs,
  lib,
  inputs,
  ...
}: {
  home.packages = [
    self.packages.${pkgs.system}.hyprwonder
  ];

  # home.packages = with pkgs; [
  #   brightnessctl
  #   wl-gammactl
  # ];
  #
  # wayland.windowManager.hyprland = if (config.programs.hyprland.enable or false) == true then {
  #   settings = {
  #     exec-once = [
  #       "ags run"
  #     ];
  #
  #     bind = [
  #       # Launcher and Overview
  #       "$mod, Tab, exec, astal app-launcher"
  #       "$mod, V, exec, astal 'clipboard-history --route search'"
  #       "$mod, Period, exec, pkill rofi || ${pkgs.rofi}/bin/rofi -show emoji"
  #       "$mod+SHIFT, E, exec, pkill rofi || ${pkgs.rofi}/bin/rofi -show filebrowser"
  #       "CTRL+ALT, Q, exec, astal logout"
  #
  #       # Widgets
  #       "$mod, W, exec, astal 'wallpaper-selector'"
  #       "$mod, P, exec, astal 'password-manager --route search'"
  #       "CTRL+ALT, B, exec, astal -t bar"
  #       "CTRL+ALT, A, exec, astal -t right-drawer"
  #     ];
  #
  #     bindr = [
  #       "CTRL+ALT, R, exec, ags run || pkill -f ags"
  #     ];
  #   };
  # } else {};
}
