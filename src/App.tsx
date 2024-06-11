import React, { PureComponent, useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { db } from './tools/firebase'

import { collection, getDocs } from "firebase/firestore";
import { FeedbackData, IndexedLabel, LevelData, PerDateData, PerLevelData, PerRuleData } from './tools/dataclass';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import leveldatas1 from './data/build 1/leveldata.json';
import leveldatas2 from './data/build 2/leveldata.json';
import tempfeedbackdata from './data/tempfeedbackdata.json';
// LATEST: https://firestore.googleapis.com/v1/projects/rule-puzzle/databases/(default)/documents/feedback?pageToken=AFTOeJx4j5DVwWGecIAwrzA2HMJojFmZyL8kzysdm0B_p7qU4AVbrRAgWlpyOfQDB92CzD75PEkIk7blyHds21mpMqeoVDKjKNB4Ca3rR4EHqUs8vQt_fH3_gnnzeZwCJBC5

function parseTimeSpanString(timeSpanString: string) {
    // Split the string by ':' to get hours, minutes, seconds, and milliseconds
    var parts = timeSpanString.split(':');

    // Extract hours, minutes, seconds, and milliseconds from parts array
    var hours = parseInt(parts[0]);
    var minutes = parseInt(parts[1]);
    var seconds = parseInt(parts[2].split('.')[0]); // Extract seconds
    var milliseconds = parseInt("0." + parts[2].split('.')[1]); // Extract milliseconds
    //console.log(timeSpanString + " converted to " + hours + "h " + minutes + "m " + seconds + "s " + milliseconds);

    // Calculate total milliseconds
    var totalSeconds = (hours * 3600 + minutes * 60 + seconds) + milliseconds;

    return totalSeconds;
}

const LEVEL_DATA: LevelData = {
    DataIndex: [],
    LevelNames: [],
    LevelIDs: [],
    LevelGrids: []
}
const imported_level_data: any[] = [{
        data: leveldatas1,
        cutoff_date: new Date('May 14, 2024'),
    }, {
        data: leveldatas2,
        cutoff_date: new Date('May 24, 2024'),
    }, {
        data: leveldatas2,
        cutoff_date: new Date(),
    }]
imported_level_data.forEach((imported_data, idx) => {
    let data: LevelData = imported_data.data;
    for (var i = 0; i < data.LevelIDs.length; i++) {
        LEVEL_DATA.DataIndex.push([idx]);
    }
    LEVEL_DATA.LevelNames.push(...data.LevelNames);
    LEVEL_DATA.LevelIDs.push(...data.LevelIDs);
    LEVEL_DATA.LevelGrids.push(...data.LevelGrids);
})
let toRemoveIDs: number[] = [];
LEVEL_DATA.LevelIDs.forEach((val, idx, self) => {
    if (self.indexOf(val) === idx) {
        return true;
    } else {
        LEVEL_DATA.DataIndex[self.indexOf(val)].push(...LEVEL_DATA.DataIndex[idx])
        toRemoveIDs.push(idx)
        return false;
    }
});
for (var i = toRemoveIDs.length - 1; i >= 0; i--) {
    let val = toRemoveIDs[i];
    LEVEL_DATA.DataIndex.splice(val, 1);
    LEVEL_DATA.LevelNames.splice(val, 1);
    LEVEL_DATA.LevelIDs.splice(val, 1);
    LEVEL_DATA.LevelGrids.splice(val, 1);
}

function App() {
    const [currentWindow, setCurrentWindow] = useState<"PLAY_PER_LEVEL" | "TIME_PER_LEVEL" | "TIME_PER_RULE" | "FEEDBACK_PER_DATE">("PLAY_PER_LEVEL")
    const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([])

    const [perLevelData, setPerLevelData] = useState<PerLevelData[]>([])
    const [perRuleData, setPerRuleData] = useState<PerRuleData[]>([])
    const [perDateData, setPerDateData] = useState<PerDateData[]>([])

    const [clickedDisplayElement, setClickedDisplayElement] = useState<any>(null)
    const [hoverDisplayElement, setHoverDisplayElement] = useState<any>(null)
    const [isDataFiltered, setIsDataFiltered] = useState<boolean>(true)
    //const [isRefreshing, setIsRefreshing] = useState<boolean>(true)
    const [dataVersion, setDataVersion] = useState<number>(0)

    const [modalElement, setModalElement] = useState<any>(null)

    const getLevelData = () => {
        return LEVEL_DATA;
    }

    const getFeedbackData = () => {
        //if (dataVersion === "Build 1") {
        //    return tempfeedbackdata["documents"].filter(el => new Date(el.fields['Date Created'].timestampValue) < BUILD_1_TIME);
        //} else if (dataVersion === "Build 2") {
        //    return tempfeedbackdata["documents"].filter(el => new Date(el.fields['Date Created'].timestampValue) < BUILD_2_TIME);
        //}
        //return tempfeedbackdata["documents"].filter(el => new Date(el.fields['Date Created'].timestampValue) < BUILD_1_TIME);
        return tempfeedbackdata;
    }

    //useEffect(() => {
    //    if (isRefreshing) {
    //        getDocs(collection(db, "feedback")).then((docs) => {
    //            let feedback: FeedbackData[] = []
    //            docs.forEach((doc) => {
    //                console.log(`${doc.id} => ${doc.data() as FeedbackData}`);
    //                feedback.push(doc.data() as FeedbackData)
    //            })
    //            console.log(JSON.stringify(feedback))
    //            setFeedbacks(feedback);
    //        })
    //    }
    //}, [isRefreshing])

    useEffect(() => {
        let anydata: any = getFeedbackData();
        let feedback: FeedbackData[] = anydata;

        //getDocs(collection(db, "feedback")).then((docs) => {
        //    let feedback: FeedbackData[] = []
        //    docs.forEach((doc) => {
        //        console.log(`${doc.id} => ${doc.data() as FeedbackData}`);
        //        feedback.push(doc.data() as FeedbackData)
        //    })
        //    console.log(JSON.stringify(feedback))
        //    setFeedbacks(feedback);
        //})

        let START_DATE = new Date("January 1, 2024");
        let END_DATE = imported_level_data[dataVersion].cutoff_date;
        if (dataVersion !== 0) {
            START_DATE = imported_level_data[dataVersion - 1].cutoff_date;
        }

        feedback = feedback.map((val) => {
            val['Level ID'] = getLevelData().LevelIDs[getLevelData().LevelIDs.indexOf(val['Level ID'])];
            return { ...val }
        })
        if (isDataFiltered) {
            // filter invalid times
            feedback = feedback.filter((val) => {
                if (parseTimeSpanString(val.Time) > 60 * 60) {
                    return false
                }
                if (val['Display Name'] === "DEVELOPER") {
                    return false
                }
                return true;
            })
        }
        feedback = feedback.filter((val) => {
            let idx = LEVEL_DATA.LevelIDs.indexOf(val['Level ID']);
            if (new Date(val['Date Created']) < START_DATE) {
                return false;
            }
            if (new Date(val['Date Created']) > END_DATE) {
                return false;
            }
            if (idx === -1) {
                return false;
            }
            return LEVEL_DATA.DataIndex[idx].indexOf(dataVersion) !== -1;
        })
        setFeedbacks(feedback);
    }, [isDataFiltered, dataVersion])

    useEffect(() => {
        const leveldata: { [LevelID: string]: FeedbackData[] } = {}
        feedbacks.forEach((feedback) => {
            if (!(feedback['Level ID'] in leveldata)) {
                leveldata[feedback['Level ID']] = []
            }
            leveldata[feedback['Level ID']].push(feedback);
        })
        let perLevelData: PerLevelData[] = []
        let perRuleData: { [id: string]: PerRuleData } = {}
        let perDateData: { [date: number]: PerDateData } = {}
        getLevelData().LevelIDs.forEach((levelString, idx) => {
            let lidx = LEVEL_DATA.LevelIDs.indexOf(levelString);
            if (levelString in leveldata) {
                let times: number[] = []
                let userString: string[] = []
                let aveTime = 0;
                let aveCount = 0;
                leveldata[levelString].forEach((val) => {
                    if (val['Display Name'].startsWith("[FORCED]")) {
                        return
                    }
                    let time = parseTimeSpanString(val.Time);
                    aveTime += time
                    aveCount += 1
                    times.push(time)
                    userString.push(val['Profile ID'])
                    getLevelData().LevelGrids[lidx].Rules.forEach((rule) => {
                        if (rule in perRuleData) {
                            perRuleData[rule].time.push(time);
                        } else {
                            perRuleData[rule] = { name: rule, time: [time], aveTime: 0 }
                        }
                    })
                    let d = new Date(val['Date Created']);
                    d.setHours(0, 0, 0, 0);
                    let date = d.getTime();
                    if (date in perDateData) {
                        perDateData[date].count++;
                        perDateData[date].data.push(val);
                    } else {
                        perDateData[date] = { name: d.toDateString(), count: 1, data: [val] }
                    }
                })

                let forced = 0;
                let notForced = 0;
                leveldata[levelString].forEach((val) => {
                    if (val['Display Name'].startsWith("[FORCED]")) {
                        forced++;
                    } else {
                        notForced++;
                    }
                })

                if (aveCount !== 0) {
                    aveTime /= aveCount
                }
                perLevelData.push({ id: levelString, name: LEVEL_DATA.LevelNames[lidx], count: notForced, forced: forced, time: times, aveTime: aveTime, userString: userString })
            }
        });
        Object.keys(perRuleData).forEach((key) => {
            let aveTime = 0;
            perRuleData[key].time.forEach((val) => {
                aveTime += val;
            })
            aveTime /= perRuleData[key].time.length;
            perRuleData[key].aveTime = aveTime;
        })
        setPerLevelData(perLevelData);
        setPerRuleData(Object.values(perRuleData));
        setPerDateData(Object.values(perDateData));
    }, [feedbacks])

    const SetClickedDisplayElement = (payload: IndexedLabel) => {
        if ((payload.id === 0) && (payload.label === "")) {
            return;
        }
        let trackeddata = perLevelData[payload.id]
        let lidx = 0;
        for (var i = 0; i < getLevelData().LevelIDs.length; i++) {
            if (getLevelData().LevelIDs[i] === trackeddata.id) {
                lidx = i;
                break;
            }
        }
        let data = getCurrentLevelData(payload.label, payload.id, lidx);
        if (clickedDisplayElement === data) {
            setClickedDisplayElement(null)
        } else {
            setClickedDisplayElement(data)
        }
    }

    const SetHoverDisplayElement = (payload: IndexedLabel) => {
        if ((payload.id === 0) && (payload.label === "")) {
            return;
        }
        let trackeddata = perLevelData[payload.id]
        let lidx = 0;
        for (var i = 0; i < getLevelData().LevelIDs.length; i++) {
            if (getLevelData().LevelIDs[i] === trackeddata.id) {
                lidx = i;
                break;
            }
        }
        let data = getCurrentLevelData(payload.label, payload.id, lidx);
        setHoverDisplayElement(data)
    }

    const GetRuleData = (id: number | undefined) => {
        if (id !== undefined) {
            let time = 0;
            perRuleData[id].time.forEach((val) => {
                time += val;
            });
            return (<>
                <div>{perRuleData[id].name}</div>
                <div>Average Time Spent: {new Date(perRuleData[id].aveTime * 1000).toISOString().slice(11, 19)}</div>
                <div>Total Time Spent: {new Date(time * 1000).toISOString().slice(11, 19)}</div>
            </>)
        }
    }

    const PLAY_PER_LEVEL_CONTAINER = (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }} data={perLevelData}
                onClick={(e) => {
                    SetClickedDisplayElement({ id: e.activeTooltipIndex || 0, label: e.activeLabel || "" })
                }}
                onMouseMove={(e) => SetHoverDisplayElement({ id: e.activeTooltipIndex || 0, label: e.activeLabel || "" })}
                onMouseLeave={() => setHoverDisplayElement(null)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-90} textAnchor='end' interval={0} className="customXAxis" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Not Forced" fill="#22cc00" stackId="a" />
                <Bar dataKey="forced" name="Forced" fill="#990000" stackId="a" />
            </BarChart>
        </ResponsiveContainer>
    )

    const TIME_PER_LEVEL_CONTAINER = (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }} data={perLevelData} onClick={(e) => SetClickedDisplayElement({ id: e.activeTooltipIndex || 0, label: e.activeLabel || "" })} onMouseMove={(e) => SetHoverDisplayElement({ id: e.activeTooltipIndex || 0, label: e.activeLabel || "" })} onMouseLeave={() => setHoverDisplayElement(null)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-90} textAnchor='end' interval={0} className="customXAxis" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="aveTime" fill="#8884d8" />
            </BarChart>
        </ResponsiveContainer>
    )

    const TIME_PER_RULE_CONTAINER = (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }} {...{ overflow: 'visible' }} data={perRuleData} onClick={(e) => setClickedDisplayElement(GetRuleData(e.activeTooltipIndex))} onMouseMove={(e) => setHoverDisplayElement(GetRuleData(e.activeTooltipIndex))} onMouseLeave={() => setHoverDisplayElement(null)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-90} textAnchor='end' interval={0} height={200} className="customXAxis" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="aveTime" fill="#8884d8" />
            </BarChart>
        </ResponsiveContainer>
    )

    const FEEDBACK_PER_DATE_CONTAINER = (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }} {...{ overflow: 'visible' }} data={perDateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-90} textAnchor='end' interval={0} height={100} className="customXAxis" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
        </ResponsiveContainer>
    )

    const getColor = (val: string) => {
        if (val === "White") {
            return "#FFFFFF"
        }
        if (val === "Black") {
            return "#000000"
        }
        if (val === "Cyan") {
            return "#00FFFF"
        }
        if (val === "") {
            return "transparent"
        }

        // default gray
        return "#808080"
    }

    const getCurrentLevelData = (label: string, per_idx: number, l_idx: number) => {
        if (per_idx === -1) {
            return null;
        }
        return (<>
            <div>{label}</div>
            <div>ID {getLevelData().LevelIDs[l_idx]}</div>
            <button onClick={() => setModalElement(<div style={{ display: "flex", alignItems: "center", flexDirection: "column" }}>{perLevelData[per_idx] && perLevelData[per_idx].time.map((val) => (<div style={{ color: "black" }} >{new Date(val * 1000).toISOString().slice(11, 19)}</div>))}</div>)}>View Completion Times</button>
            <button onClick={() => setModalElement(<div style={{ display: "flex", alignItems: "center", flexDirection: "column" }}>{perLevelData[per_idx] && perLevelData[per_idx].userString.map((val) => (<div style={{ color: "black" }} >{val}</div>))}</div>)}>View Users Completed</button>
            <div>{new Date(perLevelData[per_idx].aveTime * 1000).toISOString().slice(11, 19)}</div>
            {getLevelData().LevelGrids[l_idx].Rules.map((val) => (<div>{val}</div>))}
            <table className="PuzzleBoard">
                {renderGrid(l_idx)}
            </table>
        </>)
    }

    const renderGrid = (val: number) => {
        const getY = (idx: number) => (getLevelData().LevelGrids[val].Dimensions[1] - idx - 1)
        return Array(getLevelData().LevelGrids[val].Dimensions[1]).fill(0).map((_, y) => (
            <tr>
                {Array(getLevelData().LevelGrids[val].Dimensions[0]).fill(0).map((_, x) => (
                    <td style={{ backgroundColor: getColor(getLevelData().LevelGrids[val].GridData[getY(y) * getLevelData().LevelGrids[val].Dimensions[0] + x]) }}>
                    </td>
                ))}
            </tr>
        ))
    }

    return (
        <div className="App">
            <header className="App-header">
                {modalElement ? <div className="modal">
                    <div>
                        <span className="close" onClick={() => setModalElement(null)}>&times;</span>
                        {modalElement}
                    </div>
                </div> : null}
                <div>
                    <div>Data Filter <input type="checkbox" checked={isDataFiltered} onClick={() => setIsDataFiltered(val => !val)} /></div>
                    <div>
                        <select id="build" onChange={(e) => setDataVersion(parseInt(e.target.value))}>
                            {imported_level_data.map((val, idx) => (<option value={idx}>Build {idx + 1}</option>))}
                        </select>
                    </div>
                    <button disabled={currentWindow === "PLAY_PER_LEVEL"} onClick={() => setCurrentWindow("PLAY_PER_LEVEL")}>Plays per Level</button>
                    <button disabled={currentWindow === "TIME_PER_LEVEL"} onClick={() => setCurrentWindow("TIME_PER_LEVEL")}>Time per Level</button>
                    <button disabled={currentWindow === "TIME_PER_RULE"} onClick={() => setCurrentWindow("TIME_PER_RULE")}>Time per Rule</button>
                    <button disabled={currentWindow === "FEEDBACK_PER_DATE"} onClick={() => setCurrentWindow("FEEDBACK_PER_DATE")}>Feedback per Date</button>
                    {/*<button disabled={isRefreshing} onClick={() => setIsRefreshing(true)}>Refresh Data</button>*/}
                </div>
                {/*{feedbacks.map((val, el) => (<div key={"feedback " + el}>{val['Display Name']}</div>))}*/}
                <div style={{ width: "100%", height: "100%", display: 'inline-flex' }}>
                    <div style={{ width: "70%", height: "100%" }}>
                        {(currentWindow === "PLAY_PER_LEVEL") ? PLAY_PER_LEVEL_CONTAINER : null}
                        {(currentWindow === "TIME_PER_LEVEL") ? TIME_PER_LEVEL_CONTAINER : null}
                        {(currentWindow === "TIME_PER_RULE") ? TIME_PER_RULE_CONTAINER : null}
                        {(currentWindow === "FEEDBACK_PER_DATE") ? FEEDBACK_PER_DATE_CONTAINER : null}
                    </div>
                    <div style={{ width: "30%", height: "100%" }} className="Puzzle">
                        {hoverDisplayElement || clickedDisplayElement}
                    </div>
                </div>
            </header>
        </div>
    );
}

export default App;
