export interface City{
    _id?: string
    city:string
    country?:string
    zone?:{_id:string,type:string,coordinates:[[]]}
    cca2?:string
}