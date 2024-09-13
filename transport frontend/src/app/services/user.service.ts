import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environments/env.prod";

@Injectable({
    providedIn: 'root'
})

export class UserService {
    constructor(private http: HttpClient) { }

    getUsers(page: number, sort: string, limit: number) {
        return this.http.get(`${environment.baseUrl}/users?page=${page}&sortV=${sort}&limitV=${limit}`, { withCredentials: true, observe: 'events' })
    }

    addUserIntoDatabase(form: FormData) {
        return this.http.post(`${environment.baseUrl}/user`, form, { withCredentials: true, observe: 'events' })
    }

    searchUser(search: any, page: number, sort: string, pageSize: number) {
        let username = search.username
        let email = search.email
        let phone_no = search.phone_no
        let uid = search.uid
        return this.http.post(`${environment.baseUrl}/searchUser?&limitV=${pageSize}&pageV=${page}&sortV=${sort}`, { username, email, uid, phone_no }, { withCredentials: true, observe: 'events' })
    }

    editUser(form: FormData) {
        return this.http.post(`${environment.baseUrl}/editUser`, form, { withCredentials: true, observe: 'events' })
    }

    deleteUser(_id:string){
        return this.http.delete(`${environment.baseUrl}/deleteUser?_id=${_id}`,{withCredentials:true,observe:'events'})
    }
}