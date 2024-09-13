import { Component } from "@angular/core";
import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from "@angular/material/dialog";
import { SharedModule } from "../shared/shared.module";
import { RouterModule } from "@angular/router";
import { DialogRef } from "@angular/cdk/dialog";

@Component({
    selector: 'confirm-modal',
    standalone: true,
    imports: [MatDialogActions, MatDialogClose, MatDialogContent, SharedModule, MatDialogTitle],
    template: `
        <h1 mat-dialog-title>{{ data.title }}?</h1>
        <mat-divider></mat-divider>
        <mat-dialog-content>
        <p>{{ data.content }}</p>
        </mat-dialog-content>
        <mat-divider></mat-divider>
        <mat-dialog-actions class="d-flex justify-content-end">
        <button mat-dialog-close="no" mat-raised-button>No</button>
        <button mat-raised-button color=warn mat-dialog-close="yes">{{ data.action }}</button>
        </mat-dialog-actions>
    `,
    styles: []
})

export class ConfirmModal {
    data: any;
    constructor(private matdialogref: DialogRef) { }
    ngOnInit() {
        this.data = this.matdialogref.config.data
    }
}