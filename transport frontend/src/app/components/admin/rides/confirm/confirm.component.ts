import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { CommonService } from '../../../../services/common.service';
import { Ride } from '../../../../interfaces/ride.interface';
import { RideService } from '../../../../services/ride.service';
import { HttpEventType } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { DateToTimePipe } from '../../../../pipes/time.pipe';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmModal } from '../../../../modals/confirm-modal.component';
import { RideDetailsComponent } from '../../../../modals/ride-details/ride-details.component';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { provideNativeDateAdapter } from '@angular/material/core';
import { NgxMatDatetimePickerModule, NgxMatNativeDateModule, NgxMatTimepickerModule } from '@angular-material-components/datetime-picker';
import { FormsModule } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MainSocketService } from '../../../../socket/main-socket.service';
import { ThisReceiver } from '@angular/compiler';
import { PushNotificationsService } from '../../../../services/notification.service';
import { InvoiceComponent } from '../../../../modals/invoice/invoice.component';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [
    SharedModule,
    DateToTimePipe,
    NgxMaskDirective,
    FormsModule,
    NgxMaskPipe,
    NgxMatDatetimePickerModule,
    NgxMatTimepickerModule,
    NgxMatNativeDateModule
  ],
  providers: [provideNgxMask(), provideNativeDateAdapter()],
  templateUrl: './confirm.component.html',
  styleUrl: './confirm.component.scss'
})
export class ConfirmComponent implements OnInit {

  @ViewChild('contact') contact!: ElementRef
  @ViewChild('text') text!: ElementRef

  isDark: boolean = false
  searching: boolean = true
  rides!: Ride[]
  serviceTypes: Set<string> = new Set()
  status: string[] = ['accepted', 'arrived', 'picked', 'started', 'completed', 'pending']
  noData: string = 'Today No Rides are Booked'
  selectedFilter: string = 'none'
  selectedSearch: string = 'none'
  searchBy: string = 'none'
  filterBy: string = 'none'
  searchValue: string = ''
  filterValue: string = ''
  value!: string | null
  dateValue!: Date | string | null
  filter!: string | null
  filterOptions: { _id: number, sort: string, value: string }[] = [
    {
      _id: 1,
      sort: 'none',
      value: 'none'
    },
    {
      _id: 2,
      sort: 'Service Type',
      value: 'vehicle_type'
    },
    {
      _id: 3,
      sort: 'Status',
      value: 'status'
    },
  ]
  searchOptions: { _id: number, search: string, value: string }[] = [
    {
      _id: 1,
      search: 'none',
      value: 'none'
    },
    {
      _id: 2,
      search: 'Customer name',
      value: 'username'
    },
    {
      _id: 3,
      search: 'Phone number',
      value: 'phone_no'
    },
    {
      _id: 4,
      search: 'Request Id',
      value: 'requestId'
    },
    {
      _id: 5,
      search: 'Date',
      value: 'dateTime'
    }
  ]


  constructor(
    private commonService: CommonService,
    private rideService: RideService,
    private dialog: MatDialog,
    private socketService: MainSocketService,
    private mat: MatDialog,
    private notification: PushNotificationsService
  ) { }
  ngOnInit() {

    this.socketService.connection().subscribe({
      next: (data: any) => {
        console.log(data);
      }
    })

    this.socketService.driverUsernameAndStatus().subscribe({
      next: (data: any) => {
        console.log(data);
        for (let ride of this.rides) {
          if (ride._id === data.rideId) {
            ride.driverUsername = data.driverUsername
            ride.driver = [{
              _id: "0",
              username: data.driverUsername
            }]
            ride.assigned = true
            ride.status = data.status
          }
        }
      }
    })

    this.socketService.accepted().subscribe({
      next: (data: any) => {
        this.notification.permission = 'granted'
        this.notification.generateNotification([{ title: 'Request Accepted', body: data.message }])
        setTimeout(() => {
          for (let ride of this.rides) {
            if (ride._id === data.rideId) {
              ride.accepted = true
              ride.status = "accepted"
            }
          }
        }, 1000);
        for (let ride of this.rides) {
          if (ride._id === data.rideId) {
            ride.accepted = true
            ride.status = "accepted"
          }
        }
      }
    })

    this.socketService.rejectedByDriver().subscribe({
      next: (data: any) => {
        this.notification.permission = 'granted'
        for (let ride of this.rides) {
          if (ride._id === data.rideId) {
            ride.driverUsername = "On Hold"
            ride.driver = []
          }
        }
        this.notification.generateNotification([{ title: 'Request Rejected', body: data.message }])
      }
    })

    this.socketService.rejectedByAll().subscribe({
      next: (data: any) => {
        console.log(data);
        this.notification.permission = 'granted'
        this.notification.generateNotification([{ title: 'Request Rejected', body: data.message }])

        this.commonService.increaseBatch()

        setTimeout(() => {
          for (let ride of this.rides) {
            if (ride._id === data.rideId) {
              ride.assigned = false
              ride.driver = []
              ride.button = 'Reassign'
            }
          }
        }, 1000)
        for (let ride of this.rides) {
          if (ride._id === data.rideId) {
            ride.assigned = false
            ride.driver = []
            ride.button = 'Reassign'
          }
        }
      }
    })

    this.socketService.driverStatus().subscribe({
      next: (data: any) => {
        console.log(data);

        for (let ride of this.rides) {
          if (ride._id === data.rideId) {
            ride.status = data.status
          }
        }

        if (data.status === 'completed') {
          this.rideService.generateInvoice(data.rideId).subscribe({
            next: (data: any) => {
              console.log(data);
              if (data.type === HttpEventType.Response) {
                let ref = this.mat.open(InvoiceComponent, {
                  disableClose: true,
                  width: '700px',
                  data: {
                    title: 'Invoice'.toUpperCase(),
                    content: data.body.data,
                    action: "Confirm"
                  }
                })

                ref.afterClosed().subscribe((result) => {
                  this.rideService.confirmPayment(result.rideId, result.rating).subscribe({
                    next: (data: any) => {
                      console.log(data);
                      if (data.type === HttpEventType.Response) {
                        this.commonService.toast(data.body.message.general, "success")
                        this.commonService.toast(data.body.message.user, "info")
                        this.commonService.toast(data.body.message.driver, "info")
                      }
                    }
                  })
                })
              }
            }
          })
        }

        setTimeout(() => {
          this.rides = this.rides.filter(ride => {
            return ride.status !== "completed"
          })
        }, 5000);
      }
    })

    this.commonService.isDarkMode.subscribe(data => {
      this.isDark = data
    })

    this.rideService.getRidesDetails().subscribe({
      next: (data: any) => {
        if (data.type === HttpEventType.Response) {
          this.rides = data.body.data
          this.rides.forEach(ride => {
            ride.dateTime = new Date(ride.dateTime)
            if (!ride.driverId && ride.status === "pending") {
              ride.driver = [{ _id: "1", username: 'On Hold' }]
            }
            if (ride.status !== "available") {
              ride.assigned = true
            } else {
              ride.assigned = false
            }
            ride.button = 'Assign Driver'
            ride.hold = "On Hold"
            this.serviceTypes.add(ride.vehicle_type)
          })
        }
      }
    })
  }

  onSearch(search: any) {
    if (search._id !== 1) {
      this.searching = true

    }

    if (this.searching) {
      if (search._id === 1) {
        this.filterBy = 'none'
        this.selectedSearch = 'none'
        this.filter = null
        let input = document.getElementById('searchInput') as HTMLInputElement
        input.value = ''
        input.placeholder = ''
        input.name = ''
        this.noData = 'Today No Rides are Booked'
        this.searchBy = search.value
        this.searchValue = search.search
        this.searching = false
        this.dateValue = null
        this.value = null

        // get all data from backend
        this.rideService.getRidesDetails().subscribe({
          next: (data: any) => {
            if (data.type === HttpEventType.Response) {
              this.rides = data.body.data
              this.rides.forEach(ride => {
                ride.dateTime = new Date(ride.dateTime)
                ride.assigned = false
                ride.button = 'Assign Driver'
              })
            }
          }
        })

      } else {
        let input = document.getElementById('searchInput') as HTMLInputElement
        input.value = ''
        this.searchBy = search.value
        this.searchValue = search.search
        input.placeholder = search.search
        input.name = search.search
        this.dateValue = null

        // search value in backend with searchvalue
      }
    }
  }

  dateChanged(event: MatDatepickerInputEvent<Date>) {
    this.value = null
    this.dateValue = event.value
    let filter = ''
    let by = '';
    if (this.filter) {
      filter = this.filter
      by = this.filterBy
    }

    // search in database with date value
    this.rideService.searchByValue(this.searchBy, event.value, by, this.filter!).subscribe({
      next: (data: any) => {
        if (data.type === HttpEventType.Response) {
          this.rides = data.body.data
          this.noData = "No Rides Found"
        }
      }
    })
  }

  searchByValue(value: string) {

    this.value = value.trim()

    if (!value) {
      this.noData = "Today No Rides are Booked"
    }

    if (value.includes('-')) {
      value = value.replaceAll('-', '')
    }
    let filter = '';
    let by;
    if (this.filter) {
      filter = this.filter
      by = this.filterBy
    } else {
      by = ""
    }

    // search in database with this string value
    this.rideService.searchByValue(this.searchBy, value.trim(), by, filter).subscribe({
      next: (data: any) => {
        if (data.type === HttpEventType.Response) {
          this.rides = data.body.data
          this.noData = "No Rides Found"
        }
      }
    })
  }

  onFilter(filter: any) {
    this.filterBy = filter.value

    if (this.filterBy === 'none') {
      this.filter = null
      let input = document.getElementById('searchInput') as HTMLInputElement
      input.value = ''
      input.placeholder = ''
      input.name = ''
      this.noData = 'Today No Rides are Booked'
      this.searchBy = "none"
      this.searchValue = "none"
      this.searching = false
      this.dateValue = null
      this.value = null

      this.rideService.getRidesDetails().subscribe({
        next: (data: any) => {
          if (data.type === HttpEventType.Response) {
            this.rides = data.body.data
            this.rides.forEach(ride => {
              ride.dateTime = new Date(ride.dateTime)
              ride.assigned = false
              ride.button = 'Assign Driver'
            })
          }
        }
      })
    }

  }

  filterByValue(filter: string) {

    this.filter = filter

    let value;
    if (this.value) {
      value = this.value
    } else if (this.dateValue) {
      value = this.dateValue
    }

    this.rideService.searchByValue(this.searchBy, value, this.filterBy, filter).subscribe({
      next: (data: any) => {
        if (data.type === HttpEventType.Response) {
          this.rides = data.body.data
          this.noData = "No Rides Found"
          this.rides.map((ride) => {
            ride.button = "Assign Driver"
          })
        }
      }
    })
  }

  deleteRide(rideId: string, requestId: string) {
    let ref = this.dialog.open(ConfirmModal, {
      position: { top: '2%' },
      width: '30%',
      disableClose: true,
      data: {
        title: `Delete ${requestId}`,
        action: "Delete",
        content: "Are you sure you want to delete this Ride?"
      }
    })

    ref.afterClosed().subscribe({
      next: (result: any) => {
        if (result === 'yes') {
          this.rideService.cancelRide(rideId).subscribe({
            complete: () => {
              this.commonService.toast(`Ride ${requestId} canceled successfully`, "success")
              this.rideService.getRidesDetails().subscribe({
                next: (data: any) => {
                  if (data.type === HttpEventType.Response) {
                    this.rides = data.body.data
                    this.rides.forEach(ride => {
                      ride.dateTime = new Date(ride.dateTime)
                      ride.assigned = false
                      ride.button = 'Assign Driver'
                    })
                  }
                }, complete: () => {
                  if (this.searchBy !== 'none' || this.filterBy !== 'none') {
                    let value: string | Date = '';
                    let filter = '';
                    let by = '';
                    if (this.filter) {
                      filter = this.filter
                      by = this.filterBy
                    } else {
                      by = ''
                    }
                    if (this.value) {
                      value = this.value
                    } else if (this.dateValue) {
                      value = this.dateValue
                    }

                    this.rideService.searchByValue(this.searchBy, value, by, filter).subscribe({
                      next: (data: any) => {
                        if (data.type === HttpEventType.Response) {
                          this.rides = data.body.data
                          this.noData = 'No Rides Found'
                        }
                      }
                    })
                  }
                }
              })
            }
          })
        }
      }
    })
  }

  detail(ride: Ride) {
    let ref = this.dialog.open(RideDetailsComponent, {
      disableClose: true,
      height: '86dvh',
      width: '90dvw',
      data: {
        from: "confirm",
        title: 'Ride Details',
        subtitle: ride.requestId,
        content: ride,
        action1: ride.assigned || ride.driver![0] ? '' : 'Assign any available Driver',
        action2: ride.assigned || ride.driver![0] ? '' : ride.button,
      }
    })

    ref.afterClosed().subscribe((result: any) => {

      if (result !== "no") {

        if (ride.button?.toLowerCase() === 'reassign') {
          this.commonService.decreaseBatch()
        }

        if (typeof result === 'boolean') {
          // any driver assigning
          this.rideService.startCronForRide(ride._id!, '', result).subscribe({
            next: (data: any) => {
              if (data.type === HttpEventType.Response) {
                this.commonService.toast(data.body.message, "success")
                console.log(data)
              }
            },
            error: () => {
              this.commonService.increaseBatch()
            }
          })
        } else if (typeof result === 'string') {
          // assign a particular driver
          this.rideService.startCronForRide(ride._id!, result).subscribe({
            next: (data: any) => {
              if (data.type === HttpEventType.Response) {
                this.commonService.toast(data.body.message, "success")
                console.log(data)
              }
            },
            error: () => {
              this.commonService.increaseBatch()
            }
          })
        }
      }
    })
  }
}
