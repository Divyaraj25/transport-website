export interface Ride {
    _id?: string
    requestId: string
    userUID: string
    profile?: string
    username: string
    email?: string
    phone_no?: string
    country?: string
    city?: string
    payment_method?: string
    custId?: string
    cardId?: string
    vehicle_type: string
    vehicle_image?: string
    base_prize?: number
    prize_per_distance?: number
    prize_per_time?: number
    min_fare?: number
    total_fare?: number
    source: string
    destination: string
    stops?: string[]
    stopNumber?: number
    sourceLatLng?: number[]
    destinationLatLng?: number[]
    stopsLatLng?: [number[]] | any[]
    dateTime: Date | string
    time?: string
    distance?: string
    status?: string
    driverUsername?: string | null
    driver?: [{ _id?: string, username?: string }] | []
    driverId?: string
    assigned?: boolean
    assignedAt?:Date
    seconds?: number
    accepted?: boolean
    button?: string
    hold?:string
    nextStatus?:string
    previousStatus?:string
}