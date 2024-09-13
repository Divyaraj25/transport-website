import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { BufferComponent } from './components/buffer/buffer.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', title: 'login', component: LoginComponent },
    {
        path: 'admin',
        loadComponent: () => import('./components/admin/header/header.component').then(m => m.HeaderComponent),
        canActivate: [authGuard],
        canActivateChild: [authGuard],
        children: [
            {
                path: '',
                title: 'Dashboard',
                pathMatch: 'full',
                loadComponent: () => import('./components/admin/welcome/welcome.component').then(m => m.WelcomeComponent)
            },
            {
                path: 'rides/create',
                title: 'Create Ride',
                loadComponent: () => import('./components/admin/rides/create/create.component').then(m => m.CreateComponent)
            },
            {
                path: 'rides/confirm',
                title: 'Confirm Ride',
                loadComponent: () => import('./components/admin/rides/confirm/confirm.component').then(m => m.ConfirmComponent)
            },
            {
                path: 'rides/history',
                title: 'Ride History',
                loadComponent: () => import('./components/admin/rides/history/history.component').then(m => m.HistoryComponent)
            },
            {
                path: 'users',
                title: 'Users',
                loadComponent: () => import('./components/admin/users/users.component').then(m => m.UsersComponent)
            },
            {
                path: 'drivers/list',
                title: 'Drivers List',
                loadComponent: () => import('./components/admin/driver/driver-list/driver-list.component').then(m => m.DriverListComponent)
            },
            {
                path: 'drivers/running-request',
                title: 'Running Request',
                loadComponent: () => import('./components/admin/driver/running-request/running-request.component').then(m => m.RunningRequestComponent)
            },
            {
                path: 'pricing/city',
                title: 'City',
                loadComponent: () => import('./components/admin/pricing/city/city.component').then(m => m.CityComponent)
            },
            {
                path: 'pricing/country',
                title: 'Country',
                loadComponent: () => import('./components/admin/pricing/country/country.component').then(m => m.CountryComponent)
            },
            {
                path: 'pricing/vehicle-type',
                title: 'Vehicle Type',
                loadComponent: () => import('./components/admin/pricing/vehicle-type/vehicle-type.component').then(m => m.VehicleTypeComponent)
            },
            {
                path: 'pricing/vehicle-pricing',
                title: 'Vehicle Pricing',
                loadComponent: () => import('./components/admin/pricing/vehicle-pricing/vehicle-pricing.component').then(m => m.VehiclePricingComponent)
            },
            {
                path: 'setting',
                title: 'Setting',
                loadComponent: () => import('./components/admin/setting/setting.component').then(m => m.SettingComponent)
            },
        ]
    },
    { path: '**', title: 'Error 404', loadComponent: () => import('../app/components/error/error.component').then(m => m.ErrorComponent) }
];
