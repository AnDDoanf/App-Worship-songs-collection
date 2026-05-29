import { createPortal } from 'react-dom';
import { FiBookOpen, FiEdit3, FiEye, FiPlus, FiSearch, FiX } from 'react-icons/fi';

const steps = [
  {
    id: 'theme',
    title: 'Chọn giao diện',
    description:
      'Dùng nút bảng màu và nút sáng tối trên đầu trang để đổi màu và chế độ hiển thị.',
    icon: FiBookOpen,
  },
  {
    id: 'search',
    title: 'Tìm bài hát',
    description:
      'Nhập từ khóa, sau đó lọc theo chủ đề, tone giọng và số chỉ nhịp để thu hẹp danh sách.',
    icon: FiSearch,
  },
  {
    id: 'view-song',
    title: 'Xem bài hát',
    description:
      'Nhấn nút xem trên thẻ bài hát để mở lời, hợp âm hoặc nội dung chi tiết của bài đang chọn.',
    icon: FiEye,
  },
  {
    id: 'slideshow',
    title: 'Tạo thư mục bản nhạc',
    description:
      'Nhấn dấu cộng ở từng bài hát để thêm vào danh sách, sau đó mở thư mục bản nhạc hoặc hàng lời bài hát.',
    icon: FiPlus,
  },
  {
    id: 'manage-folder',
    title: 'Quản lí thư mục',
    description:
      'Mở thư mục bản nhạc để sắp xếp, xoá, chỉnh lời hoặc chuẩn bị nội dung trước khi sử dụng.',
    icon: FiEdit3,
  },
];

function UsageGuideModal({ trigger, setTrigger }) {
  if (!trigger) {
    return null;
  }

  return createPortal(
    <div className="popup usage-guide-overlay" onClick={() => setTrigger(false)}>
      <div className="usage-guide-shell" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="popup-close-button popup-close-button-themed"
          onClick={() => setTrigger(false)}
          aria-label="Đóng hướng dẫn"
        >
          <FiX />
        </button>

        <div className="usage-guide-scroll">
          <div className="usage-guide-hero">
            <span className="usage-guide-kicker">Hướng dẫn nhanh</span>
            <h2>Cách sử dụng ứng dụng</h2>
            <p>
              Làm quen nhanh với đổi giao diện, tìm bài hát và tạo thư mục bản nhạc chỉ trong vài
              bước.
            </p>
          </div>

          <div className="usage-guide-steps">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <article key={step.id} className="usage-guide-step">
                  <span className="usage-guide-step-number">0{index + 1}</span>
                  <div className="usage-guide-step-header">
                    <span className="usage-guide-step-icon">
                      <Icon />
                    </span>
                    <h3>{step.title}</h3>
                  </div>
                  <p>{step.description}</p>
                </article>
              );
            })}
          </div>

          <div className="usage-guide-gallery">
            <article className="usage-guide-shot">
              <div className="usage-guide-shot-frame usage-guide-shot-theme" aria-hidden="true">
                <div className="usage-guide-mini-header">
                  <span className="usage-guide-mini-dot active" />
                  <span className="usage-guide-mini-dot" />
                  <span className="usage-guide-mini-dot" />
                </div>
                <div className="usage-guide-theme-row">
                  <span className="usage-guide-theme-pill solid" />
                  <span className="usage-guide-theme-pill" />
                  <span className="usage-guide-theme-pill ghost" />
                </div>
                <div className="usage-guide-theme-list">
                  <div className="usage-guide-theme-item active">
                    <span>Solarized</span>
                    <div className="usage-guide-theme-swatches">
                      <span />
                      <span />
                    </div>
                  </div>
                  <div className="usage-guide-theme-item">
                    <span>Church</span>
                    <div className="usage-guide-theme-swatches">
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              </div>
              <div className="usage-guide-shot-copy">
                <h3>1. Đổi bảng màu</h3>
                <p>
                  Dùng hai nút nhỏ trên đầu trang để mở bảng màu, chọn theme mong muốn và đổi chế
                  độ sáng tối.
                </p>
              </div>
            </article>

            <article className="usage-guide-shot">
              <div className="usage-guide-shot-frame usage-guide-shot-search" aria-hidden="true">
                <div className="usage-guide-search-bar">
                  <span />
                  <span />
                </div>
                <div className="usage-guide-filter-grid">
                  <span />
                  <span />
                  <span className="wide" />
                </div>
                <div className="usage-guide-pagination">
                  <span />
                  <span className="current" />
                  <span />
                </div>
              </div>
              <div className="usage-guide-shot-copy">
                <h3>2. Tìm và lọc</h3>
                <p>
                  Ô tìm kiếm và bộ lọc giúp bạn nhảy nhanh đến bài hát cần dùng mà không cần cuộn
                  qua danh sách dài.
                </p>
              </div>
            </article>

            <article className="usage-guide-shot">
              <div className="usage-guide-shot-frame usage-guide-shot-view" aria-hidden="true">
                <div className="usage-guide-song-card usage-guide-song-card-view">
                  <div className="usage-guide-song-view-header">
                    <strong>H12. Hosanna</strong>
                    <span className="usage-guide-song-view-chip">Xem bài hát</span>
                  </div>
                  <div className="usage-guide-song-lines">
                    <span />
                    <span />
                    <span />
                    <span className="short" />
                  </div>
                  <div className="usage-guide-song-actions">
                    <span className="primary" />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
              <div className="usage-guide-shot-copy">
                <h3>3. Xem bài hát</h3>
                <p>
                  Nhấn nút xem để mở nội dung bài hát. Tại đây bạn có thể xem lời, theo dõi hợp âm
                  và sử dụng nhanh trước khi thêm vào thư mục bản nhạc.
                </p>
              </div>
            </article>

            <article className="usage-guide-shot">
              <div className="usage-guide-shot-frame usage-guide-shot-song" aria-hidden="true">
                <div className="usage-guide-song-card">
                  <strong>Thư mục 1</strong>
                  <div className="usage-guide-song-meta">
                    <span />
                    <span />
                  </div>
                  <div className="usage-guide-song-actions">
                    <span />
                    <span className="primary" />
                    <span />
                  </div>
                  <div className="usage-guide-song-audio" />
                </div>
              </div>
              <div className="usage-guide-shot-copy">
                <h3>4. Thêm vào thư mục bản nhạc</h3>
                <p>
                  Nhấn dấu cộng trên thẻ bài hát để đưa bài vào danh sách, sau đó mở thư mục bản
                  nhạc hoặc hàng lời từ khung danh sách.
                </p>
              </div>
            </article>

            <article className="usage-guide-shot">
              <div className="usage-guide-shot-frame usage-guide-shot-manage" aria-hidden="true">
                <div className="usage-guide-folder-card">
                  <div className="usage-guide-folder-header">
                    <strong>Thư mục bản nhạc</strong>
                    <span className="usage-guide-song-view-chip">3 bài</span>
                  </div>
                  <div className="usage-guide-folder-list">
                    <div className="usage-guide-folder-item">
                      <span className="usage-guide-folder-title" />
                      <div className="usage-guide-folder-actions">
                        <span />
                        <span className="primary" />
                        <span />
                      </div>
                    </div>
                    <div className="usage-guide-folder-item">
                      <span className="usage-guide-folder-title short" />
                      <div className="usage-guide-folder-actions">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                    <div className="usage-guide-folder-item">
                      <span className="usage-guide-folder-title" />
                      <div className="usage-guide-folder-actions">
                        <span className="primary" />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="usage-guide-shot-copy">
                <h3>5. Quản lí thư mục</h3>
                <p>
                  Trong thư mục bản nhạc, bạn có thể đổi thứ tự, xoá bài, chỉnh lời hoặc rà soát
                  nhanh toàn bộ danh sách trước khi dùng.
                </p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default UsageGuideModal;
