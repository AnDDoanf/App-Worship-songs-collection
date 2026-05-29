import React from 'react';

const Filter2 = ({ handleFilter2 }) => {
  const optionsFilter2 = [
    'C',
    'C#',
    'Cm',
    'C#m',
    'D',
    'D#',
    'Dm',
    'D#m',
    'E',
    'Em',
    'F',
    'F#',
    'Fm',
    'F#m',
    'G',
    'Gm',
    'G#m',
    'Ab',
    'A',
    'Am',
    'A#m',
    'Bb',
    'B',
    'Bm',
  ];

  return (
    <div className="filter-column2">
      <p>Tone giọng:</p>
      <select className="dropdown" onChange={(e) => handleFilter2(e.target.value)} defaultValue="">
        <option value="">Tất cả</option>
        {optionsFilter2.map((option, idx) => (
          <option key={idx}>{option}</option>
        ))}
      </select>
    </div>
  );
};

export default Filter2;
