import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { AuthContext } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
	const router = useRouter();
	const { user, loading, logout } = useContext(AuthContext);
	const [timeLeft, setTimeLeft] = useState('');

	// Calculate time until next BeReal (simulating daily notification)
	useEffect(() => {
		const calculateTimeLeft = () => {
			const now = new Date();
			const tomorrow = new Date();
			tomorrow.setDate(now.getDate() + 1);
			tomorrow.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
			
			const diff = tomorrow.getTime() - now.getTime();
			const hours = Math.floor(diff / (1000 * 60 * 60));
			const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
			
			setTimeLeft(`${hours}h ${minutes}m`);
		};

		calculateTimeLeft();
		const interval = setInterval(calculateTimeLeft, 60000); // Update every minute
		return () => clearInterval(interval);
	}, []);

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#000" />
			</View>
		);
	}

	if (!user) {
		return (
			<View style={styles.container}>
				<Text style={styles.welcomeTitle}>BeReal.</Text>
				<Text style={styles.welcomeSubtitle}>Your daily dose of real life</Text>
				<Text style={styles.subtitle}>Please sign in to share authentic moments</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.appTitle}>BeReal.</Text>
				<TouchableOpacity onPress={() => router.push('/(tabs)/profile' as any)} style={styles.profileButton}>
					<Text style={styles.profileText}>{user.username.charAt(0).toUpperCase()}</Text>
				</TouchableOpacity>
			</View>

			<View style={styles.mainContent}>
				<View style={styles.notificationCard}>
					<Text style={styles.notificationTitle}>⏰ Time to BeReal.</Text>
					<Text style={styles.notificationSubtitle}>2 min left to capture a BeReal and see what your friends are up to!</Text>
					<Text style={styles.timeLeft}>Next BeReal in {timeLeft}</Text>
				</View>

				<Link href="/take-photo" asChild>
					<TouchableOpacity 
						style={styles.cameraButton}
						onPress={() => {
							console.log('BeReal button pressed via Link');
						}}
					>
						<View style={styles.cameraButtonInner}>
							<Text style={styles.cameraButtonText}>📸</Text>
						</View>
						<Text style={styles.cameraButtonLabel}>Tap to BeReal</Text>
					</TouchableOpacity>
				</Link>


				<Text style={styles.motivationText}>
					Capture your authentic moment and see what your friends are really up to
				</Text>
			</View>

			<View style={styles.footer}>
				<View style={styles.navigationRow}>
					<TouchableOpacity 
						style={styles.navButton}
						onPress={() => router.push('/(tabs)/feed')}
					>
						<Text style={styles.navButtonEmoji}>📱</Text>
						<Text style={styles.navButtonText}>Feed</Text>
					</TouchableOpacity>
					<TouchableOpacity 
						style={styles.navButton}
						onPress={() => router.push('/(tabs)/friends' as any)}
					>
						<Text style={styles.navButtonEmoji}>👥</Text>
						<Text style={styles.navButtonText}>Friends</Text>
					</TouchableOpacity>
					<TouchableOpacity 
						style={styles.navButton}
						onPress={() => router.push('/(tabs)/explore')}
					>
						<Text style={styles.navButtonEmoji}>🌍</Text>
						<Text style={styles.navButtonText}>Explore</Text>
					</TouchableOpacity>
				</View>
				<TouchableOpacity 
					style={styles.logoutButton}
					onPress={async () => {
						await logout();
						router.replace('/(tabs)/auth');
					}}
				>
					<Text style={styles.logoutText}>Logout</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000',
		paddingTop: 60,
	},
	loadingContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#000',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		marginBottom: 40,
	},
	appTitle: {
		fontSize: 28,
		fontWeight: '800',
		color: '#fff',
	},
	profileButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
	},
	profileText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#000',
	},
	mainContent: {
		flex: 1,
		alignItems: 'center',
		paddingHorizontal: 20,
	},
	notificationCard: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 20,
		marginBottom: 40,
		width: width - 40,
		alignItems: 'center',
	},
	notificationTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 8,
		textAlign: 'center',
	},
	notificationSubtitle: {
		fontSize: 16,
		color: '#666',
		textAlign: 'center',
		marginBottom: 12,
	},
	timeLeft: {
		fontSize: 14,
		color: '#999',
		fontWeight: '500',
	},
	cameraButton: {
		alignItems: 'center',
		marginBottom: 30,
	},
	cameraButtonInner: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 8,
	},
	cameraButtonText: {
		fontSize: 32,
	},
	cameraButtonLabel: {
		fontSize: 16,
		color: '#fff',
		fontWeight: '600',
	},
	motivationText: {
		fontSize: 14,
		color: '#ccc',
		textAlign: 'center',
		lineHeight: 20,
		maxWidth: 280,
	},
	footer: {
		paddingHorizontal: 20,
		paddingBottom: 40,
		gap: 16,
	},
	navigationRow: {
		flexDirection: 'row',
		gap: 12,
	},
	navButton: {
		flex: 1,
		backgroundColor: '#333',
		borderRadius: 12,
		paddingVertical: 16,
		alignItems: 'center',
	},
	navButtonEmoji: {
		fontSize: 24,
		marginBottom: 4,
	},
	navButtonText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '600',
	},
	logoutButton: {
		alignItems: 'center',
		paddingVertical: 8,
	},
	logoutText: {
		color: '#666',
		fontSize: 14,
	},
	debugButton: {
		backgroundColor: '#ff4444',
		borderRadius: 8,
		paddingHorizontal: 20,
		paddingVertical: 8,
		marginTop: 10,
		alignSelf: 'center',
	},
	debugButtonText: {
		color: '#fff',
		fontSize: 12,
		fontWeight: '600',
	},
	welcomeTitle: {
		fontSize: 36,
		fontWeight: '800',
		color: '#fff',
		marginBottom: 12,
		textAlign: 'center',
	},
	welcomeSubtitle: {
		fontSize: 18,
		color: '#ccc',
		marginBottom: 8,
		textAlign: 'center',
	},
	subtitle: {
		fontSize: 16,
		color: '#666',
		textAlign: 'center',
	},
});
