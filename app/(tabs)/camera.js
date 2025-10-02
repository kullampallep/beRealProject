import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CameraScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Camera</Text>
			<Text style={styles.subtitle}>This is a placeholder for the Camera screen.</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 20,
	},
	title: {
		fontSize: 24,
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: 'gray',
	},
});
