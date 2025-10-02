import React, { useContext } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '../context/AuthContext';

export default function HomeScreen() {
	const router = useRouter();
		const { user, loading, logout } = useContext(AuthContext);

	if (loading) {
		return (
			<View style={styles.container}>
				<ActivityIndicator />
			</View>
		);
	}

	if (!user) {
		return (
			<View style={styles.container}>
				<Text style={styles.title}>Welcome</Text>
				<Text style={styles.subtitle}>Please sign in to take a BeReal.</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Time to BeReal</Text>
			<Text style={styles.subtitle}>Ready to capture your moment, {user.username}?</Text>
					<View style={styles.button}>
								<Button
									title="Take a BeReal"
									onPress={async () => {
										try {
											// visible feedback so we know the press fired
											Alert.alert('Debug', 'Take a BeReal pressed');
											console.log('Take a BeReal pressed, navigating to /take-photo');
											await router.push({ pathname: '/take-photo' });
										} catch (e) {
											console.error('Navigation error', e);
											Alert.alert('Navigation error', String(e));
										}
									}}
								/>
					</View>
					<View style={{ marginTop: 12 }}>
						<Button
							title="Logout"
							onPress={async () => {
								await logout();
								router.replace('/(tabs)/auth');
							}}
						/>
					</View>
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
	button: {
		marginTop: 20,
		width: '60%',
	},
	note: {
		marginTop: 12,
		color: 'gray',
	},
});
