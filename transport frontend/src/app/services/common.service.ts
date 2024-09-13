import { HttpClient } from "@angular/common/http";
import { Injectable, signal } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { BehaviorSubject, Subject } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class CommonService {
    isLoading = new BehaviorSubject<boolean>(false)
    batch = signal(0)
    updateBatch = new BehaviorSubject(this.batch())
    isDarkMode = new BehaviorSubject<boolean>(localStorage.getItem("theme") === 'dark')
    constructor(private http: HttpClient, private toastr: ToastrService) { }
    buffering() {
        this.isLoading.next(true)
    }
    bufferdone() {
        this.isLoading.next(false)
    }
    increaseBatch() {
        this.batch.update(val => val + 1)
        this.updateBatch.next(this.batch())
    }
    decreaseBatch() {
        if(this.batch() < 1){
            this.batch.set(0)
        }else{
            this.batch.update(val => val - 1)
        }
        this.updateBatch.next(this.batch())
    }
    getBatch(){
        return this.batch()
    }
    darkModeToggle() {
        let theme = localStorage.getItem("theme")
        if (theme === 'light') {
            this.isDarkMode.next(true)
            localStorage.setItem("theme", 'dark')
        } else if (theme === 'dark') {
            this.isDarkMode.next(false)
            localStorage.setItem("theme", 'light')
        }
    }
    toast(message: string, type: string) {
        if (type === 'success') {
            this.toastr.success(message, "", {
                timeOut: 3500,
                progressBar: true,
                progressAnimation: 'decreasing',
                positionClass: 'toast-top-right'
            });
        } else if (type === 'error') {
            this.toastr.error(message, "", {
                timeOut: 3500,
                progressBar: true,
                progressAnimation: 'decreasing',
                positionClass: 'toast-top-right'
            });
        } else if (type === 'warning') {
            this.toastr.warning(message, "", {
                timeOut: 3500,
                progressBar: true,
                progressAnimation: 'decreasing',
                positionClass: 'toast-top-right'
            });
        } else if (type === 'info') {
            this.toastr.info(message, "", {
                timeOut: 3500,
                progressBar: true,
                progressAnimation: 'decreasing',
                positionClass: 'toast-top-right'
            });
        }

    }
}