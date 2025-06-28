import { bind, GLib, Variable } from "astal";
import BarGroup from "./BarGroup";

const nowVar = Variable(GLib.DateTime.new_now_local()).poll(1000, () => {
  return GLib.DateTime.new_now_local()
});

export default () => {
  const timeBind = bind(nowVar).as((now) => {
    return now.format("%I:%M") || "N/A"

  });
  const dateBind = bind(nowVar).as((now) => {
    return now.format("%A, %d/%m") || "N/A";
  });

  return (
    <BarGroup>
      <label className="text-lg text-surface font-bold" label={timeBind} />
      <label className="text-subtitle px-sm" label="•" />
      <label className="text-lg text-surface font-normal" label={dateBind} />
    </BarGroup>
  )
}
