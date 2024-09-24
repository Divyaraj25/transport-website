import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit, ViewChild } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { MatDrawer } from '@angular/material/sidenav';
import { CommonService } from '../../../../services/common.service';
import { CountryService } from '../../../../services/country.service';
import { Country } from '../../../../interfaces/country.interface';
import { Driver } from '../../../../interfaces/driver.interface';
import { City } from '../../../../interfaces/city.interface';
import { CityService } from '../../../../services/city.service';
import { HttpEventType } from '@angular/common/http';
import { DriverService } from '../../../../services/driver.service';
import { ConfirmModal } from '../../../../modals/confirm-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { ServiceTypeModalComponent } from '../../../../modals/service-type-modal.component';
import { VehicleTypeService } from '../../../../services/vehicle-type.service';
import { VehicleType } from '../../../../interfaces/vehicle-type.interface';

@Component({
  selector: 'app-driver-list',
  standalone: true,
  imports: [SharedModule, ReactiveFormsModule, NgxMaskDirective, NgxMaskPipe],
  providers: [provideNgxMask()],
  templateUrl: './driver-list.component.html',
  styleUrl: './driver-list.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DriverListComponent implements OnInit{
  @ViewChild('add') addUser!: MatDrawer

  searching: boolean = false
  isDark: boolean = false
  isccinput: boolean = false
  editMode: boolean = false
  page: number = 1
  prevPage: number = 1
  pageSize: number = 5
  totalCount!: number
  selectedSort: string = "none"
  previewImage: string = 'assets/dummy_user.jpg'
  imageName: string = 'imagename'
  searchForm!: FormGroup
  driverForm!: FormGroup
  formData: FormData = new FormData()
  driverData: Driver[] = []
  countries: Country[] = []
  countrySelected: Country | undefined
  cities: City[] = []
  citySelected!: City | null
  sortByOptions: { _id: number, sort: string, value: string }[] = [
    {
      _id: 1,
      sort: 'none',
      value: 'none'
    },
    {
      _id: 2,
      sort: 'username',
      value: 'username'
    },
    {
      _id: 3,
      sort: 'email',
      value: 'email'
    },
    {
      _id: 4,
      sort: 'phone no',
      value: 'phone_no'
    }
  ]

  constructor(
    private commonService: CommonService,
    private countryService: CountryService,
    private cityService: CityService,
    private driverService: DriverService,
    private dialog: MatDialog,
    private vehicleService: VehicleTypeService) { }

  ngOnInit() {

    this.commonService.isDarkMode.subscribe(data => {
      this.isDark = data
    })

    this.searchForm = new FormGroup({
      uid: new FormControl(null),
      username: new FormControl(null),
      email: new FormControl(null),
      phone_no: new FormControl(null)
    })

    this.driverForm = new FormGroup({
      username: new FormControl(null, Validators.required),
      email: new FormControl(null, [Validators.required, Validators.email]),
      country: new FormControl(null, Validators.required),
      city: new FormControl(null, Validators.required),
      profile: new FormControl(null, Validators.required),
      prefix: new FormControl(null, Validators.required),
      phone_no: new FormControl(null, Validators.required)
    })

    this.getDriversWithPagination()
  }

  editUser(user: Driver) {
    this.driverForm.get('profile')?.removeValidators([Validators.required])
    this.driverForm.get('profile')?.updateValueAndValidity()
    if (this.countries.length === 0) {
      this.countryService.getCountriesforUserAndDriver().subscribe({
        next: (data: any) => {
          if (data.type === HttpEventType.Response) {
            this.countries = data.body.data
          }
        },
        complete: () => {
          this.countrySelected = this.countries.find((c) => c.name === user.country)
          this.cityService.getCityDataForUsersAndDrivers(this.countrySelected?.cca2!).subscribe({
            next: (data: any) => {
              if (data.type === HttpEventType.Response) {
                this.cities = data.body.data
              }
            }
          })
        }
      })
    }



    this.drawerOpen()

    this.editMode = true

    this.imageName = user.profile!
    this.previewImage = `http://16.170.146.16:5000/images/drivers/${user.profile}`

    this.changingImage()

    if (this.formData.has('_id')) {
      this.formData.set('_id', user._id!)
    } else {
      this.formData.append('_id', user._id!)
    }

    if (this.formData.has('profile')) {
      this.formData.set('profile', user.profile!)
    } else {
      this.formData.append('profile', user.profile!)
    }

    if (this.formData.has('old_image')) {
      this.formData.set('old_image', user.profile!)
    } else {
      this.formData.append('old_image', user.profile!)
    }

    this.driverForm.get('username')?.setValue(user.username)
    this.driverForm.get('email')?.setValue(user.email)
    this.driverForm.get('phone_no')?.setValue(user.phone_no)
    this.driverForm.get('country')?.setValue(user.country)
    this.driverForm.get('city')?.setValue(user.city)
    this.driverForm.get('prefix')?.setValue(user.prefix)
    this.driverForm.get('profile')?.setValue(user.profile)

    this.driverForm.get('username')?.updateValueAndValidity()
    this.driverForm.get('email')?.updateValueAndValidity()
    this.driverForm.get('phone_no')?.updateValueAndValidity()
    this.driverForm.get('country')?.updateValueAndValidity()
    this.driverForm.get('city')?.updateValueAndValidity()
    this.driverForm.get('prefix')?.updateValueAndValidity()
    this.driverForm.get('profile')?.updateValueAndValidity()
  }

  deleteUser(user: Driver) {
    let ref = this.dialog.open(ConfirmModal, {
      position: { top: '2%' },
      width: '30%',
      disableClose: true,
      data: {
        title: `Delete ${user.username}`,
        action: "Delete",
        content: "Are you sure you want to delete this Driver?"
      }
    })

    ref.afterClosed().subscribe({
      next: (result: any) => {
        if (result === 'yes') {
          this.driverService.deleteDriver(user._id!).subscribe({
            next: (data: any) => {
              if (data.type === HttpEventType.Response) {
                this.commonService.toast(data.body.message, "success")
                this.page = 1
                this.getDriversWithPagination()
              }
            }
          })
        }
      }
    })
  }

  selectServiceType(user: Driver) {
    let vehicle: VehicleType;
    this.vehicleService.getVehicles().subscribe({
      next: (data: any) => {
        if (data.type === HttpEventType.Response) {
          vehicle = data.body.data
          let ref = this.dialog.open(ServiceTypeModalComponent, {
            data: {
              title: `Select Service Type`,
              content: vehicle,
              action: "Select",
              selected: user.vehicle_type ? user.vehicle_type : "none"
            }
          })

          ref.afterClosed().subscribe({
            next: (result: any) => {
              if (result !== 'no') {
                if (result) {
                  this.driverService.setServiceType(user._id!, result.vehicle_type, result.vehicle_image).subscribe({
                    complete: () => {
                      let msg;
                      if (result.vehicle_type === "none") {
                        msg = `No vehicles assigned to ${user.username}`
                      } else {
                        msg = `${result.vehicle_type} assigned to driver ${user.username}`
                      }
                      this.getDriversWithPagination()
                      this.commonService.toast(msg, "success")
                    }
                  })
                }
              }
            }
          })
        }
      }
    })
  }

  onApprove(userId: string | undefined, approved: boolean | undefined, username: string) {
    this.driverService.approveDriver(userId!, approved!).subscribe({
      complete: () => {
        let approval = approved ? "Disapproved" : "Approved"
        this.commonService.toast(`${username} has been ${approval}`, "success")
        this.getDriversWithPagination()
      }
    })
  }

  onSubmit() {
    if (this.editMode) {
      this.editSubmit()
    } else {
      this.addSubmit()
    }
  }

  editSubmit() {

    if (this.driverForm.valid) {
      this.setFormDataValue()

      this.driverService.editDriver(this.formData).subscribe({
        complete: () => {
          this.defaultImage()
          this.getDriversWithPagination()
          this.formData = new FormData()
          this.driverForm.get('profile')?.addValidators([Validators.required])
          this.driverForm.get('profile')?.updateValueAndValidity()
          this.editMode = false
        }
      })
    } else {
      this.driverForm.markAllAsTouched()
    }

  }
  addSubmit() {
    if (this.driverForm.valid) {
      this.setFormDataValue()

      this.driverService.addDriver(this.formData).subscribe({
        next: (data: any) => {
          if (data.type === HttpEventType.Response) {
            this.commonService.toast(data.body.message.general, "success")
            this.commonService.toast(data.body.message.driver, "success")
          }
        }, complete: () => {
          this.defaultImage()
          this.page = Math.ceil((this.totalCount + 1) / this.pageSize)
          this.getDriversWithPagination()
          this.formData = new FormData()
        }
      })
    } else {
      this.driverForm.markAllAsTouched()
    }
  }

  onSearch() {
    if (this.searchForm.get('uid')?.value
      || this.searchForm.get('username')?.value
      || this.searchForm.get('email')?.value
      || this.searchForm.get('phone_no')?.value) {
      this.searching = true
      this.page = 1
      this.searchDriversWithSortingAndPagination(this.searchForm.value, this.page, this.selectedSort, this.pageSize)
    } else {
      if (this.searching) {
        this.page = 1
        this.selectedSort = 'none'
        this.getDriversWithPagination()
      }
      this.searching = false
    }
  }

  onSort(sort: { _id: number, sort: string }) {
    this.selectedSort = sort.sort
    if (this.searching) {
      this.searchDriversWithSortingAndPagination(this.searchForm.value, this.page, this.selectedSort, this.pageSize)
    } else {
      this.getDriversWithPagination()
    }
  }

  onChangeCity(city: City) {
    console.log(city)
  }

  onChangeCountry(country: Country) {
    this.countrySelected = country

    this.cityService.getCityDataForUsersAndDrivers(this.countrySelected.cca2!).subscribe({
      next: (data: any) => {
        if (data.type === HttpEventType.Response) {
          if (data?.body?.data.length > 0) {
            this.cities = data.body.data
            this.citySelected = this.cities[0]
            this.driverForm.get('city')?.setValue(this.citySelected.city)
            this.driverForm.get('city')?.updateValueAndValidity()
          } else {
            if (this.driverForm.get('city')?.value) {
              this.driverForm.get('city')?.setValue(null)
              this.driverForm.get('city')?.updateValueAndValidity()
            }
            this.cities = []
            this.citySelected = null
          }
        }
      }
    })

    this.cityService.getCityDataForUsersAndDrivers(country.cca2!).subscribe({
      next: (data: any) => {
        if (data?.body) {
          this.cities = data.body.data
          this.citySelected = this.cities[0]
          this.driverForm.get('city')?.setValue(this.citySelected.city)
          this.driverForm.get('city')?.updateValueAndValidity()
        }
      }
    })

    this.driverForm.get('prefix')?.setValue(country.call_code)

    if (this.formData.has('prefix')) {
      this.formData.set('prefix', this.driverForm.get('prefix')?.value)
    } else {
      this.formData.append('prefix', this.driverForm.get('prefix')?.value)
    }
  }

  addUserButton() {
    if (this.editMode) {
      this.editMode = false
    }
    this.driverForm.markAsUntouched()
    this.defaultImage()
    this.driverForm.get('username')?.setValue(null)
    this.driverForm.get('email')?.setValue(null)
    this.driverForm.get('country')?.setValue(null)
    this.driverForm.get('city')?.setValue(null)
    this.driverForm.get('profile')?.setValue(null)
    this.driverForm.get('prefix')?.setValue(null)
    this.driverForm.get('phone_no')?.setValue(null)

    this.driverForm.get('username')?.updateValueAndValidity()
    this.driverForm.get('email')?.updateValueAndValidity()
    this.driverForm.get('country')?.updateValueAndValidity()
    this.driverForm.get('city')?.updateValueAndValidity()
    this.driverForm.get('profile')?.updateValueAndValidity()
    this.driverForm.get('prefix')?.updateValueAndValidity()
    this.driverForm.get('phone_no')?.updateValueAndValidity()

    if (this.countries.length === 0) {
      this.countryService.getCountriesforUserAndDriver().subscribe({
        next: (data: any) => {
          if (data?.body) {
            this.countries = data.body.data
            this.countrySelected = this.countries[0]
            this.driverForm.get('country')?.setValue(this.countrySelected.name)
            this.driverForm.get('prefix')?.setValue(this.countrySelected.call_code)
            this.driverForm.get('country')?.updateValueAndValidity()
            this.driverForm.get('prefix')?.updateValueAndValidity()
          }
        },
        complete: () => {
          this.cityService.getCityDataForUsersAndDrivers(this.countrySelected?.cca2!).subscribe({
            next: (data: any) => {
              if (data.type === HttpEventType.Response) {
                if (data?.body?.data.length > 0) {
                  this.cities = data.body.data
                  this.citySelected = this.cities[0]
                  this.driverForm.get('city')?.setValue(this.citySelected.city)
                  this.driverForm.get('city')?.updateValueAndValidity()
                } else {
                  if (this.driverForm.get('city')?.value) {
                    this.driverForm.get('city')?.setValue(null)
                    this.driverForm.get('city')?.updateValueAndValidity()
                  }
                  this.cities = []
                  this.citySelected = null
                }
              }
            }
          })
        }
      })
    } else {
      this.driverForm.get('country')?.setValue(this.countrySelected?.name)
      this.driverForm.get('prefix')?.setValue(this.countrySelected?.call_code)
      this.driverForm.get('city')?.setValue(this.citySelected!.city)
      this.driverForm.get('country')?.updateValueAndValidity()
      this.driverForm.get('prefix')?.updateValueAndValidity()
      this.driverForm.get('city')?.updateValueAndValidity()
    }
  }

  drawerClose() {
    this.addUser.close()
  }

  drawerOpen() {
    this.addUser.open()
  }

  onImageChange(event: any) {
    this.commonService.buffering()
    this.imageName = event.target.files[0].name
    if (this.formData.has('profile')) {
      this.formData.set('profile', event.target.files[0], event.target.files[0].name)
    } else {
      this.formData.append('profile', event.target.files[0], event.target.files[0].name)
    }

    let reader = new FileReader();
    reader.readAsDataURL(event.target.files[0] as Blob);
    reader.onload = (event) => {
      this.previewImage = event.target!.result as string;
      this.commonService.bufferdone()
    };
    this.changingImage()
  }

  changingImage() {
    const img_view = document.getElementById('img-view');
    const img_preview = document.getElementById('image-preview');
    img_view!.style.border = '0px';
    img_view!.style.background = 'none';
    img_preview!.style.width = '100%';
    img_preview!.style.height = '300px';
    img_preview!.style.marginTop = '0px';
  }

  defaultImage() {
    const img_view = document.getElementById('img-view');
    const img_preview = document.getElementById('image-preview');
    img_view!.style.border = '2px dashed #ccc';
    img_view!.style.background = '#f7f8ff';
    img_preview!.style.width = '200px';
    img_preview!.style.height = '200px';
    img_preview!.style.marginTop = '25px';
    this.previewImage = 'assets/dummy_user.jpg'
  }

  handlePageEvent(event: any) {
    this.page = event.pageIndex + 1
    this.prevPage = event.previousPageIndex + 1
    this.pageSize = event.pageSize

    if (this.searching) {
      this.searchDriversWithSortingAndPagination(this.searchForm.value, this.page, this.selectedSort, this.pageSize)
    } else {
      this.getDriversWithPagination()
    }
  }

  getDriversWithPagination() {
    this.driverService.getDrivers(this.page, this.selectedSort, this.pageSize).subscribe({
      next: (data: any) => {
        if (data.type === HttpEventType.Response) {
          this.driverData = data.body.data.drivers
          this.totalCount = data.body.data.count
          this.drawerClose()
        }
      }
    })
  }

  searchDriversWithSortingAndPagination(search: FormData, page: number, sort: string, pageSize: number) {
    this.driverService.searchDriver(search, page, sort, pageSize).subscribe({
      next: (data: any) => {
        if (data.type === HttpEventType.Response) {
          this.driverData = data.body.data.drivers
          this.totalCount = data.body.data.count
        }
      }
    })
  }

  setFormDataValue() {
    if (this.formData.has('username')) {
      this.formData.set('username', this.driverForm.get('username')?.value)
    } else {
      this.formData.append('username', this.driverForm.get('username')?.value)
    }

    if (this.formData.has('email')) {
      this.formData.set('email', this.driverForm.get('email')?.value)
    } else {
      this.formData.append('email', this.driverForm.get('email')?.value)
    }

    if (this.formData.has('phone_no')) {
      this.formData.set('phone_no', this.driverForm.get('phone_no')?.value)
    } else {
      this.formData.append('phone_no', this.driverForm.get('phone_no')?.value)
    }

    if (this.formData.has('prefix')) {
      this.formData.set('prefix', this.driverForm.get('prefix')?.value)
    } else {
      this.formData.append('prefix', this.driverForm.get('prefix')?.value)
    }

    if (this.formData.has('country')) {
      this.formData.set('country', this.driverForm.get('country')?.value)
    } else {
      this.formData.append('country', this.driverForm.get('country')?.value)
    }

    if (this.formData.has('city')) {
      this.formData.set('city', this.driverForm.get('city')?.value)
    } else {
      this.formData.append('city', this.driverForm.get('city')?.value)
    }
  }
}
