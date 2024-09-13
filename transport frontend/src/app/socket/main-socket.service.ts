import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io } from 'socket.io-client'
import { Ride } from '../interfaces/ride.interface';

@Injectable({
  providedIn: 'root'
})
export class MainSocketService {
  runningRequests:Subject<Ride[]> = new Subject<Ride[]>()
  socket = io('ws://localhost:5000', {}); 

  constructor() { }

  connection() {
    return new Observable(observer => {
      this.socket.on('msg', (data: any) => {
        observer.next(data)
      })
      return () => { this.socket.disconnect() }
    })
  }

  rejectedByAll(){
    return new Observable(observer => {
      this.socket.on('rejected-by-all', (data: any) => {
        observer.next(data)
      })
      return () => { this.socket.disconnect() }
    })
  }

  accepted(){
    return new Observable(observer => {
      this.socket.on('accepted', (data: any) => {
        observer.next(data)
      })
      return () => { this.socket.disconnect() }
    })
  }

  rejected(){
    return new Observable(observer => {
      this.socket.on('rejected', (data: any) => {
        observer.next(data)
      })
      return () => { this.socket.disconnect() }
    })
  }

  rejectedByDriver(){
    return new Observable(observer => {
      this.socket.on('rejected-by-driver', (data: any) => {
        observer.next(data)
      })
      return () => { this.socket.disconnect() }
    })
  }

  driverStatus(){
    return new Observable(observer => {
      this.socket.on('driver-status', (data: any) => {
        observer.next(data)
      })
      return () => { this.socket.disconnect() }
    })
  }

  secondsWithRideDetails(){
    return new Observable(observer => {
      this.socket.on('driver', (data: any) => {
        observer.next(data)
      })
      return () => { this.socket.disconnect() }
    })
  }

  driverUsernameAndStatus(){
    return new Observable(observer => {
      this.socket.on('display', (data: any) => {
        observer.next(data)
      })
      return () => { this.socket.disconnect() }
    })
  }
}
