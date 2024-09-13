export interface Pricing{
    _id?: number
    vehicle_image?: string
    vehicle_type?: string
    country?: string
    city?: string
    driver_profit?: number
    min_fare?: number
    distance_base_prize?: number
    base_prize?: number
    prize_per_distance?: number
    prize_per_time?: number
    max_space?: number
}