{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

    astal = {
      url = "github:aylur/astal";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    ags = {
      url = "github:aylur/ags";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    self,
    nixpkgs,
    astal,
    ags,
    ...
  } @ inputs: let
    systems = [
      "x86_64-linux"
      "aarch64-linux"
    ];
    forEachSystem = nixpkgs.lib.genAttrs systems;

    pkgs = system: nixpkgs.legacyPackages.${system};

    nativeBuildInputs = system: with pkgs system; [
      meson
      ninja
      pkg-config
      gobject-introspection
      wrapGAppsHook4
      dart-sass
      esbuild
    ];

    astalPackages = system: with astal.packages.${system}; [
      io
      astal4
      battery
      wireplumber
      network
      mpris
      powerprofiles
      tray
      bluetooth
    ];
  in {
    packages = forEachSystem (
      system: let
        pkgs = nixpkgs.legacyPackages.${system};
      in {
        default = ags.lib.bundle {
          inherit pkgs;

          src = ./src;
          name = "hyprwonder";
          entry = "app.ts";
             
          inherit nativeBuildInputs system;
          buildInputs = astalPackages system ++ [pkgs.gjs];
        };
      }
    );

    devShells = forEachSystem (
      system: let
        pkgs = nixpkgs.legacyPackages.${system};
      in {
        default = pkgs.mkShell {
          packages = nativeBuildInputs ++ astalPackages ++ [pkgs.gjs];

          shellHook = ''
            # Exporting glib-networking modules
            export GIO_EXTRA_MODULES="${pkgs.glib-networking}/lib/gio/modules"
            if [ "''${PWD##*/}" = "hyprwonder" ]; then
              echo "Initialise dependencies required in order for tsserver to work? (y/anything_else)"
              read consent
              if [ "$consent" = "y" ]; then
                ags types -d .;
              fi
            else
              echo "You're not in the hyprwonder root directory, initialisation failed"
            fi
          '';
        };
      }
    );
  };
}
