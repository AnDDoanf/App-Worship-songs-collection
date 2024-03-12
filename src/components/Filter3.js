import React from 'react';
import { useState } from 'react';

const Filter3 = ({ handleFilter3 }) => {
    const optionsFilter3 = ['4/4', '2/4', '3/4', '6/8', '6/4', '12/8', '2/2'];
    
    const [myValue, setMyValue] = useState('');

    return (
        <div className='filter-column2'>
          <p>Lọc theo số chỉ nhịp:</p>
          <select className='dropdown' onChange={(e) => handleFilter3(e.target.value)} defaultValue={myValue}>
            <option value=''>Tất cả</option>
            {optionsFilter3.map((option, idx) => (
              <option key={idx}>{option}</option>
            ))}
          </select>
        </div>
    )
}

export default Filter3