import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VehicleType } from '../../../../interfaces/vehicle-type.interface';
import { CommonService } from '../../../../services/common.service';
import { VehicleTypeService } from '../../../../services/vehicle-type.service';

@Component({
  selector: 'app-vehicle-type',
  standalone: true,
  imports: [MatFormFieldModule, SharedModule, ReactiveFormsModule],
  templateUrl: './vehicle-type.component.html',
  styleUrl: './vehicle-type.component.scss'
})
export class VehicleTypeComponent implements OnInit{
  editMode: boolean = false;
  formData: FormData = new FormData()
  vehicleForm!: FormGroup
  editIndex!: VehicleType | undefined
  vehicles: VehicleType[] = []
  previewImage: string = 'assets/cars/dummy_car.png'
  imageName!: string | null | undefined

  constructor(private commonService: CommonService, private vehicleService: VehicleTypeService) { }

  ngOnInit() {
    this.vehicleService.getVehicles().subscribe({
      next: (data: any) => {
        if (data?.body?.data) {
          if (data.body.data!.length > 0) {
            this.commonService.toast(data.body.message, 'success')
            this.vehicles = data.body.data
          } else {
            this.commonService.toast(data.body.message, 'info')
          }
        }
      }
    })

    this.vehicleForm = new FormGroup({
      vehicle_type: new FormControl(null, Validators.required),
      vehicle_image: new FormControl(null)
    })
  }

  onSubmit() {
    if (this.editMode) {
      this.onEditSubmit()
    } else {
      this.onAddSubmit()
    }
  }

  onEditSubmit() {
    if (this.vehicleForm.valid) {
      if (!this.formData.has('vehicle_type')) {
        this.formData.append('vehicle_type', this.vehicleForm.get('vehicle_type')?.value.toLowerCase())
      } else {
        this.formData.set('vehicle_type', this.vehicleForm.get('vehicle_type')?.value.toLowerCase())
      }
      this.vehicleService.editVehicle(
        this.editIndex?._id!,
        this.formData).subscribe({
          next: (data: any) => {
            this.commonService.toast(data.body.message, 'success')
          },
          complete: () => {
            this.reset()
          }
        })
    } else {
      this.vehicleForm.get('vehicle_type')?.markAsTouched()
    }
  }

  onAddSubmit() {
    if (this.vehicleForm.valid) {
      if (!this.formData.has('vehicle_type')) {
        this.formData.append('vehicle_type', this.vehicleForm.get('vehicle_type')?.value.toLowerCase())
      } else {
        this.formData.set('vehicle_type', this.vehicleForm.get('vehicle_type')?.value.toLowerCase())
      }
      this.vehicleService.storeVehicle(this.formData).subscribe({
        next: (data: any) => {
          this.commonService.toast(data.body.message, 'success')
        },
        complete: () => {
          this.reset()
        }
      })
    } else {
      this.vehicleForm.get('vehicle_type')?.markAsTouched()
    }
  }

  onImageChange(event: any) {
    this.commonService.buffering()
    if (event.target.files[0].size < 500 * 1024) {
      this.commonService.bufferdone()
      this.imageName = event.target.files[0].name
      if(this.formData.has('vehicle_image')){
        this.formData.set('vehicle_image', event.target.files[0], event.target.files[0].name)
      }else{
        this.formData.append('vehicle_image', event.target.files[0], event.target.files[0].name)
      }
      let reader = new FileReader();
      reader.readAsDataURL(event.target.files[0] as Blob);
      reader.onload = (event) => {
        this.previewImage = event.target!.result as string;
      };
      this.changingImage()
    } else {
      this.commonService.bufferdone()
      this.imageName = null
      this.defaultImage()
      this.commonService.toast('Image size should be less than 500KB', 'warning')
    }
  }

  onEdit(vehicle: VehicleType) {
    this.editMode = true
    this.editIndex = vehicle
    this.vehicleForm.get('vehicle_type')?.setValue(vehicle.vehicle_type)
    this.vehicleForm.get('vehicle_type')?.updateValueAndValidity()
    this.imageName = vehicle.vehicle_image
    if (vehicle.vehicle_image && this.editMode) {
      this.formData.append('old_image', vehicle.vehicle_image)
      this.previewImage = 'http://16.170.146.16:5000/images/vehicles/' + vehicle.vehicle_image
      this.changingImage()
    }
  }

  onClear() {
    this.formData.append('clear', 'true')
    this.vehicleForm.reset()
    this.defaultImage()
    this.imageName = null
  }

  defaultImage() {
    const img_view = document.getElementById('img-view');
    const img_preview = document.getElementById('image-preview');
    img_view!.style.border = '2px dashed #ccc';
    img_view!.style.background = '#f7f8ff';
    img_preview!.style.width = '200px';
    img_preview!.style.height = '200px';
    img_preview!.style.marginTop = '25px';
    this.previewImage = 'assets/cars/dummy_car.png'
  }

  changingImage() {
    const img_view = document.getElementById('img-view');
    const img_preview = document.getElementById('image-preview');
    img_view!.style.border = '0px';
    img_view!.style.background = 'none';
    img_preview!.style.width = '190px';
    img_preview!.style.height = '300px';
    img_preview!.style.marginTop = '0px';
  }

  reset() {
    if (this.editMode) {
      this.editMode = false
    }
    this.vehicleForm.reset()
    this.defaultImage()
    this.imageName = null
    this.formData = new FormData()
    this.vehicleForm.get('vehicle_type')?.markAsUntouched()

    this.vehicleService.getVehicles().subscribe({
      next: (data: any) => {
        if (data?.body?.data) {
          this.vehicles = data.body.data
        }
      }
    })
  }
}
