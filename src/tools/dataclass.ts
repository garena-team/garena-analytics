export interface FeedbackData {
    "Date Created": Date,
    "Display Name": string,
    "Level ID": string,
    "Powerup - Clear": ResourceData,
    "Powerup - Replace": ResourceData,
    "Powerup - Undo": ResourceData,
    "Profile ID": string,
    "Time": string,
}

export interface ResourceData {
    "Current Charges": number,
    "Max Charges": number,
}

export interface PerLevelData {
    name: number,
    count: number,
    forced: number,
    time: number[],
    aveTime: number
}