import React from 'react';
import { useState, useEffect } from 'react';

const Filter1 = ({ handleFilter1 }) => {
    const optionsFilter1 = [
                    "Ngợi khen thờ phượng: Tôn cao Chúa", 
                    "Ngợi khen thờ phượng: Xin Chúa hiện diện", 
                    "Ngợi khen thờ phượng: Sự ăn năn - Sự tha tội",
                    "Ngợi khen thờ phượng: Dâng hiến - Đáp ứng",
                    "Ngợi khen cảm tạ",
                    "Truyền giảng hội chúng",
                    "Đơn ca kêu gọi",
                    "Thánh ca Giáng Sinh",
                    "Thánh lễ Thương Khó - Phục Sinh",
                    "Thông công - Sinh hoạt",
                    "Hôn nhân - Hôn lễ",
                    "Phụ mẫu",
                    "Thánh ca mừng năm mới",
                    "Thánh lễ Tiệc Thánh",
                    "Thánh ca cho Tang lễ",
                    "Đơn ca trải lòng"];
    const [myValue, setMyValue] = useState('');

    return (
        <div>
          <p>Lọc theo chủ đề:</p>
          <select className='dropdown' onChange={(e) => handleFilter1(e.target.value)} defaultValue={myValue}>
            <option value=''>Tất cả</option>
            {optionsFilter1.map((option, idx) => (
              <option key={idx}>{option}</option>
            ))}
          </select>
        </div>
    )
}

export default Filter1