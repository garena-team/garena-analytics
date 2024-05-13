import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { db } from './tools/firebase'

import { collection, getDocs } from "firebase/firestore";
import { FeedbackData, PerLevelData } from './tools/dataclass';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import leveldatas from './data/leveldata.json';
import tempfeedbackdata from './data/tempfeedbackdata.json';

function parseTimeSpanString(timeSpanString: string) {
    // Split the string by ':' to get hours, minutes, seconds, and milliseconds
    var parts = timeSpanString.split(':');

    // Extract hours, minutes, seconds, and milliseconds from parts array
    var hours = parseInt(parts[0]);
    var minutes = parseInt(parts[1]);
    var seconds = parseInt(parts[2].split('.')[0]); // Extract seconds
    var milliseconds = parseInt("0." + parts[2].split('.')[1]); // Extract milliseconds
    console.log(timeSpanString + " converted to " + hours + "h " + minutes + "m " + seconds + "s " + milliseconds);

    // Calculate total milliseconds
    var totalSeconds = (hours * 3600 + minutes * 60 + seconds) + milliseconds;

    return totalSeconds;
}

function App() {
    const [currentWindow, setCurrentWindow] = useState<"PLAY_PER_LEVEL" | "TIME_PER_LEVEL">("PLAY_PER_LEVEL")
    const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([])
    const [perLevelData, setPerLevelData] = useState<PerLevelData[]>([])
    const [clickedLevelId, setClickedLevelId] = useState<number>(-1)
    const [selectedLevelId, setSelectedLevelId] = useState<number>(0)
    const [isDataFiltered, setIsDataFiltered] = useState<boolean>(true)

    useEffect(() => {
        let anydata: any = tempfeedbackdata;
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
            return { ...val, 'Level ID': leveldatas.LevelIDs[leveldatas.LevelIDs.indexOf(val['Level ID']) - 1] }
        })
        if (isDataFiltered) {
            // filter invalid times
            feedback = feedback.filter((val) => {
                return parseTimeSpanString(val.Time) < 60 * 60;
            })
        }
        setFeedbacks(feedback);
    }, [isDataFiltered])
    useEffect(() => {
        const leveldata: { [LevelID: string]: FeedbackData[] } = {}
        feedbacks.forEach((feedback) => {
            if (!(feedback['Level ID'] in leveldata)) {
                leveldata[feedback['Level ID']] = []
            }
            leveldata[feedback['Level ID']].push(feedback);
        })
        let perLevelData: PerLevelData[] = []
        leveldatas.LevelIDs.forEach((levelString, idx) => {
            if (levelString in leveldata) {
                let times: number[] = []
                let aveTime = 0;
                leveldata[levelString].forEach((val) => {
                    aveTime += parseTimeSpanString(val.Time)
                    times.push(parseTimeSpanString(val.Time))
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
        })
        setPerLevelData(perLevelData);
    }, [feedbacks])

    const SetClickedLevelId = (levelId: number) => {
        setClickedLevelId(prevVal => {
            if (prevVal === levelId) {
                return -1;
            } else { 
                return levelId;
            }
        })
    }

    const PLAY_PER_LEVEL_CONTAINER = (
        <ResponsiveContainer width="80%" height="80%">
            <BarChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }} data={perLevelData} onClick={(e) => SetClickedLevelId(parseInt(e.activeLabel || "0"))} onMouseMove={(e) => setSelectedLevelId(parseInt(e.activeLabel || "0"))}>
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
        <ResponsiveContainer width="80%" height="80%">
            <BarChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }} data={perLevelData} onClick={(e) => SetClickedLevelId(parseInt(e.activeLabel || "0"))} onMouseMove={(e) => setSelectedLevelId(parseInt(e.activeLabel || "0"))}>
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

        // default gray
        return "#808080"
    }

    const getCurrentLevelId = () => {
        if (clickedLevelId !== -1) {
            return clickedLevelId;
        } else {
            return selectedLevelId;
        }
    }

    return (
        <div className="App">
            <header className="App-header">
                <div>
                    <div>Data Filter <input type="checkbox" checked={isDataFiltered} onClick={() => setIsDataFiltered(val => !val)} /></div>
                    <button disabled={currentWindow === "PLAY_PER_LEVEL"} onClick={() => setCurrentWindow("PLAY_PER_LEVEL")}>Plays per Level</button>
                    <button disabled={currentWindow === "TIME_PER_LEVEL"} onClick={() => setCurrentWindow("TIME_PER_LEVEL")}>Time per Level</button>
                </div>
                {/*{feedbacks.map((val, el) => (<div key={"feedback " + el}>{val['Display Name']}</div>))}*/}
                <div style={{ width: "100%", height: "100%", display: 'inline-flex' }}>
                    <div style={{ width: "80%", height: "100%" }}>
                        {(currentWindow === "PLAY_PER_LEVEL") ? PLAY_PER_LEVEL_CONTAINER : null}
                        {(currentWindow === "TIME_PER_LEVEL") ? TIME_PER_LEVEL_CONTAINER : null}
                    </div>
                    <div style={{ width: "20%", height: "100%" }}>
                        <div>Level {getCurrentLevelId() + 1}</div>
                        <div>ID {leveldatas.LevelIDs[getCurrentLevelId()]}</div>
                        {perLevelData[getCurrentLevelId()] && perLevelData[getCurrentLevelId()].time.map((val) => (<div>{new Date(val * 1000).toISOString().slice(11, 19)}</div>))}
                        <table className="Puzzle">
                            {Array(leveldatas.LevelGrids[getCurrentLevelId()].Dimensions[1]).fill(0).map((_, y) => (
                                <tr>
                                    {Array(leveldatas.LevelGrids[getCurrentLevelId()].Dimensions[0]).fill(0).map((_, x) => (
                                        <td style={{ backgroundColor: getColor(leveldatas.LevelGrids[getCurrentLevelId()].GridData[y * leveldatas.LevelGrids[getCurrentLevelId()].Dimensions[0] + x]) }}>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </table>
                    </div>
                </div>
            </header>
        </div>
    );
}

export default App;
