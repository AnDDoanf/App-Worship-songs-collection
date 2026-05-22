import React from 'react';
import { MdSearch } from 'react-icons/md';

const Search = ({ handleSearchNote }) => {
    return <div className='search'>
        <MdSearch className='search-icon' size='1.3em' />
        <input type="text" onChange={(event)=>handleSearchNote(event.target.value)} className='search-input' placeholder='Tên bài hát...'/>
    </div>
}

export default Search