import { useState } from "react";
import SongList from "./SongList";
import Search from "./Search";
import Filter1 from "./Filter1";
import Filter2 from "./Filter2";
import Filter3 from "./Filter3";
import data from "../data/song3-data.json"

function BaihattudoComponent() {
  const [songs, setSongs] = useState(data)
  const [searchText, setSearchText] = useState('')
  const [filter1, setFilter1] = useState('')
  const [filter2, setFilter2] = useState('')
  const [filter3, setFilter3] = useState('')
  return (
      <>
        <Search handleSearchNote={setSearchText}/>
        <div className="filter-row">
          <Filter1 handleFilter1={setFilter1}/>
          <Filter2 handleFilter2={setFilter2}/>
          <Filter3 handleFilter3={setFilter3}/>
        </div>
        <SongList songs={songs.filter((song)=>(song.songName.toLocaleLowerCase().includes(searchText.toLocaleLowerCase()) 
          || song.id.toLocaleLowerCase().includes(searchText.toLocaleLowerCase())
          || song.lyric.toLocaleLowerCase().includes(searchText.toLocaleLowerCase()))
          && song.category.toLocaleLowerCase().includes(filter1.toLocaleLowerCase()) 
          && song.tone.toLocaleLowerCase().includes(filter2.toLocaleLowerCase())
          && song.timeSignature.toLocaleLowerCase().includes(filter3.toLocaleLowerCase()))}/>
    </>

  );
}

export default BaihattudoComponent
