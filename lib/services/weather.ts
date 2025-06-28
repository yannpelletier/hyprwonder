import { GLib, GObject, property, register } from "astal";
import { WWO_CODE } from "../data/weather";

import type { WeatherCode } from "../data/weather";

const CACHE_DURATION = 30 * 60 * 1000000; // 15 minutes in microseconds
const WEATHER_CACHE_FOLDER = `${GLib.get_user_cache_dir()}/ags/weather`;
const WEATHER_CACHE_PATH = WEATHER_CACHE_FOLDER + "/wttr.in.txt";

let i = 0;

@register({ GTypeName: "WeatherService" })
export default class WeatherService extends GObject.Object {
  static instance: WeatherService;
  static getDefault() {
    if (!this.instance)
      this.instance = new WeatherService();

    return this.instance;
  }

  #temperature: string = "0°C";
  #feelsLike: string = "0°C";
  #description: string = "N/A";
  #icon: string = this.#getWeatherIcon("296");
  #city: string = "Quebec";

  constructor() {
    super();
    this.#updateWeather();
    this.#scheduleUpdates();
  }

  @property(String)
  get temperature() {
    return this.#temperature;
  }

  @property(String)
  get feelsLike() {
    return this.#feelsLike;
  }

  @property(String)
  get description() {
    return this.#description;
  }

  @property(String)
  get icon() {
    return this.#icon;
  }

  @property(String)
  get city() {
    return this.#city;
  }

  async #getLocation() {
    // try {
    //   const response = await Utils.execAsync(['curl', '-s', '-k', 'https://ipapi.co/json/']);
    //   const data = JSON.parse(response);
    //   return data.city || userOptions.weather?.city || 'Cairo';
    // } catch (err) {
    //   return userOptions.weather?.city || 'Cairo';
    // }
    return 'Quebec'
  }

  #getWeatherIcon(weatherCode: WeatherCode) {
    const condition = WWO_CODE[weatherCode];
    switch (condition) {
      case 'Sunny': return 'light_mode';
      case 'PartlyCloudy': return 'partly_cloudy_day';
      case 'Cloudy':
      case 'VeryCloudy': return 'cloud';
      case 'Fog': return 'foggy';
      case 'LightShowers':
      case 'LightRain': return 'water_drop';
      case 'HeavyRain':
      case 'HeavyShowers': return 'rainy';
      case 'ThunderyShowers':
      case 'ThunderyHeavyRain': return 'thunderstorm';
      case 'LightSnow':
      case 'HeavySnow':
      case 'LightSnowShowers':
      case 'HeavySnowShowers': return 'ac_unit';
      case 'LightSleet':
      case 'LightSleetShowers': return 'weather_mix';
      default: return 'device_thermostat';
    }
  }

  async #updateWeather() {
    // try {
    //   const city = await this._getLocation();
    //   const encodedCity = encodeURIComponent(city.trim());
    //   const cmd = ['curl', '-s', '-k', '--connect-timeout', '5', `https://wttr.in/${encodedCity}?format=j1`];
    //   const response = await Utils.execAsync(cmd);
    //
    //   if (!response) throw new Error('Empty response');
    //
    //   const data = JSON.parse(response);
    //   const current = data.current_condition[0];
    //
    //   this._temperature = `${current.temp_C}°C`;
    //   this._feelsLike = `${current.FeelsLikeC}°C`;
    //   this._description = current.weatherDesc[0].value;
    //   this._icon = this._getWeatherIcon(current.weatherCode);
    //
    //   this.emit('changed');
    //   Utils.exec(`echo '${response}' > ${WEATHER_CACHE_PATH}`);
    //
    // } catch (error) {
    //   console.error('Weather update failed:', error);
    //   this._loadCachedWeather();
    // }


    i++;
    this.#temperature = `${i}°C`;
    this.#feelsLike = `${i}°C`;
    this.#description = "N/A";
    this.#icon = this.#getWeatherIcon("296");
    this.#city = "Quebec"
  }

  #loadCachedWeather() {
    // try {
    //   const data = Utils.readFile(WEATHER_CACHE_PATH);
    //   const parsed = JSON.parse(data);
    //   const current = parsed.current_condition[0];
    //
    //   this._temperature = `${current.temp_C}°C`;
    //   this._feelsLike = `${current.FeelsLikeC}°C`;
    //   this._description = current.weatherDesc[0].value;
    //   this._icon = this._getWeatherIcon(current.weatherCode);
    //
    //   this.emit('changed');
    // } catch (error) {
    //   console.error('Failed to load cached weather:', error);
    // }
  }

  #scheduleUpdates() {
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, CACHE_DURATION, () => {
      this.#updateWeather();
      return GLib.SOURCE_CONTINUE;
    });
  }
}
