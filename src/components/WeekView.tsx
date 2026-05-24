import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DarkTheme as theme } from '../theme';
import { useTimeBlockStore } from '../stores/time-block-store';
import type { TimeBlock } from '../types';

const HOUR_HEIGHT = 54;
const START_HOUR = 6;
const END_HOUR = 23;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

const COLORS: Record<string, string> = {
  work: theme.colors.primary,
  personal: theme.colors.success,
  health: theme.colors.warning,
  study: theme.colors.info,
  default: theme.colors.primary,
};

export default function WeekView() {
  const {
    blocks,
    selectedDate,
    loading,
    setSelectedDate,
    fetchBlocks,
    addBlock,
    updateBlock,
    removeBlock,
  } = useTimeBlockStore();

  const [modalVisible, setModalVisible] = React.useState(false);
  const [editingBlock, setEditingBlock] = React.useState<TimeBlock | null>(null);
  const [form, setForm] = React.useState({
    title: '',
    block_type: 'work',
    start_hour: 9,
    start_min: 0,
    end_hour: 10,
    end_min: 0,
    color: 'work',
    notes: '',
  });

  useEffect(() => {
    fetchBlocks(selectedDate);
  }, []);

  const getBlocksForHour = (hour: number) =>
    blocks.filter((b) => {
      const sh = new Date(b.start_time).getHours();
      return sh === hour;
    });

  const openForm = (block?: TimeBlock) => {
    if (block) {
      const s = new Date(block.start_time);
      const e = new Date(block.end_time);
      setEditingBlock(block);
      setForm({
        title: block.title,
        block_type: block.block_type,
        start_hour: s.getHours(),
        start_min: s.getMinutes(),
        end_hour: e.getHours(),
        end_min: e.getMinutes(),
        color: block.color || 'work',
        notes: block.notes || '',
      });
    } else {
      setEditingBlock(null);
      setForm({
        title: '',
        block_type: 'work',
        start_hour: 9,
        start_min: 0,
        end_hour: 10,
        end_min: 0,
        color: 'work',
        notes: '',
      });
    }
    setModalVisible(true);
  };

  const handleSubmit = () => {
    const date = selectedDate;
    const start = `${date}T${String(form.start_hour).padStart(2, '0')}:${String(form.start_min).padStart(2, '0')}:00`;
    const end = `${date}T${String(form.end_hour).padStart(2, '0')}:${String(form.end_min).padStart(2, '0')}:00`;

    if (editingBlock) {
      updateBlock(editingBlock.id, { title: form.title, block_type: form.block_type, start_time: start, end_time: end, color: form.color, notes: form.notes });
    } else {
      addBlock({ title: form.title, block_type: form.block_type, start_time: start, end_time: end, color: form.color, notes: form.notes });
    }
    setModalVisible(false);
  };

  const shiftDate = useCallback((days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().slice(0, 10));
  }, [selectedDate, setSelectedDate]);

  const dateLabel = (() => {
    const d = new Date(selectedDate);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
  })();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => shiftDate(-1)}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{dateLabel}</Text>
        <TouchableOpacity onPress={() => shiftDate(1)}>
          <Ionicons name="chevron-forward" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.addBtn} onPress={() => openForm()}>
          <Ionicons name="add" size={22} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.timeline} showsVerticalScrollIndicator={false}>
          {HOURS.map((hour) => {
            const hourBlocks = getBlocksForHour(hour);
            return (
              <View key={hour} style={styles.hourRow}>
                <Text style={styles.hourLabel}>{String(hour).padStart(2, '0')}:00</Text>
                <View style={styles.hourContent}>
                  {hourBlocks.map((block) => (
                    <TouchableOpacity
                      key={block.id}
                      style={[
                        styles.block,
                        { backgroundColor: COLORS[block.color] || COLORS.default },
                      ]}
                      onPress={() => openForm(block)}
                      onLongPress={() => removeBlock(block.id)}
                    >
                      <Text style={styles.blockTitle} numberOfLines={1}>
                        {block.title}
                      </Text>
                      <Text style={styles.blockTime}>
                        {new Date(block.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(block.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingBlock ? '编辑时间块' : '新建时间块'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="标题"
              placeholderTextColor={theme.colors.textMuted}
              value={form.title}
              onChangeText={(t) => setForm((f) => ({ ...f, title: t }))}
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>开始</Text>
                <View style={styles.timeRow}>
                  <TextInput
                    style={styles.timeInput}
                    keyboardType="number-pad"
                    value={String(form.start_hour)}
                    onChangeText={(t) => setForm((f) => ({ ...f, start_hour: Number(t) || 0 }))}
                  />
                  <Text style={styles.timeSep}>:</Text>
                  <TextInput
                    style={styles.timeInput}
                    keyboardType="number-pad"
                    value={String(form.start_min).padStart(2, '0')}
                    onChangeText={(t) => setForm((f) => ({ ...f, start_min: Number(t) || 0 }))}
                  />
                </View>
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>结束</Text>
                <View style={styles.timeRow}>
                  <TextInput
                    style={styles.timeInput}
                    keyboardType="number-pad"
                    value={String(form.end_hour)}
                    onChangeText={(t) => setForm((f) => ({ ...f, end_hour: Number(t) || 0 }))}
                  />
                  <Text style={styles.timeSep}>:</Text>
                  <TextInput
                    style={styles.timeInput}
                    keyboardType="number-pad"
                    value={String(form.end_min).padStart(2, '0')}
                    onChangeText={(t) => setForm((f) => ({ ...f, end_min: Number(t) || 0 }))}
                  />
                </View>
              </View>
            </View>

            <View style={styles.typeRow}>
              {['work', 'personal', 'health', 'study'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeChip,
                    form.block_type === t && { backgroundColor: COLORS[t], borderColor: COLORS[t] },
                  ]}
                  onPress={() => setForm((f) => ({ ...f, block_type: t, color: t }))}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      form.block_type === t && { color: '#fff' },
                    ]}
                  >
                    {t === 'work' ? '工作' : t === 'personal' ? '个人' : t === 'health' ? '健康' : '学习'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>取消</Text>
              </TouchableOpacity>
              {editingBlock && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => { removeBlock(editingBlock.id); setModalVisible(false); }}
                >
                  <Text style={styles.deleteBtnText}>删除</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
                <Text style={styles.saveBtnText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
  },
  addBtn: { padding: 4 },
  timeline: { flex: 1, paddingHorizontal: theme.spacing.sm },
  hourRow: {
    flexDirection: 'row',
    minHeight: HOUR_HEIGHT,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  hourLabel: {
    width: 42,
    paddingTop: 2,
    textAlign: 'right',
    paddingRight: 8,
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
  },
  hourContent: { flex: 1, paddingVertical: 2 },
  block: {
    borderRadius: theme.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 3,
  },
  blockTitle: { color: '#fff', fontSize: theme.fontSize.sm, fontWeight: '600' },
  blockTime: { color: 'rgba(255,255,255,0.7)', fontSize: theme.fontSize.xs, marginTop: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing.xxl,
    paddingBottom: 40,
  },
  modalTitle: { color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: '700', marginBottom: theme.spacing.lg },
  input: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    marginBottom: theme.spacing.md,
  },
  row: { flexDirection: 'row', gap: 12, marginBottom: theme.spacing.md },
  halfInput: { flex: 1 },
  label: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, marginBottom: 6 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeInput: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.radius.sm,
    padding: 8,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    textAlign: 'center',
    width: 44,
  },
  timeSep: { color: theme.colors.textSecondary, fontSize: theme.fontSize.lg },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: theme.spacing.lg },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  typeChipText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
  modalActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceVariant,
  },
  cancelBtnText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.md },
  deleteBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.errorBg,
  },
  deleteBtnText: { color: theme.colors.error, fontSize: theme.fontSize.md },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
  },
  saveBtnText: { color: '#fff', fontSize: theme.fontSize.md, fontWeight: '600' },
});