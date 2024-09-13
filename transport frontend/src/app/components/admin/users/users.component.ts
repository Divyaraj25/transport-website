import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit, ViewChild } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { MatDrawer } from '@angular/material/sidenav';
import { User } from '../../../interfaces/user.interface';
import { CountryService } from '../../../services/country.service';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { Country } from '../../../interfaces/country.interface';
import { CommonService } from '../../../services/common.service';
import { UserService } from '../../../services/user.service';
import { environment } from '../../../../environments/env.prod';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmModal } from '../../../modals/confirm-modal.component';
import { AddCardModalComponent } from '../../../modals/add-card/add-card-modal.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [SharedModule, ReactiveFormsModule, NgxMaskDirective, NgxMaskPipe],
  providers: [provideNgxMask()],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UsersComponent implements OnInit {

  @ViewChild('add') addUser!: MatDrawer

  selectedSort: string = "none"
  isDark: boolean = false
  page: number = 1
  prevPage: number = 1
  pageSize: number = 5
  totalCount!: number
  previewImage: string = 'assets/dummy_user.jpg'
  imageName: string = 'imagename'
  isccinput: boolean = false
  searching: boolean = false
  editMode: boolean = false
  countries: Country[] = []
  countrySelected!: Country
  userData: User[] = []
  userCards: [] = []
  formData: FormData = new FormData()
  userForm!: FormGroup
  searchForm!: FormGroup
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
    private countryService: CountryService,
    private commonService: CommonService,
    private userService: UserService,
    private dialog: MatDialog) { }

  ngOnInit() {

    this.commonService.isDarkMode.subscribe(data => {
      this.isDark = data
    })

    this.userForm = new FormGroup({
      username: new FormControl(null, Validators.required),
      email: new FormControl(null, [Validators.required, Validators.email]),
      country: new FormControl(null, Validators.required),
      profile: new FormControl(null, Validators.required),
      prefix: new FormControl(null, Validators.required),
      phone_no: new FormControl(null, Validators.required)
    })

    this.searchForm = new FormGroup({
      uid: new FormControl(null),
      username: new FormControl(null),
      email: new FormControl(null),
      phone_no: new FormControl(null)
    })

    this.getUsersWithPagination()
  }

  editUser(user: User) {
    this.userForm.get('profile')?.removeValidators([Validators.required])
    this.userForm.get('profile')?.updateValueAndValidity()
    if (this.countries.length === 0) {
      this.countryService.getCountriesforUserAndDriver().subscribe({
        next: (data: any) => {
          if (data.type === HttpEventType.Response) {
            this.countries = data.body.data
          }
        }
      })
    }

    this.drawerOpen()

    this.editMode = true

    this.imageName = user.profile
    this.previewImage = `http://localhost:5000/images/users/${user.profile}`

    this.changingImage()
    if (this.formData.has('_id')) {
      this.formData.set('_id', user._id!)
    } else {
      this.formData.append('_id', user._id!)
    }

    if (this.formData.has('profile')) {
      this.formData.set('profile', user.profile)
    } else {
      this.formData.append('profile', user.profile)
    }

    if (this.formData.has('old_image')) {
      this.formData.set('old_image', user.profile)
    } else {
      this.formData.append('old_image', user.profile)
    }

    this.userForm.get('username')?.setValue(user.username)
    this.userForm.get('email')?.setValue(user.email)
    this.userForm.get('phone_no')?.setValue(user.phone_no)
    this.userForm.get('country')?.setValue(user.country)
    this.userForm.get('prefix')?.setValue(user.prefix)
    this.userForm.get('profile')?.setValue(user.profile)

    this.userForm.get('username')?.updateValueAndValidity()
    this.userForm.get('email')?.updateValueAndValidity()
    this.userForm.get('phone_no')?.updateValueAndValidity()
    this.userForm.get('country')?.updateValueAndValidity()
    this.userForm.get('prefix')?.updateValueAndValidity()
    this.userForm.get('profile')?.updateValueAndValidity()

  }
  deleteUser(user: User) {
    let ref = this.dialog.open(ConfirmModal, {
      position: { top: '2%' },
      width: '30%',
      disableClose: true,
      data: {
        title: `Delete ${user.username}`,
        action: "Delete",
        content: "Are you sure you want to delete this user?"
      }
    })

    ref.afterClosed().subscribe({
      next: (result: any) => {
        if (result === 'yes') {
          this.userService.deleteUser(user._id!).subscribe({
            next: (data: any) => {
              if (data.type === HttpEventType.Response) {
                this.commonService.toast(data.body.message, "success")
                this.page = 1
                this.getUsersWithPagination()
              }
            }
          })
        }
      }
    })
  }
  addCard(user: User) {
    this.dialog.open(AddCardModalComponent, {
      data: {
        title: 'Add Card',
        content: user.custId,
        action: 'Add'
      }
    })
  }

  onSearch() {
    if (this.searchForm.get('uid')?.value
      || this.searchForm.get('username')?.value
      || this.searchForm.get('email')?.value
      || this.searchForm.get('phone_no')?.value) {
      this.searching = true
      this.page = 1
      this.searchUsersWithSortingAndPagination(this.searchForm.value, this.page, this.selectedSort, this.pageSize)
    } else {
      if (this.searching) {
        this.page = 1
        this.selectedSort = 'none'
        this.getUsersWithPagination()
      }
      this.searching = false
    }
  }

  onSubmit() {
    if (this.editMode) {
      this.editSubmit()
    } else {
      this.addSubmit()
    }
  }

  editSubmit() {
    if (this.userForm.valid) {
      if (this.formData.has('username')) {
        this.formData.set('username', this.userForm.get('username')?.value)
      } else {
        this.formData.append('username', this.userForm.get('username')?.value)
      }

      if (this.formData.has('email')) {
        this.formData.set('email', this.userForm.get('email')?.value)
      } else {
        this.formData.append('email', this.userForm.get('email')?.value)
      }

      if (this.formData.has('phone_no')) {
        this.formData.set('phone_no', this.userForm.get('phone_no')?.value)
      } else {
        this.formData.append('phone_no', this.userForm.get('phone_no')?.value)
      }

      if (this.formData.has('prefix')) {
        this.formData.set('prefix', this.userForm.get('prefix')?.value)
      } else {
        this.formData.append('prefix', this.userForm.get('prefix')?.value)
      }

      if (this.formData.has('country')) {
        this.formData.set('country', this.userForm.get('country')?.value)
      } else {
        this.formData.append('country', this.userForm.get('country')?.value)
      }

      this.userService.editUser(this.formData).subscribe({
        complete: () => {
          this.defaultImage()
          this.getUsersWithPagination()
          this.formData = new FormData()
          this.userForm.get('profile')?.addValidators([Validators.required])
          this.userForm.get('profile')?.updateValueAndValidity()
          this.editMode = false
        }
      })
    } else {
      this.userForm.markAllAsTouched()
    }

  }
  addSubmit() {
    if (this.userForm.valid) {
      if (this.formData.has('username')) {
        this.formData.set('username', this.userForm.get('username')?.value)
      } else {
        this.formData.append('username', this.userForm.get('username')?.value)
      }

      if (this.formData.has('email')) {
        this.formData.set('email', this.userForm.get('email')?.value)
      } else {
        this.formData.append('email', this.userForm.get('email')?.value)
      }

      if (this.formData.has('country')) {
        this.formData.set('country', this.userForm.get('country')?.value)
      } else {
        this.formData.append('country', this.userForm.get('country')?.value)
      }

      if (this.formData.has('phone_no')) {
        this.formData.set('phone_no', this.userForm.get('phone_no')?.value)
      } else {
        this.formData.append('phone_no', this.userForm.get('phone_no')?.value)
      }

      if (this.formData.has('prefix')) {
        this.formData.set('prefix', this.userForm.get('prefix')?.value)
      } else {
        this.formData.append('prefix', this.userForm.get('prefix')?.value)
      }

      this.userService.addUserIntoDatabase(this.formData).subscribe({
        next: (data: any) => {
          if (data.type === HttpEventType.Response) {
            this.commonService.toast(data.body.message, "success")
          }
        }, complete: () => {
          this.defaultImage()
          this.page = Math.ceil((this.totalCount + 1) / this.pageSize)
          this.getUsersWithPagination()
          this.formData = new FormData()
        }
      })
    } else {
      this.userForm.markAllAsTouched()
    }
  }

  onChangeCountry(country: Country) {
    this.countrySelected = country
    this.userForm.get('prefix')?.setValue(country.call_code)
    if (this.formData.has('prefix')) {
      this.formData.set('prefix', this.userForm.get('prefix')?.value)
    } else {
      this.formData.append('prefix', this.userForm.get('prefix')?.value)
    }
  }

  drawerClose() {
    this.addUser.close()
  }

  drawerOpen() {
    this.addUser.open()
  }

  handlePageEvent(event: any) {
    console.log(event)
    this.page = event.pageIndex + 1
    this.prevPage = event.previousPageIndex + 1
    this.pageSize = event.pageSize

    if (this.searching) {
      this.searchUsersWithSortingAndPagination(this.searchForm.value, this.page, this.selectedSort, this.pageSize)
    } else {
      this.getUsersWithPagination()
    }
  }

  onSort(sort: { _id: number, sort: string }) {
    this.selectedSort = sort.sort
    if (this.searching) {
      this.searchUsersWithSortingAndPagination(this.searchForm.value, this.page, this.selectedSort, this.pageSize)
    } else {
      this.getUsersWithPagination()
    }
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

  addUserButton() {
    if(this.editMode){
      this.editMode = false
    }
    this.userForm.markAsUntouched()
    this.defaultImage()
    this.userForm.get('username')?.setValue(null)
    this.userForm.get('email')?.setValue(null)
    this.userForm.get('country')?.setValue(null)
    this.userForm.get('profile')?.setValue(null)
    this.userForm.get('prefix')?.setValue(null)
    this.userForm.get('phone_no')?.setValue(null)

    this.userForm.get('username')?.updateValueAndValidity()
    this.userForm.get('email')?.updateValueAndValidity()
    this.userForm.get('country')?.updateValueAndValidity()
    this.userForm.get('profile')?.updateValueAndValidity()
    this.userForm.get('prefix')?.updateValueAndValidity()
    this.userForm.get('phone_no')?.updateValueAndValidity()

    if (this.countries.length === 0) {
      this.countryService.getCountriesforUserAndDriver().subscribe({
        next: (data: any) => {
          if (data?.body) {
            this.countries = data.body.data
            this.countrySelected = this.countries[0]
            this.userForm.get('country')?.setValue(this.countrySelected.name)
            this.userForm.get('prefix')?.setValue(this.countrySelected.call_code)
            this.userForm.get('country')?.updateValueAndValidity()
            this.userForm.get('prefix')?.updateValueAndValidity()
          }
        }
      })
    } else {
      this.userForm.get('country')?.setValue(this.countrySelected.name)
      this.userForm.get('prefix')?.setValue(this.countrySelected.call_code)
      this.userForm.get('country')?.updateValueAndValidity()
      this.userForm.get('prefix')?.updateValueAndValidity()
    }
  }

  getUsersWithPagination() {
    this.userService.getUsers(this.page, this.selectedSort, this.pageSize).subscribe({
      next: (data: any) => {
        if (data.type === HttpEventType.Response) {
          this.userData = data.body.data.users
          this.totalCount = data.body.data.count
          this.drawerClose()
        }
      }
    })
  }

  searchUsersWithSortingAndPagination(search: FormData, page: number, sort: string, pageSize: number) {
    this.userService.searchUser(search, page, sort, pageSize).subscribe({
      next: (data: any) => {
        if (data.type === HttpEventType.Response) {
          this.userData = data.body.data.users
          this.totalCount = data.body.data.count
        }
      }
    })
  }
}
