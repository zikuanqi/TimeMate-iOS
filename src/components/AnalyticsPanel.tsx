import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DarkTheme as theme } from '../theme';
import * as api from '../api/analytics';
import type { AnalyticsOverview, DailyFocus, TaskDistribution, PeakProductivity } from '../types';

export default function AnalyticsPanel() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [dailyFocus, setDailyFocus] = useState<DailyFocus[]>([]);
  const [taskDist, setTaskDist] = useState<TaskDistribution[]>([]);
  const [peakProd, setPeakProd] = useState<PeakProductivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ov, df, td, pp] = await Promise.all([
          api.getOverview(),
          api.getDailyFocus(7),
          api.getTaskDistribution(),
          api.getPeakProductivity(),
        ]);
        setOverview(ov);
        setDailyFocus(df);
        setTaskDist(td);
        setPeakProd(pp);
      } catch (e) {
        // Silently fail - show empty state
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  const dfMax = dailyFocus.length ? Math.max(...dailyFocus.map((d) => d.focus_minutes), 1) : 1;
  const statusLabel: Record<string, string> = { pending: '待处理', in_progress: '进行中', done: '已完成' };
  const maxPeak = peakProd.length ? Math.max(...peakProd.map((p) => p.total_minutes), 1) : 1;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Overview Cards */}
      {overview && (
        <View style={styles.overviewGrid}>
          <View style={styles.overviewCard}>
            <Ionicons name="timer-outline" size={22} color={theme.colors.primary} />
            <Text style={styles.ovValue}>{overview.total_focus_minutes}</Text>
            <Text style={styles.ovLabel}>总专注(min)</Text>
          </View>
          <View style={styles.overviewCard}>
            <Ionicons name="checkmark-circle-outline" size={22} color={theme.colors.success} />
            <Text style={styles.ovValue}>{overview.total_sessions}</Text>
            <Text style={styles.ovLabel}>总次数</Text>
          </View>
          <View style={styles.overviewCard}>
            <Ionicons name="trending-up-outline" size={22} color={theme.colors.info} />
            <Text style={styles.ovValue}>{Math.round(overview.completion_rate * 100)}%</Text>
            <Text style={styles.ovLabel}>完成率</Text>
          </View>
          <View style={styles.overviewCard}>
            <Ionicons name="alert-circle-outline" size={22} color={theme.colors.warning} />
            <Text style={styles.ovValue}>{Math.round(overview.interruption_rate * 100)}%</Text>
            <Text style={styles.ovLabel}>中断率</Text>
          </View>
        </View>
      )}

      {/* Daily Focus Bar Chart */}
      {dailyFocus.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>每日专注时长</Text>
          <View style={styles.barChart}>
            {dailyFocus.map((day) => (
              <View key={day.date} style={styles.barCol}>
                <Text style={styles.barValue}>{day.focus_minutes}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${Math.max((day.focus_minutes / dfMax) * 100, 3)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>
                  {day.date.slice(5).replace('-', '/')}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Task Distribution */}
      {taskDist.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>任务分布</Text>
          <View style={styles.taskDist}>
            {taskDist.map((td) => {
              const total = taskDist.reduce((s, t) => s + t.count, 0) || 1;
              const pct = Math.round((td.count / total) * 100);
              return (
                <View key={td.status} style={styles.distRow}>
                  <View style={styles.distHeader}>
                    <Text style={styles.distLabel}>
                      {statusLabel[td.status] || td.status}
                    </Text>
                    <Text style={styles.distCount}>{td.count} ({pct}%)</Text>
                  </View>
                  <View style={styles.distBar}>
                    <View
                      style={[
                        styles.distFill,
                        {
                          width: `${pct}%`,
                          backgroundColor:
                            td.status === 'done'
                              ? theme.colors.success
                              : td.status === 'in_progress'
                              ? theme.colors.info
                              : theme.colors.warning,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Peak Productivity Heatmap-like chart */}
      {peakProd.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>高效时段</Text>
          <View style={styles.peakChart}>
            {peakProd.map((p) => (
              <View key={p.hour} style={styles.peakRow}>
                <Text style={styles.peakHour}>
                  {String(p.hour).padStart(2, '0')}:00
                </Text>
                <View style={styles.peakBarTrack}>
                  <View
                    style={[
                      styles.peakBarFill,
                      {
                        width: `${Math.max((p.total_minutes / maxPeak) * 100, 2)}%`,
                        backgroundColor:
                          p.total_minutes / maxPeak > 0.7
                            ? theme.colors.primary
                            : p.total_minutes / maxPeak > 0.4
                            ? theme.colors.info
                            : theme.colors.surfaceVariant,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.peakMins}>{p.total_minutes}min</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: 40 },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  overviewCard: {
    width: '47%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    gap: 6,
  },
  ovValue: { color: theme.colors.text, fontSize: theme.fontSize.xxl, fontWeight: '700' },
  ovLabel: { color: theme.colors.textMuted, fontSize: theme.fontSize.xs },
  section: { marginBottom: 24 },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 8,
    height: 180,
  },
  barCol: { alignItems: 'center', flex: 1 },
  barValue: { color: theme.colors.textMuted, fontSize: 9, marginBottom: 4 },
  barTrack: { width: 18, flex: 1, justifyContent: 'flex-end' },
  barFill: {
    width: 18,
    backgroundColor: theme.colors.primary,
    borderRadius: 6,
    minHeight: 3,
  },
  barLabel: { color: theme.colors.textMuted, fontSize: 8, marginTop: 6 },
  taskDist: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing.md },
  distRow: { marginBottom: 12 },
  distHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  distLabel: { color: theme.colors.text, fontSize: theme.fontSize.sm },
  distCount: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
  distBar: { height: 8, backgroundColor: theme.colors.surfaceVariant, borderRadius: 4 },
  distFill: { height: 8, borderRadius: 4 },
  peakChart: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing.md },
  peakRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  peakHour: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, width: 36 },
  peakBarTrack: { flex: 1, height: 8, backgroundColor: theme.colors.surfaceVariant, borderRadius: 4, marginHorizontal: 10 },
  peakBarFill: { height: 8, borderRadius: 4 },
  peakMins: { color: theme.colors.textMuted, fontSize: theme.fontSize.xs, width: 40, textAlign: 'right' },
});