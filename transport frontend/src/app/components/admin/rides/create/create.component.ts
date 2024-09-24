import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, TestabilityRegistry } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { GoogleMapsModule } from '@angular/google-maps';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SettingService } from '../../../../services/setting.service';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { CommonService } from '../../../../services/common.service';
import { User } from '../../../../interfaces/user.interface';
import { UserService } from '../../../../services/user.service';
import { CountryService } from '../../../../services/country.service';
import { environment } from '../../../../../environments/env.prod';
import { PricingService } from '../../../../services/pricing.service';
import { VehicleType } from '../../../../interfaces/vehicle-type.interface';
import { VehicleTypeService } from '../../../../services/vehicle-type.service';
import { provideNativeDateAdapter } from '@angular/material/core';
import { NgxMatDatetimePickerModule, NgxMatTimepickerModule, NgxMatNativeDateModule } from '@angular-material-components/datetime-picker';
import { NgbTimepicker, NgbTimeStruct } from '@ng-bootstrap/ng-bootstrap';
import { CityService } from '../../../../services/city.service';
import { Card } from '../../../../interfaces/card.interface';
import { CardService } from '../../../../services/card.service';
import { MatDialog } from '@angular/material/dialog';
import { AddCardModalComponent } from '../../../../modals/add-card/add-card-modal.component';
import { RideService } from '../../../../services/ride.service';
import { TitleStrategy } from '@angular/router';
import {FloatLabelType} from '@angular/material/form-field';

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [
    SharedModule,
    NgbTimepicker,
    NgxMaskDirective,
    NgxMaskPipe,
    ReactiveFormsModule,
    FormsModule,
    NgxMatDatetimePickerModule,
    NgxMatTimepickerModule,
    NgxMatNativeDateModule
  ],
  providers: [provideNgxMask(), provideNativeDateAdapter()],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CreateComponent implements OnInit {

  time: NgbTimeStruct = {
    hour: 10,
    minute: 0,
    second: 0
  };


  // setting={
  //   bigBanner: false,
  //   timePicker:true,
  //   format: "MM-dd-yyyy hh:mm a",
  //   defaultOpen:false,
  //   closeOnSelect: true
  // }
  stops!: number
  minutes: number = 0
  meters: number = 0
  id: number = 0
  dataPicked!: Date | undefined
  myFilter = (d: Date | null): boolean => {
    const date = (d || new Date()).getDate()
    const month = (d || new Date()).getMonth()
    const year = (d || new Date()).getFullYear()
    return date >= new Date().getDate() && month >= new Date().getMonth() && year >= new Date().getFullYear()
  }
  previewImage: string | undefined = "assets/dummy_user.jpg"
  cca2!: string
  distanceDisplay!: string | null
  timeDisplay!: string | null
  databaseCity!: string | null
  datebaseWaypoints: [number[]] | any[] = [[]]
  currency_symbol!: string | null
  paymentMethod!: string | null
  selectedCard!: string
  user!: User | null
  vehicles: VehicleType[] = []
  cards: Card[] = []
  latlng!: [number, number]
  selected_type: VehicleType | null = {
    _id: '',
    vehicle_type: ''
  }
  searching: boolean = true
  isDark: boolean = false
  serviceTypeSelectedError: boolean = false
  paymentSelectedError: boolean = false
  firstTimeLoad: boolean = false
  datetimeChanged: boolean = false

  userFound: boolean = false // user found and for source and destination
  show: boolean = false // user found and user not found
  calculated: boolean = false
  calculatedForMap: boolean = false // after from and to location is valid
  validLocation: boolean = false // for from location

  rideSchedule: boolean = false // for schedule ride

  googleLocations!: FormGroup
  searchByContact!: FormGroup
  map!: google.maps.Map
  sourceAutocomplete!: google.maps.places.Autocomplete
  destinationAutocomplete!: google.maps.places.Autocomplete
  stopsAutocomplete!: google.maps.places.Autocomplete
  fromMarker!: google.maps.marker.AdvancedMarkerElement
  toMarker!: google.maps.marker.AdvancedMarkerElement
  stopMarker!: google.maps.marker.AdvancedMarkerElement
  fromLocation!: google.maps.LatLng | null
  toLocation!: google.maps.LatLng | null
  renderer!: google.maps.DirectionsRenderer;
  stopsMarker: { [marker: string]: google.maps.marker.AdvancedMarkerElement }[] = []
  waypoints: google.maps.LatLng[] = []
  // waypoints:  google.maps.DirectionsWaypoint[] = []

  constructor(
    private settingService: SettingService,
    private commonService: CommonService,
    private userService: UserService,
    private countryService: CountryService,
    private pricingService: PricingService,
    private vehicle: VehicleTypeService,
    private cityService: CityService,
    private http: HttpClient,
    private cardService: CardService,
    private dialog: MatDialog,
    private rideService: RideService) { }

  ngOnInit() {
    this.paymentMethod = "cash"

    this.commonService.isDarkMode.subscribe({
      next: (data: boolean) => {
        this.isDark = data
      }
    })

    this.settingService.getSettings().subscribe({
      next: (data: any) => {
        if (data.type === HttpEventType.Response) {
          this.stops = parseInt(data.body.data.stops)
        }
      }
    })


    this.searchByContact = new FormGroup({
      phone_no: new FormControl(null, Validators.required)
    })

    this.googleLocations = new FormGroup({
      from: new FormControl('', Validators.required),
      to: new FormControl('', Validators.required),
      stops: new FormArray([])
    })

    this.searchByContact.valueChanges.subscribe({
      next: (data: any) => {
        this.searching = true
      }
    })

    this.googleLocations.valueChanges.subscribe({
      next: (data: any) => {
        this.validLocation = false
        this.calculated = false
        this.timeDisplay = null
        this.distanceDisplay = null
        if (this.renderer) {
          this.renderer.setMap(null)
        }
      }
    })
    // this.paymentMethod = "card"
    // setTimeout(() => {
    //   this.setAutocomplete()
    // }, 100);
  }

  getStopsArray() {
    return this.googleLocations.get('stops') as FormArray
  }

  addStopIntoFormArray() {
    return this.getStopsArray().push(new FormControl(null, Validators.required))
  }

  removeStopFromFormArray(index: number) {
    if (this.stopsMarker[index]) {
      // console.log(this.stopsMarker)
      console.log(this.stopsMarker[index])
      for (let stop of this.stopsMarker) {
        if (stop[Object.keys(this.stopsMarker[index])[0]]) {
          console.log("removing from map")
          stop[Object.keys(this.stopsMarker[index])[0]].map = null
        }
      }

      this.stopsMarker.splice(index, 1)
      this.waypoints.splice(index, 1)
      // console.log(this.waypoints)
      console.log(this.stopsMarker)
      console.log(this.getStopsArray())
    }

    this.getStopsArray().removeAt(index)
    console.log(this.getStopsArray().controls.length);
    this.id = this.getIdForStop()
  }

  getArrayLength() {
    return this.getStopsArray().length
  }

  searchUserByContact() {
    console.log(this.searchByContact.get('phone_no')?.value)
    if (this.searching) {
      if (this.searchByContact.get('phone_no')?.valid) {
        console.log(this.searchByContact.get('phone_no')?.value)
        this.show = true
        this.userService.searchUser({ phone_no: this.searchByContact.get('phone_no')?.value }, 1, 'none', 5).subscribe({
          next: (data: any) => {
            if (data.type === HttpEventType.Response) {
              if (data.body.data.users.length > 0) {
                this.clearAll()
                this.commonService.toast("User found", "success")
                this.user = data.body.data.users[0]
                this.previewImage = `http://16.170.146.16:5000/images/users/${this.user?.profile}`
                this.userFound = true
                this.firstTimeLoad = true
                this.getCardsWithCustomerDetails()

                this.googleLocations.get('from')?.enable()
                this.googleLocations.get('to')?.enable()
                this.googleLocations.get('stops')?.enable()

                // this.map.panTo({ lat: data.body.data[0]['lat_lng'][0], lng: data.body.data[0]['lat_lng'][1] })

                this.googleLocations.reset()
                const stopsArray = this.googleLocations.get('stops') as FormArray
                stopsArray.clear()

                if (this.stopsMarker.length > 0) {
                  for (let stop of this.stopsMarker) {
                    stop[Object.keys(stop)[0]].map = null
                  }
                  this.stopsMarker = this.stopsMarker.splice(0, this.stopsMarker.length)
                }

                this.countryService.searchCountry(this.user?.country!).subscribe({
                  next: (data: any) => {
                    if (data.type === HttpEventType.Response) {

                      console.log(data.body.data)
                      if (data.body.data.length > 0) {
                        this.cca2 = data.body.data[0].cca2
                        this.latlng = data.body.data[0]['lat_lng']
                        this.currency_symbol = data.body.data[0].currency_symbol
                        // setTimeout(() => {
                        this.setAutocomplete()
                        // }, 100);
                      }
                    }
                  }
                })
                this.searching = false
              } else {
                this.commonService.toast("User not found", "error")
                this.clearAll()
              }
            }
          }
        })
      } else if (!this.searchByContact.get('phone_no')?.valid) {
        this.commonService.toast("User not found", "error")
        this.clearAll()
      }
    }
  }

  setAutocomplete() {
    if (this.userFound) {
      console.log("===========================================================")
      if (!this.sourceAutocomplete) {
        this.sourceAutocomplete = new google.maps.places.Autocomplete(document.getElementById('source') as HTMLInputElement, {
          componentRestrictions: { country: this.cca2 },
          types: ['establishment']
        })
        console.log(this.sourceAutocomplete)
      } else {
        this.sourceAutocomplete.setOptions({
          componentRestrictions: { country: this.cca2 },
          types: ['establishment']
        })
        console.log(this.sourceAutocomplete)
      }

      if (!this.destinationAutocomplete) {
        this.destinationAutocomplete = new google.maps.places.Autocomplete(document.getElementById('destination') as HTMLInputElement, {
          componentRestrictions: { country: this.cca2 },
          types: ['establishment']
        })
      } else {
        this.destinationAutocomplete.setOptions({
          componentRestrictions: { country: this.cca2 },
          types: ['establishment']
        })
      }

      this.fromLocationAddListener()
      this.toLocationAddListener()
    }
  }

  addStop() {
    if (this.googleLocations.get('from')?.valid && this.googleLocations.get('to')?.valid) {
      this.addStopIntoFormArray()
      this.id = this.getIdForStop();

      // this.getStopsArray().controls.forEach((stop:any)=>{
      //   if(stop === null){

      //   }
      // })

      console.log(this.id)
      console.log(this.getStopsArray().controls)
      console.log(this.getStopsArray().controls.length)
      // for (let i = 0; i <= this.getStopsArray().controls.length; i++) {
      //   if (this.getStopsArray().controls.length === i && this.getStopsArray().controls.length > 0) {
      //     if (this.getStopsArray().controls[i]) {
      //       if (this.getStopsArray().controls[i].value === null) {
      //         id = i
      //         console.log("id ===== " + id)
      //         break
      //       } else {
      //         console.log("====== else block ====== ")
      //       }
      //     } else {
      //       id = i
      //       console.log("id in else block ===== " + id)
      //     }
      //   }
      // }

      let stopsAutocomplete: google.maps.places.Autocomplete;
      let promise = new Promise((resolve, reject) => {
        setTimeout(() => {
          stopsAutocomplete = new google.maps.places.Autocomplete(document.getElementById(`stops-${this.id}`) as HTMLInputElement, {
            componentRestrictions: { country: this.cca2 },
            types: ['establishment']
          })
          resolve(stopsAutocomplete)
        }, 500)
      })

      promise.then((data: any) => {
        data.addListener("place_changed", () => {
          console.log(data.getPlace())
          const response = this.checkStopLocationInput(data.getPlace().formatted_address)
          if (response) {
            this.commonService.toast(response, "warning")
            this.getStopsArray().controls[this.id].setValue(null)
            this.getStopsArray().controls[this.id].updateValueAndValidity()
          } else {
            console.log(this.id)
            console.log(this.getStopsArray().controls[this.id])
            this.getStopsArray().controls[this.id].setValue(data.getPlace().formatted_address)
            this.getStopsArray().controls[this.id].updateValueAndValidity()
            this.validLocation = true

            let stopName = "stop-" + this.id;

            let existingStop = this.stopsMarker.find((stop) => stop[stopName])
            let stop: google.maps.marker.AdvancedMarkerElement
            if (!existingStop) {
              stop = new google.maps.marker.AdvancedMarkerElement({
                position: data.getPlace().geometry?.location,
                map: this.map,
                title: data.getPlace().formatted_address,
                content: this.createMarkerImage("assets/markers/stop_marker.png")
              })
            }

            let existingStopIndex = this.stopsMarker.findIndex((stop) => stop[stopName])

            console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++")
            console.log(existingStopIndex)
            console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++")

            if (existingStopIndex !== -1) {
              console.log("=========================================================")
              console.log("removing waypoint")
              console.log("=========================================================")
              this.waypoints.splice(existingStopIndex, 1)
            }

            this.waypoints.push(data.getPlace().geometry?.location)
            console.log("******************************************************************")
            console.log(this.waypoints)
            console.log("******************************************************************")

            console.log("============================ existingStop ============================")
            console.log(existingStop)
            console.log("============================ existingStop ============================")

            if (existingStop) {
              console.log("[[[[[[[[[[[[[[[[[[[[[[ stopname ]]]]]]]]]]]]]]]]]]]]]]]]]]]]")
              console.log(stopName)
              console.log("[[[[[[[[[[[[[[[[[[[[[[ stopname ]]]]]]]]]]]]]]]]]]]]]]]]]]]]")
              console.log("[[[[[[[[[[[[[[[[[[[[[[ going inside existingstop ]]]]]]]]]]]]]]]]]]]]]]]]]]]]")

              existingStop[stopName].position = data.getPlace().geometry?.location
              existingStop[stopName].title = data.getPlace().formatted_address
              existingStop[stopName].map = this.map

            } else {
              console.log("[[[[[[[[[[[[[[[[[[[[[[ not ]]]]]]]]]]]]]]]]]]]]]]]]]]]]")
              this.stopsMarker.push({ [stopName]: stop! })
            }
            console.log(this.stopsMarker)
            console.log(this.stopsMarker[0][stopName]['position']?.lat)
            console.log(this.stopsMarker[0][stopName]['position']?.lng)
            // promise of "stop" marker
          }
        })
      })

    }
  }

  async calculate() {
    if (this.googleLocations.valid) {
      // setTimeout(()=>{
      //   if(this.timeDisplay){}
      // },400)

      if (this.fromLocation && this.toLocation) {
        this.calculated = true
        this.calculatedForMap = true
        console.log(this.latlng)
        // if (this.map) {
        //   this.map.panTo({ lat: this.latlng[0], lng: this.latlng[1] })
        // } else {
        setTimeout(() => {
          this.map = new google.maps.Map(document.getElementById("map") as HTMLElement, {
            center: { lat: this.latlng[0], lng: this.latlng[1] },
            zoom: 5,
            mapId: Date.now().toString(),
          });
        }, 200);
        // }


        // const source = this.fromLocation
        // const destination = this.toLocation

        // let source:google.maps.marker.AdvancedMarkerElement;
        // let destination:google.maps.marker.AdvancedMarkerElement;


        const service = new google.maps.DirectionsService()
        this.renderer = new google.maps.DirectionsRenderer()

        setTimeout(() => {

          if (this.fromMarker) {
            console.log("source is there");

            this.fromMarker.position = this.fromLocation
            this.fromMarker.map = this.map
          } else {
            console.log("source is not there");
            this.fromMarker = new google.maps.marker.AdvancedMarkerElement({
              position: this.fromLocation,
              map: this.map,
              content: this.createMarkerImage("assets/markers/source_marker.png")
            })
          }

          if (this.toMarker) {
            console.log("destination is there");
            this.toMarker.position = this.toLocation
            this.toMarker.map = this.map
          } else {
            console.log("destination is not there");
            this.toMarker = new google.maps.marker.AdvancedMarkerElement({
              position: this.toLocation,
              map: this.map,
              content: this.createMarkerImage("assets/markers/destination_marker.png")
            })
          }

          let stopname;

          this.stopsMarker.map((stop, index) => {
            console.log(stop)
            console.log(index)
            stopname = Object.keys(stop)[0]
            stop[stopname].map = this.map
          })


          this.renderer.setMap(this.map)

        }, 220);


        console.log(this.fromMarker)
        console.log(this.toMarker)

        let waypoints: google.maps.DirectionsWaypoint[] = this.waypoints.map(point => {
          return {
            location: new google.maps.LatLng(point.lat(), point.lng()),
            stopover: true,
          };
        });
        this.datebaseWaypoints = []
        this.waypoints.map(point => {
          this.datebaseWaypoints.push([point.lat(), point.lng()])
          return point
        })

        this.renderer.setOptions({
          suppressMarkers: true
        });

        await service.route({
          origin: this.fromLocation!,
          destination: this.toLocation!,
          waypoints: waypoints,
          // optimizeWaypoints: true,
          travelMode: google.maps.TravelMode.DRIVING,
        }, (result, status) => {
          if (status == "OK") {
            console.log(result);
            this.renderer.setRouteIndex(1)
            this.renderer.setDirections(result)
            let seconds = 0;
            this.meters = 0;
            for (let km of result?.routes[0].legs!) {
              seconds += km.duration?.value!
              this.meters += km.distance?.value!
            }
            this.distanceDisplay = `${(this.meters / 1000).toFixed(2)} km`;
            this.timeDisplay = this.secondsToDhms(seconds)
          }
        })


        // check pricing of vehicles in backend with that source city, that is this.databaseCity

        this.pricingService.getVehiclesOfThatCityWithPricing(this.databaseCity!, this.minutes, (this.meters / 1000)).subscribe({
          next: (data: any) => {
            if (data.type === HttpEventType.Response) {
              this.vehicles = data.body.data
            }
          }
        })

        // this.vehicle.getVehicles().subscribe({
        //   next: (data: any) => {
        //     if (data.type === HttpEventType.Response) {
        //       this.vehicles = data.body.data
        //       console.log(this.vehicles)
        //     }
        //   }
        // })

        console.log(this.googleLocations)
        console.log(this.googleLocations.value)
        this.validLocation = true
        // get registered vehicles of city, pricing database, calculated price will be shown
      } else {
        this.validLocation = false
        this.commonService.toast("Please add source and destination currectly", "warning")
      }

    }
  }

  fromLocationAddListener() {
    this.sourceAutocomplete.addListener("place_changed", () => {
      const place = this.sourceAutocomplete.getPlace();
      const response = this.checkToLocationInput(place.formatted_address!)
      if (response) {
        this.commonService.toast(response, "warning")
        this.googleLocations.get('from')?.setValue("")
        this.googleLocations.get('from')?.updateValueAndValidity()
      } else {
        this.checkFromAndToStops(place.formatted_address!, place.geometry?.location?.lat()!, place.geometry?.location?.lng()!)

        // take from location to backend and check that this location is inside business zone or not
        let point: [number, number] = [place.geometry?.location?.lng()!, place.geometry?.location?.lat()!];
        this.cityService.checkFromLocationFromCityZone(this.cca2, point).subscribe({
          next: (data: any) => {
            if (data.type === HttpEventType.Response) {
              if (data.body.data.length > 0) {
                this.databaseCity = data.body.data[0]
                console.log(this.databaseCity)

                this.googleLocations.get('from')?.setValue(place.formatted_address)
                this.googleLocations.get('from')?.updateValueAndValidity()

                this.fromLocation = place.geometry?.location!
                this.validLocation = true

              } else {
                this.fromLocation = null
                this.validLocation = false
                this.commonService.toast("We don't do business in this zone of city, please check for another area of city", "warning")
                this.googleLocations.get('from')?.setValue("")
                this.googleLocations.get('from')?.updateValueAndValidity()
              }
            }
          }
        })

        // let country: string
        // let state: string
        // let city: string
        // let cca2: string

        // city = place.address_components![0].long_name
        // console.log(place.address_components)
        // place.address_components?.forEach((el: any) => {
        //   if (el.types.includes('country')) {
        //     country = el.long_name // country
        //     cca2 = el.short_name // cca2
        //   }
        //   if (el.types.includes('administrative_area_level_1')) {
        //     state = ", " + el.long_name // state
        //   }
        // })
        // let databaseCity: string;
        // if (state!) {
        //   databaseCity = `${city}${state!}`
        // } else {
        //   databaseCity = `${city}, ${country!}`
        // }

        // check from location is inside the business zone or not, in database



        // this.pricingService.getVehiclesOfCities(databaseCity).subscribe({
        //   next:(data:any)=>{
        //     if(data.type === HttpEventType.Response){
        //       this.vehicles = data.body.data
        //     }
        //   }
        // })

        // promise of "from" marker
      }
    })
  }
  toLocationAddListener() {
    this.destinationAutocomplete.addListener("place_changed", () => {
      const place = this.destinationAutocomplete.getPlace();
      const response = this.checkFromLocationsInput(place.formatted_address!)
      if (response) {
        this.commonService.toast(response, "warning")
        this.googleLocations.get('to')?.setValue("")
        this.googleLocations.get('to')?.updateValueAndValidity()
      } else {
        this.checkFromAndToStops(place.formatted_address!, place.geometry?.location?.lat()!, place.geometry?.location?.lng()!)
        this.googleLocations.get('to')?.setValue(place.formatted_address)
        this.googleLocations.get('to')?.updateValueAndValidity()

        this.toLocation = place.geometry?.location!
        this.validLocation = true
        // promise of "to" marker
      }
    })
  }

  checkFromLocationsInput(address: string) {
    if (this.googleLocations.get('from')?.value === address) {
      return "The source cant be your destination"
    } else {
      return ""
    }
  }

  checkToLocationInput(address: string) {
    if (this.googleLocations.get('to')?.value) {
      if (this.googleLocations.get('to')?.value === address) {
        return "The destination cant be your source"
      } else {
        return ""
      }
    } else {
      return ""
    }
  }

  checkStopLocationInput(address: string) {
    if (this.getArrayLength() > 0) {
      for (let i = 0; i < this.getArrayLength(); i++) {
        if (this.getStopsArray().controls[i].value === address) {
          return "The stop cant be repeated"
        }
      }
    }
    if (this.googleLocations.get('from')?.value === address) {
      return "The stop cant be your source"
    } else if (this.googleLocations.get('to')?.value === address) {
      return "The stop cant be your destination"
    } else {
      return ""
    }
  }

  checkFromAndToStops(address: string, lat: number, lng: number) {
    if (this.getArrayLength() > 0) {
      for (let i = 0; i < this.getArrayLength(); i++) {
        if (this.getStopsArray().controls[i].value === address) {


          console.log(lat)
          console.log(lng)
          console.log(Object.keys(this.stopsMarker))
          let stopName;
          for (let i = 0; i < Object.keys(this.stopsMarker).length; i++) {
            stopName = `stop-${i}`
            if (this.stopsMarker[i][stopName].position!.lat === lat && this.stopsMarker[i][stopName].position!.lng === lng) {
              this.stopsMarker[i][stopName].map = null
              this.stopsMarker.splice(i, 1)
              console.log(i)
              this.getStopsArray().removeAt(i)
              //stop[Object.keys(stop)[0]].map = null  
              // console.log(this.stopsMarker[i]) // object {stop-1:marker}
              // console.log(this.stopsMarker[i][stopName]) // stop-1:marker
            }
            // console.log(Object.keys(this.stopsMarker)[i]) // index [0]
            // console.log(Object.entries(this.stopsMarker)[i][1]) // object {stop-1:marker}
            // if(stop[Object.keys(this.stopsMarker[index])[0]]){
            //   stop[Object.keys(this.stopsMarker[index])[0]].map = null
            // }
            // console.log(stop[index].map)
            // console.log(stop[index][Object.keys(this.stopsMarker[index])[0]])
            // console.log(stop[Object.keys(this.stopsMarker[index])[0]].map)
            // stop[Object.keys(this.stopsMarker[index])[0]].map = null
          }

          // this.stopsMarker.splice(index, 1)



          console.log(this.stopsMarker)
          // this.getStopsArray().controls[i]?.setValue("")
          // this.getStopsArray().controls[i]?.updateValueAndValidity()
          return ""
        }
      }
      return ""
    } else {
      return ""
    }
  }

  select_type(type: any) {
    this.selected_type = type
    this.serviceTypeSelectedError = false
  }

  scheduleRide() {
    if (!this.rideSchedule) {
      this.datetimeChanged = true
    } else {
      this.datetimeChanged = false
    }
    this.rideSchedule = !this.rideSchedule
    const milliseconds = Date.now() + (30 * 60 * 1000)
    this.dataPicked = new Date(milliseconds)
    this.time = {
      hour: this.dataPicked.getHours(),
      minute: this.dataPicked.getMinutes(),
      second: this.dataPicked.getSeconds()
    };
    // this.time = {
    //   hour: this.dataPicked.getMilliseconds() + (60 * 1000),
    //   minute: this.dataPicked.getMilliseconds(),
    //   second: this.dataPicked.getSeconds()
    // }
  }

  timeChanged() {
    const milliseconds = Date.now() + (30 * 60 * 1000)
    const customDate = new Date(milliseconds)

    let timeToCheck = new Date(this.dataPicked!.getFullYear(), this.dataPicked!.getMonth(), this.dataPicked!.getDate(), this.time.hour, this.time.minute);
    if (timeToCheck.getTime() < milliseconds) {
      this.time = {
        hour: customDate.getHours(),
        minute: customDate.getMinutes(),
        second: customDate.getSeconds()
      }
      this.commonService.toast("The minimum time for Schedule ride should be minimum 30 minutes ahead from current time", "warning")
    }
    // setTimeout(() => {
    this.dataPicked!.setHours(this.time.hour)
    this.dataPicked!.setMinutes(this.time.minute)
    this.dataPicked!.setSeconds(0)
    console.log(this.dataPicked)
    // }, 200)
  }

  createMarkerImage(path: string) {
    let customMarker = document.createElement('img')
    customMarker.src = path
    customMarker.height = 40
    customMarker.width = 40
    return customMarker
  }

  secondsToDhms(seconds: number) {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    this.minutes = m

    const dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
    const hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    const mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes ") : "";
    const sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return dDisplay + hDisplay + mDisplay;
    // return `${dDisplay} days ${hDisplay} hours ${mDisplay} minutes ${sDisplay} seconds`;
  }

  async bookRideSubmit() {
    if (this.vehicles.length > 0) {
      if (!this.selected_type!._id) {
        this.commonService.toast("Please select service type", "warning")
        this.serviceTypeSelectedError = true
      }
    }
    if (!this.paymentMethod) {
      this.paymentSelectedError = true
      this.commonService.toast("Please select payment method", "warning")
      return
    }
    if (this.validLocation && this.paymentMethod && this.selected_type!._id) {
      console.log("going into ride service")
      let date;
      if (!this.rideSchedule) {
        this.dataPicked = new Date()
      }
      this.rideService.createRide(
        this.user!,
        this.googleLocations.value,
        this.fromLocation!,
        this.toLocation!,
        this.datebaseWaypoints,
        this.timeDisplay!,
        this.distanceDisplay!,
        this.selected_type!,
        this.paymentMethod,
        this.databaseCity!,
        this.selectedCard,
        this.dataPicked,
      ).subscribe({
        next: (data: any) => {
          if (data.type === HttpEventType.Response) {
            console.log(data)
            if (data?.body?.date) {
              console.log(new Date(data?.body?.date))
            }
            this.commonService.toast(data.body.message, "success")
          }
        }, complete: () => {
          this.clearAll()
          this.searchByContact.reset()
        }
      })
    } else {
      this.commonService.toast("Please select source and destination location currectly", "warning")
    }
  }

  clearAll() {
    this.show = false
    this.userFound = false
    this.previewImage = "assets/dummy_user.jpg"
    this.vehicles = []
    this.cards = []
    this.databaseCity = null

    this.googleLocations.reset()
    this.getStopsArray().clear()
    this.getStopsArray().updateValueAndValidity()

    this.rideSchedule = false
    this.dataPicked = undefined
    this.time = { hour: 0, minute: 0, second: 0 }

    this.selected_type = {
      _id: "",
      vehicle_type: "",
    }

    this.serviceTypeSelectedError = false

    if (this.stopsMarker.length > 0) {
      for (let stop of this.stopsMarker) {
        stop[Object.keys(stop)[0]].map = null
      }
      this.stopsMarker.splice(0, this.stopsMarker.length)
    }
    console.log(this.stopsMarker)
    this.user = null

    this.paymentMethod = null

    this.distanceDisplay = null
    this.timeDisplay = null

    this.calculated = false
    this.calculatedForMap = false
    this.waypoints = []

    let stopsArray = this.googleLocations.get('stops') as FormArray
    stopsArray.clear()

    this.googleLocations.get('from')?.disable()
    this.googleLocations.get('to')?.disable()
    this.googleLocations.get('stops')?.disable()

    this.fromLocation = null
    this.toLocation = null
    if (this.sourceAutocomplete) {
      this.sourceAutocomplete.setOptions(
        {
          componentRestrictions: { 'country': '' }
        }
      )
    }
    if (this.destinationAutocomplete) {
      this.destinationAutocomplete.setOptions(
        {
          componentRestrictions: { 'country': '' }
        }
      )
    }
  }

  getIdForStop() {
    let id = 0
    for (let i = 0; i < this.getStopsArray().controls.length; i++) {
      if (this.getStopsArray().controls.length > 0) {
        if (this.getStopsArray().controls[i]) {
          if (this.getStopsArray().controls[i].value === null) {
            id = i
            console.log("id ===== " + id)
            break
          } else {
            console.log("====== else block ====== ")
          }
        } else {
          // id = i
          id = i
          console.log("id in else block ===== " + id)
        }
      } else {
        console.log("2 conditions else block")
      }
    }
    return id
  }

  setPaymentMethod() {
    console.log(this.paymentMethod)
    this.paymentSelectedError = false
    // if (this.paymentMethod === "card") {
    //   this.getCardsWithCustomerDetails()
    // }
  }

  addCard() {
    let ref = this.dialog.open(AddCardModalComponent, {
      data: {
        title: 'Add Card',
        content: this.user?.custId,
        action: 'Add'
      }
    })

    ref.afterClosed().subscribe({
      next: (result: any) => {
        if (result) {
          this.getCardsWithCustomerDetails()
        }
      }
    })
  }

  getCardsWithCustomerDetails() {
    this.cardService.getCustomerDetail(this.user?.custId!).subscribe({
      next: (customer: any) => {

        this.cardService.getCards(this.user?.custId!).subscribe({
          next: (data: any) => {
            this.cards = []

            data.data.forEach((card: any) => {
              this.cards.push({
                custId: this.user?.custId!,
                id: card.id,
                brand: card.brand,
                last4: card.last4,
                expNo: card.exp_month + '/' + card.exp_year,
                default: card.id === customer.default_source
              })
            })

            this.cards.forEach((card: any) => {
              if (card.default) {
                this.selectedCard = card.id
              }
            })

          }
        })
      }
    })
  }
}
