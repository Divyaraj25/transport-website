export interface Country {
    _id?: string
    flagImageUrl?: string
    name: string
    currency?: string
    currency_symbol?: string
    call_code?: string
    timezone?: string
    lat_lng: number[]
    cca2?: string
}