export interface FeedbackData {
    "name": string,
    "fields": {
        "Date Created": {
            "timestampValue": string
        },
        "Time": {
            "stringValue": string
        },
        "Powerup - Undo": {
            "mapValue": {
                "fields": {
                    "Current Charges": {
                        "integerValue": string
                    },
                    "Max Charges": {
                        "integerValue": string
                    }
                }
            }
        },
        "Display Name": {
            "stringValue": string
        },
        "Powerup - Replace": {
            "mapValue": {
                "fields": {
                    "Current Charges": {
                        "integerValue": string
                    },
                    "Max Charges": {
                        "integerValue": string
                    }
                }
            }
        },
        "Level ID": {
            "stringValue": string
        },
        "Profile ID": {
            "stringValue": string
        },
        "Powerup - Clear": {
            "mapValue": {
                "fields": {
                    "Current Charges": {
                        "integerValue": string
                    },
                    "Max Charges": {
                        "integerValue": string
                    }
                }
            }
        }
    },
    "createTime": string,
    "updateTime": string
}

export interface ResourceData {
    "Current Charges": number,
    "Max Charges": number,
}

export interface PerLevelData {
    name: string,
    count: number,
    forced: number,
    time: number[],
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