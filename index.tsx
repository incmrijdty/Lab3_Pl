import { useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { useFonts } from 'expo-font';
import { useAudioPlayer } from 'expo-audio';
import { Cinzel_400Regular, Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Hero, type HeroClass } from './hero';

const CLASSES = ['Wojownik', 'Paladyn', 'Czarodziej'] as const;
const CLASS_PORTRAITS: Record<HeroClass, ImageSourcePropType> = {
  Wojownik: require('./assets/images/warrior.jpg'),
  Paladyn: require('./assets/images/paladin.jpg'),
  Czarodziej: require('./assets/images/wizard.jpg'),
};
const STAT_NAMES = [
  { key: 'strength', label: 'Siła', icon: require('./assets/icons/sword.png') },
  { key: 'endurance', label: 'Wytrzymałość', icon: require('./assets/icons/shield.png') },
  { key: 'agility', label: 'Zwinność', icon: require('./assets/icons/agility.png') },
  { key: 'magic', label: 'Magia', icon: require('./assets/icons/magic.png') },
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

export default function MainScreen() {
  const [fontsLoaded] = useFonts({
    Cinzel_400Regular,
    Cinzel_700Bold,
  });
  const soundPlayer = useAudioPlayer(require('./assets/ui-tick.wav'));
  const [name, setName] = useState('');
  const [heroClass, setHeroClass] = useState<(typeof CLASSES)[number]>('Wojownik');
  const [stats, setStats] = useState<Stats>(INITIAL_STATS);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [classPickerVisible, setClassPickerVisible] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [createdHero, setCreatedHero] = useState<Hero | null>(null);

  const heroPortrait = imageUri ? { uri: imageUri } : CLASS_PORTRAITS[heroClass];

  function playInteractionSound() {
    soundPlayer.seekTo(0);
    soundPlayer.play();
  }

  const playSoundOnPress = Platform.OS === 'web' ? undefined : playInteractionSound;

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

  function createHero() {
    if (!canGenerate) return;

    setCreatedHero(new Hero(
      name.trim(),
      heroClass,
      stats.strength,
      stats.endurance,
      stats.agility,
      stats.magic,
      imageUri,
    ));
    setSummaryVisible(false);
  }

  function createAnotherHero() {
    setCreatedHero(null);
    setName('');
    setHeroClass('Wojownik');
    setStats(INITIAL_STATS);
    setImageUri(null);
  }

  if (createdHero) {
    return (
      <View style={styles.screen}>
        <ImageBackground
          pointerEvents="none"
          source={require('./assets/images/stone-wall.avif')}
          resizeMode="cover"
          style={styles.wallTextureFrame}
          imageStyle={styles.wallTexture}
        />
        <View pointerEvents="none" style={styles.backgroundShade} />
        <ScrollView contentContainerStyle={styles.generatedContent}>
          <Text style={styles.headerSigil}>✦  ✧  ✦</Text>
          <Text style={[styles.eyebrow, fontsLoaded && styles.decorativeFont]}>
            GILDIA POSZUKIWACZY
          </Text>
          <Text style={[styles.title, fontsLoaded && styles.titleFont]}>Legenda się zaczyna</Text>
          <Text style={[styles.subtitle, fontsLoaded && styles.readingFont]}>
            Bohater dołączył do kronik królestwa
          </Text>
          <View style={styles.castleFrame}>
            <Image
              accessibilityLabel="Zamek o zachodzie słońca"
              source={require('./assets/images/castle-banner.jpg')}
              resizeMode="cover"
              style={styles.castleBanner}
            />
          </View>
          <View style={styles.generatedCard}>
            <Image
              source={
                createdHero.imageUri
                  ? { uri: createdHero.imageUri }
                  : CLASS_PORTRAITS[createdHero.klasa]
              }
              resizeMode="cover"
              style={styles.generatedPortrait}
            />
            <Text style={[styles.summaryName, fontsLoaded && styles.titleFont]}>
              {createdHero.imie}
            </Text>
            <Text style={[styles.summaryClass, fontsLoaded && styles.decorativeFont]}>
              {createdHero.klasa.toUpperCase()}
            </Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatLabel}>Siła</Text>
                <Text style={styles.summaryStatValue}>{createdHero.siła}</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatLabel}>Wytrzymałość</Text>
                <Text style={styles.summaryStatValue}>{createdHero.wytrzymałość}</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatLabel}>Zwinność</Text>
                <Text style={styles.summaryStatValue}>{createdHero.zwinność}</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatLabel}>Magia</Text>
                <Text style={styles.summaryStatValue}>{createdHero.magia}</Text>
              </View>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            onHoverIn={playInteractionSound}
            onPressIn={playSoundOnPress}
            onPress={createAnotherHero}
            style={styles.generateButton}
          >
            <Text style={styles.generateButtonText}>STWÓRZ KOLEJNEGO BOHATERA</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onHoverIn={playInteractionSound}
            onPressIn={playSoundOnPress}
            onPress={() => setCreatedHero(null)}
            style={styles.editButton}
          >
            <Text style={styles.closeButtonText}>WRÓĆ DO EDYCJI TEJ POSTACI</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ImageBackground
        pointerEvents="none"
        source={require('./assets/images/stone-wall.avif')}
        resizeMode="cover"
        style={styles.wallTextureFrame}
        imageStyle={styles.wallTexture}
      />
      <View pointerEvents="none" style={styles.backgroundShade} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.headerSigil}>✦  ✧  ✦</Text>
        <Text style={[styles.eyebrow, fontsLoaded && styles.decorativeFont]}>
          GILDIA POSZUKIWACZY
        </Text>
        <Text style={[styles.title, fontsLoaded && styles.titleFont]}>Księga Bohaterów</Text>
        <Text style={[styles.subtitle, fontsLoaded && styles.readingFont]}>
          Zapisz swe imię w kronikach królestwa
        </Text>
        <View style={styles.castleFrame}>
          <Image
            accessibilityLabel="Zamek o zachodzie słońca"
            source={require('./assets/images/castle-banner.jpg')}
            resizeMode="cover"
            style={styles.castleBanner}
          />
        </View>

        <View style={styles.card}>
          <Text style={[styles.sectionTitle, fontsLoaded && styles.decorativeFont]}>
            ✦ DANE BOHATERA ✦
          </Text>
          <Text style={styles.label}>IMIĘ</Text>
          <TextInput
            accessibilityLabel="Imię bohatera"
            onFocus={playInteractionSound}
            onChangeText={setName}
            placeholder="Wpisz imię bohatera"
            placeholderTextColor="#795539"
            style={styles.input}
            value={name}
            maxLength={24}
          />

          <Text style={[styles.label, styles.spacedLabel]}>KLASA</Text>
          <Pressable
            accessibilityLabel={imageUri ? 'Zmień portret bohatera' : 'Wybierz portret bohatera'}
            accessibilityRole="button"
            onHoverIn={playInteractionSound}
            onPressIn={playSoundOnPress}
            onPress={() => setClassPickerVisible(true)}
            style={styles.select}
          >
            <Text style={styles.selectText}>{heroClass}</Text>
            <Text style={styles.chevron}>⌄</Text>
          </Pressable>

          <Text style={[styles.label, styles.spacedLabel]}>PORTRET BOHATERA</Text>
          <Pressable
            accessibilityRole="button"
            onHoverIn={playInteractionSound}
            onPressIn={playSoundOnPress}
            onPress={chooseImage}
            style={styles.imagePicker}
          >
            <View style={styles.portraitFrame}>
              <Image source={heroPortrait} resizeMode="cover" style={styles.portrait} />
            </View>
            <View style={styles.imagePickerCopy}>
              <Text style={[styles.portraitHint, fontsLoaded && styles.decorativeFont]}>
                {imageUri ? 'Portret bohatera' : 'Wybierz portret'}
              </Text>
              <Text style={styles.imageButtonText}>WYBIERZ Z GALERII  ›</Text>
              {imageUri ? <Text style={styles.changeImageHint}>Dotknij, aby zmienić</Text> : null}
            </View>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.pointsHeader}>
            <View>
              <Text style={[styles.sectionTitle, fontsLoaded && styles.decorativeFont]}>
                ✦ CECHY POSTACI ✦
              </Text>
              <Text style={styles.helper}>Rozdziel 10 punktów między atrybuty</Text>
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
              <Image source={icon} resizeMode="contain" style={styles.statIcon} />
              <Text style={styles.statName}>{label}</Text>
              <Pressable
                accessibilityLabel={`Zmniejsz ${label}`}
                accessibilityRole="button"
                disabled={stats[key] === 0}
                onHoverIn={playInteractionSound}
                onPressIn={playSoundOnPress}
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
                onHoverIn={playInteractionSound}
                onPressIn={playSoundOnPress}
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
          onHoverIn={playInteractionSound}
          onPressIn={playSoundOnPress}
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
                onHoverIn={playInteractionSound}
                onPressIn={playSoundOnPress}
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
            <Image source={heroPortrait} resizeMode="cover" style={styles.summaryPortrait} />
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
              onHoverIn={playInteractionSound}
              onPressIn={playSoundOnPress}
              onPress={createHero}
              style={styles.generateButton}
            >
              <Text style={styles.generateButtonText}>UTWÓRZ BOHATERA</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onHoverIn={playInteractionSound}
              onPressIn={playSoundOnPress}
              onPress={() => setSummaryVisible(false)}
              style={styles.editButton}
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
    backgroundColor: '#222326',
  },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    padding: 22,
    paddingTop: 38,
    paddingBottom: 48,
  },
  generatedContent: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    padding: 22,
    paddingTop: 38,
    paddingBottom: 48,
  },
  generatedCard: {
    alignItems: 'center',
    backgroundColor: '#a95c2e',
    borderColor: '#171512',
    borderWidth: 3,
    borderRadius: 3,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  generatedPortrait: {
    width: 132,
    height: 132,
    borderRadius: 2,
    marginTop: 4,
    marginBottom: 15,
    borderColor: '#e4bb75',
    borderWidth: 3,
  },
  wallTexture: {
    opacity: 0.44,
  },
  wallTextureFrame: {
    position: 'absolute',
    top: '-20%',
    left: '-20%',
    width: '140%',
    height: '140%',
  },
  backgroundShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(24, 19, 17, 0.66)',
  },
  castleFrame: {
    borderWidth: 2,
    borderColor: '#d9a64e',
    backgroundColor: '#30231e',
    padding: 3,
    marginTop: -7,
    marginBottom: 18,
  },
  castleBanner: {
    width: '100%',
    height: 112,
  },
  editButton: {
    width: '100%',
    backgroundColor: '#433029',
    borderColor: '#bd8544',
    borderWidth: 2,
    borderRadius: 3,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 10,
  },
  headerSigil: {
    color: '#dfad5d',
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 6,
    marginBottom: 9,
  },
  decorativeFont: {
    fontFamily: 'Cinzel_700Bold',
  },
  titleFont: {
    fontFamily: 'Cinzel_700Bold',
  },
  readingFont: {
    fontFamily: 'Cinzel_400Regular',
  },
  eyebrow: {
    color: '#d9a64e',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
  },
  title: {
    color: '#efd49a',
    fontSize: 34,
    fontWeight: '700',
    fontFamily: 'Georgia',
    textAlign: 'center',
    marginTop: 10,
  },
  subtitle: {
    color: '#b8aa91',
    fontSize: 14,
    fontFamily: 'Georgia',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#a85b2e',
    borderColor: '#171512',
    borderWidth: 3,
    borderRadius: 3,
    padding: 18,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  sectionTitle: {
    color: '#f1d89e',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 15,
    textAlign: 'center',
  },
  label: {
    color: '#f0d7a4',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  spacedLabel: {
    marginTop: 17,
  },
  input: {
    backgroundColor: '#e4b975',
    borderColor: '#492819',
    borderWidth: 2,
    borderRadius: 2,
    color: '#291c15',
    fontSize: 15,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  select: {
    backgroundColor: '#e4b975',
    borderColor: '#492819',
    borderWidth: 2,
    borderRadius: 2,
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    color: '#291c15',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Georgia',
  },
  chevron: {
    color: '#572a19',
    fontSize: 20,
  },
  imagePicker: {
    width: '100%',
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#713b27',
    borderColor: '#e0b56c',
    borderRadius: 2,
    borderWidth: 2,
    padding: 9,
  },
  portraitFrame: {
    width: 82,
    height: 92,
    flexShrink: 0,
    overflow: 'hidden',
    backgroundColor: '#402b25',
    borderColor: '#efcc85',
    borderWidth: 2,
  },
  imagePickerCopy: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 12,
    alignItems: 'flex-start',
  },
  portrait: {
    width: '100%',
    height: '100%',
  },
  portraitHint: {
    color: '#e5c88f',
    fontSize: 11,
    flexShrink: 1,
  },
  imageButtonText: {
    color: '#f0d18a',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 9,
  },
  changeImageHint: {
    color: '#d5b986',
    fontSize: 9,
    marginTop: 5,
  },
  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  helper: {
    color: '#f0d7a4',
    fontSize: 11,
    marginTop: -7,
    marginBottom: 13,
  },
  remainingBadge: {
    minWidth: 68,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: '#40291f',
    backgroundColor: '#38503a',
    alignItems: 'center',
    padding: 8,
  },
  remainingBadgeLow: {
    backgroundColor: '#733526',
  },
  remainingCount: {
    color: '#ffe2a4',
    fontSize: 21,
    fontWeight: '700',
  },
  remainingLabel: {
    color: '#f1d7a5',
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginTop: 2,
  },
  progressTrack: {
    height: 10,
    marginTop: 12,
    backgroundColor: '#4a2c20',
    borderRadius: 1,
    borderWidth: 1,
    borderColor: '#2c1b15',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#86a553',
    borderRadius: 1,
  },
  progressFillLow: {
    backgroundColor: '#df6844',
  },
  progressCaption: {
    color: '#f0d7a4',
    fontSize: 10,
    marginTop: 6,
    marginBottom: 12,
    textAlign: 'right',
  },
  statRow: {
    minHeight: 48,
    borderTopColor: '#522c20',
    borderTopWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7c3e28',
    paddingHorizontal: 6,
  },
  statIcon: {
    width: 30,
    height: 30,
    marginHorizontal: 1,
    padding: 3,
    borderWidth: 1,
    borderColor: '#e0b66c',
    backgroundColor: '#472b22',
    borderRadius: 2,
  },
  statName: {
    color: '#f3dfb7',
    fontSize: 14,
    flex: 1,
    paddingLeft: 8,
  },
  stepButton: {
    width: 32,
    height: 32,
    borderColor: '#e0b66c',
    borderWidth: 2,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#472b22',
  },
  stepButtonDisabled: {
    opacity: 0.38,
  },
  stepButtonText: {
    color: '#f5d389',
    fontSize: 20,
    lineHeight: 23,
  },
  statValue: {
    color: '#ffe3a7',
    width: 39,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
  },
  generateButton: {
    minHeight: 54,
    backgroundColor: '#9a3925',
    borderColor: '#e3b764',
    borderWidth: 3,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 3,
  },
  generateButtonDisabled: {
    backgroundColor: '#49413a',
    borderColor: '#76654a',
    opacity: 0.65,
  },
  generateButtonText: {
    color: '#ffe8b7',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  generateArrow: {
    color: '#ffe8b7',
    fontSize: 17,
    marginLeft: 10,
  },
  validation: {
    color: '#e0cfac',
    textAlign: 'center',
    fontSize: 11,
    marginTop: 10,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,8,7,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#873f27',
    borderColor: '#1d1712',
    borderWidth: 3,
    borderRadius: 2,
    padding: 22,
  },
  dialogTitle: {
    color: '#f1d89e',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  classOption: {
    borderTopColor: '#562c20',
    borderTopWidth: 2,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  classOptionText: {
    color: '#f3dfb7',
    fontSize: 16,
    fontFamily: 'Georgia',
  },
  classOptionMark: {
    color: '#f0c46e',
    fontSize: 16,
  },
  summaryDialog: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    backgroundColor: '#a95c2e',
    borderColor: '#171512',
    borderWidth: 3,
    borderRadius: 2,
    padding: 24,
  },
  summaryPortrait: {
    width: 116,
    height: 116,
    borderRadius: 2,
    marginTop: 18,
    marginBottom: 15,
    borderColor: '#efcc85',
    borderWidth: 3,
  },
  summaryName: {
    color: '#fff0cf',
    fontSize: 27,
    fontWeight: '700',
    fontFamily: 'Georgia',
  },
  summaryClass: {
    color: '#f3d28a',
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
    borderTopColor: '#713b27',
    borderTopWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  summaryStatLabel: {
    color: '#f3dfb7',
    fontSize: 14,
  },
  summaryStatValue: {
    color: '#ffe3a7',
    fontSize: 14,
    fontWeight: '700',
  },
  closeButton: {
    width: '100%',
    backgroundColor: '#433029',
    borderColor: '#bd8544',
    borderWidth: 2,
    borderRadius: 2,
    paddingVertical: 13,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#f3d28a',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
});
