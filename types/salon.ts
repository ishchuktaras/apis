export interface Service {
  id: string
  title: string
  price: number
  duration_minutes: number
  description?: string
}

export interface Profile {
  id: string
  salon_name: string
  description: string
  address: string
  phone: string
  logo_url: string | null
}

export interface BusinessHour {
  day_of_week: number
  open_time: string
  close_time: string
  is_closed: boolean
}

export interface BookingSlot {
  start_time: string
}

export interface ClientInfo {
  name: string
  email: string
  phone: string
}