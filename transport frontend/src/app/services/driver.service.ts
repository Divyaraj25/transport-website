import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environments/env.prod";

@Injectable({
    providedIn: 'root'
})

export class DriverService {

    constructor(private http: HttpClient) { }

    getDrivers(page: number, sort: string, limit: number) {
        return this.http.get(`${environment.baseUrl}/drivers?page=${page}&sortV=${sort}&limitV=${limit}`, { withCredentials: true, observe: 'events' })
    }
    addDriver(form: FormData) {
        return this.http.post(`${environment.baseUrl}/driver`, form, { withCredentials: true, observe: 'events' })
    }
    editDriver(form: FormData) {
        return this.http.post(`${environment.baseUrl}/editDriver`, form, { withCredentials: true, observe: 'events' })
    }
    deleteDriver(_id: string) {
        return this.http.delete(`${environment.baseUrl}/deleteDriver?_id=${_id}`, { withCredentials: true, observe: 'events' })
    }
    searchDriver(search: any, page: number, sort: string, pageSize: number) {
        let username = search.username
        let email = search.email
        let phone_no = search.phone_no
        let uid = search.uid
        return this.http.post(`${environment.baseUrl}/searchDriver?&limitV=${pageSize}&pageV=${page}&sortV=${sort}`, { username, email, uid, phone_no }, { withCredentials: true, observe: 'events' })
    }

    approveDriver(_id: string, approved: boolean) {
        return this.http.post(`${environment.baseUrl}/approveDriver`, { _id, approved }, { withCredentials: true, observe: 'events' })
    }

    setServiceType(_id: string, vehicle_type: string, vehicle_image: string) {
        return this.http.post(`${environment.baseUrl}/assignServiceToDriver`, { _id, vehicle_type, vehicle_image }, { withCredentials: true, observe: 'events' })
    }

    getDriversForRide(city: string, vehicle_type: string,rideId:string) {
        return this.http.post(`${environment.baseUrl}/driverForRide?city=${city}&vehicle_type=${vehicle_type}`,{rideId:rideId}, { withCredentials: true, observe: "events" })
    }
}