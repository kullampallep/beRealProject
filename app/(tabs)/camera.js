import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

export default function CameraScreen() {
	const router = useRouter();

	useEffect(() => {
		// Redirect to the take-photo screen
		router.replace('/take-photo');
	}, [router]);

	return (
		<View style={styles.container}>
			<ActivityIndicator size="large" color="#fff" />
			<Text style={styles.title}>Opening Camera...</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#000',
		padding: 20,
	},
	title: {
		fontSize: 18,
		color: '#fff',
		marginTop: 16,
		fontWeight: '600',
	},
});
