import React from 'react';
import { View, Text } from 'react-native';

export default function TakePhotoScreenDisabled() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>
        Take-photo route is temporarily disabled to avoid runtime issues. If you want to
        enable camera functionality, create a development build with native modules.
      </Text>
    </View>
  );
}
