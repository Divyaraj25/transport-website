import { HttpClient, HttpEventType } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subject } from 'rxjs';
import { CountryService } from './services/country.service';
import { SettingService } from './services/setting.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent{
  title = 'transport-frontend';
  constructor(private country:CountryService,private settingService:SettingService){}
  ngOnInit(){
    this.settingService.getSettings().subscribe({
      next:(data:any)=>{
        if(data.type===HttpEventType.Response){
          this.settingService.setAllValues(data.body.data)
        }
      }
    })
  }
}
