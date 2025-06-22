import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Alert,
  Switch,
  TextInput,
} from 'react-native';
import Sound from 'react-native-sound';

// Enable playback in silence mode
Sound.setCategory('Playback');

const App = () => {
  const [sounds, setSounds] = useState({});
  const [loadStatus, setLoadStatus] = useState({});
  const [isPlaying, setIsPlaying] = useState({});
  const [volumes, setVolumes] = useState({});
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(true);
  const [searchLog, setSearchLog] = useState('');

  // All your sound files
  const soundList = [
    { key: 'buttonpress', file: 'buttonpress.mp3', name: 'Button Press', type: 'effect' },
    { key: 'correct', file: 'correct.mp3', name: 'Correct Answer', type: 'effect' },
    { key: 'incorrect', file: 'incorrect.mp3', name: 'Incorrect Answer', type: 'effect' },
    { key: 'streak', file: 'streak.mp3', name: 'Streak Sound', type: 'effect' },
    { key: 'menumusic', file: 'menumusic.mp3', name: 'Menu Music', type: 'music' },
    { key: 'gamemusic', file: 'gamemusic.mp3', name: 'Game Music', type: 'music' },
  ];

  // Logging function
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      time: timestamp,
      message,
      type, // 'info', 'success', 'error', 'warning'
    };
    setLogs(prev => [logEntry, ...prev].slice(0, 100)); // Keep last 100 logs
    console.log(`[${type.toUpperCase()}] ${timestamp}: ${message}`);
  };

  useEffect(() => {
    addLog('Audio Test App initialized', 'info');
    addLog('Loading all sound files...', 'info');
    loadSounds();

    // Cleanup
    return () => {
      addLog('Cleaning up sounds...', 'info');
      Object.values(sounds).forEach(sound => {
        if (sound) {
          sound.release();
        }
      });
    };
  }, []);

  const loadSounds = () => {
    let loadedCount = 0;
    let errorCount = 0;

    soundList.forEach(({ key, file, name }) => {
      addLog(`Attempting to load: ${file}`, 'info');
      setLoadStatus(prev => ({ ...prev, [key]: 'loading' }));
      
      // Load from the app bundle
      const sound = new Sound(file, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          errorCount++;
          addLog(`Failed to load ${file}: ${error.message}`, 'error');
          setLoadStatus(prev => ({ ...prev, [key]: 'error' }));
          
          // Try alternative loading method
          tryAlternativeLoad(key, file, name);
          return;
        }

        loadedCount++;
        const duration = sound.getDuration();
        addLog(`Successfully loaded ${file} (Duration: ${duration.toFixed(2)}s)`, 'success');
        
        setSounds(prev => ({ ...prev, [key]: sound }));
        setLoadStatus(prev => ({ ...prev, [key]: 'loaded' }));
        setVolumes(prev => ({ ...prev, [key]: 1.0 }));

        // Log detailed info
        addLog(`${name}: channels=${sound.getNumberOfChannels()}, volume=${sound.getVolume()}`, 'info');
      });
    });
  };

  const tryAlternativeLoad = (key, file, name) => {
    addLog(`Trying alternative load for ${file} (without extension)`, 'warning');
    
    const fileWithoutExt = file.replace('.mp3', '');
    const sound = new Sound(fileWithoutExt, Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        addLog(`Alternative load also failed for ${file}: ${error.message}`, 'error');
        setLoadStatus(prev => ({ ...prev, [key]: 'failed' }));
      } else {
        addLog(`Alternative load succeeded for ${file}!`, 'success');
        setSounds(prev => ({ ...prev, [key]: sound }));
        setLoadStatus(prev => ({ ...prev, [key]: 'loaded' }));
        setVolumes(prev => ({ ...prev, [key]: 1.0 }));
      }
    });
  };

  const playSound = (key, soundInfo) => {
    const sound = sounds[key];
    if (!sound) {
      addLog(`Cannot play ${soundInfo.name}: Sound not loaded`, 'error');
      Alert.alert('Error', 'Sound not loaded');
      return;
    }

    // Stop other music if this is music
    if (soundInfo.type === 'music') {
      soundList.forEach(({ key: otherKey, type }) => {
        if (type === 'music' && otherKey !== key && isPlaying[otherKey]) {
          stopSound(otherKey);
        }
      });
    }

    addLog(`Playing ${soundInfo.name}...`, 'info');
    setIsPlaying(prev => ({ ...prev, [key]: true }));

    // Set volume
    sound.setVolume(volumes[key] || 1.0);

    // For music, enable looping
    if (soundInfo.type === 'music') {
      sound.setNumberOfLoops(-1); // Infinite loop
      addLog(`Enabled looping for ${soundInfo.name}`, 'info');
    }

    sound.play((success) => {
      setIsPlaying(prev => ({ ...prev, [key]: false }));
      
      if (success) {
        addLog(`${soundInfo.name} finished playing successfully`, 'success');
      } else {
        addLog(`${soundInfo.name} playback failed!`, 'error');
        Alert.alert('Playback Error', `Failed to play ${soundInfo.name}`);
      }
    });
  };

  const stopSound = (key) => {
    const sound = sounds[key];
    if (sound) {
      sound.stop();
      sound.setNumberOfLoops(0); // Reset looping
      setIsPlaying(prev => ({ ...prev, [key]: false }));
      addLog(`Stopped ${key}`, 'info');
    }
  };

  const changeVolume = (key, value) => {
    const sound = sounds[key];
    if (sound) {
      sound.setVolume(value);
      setVolumes(prev => ({ ...prev, [key]: value }));
      addLog(`Set ${key} volume to ${(value * 100).toFixed(0)}%`, 'info');
    }
  };

  const stopAllSounds = () => {
    Object.keys(sounds).forEach(key => {
      if (isPlaying[key]) {
        stopSound(key);
      }
    });
    addLog('Stopped all sounds', 'warning');
  };

  const reloadAllSounds = () => {
    addLog('Reloading all sounds...', 'warning');
    
    // Release all sounds
    Object.values(sounds).forEach(sound => {
      if (sound) sound.release();
    });
    
    // Reset states
    setSounds({});
    setLoadStatus({});
    setIsPlaying({});
    setVolumes({});
    
    // Reload
    loadSounds();
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('Logs cleared', 'info');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'loaded': return '#4CAF50';
      case 'loading': return '#FFA500';
      case 'error': return '#F44336';
      case 'failed': return '#9E9E9E';
      default: return '#666';
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'warning': return '#FFA500';
      default: return '#666';
    }
  };

  const filteredLogs = logs.filter(log => 
    log.message.toLowerCase().includes(searchLog.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.title}>🎵 Audio Test & Debug App</Text>
        
        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Sound File Requirements:</Text>
          <Text style={styles.infoText}>• Location: android/app/src/main/res/raw/</Text>
          <Text style={styles.infoText}>• Format: MP3 files only</Text>
          <Text style={styles.infoText}>• Naming: lowercase, no spaces (e.g., buttonpress.mp3)</Text>
          <Text style={styles.infoText}>• Current sounds loaded: {Object.keys(sounds).length}/{soundList.length}</Text>
        </View>

        {/* Sound Effects Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔊 Sound Effects</Text>
          {soundList.filter(s => s.type === 'effect').map((soundInfo) => (
            <View key={soundInfo.key} style={styles.soundCard}>
              <View style={styles.soundHeader}>
                <Text style={styles.soundName}>{soundInfo.name}</Text>
                <Text style={[
                  styles.status,
                  { color: getStatusColor(loadStatus[soundInfo.key]) }
                ]}>
                  {loadStatus[soundInfo.key] === 'loaded' ? '✓ Ready' : 
                   loadStatus[soundInfo.key] === 'loading' ? '⏳ Loading' :
                   loadStatus[soundInfo.key] === 'error' ? '❌ Error' :
                   loadStatus[soundInfo.key] === 'failed' ? '❌ Failed' : '⭕ Not loaded'}
                </Text>
              </View>
              
              <View style={styles.soundControls}>
                <TouchableOpacity
                  style={[
                    styles.playButton,
                    { opacity: loadStatus[soundInfo.key] === 'loaded' ? 1 : 0.5 }
                  ]}
                  onPress={() => playSound(soundInfo.key, soundInfo)}
                  disabled={loadStatus[soundInfo.key] !== 'loaded'}
                >
                  <Text style={styles.buttonText}>
                    {isPlaying[soundInfo.key] ? '⏸ Playing' : '▶ Play'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Background Music Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎼 Background Music</Text>
          {soundList.filter(s => s.type === 'music').map((soundInfo) => (
            <View key={soundInfo.key} style={styles.soundCard}>
              <View style={styles.soundHeader}>
                <Text style={styles.soundName}>{soundInfo.name}</Text>
                <Text style={[
                  styles.status,
                  { color: getStatusColor(loadStatus[soundInfo.key]) }
                ]}>
                  {loadStatus[soundInfo.key] === 'loaded' ? '✓ Ready' : 
                   loadStatus[soundInfo.key] === 'loading' ? '⏳ Loading' :
                   loadStatus[soundInfo.key] === 'error' ? '❌ Error' :
                   loadStatus[soundInfo.key] === 'failed' ? '❌ Failed' : '⭕ Not loaded'}
                </Text>
              </View>
              
              <View style={styles.soundControls}>
                <TouchableOpacity
                  style={[
                    styles.playButton,
                    isPlaying[soundInfo.key] ? styles.stopButton : {},
                    { opacity: loadStatus[soundInfo.key] === 'loaded' ? 1 : 0.5 }
                  ]}
                  onPress={() => {
                    if (isPlaying[soundInfo.key]) {
                      stopSound(soundInfo.key);
                    } else {
                      playSound(soundInfo.key, soundInfo);
                    }
                  }}
                  disabled={loadStatus[soundInfo.key] !== 'loaded'}
                >
                  <Text style={styles.buttonText}>
                    {isPlaying[soundInfo.key] ? '⏹ Stop' : '▶ Play Loop'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Volume Control */}
              {loadStatus[soundInfo.key] === 'loaded' && (
                <View style={styles.volumeControl}>
                  <Text style={styles.volumeLabel}>Volume: {Math.round((volumes[soundInfo.key] || 1) * 100)}%</Text>
                  <View style={styles.volumeSlider}>
                    <TextInput
                      style={styles.volumeInput}
                      value={String(Math.round((volumes[soundInfo.key] || 1) * 100))}
                      onChangeText={(text) => {
                        const value = parseInt(text) || 0;
                        if (value >= 0 && value <= 100) {
                          changeVolume(soundInfo.key, value / 100);
                        }
                      }}
                      keyboardType="numeric"
                      maxLength={3}
                    />
                    <Text style={styles.volumeLabel}>%</Text>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Control Buttons */}
        <View style={styles.controlSection}>
          <TouchableOpacity style={[styles.controlButton, styles.stopAllButton]} onPress={stopAllSounds}>
            <Text style={styles.buttonText}>🛑 Stop All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlButton, styles.reloadButton]} onPress={reloadAllSounds}>
            <Text style={styles.buttonText}>🔄 Reload All</Text>
          </TouchableOpacity>
        </View>

        {/* Debug Console */}
        <View style={styles.debugSection}>
          <View style={styles.debugHeader}>
            <Text style={styles.sectionTitle}>🐛 Debug Console</Text>
            <View style={styles.debugControls}>
              <Text style={styles.logCount}>{filteredLogs.length} logs</Text>
              <Switch
                value={showLogs}
                onValueChange={setShowLogs}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={showLogs ? '#2196F3' : '#f4f3f4'}
              />
            </View>
          </View>

          {showLogs && (
            <>
              <TextInput
                style={styles.searchInput}
                placeholder="Search logs..."
                value={searchLog}
                onChangeText={setSearchLog}
              />
              
              <TouchableOpacity style={styles.clearLogsButton} onPress={clearLogs}>
                <Text style={styles.clearLogsText}>Clear Logs</Text>
              </TouchableOpacity>

              <ScrollView style={styles.logContainer} nestedScrollEnabled={true}>
                {filteredLogs.length === 0 ? (
                  <Text style={styles.noLogs}>No logs to display</Text>
                ) : (
                  filteredLogs.map((log, index) => (
                    <View key={index} style={styles.logEntry}>
                      <Text style={styles.logTime}>{log.time}</Text>
                      <Text style={[styles.logMessage, { color: getLogColor(log.type) }]}>
                        {log.message}
                      </Text>
                    </View>
                  ))
                )}
              </ScrollView>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    padding: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  infoSection: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    marginBottom: 4,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  soundCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  soundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  soundName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
  soundControls: {
    flexDirection: 'row',
    gap: 10,
  },
  playButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    flex: 1,
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  volumeControl: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  volumeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  volumeSlider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  volumeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    width: 60,
    textAlign: 'center',
    marginRight: 5,
  },
  controlSection: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    elevation: 2,
  },
  stopAllButton: {
    backgroundColor: '#FF5722',
  },
  reloadButton: {
    backgroundColor: '#4CAF50',
  },
  debugSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    elevation: 3,
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  debugControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logCount: {
    fontSize: 14,
    color: '#666',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  clearLogsButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  clearLogsText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  logContainer: {
    maxHeight: 300,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    padding: 10,
  },
  logEntry: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  logTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  logMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  noLogs: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});

export default App; 