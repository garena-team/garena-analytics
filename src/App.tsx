import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { db } from './tools/firebase'

import { collection, getDocs } from "firebase/firestore";
import { FeedbackData, PerLevelData, PerRuleData } from './tools/dataclass';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import leveldatas1 from './data/build 1/leveldata.json';
import tempfeedbackdata1 from './data/build 1/tempfeedbackdata.json';
import leveldatas2 from './data/build 2/leveldata.json';
//import tempfeedbackdata2 from './data/build 1/tempfeedbackdata.json';

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

function App() {
    const [currentWindow, setCurrentWindow] = useState<"PLAY_PER_LEVEL" | "TIME_PER_LEVEL" | "TIME_PER_RULE">("PLAY_PER_LEVEL")
    const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([])
    const [perLevelData, setPerLevelData] = useState<PerLevelData[]>([])
    const [perRuleData, setPerRuleData] = useState<PerRuleData[]>([])
    const [clickedDisplayElement, setClickedDisplayElement] = useState<any>(null)
    const [hoverDisplayElement, setHoverDisplayElement] = useState<any>(null)
    const [isDataFiltered, setIsDataFiltered] = useState<boolean>(true)
    const [dataVersion, setDataVersion] = useState<string>("Build 1")

    const getLevelData = () => {
        if (dataVersion === "Build 1") {
            return leveldatas1;
        } else if (dataVersion === "Build 2") {
            return leveldatas2;
        }
        return leveldatas1;
    }

    const getFeedbackData = () => {
        if (dataVersion === "Build 1") {
            return tempfeedbackdata1;
        } else if (dataVersion === "Build 2") {
            return tempfeedbackdata1;
        }
        return tempfeedbackdata1;
    }

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

        // offset -1
        feedback = feedback.map((val) => {
            return { ...val, 'Level ID': getLevelData().LevelIDs[getLevelData().LevelIDs.indexOf(val['Level ID']) - 1] }
        })
        if (isDataFiltered) {
            // filter invalid times
            feedback = feedback.filter((val) => {
                return parseTimeSpanString(val.Time) < 60 * 60;
            })
        }
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
        let perRuleData: { [id: string]: PerRuleData} = {}
        getLevelData().LevelIDs.forEach((levelString, idx) => {
            if (levelString in leveldata) {
                let times: number[] = []
                let aveTime = 0;
                leveldata[levelString].forEach((val) => {
                    let time = parseTimeSpanString(val.Time);
                    aveTime += time
                    times.push(time)
                    getLevelData().LevelGrids[idx].Rules.forEach((rule) => {
                        if (rule in perRuleData) {
                            perRuleData[rule].time.push(time);
                        } else {
                            perRuleData[rule] = { name: rule, time: [time], aveTime: 0 }
                        }
                    })
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

                aveTime /= leveldata[levelString].length;
                perLevelData.push({ name: idx, count: notForced, forced: forced, time: times, aveTime: aveTime })
            } else {
                perLevelData.push({ name: idx, count: 0, forced: 0, time: [], aveTime: 0 })
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
    }, [feedbacks])

    const SetClickedDisplayElement = (levelId: number) => {
        let data = getCurrentLevelData(levelId);
        if (clickedDisplayElement === data) {
            setClickedDisplayElement(null)
        } else {
            setClickedDisplayElement(data)
        }
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
            <BarChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }} data={perLevelData} onClick={(e) => SetClickedDisplayElement(parseInt(e.activeLabel || "0"))} onMouseMove={(e) => setHoverDisplayElement(getCurrentLevelData(parseInt(e.activeLabel || "0")))} onMouseLeave={() => setHoverDisplayElement(null)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
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
            <BarChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }} data={perLevelData} onClick={(e) => SetClickedDisplayElement(parseInt(e.activeLabel || "0"))} onMouseMove={(e) => setHoverDisplayElement(getCurrentLevelData(parseInt(e.activeLabel || "0")))} onMouseLeave={() => setHoverDisplayElement(null)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="aveTime" fill="#8884d8" />
            </BarChart>
        </ResponsiveContainer>
    )

    const TIME_PER_RULE_CONTAINER = (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }} data={perRuleData} onClick={(e) => setClickedDisplayElement(GetRuleData(e.activeTooltipIndex))} onMouseMove={(e) => setHoverDisplayElement(GetRuleData(e.activeTooltipIndex))} onMouseLeave={() => setHoverDisplayElement(null)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="aveTime" fill="#8884d8" />
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

    const getCurrentLevelData = (val: number) => (<>
        <div>{(val < 15) ? "Handmade " + (val + 1) : "Level " + (val - 14)}</div>
        <div>ID {getLevelData().LevelIDs[val]}</div>
        {perLevelData[val] && perLevelData[val].time.map((val) => (<div>{new Date(val * 1000).toISOString().slice(11, 19)}</div>))}
        {getLevelData().LevelGrids[val].Rules.map((val) => (<div>{val}</div>))}
        <table className="PuzzleBoard">
            {renderGrid(val)}
        </table>
    </>)

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
                <div>
                    <div>Data Filter <input type="checkbox" checked={isDataFiltered} onClick={() => setIsDataFiltered(val => !val)} /></div>
                    <div>
                        <select id="build" onChange={(e) => setDataVersion(e.target.value)}>
                            <option value="Build 1">Build 1</option>
                            <option value="Build 2">Build 2</option>
                        </select>
                    </div>
                    <button disabled={currentWindow === "PLAY_PER_LEVEL"} onClick={() => setCurrentWindow("PLAY_PER_LEVEL")}>Plays per Level</button>
                    <button disabled={currentWindow === "TIME_PER_LEVEL"} onClick={() => setCurrentWindow("TIME_PER_LEVEL")}>Time per Level</button>
                    <button disabled={currentWindow === "TIME_PER_RULE"} onClick={() => setCurrentWindow("TIME_PER_RULE")}>Time per Rule</button>
                </div>
                {/*{feedbacks.map((val, el) => (<div key={"feedback " + el}>{val['Display Name']}</div>))}*/}
                <div style={{ width: "100%", height: "100%", display: 'inline-flex' }}>
                    <div style={{ width: "70%", height: "100%" }}>
                        {(currentWindow === "PLAY_PER_LEVEL") ? PLAY_PER_LEVEL_CONTAINER : null}
                        {(currentWindow === "TIME_PER_LEVEL") ? TIME_PER_LEVEL_CONTAINER : null}
                        {(currentWindow === "TIME_PER_RULE") ? TIME_PER_RULE_CONTAINER : null}
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
