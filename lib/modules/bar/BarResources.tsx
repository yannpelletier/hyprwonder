import { bind, derive, Binding } from "astal";
import { Gtk } from "astal/gtk3";
import { CircularProgress } from "astal/gtk3/widget";
import MemoryService from "../../services/memory";
import MaterialIcon from "../../widgets/MaterialIcon";
import BarGroup from "./BarGroup";

const MAX_TEMPERATURE = 90;

const ResourceContainer = ({
  icon,
  value,
  tooltipText
}: {
  icon: string,
  value: Binding<number>,
  tooltipText: string | Binding<string>,
  visible?: boolean | Binding<boolean>
}) => {
  return (
    <box
      tooltipText={tooltipText}
      className="p-0"
      css="min-width: 1.25rem; min-height: 1.25rem;"
      child={
        <CircularProgress
          className="p-0"
          css="font-size: 4px;"
          startAt={-0.25}
          endAt={0.75}
          value={value}
          child={<MaterialIcon icon={icon} className="p-sm icon-base" />}
        />
      }
    />
  )
}

export default () => {
  const memoryService = MemoryService.getDefault();

  const usedRamBind = bind(memoryService, "usedRam");
  const maxRamBind = bind(memoryService, "maxRam");
  const gpuTemperatureBind = bind(memoryService, "gpuTemperature");
  const cpuUsageBind = bind(memoryService, "cpuUsage");

  const ramUsagePercentageBind = derive([usedRamBind, maxRamBind], (usedRam, maxRam) => {
    return usedRam / maxRam
  })();
  const ramUsageLabelBind = derive([usedRamBind, maxRamBind], (usedRam, maxRam) => {
    return `RAM Usage: ${Math.round(usedRam / maxRam * 100).toString()}%`
  })();

  const gpuTemperaturePercentageBind = gpuTemperatureBind.as((gpuTemperature) => {
    return gpuTemperature ? gpuTemperature / MAX_TEMPERATURE : 0;
  });
  const gpuTemperatureLabelBind = gpuTemperatureBind.as((gpuTemperature) => {
    return `GPU Temperature: ${Math.round(gpuTemperature || 0).toString()}°C`
  });

  const cpuUsageLabelVar = cpuUsageBind.as((cpuUsage) => {
    return `CPU Usage: ${Math.round(cpuUsage * 100).toString()}%`
  });


  return (
    <BarGroup orientation={Gtk.Orientation.HORIZONTAL} halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER} spacing={5}>
      <ResourceContainer
        icon="memory"
        tooltipText={ramUsageLabelBind}
        value={ramUsagePercentageBind}
      />
      <ResourceContainer
        icon="thermostat"
        tooltipText={gpuTemperatureLabelBind}
        value={gpuTemperaturePercentageBind}
        visible={gpuTemperatureBind.as((gpuTemperature) => {
          return gpuTemperature !== null;
        })}
      />
      <ResourceContainer
        icon="developer_board"
        tooltipText={cpuUsageLabelVar}
        value={cpuUsageBind}
      />
    </BarGroup>
  )
}
