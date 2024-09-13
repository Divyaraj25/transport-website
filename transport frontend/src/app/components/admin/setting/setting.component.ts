import { Component, OnInit } from '@angular/core';
import { MatFormField, MatFormFieldControl, MatFormFieldModule } from '@angular/material/form-field';
import { SharedModule } from '../../../shared/shared.module';
import { AsyncPipe } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, map, startWith } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { SettingService } from '../../../services/setting.service';
import { HttpEventType } from '@angular/common/http';
import { CommonService } from '../../../services/common.service';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';

@Component({
  selector: 'app-setting',
  standalone: true,
  imports: [AsyncPipe, SharedModule, ReactiveFormsModule, NgxMaskDirective, NgxMaskPipe],
  providers: [provideNgxMask()],
  templateUrl: './setting.component.html',
  styleUrl: './setting.component.scss'
})
export class SettingComponent implements OnInit {
  settings!: { _id: string, time: number, stops: number, stripeApiKey: string, stripePrivateKey: string, nodeMailerEmail: string, nodeMailerPassword: string, twilioAccountSid: string, twilioAuthToken: string, twilioPhoneNo: string }
  settingForm!: FormGroup
  timeOptions: string[] = ['10', '20', '30', '45', '60', '90', '120'];
  stopOptions: string[] = ['1', '2', '3', '4', '5'];

  constructor(private settingService: SettingService, private commonService: CommonService) { }

  ngOnInit() {
    this.settingForm = new FormGroup({
      timeControl: new FormControl(null, [Validators.required]),
      stopControl: new FormControl(null, [Validators.required]),
      stripeAPIKey: new FormControl(null, [Validators.required]),
      stripePrivateKey: new FormControl(null, [Validators.required]),
      nodeMailerEmail: new FormControl(null, [Validators.required]),
      nodeMailerPassword: new FormControl(null, [Validators.required]),
      twilioAccountSid: new FormControl(null, [Validators.required]),
      twilioAuthToken: new FormControl(null, [Validators.required]),
      twilioPhoneNo: new FormControl(null, [Validators.required]),
    })

    this.settingService.getSettings().subscribe({
      next: (data: any) => {
        if (data.type === HttpEventType.Response) {
          this.settings = data.body.data
        }
      }, complete: () => {

        this.settingService.setAllValues(this.settings)

        this.settingForm.get('timeControl')?.setValue(this.settings.time.toString())
        this.settingForm.get('stopControl')?.setValue(this.settings.stops.toString())
        this.settingForm.get('stripeAPIKey')?.setValue(this.settings.stripeApiKey)
        this.settingForm.get('stripePrivateKey')?.setValue(this.settings.stripePrivateKey)
        this.settingForm.get('nodeMailerEmail')?.setValue(this.settings.nodeMailerEmail)
        this.settingForm.get('nodeMailerPassword')?.setValue(this.settings.nodeMailerPassword)
        this.settingForm.get('twilioAccountSid')?.setValue(this.settings.twilioAccountSid)
        this.settingForm.get('twilioAuthToken')?.setValue(this.settings.twilioAuthToken)
        this.settingForm.get('twilioPhoneNo')?.setValue(this.settings.twilioPhoneNo)
        this.settingForm.get('timeControl')?.updateValueAndValidity()
        this.settingForm.get('stopControl')?.updateValueAndValidity()
        this.settingForm.get('stripeAPIKey')?.updateValueAndValidity()
        this.settingForm.get('stripePrivateKey')?.updateValueAndValidity()
        this.settingForm.get('nodeMailerEmail')?.updateValueAndValidity()
        this.settingForm.get('nodeMailerPassword')?.updateValueAndValidity()
        this.settingForm.get('twilioAccountSid')?.updateValueAndValidity()
        this.settingForm.get('twilioAuthToken')?.updateValueAndValidity()
        this.settingForm.get('twilioPhoneNo')?.updateValueAndValidity()
      }
    })
    // make get request to settings database
  }

  saveSetting() {
    if (this.settingForm.valid) {
      this.settingService.setSettings(
        this.settings._id,
        this.settingForm.value.timeControl,
        this.settingForm.value.stopControl,
        this.settingForm.value.twilioPhoneNo,
        this.settingForm.value.twilioAccountSid,
        this.settingForm.value.twilioAuthToken,
        this.settingForm.value.stripeAPIKey,
        this.settingForm.value.stripePrivateKey,
        this.settingForm.value.nodeMailerEmail,
        this.settingForm.value.nodeMailerPassword
      ).subscribe({
        next: (data: any) => {
          if (data.type === HttpEventType.Response) {
            this.commonService.toast(data.body.message, 'success')
          }
        }
      })
    } else {
      this.commonService.toast('Please fill all required fields', 'error')
    }
  }
}
