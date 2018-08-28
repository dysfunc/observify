module.exports = function (config) {
  config.set({
    browsers: ['Chrome'],
    colors: true,
    client: {
      clearContext: false
    },
    failOnEmptyTestSuite: false,
    coverageReporter: {
      dir: process.env.ARTIFACTS_DIR || 'test-results',
      reporters: [
        { type: 'lcov', subdir: 'coverage' },
        { type: 'json', subdir: 'coverage' },
        { type: 'text', subdir: 'coverage' },
        { type: 'json-summary', subdir: 'coverage', file: 'summary.json' }
      ]
    },
    frameworks: [
      'jasmine'
    ],
    files: [
      'tests/setup.js',
    ],
    preprocessors: {
      'tests/setup.js': ['webpack']
    },
    reporters: ['progress', 'coverage'],
    webpack: {
      mode: 'development',
      cache: true,
      devtool: 'inline-source-map',
      module: {
        rules: [
          {
            test: /.spec\.js$/,
            exclude: /node_modules/,
            enforce: 'pre',
            use: [{
              loader: 'babel-loader'
            }]
          },
          {
            test: /\.js$/,
            exclude: [/node_modules/, /tests/, /.spec\.js$/],
            enforce: 'pre',
            use: [{
              loader: 'istanbul-instrumenter-loader',
              query: {
                esModules: true
              }
            }]
          },
          {
            test: /\.js$/,
            include: /src/,
            exclude: [/node_modules/, /tests/],
            use: [{
              loader: 'babel-loader'
            }]
          }
        ]
      }
    }
  });
};
