import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { CommonService } from './services/common.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router)
  const commonService = inject(CommonService)
  if(localStorage.getItem('klenTUkn')){
    return true;
  }else{
    router.navigate(['/login'])
    commonService.toast('Please login first', 'warning')
    return false
  }
};