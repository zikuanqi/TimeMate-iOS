import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  AppState,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { DarkTheme as theme } from '../theme';
import { useTimerStore } from '../stores/timer-store';

const POMODORO_OPTIONS = [15, 25, 30, 45, 60];

export default function FocusSessionPanel() {
  const {
    isRunning,
    duration,
    remaining,
    interruptions,
    sessions,
    loading,
    setDuration,
    start,
    pause,
    resume,
    end,
    interrupt,
    tick,
    fetchSessions,
  } = useTimerStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    fetchSessions();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Tick every second when running
  useEffect(() => {
    if (isRunning && !intervalRef.current) {
      intervalRef.current = setInterval(tick, 1000);
    } else if (!isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isRunning, tick]);

  // Handle app background -> foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && appStateRef.current.match(/inactive|background/)) {
        // App came back to foreground - nothing to do, timer keeps running
      }
      appStateRef.current = state;
    });
    return () => sub.remove();
  }, []);

  const totalSeconds = duration * 60;
  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const radius = 90;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - progress);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const todayMinutes = sessions
    .filter((s) => s.ended_at)
    .reduce((sum, s) => sum + (s.actual_minutes || 0), 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Timer Circle */}
      <View style={styles.timerContainer}>
        <Svg width={200} height={200} style={styles.svg}>
          {/* Background circle */}
          <Circle
            cx={100}
            cy={100}
            r={radius}
            stroke={theme.colors.surfaceVariant}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <Circle
            cx={100}
            cy={100}
            r={radius}
            stroke={theme.colors.primary}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
          />
        </Svg>
        <View style={styles.timerCenter}>
          <Text style={styles.timerText}>{formatTime(remaining)}</Text>
          <Text style={styles.timerSubtext}>
            {isRunning ? '专注中...' : '就绪'}
          </Text>
          {interruptions > 0 && (
            <Text style={styles.interruptBadge}>中断 {interruptions} 次</Text>
          )}
        </View>
      </View>

      {/* Duration selector */}
      {!isRunning && (
        <View style={styles.durationRow}>
          {POMODORO_OPTIONS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.durationChip,
                duration === m && styles.durationChipActive,
              ]}
              onPress={() => setDuration(m)}
            >
              <Text
                style={[
                  styles.durationChipText,
                  duration === m && styles.durationChipTextActive,
                ]}
              >
                {m}min
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {!isRunning ? (
          <TouchableOpacity style={styles.startBtn} onPress={start}>
            <Ionicons name="play" size={24} color="#fff" />
            <Text style={styles.startBtnText}>开始专注</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.runningControls}>
            <TouchableOpacity style={styles.pauseBtn} onPress={pause}>
              <Ionicons name="pause" size={22} color={theme.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.stopBtn} onPress={end}>
              <Ionicons name="stop" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.interruptBtn} onPress={interrupt}>
              <Ionicons name="alert-circle-outline" size={22} color={theme.colors.warning} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Today stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="timer-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.statValue}>{todayMinutes}</Text>
          <Text style={styles.statLabel}>今日(min)</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.success} />
          <Text style={styles.statValue}>
            {sessions.filter((s) => s.ended_at).length}
          </Text>
          <Text style={styles.statLabel}>完成次数</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="flame-outline" size={20} color={theme.colors.warning} />
          <Text style={styles.statValue}>
            {sessions.reduce((sum, s) => sum + (s.interruption_count || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>中断次数</Text>
        </View>
      </View>

      {/* Recent sessions */}
      <Text style={styles.sectionTitle}>最近记录</Text>
      {sessions.slice(0, 5).map((session) => (
        <View key={session.id} style={styles.sessionRow}>
          <View style={styles.sessionLeft}>
            <View
              style={[
                styles.sessionDot,
                {
                  backgroundColor: session.interrupted
                    ? theme.colors.error
                    : theme.colors.success,
                },
              ]}
            />
            <Text style={styles.sessionTime}>
              {new Date(session.started_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <Text style={styles.sessionDuration}>
            {session.actual_minutes || session.duration_minutes} min
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: theme.spacing.lg, paddingBottom: 40 },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  svg: { position: 'absolute' },
  timerCenter: { alignItems: 'center' },
  timerText: { color: theme.colors.text, fontSize: 48, fontWeight: '700' },
  timerSubtext: { color: theme.colors.textSecondary, fontSize: theme.fontSize.md, marginTop: 4 },
  interruptBadge: {
    color: theme.colors.warning,
    fontSize: theme.fontSize.sm,
    marginTop: 6,
    backgroundColor: theme.colors.warningBg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  durationRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 },
  durationChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  durationChipActive: { backgroundColor: theme.colors.primaryBg, borderColor: theme.colors.primary },
  durationChipText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
  durationChipTextActive: { color: theme.colors.primary, fontWeight: '600' },
  controls: { alignItems: 'center', marginBottom: 28 },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: theme.radius.full,
  },
  startBtnText: { color: '#fff', fontSize: theme.fontSize.lg, fontWeight: '600' },
  runningControls: { flexDirection: 'row', gap: 16 },
  pauseBtn: {
    padding: 14,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceVariant,
  },
  stopBtn: {
    padding: 14,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.error,
  },
  interruptBtn: {
    padding: 14,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.warningBg,
  },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: '700' },
  statLabel: { color: theme.colors.textMuted, fontSize: theme.fontSize.xs },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    marginBottom: 6,
  },
  sessionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sessionDot: { width: 10, height: 10, borderRadius: 5 },
  sessionTime: { color: theme.colors.text, fontSize: theme.fontSize.md },
  sessionDuration: { color: theme.colors.textSecondary, fontSize: theme.fontSize.md },
});