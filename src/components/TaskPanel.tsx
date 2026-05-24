import React, { useEffect, useState } from 'react';
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
import { useTaskStore } from '../stores/task-store';
import type { Task } from '../types';

const PRIORITY_COLORS: Record<string, string> = {
  high: theme.colors.error,
  medium: theme.colors.warning,
  low: theme.colors.info,
};

const STATUS_LABELS: Record<string, string> = {
  pending: '待处理',
  in_progress: '进行中',
  done: '已完成',
};

export default function TaskPanel() {
  const { tasks, filter, loading, setFilter, fetchTasks, addTask, updateTask, removeTask } =
    useTaskStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    status: 'pending' as Task['status'],
    estimated_minutes: '',
    due_date: '',
  });

  useEffect(() => { fetchTasks(); }, []);

  const openForm = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setForm({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        estimated_minutes: String(task.estimated_minutes || ''),
        due_date: task.due_date?.slice(0, 10) || '',
      });
    } else {
      setEditingTask(null);
      setForm({ title: '', description: '', priority: 'medium', status: 'pending', estimated_minutes: '', due_date: '' });
    }
    setModalVisible(true);
  };

  const handleSubmit = () => {
    const data = {
      title: form.title,
      description: form.description || null,
      priority: form.priority,
      status: form.status,
      estimated_minutes: form.estimated_minutes ? Number(form.estimated_minutes) : null,
      due_date: form.due_date || null,
      actual_minutes: null,
      time_block_id: null,
    };

    if (editingTask) {
      updateTask(editingTask.id, data);
    } else {
      addTask(data);
    }
    setModalVisible(false);
  };

  const getFilterLabel = () => {
    const parts: string[] = [];
    if (filter.status) parts.push(STATUS_LABELS[filter.status] || filter.status);
    if (filter.priority) parts.push(filter.priority === 'high' ? '高优先' : filter.priority === 'medium' ? '中优先' : '低优先');
    return parts.length ? parts.join(' · ') : '全部';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{getFilterLabel()}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => {
              const statuses = ['', 'pending', 'in_progress', 'done'];
              const priorities = ['', 'high', 'medium', 'low'];
              // Cycle through filters
              if (!filter.status && !filter.priority) setFilter({ status: 'pending' });
              else if (filter.status === 'pending') setFilter({ status: 'in_progress' });
              else if (filter.status === 'in_progress') setFilter({ status: 'done' });
              else if (filter.status === 'done' && !filter.priority) setFilter({ priority: 'high' });
              else if (filter.priority === 'high') setFilter({ priority: 'medium' });
              else if (filter.priority === 'medium') setFilter({ priority: 'low' });
              else setFilter({});
            }}
          >
            <Ionicons name="filter" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => openForm()}>
            <Ionicons name="add" size={22} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {tasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskCard}
              onPress={() => openForm(task)}
              onLongPress={() => removeTask(task.id)}
            >
              <View style={styles.taskLeft}>
                <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
                <View style={styles.taskInfo}>
                  <Text
                    style={[
                      styles.taskTitle,
                      task.status === 'done' && styles.taskDone,
                    ]}
                    numberOfLines={1}
                  >
                    {task.title}
                  </Text>
                  {task.description ? (
                    <Text style={styles.taskDesc} numberOfLines={1}>
                      {task.description}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.taskRight}>
                <View style={[styles.statusBadge, { backgroundColor: task.status === 'done' ? theme.colors.successBg : task.status === 'in_progress' ? theme.colors.infoBg : theme.colors.warningBg }]}>
                  <Text style={[styles.statusText, { color: task.status === 'done' ? theme.colors.success : task.status === 'in_progress' ? theme.colors.info : theme.colors.warning }]}>
                    {STATUS_LABELS[task.status]}
                  </Text>
                </View>
                {task.estimated_minutes ? (
                  <Text style={styles.estTime}>{task.estimated_minutes}min</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
          {!tasks.length && !loading && (
            <Text style={styles.emptyText}>暂无任务</Text>
          )}
        </ScrollView>
      )}

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingTask ? '编辑任务' : '新建任务'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="任务标题"
              placeholderTextColor={theme.colors.textMuted}
              value={form.title}
              onChangeText={(t) => setForm((f) => ({ ...f, title: t }))}
            />

            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="描述（可选）"
              placeholderTextColor={theme.colors.textMuted}
              value={form.description}
              onChangeText={(t) => setForm((f) => ({ ...f, description: t }))}
              multiline
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>优先级</Text>
                <View style={styles.chipRow}>
                  {(['high', 'medium', 'low'] as const).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.chip, form.priority === p && { backgroundColor: PRIORITY_COLORS[p], borderColor: PRIORITY_COLORS[p] }]}
                      onPress={() => setForm((f) => ({ ...f, priority: p }))}
                    >
                      <Text style={[styles.chipText, form.priority === p && { color: '#fff' }]}>
                        {p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>预估(min)</Text>
                <TextInput
                  style={styles.timeInput}
                  keyboardType="number-pad"
                  value={form.estimated_minutes}
                  onChangeText={(t) => setForm((f) => ({ ...f, estimated_minutes: t }))}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>取消</Text>
              </TouchableOpacity>
              {editingTask && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => { removeTask(editingTask.id); setModalVisible(false); }}
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
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: { color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: '600' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  filterBtn: { padding: 4 },
  addBtn: { padding: 4 },
  list: { flex: 1, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm },
  taskCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  taskLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  taskInfo: { flex: 1 },
  taskTitle: { color: theme.colors.text, fontSize: theme.fontSize.md, fontWeight: '500' },
  taskDone: { textDecorationLine: 'line-through', color: theme.colors.textMuted },
  taskDesc: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginTop: 2 },
  taskRight: { alignItems: 'flex-end', gap: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.radius.sm },
  statusText: { fontSize: theme.fontSize.xs, fontWeight: '600' },
  estTime: { color: theme.colors.textMuted, fontSize: theme.fontSize.xs },
  emptyText: { color: theme.colors.textMuted, textAlign: 'center', marginTop: 60, fontSize: theme.fontSize.md },
  modalOverlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' },
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
  multilineInput: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12, marginBottom: theme.spacing.md },
  halfInput: { flex: 1 },
  label: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, marginBottom: 6 },
  chipRow: { flexDirection: 'row', gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
  timeInput: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.radius.sm,
    padding: 10,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    width: 70,
  },
  modalActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceVariant },
  cancelBtnText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.md },
  deleteBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: theme.radius.md, backgroundColor: theme.colors.errorBg },
  deleteBtnText: { color: theme.colors.error, fontSize: theme.fontSize.md },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: theme.radius.md, backgroundColor: theme.colors.primary },
  saveBtnText: { color: '#fff', fontSize: theme.fontSize.md, fontWeight: '600' },
});