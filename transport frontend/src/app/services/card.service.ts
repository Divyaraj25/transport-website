import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environments/env.prod";

@Injectable({
    providedIn: 'root'
})

export class CardService {

    constructor(private http: HttpClient) { }

    getCards(custId: string) {
        return this.http.get(`https://api.stripe.com/v1/customers/${custId}/cards`, {
            headers: {
                'Authorization': 'Bearer ' + environment.STRIPE_SECRET_KEY
            }
        })
    }

    addCard(custId: string, token: string) {
        return this.http.post(`${environment.baseUrl}/card`, { custId, token }, { withCredentials: true, observe: 'events' })
    }

    getCustomerDetail(custId: string) {
        return this.http.get(`https://api.stripe.com/v1/customers/${custId}`, {
            headers: {
                'Authorization': 'Bearer ' + environment.STRIPE_SECRET_KEY
            }
        })
    }

    deleteCard(custId: string, cardId: string) {
        return this.http.delete(`${environment.baseUrl}/deleteCard`, { params: { custId, cardId }, withCredentials: true, observe: 'events' })
    }

    setDefaultCard(custId: string, cardId: string) {
        return this.http.post(`${environment.baseUrl}/setDefaultCard`, { custId, cardId }, { withCredentials: true, observe: 'events' })
    }
}