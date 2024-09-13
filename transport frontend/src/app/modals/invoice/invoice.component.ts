import { Component } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { MatDialogClose, MatDialogActions, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { DialogRef } from '@angular/cdk/dialog';
import { CountryService } from '../../services/country.service';
import { HttpEventType } from '@angular/common/http';
import { NgbRatingModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [SharedModule, FormsModule, MatDialogClose, MatDialogActions, MatDialogContent, MatDialogTitle, NgbRatingModule],
  templateUrl: './invoice.component.html',
  styleUrl: './invoice.component.scss'
})
export class InvoiceComponent {
  rating: number = 0
  data!: any
  currency!: string
  constructor(private matdialogref: DialogRef, private countryService: CountryService) { }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.data = this.matdialogref.config.data
    this.countryService.getCountryCurrencySymbol(this.data.content.country).subscribe({
      next: (data: any) => {
        if (data.type === HttpEventType.Response) {
          this.currency = data.body.data[0].currency_symbol
        }
      }
    })
  }
}
