
export interface User {
    id: string,
    account_id: string,
    full_name: string,
    avatar_url: string,
    phone: string,
    created_at?: Date,
    updated_at?: Date
}

export interface Account {
    id?: string,
    username: string,
    password?: string,
    email: string
}

export interface Profile {
    user_id?: string,
    full_name?: string,
    avatar_url?: string,
    phone?: string,
    username?: string,
    email: string,
    bio?: string,
    is_shared_location?: boolean,
    is_safe?: boolean,
    latitude?: string,
    longtitude?: string,
    travel_preference?: string[],
    emergency_contacts?: string[]
}