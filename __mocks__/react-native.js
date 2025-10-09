const React = require('react');

function View(props) {
  return React.createElement('div', props, props.children);
}

function Text(props) {
  return React.createElement('span', props, props.children);
}

function Button(props) {
  const { title, onPress, ...rest } = props || {};
  return React.createElement('button', { onClick: onPress, ...rest }, title || props.children);
}

function Image(props) {
  const src = (props.source && props.source.uri) || props.src || '';
  return React.createElement('img', { src, alt: props.alt || '', style: props.style });
}

function FlatList({ data = [], renderItem }) {
  return React.createElement(
    'div',
    null,
    data.map((item, idx) => React.createElement('div', { key: item.id || idx }, renderItem({ item })))
  );
}

const ActivityIndicator = (props) => React.createElement('div', null, 'Loading...');

const TouchableOpacity = (props) => React.createElement('button', { onClick: props.onPress }, props.children);

const StyleSheet = { create: (s) => s };

const Platform = { OS: 'web' };

const Dimensions = {
  get: (dim) => {
    if (dim === 'window') return { width: 1024, height: 768 };
    return { width: 1024, height: 768 };
  },
};

const RefreshControl = (props) => React.createElement('div', null, props.children);

const Alert = {
  alert: (title, msg, buttons) => {
    // simple console fallback for tests
    console.log('ALERT:', title, msg, buttons);
  }
};

const TextInput = (props) => React.createElement('input', { ...props });

const Pressable = (props) => React.createElement('button', { onClick: props.onPress }, props.children);

const ImageBackground = (props) => React.createElement('div', { style: props.style }, props.children);

module.exports = {
  View,
  Text,
  Button,
  Image,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Platform,
  // basic exports commonly referenced
  SafeAreaView: View,
  ScrollView: View,
  StatusBar: () => null,
  Dimensions,
  RefreshControl,
  Alert,
  TextInput,
  Pressable,
  ImageBackground,
};
