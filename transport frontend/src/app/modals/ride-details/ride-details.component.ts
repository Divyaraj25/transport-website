import { DialogRef } from '@angular/cdk/dialog';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { MatDialog, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { GoogleMapsModule } from '@angular/google-maps';
import { DateToTimePipe } from '../../pipes/time.pipe';
import { CommonService } from '../../services/common.service';
import { AssignDriverListComponent } from '../driver-list/driver-list.component';
import { DriverService } from '../../services/driver.service';
import { HttpEventType } from '@angular/common/http';
import { MainSocketService } from '../../socket/main-socket.service';
import { CountryService } from '../../services/country.service';

@Component({
  selector: 'app-ride-details',
  standalone: true,
  imports: [SharedModule, MatDialogClose, MatDialogActions, MatDialogContent, MatDialogTitle, DateToTimePipe],
  templateUrl: './ride-details.component.html',
  styleUrl: './ride-details.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class RideDetailsComponent {
  isDark: boolean = false
  data: any;
  ride: any;
  currency!: string
  map!: google.maps.Map
  renderer!: google.maps.DirectionsRenderer
  constructor(
    private matdialogref: DialogRef,
    private CommonService: CommonService,
    private driverService: DriverService,
    private mat: MatDialog,
    private matClose: MatDialogRef<RideDetailsComponent>,
    private socketService: MainSocketService,
    private countryService: CountryService
  ) { }
  ngOnInit() {

    this.CommonService.isDarkMode.subscribe((data: boolean) => {
      this.isDark = data
    })

    this.socketService.secondsWithRideDetails().subscribe({
      next: (data: any) => {
        console.log(data);
        if (this.ride._id === data.rideId) {
          this.ride.driverUsername = data.driverUsername
        }
      }
    })

    this.socketService.rejectedByAll().subscribe({
      next: (data: any) => {
        console.log(data);
        this.ride.driverUsername = ''
        this.ride.driver = []
        if (this.data.from === 'running-request') {
          this.matClose.close("no")
        }
      }
    })

    this.data = this.matdialogref.config.data
    this.ride = this.data.content

    this.countryService.getCountryCurrencySymbol(this.ride.country).subscribe({
      next: (data: any) => {
        if (data.type === HttpEventType.Response) {
          this.currency = data.body.data[0].currency_symbol
        }
      }
    })

    if (this.map) {
      this.map.panTo(new google.maps.LatLng(this.ride.sourceLatLng[0], this.ride.sourceLatLng[1]))
    } else {
      this.map = new google.maps.Map(document.getElementById("map") as HTMLElement, {
        center: { lat: this.ride.sourceLatLng[0], lng: this.ride.sourceLatLng[1] },
        zoom: 13,
        mapId: Date.now().toString(),
      })
    }


    const service = new google.maps.DirectionsService()
    this.renderer = new google.maps.DirectionsRenderer()

    new google.maps.marker.AdvancedMarkerElement({
      position: new google.maps.LatLng(this.ride.sourceLatLng[0], this.ride.sourceLatLng[1]),
      map: this.map,
      content: this.createMarkerImage("assets/markers/source_marker.png")
    })

    new google.maps.marker.AdvancedMarkerElement({
      position: new google.maps.LatLng(this.ride.destinationLatLng[0], this.ride.destinationLatLng[1]),
      map: this.map,
      content: this.createMarkerImage("assets/markers/destination_marker.png")
    })

    this.ride.stopsLatLng.forEach((point: any) => {
      new google.maps.marker.AdvancedMarkerElement({
        position: new google.maps.LatLng(point[0], point[1]),
        map: this.map,
        content: this.createMarkerImage("assets/markers/stop_marker.png")
      })
    })
    if (this.data.from === "history") {
      let polylineLatLngs = []
      polylineLatLngs.push({ lat: this.ride.sourceLatLng[0], lng: this.ride.sourceLatLng[1] })
      this.ride.stopsLatLng.forEach((point: any) => {
        polylineLatLngs.push({ lat: point[0], lng: point[1] })
      })
      polylineLatLngs.push({ lat: this.ride.destinationLatLng[0], lng: this.ride.destinationLatLng[1] })

      const polyline = new google.maps.Polyline({
        path: polylineLatLngs,
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 3
      })
      polyline.setMap(this.map)
    } else {

      let waypoints: google.maps.DirectionsWaypoint[] = this.ride.stopsLatLng.map((point: any) => {
        return {
          location: new google.maps.LatLng(point[0], point[1]),
          stopover: true,
        };
      });


      this.renderer.setOptions({
        suppressMarkers: true
      });

      this.renderer.setMap(this.map);

      service.route({
        origin: new google.maps.LatLng(this.ride.sourceLatLng[0], this.ride.sourceLatLng[1]),
        destination: new google.maps.LatLng(this.ride.destinationLatLng[0], this.ride.destinationLatLng[1]),
        waypoints: waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
      }, (result, status) => {
        if (status == "OK") {
          this.renderer.setRouteIndex(1)
          this.renderer.setDirections(result)
        }
      })
    }
  }

  createMarkerImage(path: string) {
    let customMarker = document.createElement('img')
    customMarker.src = path
    customMarker.height = 40
    customMarker.width = 40
    return customMarker
  }

  selectedDriver() {
    let ref = this.mat.open(AssignDriverListComponent, {
      disableClose: true,
      width: '550px',
      data: {
        title: 'Drivers',
        content: { city: this.ride.city, vehicle_type: this.ride.vehicle_type, rideId: this.ride._id },
        action: "Select"
      }
    })

    ref.afterClosed().subscribe((data) => {
      if (data !== 'no') {
        if (data) {
          this.matClose.close(data)
        }
      }
    })
  }

  anyDriver() {
    this.matClose.close(true)
  }
}
