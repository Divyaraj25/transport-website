import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { User } from "../interfaces/user.interface";
import { VehicleType } from "../interfaces/vehicle-type.interface";
import { GoogleMapsModule } from "@angular/google-maps";
import { environment } from "../../environments/env.prod";
import { Ride } from "../interfaces/ride.interface";
import { Driver } from "../interfaces/driver.interface";

@Injectable({
    providedIn: 'root'
})

export class RideService {
    constructor(private http: HttpClient) { }

    createRide(
        user: User,
        source_Destination_Stops: any,
        sourceLatLng: google.maps.LatLng,
        destinationLatLng: google.maps.LatLng,
        waypointsLatLng: any[],
        time: string,
        distance: string,
        selectedServiceType: VehicleType,
        paymentMethod: string,
        city: string,
        cardId?: string,
        date: Date | number = new Date(),
    ) {

        let Slatlng = [sourceLatLng.lat(), sourceLatLng.lng()]
        let Dlatlng = [destinationLatLng.lat(), destinationLatLng.lng()]

        let obj = {
            user,
            city,
            source_Destination_Stops,
            Slatlng,
            Dlatlng,
            waypointsLatLng,
            time,
            distance,
            date,
            selectedServiceType,
            paymentMethod,
            cardId
        }

        return this.http.post<any>(
            `${environment.baseUrl}/createRide`,
            obj,
            { withCredentials: true, observe: 'events' })
    }

    getRidesDetails() {
        return this.http.get<Ride>(`${environment.baseUrl}/getRides`, { withCredentials: true, observe: 'events' })
    }

    getRunningRequests() {
        return this.http.get<Ride>(`${environment.baseUrl}/getRunningRides`, { withCredentials: true, observe: 'events' })
    }

    getHistoryData() {
        return this.http.get<Ride>(`${environment.baseUrl}/history`, { withCredentials: true, observe: 'events' })
    }

    getExportData() {
        return this.http.get<Ride>(`${environment.baseUrl}/exportData`, { withCredentials: true, observe: 'events' })
    }

    generateInvoice(rideId: string) {
        return this.http.post(`${environment.baseUrl}/getInvoice`, { rideId }, { withCredentials: true, observe: 'events' })
    }

    cancelRide(_id: string) {
        return this.http.post(`${environment.baseUrl}/deleteRide`, { _id }, { withCredentials: true, observe: 'events' })
    }

    searchByValue(searchBy: any, value: any = '', filterBy: string = "status", filterValue: string = "") {
        return this.http.post(`${environment.baseUrl}/searchRide`, { value, searchBy, filterBy, filterValue }, { withCredentials: true, observe: "events" })
    }

    searchByValueInHistory(searchBy: string = '', value: any = '', filterBy: string, filterValue: any = '', fromDate: Date | string | null = null, toDate: Date | string | null = null) {
        return this.http.post(`${environment.baseUrl}/searchHistory`, { value, searchBy, filterBy, filterValue, fromDate, toDate }, { withCredentials: true, observe: "events" })
    }

    startCronForRide(rideId: string, driverId: string = '', assignAny: boolean = false) {
        return this.http.post(`${environment.baseUrl}/assignDriver`, { driverId, rideId, assignAny }, { withCredentials: true, observe: 'events' })
    }

    acceptRide(rideId: string, driverId: string) {
        return this.http.post(`${environment.baseUrl}/acceptRide`, { rideId, driverId }, { withCredentials: true, observe: 'events' })
    }

    rejectRide(rideId: string, driverId: string) {
        return this.http.post(`${environment.baseUrl}/rejectRide`, { rideId, driverId }, { withCredentials: true, observe: 'events' })
    }

    statusChange(rideId: string, driverId: string, status: string) {
        return this.http.post(`${environment.baseUrl}/statusChange`, { rideId, driverId, status }, { withCredentials: true, observe: 'events' })
    }

    confirmPayment(rideId: string, rating: number) {
        return this.http.post(`${environment.baseUrl}/confirmPayment`, { rideId, rating }, { withCredentials: true, observe: 'events' })
    }
}