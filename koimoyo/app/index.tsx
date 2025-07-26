import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const [seen, setSeen] = useState<boolean | null>(null);

  useEffect(() => {
    const checkIntro = async () => {
      try {
        const value = await AsyncStorage.getItem('INTRO_SEEN');
        setSeen(value === 'true');
      } catch (error) {
        console.error('Error checking intro status:', error);
        setSeen(false);
      }
    };
    checkIntro();
  }, []);

  if (seen === null) return null;

  return <Redirect href={seen ? '/(tabs)' : '/intro'} />;
}
