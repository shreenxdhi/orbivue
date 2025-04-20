const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api/weather',
    createProxyMiddleware({
      target: 'https://api.openweathermap.org/data/2.5',
      changeOrigin: true,
      pathRewrite: {
        '^/api/weather': '', // remove base path
      },
    })
  );
  
  app.use(
    '/api/geo',
    createProxyMiddleware({
      target: 'https://api.openweathermap.org/geo/1.0',
      changeOrigin: true,
      pathRewrite: {
        '^/api/geo': '', // remove base path
      },
    })
  );
}; 