import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { Avatar } from '@/components';

interface ChatItem {
  id: string;
  name: string;
  specialty: string;
  lastMessage: string;
  date: string;
  unread?: boolean;
  isVerified?: boolean;
}

const CHAT_LIST: ChatItem[] = [
  {
    id: '1',
    name: 'Danilo Orais',
    specialty: 'Plumber',
    lastMessage: 'I am walking towards Purok 2 now with the PVC pipes.',
    date: '10:15 AM',
    unread: true,
    isVerified: true,
  },
  {
    id: '2',
    name: 'Reynaldo Cruz',
    specialty: 'Electrician',
    lastMessage: 'Job marked completed. Thank you for rating!',
    date: 'Sep 25',
    unread: false,
    isVerified: true,
  },
  {
    id: '3',
    name: 'Barangay Tinago Helpdesk',
    specialty: 'Community Center',
    lastMessage: 'Your electrical assistance ticket has been reviewed.',
    date: 'Sep 20',
    unread: false,
    isVerified: false,
  },
];

export default function SeekerMessagesScreen() {
  const [activeTab, setActiveTab] = useState<'chats' | 'notifications'>('chats');

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Messages</Text>

        <View style={styles.pillRow}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'chats' }}
            onPress={() => setActiveTab('chats')}
            style={[
              styles.pillButton,
              activeTab === 'chats' ? styles.pillButtonActive : styles.pillButtonInactive,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                activeTab === 'chats' ? styles.pillTextActive : styles.pillTextInactive,
              ]}
            >
              Chats
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'notifications' }}
            onPress={() => setActiveTab('notifications')}
            style={[
              styles.pillButton,
              activeTab === 'notifications' ? styles.pillButtonActive : styles.pillButtonInactive,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                activeTab === 'notifications' ? styles.pillTextActive : styles.pillTextInactive,
              ]}
            >
              Notifications
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {activeTab === 'chats' ? (
          CHAT_LIST.map((chat) => (
            <Pressable
              key={chat.id}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.chatRow,
                pressed && styles.chatRowPressed,
              ]}
            >
              <Avatar
                name={chat.name}
                size="lg"
                isVerified={chat.isVerified}
                style={styles.avatarSpacing}
              />

              <View style={styles.chatInfo}>
                <View style={styles.chatNameRow}>
                  <Text style={styles.chatName} numberOfLines={1}>
                    {chat.name} <Text style={styles.chatSpecialty}>• {chat.specialty}</Text>
                  </Text>
                  <Text style={[styles.chatDate, chat.unread && styles.chatDateUnread]}>
                    {chat.date}
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
          ))
        ) : (
          <View style={styles.notificationsContainer}>
            <View style={styles.notificationItem}>
              <View style={styles.notifIconBox}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              </View>
              <View style={styles.notifInfo}>
                <Text style={styles.notifTitle}>Worker Assigned</Text>
                <Text style={styles.notifBody}>
                  Danilo Orais accepted your plumbing request in Purok 2.
                </Text>
                <Text style={styles.notifTime}>30 mins ago</Text>
              </View>
            </View>
          </View>
        )}
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
  chatSpecialty: {
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
  notificationsContainer: {
    padding: Spacing.lg,
  },
  notificationItem: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notifIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifInfo: {
    flex: 1,
  },
  notifTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  notifBody: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  notifTime: {
    fontSize: Typography.sizes.xxs,
    color: Colors.textTertiary,
    marginTop: 4,
  },
});
