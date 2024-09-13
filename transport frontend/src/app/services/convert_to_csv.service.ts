import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})

export class ConvertToCsvService {

    constructor() { }

    convertToCSV(objArray: any[] | string) {
        var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
        var str = '';

        for (var i = 0; i < array.length; i++) {
            var line = '';
            for (var index in array[i]) {
                if (line != '') line += ','

                line += array[i][index];
            }

            str += line + '\r\n';
        }

        return str;
    }

    exportCSVFile(headers: any, items: any, fileTitle: string) {
        if (headers) {
            items.unshift(headers);
        }

        // convert object to json
        var jsonObject = JSON.stringify(items);
        var csv = this.convertToCSV(jsonObject);
        var exportedFilenmae = fileTitle + '.csv' || 'export.csv';

        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        
        var link = document.createElement("a");
        if(link.download !== undefined){
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", exportedFilenmae);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}