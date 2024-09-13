import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'dateToTimeString',
    standalone: true
})
export class DateToTimePipe implements PipeTransform {
    transform(value: Date | string): string {
        const date = new Date(value);
        const hours = date.getHours();

        if (hours >= 6 && hours < 12) {
            return 'Morning';
        } else if (hours >= 12 && hours < 17) {
            return 'Afternoon';
        } else if (hours >= 17 && hours < 20) {
            return 'Evening';
        } else {
            return 'Night';
        }
    }
}