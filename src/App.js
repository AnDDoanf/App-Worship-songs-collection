import { useState } from "react";
import {nanoid} from 'nanoid'
import SongList from "./components/SongList";
import Search from "./components/Search";
import Header from "./components/Header";
import data from "./data/hosanna-data.json";
import Filter1 from "./components/Filter1";
function App() {
  const [songs, setSongs] = useState(data)
  const [searchText, setSearchText] = useState('')
  const [mode, setMode] = useState(false)
  const [filter1, setFilter1] = useState('')
  return (
    <div className={`${mode && 'dark-mode'}`}>
      <div className="container">
        <Header handleMode={setMode} />
        <Search handleSearchNote={setSearchText}/>
        <Filter1 handleFilter1={setFilter1}/>
        <SongList songs={songs.filter((song)=>song.songName.toLocaleLowerCase().includes(searchText.toLocaleLowerCase()) && song.category.toLocaleLowerCase().includes(filter1.toLocaleLowerCase()))}/>
      </div>
    </div>

  );
}

export default App;
