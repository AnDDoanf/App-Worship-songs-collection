import { useState } from "react";
import SongList from "./components/SongList";
import Search from "./components/Search";
import Header from "./components/Header";
import data from "./data/hosanna-data.json";
import Filter1 from "./components/Filter1";
import Filter2 from "./components/Filter2";
import Filter3 from "./components/Filter3";

function App() {
  const [songs, setSongs] = useState(data)
  const [searchText, setSearchText] = useState('')
  const [mode, setMode] = useState(false)
  const [filter1, setFilter1] = useState('')
  const [filter2, setFilter2] = useState('')
  const [filter3, setFilter3] = useState('')
  return (
    <div className={`${mode && 'dark-mode'}`}>
      <div className="container">
        <Header handleMode={setMode} />
        <Search handleSearchNote={setSearchText}/>
        <div className="filter-row">
          <Filter1 handleFilter1={setFilter1}/>
          <Filter2 handleFilter2={setFilter2}/>
          <Filter3 handleFilter3={setFilter3}/>
        </div>
        <SongList songs={songs.filter((song)=>song.songName.toLocaleLowerCase().includes(searchText.toLocaleLowerCase()) 
          && song.category.toLocaleLowerCase().includes(filter1.toLocaleLowerCase()) 
          && song.tone.toLocaleLowerCase().includes(filter2.toLocaleLowerCase())
          && song.timeSignature.toLocaleLowerCase().includes(filter3.toLocaleLowerCase()))}/>
      </div>
    </div>

  );
}

export default App;
