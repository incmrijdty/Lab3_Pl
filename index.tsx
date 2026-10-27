import { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

const CLASSES = ['Wojownik', 'Paladyn', 'Czarodziej'] as const;
const STAT_NAMES = [
  { key: 'strength', label: 'Siła', icon: '⚔' },
  { key: 'endurance', label: 'Wytrzymałość', icon: '⬟' },
  { key: 'agility', label: 'Zwinność', icon: '➶' },
  { key: 'magic', label: 'Magia', icon: '✧' },
] as const;
const POINTS_TO_SPEND = 10;

type StatKey = (typeof STAT_NAMES)[number]['key'];
type Stats = Record<StatKey, number>;

const INITIAL_STATS: Stats = {
  strength: 0,
  endurance: 0,
  agility: 0,
  magic: 0,
};

function playHoverSound() {
  if (typeof AudioContext === 'undefined') return;

  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = 660;
  gain.gain.setValueAtTime(0.045, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.07);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.07);
  oscillator.onended = () => {
    void context.close();
  };
}

export default function MainScreen() {
  const [name, setName] = useState('');
  const [heroClass, setHeroClass] = useState<(typeof CLASSES)[number]>('Wojownik');
  const [stats, setStats] = useState<Stats>(INITIAL_STATS);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [classPickerVisible, setClassPickerVisible] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(false);

  const spentPoints = Object.values(stats).reduce((total, value) => total + value, 0);
  const remainingPoints = POINTS_TO_SPEND - spentPoints;
  const canGenerate = name.trim().length > 0 && remainingPoints === 0;

  function changeStat(stat: StatKey, change: number) {
    const nextValue = stats[stat] + change;
    if (nextValue < 0 || (change > 0 && remainingPoints === 0)) return;

    setStats((current) => ({ ...current, [stat]: current[stat] + change }));
    void Haptics.selectionAsync();
  }

  async function chooseImage() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Brak dostępu do galerii',
          'Zezwól aplikacji na dostęp do zdjęć, aby wybrać portret bohatera.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(
        'Nie udało się wybrać obrazka',
        error instanceof Error ? error.message : 'Spróbuj ponownie.',
      );
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>KRONIKI ZAPOMNIANEGO KRÓLESTWA</Text>
        <Text style={styles.title}>Stwórz bohatera</Text>
        <Text style={styles.subtitle}>Przygotuj się na przygodę</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>DANE BOHATERA</Text>
          <Text style={styles.label}>IMIĘ</Text>
          <TextInput
            accessibilityLabel="Imię bohatera"
            onFocus={playHoverSound}
            onChangeText={setName}
            placeholder="Wpisz imię bohatera"
            placeholderTextColor="#8f8878"
            style={styles.input}
            value={name}
            maxLength={24}
          />

          <Text style={[styles.label, styles.spacedLabel]}>KLASA</Text>
          <Pressable
            accessibilityRole="button"
            onHoverIn={playHoverSound}
            onPressIn={playHoverSound}
            onPress={() => setClassPickerVisible(true)}
            style={styles.select}
          >
            <Text style={styles.selectText}>{heroClass}</Text>
            <Text style={styles.chevron}>⌄</Text>
          </Pressable>

          <Text style={[styles.label, styles.spacedLabel]}>PORTRET</Text>
          <Pressable
            accessibilityRole="button"
            onHoverIn={playHoverSound}
            onPressIn={playHoverSound}
            onPress={chooseImage}
            style={styles.imagePicker}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.portrait} />
            ) : (
              <View style={styles.portraitPlaceholder}>
                <Text style={styles.portraitIcon}>♙</Text>
                <Text style={styles.portraitHint}>Wybierz obraz postaci</Text>
              </View>
            )}
            <Text style={styles.imageButtonText}>WYBIERZ Z GALERII</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.pointsHeader}>
            <View>
              <Text style={styles.sectionTitle}>ATRYBUTY</Text>
              <Text style={styles.helper}>Rozdziel punkty według własnego uznania</Text>
            </View>
            <View style={[styles.remainingBadge, remainingPoints <= 2 && styles.remainingBadgeLow]}>
              <Text style={styles.remainingCount}>{remainingPoints}</Text>
              <Text style={styles.remainingLabel}>POZOSTAŁO</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${(spentPoints / POINTS_TO_SPEND) * 100}%` },
                remainingPoints <= 2 && styles.progressFillLow,
              ]}
            />
          </View>
          <Text style={styles.progressCaption}>
            {spentPoints} / {POINTS_TO_SPEND} punktów rozdanych
          </Text>

          {STAT_NAMES.map(({ key, label, icon }) => (
            <View key={key} style={styles.statRow}>
              <Text style={styles.statIcon}>{icon}</Text>
              <Text style={styles.statName}>{label}</Text>
              <Pressable
                accessibilityLabel={`Zmniejsz ${label}`}
                accessibilityRole="button"
                disabled={stats[key] === 0}
                onHoverIn={playHoverSound}
                onPressIn={playHoverSound}
                onPress={() => changeStat(key, -1)}
                style={[styles.stepButton, stats[key] === 0 && styles.stepButtonDisabled]}
              >
                <Text style={styles.stepButtonText}>−</Text>
              </Pressable>
              <Text style={styles.statValue}>{stats[key]}</Text>
              <Pressable
                accessibilityLabel={`Zwiększ ${label}`}
                accessibilityRole="button"
                disabled={remainingPoints === 0}
                onHoverIn={playHoverSound}
                onPressIn={playHoverSound}
                onPress={() => changeStat(key, 1)}
                style={[styles.stepButton, remainingPoints === 0 && styles.stepButtonDisabled]}
              >
                <Text style={styles.stepButtonText}>+</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canGenerate }}
          disabled={!canGenerate}
          onHoverIn={playHoverSound}
          onPressIn={playHoverSound}
          onPress={() => setSummaryVisible(true)}
          style={[styles.generateButton, !canGenerate && styles.generateButtonDisabled]}
        >
          <Text style={styles.generateButtonText}>GENERUJ BOHATERA</Text>
          <Text style={styles.generateArrow}>➜</Text>
        </Pressable>
        {!canGenerate && (
          <Text style={styles.validation}>
            {!name.trim() ? 'Wpisz imię' : `Rozdaj jeszcze ${remainingPoints} pkt`}
          </Text>
        )}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={classPickerVisible}
        onRequestClose={() => setClassPickerVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setClassPickerVisible(false)}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>WYBIERZ KLASĘ</Text>
            {CLASSES.map((option) => (
              <Pressable
                key={option}
                onHoverIn={playHoverSound}
                onPress={() => {
                  setHeroClass(option);
                  setClassPickerVisible(false);
                }}
                style={styles.classOption}
              >
                <Text style={styles.classOptionText}>{option}</Text>
                <Text style={styles.classOptionMark}>{heroClass === option ? '✦' : ''}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={summaryVisible}
        onRequestClose={() => setSummaryVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.summaryDialog}>
            <Text style={styles.eyebrow}>KARTA POSTACI</Text>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.summaryPortrait} />
            ) : (
              <View style={[styles.summaryPortrait, styles.summaryPortraitPlaceholder]}>
                <Text style={styles.summaryPortraitIcon}>♙</Text>
              </View>
            )}
            <Text style={styles.summaryName}>{name.trim()}</Text>
            <Text style={styles.summaryClass}>{heroClass.toUpperCase()}</Text>
            <View style={styles.summaryStats}>
              {STAT_NAMES.map(({ key, label }) => (
                <View key={key} style={styles.summaryStat}>
                  <Text style={styles.summaryStatLabel}>{label}</Text>
                  <Text style={styles.summaryStatValue}>{stats[key]}</Text>
                </View>
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSummaryVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>WRÓĆ DO EDYCJI</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#171914',
  },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    padding: 22,
    paddingTop: 38,
    paddingBottom: 48,
  },
  eyebrow: {
    color: '#b59a61',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.4,
    textAlign: 'center',
  },
  title: {
    color: '#f0e5c7',
    fontSize: 34,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
  },
  subtitle: {
    color: '#9e9a8d',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#23251f',
    borderColor: '#494433',
    borderWidth: 1,
    borderRadius: 12,
    padding: 18,
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#d3b874',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 15,
  },
  label: {
    color: '#aaa594',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  spacedLabel: {
    marginTop: 17,
  },
  input: {
    backgroundColor: '#191b17',
    borderColor: '#464336',
    borderWidth: 1,
    borderRadius: 7,
    color: '#f0e5c7',
    fontSize: 15,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  select: {
    backgroundColor: '#191b17',
    borderColor: '#464336',
    borderWidth: 1,
    borderRadius: 7,
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    color: '#f0e5c7',
    fontSize: 15,
  },
  chevron: {
    color: '#d3b874',
    fontSize: 20,
  },
  imagePicker: {
    alignItems: 'center',
    backgroundColor: '#191b17',
    borderColor: '#464336',
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    padding: 13,
  },
  portrait: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  portraitPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#302e25',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  portraitIcon: {
    color: '#b59a61',
    fontSize: 42,
  },
  portraitHint: {
    color: '#aaa594',
    fontSize: 12,
    marginTop: 4,
  },
  imageButtonText: {
    color: '#d3b874',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  helper: {
    color: '#9e9a8d',
    fontSize: 11,
    marginTop: -7,
    marginBottom: 13,
  },
  remainingBadge: {
    minWidth: 68,
    borderRadius: 8,
    backgroundColor: '#253b2b',
    alignItems: 'center',
    padding: 8,
  },
  remainingBadgeLow: {
    backgroundColor: '#512d28',
  },
  remainingCount: {
    color: '#e8d8a8',
    fontSize: 21,
    fontWeight: '700',
  },
  remainingLabel: {
    color: '#c4b99e',
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginTop: 2,
  },
  progressTrack: {
    height: 7,
    backgroundColor: '#414139',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#79a66b',
    borderRadius: 5,
  },
  progressFillLow: {
    backgroundColor: '#c16b57',
  },
  progressCaption: {
    color: '#9e9a8d',
    fontSize: 10,
    marginTop: 6,
    marginBottom: 12,
    textAlign: 'right',
  },
  statRow: {
    minHeight: 48,
    borderTopColor: '#393a32',
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    color: '#c9aa63',
    width: 27,
    fontSize: 18,
    textAlign: 'center',
  },
  statName: {
    color: '#e1ddcf',
    fontSize: 14,
    flex: 1,
    paddingLeft: 8,
  },
  stepButton: {
    width: 32,
    height: 32,
    borderColor: '#655b40',
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2b2c25',
  },
  stepButtonDisabled: {
    opacity: 0.38,
  },
  stepButtonText: {
    color: '#e3ce94',
    fontSize: 20,
    lineHeight: 23,
  },
  statValue: {
    color: '#f1e4c1',
    width: 39,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
  },
  generateButton: {
    minHeight: 54,
    backgroundColor: '#a77b32',
    borderColor: '#d0ae68',
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 3,
  },
  generateButtonDisabled: {
    backgroundColor: '#464337',
    borderColor: '#625d4c',
    opacity: 0.65,
  },
  generateButtonText: {
    color: '#fff3d4',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  generateArrow: {
    color: '#fff3d4',
    fontSize: 17,
    marginLeft: 10,
  },
  validation: {
    color: '#aaa594',
    textAlign: 'center',
    fontSize: 11,
    marginTop: 10,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#23251f',
    borderColor: '#645638',
    borderWidth: 1,
    borderRadius: 12,
    padding: 22,
  },
  dialogTitle: {
    color: '#d3b874',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  classOption: {
    borderTopColor: '#393a32',
    borderTopWidth: 1,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  classOptionText: {
    color: '#f0e5c7',
    fontSize: 16,
  },
  classOptionMark: {
    color: '#d3b874',
    fontSize: 16,
  },
  summaryDialog: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    backgroundColor: '#23251f',
    borderColor: '#645638',
    borderWidth: 1,
    borderRadius: 14,
    padding: 24,
  },
  summaryPortrait: {
    width: 116,
    height: 116,
    borderRadius: 58,
    marginTop: 18,
    marginBottom: 15,
    borderColor: '#b59a61',
    borderWidth: 2,
  },
  summaryPortraitPlaceholder: {
    backgroundColor: '#302e25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryPortraitIcon: {
    color: '#b59a61',
    fontSize: 55,
  },
  summaryName: {
    color: '#f0e5c7',
    fontSize: 27,
    fontWeight: '700',
  },
  summaryClass: {
    color: '#d3b874',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 5,
  },
  summaryStats: {
    width: '100%',
    marginTop: 22,
    marginBottom: 22,
  },
  summaryStat: {
    borderTopColor: '#393a32',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  summaryStatLabel: {
    color: '#c4c0b3',
    fontSize: 14,
  },
  summaryStatValue: {
    color: '#f0e5c7',
    fontSize: 14,
    fontWeight: '700',
  },
  closeButton: {
    width: '100%',
    backgroundColor: '#39382e',
    borderColor: '#645638',
    borderWidth: 1,
    borderRadius: 7,
    paddingVertical: 13,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#e2d1a2',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
});
