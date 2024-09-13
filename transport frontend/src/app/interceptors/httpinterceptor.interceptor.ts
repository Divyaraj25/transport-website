import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { CommonService } from "../services/common.service";
import { catchError, finalize } from "rxjs";
import { LoginService } from "../services/login.service";
import { MatDialog } from "@angular/material/dialog";
import { ErrorDialogModal } from "../modals/error-modal.component";

export function httpInterceptor(req: HttpRequest<any>, next: HttpHandlerFn) {
    const commonService = inject(CommonService)
    const loginService = inject(LoginService)
    const errorDialog = inject(MatDialog)
    commonService.buffering()

    let token = localStorage.getItem('klenTUkn')
    let reqClone = req.clone({
        headers: token
            ? req.headers.append('authToken', token)
            : req.headers
    })

    return next(reqClone).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 || error.status === 403) {
                loginService.logout()
            }
            if (error.statusText === 'Service Unavailable') {
                errorDialog.open(
                    ErrorDialogModal,
                    {
                        data:
                        {
                            error: 'Network Error',
                            errorMsg: 'Check your Internet Connection and Retry',
                            action: 'Retry'
                        }
                    }
                )
            } else if (error.statusText === 'Gateway Timeout') {
                errorDialog.open(
                    ErrorDialogModal,
                    {
                        data:
                        {
                            error: 'Database Connection Error',
                            errorMsg: 'Please Retry after few seconds',
                            action: 'Okay'
                        }
                    }
                )
            } else if (error.statusText === "Unknown Error") {
                errorDialog.open(
                    ErrorDialogModal,
                    {
                        data:
                        {
                            error: 'Server Error',
                            errorMsg: 'Server is not running, please check after few seconds',
                            action: 'Okay'
                        }
                    }
                )
            } else if (error.statusText === 'Not Found' && !error.error.error) {
                let message = error.url?.slice(21, error.url?.length)
                commonService.toast("404 Not Found (" + message + ")", 'error')
            } else {
                // commonService.toast(error.message, 'error')
                commonService.toast(error.error.message, 'error')
            }
            throw new Error()
        }),
        finalize(() => commonService.bufferdone())
    )
}