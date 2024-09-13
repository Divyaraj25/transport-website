import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environments/env.prod";
import { enableDebugTools } from "@angular/platform-browser";

@Injectable({
    providedIn: 'root'
})

export class CityService {
    constructor(private http: HttpClient) { }

    checkCityInDatabase(cca2: string, cityName: string) {
        return this.http.post(`${environment.baseUrl}/checkCity`, { cca2, city: cityName }, { withCredentials: true, observe: 'events' })
    }

    getCities(cca2: string) {
        return this.http.get(`${environment.baseUrl}/cities?cca2=${cca2}`, { withCredentials: true, observe: 'events' })
    }

    getCitiesForPricing(cca2: string) {
        return this.http.get(`${environment.baseUrl}/pricingCities?cca2=${cca2}`, { withCredentials: true, observe: 'events' })
    }

    getCityDataForUsersAndDrivers(cca2: string) {
        return this.http.get(`${environment.baseUrl}/userAndDriverCities?cca2=${cca2}`, { withCredentials: true, observe: 'events' })
    }

    addCityInDatabase(form: FormData, zone: google.maps.LatLngLiteral[]) {
        let country = form.get('country')
        let city = form.get('city')
        let cca2 = form.get('cca2')
        return this.http.post(
            `${environment.baseUrl}/city`,
            { country, city, cca2, zone },
            {
                withCredentials: true,
                observe: 'events'
            })
    }

    checkZoneInDatabase(cca2: string, editmode:boolean,city:string,zone: google.maps.LatLngLiteral[]) {
        return this.http.post(`${environment.baseUrl}/checkZone`, {editmode,city, cca2, zone }, { withCredentials: true, observe: 'events' })
    }

    editZoneInDatabase(cca2: string, city:string,zone: google.maps.LatLngLiteral[]) {
        return this.http.post(`${environment.baseUrl}/editCityZone`, {city, cca2, zone }, { withCredentials: true, observe: 'events' })
    }

    checkFromLocationFromCityZone(cca2:string,point:[number,number]){
        return this.http.post(`${environment.baseUrl}/checkFromLocation`, { cca2, point }, { withCredentials: true, observe: 'events' })
    }
}