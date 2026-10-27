let imageContext;
try {
  imageContext = require.context('../../../assets/images/sheets', true, /\.(png|jpe?g|svg)$/);
} catch (_error) {
  imageContext = { keys: () => [] };
}

const gallery = imageContext.keys().reduce((images, key) => {
  const fileName = key.split('/').pop();
  const imageKey = fileName.replace(/\.(png|jpe?g|svg)$/i, '');

  images[imageKey] = imageContext(key);
  return images;
}, {});

export default gallery;
