import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { RideService } from '../../../../services/ride.service';
import { HttpEventType } from '@angular/common/http';
import { Ride } from '../../../../interfaces/ride.interface';
import { DateToTimePipe } from '../../../../pipes/time.pipe';
import { RideDetailsComponent } from '../../../../modals/ride-details/ride-details.component';
import { MatDialog } from '@angular/material/dialog';
import { MainSocketService } from '../../../../socket/main-socket.service';
import { CommonService } from '../../../../services/common.service';
import { SettingService } from '../../../../services/setting.service';

@Component({
  selector: 'app-running-request',
  standalone: true,
  imports: [SharedModule, FormsModule, DateToTimePipe],
  templateUrl: './running-request.component.html',
  styleUrl: './running-request.component.scss'
})
export class RunningRequestComponent implements OnInit {

  rides: Ride[] = []
  settingSeconds: number = 0
  arrived: boolean = false
  noData: string = "No Running Requests Right Now"
  driverId!: string
  status: string[] = ['arrived', "picked", "started", "completed"]
  displayStatus: string[] = []
  status1: string = "darshan"
  status2: string = "divyaraj"

  constructor(
    private rideService: RideService,
    private dialog: MatDialog,
    private socketService: MainSocketService,
    private commonService: CommonService,
    private settingService: SettingService
  ) { }

  ngOnInit() {

    setTimeout(() => {
      this.status1 = this.status2
    }, 5000);

    this.settingService.getSettings().subscribe({
      next: (data: any) => {
        if (data.type === HttpEventType.Response) {
          this.settingSeconds = data.body.data.time
        }
      }, complete: () => {

        this.rideService.getRunningRequests().subscribe({
          next: (data: any) => {
            if (data.type === HttpEventType.Response) {
              let preRides = data.body.data
              let time = new Date().getTime()
              preRides.forEach((ride: Ride) => {
                if (ride.status === "pending") {
                  if ((this.settingSeconds - Math.floor(Math.floor(time - new Date(ride.assignedAt!).getTime()) / 1000)) > 0) {
                    this.rides.unshift(ride)
                  }
                  this.rides.forEach(ride => {
                    ride.seconds = (this.settingSeconds - Math.floor(Math.floor(time - new Date(ride.assignedAt!).getTime()) / 1000))
                    ride.dateTime = new Date(ride.dateTime)
                  })
                } else {
                  this.rides.unshift(ride)
                  this.rides.map((ride: Ride) => {
                    if (ride.status!.toLowerCase() === "accepted") {
                      ride.nextStatus = this.status[0]
                    } else if (ride.status!.toLowerCase() === "arrived") {
                      ride.nextStatus = this.status[1]
                    } else if (ride.status!.toLowerCase() === "picked") {
                      ride.nextStatus = this.status[2]
                    } else if (ride.status!.toLowerCase() === "started") {
                      ride.nextStatus = this.status[3]
                    }
                  })
                }
              })
            }
          }
        })
      }
    })


    this.secondsInterval()

    this.socketService.secondsWithRideDetails().subscribe({
      next: (data: any) => {
        if (this.rides.length > 0) {
          let ride = this.rides.find(ride => ride._id === data.ride._id)
          let time = new Date().getTime()
          if (ride) {
            for (let ride of this.rides) {
              if (ride._id === data.ride._id) {
                ride.seconds = (this.settingSeconds - Math.floor(Math.floor(time - new Date(ride.assignedAt!).getTime()) / 1000))
                ride.driverId = data.driverId
                ride.accepted = false
              }
            }
          } else {
            this.rides.unshift(data.ride)
            let time = new Date().getTime()
            this.rides.forEach((ride: any) => {
              ride.seconds = (this.settingSeconds - Math.floor(Math.floor(time - new Date(ride.assignedAt!).getTime()) / 1000))
            })
          }
        } else {
          this.rides.unshift(data.ride)
          let time = new Date().getTime()
          this.rides.forEach((ride: any) => {
            ride.seconds = (this.settingSeconds - Math.floor(Math.floor(time - new Date(ride.assignedAt).getTime()) / 1000))
          })
        }
      }
    })

    this.socketService.rejectedByAll().subscribe({
      next: (data: any) => {
        setTimeout(() => {
          this.rides = this.rides.filter(ride => ride._id !== data.rideId)
        }, 1500)
        for (let ride of this.rides) {
          if (ride._id === data.rideId) {
            this.rides = this.rides.filter(ride => ride._id !== data.rideId)
          }
        }
      }
    })

    this.socketService.accepted().subscribe({
      next: (data: any) => {
        for (let ride of this.rides) {
          if (ride._id === data.rideId) {
            ride.accepted = true
            ride.status = "accepted"
            ride.nextStatus = "arrived"
          }
        }
      }
    })
  }

  secondsInterval() {
    setInterval(() => {
      if (this.rides.length > 0) {
        this.rides = this.rides.filter((ride: Ride) => {
          if (ride.status === "pending") {
            if (ride.seconds! <= 0) {
              return false
            } else {
              return true
            }
          } else {
            return true
          }
        })
        this.rides = this.rides.map((ride: Ride) => {
          if (ride.status === "pending") {
            ride.seconds! -= 1
          }
          return ride
        })
      }
    }, 1000);
  }

  detail(ride: Ride) {
    this.dialog.open(RideDetailsComponent, {
      disableClose: true,
      height: '86dvh',
      width: '90dvw',
      data: {
        from: "running-request",
        title: 'Ride Details',
        subtitle: ride.requestId,
        content: ride,
      }
    })
  }

  accept(ride: Ride) {
    this.rideService.acceptRide(ride._id!, ride.driverId!).subscribe({
      next: (data: any) => {
        console.log(data)
      }
    })
  }
  reject(ride: Ride) {
    this.rides = this.rides.filter(rides => rides._id !== ride._id)
    this.rideService.rejectRide(ride._id!, ride.driverId!).subscribe({
      next: (data: any) => {
        if (data.type === HttpEventType.Response) {
          this.commonService.toast(data.body.message, "info")
          console.log(data)
        }
      }
    })
  }

  onStatusChange(rideId: string, driverId: string, status: string) {

    if (status === "completed") {
      this.rides = this.rides.filter(ride => ride._id !== rideId)
    }

    this.rideService.statusChange(rideId, driverId, status).subscribe({
      next: (data: any) => {
        if (data.type === HttpEventType.Response) {
          this.commonService.toast(data.body.message.general, "success")
          this.commonService.toast(data.body.message.user, "info")
        }
      },
      complete: () => {
        this.rideService.getRunningRequests().subscribe({
          next: (data: any) => {
            if (data.type === HttpEventType.Response) {
              this.rides = data.body.data
              let time = new Date().getTime()
              this.rides.forEach((ride: any) => {
                if (ride.status === "pending") {
                  if ((this.settingSeconds - Math.floor(Math.floor(time - new Date(ride.assignedAt!).getTime()) / 1000)) > 0) {
                    this.rides.unshift(ride)
                  }
                  this.rides.forEach(ride => {
                    ride.seconds = (this.settingSeconds - Math.floor(Math.floor(time - new Date(ride.assignedAt!).getTime()) / 1000))
                    ride.dateTime = new Date(ride.dateTime)
                  })
                } else {
                  this.rides.map((ride: Ride) => {
                    if (ride.status !== "pending") {
                      if (ride.status!.toLowerCase() === "accepted") {
                        ride.nextStatus = this.status[0]
                      } else if (ride.status!.toLowerCase() === "arrived") {
                        ride.nextStatus = this.status[1]
                      } else if (ride.status!.toLowerCase() === "picked") {
                        ride.nextStatus = this.status[2]
                      } else if (ride.status!.toLowerCase() === "started") {
                        ride.nextStatus = this.status[3]
                      }
                    }
                  })
                }
              })
            }
          }
        })
      }
    })
  }
}
