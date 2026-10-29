function loadContext(context) {
  try {
    return context.keys().reduce((images, key) => {
      const imageKey = key.split('/').pop().replace(/\.(png|jpe?g|svg|webp)$/i, '');
      images[imageKey] = context(key);
      return images;
    }, {});
  } catch (_error) {
    return {};
  }
}

let maskContext;
try { maskContext = require.context('../../../assets/images/sheet-masks', true, /\.webp$/i); } catch (_error) { maskContext = { keys: () => [] }; }

// Load only the compact preprocessed masks; avoid bundling the much larger scans.
const gallery = loadContext(maskContext);

export default gallery;
