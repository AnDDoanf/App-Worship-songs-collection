import React from 'react';
import { useState } from 'react';

const Filter2 = ({ handleFilter2 }) => {
    const optionsFilter2 = ['C',
        'G', 'A', 'D', 'Am', 'F', 'Em', 'E', 'Dm', 'Gm','Fm', 'Bb',
        'C#m', 'Bm', 'F#m', 'Dm', 'Eb', 'Cm', 'Ab'];
    
    const [myValue, setMyValue] = useState('');

    return (
        <div className='filter-column2'>
          <p>Lọc theo tone giọng:</p>
          <select className='dropdown' onChange={(e) => handleFilter2(e.target.value)} defaultValue={myValue}>
            <option value=''>Tất cả</option>
            {optionsFilter2.map((option, idx) => (
              <option key={idx}>{option}</option>
            ))}
          </select>
        </div>
    )
}

export default Filter2