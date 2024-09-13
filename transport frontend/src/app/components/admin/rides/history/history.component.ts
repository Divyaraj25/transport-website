import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RideService } from '../../../../services/ride.service';
import { HttpEventType } from '@angular/common/http';
import { Ride } from '../../../../interfaces/ride.interface';
import { CommonService } from '../../../../services/common.service';
import { DateToTimePipe } from '../../../../pipes/time.pipe';
import { RideDetailsComponent } from '../../../../modals/ride-details/ride-details.component';
import { MatDialog } from '@angular/material/dialog';
import { ConvertToCsvService } from '../../../../services/convert_to_csv.service';
import { NgxMatDatetimePickerModule, NgxMatNativeDateModule } from '@angular-material-components/datetime-picker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { waitForAsync } from '@angular/core/testing';

interface ExportData {
  requestId: string
  customer_uid: number
  customer: string
  customer_email: string
  customer_phone_no: string
  customer_country: string
  customer_city: string
  payment_method: string
  vehicle_type: string
  base_prize: number
  prize_per_time: number
  prize_per_distance: number
  min_fare: number
  total_fare: number
  time: string
  distance: string
  status: string
  source: string
  destination: string
  stopNumber: string
  dateTime: string | Date
  driver_name: string
  driver_email: string
  driver_contact: string
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    SharedModule,
    RouterModule,
    FormsModule,
    DateToTimePipe,
    NgxMatDatetimePickerModule,
    NgxMatNativeDateModule,
    ReactiveFormsModule
  ],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
  providers: [provideNativeDateAdapter()],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HistoryComponent implements OnInit {
  myFilter = (date: Date): boolean => {
    const today = new Date();
    return date < today;
  };
  isDark: boolean = false
  rides!: Ride[]
  noData: string = 'No history found'
  filterBy: string = 'none'
  filterValue: string | null = 'none'
  fromDate!: Date | null
  toDate!: Date | null
  dateRange!: FormGroup

  filterOptions: { _id: number, filter: string, value: string }[] = [
    {
      _id: 1,
      filter: 'none',
      value: 'none'
    },
    {
      _id: 2,
      filter: 'date range',
      value: 'dateTime'
    },
    {
      _id: 3,
      filter: 'ride status',
      value: 'status'
    }
  ]
  searchBy: string = 'none'
  searchValue: string | null = 'none'
  status: string[] = ['cancelled', 'completed']
  filter!: string | null
  search!: string | null
  searchOptions: { _id: number, value: string, search: string }[] = [
    {
      _id: 1,
      value: 'none',
      search: 'none'
    },
    {
      _id: 2,
      value: 'pickup location',
      search: 'source'
    },
    {
      _id: 3,
      value: 'dropoff location',
      search: 'destination'
    }
  ]

  constructor(
    private rideService: RideService,
    private commonService: CommonService,
    private dialog: MatDialog,
    private exportData: ConvertToCsvService
  ) { }

  ngOnInit(): void {

    this.dateRange = new FormGroup({
      from: new FormControl(null),
      to: new FormControl(null)
    })

    this.commonService.isDarkMode.subscribe(data => {
      this.isDark = data
    })
    this.rideService.getHistoryData().subscribe({
      next: (data: any) => {
        if (data.type === HttpEventType.Response) {
          this.rides = data.body.data
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
        from: "history",
        title: 'Ride Details',
        subtitle: ride.requestId,
        content: ride,
      }
    })
  }

  export() {
    this.rideService.getExportData().subscribe({
      next: (data: any) => {
        if (data.type === HttpEventType.Response) {
          let dbData: ExportData[] = data.body.data

          let headers = {
            requestId: 'requestId',
            customerUid: 'customer id',
            customer: 'customer name',
            customerEmail: 'customer email',
            customerPhoneNo: 'customer phone no',
            customerCountry: 'customer country',
            customerCity: 'customer city'.replace(/,/g, ' '),
            paymentMethod: 'payment method',
            vehicleType: 'vehicle type',
            basePrize: 'base prize',
            prizePerTime: 'prize per time',
            prizePerDistance: 'prize per distance',
            minFare: 'min fare',
            totalFare: 'total fare',
            time: 'time'.replace(/,/g, ' '),
            distance: 'distance'.replace(/,/g, ' '),
            status: 'status',
            source: 'source'.replace(/,/g, ' '),
            destination: 'destination'.replace(/,/g, ' '),
            stopNumber: 'stops',
            dateTime: 'date time'.replace(/,/g, ' '),
            driverName: 'driver name',
            driverEmail: 'driver email',
            driverContact: 'driver contact'
          }

          let formatedData: any[] = []

          dbData.forEach((ride: ExportData) => {
            formatedData.push({
              requestId: ride.requestId,
              customerUid: ride.customer_uid,
              customer: ride.customer,
              customerEmail: ride.customer_email,
              customerPhoneNo: ride.customer_phone_no,
              customerCountry: ride.customer_country,
              customerCity: ride.customer_city.toString().replace(/,/g, ' '),
              paymentMethod: ride.payment_method,
              vehicleType: ride.vehicle_type,
              basePrize: ride.base_prize,
              prizePerTime: ride.prize_per_time,
              prizePerDistance: ride.prize_per_distance,
              minFare: ride.min_fare,
              totalFare: ride.total_fare,
              time: ride.time.toString().replace(/,/g, ' '),
              distance: ride.distance.toString().replace(/,/g, ' '),
              status: ride.status,
              source: ride.source.toString().replace(/,/g, ' '),
              destination: ride.destination.toString().replace(/,/g, ' '),
              stopNumber: ride.stopNumber,
              dateTime: `${new Date(ride.dateTime).getDate()}/${new Date(ride.dateTime).getMonth()}/${new Date(ride.dateTime).getFullYear()} ${new Date(ride.dateTime).getHours()}:${new Date(ride.dateTime).getMinutes()}`,
              driverName: ride.driver_name,
              driverEmail: ride.driver_email,
              driverContact: ride.driver_contact
            })
          })
          
          this.exportData.exportCSVFile(headers, formatedData, 'ride_history')
        }
      }
    })
  }

  onSearch(search: any) {
    this.searchBy = search.value
    this.searchValue = search.search
    if (this.searchBy === "none") {
      this.filterBy = "none"
      this.filterValue = null
      this.searchBy = "none"
      this.searchValue = null
      this.fromDate = null
      this.toDate = null
      this.dateRange.reset()

      this.rideService.getHistoryData().subscribe({
        next: (data: any) => {
          if (data.type === HttpEventType.Response) {
            this.rides = data.body.data
          }
        }
      })
    }
    let input = document.getElementById('searchInput') as HTMLInputElement
    if (input) {
      input.value = ''
    }
  }

  onFilter(search: any) {
    this.filterBy = search.filter
    this.filterValue = search.value
    if (this.filterBy === "none") {
      this.filterBy = "none"
      this.filterValue = null
      this.searchBy = "none"
      this.searchValue = null
      this.fromDate = null
      this.toDate = null

      this.dateRange.reset()

      this.rideService.getHistoryData().subscribe({
        next: (data: any) => {
          if (data.type === HttpEventType.Response) {
            this.rides = data.body.data
          }
        }
      })

      let input = document.getElementById('searchInput') as HTMLInputElement
      if (input) {
        input.value = ''
      }
    }
    this.fromDate = null
    this.toDate = null
  }

  filterByValue(filter: string) {
    this.filter = filter
    let searchV: string | null = '';
    let searchBy = '';
    if (this.searchValue) {
      searchV = this.search
      searchBy = this.searchBy
    }
    setTimeout(() => {
      this.rideService.searchByValueInHistory(searchBy, searchV!, this.filterBy, this.filter, this.fromDate, this.toDate).subscribe({
        next: (data: any) => {
          if (data.type === HttpEventType.Response) {
            console.log(data)
            this.rides = data.body.data
          }
        }
      })
    }, 250)

  }

  searchByValue(search: string) {
    this.search = search
    let filterV: string | null = '';
    let filterBy = '';
    if (this.filterValue) {
      filterV = this.filter
      filterBy = this.filterBy
    }

    this.rideService.searchByValueInHistory(this.searchBy, this.search, filterBy, filterV, this.fromDate, this.toDate).subscribe({
      next: (data: any) => {
        if (data.type === HttpEventType.Response) {
          console.log(data)
          this.rides = data.body.data
        }
      }
    })
  }
}
