import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from './common.service';
import { PushNotificationsService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(private http: HttpClient, private router: Router, private commonService: CommonService, private notification: PushNotificationsService) { }

  encode(email: string) {
    return btoa(email)
  }

  decode(email: string) {
    return atob(email)
  }

  login(email: string, password: string) {
    this.http.post(
      'http://localhost:5000/login',
      { email, password },
      { withCredentials: true, observe: 'events' }
    )
      .subscribe({
        next: (data: any) => {
          if (data?.body?.data) {
            localStorage.setItem('UTlenAma', this.encode(data.body.data))
          }
          if (data?.body?.message) {
            this.commonService.toast(data.body.message, 'success')
          }
          if (data?.body?.token) {
            localStorage.setItem("klenTUkn", data.body.token)
            if (!localStorage.getItem('theme')) {
              localStorage.setItem("theme", 'light')
            }
          }
        },
        complete: () => {
          this.router.navigate(['/admin'])
        }
      }
      )
  }

  logout() {
    try {
      let token: string | null = localStorage.getItem('klenTUkn')
      if (token) {
        this.http.post('http://localhost:5000/logout', { email: this.decode(localStorage.getItem('UTlenAma')!), token }, { withCredentials: true, observe: 'events' }).subscribe({

          next: (data: any) => {
            this.commonService.toast(data.body.message, 'success')
          },
          complete: () => {
            localStorage.removeItem('klenTUkn')
            localStorage.removeItem('UTlenAma')
            this.router.navigate(['/login'])
          }
        })
      } else {
        this.router.navigate(['/login'])
      }
    } catch (error) {
      console.log(error)
    }
  }
}
