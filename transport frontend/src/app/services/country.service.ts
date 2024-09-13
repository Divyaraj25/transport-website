import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { Country } from "../interfaces/country.interface";
import { environment } from "../../environments/env.prod";

@Injectable({
    providedIn: 'root'
})
export class CountryService {

    constructor(private http: HttpClient) { }

    getCountries() {
        return this.http.get(`${environment.baseUrl}/countries`, { withCredentials: true, observe: 'events' })
    }

    getCountryCurrencySymbol(country: string) {
        return this.http.get(`${environment.baseUrl}/countryCurrencySymbol?country=${country}`, { withCredentials: true, observe: 'events' })
    }

    storeCountry(country: Country) {
        return this.http.post(`${environment.baseUrl}/country`, country, { withCredentials: true, observe: 'events' })
    }

    searchCountry(country: string) {
        return this.http.get(`${environment.baseUrl}/searchCountry?search=${country}`, { withCredentials: true, observe: 'events' })
    }

    getCountriesForCities() {
        return this.http.get(`${environment.baseUrl}/cityCountries`, { withCredentials: true, observe: 'events' })
    }

    getCountriesForPricing() {
        return this.http.get(`${environment.baseUrl}/pricingCountries`, { withCredentials: true, observe: 'events' })
    }

    getCountriesforUserAndDriver() {
        return this.http.get(`${environment.baseUrl}/userAndDriverCountries`, { withCredentials: true, observe: 'events' })
    }
}