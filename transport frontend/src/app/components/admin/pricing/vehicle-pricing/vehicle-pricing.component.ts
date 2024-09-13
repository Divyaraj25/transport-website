import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit, signal } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Pricing } from '../../../../interfaces/pricing.interface';
import { Country } from '../../../../interfaces/country.interface';
import { City } from '../../../../interfaces/city.interface';
import { VehicleType } from '../../../../interfaces/vehicle-type.interface';
import { CountryService } from '../../../../services/country.service';
import { CityService } from '../../../../services/city.service';
import { PricingService } from '../../../../services/pricing.service';
import { HttpEventType } from '@angular/common/http';
import { VehicleTypeService } from '../../../../services/vehicle-type.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmModal } from '../../../../modals/confirm-modal.component';
import { CommonService } from '../../../../services/common.service';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';


@Component({
  selector: 'app-vehicle-pricing',
  standalone: true,
  imports: [SharedModule, FormsModule, ReactiveFormsModule, NgxMaskDirective, NgxMaskPipe],
  providers: [provideNgxMask()],
  templateUrl: './vehicle-pricing.component.html',
  styleUrl: './vehicle-pricing.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class VehiclePricingComponent implements OnInit{
  isdpinputfocus: boolean = false
  ismfinputfocus: boolean = false
  isdbpinputfocus: boolean = false
  isbpinputfocus: boolean = false
  isppdinputfocus: boolean = false
  ispptinputfocus: boolean = false
  ismsinputfocus: boolean = false
  editMode: boolean = false
  addPricing: boolean = false
  pricingClear: boolean = false
  currency!: string | undefined
  countrySelected!: Country | undefined
  citySelected!: City | undefined
  vehicleTypeSelected!: VehicleType
  countries!: Country[]
  cities!: City[]
  vehicles!: VehicleType[]
  formValidBool = signal(false);
  pricingData: Pricing[] = []
  pricingForm!: FormGroup

  constructor(
    private countryService: CountryService,
    private cityService: CityService,
    private pricingService: PricingService,
    private vehicleTypeService: VehicleTypeService,
    private matDialog: MatDialog,
    private commonService: CommonService) { }

  ngOnInit(): void {

    this.pricingForm = new FormGroup({
      country: new FormControl(null, Validators.required),
      city: new FormControl(null, Validators.required),
      vehicle_type: new FormControl(null, Validators.required),
      vehicle_image: new FormControl(null),
      driver_profit: new FormControl(null),
      min_fare: new FormControl(null),
      distance_base_prize: new FormControl(null),
      base_prize: new FormControl(null),
      prize_per_distance: new FormControl(null),
      prize_per_time: new FormControl(null),
      max_space: new FormControl(null),
    })

    this.pricingService.getPricingData().subscribe({
      next: (data: any) => {
        if (data?.body) {
          this.pricingData = data.body.data
        }
      }
    })

    this.countryService.getCountriesForPricing().subscribe({
      next: (data: any) => {
        if (data?.body?.data) {
          this.countries = data.body.data
          this.countrySelected = this.countries[0]
          this.currency = this.countrySelected.currency_symbol
          this.pricingForm.get('country')?.setValue(this.countries[0].name)
        }
      },
      complete: () => {
        this.cityService.getCitiesForPricing(this.countrySelected!.cca2!).subscribe({
          next: (data: any) => {
            if (data?.body) {
              if (data.body.data.length > 0) {
                this.cities = data.body.data
                this.citySelected = this.cities[0]
                this.pricingForm.get('city')?.setValue(this.cities[0].city)
                this.getVehiclesOfCitiesFromPricingDatabase()
              } else {
                this.pricingForm.get('city')?.setValue('no city added')
              }
            }
          }
        })
      }
    })
  }

  ngDoCheck(): void {
    if (this.checkValueInForm()) {
      this.pricingClear = true
    } else {
      this.pricingClear = false
    }
  }

  checkFormValid() {
    if (this.addPricing) {
      if (this.checkValueInForm()) {
        let dataPass = {};
        if (this.editMode) {
          dataPass = {
            title: "Form Close",
            action: "Close",
            content: "Are you sure you want to close the edit pricing?"
          }
        } else {
          dataPass = {
            title: "Form Clear",
            action: "Clear",
            content: "Are you sure you want to clear the form?"
          }
        }
        let ref = this.matDialog.open(
          ConfirmModal,
          {
            position: { top: '2%' },
            width: '30%',
            disableClose: true,
            data: dataPass
          })
        ref.afterClosed().subscribe({
          next: (result: any) => {
            if (result === 'yes') {
              if (this.editMode) {
                this.pricingForm.get('vehicle_type')?.setValue(null)
                this.pricingForm.get('vehicle_type')?.updateValueAndValidity()
                this.getVehiclesOfCitiesFromPricingDatabase()
                this.editMode = false
              }
              this.formValidBool.set(false)
              this.addPricing = false
              this.setFormNull()
              this.removeValidators()
              this.UpdateValuesAndValidity()

            }
          }
        })
      } else {
        if (this.editMode) {
          this.pricingForm.get('vehicle_type')?.setValue(null)
          this.pricingForm.get('vehicle_type')?.updateValueAndValidity()
          this.getVehiclesOfCitiesFromPricingDatabase()
          this.editMode = false
        }

        this.formValidBool.set(false)
        this.addPricing = false

        this.removeValidators()
        this.UpdateValuesAndValidity()
      }
    } else {
      if (this.pricingForm.valid) {

        this.addPricing = true
        this.formValidBool.set(true)

        this.setValidators()
        this.UpdateValuesAndValidity()
      }
    }
  }

  formClear() {
    this.setFormNull()
    this.UpdateValuesAndValidity()
  }

  checkValueInForm() {
    if (this.pricingForm.get('driver_profit')?.value
      || this.pricingForm.get('min_fare')?.value
      || this.pricingForm.get('distance_base_prize')?.value
      || this.pricingForm.get('base_prize')?.value
      || this.pricingForm.get('prize_per_distance')?.value
      || this.pricingForm.get('prize_per_time')?.value
      || this.pricingForm.get('max_space')?.value) {
      return true
    } else {
      return false
    }
  }

  formSubmit() {
    if (this.editMode) {
      this.editSubmit()
    } else {
      this.addSubmit()
    }
  }

  addSubmit() {
    if (this.pricingForm.valid) {
      this.pricingService.addPricing(this.pricingForm.value).subscribe({
        next: (data: any) => {
          if (data?.body?.message) {
            this.commonService.toast(data.body.message, 'success')
            this.addPricing = false
            this.formValidBool.set(false)
            this.setFormNull()
            this.removeValidators()
            this.pricingForm.get('vehicle_type')?.setValue(null)
            this.pricingForm.get('vehicle_image')?.setValue(null)
            this.UpdateValuesAndValidity()
          }
        },
        complete: () => {
          this.getVehiclesOfCitiesFromPricingDatabase()

          this.pricingService.getPricingData().subscribe({
            next: (data: any) => {
              if (data?.body) {
                this.pricingData = data.body.data
              }
            }
          })
        }
      })
    }
  }

  editSubmit() {
    if (this.pricingForm.valid) {

      this.pricingService.editPricing(this.pricingForm.value, this.pricingForm.get('city')?.value, this.pricingForm.get('vehicle_type')?.value).subscribe({
        next: (data: any) => {
          if (data?.body) {
            this.commonService.toast(data.body.message, 'success')
          }
        }
        , complete: () => {
          this.getVehiclesOfCitiesFromPricingDatabase()

          this.pricingService.getPricingData().subscribe({
            next: (data: any) => {
              if (data?.body) {
                this.pricingData = data.body.data
              }
            }
          })

          this.editMode = false
          this.formValidBool.set(false)
          this.addPricing = false
          this.setFormNull()
          this.removeValidators()
          this.pricingForm.get('vehicle_type')?.setValue(null)
          this.pricingForm.get('vehicle_image')?.setValue(null)
          this.UpdateValuesAndValidity()
        }
      })
    } else {
      this.pricingForm.markAllAsTouched()
    }
  }

  selectVehicle(vehicle: VehicleType) {
    this.pricingForm.get('vehicle_image')?.setValue(vehicle.vehicle_image)
    this.pricingForm.get('vehicle_image')?.updateValueAndValidity()
  }

  selectCity(city: City) {
    this.citySelected = city
    this.pricingForm.get('vehicle_type')?.setValue(null)
    this.pricingForm.get('vehicle_type')?.updateValueAndValidity()
    this.getVehiclesOfCitiesFromPricingDatabase()

  }

  selectCountry(country: Country) {
    this.pricingForm.get('vehicle_type')?.setValue(null)
    this.pricingForm.get('vehicle_type')?.updateValueAndValidity()
    this.countrySelected = country
    this.currency = country.currency_symbol
    this.cityService.getCitiesForPricing(this.countrySelected.cca2!).subscribe({
      next: (data: any) => {
        if (data?.body) {
          if (data.body.data.length > 0) {
            this.cities = data.body.data
            this.citySelected = this.cities[0]
            this.pricingForm.get('city')?.setValue(this.cities[0].city)
            this.getVehiclesOfCitiesFromPricingDatabase()
          } else {
            this.pricingForm.get('city')?.setValue(null)
            this.cities = []
            this.vehicles = []
          }
        }
      }
    })

  }

  editPricing(item: Pricing) {

    this.countrySelected = this.countries.find(x => x.name === item.country)
    this.currency = this.countrySelected!.currency_symbol

    this.cityService.getCitiesForPricing(this.countrySelected!.cca2!).subscribe({
      next: (data: any) => {
        if (data?.body) {
          this.cities = data.body.data
        }
      }, complete: () => {
        this.citySelected = this.cities.find(x => x.city === item.city)
      }
    })

    this.vehicleTypeService.getVehicles().subscribe({
      next: (data: any) => {
        if (data.type === HttpEventType.Response) {
          this.vehicles = data.body.data
        }
      }
    })
    this.editMode = true
    this.addPricing = true
    this.formValidBool.set(true)
    this.pricingForm.get('country')?.setValue(item.country)
    this.pricingForm.get('city')?.setValue(item.city)
    this.pricingForm.get('vehicle_type')?.setValue(item.vehicle_type)
    this.pricingForm.get('vehicle_image')?.setValue(item.vehicle_image)
    this.pricingForm.get('driver_profit')?.setValue(item.driver_profit)
    this.pricingForm.get('min_fare')?.setValue(item.min_fare)
    this.pricingForm.get('distance_base_prize')?.setValue(item.distance_base_prize?.toString())
    this.pricingForm.get('base_prize')?.setValue(item.base_prize)
    this.pricingForm.get('prize_per_distance')?.setValue(item.prize_per_distance)
    this.pricingForm.get('prize_per_time')?.setValue(item.prize_per_time)
    this.pricingForm.get('max_space')?.setValue(item.max_space)

    this.setValidators()
    this.UpdateValuesAndValidity()
  }

  UpdateValuesAndValidity() {
    this.pricingForm.get('driver_profit')?.updateValueAndValidity()
    this.pricingForm.get('min_fare')?.updateValueAndValidity()
    this.pricingForm.get('distance_base_prize')?.updateValueAndValidity()
    this.pricingForm.get('base_prize')?.updateValueAndValidity()
    this.pricingForm.get('prize_per_distance')?.updateValueAndValidity()
    this.pricingForm.get('prize_per_time')?.updateValueAndValidity()
    this.pricingForm.get('max_space')?.updateValueAndValidity()
  }
  setFormNull() {
    this.pricingForm.get('driver_profit')?.setValue(null)
    this.pricingForm.get('min_fare')?.setValue(null)
    this.pricingForm.get('distance_base_prize')?.setValue(null)
    this.pricingForm.get('base_prize')?.setValue(null)
    this.pricingForm.get('prize_per_distance')?.setValue(null)
    this.pricingForm.get('prize_per_time')?.setValue(null)
    this.pricingForm.get('max_space')?.setValue(null)
  }

  setValidators() {
    this.pricingForm.get('driver_profit')?.setValidators(Validators.required)
    this.pricingForm.get('min_fare')?.setValidators(Validators.required)
    this.pricingForm.get('distance_base_prize')?.setValidators(Validators.required)
    this.pricingForm.get('base_prize')?.setValidators(Validators.required)
    this.pricingForm.get('prize_per_distance')?.setValidators(Validators.required)
    this.pricingForm.get('prize_per_time')?.setValidators(Validators.required)
    this.pricingForm.get('max_space')?.setValidators(Validators.required)
  }
  removeValidators() {
    this.pricingForm.get('driver_profit')?.removeValidators(Validators.required)
    this.pricingForm.get('min_fare')?.removeValidators(Validators.required)
    this.pricingForm.get('distance_base_prize')?.removeValidators(Validators.required)
    this.pricingForm.get('base_prize')?.removeValidators(Validators.required)
    this.pricingForm.get('prize_per_distance')?.removeValidators(Validators.required)
    this.pricingForm.get('prize_per_time')?.removeValidators(Validators.required)
    this.pricingForm.get('max_space')?.removeValidators(Validators.required)
  }

  getVehiclesOfCitiesFromPricingDatabase() {
    this.pricingService.getVehiclesOfCities(this.citySelected!.city).subscribe({
      next: (data: any) => {
        if (data?.body) {
          this.vehicles = data.body.data
        }
      }
    })
  }
}
