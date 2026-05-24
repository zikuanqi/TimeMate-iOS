import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DarkTheme as theme } from '../theme';
import { useAIChatStore } from '../stores/ai-chat-store';

export default function ChatPanel() {
  const {
    sessions,
    activeSessionId,
    messages,
    loading,
    fetchSessions,
    createSession,
    deleteSession,
    setActiveSession,
    sendMessage,
  } = useAIChatStore();

  const [input, setInput] = useState('');
  const [showSessions, setShowSessions] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => { fetchSessions(); }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg) return;
    setInput('');

    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = await createSession(msg.slice(0, 20));
      setActiveSession(sessionId);
    }
    await sendMessage(msg);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowSessions(!showSessions)}>
          <Ionicons name="menu" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {activeSessionId
            ? sessions.find((s) => s.id === activeSessionId)?.title || 'AI 对话'
            : 'AI 对话'}
        </Text>
        <TouchableOpacity
          onPress={async () => {
            const id = await createSession('新对话');
            setActiveSession(id);
          }}
        >
          <Ionicons name="add-circle-outline" size={22} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Sessions Sidebar */}
      {showSessions && (
        <View style={styles.sessionsPanel}>
          <Text style={styles.sessionsTitle}>历史对话</Text>
          {sessions.map((session) => (
            <TouchableOpacity
              key={session.id}
              style={[
                styles.sessionItem,
                activeSessionId === session.id && styles.sessionItemActive,
              ]}
              onPress={() => {
                setActiveSession(session.id);
                setShowSessions(false);
              }}
              onLongPress={() => deleteSession(session.id)}
            >
              <Text
                style={[
                  styles.sessionItemText,
                  activeSessionId === session.id && styles.sessionItemTextActive,
                ]}
                numberOfLines={1}
              >
                {session.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        showsVerticalScrollIndicator={false}
      >
        {!activeSessionId && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.textMuted} />
            <Text style={styles.emptyTitle}>AI 时间管理助手</Text>
            <Text style={styles.emptySubtitle}>
              你可以问我：帮我规划今天的时间、创建一个任务、或者任何时间管理相关的问题
            </Text>
          </View>
        )}

        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                msg.role === 'user' ? styles.userMessageText : styles.assistantMessageText,
              ]}
            >
              {msg.content}
            </Text>
          </View>
        ))}

        {loading && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="输入消息..."
          placeholderTextColor={theme.colors.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim()}
        >
          <Ionicons
            name="send"
            size={18}
            color={input.trim() ? '#fff' : theme.colors.textMuted}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  sessionsPanel: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    padding: theme.spacing.md,
    maxHeight: 200,
  },
  sessionsTitle: { color: theme.colors.textMuted, fontSize: theme.fontSize.xs, marginBottom: 8, paddingLeft: 4 },
  sessionItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: theme.radius.sm,
    marginBottom: 2,
  },
  sessionItemActive: { backgroundColor: theme.colors.primaryBg },
  sessionItemText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
  sessionItemTextActive: { color: theme.colors.primary, fontWeight: '600' },
  messageList: { flex: 1 },
  messageListContent: { padding: theme.spacing.lg, paddingBottom: 8 },
  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyTitle: { color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: '600', marginTop: 16 },
  emptySubtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 4,
  },
  messageText: { fontSize: theme.fontSize.md, lineHeight: 22 },
  userMessageText: { color: '#fff' },
  assistantMessageText: { color: theme.colors.text },
  typingIndicator: { alignSelf: 'flex-start', padding: 8 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: theme.colors.surfaceVariant },
});