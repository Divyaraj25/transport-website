export interface VehicleType{
    _id?:string
    vehicle_type:string
    vehicle_image?:string | null
    basePrize?:number
    prizePerDistance?:number
    prizePerTime?:number
    min_fare?:number
    totalPrize?:number
}