import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { CountryService } from '../../../../services/country.service';
import { GoogleMapsModule } from '@angular/google-maps';
import { Country } from '../../../../interfaces/country.interface';
import { City } from '../../../../interfaces/city.interface';
import { CityService } from '../../../../services/city.service';
import { FormsModule } from '@angular/forms';
import { CommonService } from '../../../../services/common.service';
import { HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-city',
  standalone: true,
  imports: [SharedModule, FormsModule],
  templateUrl: './city.component.html',
  styleUrl: './city.component.scss'
})
export class CityComponent implements OnInit {
  map!: google.maps.Map;
  drawingManager!: google.maps.drawing.DrawingManager
  autocomplete!: google.maps.places.Autocomplete;
  polygon!: google.maps.Polygon
  intersectPolygon!: google.maps.Polygon
  allPolygons: google.maps.Polygon[] = []
  polyCoordinates: google.maps.LatLngLiteral[] = []
  editZone!: google.maps.LatLngLiteral[]
  countries: Country[] = []
  cities: City[] = []
  selectedCountryConfig!: Country
  selectedFirst: string = ''
  cityInput: string = ''
  editMode: boolean = false
  formData: FormData = new FormData()
  constructor(
    private countryService: CountryService,
    private cityService: CityService,
    private commonService: CommonService) { }

  ngOnInit() {
    this.countryService.getCountriesForCities().subscribe({
      next: (data: any) => {
        if (data?.body?.data) {
          this.countries = data.body.data
          this.selectedFirst = this.countries[0].name
          this.selectedCountryConfig = this.countries[0]
        }
      },
      complete: () => {
        this.map = new google.maps.Map(document.getElementById("map") as HTMLElement, {
          center: { lat: this.selectedCountryConfig.lat_lng[0] || 10.850516, lng: this.selectedCountryConfig.lat_lng[1] || 7.809007 },
          zoom: 5,
        });

        this.drawingManager = new google.maps.drawing.DrawingManager({
          drawingControl: false,
          polygonOptions: {
            draggable: true,
            editable: false,
            fillColor: "#4a4a4a",
            fillOpacity: 0.5,
            strokeColor: "#000",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            zIndex: 1,
          },
          map: this.map,
        })

        this.autocomplete = new google.maps.places.Autocomplete(document.getElementById("city") as HTMLInputElement, {
          componentRestrictions: { country: this.selectedCountryConfig.cca2! },
          types: ["(cities)"],
        });

        this.cityService.getCities(this.selectedCountryConfig.cca2!).subscribe({
          next: (data: any) => {
            if (data?.body) {

              this.cities = data.body.data
              if (this.cities.length > 0) {
                this.getZones()
              }
            }
          }
        })

        this.onAddListenerOnAutoComplete()

        this.updatePolygon()

      }
    })
  }

  onSelectCountry(countryName: Country) {
    this.cityInput = ''
    for (let country of this.countries) {
      if (country.name.toLowerCase() === countryName.name.toLowerCase()) {
        this.selectedCountryConfig = country
        break
      }
    }

    this.map.panTo(new google.maps.LatLng({ lat: this.selectedCountryConfig.lat_lng[0], lng: this.selectedCountryConfig.lat_lng[1] }))

    this.autocomplete.setOptions({
      componentRestrictions: { country: this.selectedCountryConfig.cca2! },
      types: ["(cities)"],
    })

    this.allPolygons.forEach((poly: any) => {
      poly.setMap(null)
    })

    this.cityService.getCities(this.selectedCountryConfig.cca2!).subscribe({
      next: (data: any) => {
        if (data?.body) {

          this.cities = data.body.data
          if (this.cities.length > 0) {
            this.getZones()
          }
        }
      },
    })
  }

  onAddListenerOnAutoComplete() {

    this.autocomplete.addListener("place_changed", () => {

      const place = this.autocomplete.getPlace();

      let country: string
      let state: string
      let city: string
      let cca2: string

      city = place.address_components![0].long_name
      place.address_components?.forEach((el: any) => {
        if (el.types.includes('country')) {
          country = el.long_name // country
          cca2 = el.short_name // cca2
        }
        if (el.types.includes('administrative_area_level_1')) {
          state = ", " + el.long_name // state
        }
      })
      let databaseCity:string;
      if(state!){
        databaseCity= `${city}${state!}`
      }else{
        databaseCity= `${city}, ${country!}`
      }
      this.cityService.checkCityInDatabase(cca2!, databaseCity).subscribe({
        next: (data: any) => {
          if (data?.body) {
            if (data.body.error) {
              this.commonService.toast(data.body.message, "error")
            } else {
              this.allPolygons.forEach((poly: any) => {
                poly.setMap(null)
              })
              this.drawingManager.setOptions({
                drawingControl: true,
                polygonOptions: {
                  editable: true
                },
                drawingControlOptions: {
                  position: google.maps.ControlPosition.TOP_CENTER,
                  drawingModes: [google.maps.drawing.OverlayType.POLYGON],
                },
                map: this.map
              })
              this.map.setZoom(12)
              this.map.panTo(place.geometry!.location!);
              
              this.formData.append('city', databaseCity)
              this.formData.append('country', country)
              this.formData.append('cca2', cca2)
            }
          }
        },
      })
    });
  }

  onSubmit() {
    if (this.editMode) {
      this.editSubmit()
    } else {
      this.addSubmit()
    }
  }

  editSubmit() {
    if (this.polyCoordinates === this.editZone) {
      this.cityService.getCities(this.selectedCountryConfig.cca2!).subscribe({
        next: (data: any) => {
          this.cities = data.body.data
        },
        complete: () => {
          this.editMode = false
          this.commonService.toast("No updates", "info")
          this.cityInput = ''
          this.drawingManager.setOptions({
            drawingControl: false,
            polygonOptions: {
              editable: false
            },
            map: null
          })
          this.polygon.setMap(null)
          this.map.setZoom(5)

          this.getZones()

        }
      })
    } else {


      this.cityService.checkZoneInDatabase(this.selectedCountryConfig.cca2!, this.editMode, this.cityInput, this.polyCoordinates).subscribe({
        next: (data: any) => {
          if (data.type === HttpEventType.Response) {




            if (data?.body?.data.length > 0) {
              let latlngObject = [];
              for (let zone of data.body.data[0].zone?.coordinates[0]!) {
                let obj = {
                  lat: zone[1],
                  lng: zone[0]
                }
                latlngObject.push(obj)
              }
              if (this.intersectPolygon) {
                this.intersectPolygon.setMap(null)
              }
              this.intersectPolygon = new google.maps.Polygon({
                paths: latlngObject,
                draggable: false,
                editable: false,
                fillColor: "#ff0000",
                fillOpacity: 0.5,
                strokeColor: "#000",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                map: this.map
              })
              this.commonService.toast(data.body.message, "warning")
            } else {
              if (this.intersectPolygon) {
                this.intersectPolygon.setMap(null)
              }

              this.cityService.editZoneInDatabase(this.selectedCountryConfig.cca2!, this.cityInput, this.polyCoordinates).subscribe({
                next: (data: any) => {

                  this.commonService.toast(data.body.message, "success")
                },
                complete: () => {
                  this.formData = new FormData()
                  this.cityService.getCities(this.selectedCountryConfig.cca2!).subscribe({
                    next: (data: any) => {
                      if (data.type === HttpEventType.Response) {

                        this.cities = data.body.data
                      }
                    },
                    complete: () => {
                      this.editMode = false
                      this.cityInput = ''
                      this.drawingManager.setOptions({
                        drawingControl: false,
                        polygonOptions: {
                          editable: false
                        },
                        map: null
                      })
                      this.polygon.setMap(null)
                      this.map.setZoom(5)

                      this.getZones()
                    }
                  })
                }
              })
            }



          }
        }
      })



    }
  }

  addSubmit() {
    if (this.cityInput) {
      if (this.polyCoordinates.length > 0) {

        this.cityService.checkZoneInDatabase(this.selectedCountryConfig.cca2!, this.editMode, this.cityInput, this.polyCoordinates).subscribe({
          next: (data: any) => {
            if (data.type === HttpEventType.Response) {


              if (data?.body?.data) {


                if (data?.body?.data.length > 0) {
                  let latlngObject = [];
                  for (let zone of data.body.data[0].zone?.coordinates[0]!) {
                    let obj = {
                      lat: zone[1],
                      lng: zone[0]
                    }
                    latlngObject.push(obj)
                  }
                  if (this.intersectPolygon) {
                    this.intersectPolygon.setMap(null)
                  }
                  this.intersectPolygon = new google.maps.Polygon({
                    paths: latlngObject,
                    draggable: false,
                    editable: false,
                    fillColor: "#ff0000",
                    fillOpacity: 0.5,
                    strokeColor: "#000",
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    map: this.map
                  })
                  this.commonService.toast(data.body.message, "warning")
                } else {
                  if (this.intersectPolygon) {
                    this.intersectPolygon.setMap(null)
                  }

                  this.cityService.addCityInDatabase(this.formData, this.polyCoordinates).subscribe({
                    next: (data: any) => {

                      this.commonService.toast(data.body.message, "success")
                    },
                    complete: () => {
                      this.formData = new FormData()
                      this.cityService.getCities(this.selectedCountryConfig.cca2!).subscribe({
                        next: (data: any) => {
                          if (data.type === HttpEventType.Response) {

                            this.cities = data.body.data
                          }
                        },
                        complete: () => {
                          this.cityInput = ''
                          this.drawingManager.setOptions({
                            drawingControl: false,
                            polygonOptions: {
                              editable: false
                            },
                            map: null
                          })
                          this.polygon.setMap(null)
                          this.map.setZoom(5)

                          this.getZones()
                        }
                      })
                    }
                  })
                }
              }


            }
          }
        })

      } else {
        this.commonService.toast('Please add a zone', 'warning')
      }
    } else {
      this.commonService.toast('Please enter city', 'warning')
    }
  }

  formClear() {
    if (this.formData.has('city')) {
      this.formData.delete('city')
    }
    if (this.formData.has('cca2')) {
      this.formData.delete('cca2')
    }
    if (this.formData.has('country')) {
      this.formData.delete('country')
    }
  }

  getZones() {
    for (let city of this.cities) {
      let latlngObject = [];
      for (let zone of city.zone?.coordinates[0]!) {
        let obj = {
          lat: zone[1],
          lng: zone[0]
        }
        latlngObject.push(obj)
      }
      this.allPolygons.push(new google.maps.Polygon({
        paths: latlngObject,
        map: this.map
      })
      )
    }
  }

  onSelectCity(cca2: string | undefined, city: string) {
    this.cityService.checkCityInDatabase(cca2!, city).subscribe({
      next: (data: any) => {
        if (data?.body?.data) {
          this.allPolygons.forEach((poly: any) => {
            poly.setMap(null)
          })

          let latlngObject = [];
          for (let zone of data.body.data[0].zone?.coordinates[0]!) {
            let obj = {
              lat: zone[1],
              lng: zone[0]
            }
            latlngObject.push(obj)
          }

          this.polyCoordinates = latlngObject
          this.editZone = latlngObject

          let polygon = new google.maps.Polygon({
            paths: this.polyCoordinates,
            editable: true,
            map: this.map
          })

          polygon.getPath().addListener("set_at", () => {
            this.polyCoordinates = polygon
              .getPath()
              .getArray()
              .map((coord) => ({
                lat: coord.lat(),
                lng: coord.lng(),
              }));
          })

          polygon.getPath().addListener("insert_at", () => {
            this.polyCoordinates = polygon
              .getPath()
              .getArray()
              .map((coord) => ({
                lat: coord.lat(),
                lng: coord.lng(),
              }));
          })

          polygon.getPath().addListener("remove_at", () => {
            this.polyCoordinates = polygon
              .getPath()
              .getArray()
              .map((coord) => ({
                lat: coord.lat(),
                lng: coord.lng(),
              }));
          })


          if (this.polygon) {
            this.polygon.setMap(null)
          }
          this.polygon = polygon

          this.allPolygons.push(this.polygon)

          this.cityInput = data.body.data[0].city
          this.map.setZoom(11)

          // calculate center of zone and panTo in map
          this.map.panTo(this.getCenterOfZone(data.body.data[0].zone))
        }

        this.drawingManager.setOptions({
          drawingControl: true,
          drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [google.maps.drawing.OverlayType.POLYGON],
          },
          polygonOptions: {
            editable: true
          },
          map: this.map
        })
      },
      complete: () => {
        this.editMode = true
      }
    })
  }

  updatePolygon() {
    google.maps.event.addListener(this.drawingManager, "overlaycomplete", (event: any) => {
      if (this.polygon) {
        this.polygon.setMap(null)
      }
      let polygon = event.overlay as google.maps.Polygon
      this.polyCoordinates = polygon
        .getPath()
        .getArray()
        .map((coord: google.maps.LatLng) => ({
          lat: coord.lat(),
          lng: coord.lng()
        }))

      polygon.getPath().addListener("set_at", () => {
        this.polyCoordinates = polygon
          .getPath()
          .getArray()
          .map((coord) => ({
            lat: coord.lat(),
            lng: coord.lng(),
          }));
      })

      polygon.getPath().addListener("insert_at", () => {
        this.polyCoordinates = polygon
          .getPath()
          .getArray()
          .map((coord) => ({
            lat: coord.lat(),
            lng: coord.lng(),
          }));
      })

      polygon.getPath().addListener("remove_at", () => {
        this.polyCoordinates = polygon
          .getPath()
          .getArray()
          .map((coord) => ({
            lat: coord.lat(),
            lng: coord.lng(),
          }));
      })


      this.polygon = polygon
      this.polygon.setMap(this.map)
    })
  }

  getCenterOfZone(zone: any) {
    let latSum = 0;
    let lngSum = 0;

    for (let latlng of zone.coordinates[0]) {
      latSum += latlng[1]
      lngSum += latlng[0]
    }

    const centerLat = latSum / zone.coordinates[0].length;
    const centerLng = lngSum / zone.coordinates[0].length;
    return new google.maps.LatLng(centerLat, centerLng);
  }

  clearUpdate() {
    this.editMode = false
    this.cityInput = ''
    if (this.allPolygons) {
      this.allPolygons.forEach(poly => {
        poly.setMap(null)
      })
    }
    if (this.polygon) {
      this.polygon.setMap(null)
    }
    if (this.intersectPolygon) {
      this.intersectPolygon.setOptions({
        map: null
      })
    }
    this.drawingManager.setOptions({
      map: null
    })
    this.cityService.getCities(this.selectedCountryConfig.cca2!).subscribe({
      next: (data: any) => {
        if (data?.body?.data) {
          this.cities = data.body.data
          this.getZones()
          this.map.setZoom(5)
          this.map.panTo(new google.maps.LatLng({ lat: this.selectedCountryConfig.lat_lng[0], lng: this.selectedCountryConfig.lat_lng[1] }))
        }
      }
    })
  }
} 