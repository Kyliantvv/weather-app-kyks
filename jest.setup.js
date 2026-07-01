jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return new Proxy({}, { get: () => View });
});
