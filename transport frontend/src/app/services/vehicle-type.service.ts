import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { VehicleType } from "../interfaces/vehicle-type.interface";
import { JsonPipe } from "@angular/common";
import { environment } from "../../environments/env.prod";

@Injectable({
    providedIn: 'root'
})
export class VehicleTypeService {
    constructor(private http: HttpClient) { }

    storeVehicle(vehicle: any) {
        return this.http.post(
            `${environment.baseUrl}/vehicle`,
            vehicle,
            {
                withCredentials: true,
                observe: 'events'
            }
        )
    }

    getVehicles() {
        return this.http.get(`${environment.baseUrl}/vehicles`, { withCredentials: true, observe: 'events' })
    }

    editVehicle(vehicleId: string, changes: any) {
        return this.http.post(
            `${environment.baseUrl}/editvehicle?vehicleId=${vehicleId}`,
            changes,
            { withCredentials: true, observe: 'events' }
        )
    }
}