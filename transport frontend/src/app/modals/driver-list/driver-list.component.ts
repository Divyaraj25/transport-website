import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { MatDialogClose, MatDialogActions, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { Driver } from '../../interfaces/driver.interface';
import { DialogRef } from '@angular/cdk/dialog';
import { DriverService } from '../../services/driver.service';
import { HttpEventType } from '@angular/common/http';
import { CommonService } from '../../services/common.service';

@Component({
  selector: 'app-driver-list',
  standalone: true,
  imports: [SharedModule, MatDialogClose, MatDialogActions, MatDialogContent, MatDialogTitle],
  templateUrl: './driver-list.component.html',
  styleUrl: './driver-list.component.scss'
})
export class AssignDriverListComponent implements OnInit {
  data: any;
  isLoading:boolean = false
  city!: string;
  drivers: Driver[] = []
  vehicle_type!: string;
  rideId!:string
  selectedDriver: Driver | null = {
    _id: '',
    username: '',
  }

  constructor(
    private matdialogref: DialogRef, 
    private driverService: DriverService,
    private CommonService:CommonService
  ) { }

  ngOnInit(): void {

    this.CommonService.isLoading.subscribe({
      next:(data:boolean)=>{
        this.isLoading = data
      }
    })

    this.data = this.matdialogref.config.data
    this.city = this.data.content.city
    this.vehicle_type = this.data.content.vehicle_type
    this.rideId = this.data.content.rideId

    this.driverService.getDriversForRide(this.city, this.vehicle_type, this.rideId).subscribe({
      next: (data: any) => {
        if (data.type === HttpEventType.Response) {
          this.drivers = data.body.data
        }
      }
    })
  }

  selected(driver: Driver) {
    this.selectedDriver = driver
    console.log(this.selectedDriver)
  }
}
