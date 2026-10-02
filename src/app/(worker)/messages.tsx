import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { Avatar } from '@/components';

interface WorkerChat {
  id: string;
  clientName: string;
  purok: string;
  lastMessage: string;
  time: string;
  unread?: boolean;
}

const WORKER_CHATS: WorkerChat[] = [
  {
    id: 'wc-1',
    clientName: 'Juan Dela Cruz',
    purok: 'Purok 2',
    lastMessage: 'Salamat Reynaldo! When can you come inspect the breaker?',
    time: '11:20 AM',
    unread: true,
  },
  {
    id: 'wc-2',
    clientName: 'Maria Santos',
    purok: 'Purok 1',
    lastMessage: 'The new 3-gang switch is bought already. See you at 2 PM.',
    time: '9:45 AM',
    unread: false,
  },
  {
    id: 'wc-3',
    clientName: 'Barangay Tinago LGU',
    purok: 'Community Desk',
    lastMessage: 'Clearance renewed for Q4 2026. Keep up the good work.',
    time: 'Yesterday',
    unread: false,
  },
];

export default function WorkerMessagesScreen() {
  const [activeTab, setActiveTab] = useState<'clients' | 'desk'>('clients');

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Messages</Text>

        <View style={styles.pillRow}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'clients' }}
            onPress={() => setActiveTab('clients')}
            style={[
              styles.pillButton,
              activeTab === 'clients' ? styles.pillButtonActive : styles.pillButtonInactive,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                activeTab === 'clients' ? styles.pillTextActive : styles.pillTextInactive,
              ]}
            >
              Clients
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'desk' }}
            onPress={() => setActiveTab('desk')}
            style={[
              styles.pillButton,
              activeTab === 'desk' ? styles.pillButtonActive : styles.pillButtonInactive,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                activeTab === 'desk' ? styles.pillTextActive : styles.pillTextInactive,
              ]}
            >
              Barangay Desk
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {WORKER_CHATS.map((chat) => (
          <Pressable
            key={chat.id}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.chatRow,
              pressed && styles.chatRowPressed,
            ]}
          >
            <Avatar name={chat.clientName} size="lg" style={styles.avatarSpacing} />

            <View style={styles.chatInfo}>
              <View style={styles.chatNameRow}>
                <Text style={styles.chatName} numberOfLines={1}>
                  {chat.clientName} <Text style={styles.chatPurok}>• {chat.purok}</Text>
                </Text>
                <Text style={[styles.chatDate, chat.unread && styles.chatDateUnread]}>
                  {chat.time}
                </Text>
              </View>

              <View style={styles.messageBottomRow}>
                <Text
                  style={[styles.lastMessage, chat.unread && styles.lastMessageUnread]}
                  numberOfLines={1}
                >
                  {chat.lastMessage}
                </Text>
                {chat.unread && <View style={styles.unreadDot} />}
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  screenTitle: {
    fontSize: Typography.sizes.display,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  pillRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  pillButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillButtonActive: {
    backgroundColor: Colors.textPrimary,
  },
  pillButtonInactive: {
    backgroundColor: Colors.surfaceSecondary,
  },
  pillText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  pillTextActive: {
    color: Colors.textInverse,
  },
  pillTextInactive: {
    color: Colors.textPrimary,
  },
  scrollList: {
    paddingTop: Spacing.xs,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  chatRowPressed: {
    backgroundColor: Colors.surfaceSecondary,
  },
  avatarSpacing: {
    marginRight: Spacing.md,
  },
  chatInfo: {
    flex: 1,
  },
  chatNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    flex: 1,
    paddingRight: Spacing.xs,
  },
  chatPurok: {
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
  },
  chatDate: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textTertiary,
  },
  chatDateUnread: {
    color: Colors.accent,
    fontWeight: Typography.weights.semibold,
  },
  messageBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    flex: 1,
    paddingRight: Spacing.sm,
    lineHeight: 18,
  },
  lastMessageUnread: {
    color: Colors.textPrimary,
    fontWeight: Typography.weights.semibold,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
});
