import { Component, OnInit, ViewChild } from "@angular/core";
import { SharedModule } from "../shared/shared.module";
import { FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from "@angular/forms";
import { DialogRef } from "@angular/cdk/dialog";
import { VehicleType } from "../interfaces/vehicle-type.interface";
import { MatDialogActions, MatDialogClose, MatDialogContent } from "@angular/material/dialog";

@Component({
    selector: 'app-service-type-modal',
    standalone: true,
    imports: [SharedModule, ReactiveFormsModule, MatDialogContent, MatDialogActions, MatDialogClose],
    template: `
    <section class="m-3" style="width: 300px">
    <section class="d-flex justify-content-between align-items-center">
        <h1 mat-dialog-title>
            {{ data.title }}
        </h1>
        <button mat-dialog-close="no" mat-icon-button>
            <mat-icon> close </mat-icon>
        </button>
    </section>
    <mat-divider></mat-divider>
    <mat-dialog-content>
        <form [formGroup]="add">
            <mat-form-field class="w-100">
                <mat-label>
                    Service Type
                </mat-label>
                <mat-select formControlName="service_type" name="service_type">
                    @for(service of serviceTypes;track service._id){
                        <mat-option value="{{service.vehicle_type}}" (mousedown)=selectedType(service)>
                            {{service.vehicle_type}}
                        </mat-option>
                    }
                </mat-select>
            </mat-form-field>
        </form>
    </mat-dialog-content>
    <mat-divider></mat-divider>
    <mat-dialog-actions class="d-flex justify-content-end">
        <button mat-raised-button [mat-dialog-close]="selectedServiceType" [disabled]="add.untouched">{{ data.action }}</button>
    </mat-dialog-actions>
    </section>
    `,
    styles: []
})

export class ServiceTypeModalComponent implements OnInit {
    add!: FormGroup
    data!: any
    serviceTypes: VehicleType[] = []
    selectedServiceType!: any
    constructor(private dialogRef: DialogRef) { }

    ngOnInit() {
        this.add = new FormGroup({
            service_type: new FormControl(null, [Validators.required])
        })
        this.data = this.dialogRef.config.data
        this.serviceTypes.push({
            _id: 'none',
            vehicle_type: 'none',
            vehicle_image: 'none'
        })
        this.data.content.forEach((element: any) => {
            this.serviceTypes.push(element)
        })
        this.add.get('service_type')?.setValue(this.data.selected)
        this.add.get('service_type')?.updateValueAndValidity()
    }

    selectedType(service: VehicleType | string) {
        this.selectedServiceType = service
    }
}