jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return new Proxy({}, { get: () => View });
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
