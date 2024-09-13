import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideNgxStripe } from 'ngx-stripe';
import { environment } from '../environments/env.prod';
import { provideToastr } from 'ngx-toastr';
import { httpInterceptor } from './interceptors/httpinterceptor.interceptor';
import { provideServiceWorker } from '@angular/service-worker';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';

export const appConfig: ApplicationConfig = {
    providers: [
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        provideRouter(routes),
        provideAnimationsAsync(),
        provideHttpClient(withInterceptors([httpInterceptor])),
        provideToastr(),
        provideNgxStripe(environment.STRIPE_PUBLISHABLE_KEY),
        provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
        }),
    ]
};
