import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environments/env.prod";

@Injectable({
    providedIn: 'root'
})
export class PricingService {
    constructor(private http: HttpClient) { }

    getVehiclesOfCities(city: string) {
        console.log("reached")
        return this.http.get(`${environment.baseUrl}/getVehiclesOfCity?city=${city}`, { withCredentials: true, observe: 'events' })
    }

    getPricingData() {
        return this.http.get(`${environment.baseUrl}/pricingData`, { withCredentials: true, observe: 'events' })
    }

    addPricing(data: any) {
        return this.http.post(`${environment.baseUrl}/pricing`, data, { withCredentials: true, observe: 'events' })
    }

    editPricing(form: any, city: string, type: string) {
        return this.http.post(`${environment.baseUrl}/editpricing?city=${city}&vehicle_type=${type}`, form, { withCredentials: true, observe: 'events' })
    }

    getVehiclesOfThatCityWithPricing(city: string, minutes: number, kms: number) {
        return this.http.post(`${environment.baseUrl}/calculateVehiclePricing`, { city, minutes, kms }, { withCredentials: true, observe: 'events' })
    }
}