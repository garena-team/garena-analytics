
export interface FeedbackData {
    "Display Name": string,
    "Date Created": string,
    "Level ID": string,
    "Profile ID": string,
    "Time": string,
    "Powerup - Undo": {
        "Current Charges": number,
        "Max Charges": number
    },
    "Powerup - Replace": {
        "Current Charges": number,
        "Max Charges": number
    },
    "Powerup - Clear": {
        "Current Charges": number,
        "Max Charges": number
    },
    "id": string
}

export interface ResourceData {
    "Current Charges": number,
    "Max Charges": number,
}

export interface PerLevelData {
    id: string,
    name: string,
    count: number,
    forced: number,
    time: number[],
    userString: string[],
    aveTime: number
}

export interface PerRuleData {
    name: string,
    time: number[],
    aveTime: number
}

export interface PerDateData {
    name: string,
    count: number,
    data: FeedbackData[]
}

export interface LevelData {
    DataIndex: number[][],
    LevelNames: string[],
    LevelIDs: string[],
    LevelGrids: LevelGrid[]
}

export interface LevelGrid {
    Dimensions: number[],
    GridData: string[],
    Rules: string[]
}

export interface IndexedLabel {
    id: number,
    label: string
}