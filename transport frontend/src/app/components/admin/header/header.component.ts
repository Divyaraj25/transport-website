import { ChangeDetectorRef, Component, DoCheck, OnInit, computed, signal } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { Header } from '../../../interfaces/header.interface';
import { CommonService } from '../../../services/common.service';
import { BnNgIdleService } from 'bn-ng-idle';
import { LoginService } from '../../../services/login.service';
import { FormsModule } from '@angular/forms';
import { MainSocketService } from '../../../socket/main-socket.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterOutlet, SharedModule, RouterModule, FormsModule],
  providers: [BnNgIdleService],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, DoCheck {
  isLoading: boolean = false;
  batchValue: number = 0;
  current!: string
  isDark: boolean = true;
  notificationColor: string = '';
  menuItems = signal<Header[]>([
    {
      icon: 'explore_nearby',
      title: 'Create Ride',
      link: 'admin/rides/create'
    },
    {
      icon: 'task_alt',
      title: 'Confirm Ride',
      link: 'admin/rides/confirm'
    },
    {
      icon: 'history',
      title: 'Ride History',
      link: 'admin/rides/history',
      section: true
    },
    {
      icon: 'person',
      title: 'Users',
      link: 'admin/users',
      section: true
    },
    {
      icon: 'recent_actors',
      title: 'Drivers List',
      link: 'admin/drivers/list'
    },
    {
      icon: 'restart_alt',
      title: 'Running Request',
      link: 'admin/drivers/running-request',
      section: true
    },
    {
      icon: 'location_city',
      title: 'City',
      link: 'admin/pricing/city'
    },
    {
      icon: 'flag_circle',
      title: 'Country',
      link: 'admin/pricing/country'
    },
    {
      icon: 'directions_car',
      title: 'Vehicle Type',
      link: 'admin/pricing/vehicle-type'
    },
    {
      icon: 'print',
      title: 'Vehicle Pricing',
      link: 'admin/pricing/vehicle-pricing',
      section: true
    },
    {
      icon: 'settings',
      title: 'Setting',
      link: 'admin/setting',
      section: true
    }
  ]);
  collapsed = signal<boolean>(false);
  computedSidenav = computed(() => this.collapsed() ? '250px' : '65px');
  constructor(
    private commonService: CommonService,
    private cdr: ChangeDetectorRef,
    private idle: BnNgIdleService,
    private loginService: LoginService,
    private socketService: MainSocketService
  ) { }

  ngOnInit() {

    this.commonService.updateBatch.subscribe({
      next: (data: number) => {
        this.batchValue = data
      }
    })

    this.commonService.isDarkMode.subscribe({
      next: (data: boolean) => {
        this.isDark = data
      }
    })
    this.idle.startWatching(1200).subscribe((isTimeOut: boolean) => {
      if (isTimeOut) {
        this.loginService.logout()
      }
    })
    this.commonService.isLoading.subscribe((data) => {
      this.isLoading = data
      this.cdr.detectChanges()
    })
  }

  ngDoCheck(): void {
    this.current = window.location.pathname
    this.current = this.current.replaceAll('/', ' > ')
    this.current = this.current.replaceAll('-', ' ')
    this.current = this.current.slice(9, this.current.length)
  }

  capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  logout() {
    this.loginService.logout()
  }

  onToggleChange() {
    this.commonService.darkModeToggle()
  }
}
