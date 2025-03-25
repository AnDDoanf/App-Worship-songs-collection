import React, { useState } from "react";
import "./ChordsAlignmentTool.css";

export default function ChordAlignmentTool() {
  const [lyrics, setLyrics] = useState("");
  const [lines, setLines] = useState([]);
  const [chords, setChords] = useState({});

  const handleLyricsChange = (e) => {
    setLyrics(e.target.value);
  };

  const processLyrics = () => {
    const splitLines = lyrics
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "")
      .map((line) => ["", ...line.split(" ").filter((word) => word !== ""), ""]);
    setLines(splitLines);
    setChords({});
  };

  const handleChordChange = (lineIndex, wordIndex, value) => {
    setChords((prev) => ({
      ...prev,
      [`${lineIndex}-${wordIndex}`]: value,
    }));
  };

  const exportToJson = () => {
    const exportData = lines.map((line, lineIndex) =>
      line.map((word, wordIndex) => ({
        word,
        chord: chords[`${lineIndex}-${wordIndex}`] || "",
      }))
    );
    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chords.json";
    a.click();
  };

  return (
    <div className="chord-tool-container">
      <textarea
        value={lyrics}
        onChange={handleLyricsChange}
        placeholder="Enter lyrics here... (Press Enter for new line)"
        className="lyrics-input"
      />
      <button onClick={processLyrics} className="process-button">Process Lyrics</button>
      <div className="lyrics-display">
        {lines.map((line, lineIndex) => (
          <div key={lineIndex} className="line-container">
            <div className="word-container">
              {line.map((word, wordIndex) => (
                <div key={wordIndex} className="word-group">
                  <input
                    type="text"
                    value={chords[`${lineIndex}-${wordIndex}`] || ""}
                    onChange={(e) =>
                      handleChordChange(lineIndex, wordIndex, e.target.value)
                    }
                    className="chord-input"
                    placeholder=""
                  />
                  <span className="word-text">{word}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button onClick={exportToJson} className="export-button">Export to JSON</button>
    </div>
  );
}