module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        safe: false,
        allowUndefined: true
      }
    ],
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@context': './src/context',
          '@screens': './src/screens',
          '@services': './src/services',
          '@types': './src/types',
          '@constants': './src/constants',
          '@utils': './src/utils'
        }
      }
    ]
  ]
};
