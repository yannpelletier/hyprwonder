import app from "ags/gtk4/app"
import Astal from "gi://Astal?version=4.0"
import { CliRequest } from "../../lib/cli";

export interface AppModule {
  run: (app: Astal.Application) => void;
  onRequest: (request: CliRequest) => boolean;
}

export const runApp = (modules: AppModule) => {
  app.run({

  });
  modules.run()

}
