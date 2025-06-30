import { Astal } from "ags/gtk4";
import style from "./style.scss"
import { CliRequest, parseCliInput } from "./lib/cli";

export interface AppModule {
  run: (app: Astal.Application) => void;
  requestHandler?: (request: CliRequest) => string | null;
}
