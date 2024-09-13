import { Injectable } from "@angular/core";
import { environment } from "../../environments/env.prod";
import { HttpClient } from "@angular/common/http";
import { Subject } from "rxjs";

@Injectable({
    providedIn: 'root'
})

export class SettingService {

    nodeMailerEmail: Subject<string> = new Subject()
    nodeMailerPassword: Subject<string> = new Subject()
    twilioAccountSid: Subject<string> = new Subject()
    twilioAuthToken: Subject<string> = new Subject()
    twilioPhoneNo: Subject<string> = new Subject()
    stripeApiKey: Subject<string> = new Subject()
    stripePrivateKey: Subject<string> = new Subject()

    public static ApiKey: string
    public static PrivateKey: string

    constructor(private http: HttpClient) { }

    setAllValues(data: any) {
        console.log(data)
        this.nodeMailerEmail.next(data.nodeMailerEmail)
        this.nodeMailerPassword.next(data.nodeMailerPassword)
        this.twilioAccountSid.next(data.twilioAccountSid)
        this.twilioAuthToken.next(data.twilioAuthToken)
        this.twilioPhoneNo.next(data.twilioPhoneNo)
        this.stripeApiKey.next(data.stripeApiKey)
        this.stripePrivateKey.next(data.stripePrivateKey)

        SettingService.ApiKey = data.stripeApiKey
        SettingService.PrivateKey = data.stripePrivateKey
    }

    getSettings() {
        return this.http.get(`${environment.baseUrl}/settings`, { withCredentials: true, observe: 'events' })
    }

    setSettings(
        _id: string,
        time: string,
        stops: string,
        twilioPhoneNo: string,
        twilioAccountSid: string,
        twilioAuthToken: string,
        stripeApiKey: string,
        stripePrivateKey: string,
        nodeMailerEmail: string,
        nodeMailerPassword: string
    ) {
        return this.http.post(
            `${environment.baseUrl}/settings`,
            { _id, time, stops, twilioPhoneNo, twilioAccountSid, twilioAuthToken, stripeApiKey, stripePrivateKey, nodeMailerEmail, nodeMailerPassword },
            { withCredentials: true, observe: 'events' }
        )
    }
}