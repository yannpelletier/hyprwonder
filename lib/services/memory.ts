import { execAsync, property, readFileAsync, register, GLib, GObject, Variable, Gio } from "astal";

const DISK_CACHE_DURATION = 60 * 1000; // 1 minute
const CPU_CACHE_DURATION = 5 * 1000; // 10 seconds
const GPU_CACHE_DURATION = 15 * 1000; // 10 seconds
const MEMORY_CACHE_DURATION = 10 * 1000; // 10 seconds

@register({ GTypeName: "MemoryService" })
export default class MemoryService extends GObject.Object {
  static instance: MemoryService;
  static getDefault() {
    if (!this.instance) {
      this.instance = new MemoryService();
    }
    return this.instance;
  }

  #usedRam = 0;
  #maxRam = 0;
  #usedSwap = 0;
  #maxSwap = 0;
  #usedDiskSpace = 0;
  #maxDiskSpace = 0;
  #gpuTemperature: number | null = null; // °C, null if unavailable
  #cpuUsage = 0; // Percentage (0-1)

  // Store previous CPU stats for usage calculation
  #prevCpuStats = Variable<{ total: number; idle: number } | null>(null);

  @property(Number)
  get usedRam() {
    return this.#usedRam;
  }
  @property(Number)
  get maxRam() {
    return this.#maxRam;
  }
  @property(Number)
  get usedSwap() {
    return this.#usedSwap;
  }
  @property(Number)
  get maxSwap() {
    return this.#maxSwap;
  }
  @property(Number)
  get usedDiskSpace() {
    return this.#usedDiskSpace;
  }
  @property(Number)
  get maxDiskSpace() {
    return this.#maxDiskSpace;
  }
  @property(Number)
  get gpuTemperature() {
    return this.#gpuTemperature;
  }
  @property(Number)
  get cpuUsage() {
    return this.#cpuUsage;
  }

  constructor() {
    super();
    this.#updateMemory();
    this.#updateDiskSpace();
    this.#updateGpuTemperature();
    this.#updateCpuUsage();
    this.#scheduleUpdates();
  }

  async #updateMemory() {
    try {
      const memInfo = await readFileAsync("/proc/meminfo");
      const memLines = memInfo.split("\n");

      const memTotalLine = memLines.find((line) => line.startsWith("MemTotal:"));
      const memAvailableLine = memLines.find((line) => line.startsWith("MemAvailable:"));
      const swapTotalLine = memLines.find((line) => line.startsWith("SwapTotal:"));
      const swapFreeLine = memLines.find((line) => line.startsWith("SwapFree:"));

      const memTotal = memTotalLine ? parseInt(memTotalLine.split(/\s+/)[1]) : 0;
      const memAvailable = memAvailableLine ? parseInt(memAvailableLine.split(/\s+/)[1]) : 0;
      const swapTotal = swapTotalLine ? parseInt(swapTotalLine.split(/\s+/)[1]) : 0;
      const swapFree = swapFreeLine ? parseInt(swapFreeLine.split(/\s+/)[1]) : 0;

      this.#usedRam = (memTotal - memAvailable) / (1024 * 1024); // GB
      this.notify("used-ram");
      this.#maxRam = memTotal / (1024 * 1024);
      this.notify("max-ram");
      this.#usedSwap = (swapTotal - swapFree) / (1024 * 1024);
      this.notify("used-swap");
      this.#maxSwap = swapTotal / (1024 * 1024);
      this.notify("max-swap");
    } catch (error) {
      console.error("Error updating memory:", error);
      this.#usedRam = 0;
      this.#maxRam = 0;
      this.#usedSwap = 0;
      this.#maxSwap = 0;
      this.notify("used-ram");
      this.notify("max-ram");
      this.notify("used-swap");
      this.notify("max-swap");
    }
  }

  async #updateDiskSpace() {
    try {
      const dfOutput = await execAsync(["df", "-k", "--output=source,size,used"]);
      const dfLines = dfOutput.split("\n").slice(1);
      let totalKB = 0;
      let usedKB = 0;

      for (const line of dfLines) {
        const [source, size, used] = line.trim().split(/\s+/);
        if (source.startsWith("/dev/")) {
          totalKB += parseInt(size) || 0;
          usedKB += parseInt(used) || 0;
        }
      }

      this.#usedDiskSpace = usedKB / (1024 * 1024); // GB
      this.notify("used-disk-space");
      this.#maxDiskSpace = totalKB / (1024 * 1024);
      this.notify("max-disk-space");
    } catch (error) {
      console.error("Error updating disk space:", error);
      this.#usedDiskSpace = 0;
      this.#maxDiskSpace = 0;
      this.notify("used-disk-space");
      this.notify("max-disk-space");
    }
  }

  async #updateGpuTemperature() {
    try {
      let temp: number | null = null;
      // Use Gio.File to scan /sys/class/drm
      const drmDir = Gio.File.new_for_path("/sys/class/drm");
      const enumerator = await new Promise<Gio.FileEnumerator>((resolve, reject) => {
        drmDir.enumerate_children_async(
          "standard::name",
          Gio.FileQueryInfoFlags.NONE,
          GLib.PRIORITY_DEFAULT,
          null,
          (source, result) => {
            try {
              resolve(drmDir.enumerate_children_finish(result));
            } catch (err) {
              reject(err);
            }
          }
        );
      });

      let fileInfo;
      while ((fileInfo = await new Promise<Gio.FileInfo | null>((resolve) => {
        enumerator.next_files_async(1, GLib.PRIORITY_DEFAULT, null, (source, result) => {
          const files = enumerator.next_files_finish(result);
          resolve(files[0] || null);
        });
      }))) {
        const name = fileInfo.get_name();
        if (name.startsWith("card")) {
          const hwmonDir = Gio.File.new_for_path(`/sys/class/drm/${name}/device/hwmon`);
          if (hwmonDir.query_exists(null)) {
            const hwmonEnumerator = await new Promise<Gio.FileEnumerator>((resolve, reject) => {
              hwmonDir.enumerate_children_async(
                "standard::name",
                Gio.FileQueryInfoFlags.NONE,
                GLib.PRIORITY_DEFAULT,
                null,
                (source, result) => {
                  try {
                    resolve(hwmonDir.enumerate_children_finish(result));
                  } catch (err) {
                    reject(err);
                  }
                }
              );
            });

            let hwmonInfo;
            while ((hwmonInfo = await new Promise<Gio.FileInfo | null>((resolve) => {
              hwmonEnumerator.next_files_async(1, GLib.PRIORITY_DEFAULT, null, (source, result) => {
                const files = hwmonEnumerator.next_files_finish(result);
                resolve(files[0] || null);
              });
            }))) {
              const hwmonName = hwmonInfo.get_name();
              const tempFile = Gio.File.new_for_path(`/sys/class/drm/${name}/device/hwmon/${hwmonName}/temp1_input`);
              if (tempFile.query_exists(null)) {
                const tempValue = await readFileAsync(tempFile.get_path()!);
                temp = parseInt(tempValue) / 1000; // Millidegrees to °C
                break;
              }
            }
            await new Promise<void>((resolve) => {
              hwmonEnumerator.close_async(GLib.PRIORITY_DEFAULT, null, () => resolve());
            });
            if (temp !== null) break;
          }
        }
      }
      await new Promise<void>((resolve) => {
        enumerator.close_async(GLib.PRIORITY_DEFAULT, null, () => resolve());
      });

      // Fallback to nvidia-smi
      if (temp === null) {
        try {
          const nvidiaOutput = await execAsync("nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader");
          temp = parseInt(nvidiaOutput.trim());
        } catch (err) {
          // No NVIDIA GPU or nvidia-smi not installed
        }
      }

      this.#gpuTemperature = temp;
      this.notify("gpu-temperature");
    } catch (error) {
      console.error("Error updating GPU temperature:", error);
      this.#gpuTemperature = null;
      this.notify("gpu-temperature");
    }
  }

  async #updateCpuUsage() {
    try {
      const stat = await readFileAsync("/proc/stat");
      const cpuLine = stat.split("\n").find((line) => line.startsWith("cpu "));
      if (!cpuLine) throw new Error("No CPU data in /proc/stat");

      const [, user, nice, system, idle, iowait, irq, softirq] = cpuLine.split(/\s+/).map(Number);
      const total = user + nice + system + idle + iowait + irq + softirq;
      const idleTime = idle + iowait;

      const currentStats = { total, idle: idleTime };
      const prevStats = this.#prevCpuStats.get();

      if (prevStats) {
        const deltaTotal = currentStats.total - prevStats.total;
        const deltaIdle = currentStats.idle - prevStats.idle;
        this.#cpuUsage = deltaTotal > 0 ? ((deltaTotal - deltaIdle) / deltaTotal) : 0;
        this.notify("cpu-usage");
      }

      this.#prevCpuStats.set(currentStats);
    } catch (error) {
      console.error("Error updating CPU usage:", error);
      this.#cpuUsage = 0;
      this.notify("cpu-usage");
    }
  }

  #scheduleUpdates() {
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, MEMORY_CACHE_DURATION, () => {
      this.#updateMemory();
      return GLib.SOURCE_CONTINUE;
    });

    GLib.timeout_add(GLib.PRIORITY_DEFAULT, CPU_CACHE_DURATION, () => {
      this.#updateCpuUsage();
      return GLib.SOURCE_CONTINUE;
    });

    GLib.timeout_add(GLib.PRIORITY_DEFAULT, GPU_CACHE_DURATION, () => {
      this.#updateGpuTemperature();
      return GLib.SOURCE_CONTINUE;
    });

    GLib.timeout_add(GLib.PRIORITY_DEFAULT, DISK_CACHE_DURATION, () => {
      this.#updateDiskSpace();
      return GLib.SOURCE_CONTINUE;
    });
  }
}
