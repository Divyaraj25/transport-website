import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { CommonService } from '../../services/common.service';
import { LoginService } from '../../services/login.service';
import { HttpResponse } from '../../interfaces/httpResponse.interface';
import { HttpEvent, HttpResponseBase } from '@angular/common/http';
import { Router } from '@angular/router';
import { SwPush } from '@angular/service-worker';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, SharedModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isDark: boolean = false;
  isLoading: boolean = false;

  constructor(
    private commonService: CommonService,
    private cdr: ChangeDetectorRef,
    private loginService: LoginService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      email: new FormControl(null, [Validators.required, Validators.email]),
      password: new FormControl(null, Validators.required)
    })
    this.commonService.isLoading.subscribe((data: boolean) => {
      this.isLoading = data
      this.cdr.detectChanges()
    })
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.loginService.login(this.loginForm.value.email, this.loginForm.value.password)
    }
  }
}
