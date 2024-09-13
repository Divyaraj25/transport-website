import { Component, OnInit } from "@angular/core";
import { SharedModule } from "../shared/shared.module";
import { ActivatedRoute, Router, RouterModule, RouterStateSnapshot } from "@angular/router";
import { DialogRef } from "@angular/cdk/dialog";
import { MatDialogActions, MatDialogClose, MatDialogContent } from "@angular/material/dialog";

@Component({
    selector: 'error-dialog',
    standalone: true,
    imports: [SharedModule, RouterModule, MatDialogContent, MatDialogActions, MatDialogClose],
    template: `
        <mat-dialog-content>
        <h1 class="text-center">{{errorTitle}}</h1>
        <p>{{errorMsg}}</p>
        </mat-dialog-content>
        <mat-divider></mat-divider>
        <mat-dialog-actions class="d-flex justify-content-center">
        <button mat-raised-button (mousedown)="goto()">{{errorAction}}</button>
        </mat-dialog-actions>
    `
})

export class ErrorDialogModal implements OnInit {
    errorTitle: string = ''
    errorMsg: string = ''
    errorAction: string = ''
    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private dialogRef: DialogRef,
    ) { }
    goto() {
        // this.router.navigateByUrl(this.router.routerState.snapshot.url)
        if (this.dialogRef.config.data.action.toLowerCase() == 'retry') {
            window.location.reload()
        }
        this.dialogRef.close()
    }
    ngOnInit() {
        this.errorTitle = this.dialogRef.config.data.error
        this.errorMsg = this.dialogRef.config.data.errorMsg
        this.errorAction = this.dialogRef.config.data.action
    }
}