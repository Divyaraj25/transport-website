import { Component, InjectionToken, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogActions, MatDialogClose, MatDialogContent } from '@angular/material/dialog';
import { AsyncPipe } from '@angular/common';
import { Observable, map, startWith } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AppComponent } from '../../app.component';
import { Country } from '../../interfaces/country.interface';
import { CountryService } from '../../services/country.service';
import { CountryComponent } from '../../components/admin/pricing/country/country.component';
import { DialogRef } from '@angular/cdk/dialog';
import { CommonService } from '../../services/common.service';
import { BnNgIdleService } from 'bn-ng-idle';


@Component({
  selector: 'app-add-country',
  standalone: true,
  imports: [SharedModule, FormsModule, MatDialogActions, MatDialogContent, AsyncPipe, MatDialogClose, ReactiveFormsModule],
  providers: [BnNgIdleService],
  templateUrl: './add-country.component.html',
  styleUrl: './add-country.component.scss'
})
export class AddCountryComponent implements OnInit{
  isLoading: boolean = false
  countryFound!: FormGroup
  countryForm!: Country | undefined
  countrySelected: boolean = false
  countryCurrencySymbol!: string

  constructor(
    private http: HttpClient,
    private dialogRef: DialogRef,
    private countryService: CountryService,
    private commonService: CommonService,
    private idle: BnNgIdleService
  ) { }

  ngOnInit() {
    this.idle.startWatching(1200).subscribe({
      next: (isTimeOut: boolean) => {
        if (isTimeOut) {
          this.commonService.toast('Session Expired. Please Login Again', 'error')
          this.dialogRef.close()
        }
      }
    })
    this.commonService.isLoading.subscribe((data: boolean) => {
      this.isLoading = data
    })

    this.countryFound = new FormGroup({
      countryName: new FormControl('', Validators.required),
      countryCurrency: new FormControl({ value: '', disabled: true }),
      countryCallCode: new FormControl({ value: '', disabled: true })
    })

    this.countryFound.get('countryName')?.valueChanges
      .subscribe({
        next: (data: string) => {
          if (this.countryFound.valid) {
            this.countryFound.get('countryCurrency')?.enable()
            this.countryFound.get('countryCallCode')?.enable()
            for (let element of this.dialogRef.config.data.countries) { 
              if (element.name.common.toLowerCase() == data.toLowerCase()) {
                let curr: string = JSON.stringify(element.currencies)
                this.countryCurrencySymbol = element.currencies[curr.slice(2, curr.indexOf(':') - 1)].symbol
                this.countryFound.get('countryCurrency')!.setValue(curr.slice(2, curr.indexOf(':') - 1))
                this.countryFound.get('countryCallCode')!.setValue(element.idd.root + element.idd.suffixes[0])
                this.countryFound.get('countryCurrency')!.updateValueAndValidity()
                this.countryFound.get('countryCallCode')!.updateValueAndValidity()
                this.countryFound.get('countryCurrency')?.disable()
                this.countryFound.get('countryCallCode')?.disable()
                this.countryForm = {
                  name: this.countryFound.get('countryName')!.value.toLowerCase(),
                  currency: this.countryFound.get('countryCurrency')!.value,
                  currency_symbol:this.countryCurrencySymbol,
                  call_code: this.countryFound.get('countryCallCode')!.value,
                  timezone: element.timezones[0],
                  lat_lng: element.latlng,
                  cca2: element.cca2,
                  flagImageUrl: element.flags.png
                }
                this.countrySelected = true
                break
              } else {
                this.countrySelected = false
              }
            }
          } else {
            this.countrySelected = false
            this.countryFound.get('countryCurrency')?.disable()
            this.countryFound.get('countryCallCode')?.disable()
          }
        }
      })
  }

  onSubmit() {
    this.countryService.storeCountry(this.countryForm!).subscribe({
      next: (data: any) => {
        if (data?.body?.message) {
          this.commonService.toast(data.body.message, 'success')
        }
      },
      error: (err) => {
        if (err.status === 409) {
          this.dialogRef.close()
        }
      },
      complete: () => {
        this.dialogRef.close()
      }
    })
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
