const imageContext = require.context('../data', true, /\.(png|jpe?g|svg)$/);

const gallery = imageContext.keys().reduce((images, key) => {
  const fileName = key.split('/').pop();
  const imageKey = fileName.replace(/\.(png|jpe?g|svg)$/i, '');

  images[imageKey] = imageContext(key);
  return images;
}, {});

export default gallery;
