import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { MatDialog } from '@angular/material/dialog';
import { AddCountryComponent } from '../../../../modals/add-country/add-country.component';
import { HttpClient } from '@angular/common/http';
import { CountryService } from '../../../../services/country.service';
import { Country } from '../../../../interfaces/country.interface';
import { CommonService } from '../../../../services/common.service';

@Component({
  selector: 'app-country',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './country.component.html',
  styleUrl: './country.component.scss'
})
export class CountryComponent implements OnInit{
  countries: Country[] = [];
  search: boolean = false
  restCountries: { name: string }[] = [];
  constructor(
    private addCountry: MatDialog,
    private http: HttpClient,
    private countryService: CountryService,
    private commonService: CommonService
  ) { }
  ngOnInit() {
    this.http.get('https://restcountries.com/v3.1/all').subscribe({
      next: (data: any) => {
        this.restCountries = data
      }
    })
    this.countryService.getCountries().subscribe({
      next: (data: any) => {
        if (data?.body?.data) {
          if (data.body.data!.length > 0) {
            this.commonService.toast(data.body.message, 'success')
            this.countries = data.body.data
          } else {
            this.commonService.toast(data.body.message, 'info')
          }
        }
      }
    })
  }

  onAddCountry() {
    let dialogRef = this.addCountry.open(AddCountryComponent, {
      data: { countries: this.restCountries }
    })
    dialogRef.afterClosed().subscribe({
      next:(result:any)=>{
        if(result !== 'cancel'){
          this.countryService.getCountries().subscribe({
            next:(data:any)=>{
              if(data?.body?.data){
                this.countries = data.body.data
              }
            }
          })
        }
      }})
  }

  onSearch(country: string) {
    if (country === '') {
      if (this.search) {
        this.countryService.getCountries().subscribe({
          next: (data: any) => {
            if (data.body.data.length > 0) {
              this.countries = data.body.data
            }
          },
          complete: () => {
            this.search = false
          }
        })
      }
    } else {
      this.countryService.searchCountry(country).subscribe({
        next: (data: any) => {
          if (data.body.data.length > 0) {
            this.countries = data.body.data
          } else {
            this.countries = []
          }
        },
        complete: () => {
          this.search = true
        }
      })
    }
  }
}
