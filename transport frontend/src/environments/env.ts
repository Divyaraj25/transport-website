import { SettingService } from "../app/services/setting.service"

export const environment = {
    production: false,
    mapId:"3b9e7b6f6b9d7d5",
    baseUrl: 'http://localhost:5000',
    apiKey: 'AIzaSyCmHei9zpwGHiiszBXaCu9pi-zzEezyors',
    STRIPE_PUBLISHABLE_KEY: SettingService.ApiKey,
    STRIPE_SECRET_KEY: SettingService.PrivateKey
}